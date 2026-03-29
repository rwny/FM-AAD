import sqlite3
import json
import os

def migrate_to_sqlite(json_file, db_file):
    if not os.path.exists(json_file):
        print(f"Error: {json_file} does not exist. Please run parse_markdown_to_kg.py first.")
        return

    # Load triplets from JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        triplets = json.load(f)

    # Connect to (or create) SQLite database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Step 1: Create Tables
    # Nodes table: unique entities
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Edges table: relationships (Subject -> Predicate -> Object)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER,
            predicate TEXT,
            object_id INTEGER,
            FOREIGN KEY (subject_id) REFERENCES nodes (id),
            FOREIGN KEY (object_id) REFERENCES nodes (id)
        )
    ''')

    # Step 2: Insert Data
    unique_names = set()
    for t in triplets:
        unique_names.add(t["subject"])
        unique_names.add(t["object"])

    # Map name string to numerical ID in DB
    name_to_id = {}
    for name in unique_names:
        cursor.execute('INSERT OR IGNORE INTO nodes (name) VALUES (?)', (name,))
        cursor.execute('SELECT id FROM nodes WHERE name = ?', (name,))
        name_to_id[name] = cursor.fetchone()[0]

    # Insert Edges
    for t in triplets:
        subject_id = name_to_id[t["subject"]]
        object_id = name_to_id[t["object"]]
        predicate = t["predicate"]
        
        cursor.execute(
            'INSERT INTO edges (subject_id, predicate, object_id) VALUES (?, ?, ?)',
            (subject_id, predicate, object_id)
        )

    conn.commit()
    conn.close()
    print(f"Migration complete! Created {db_file} with {len(unique_names)} nodes and {len(triplets)} edges.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "kg_output.json")
    db_path = os.path.join(script_dir, "building_kg.db")

    migrate_to_sqlite(json_path, db_path)
