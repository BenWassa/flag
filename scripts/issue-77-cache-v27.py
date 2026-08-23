from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding='utf-8')


sw_path = 'public/sw.js'
sw = read(sw_path)
old_header = "// v26 ships #75's refresh-dropped-round notice and heading fix, #76's\n"
if old_header not in sw:
    raise RuntimeError('public/sw.js: expected v26 release header not found')
sw = sw.replace(
    old_header,
    "// v27 restores full-width post-mode continent and region navigation for Issue #77\n"
    "// and retires learner-facing row-level Quick Play shortcuts.\n"
    + old_header,
    1,
)
old_history = "// Issue #16 baseline retained for release-lineage verification: const VERSION = 'flag-atlas-v17'"
new_history = "// Issue #16 baseline retained for release-lineage verification: const VERSION = 'flag-atlas-v16'"
if old_history not in sw:
    raise RuntimeError('public/sw.js: accidental historical v17 marker not found')
sw = sw.replace(old_history, new_history, 1)
old_version = "const VERSION = 'flag-atlas-v26';"
new_version = "const VERSION = 'flag-atlas-v27';"
if old_version not in sw:
    raise RuntimeError('public/sw.js: active v26 cache version not found')
sw = sw.replace(old_version, new_version, 1)
write(sw_path, sw)

verifier_paths = [
    'scripts/verify-atlas-brand.mjs',
    'scripts/verify-map.mjs',
    'scripts/verify-domain-integration.mjs',
    'scripts/verify-routing.mjs',
    'scripts/verify-neighbor-map.mjs',
    'scripts/verify-british-english.mjs',
]
for path in verifier_paths:
    text = read(path)
    marker = "const VERSION = 'flag-atlas-v17'"
    if marker not in text:
        raise RuntimeError(f'{path}: expected temporary v17 assertion not found')
    text = text.replace(marker, "const VERSION = 'flag-atlas-v27'", 1)
    write(path, text)

# Keep verifier output truthful about the active shell version where those
# messages were previously tied to the historical v16 marker.
message_replacements = {
    'scripts/verify-domain-integration.mjs': [
        ('v17 Atlas shell', 'v27 Atlas shell'),
        ('advance the PWA cache to v17', 'advance the PWA cache to v27'),
    ],
    'scripts/verify-routing.mjs': [
        ('v16 Atlas PWA shell', 'v27 Atlas PWA shell'),
    ],
    'scripts/verify-british-english.mjs': [
        ('v16 Atlas brand cache contract', 'v27 Atlas cache contract'),
    ],
    'scripts/verify-map.mjs': [
        ('Atlas brand rollout owns the v16 PWA cache.', 'Issue #77 shell changes own the v27 PWA cache.'),
    ],
    'scripts/verify-neighbor-map.mjs': [
        ('Atlas brand rollout owns the v16 PWA cache.', 'Issue #77 shell changes own the v27 PWA cache.'),
    ],
    'scripts/verify-atlas-brand.mjs': [
        ('Brand metadata changes invalidate the previous app-shell cache.', 'The current app-shell cache version is asserted explicitly.'),
    ],
}
for path, replacements in message_replacements.items():
    text = read(path)
    for old, new in replacements:
        if old not in text:
            raise RuntimeError(f'{path}: expected message not found: {old}')
        text = text.replace(old, new, 1)
    write(path, text)

print('Issue #77 active service-worker cache advanced to v27.')
