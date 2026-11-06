"""Assemble the phase prompts from the sources in this folder.

A phase has a core and one section per platform: the write phase `core.md` and
`platform-<name>.md`, the serve phase `serve-core.md` and `serve-platform-<name>.md`, the
link phase `link-core.md` and `link-platform-<name>.md`.
Blocks between `<!-- route: chat -->` (or `code`) and `<!-- /route -->` appear only in that
route's prompt; `<!-- platform -->` in the core is replaced by the platform's section.
Output: <phase>-<platform>-<route>.md in this folder, committed with the sources, so the
site build never runs Python. See README.md.
    python3 commerce/prompts/build.py            build every phase, platform and route
    python3 commerce/prompts/build.py serve      build one phase
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
# phase: (core file, prefix of its platform sections, routes)
PHASES = {
    "write": ("core.md", "platform-", ("chat", "code")),
    "serve": ("serve-core.md", "serve-platform-", ("chat",)),
    "link": ("link-core.md", "link-platform-", ("chat",)),
}
BLOCK = re.compile(r"<!-- route: (\w+) -->\n(.*?)<!-- /route -->\n", re.S)

def for_route(text, route):
    return BLOCK.sub(lambda m: m.group(2) if m.group(1) == route else "", text)

def build(phase, platform, route):
    core_file, prefix, _ = PHASES[phase]
    core = (HERE / core_file).read_text()
    section = (HERE / f"{prefix}{platform}.md").read_text()
    assert core.count("<!-- platform -->\n\n") == 1
    return for_route(core.replace("<!-- platform -->\n\n", section), route)

if __name__ == "__main__":
    for phase in sys.argv[1:] or PHASES:
        _, prefix, routes = PHASES[phase]
        for p in sorted(HERE.glob(f"{prefix}*.md")):
            name = p.stem.removeprefix(prefix)
            for route in routes:
                out = HERE / f"{phase}-{name}-{route}.md"
                out.write_text(build(phase, name, route))
                print(out.name, len(out.read_text()), "chars")
