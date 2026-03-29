import re

with open('ac.md', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. First, wipe any existing PIPE- lines to start clean
lines = text.split('\n')
clean_lines = []
skip_mode = False
for line in lines:
    if '- PIPE-' in line:
        continue
    clean_lines.append(line)

new_text = '\n'.join(clean_lines)

# 2. Add the specific pipe structure requested:
# FCU gets DRN and ELE (ConnectsFrom: LP-123)
# CDU gets REF (ConnectsTo: FCU)

def replacer(match):
    indent = match.group(1)
    ac_id = match.group(2)
    fcu_line = match.group(0)
    
    # We need to find the Corresponding CDU line which follows FCU
    # In this file structure, CDU is usually right after FCU's block
    
    # Construct the new FCU block
    new_fcu = f"{fcu_line}\n{indent}    - PIPE-DRN-{ac_id}\n{indent}    - PIPE-ELE-{ac_id} {{ ConnectsFrom: LP-123 }}"
    return new_fcu

# Match FCU and its ID
new_text = re.sub(r'^(\s+)-\s+FCU-(\d+-\d+)', replacer, new_text, flags=re.MULTILINE)

# Match CDU and add its pipe
def cdu_replacer(match):
    indent = match.group(1)
    ac_id = match.group(2)
    cdu_line = match.group(0)
    new_cdu = f"{cdu_line}\n{indent}    - PIPE-REF-{ac_id} {{ ConnectsTo: FCU-{ac_id} }}"
    return new_cdu

new_text = re.sub(r'^(\s+)-\s+CDU-(\d+-\d+)', cdu_replacer, new_text, flags=re.MULTILINE)

with open('ac.md', 'w', encoding='utf-8') as f:
    f.write(new_text)
