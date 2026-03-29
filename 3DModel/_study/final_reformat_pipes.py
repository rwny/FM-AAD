import re

with open('ac.md', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. First, wipe any existing PIPE- lines to start clean
lines = text.split('\n')
clean_lines = []
for line in lines:
    if '- PIPE-' in line:
        continue
    clean_lines.append(line)

new_text = '\n'.join(clean_lines)

# 2. Add the specific pipe structure requested:
# FCU-xxx gets PIPE-DRN-xxx
# CDU-xxx gets PIPE-ELE-xxx { ConnectsFrom: LP-123 } AND PIPE-REF-xxx { ConnectsTo: FCU-xxx }

def fcu_replacer(match):
    indent = match.group(1)
    ac_id = match.group(2)
    fcu_line = match.group(0)
    # FCU only has DRN pipe
    return f"{fcu_line}\n{indent}    - PIPE-DRN-{ac_id}"

new_text = re.sub(r'^(\s+)-\s+FCU-(\d+-\d+)', fcu_replacer, new_text, flags=re.MULTILINE)

def cdu_replacer(match):
    indent = match.group(1)
    ac_id = match.group(2)
    cdu_line = match.group(0)
    # CDU has ELE (from LP-123) and REF (to FCU)
    return f"{cdu_line}\n{indent}    - PIPE-ELE-{ac_id} {{ ConnectsFrom: LP-123 }}\n{indent}    - PIPE-REF-{ac_id} {{ ConnectsTo: FCU-{ac_id} }}"

new_text = re.sub(r'^(\s+)-\s+CDU-(\d+-\d+)', cdu_replacer, new_text, flags=re.MULTILINE)

with open('ac.md', 'w', encoding='utf-8') as f:
    f.write(new_text)
