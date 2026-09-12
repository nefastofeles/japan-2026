#!/usr/bin/env python3
"""KEEP ids must resolve to a playable mission or discovery, or be documented."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/quest"


def load_arrays(glob_name):
    rows = []
    for path in sorted(DATA.glob(glob_name)):
        data = json.loads(path.read_text())
        if isinstance(data, list):
            rows.extend(item for item in data if isinstance(item, dict) and item.get("id"))
    return rows


def main():
    hold = json.loads((DATA / "publish-hold.json").read_text())
    held = {item["id"] for item in hold["held"]}
    aliased = {item["id"]: item["playableId"] for item in hold["aliased"]}

    missions = load_arrays("missions*.json")
    discoveries = load_arrays("discoveries*.json")
    playable = {item["id"] for item in missions}
    playable.update(item["id"] for item in discoveries)
    playable.update(item["codexId"] for item in discoveries if item.get("codexId"))

    manifest = json.loads((DATA / "script/manifest.json").read_text())
    keep = []
    cut_status = []
    for file in manifest["files"]:
        pack = json.loads((DATA / "script" / file).read_text())
        for item in pack.get("items", []):
            status = item.get("status")
            if status in ("cut", "CUT"):
                cut_status.append(item["id"])
            if status in ("live", "approved"):
                keep.append(item)

    missing = []
    for item in keep:
        sid = item["id"]
        if sid in held:
            continue
        pid = aliased.get(sid) or item.get("liveMissionId") or item.get("liveDiscoveryId") or sid
        if pid not in playable:
            missing.append(sid)

    print("KEEP", len(keep))
    print("playable missions", len(missions))
    print("playable discoveries", len(discoveries))
    print("held", sorted(held))
    print("aliased", aliased)
    print("CUT status items", cut_status)
    print("KEEP minus playable", missing)
    if missing:
        raise SystemExit(1)
    print("OK")


if __name__ == "__main__":
    main()
