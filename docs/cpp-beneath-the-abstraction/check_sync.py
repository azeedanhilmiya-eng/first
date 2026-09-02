#!/usr/bin/env python3
"""Checks that a chapter's markdown is in sync with its example files.

    ./check_sync.py          # all chapters
    ./check_sync.py ch03     # one chapter

For each chapter NN it verifies that, inside "## 3. Complete, Production-Grade Code Example":
  * every bold filename line  **`examples/chNN/<path>`**  is followed by a ```cpp block whose
    content is byte-identical to that file on disk;
  * every top-level *.cpp / *.h file in examples/chNN/ is shown in the chapter;
  * the ```text block after **Terminal Output:** is byte-identical to expected_output.txt.
Exit status is non-zero on any mismatch.
"""
import difflib
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
FENCE = re.compile(r"^```(\w*)\s*$")


def fenced_blocks(lines, start, end):
    """Yield (open_line_index, lang, content) for each fenced block in lines[start:end]."""
    i = start
    while i < end:
        m = FENCE.match(lines[i])
        if m:
            lang = m.group(1)
            j = i + 1
            while j < end and not FENCE.match(lines[j]):
                j += 1
            yield i, lang, "\n".join(lines[i + 1:j]) + ("\n" if j > i + 1 else "")
            i = j + 1
        else:
            i += 1


def section_bounds(lines, number):
    start = end = None
    for i, line in enumerate(lines):
        if start is None and line.startswith(f"## {number}."):
            start = i
        elif start is not None and re.match(r"^## \d+\.", line):
            end = i
            break
    return start, end if end is not None else len(lines)


def report_diff(label, expected, actual):
    print(f"  MISMATCH: {label}")
    for d in difflib.unified_diff(expected.splitlines(), actual.splitlines(),
                                  "on disk", "in markdown", lineterm="", n=1):
        print("    " + d)


def check_chapter(ch):
    num = ch[2:]
    md_paths = glob.glob(os.path.join(ROOT, f"{num}-*.md"))
    ex_dir = os.path.join(ROOT, "examples", ch)
    if len(md_paths) != 1:
        print(f"[{ch}] expected exactly one {num}-*.md, found {md_paths}")
        return False
    lines = open(md_paths[0], encoding="utf-8").read().split("\n")
    s, e = section_bounds(lines, 3)
    if s is None:
        print(f"[{ch}] no '## 3.' section found")
        return False
    ok = True
    shown = set()
    blocks = list(fenced_blocks(lines, s, e))
    # filename line -> following cpp block
    for i in range(s, e):
        m = re.match(r"^\*\*`examples/" + ch + r"/([^`]+)`\*\*\s*$", lines[i])
        if not m:
            continue
        rel = m.group(1)
        blk = next((b for b in blocks if b[0] > i and b[0] - i <= 3), None)
        if blk is None or blk[1] != "cpp":
            print(f"[{ch}] {rel}: no ```cpp block directly after the filename line")
            ok = False
            continue
        path = os.path.join(ex_dir, rel)
        if not os.path.isfile(path):
            print(f"[{ch}] {rel}: file does not exist on disk")
            ok = False
            continue
        shown.add(rel)
        disk = open(path, encoding="utf-8").read()
        if disk != blk[2]:
            print(f"[{ch}] {rel}:")
            report_diff(rel, disk, blk[2])
            ok = False
    for path in sorted(glob.glob(os.path.join(ex_dir, "*.cpp")) + glob.glob(os.path.join(ex_dir, "*.h"))
                       + glob.glob(os.path.join(ex_dir, "*.hpp"))):
        rel = os.path.basename(path)
        if rel not in shown:
            print(f"[{ch}] {rel} exists on disk but is not shown in section 3")
            ok = False
    # terminal output
    out_idx = next((i for i in range(s, e) if lines[i].strip() == "**Terminal Output:**"), None)
    if out_idx is None:
        print(f"[{ch}] no '**Terminal Output:**' line in section 3")
        ok = False
    else:
        blk = next((b for b in blocks if b[0] > out_idx and b[0] - out_idx <= 3), None)
        exp_path = os.path.join(ex_dir, "expected_output.txt")
        if blk is None or blk[1] != "text":
            print(f"[{ch}] no ```text block directly after '**Terminal Output:**'")
            ok = False
        elif not os.path.isfile(exp_path):
            print(f"[{ch}] missing expected_output.txt")
            ok = False
        else:
            disk = open(exp_path, encoding="utf-8").read()
            if disk != blk[2]:
                print(f"[{ch}] Terminal Output:")
                report_diff("expected_output.txt", disk, blk[2])
                ok = False
    # balanced fences across whole file
    if sum(1 for l in lines if FENCE.match(l)) % 2 != 0:
        print(f"[{ch}] unbalanced ``` fences in {os.path.basename(md_paths[0])}")
        ok = False
    print(f"[{ch}] {'OK' if ok else 'FAILED'}")
    return ok


def main(argv):
    chapters = argv[1:] or sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "examples", "ch*")))
    results = [check_chapter(ch) for ch in chapters]
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
