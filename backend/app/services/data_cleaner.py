import re

def clean_text(value: str | None) -> str:
    """تنظيف النص الأساسي وإزالة الفراغات الزائدة."""
    if value is None:
        return ""
    value = str(value).strip()
    value = re.sub(r'\s+', ' ', value)
    return value

def normalize_arabic_text(value: str) -> str:
    """توحيد الحروف العربية لأغراض المطابقة فقط وليس للعرض."""
    if not value:
        return ""
    # استبدال أشكال الألف
    value = re.sub(r'[أإآ]', 'ا', value)
    # استبدال الياء والألف المقصورة
    value = re.sub(r'ى', 'ي', value)
    # استبدال التاء المربوطة والهاء (فقط للمطابقة الدقيقة)
    value = re.sub(r'ة', 'ه', value)
    return value

def normalize_empty_value(value: str, empty_values: list = None) -> str:
    """إرجاع نص فارغ إذا كانت القيمة ضمن قائمة القيم الفارغة."""
    if empty_values is None:
        empty_values = ["", "/", "0", "-", "nan", "none", "null", "فارغ"]
    
    cleaned = clean_text(value).lower()
    if cleaned in [ev.lower() for ev in empty_values]:
        return ""
    return value

def build_duplicate_key(head_name: str | None, wife_name: str | None = None, mother_name: str | None = None) -> str:
    """توليد مفتاح للبحث عن السجلات المكررة."""
    parts = []
    if head_name: parts.append(clean_text(head_name))
    if wife_name: parts.append(clean_text(wife_name))
    if mother_name: parts.append(clean_text(mother_name))
    return "_".join(parts)
