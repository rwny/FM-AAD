import re

with open('ac.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
i = 0
found_ar15 = False

while i < len(lines):
    line = lines[i]
    if line.strip() == '- ar15 (AC)' and not found_ar15:
        out.append(line)
        out.append('    - LP-123 { Type: LoadPanel }\n')
        found_ar15 = True
        i += 1
        continue
        
    m_fcu = re.match(r'^(\s+)-\s+FCU-(\d+-\d+)', line)
    if m_fcu:
        indent = m_fcu.group(1)
        ac_idx = m_fcu.group(2)
        out.append(line)
        pipe_indent = indent + "    "
        out.append(f'{pipe_indent}- PIPE-REF-{ac_idx} {{ ConnectsTo: CDU-{ac_idx} }}\n')
        out.append(f'{pipe_indent}- PIPE-DRN-{ac_idx} {{ ConnectsTo: CDU-{ac_idx} }}\n')
        out.append(f'{pipe_indent}- PIPE-ELE-{ac_idx} {{ ConnectsTo: LP-123 }}\n')
        i += 1
        continue
        
    # Remove existing pipes
    if '- PIPE-' in line:
        if '- CDU-' in line:
            parts = line.split('- PIPE-')
            out.append(parts[0].rstrip() + '\n')
        i += 1
        continue
        
    out.append(line)
    i += 1

with open('ac.md', 'w', encoding='utf-8') as f:
    f.writelines(out)
