"""Assemble the phase prompts from the sources in this folder.

A phase has a core and one section per platform: the write phase `write-core.md` and
`write-platform-<name>.md`, the serve phase `serve-core.md` and `serve-platform-<name>.md`, the
link phase `link-core.md` and `link-platform-<name>.md`.
`<!-- platform -->` in the core is replaced by the platform's section.
Output: <phase>-<platform>-chat.md in this folder, committed with the sources, so the
site build never runs Python. See README.md.
    python3 commerce/prompts/build.py            build every phase and platform
    python3 commerce/prompts/build.py serve      build one phase
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
# phase: (core file, prefix of its platform sections)
PHASES = {
    "write": ("write-core.md", "write-platform-"),
    "serve": ("serve-core.md", "serve-platform-"),
    "link": ("link-core.md", "link-platform-"),
}

def build(phase, platform):
    core_file, prefix = PHASES[phase]
    core = (HERE / core_file).read_text()
    section = (HERE / f"{prefix}{platform}.md").read_text()
    assert core.count("<!-- platform -->\n\n") == 1
    return core.replace("<!-- platform -->\n\n", section)

if __name__ == "__main__":
    for phase in sys.argv[1:] or PHASES:
        _, prefix = PHASES[phase]
        for p in sorted(HERE.glob(f"{prefix}*.md")):
            name = p.stem.removeprefix(prefix)
            out = HERE / f"{phase}-{name}-chat.md"
            out.write_text(build(phase, name))
            print(out.name, len(out.read_text()), "chars")
