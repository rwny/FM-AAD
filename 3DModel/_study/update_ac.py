import re

with open('ac.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for line in lines:
    out.append(line)
    m = re.match(r'^(\s+)-\s+CDU-(\d+-\d+)', line)
    if m:
        indent = m.group(1)
        ac_idx = m.group(2)
        out.append(f'{indent}- PIPE-REF-{ac_idx} {{ ConnectsTo: "FCU-{ac_idx}, CDU-{ac_idx}" }}\n')
        out.append(f'{indent}- PIPE-DRN-{ac_idx}\n')
        out.append(f'{indent}- PIPE-ELE-{ac_idx}\n')

with open('ac.md', 'w', encoding='utf-8') as f:
    f.writelines(out)
