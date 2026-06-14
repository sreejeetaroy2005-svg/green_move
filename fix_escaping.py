import re, os

files = []
for d in ['src', 'routes']:
    for f in os.listdir(d):
        if f.endswith('.js'):
            files.append(os.path.join(d, f))

for fp in files:
    with open(fp, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    original = content
    
    # Iteratively unescape until stable
    prev = None
    while prev != content:
        prev = content
        content = content.replace('\\`', '`').replace('\\$', '$')
    
    if content != original:
        with open(fp, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f'Fixed: {fp}')
    else:
        print(f'OK: {fp}')

print('Done.')
