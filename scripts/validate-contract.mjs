import fs from "node:fs";

const source = fs.readFileSync(new URL("../contracts/altloom.py", import.meta.url), "utf8");
const required = [
  "class Altloom(gl.Contract)",
  "def describe_image(self, image_url: str, context: str)",
  "def get_latest(self) -> str",
  "def get_count(self) -> int",
  "run_nondet_unsafe",
  "images=[image]",
];

for (const token of required) {
  if (!source.includes(token)) throw new Error(`Contract schema is missing: ${token}`);
}

if (!/def __init__\(self\):/.test(source)) {
  throw new Error("Altloom constructor must not require arguments");
}

console.log("Altloom contract schema looks valid.");
