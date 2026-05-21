import json
import os
from pathlib import Path
from .data_cleaner import clean_text, normalize_arabic_text, normalize_empty_value

RULES_DIR = Path(__file__).parent.parent / "rules"

def load_json_rule(file_name: str):
    path = RULES_DIR / file_name
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

area_aliases = load_json_rule("area_aliases.json") or {}
empty_values_rule = load_json_rule("empty_values.json") or ["", "/", "0", "-", "nan", "none", "null", "فارغ"]
non_area_keywords = load_json_rule("non_area_keywords.json") or ["فصل زواج", "فصل طلاق", "نقل وارد", "كتاب قسم", "استمارة", "وارد", "مراجعة", "قرار"]

def is_empty_address(value: str, empty_values=None) -> bool:
    if normalize_empty_value(value):
        return True
    val = str(value).lower().strip()
    evs = empty_values if empty_values is not None else empty_values_rule
    return val in [v.lower() for v in evs]

def is_non_area_value(value: str, non_area_kw=None) -> bool:
    val = str(value).lower().strip()
    kws = non_area_kw if non_area_kw is not None else non_area_keywords
    for keyword in kws:
        if keyword in val:
            return True
    return False

def normalize_area(value: str, area_alias=None) -> str:
    cleaned = clean_text(value)
    normalized = normalize_arabic_text(cleaned)
    aliases = area_alias if area_alias is not None else area_aliases
    
    for alias, standard_name in aliases.items():
        if normalize_arabic_text(alias) == normalized or alias == cleaned:
            return standard_name
            
    return cleaned

def classify_address(raw_address: str, rules_dir=None):
    if is_empty_address(raw_address):
        return None, "empty", None, "incomplete", "العنوان غير مذكور أو فارغ"
        
    if is_non_area_value(raw_address):
        return None, "non_area", raw_address, "needs_review", "العنوان يحتوي ملاحظة إدارية وليست منطقة"
        
    cleaned = clean_text(raw_address)
    normalized = normalize_arabic_text(cleaned)
    
    matched = False
    standard_name = cleaned
    for alias, std in area_aliases.items():
        if normalize_arabic_text(alias) == normalized or alias == cleaned:
            standard_name = std
            matched = True
            break
            
    if matched:
        return standard_name, "area", None, "complete", "تم توحيد صيغة المنطقة"
    else:
        return cleaned, "area", None, "complete", "تم اعتبار العنوان منطقة كما ورد"
