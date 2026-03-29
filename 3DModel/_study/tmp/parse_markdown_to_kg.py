import json
import os
import re

def parse_markdown_to_kg(input_file):
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Data structure to store our graph
    # Triplets: (Subject, Predicate, Object)
    triplets = []
    
    # Store the hierarchy stack: [ (level, node_id) ]
    # Represents the "active" ancestors for current processing
    stack = []

    for line in lines:
        # Match indentation (spaces) and the bullet point text
        match = re.match(r'^(\s*)-\s*(.*)', line)
        if not match:
            continue
            
        indentation = match.group(1)
        # Using 4 spaces as standard indentation level, or count unique lengths
        # But we can just use the length of the indentation string directly
        level = len(indentation)
        node_id = match.group(2).strip()

        # Clean stack from previous siblings/cousins
        # Pop everything that is deeper or at the same level as current node
        while stack and stack[-1][0] >= level:
            stack.pop()

        # If stack is not empty, the last element is the parent
        if stack:
            parent_level, parent_id = stack[-1]
            triplets.append({
                "subject": parent_id,
                "predicate": "contains",
                "object": node_id
            })
            # Also in a more RDF style string format
            # print(f"({parent_id}) --[contains]--> ({node_id})")

        # Push current node to stack
        stack.append((level, node_id))

    return triplets

def generate_mermaid(triplets):
    mermaid_output = "graph TD\n"
    for tri in triplets:
        mermaid_output += f'    {tri["subject"]} --> {tri["object"]}\n'
    return mermaid_output

if __name__ == "__main__":
    input_filename = "ac.md" # or full path
    output_filename = "kg_output.json"
    mermaid_filename = "kg_graph.md"

    # Get absolute paths to avoid issues
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, input_filename)
    output_path = os.path.join(script_dir, output_filename)
    mermaid_path = os.path.join(script_dir, mermaid_filename)

    print(f"Parsing {input_path}...")
    triplets = parse_markdown_to_kg(input_path)

    if triplets:
        # Save JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(triplets, f, indent=4, ensure_ascii=False)
        print(f"Saved JSON Graph to: {output_path}")

        # Save Mermaid Visualization
        mermaid_content = "# Knowledge Graph Visualization\n\n```mermaid\n" + generate_mermaid(triplets) + "```\n"
        with open(mermaid_path, 'w', encoding='utf-8') as f:
            f.write(mermaid_content)
        print(f"Saved Mermaid Visualization to: {mermaid_path}")

        # Display Top Triplets
        print("\n--- Example Triplets ---")
        for t in triplets[:5]:
            print(f"{t['subject']} --[contains]--> {t['object']}")
        print("...")
