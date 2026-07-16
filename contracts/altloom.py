# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


ALLOWED_KINDS = ["PHOTO", "ILLUSTRATION", "DIAGRAM", "OTHER"]
BLOCKED_TERMS = [
    "i cannot",
    "as an ai",
    "image of",
    "picture of",
    "probably",
    "appears to be feeling",
]


def _normalize_kind(value: str) -> str:
    kind = str(value).strip().upper()
    if kind not in ALLOWED_KINDS:
        raise gl.vm.UserError("[LLM_ERROR] invalid image kind")
    return kind


def _clean_text(value: str, min_len: int, max_len: int, field: str) -> str:
    text = str(value).strip().replace("\n", " ")
    if not min_len <= len(text) <= max_len:
        raise gl.vm.UserError("[LLM_ERROR] " + field + " length outside allowed range")
    if "|" in text:
        raise gl.vm.UserError("[LLM_ERROR] unsupported pipe character")
    lowered = text.lower()
    for term in BLOCKED_TERMS:
        if term in lowered:
            raise gl.vm.UserError("[LLM_ERROR] blocked accessibility phrase")
    return text


def _parse_result(candidate) -> dict:
    if not isinstance(candidate, dict):
        raise gl.vm.UserError("[LLM_ERROR] expected JSON object")

    return {
        "kind": _normalize_kind(candidate.get("kind", "")),
        "alt_text": _clean_text(candidate.get("alt_text", ""), 20, 180, "alt_text"),
        "long_description": _clean_text(candidate.get("long_description", ""), 50, 500, "long_description"),
    }


def _content_words(text: str) -> set:
    words = set()
    for raw in text.lower().replace(",", " ").replace(".", " ").replace(";", " ").split():
        word = raw.strip("()[]{}:!?\"'")
        if len(word) > 4:
            words.add(word)
    return words


def _similar_enough(a: str, b: str) -> bool:
    left = _content_words(a)
    right = _content_words(b)
    if len(left) == 0 or len(right) == 0:
        return True
    shared = len(left.intersection(right))
    smaller = len(left) if len(left) < len(right) else len(right)
    return shared * 100 >= smaller * 25


class Altloom(gl.Contract):
    image_url: str
    alt_text: str
    long_description: str
    image_kind: str
    description_count: u32
    submitter: Address

    def __init__(self):
        self.image_url = ""
        self.alt_text = ""
        self.long_description = ""
        self.image_kind = ""
        self.description_count = u32(0)
        self.submitter = Address("0x0000000000000000000000000000000000000000")

    @gl.public.view
    def get_latest(self) -> str:
        return (
            self.image_url
            + "|"
            + self.image_kind
            + "|"
            + self.alt_text
            + "|"
            + self.long_description
        )

    @gl.public.view
    def get_count(self) -> int:
        return int(self.description_count)

    @gl.public.write
    def describe_image(self, image_url: str, context: str):
        clean_url = image_url.strip()
        clean_context = context.strip()

        if not clean_url.startswith("https://"):
            raise gl.vm.UserError("Image URL must use HTTPS")
        if len(clean_url) > 500:
            raise gl.vm.UserError("Image URL is too long")
        if len(clean_context) > 180:
            raise gl.vm.UserError("Context must be 180 characters or fewer")
        if "|" in clean_url or "|" in clean_context:
            raise gl.vm.UserError("The pipe character is not supported")

        def leader():
            image = gl.nondet.web.render(clean_url, mode="screenshot")
            result = gl.nondet.exec_prompt(
                """
You are an accessibility editor. Inspect the supplied image and return one JSON
object with exactly these string fields:
{"kind":"PHOTO or ILLUSTRATION or DIAGRAM or OTHER","alt_text":"20-180 chars","long_description":"50-500 chars"}

Write neutral, useful descriptions of visible content only. Do not start with
"image of". Do not infer identity, emotion, intent, ethnicity, disability, or
other sensitive traits. Do not add facts that are not visually supported. Use
the optional publisher context only to disambiguate visible content. Never use
the pipe character.

Optional publisher context: """
                + clean_context,
                images=[image],
                response_format="json",
            )
            return _parse_result(result)

        def validator(proposal):
            try:
                if not isinstance(proposal, gl.vm.Return):
                    return False

                leader_result = _parse_result(proposal.calldata)
                validator_result = leader()

                if leader_result["kind"] != validator_result["kind"]:
                    return False
                if not _similar_enough(leader_result["alt_text"], validator_result["alt_text"]):
                    return False
                if not _similar_enough(leader_result["long_description"], validator_result["long_description"]):
                    return False
                return True
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader, validator)
        self.image_url = clean_url
        self.image_kind = result["kind"]
        self.alt_text = result["alt_text"]
        self.long_description = result["long_description"]
        self.description_count = u32(int(self.description_count) + 1)
        self.submitter = gl.message.sender_address
