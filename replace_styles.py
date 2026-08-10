import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace gray with zinc
    new_content = re.sub(r'\bgray-(\d{2,3}(?:/\d{1,3})?)\b', r'zinc-\1', content)
    
    # Replace indigo with blue
    new_content = re.sub(r'\bindigo-(\d{2,3}(?:/\d{1,3})?)\b', r'blue-\1', new_content)
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            process_file(os.path.join(root, file))
