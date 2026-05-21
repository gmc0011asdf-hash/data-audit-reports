import json
import os
from pathlib import Path
from .data_cleaner import clean_text, normalize_empty_value

def load_json_rule(file_path: str) -> dict | list:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def is_empty_address(value: str, empty_values: list = None) -> bool:
    cleaned = normalize_empty_value(value, empty_values)
    return cleaned == ""

def is_non_area_value(value: str, non_area_keywords: list = None) -> bool:
    if not value or not non_area_keywords:
        return False
    value_clean = clean_text(value)
    for keyword in non_area_keywords:
        if keyword in value_clean:
            return True
    return False

def normalize_area(value: str, area_aliases: dict = None) -> str:
    if not value or not area_aliases:
        return clean_text(value)
    value_clean = clean_text(value)
    return area_aliases.get(value_clean, value_clean)

def classify_address(raw_address: str, rules_dir: str = None) -> tuple[str, str, str]:
    """
    Returns: (classification, normalized_area, reason)
    """
    if rules_dir is None:
        rules_dir = str(Path(__file__).parent.parent / "rules")
        
    empty_values = load_json_rule(os.path.join(rules_dir, "empty_values.json"))
    non_area_keywords = load_json_rule(os.path.join(rules_dir, "non_area_keywords.json"))
    area_aliases = load_json_rule(os.path.join(rules_dir, "area_aliases.json"))
    
    if is_empty_address(raw_address, empty_values):
        return "empty", "", "matched_empty"
        
    if is_non_area_value(raw_address, non_area_keywords):
        return "non_area", "", "matched_non_area"
        
    cleaned_address = clean_text(raw_address)
    normalized = normalize_area(cleaned_address, area_aliases)
    
    if normalized != cleaned_address:
        return "area", normalized, "matched_alias"
        
    return "area", cleaned_address, "default_area"
