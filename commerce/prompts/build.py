"""Assemble the write-phase prompts from core.md and platform-<name>.md in this folder.

Blocks between `<!-- route: chat -->` (or `code`) and `<!-- /route -->` appear only in that
route's prompt; `<!-- platform -->` in the core is replaced by the platform's section.
Output: write-<platform>-<route>.md in this folder, committed with the sources, so the
site build never runs Python. See README.md.
    python3 commerce/prompts/build.py            build every platform for both routes
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
ROUTES = ("chat", "code")
BLOCK = re.compile(r"<!-- route: (\w+) -->\n(.*?)<!-- /route -->\n", re.S)

def for_route(text, route):
    return BLOCK.sub(lambda m: m.group(2) if m.group(1) == route else "", text)

def build(platform, route):
    core = (HERE / "core.md").read_text()
    section = (HERE / f"platform-{platform}.md").read_text()
    assert core.count("<!-- platform -->\n\n") == 1
    return for_route(core.replace("<!-- platform -->\n\n", section), route)

if __name__ == "__main__":
    for p in sorted(HERE.glob("platform-*.md")):
        name = p.stem.removeprefix("platform-")
        for route in ROUTES:
            out = HERE / f"write-{name}-{route}.md"
            out.write_text(build(name, route))
            print(out.name, len(out.read_text()), "chars")
