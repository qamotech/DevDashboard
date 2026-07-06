import os
import re
root = '.'
html_files = []
for dirpath, _, filenames in os.walk(root):
    for f in filenames:
        if f.lower().endswith(('.html', '.htm')):
            html_files.append(os.path.join(dirpath, f))
missing = []
for path in html_files:
    with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
        text = fh.read()
    for href in re.findall(r'href=["\']([^"\']+)["\']', text):
        if href.startswith(('http://', 'https://', 'mailto:', 'javascript:', '#')):
            continue
        target = href.split('#', 1)[0].split('?', 1)[0]
        if not target:
            continue
        resolved = os.path.normpath(os.path.join(os.path.dirname(path), target))
        if not os.path.exists(resolved):
            missing.append((path, href))
print('missing_links', len(missing))
for path, href in missing[:50]:
    print(path, '->', href)
