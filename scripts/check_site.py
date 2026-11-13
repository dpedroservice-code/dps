from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys

ROOT = Path(".")
errors = []

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value:
                self.refs.append(value.strip())

html_files = list(ROOT.glob("*.html"))
if not html_files:
    errors.append("No HTML entry pages found.")

for page in html_files:
    parser = Links()
    parser.feed(page.read_text(encoding="utf-8"))
    for ref in parser.refs:
        if ref.startswith(("#", "http://", "https://", "mailto:", "tel:", "javascript:", "data:")):
            continue
        path = unquote(urlparse(ref).path)
        if not path:
            continue
        target = (page.parent / path).resolve()
        if not target.exists():
            errors.append(f"{page}: missing local asset/page: {ref}")

admin = ROOT / "assets/js/admin.js"
if admin.exists():
    code = admin.read_text(encoding="utf-8")
    for forbidden in ("const ADMIN_PASSWORD", "dpedro_admin') === 'true'"):
        if forbidden in code:
            errors.append(f"Insecure browser-only admin authentication pattern remains: {forbidden}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"Static site check passed: {len(html_files)} HTML pages scanned.")
