import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Standardize shadows
    content = re.sub(r'\bshadow-2xl\b', 'shadow-xl', content)
    content = re.sub(r'\bshadow-lg\b', 'shadow-md', content)

    # Standardize rounded corners
    content = re.sub(r'\brounded-3xl\b', 'rounded-2xl', content)
    content = re.sub(r'\brounded-md\b', 'rounded-lg', content)
    
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))
