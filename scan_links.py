import re
from pathlib import Path
root = Path('.')
files = list(root.rglob('*.html')) + list(root.rglob('*.htm'))
link_re = re.compile(r'(?:href|src)=["\']([^"\']+)["\']', re.I)
ignore_prefixes = ('http://','https://','mailto:','tel:','javascript:','data:','ftp://','//')
missing = []
for f in sorted(files):
    text = f.read_text(encoding='utf-8', errors='ignore')
    for m in link_re.finditer(text):
        target = m.group(1).strip()
        if not target or target.startswith('#') or target.startswith(ignore_prefixes) or '${' in target:
            continue
        target = target.split('#', 1)[0].split('?', 1)[0]
        if not target:
            continue
        p = (f.parent / target).resolve()
        if not p.exists():
            missing.append((str(f), target))
print('BROKEN_LINKS=' + str(len(missing)))
for item in missing:
    print(item[0] + ': ' + item[1])
