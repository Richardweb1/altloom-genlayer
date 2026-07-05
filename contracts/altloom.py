# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


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
            return gl.nondet.exec_prompt(
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

        def validator(proposal):
            try:
                if not isinstance(proposal, gl.vm.Return):
                    return False

                candidate = proposal.calldata
                if not isinstance(candidate, dict):
                    return False

                kind = candidate.get("kind", "")
                alt = candidate.get("alt_text", "")
                long_desc = candidate.get("long_description", "")

                if kind not in ["PHOTO", "ILLUSTRATION", "DIAGRAM", "OTHER"]:
                    return False
                if not isinstance(alt, str) or not 20 <= len(alt) <= 180:
                    return False
                if not isinstance(long_desc, str) or not 50 <= len(long_desc) <= 500:
                    return False
                if "|" in alt or "|" in long_desc:
                    return False
                lowered = (alt + " " + long_desc).lower()
                blocked = [
                    "i cannot",
                    "as an ai",
                    "image of",
                    "picture of",
                    "probably",
                    "appears to be feeling",
                ]
                return not any(term in lowered for term in blocked)
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader, validator)
        self.image_url = clean_url
        self.image_kind = result["kind"]
        self.alt_text = result["alt_text"]
        self.long_description = result["long_description"]
        self.description_count = u32(int(self.description_count) + 1)
        self.submitter = gl.message.sender_address
