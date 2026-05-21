import re

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.strip()
    return text

def normalize_arabic_text(text):
    if not text:
        return ""
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه")
    text = re.sub(r'\s+', ' ', text)
    return text

def normalize_empty_value(value):
    if not value:
        return True
    empty_strings = ["", "/", "0", "-", "nan", "none", "null", "فارغ"]
    if str(value).lower().strip() in empty_strings:
        return True
    return False

def build_duplicate_key(record):
    # لا تنفذ كشف تكرار الآن
    return None
