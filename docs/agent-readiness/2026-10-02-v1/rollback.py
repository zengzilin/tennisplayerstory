"""Restore only this task's changed source files from its pre-change snapshot."""
import json
import shutil
from pathlib import Path

base = Path(__file__).resolve().parent
root = base.parents[2]
manifest = json.loads((base / 'rollback/manifest.json').read_text())
for name in manifest['files']:
    source = base / 'rollback' / name
    if not source.exists():
        source = base / 'rollback' / Path(name).name
    shutil.copy2(source, root / name)
for name in manifest['new_files']:
    (root / name).unlink(missing_ok=True)
print('Restored the task snapshot. Rebuild before redeploying; DNS was not changed.')
