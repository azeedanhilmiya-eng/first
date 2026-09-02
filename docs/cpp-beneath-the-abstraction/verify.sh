#!/usr/bin/env bash
# Builds every chapter's main example with the series' canonical flags, runs it, and diffs
# its stdout against examples/chNN/expected_output.txt.
#
#   ./verify.sh          # all chapters
#   ./verify.sh ch03     # one chapter
#
# Exit status is non-zero if any chapter fails to build, exits non-zero, or prints something
# other than its expected output.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CXX="${CXX:-g++}"
CXXFLAGS="${CXXFLAGS:--std=c++20 -Wall -Wextra -Wpedantic -Werror -O0 -g -pthread}"

if [ $# -gt 0 ]; then
  dirs=()
  for c in "$@"; do dirs+=("$ROOT/examples/$c"); done
else
  dirs=("$ROOT"/examples/ch*)
fi

status=0
for dir in "${dirs[@]}"; do
  name="$(basename "$dir")"
  if [ ! -d "$dir" ]; then echo "[$name] MISSING DIRECTORY"; status=1; continue; fi
  build="$dir/.build"
  mkdir -p "$build"
  if [ -x "$dir/build.sh" ]; then
    if ! (cd "$dir" && CXX="$CXX" CXXFLAGS="$CXXFLAGS" OUT="$build/main" ./build.sh); then
      echo "[$name] BUILD FAILED"; status=1; continue
    fi
  else
    # shellcheck disable=SC2086
    if ! $CXX $CXXFLAGS "$dir"/*.cpp -o "$build/main"; then
      echo "[$name] BUILD FAILED"; status=1; continue
    fi
  fi
  if [ ! -f "$dir/expected_output.txt" ]; then echo "[$name] MISSING expected_output.txt"; status=1; continue; fi
  actual="$build/actual_output.txt"
  if ! (cd "$dir" && "$build/main" > "$actual"); then
    echo "[$name] RUN FAILED (non-zero exit)"; status=1; continue
  fi
  if diff -u "$dir/expected_output.txt" "$actual"; then
    echo "[$name] OK"
  else
    echo "[$name] OUTPUT MISMATCH (see diff above: - expected, + actual)"; status=1
  fi
done
exit $status
