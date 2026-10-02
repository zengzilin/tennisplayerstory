from pathlib import Path
import json
import shutil

folder = Path(__file__).resolve().parent
project = folder.parents[2]
manifest = json.loads((folder / "rollback/manifest.json").read_text())
for name, existed in manifest["files"].items():
    target = project / name
    if existed:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(folder / "rollback" / name, target)
    elif target.exists():
        target.unlink()
print("Restored only v3 application files. Inspect changes, rebuild and deploy via Git to revert the live release. DNS is separate.")
