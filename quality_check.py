"""Quality gate for the flattened, self-contained Qamelot collection."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).parent.resolve()
PAGES = sorted(ROOT.glob("*.html"))
REMOTE = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//|#)", re.I)


class Audit(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str, int]] = []
        self.title = self.lang = self.charset = self.viewport = self.favicon = False
        self.unsafe_blank: list[int] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        self.title |= tag == "title"
        self.lang |= tag == "html" and bool(values.get("lang"))
        self.charset |= tag == "meta" and (
            "charset" in values or values.get("http-equiv", "").lower() == "content-type"
        )
        self.viewport |= tag == "meta" and values.get("name", "").lower() == "viewport"
        self.favicon |= tag == "link" and "icon" in values.get("rel", "").lower().split()
        for name in ("href", "src", "poster", "data"):
            if values.get(name):
                self.refs.append((name, values[name], self.getpos()[0]))
        if values.get("target", "").lower() == "_blank":
            rel = set(values.get("rel", "").lower().split())
            if not {"noopener", "noreferrer"}.issubset(rel):
                self.unsafe_blank.append(self.getpos()[0])


errors: list[str] = []
warnings: list[str] = []
for page in PAGES:
    audit = Audit()
    text = page.read_text(encoding="utf-8", errors="replace")
    try:
        audit.feed(text)
    except Exception as exc:
        errors.append(f"{page.name}: parsing failed: {exc}")
        continue
    for label, present in (
        ("title", audit.title), ("html lang", audit.lang),
        ("charset", audit.charset), ("viewport", audit.viewport),
    ):
        if not present:
            warnings.append(f"{page.name}: missing {label}")
    if not audit.favicon:
        errors.append(f"{page.name}: missing favicon")
    for line in audit.unsafe_blank:
        errors.append(f'{page.name}:{line}: target="_blank" needs rel="noopener noreferrer"')
    for _, raw, line in audit.refs:
        if REMOTE.match(raw) or raw.startswith(("${", "{{", "{")):
            continue
        clean = unquote(raw.split("#", 1)[0].split("?", 1)[0])
        if clean and not (ROOT / clean).exists():
            errors.append(f"{page.name}:{line}: broken local reference: {raw}")

manifest_path = ROOT / "page-manifest.json"
if not manifest_path.exists():
    errors.append("page-manifest.json is missing")
else:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    listed = {item["file"] for item in manifest}
    actual = {page.name for page in PAGES}
    if listed != actual:
        errors.append(f"menu manifest mismatch: missing={sorted(actual-listed)} extra={sorted(listed-actual)}")
    menu = (ROOT / "index.html").read_text(encoding="utf-8")
    for filename in sorted(actual):
        if filename not in menu:
            errors.append(f"index.html does not link {filename}")

print(f"Checked {len(PAGES)} standalone HTML pages: {len(errors)} error(s), {len(warnings)} warning(s).")
for item in warnings:
    print("WARNING:", item)
for item in errors:
    print("ERROR:", item)
sys.exit(1 if errors else 0)
