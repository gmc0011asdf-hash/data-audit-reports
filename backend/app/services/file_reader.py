import chardet
import pandas as pd
import os

def detect_mojibake(value: str) -> bool:
    if not isinstance(value, str):
        return False
    # Characters typical of UTF-8 read as Latin-1
    mojibake_chars = ['Ø', 'Ù', 'æ', 'ß', 'Ç', 'È', 'É', 'Ê', 'Ë']
    count = 0
    for char in mojibake_chars:
        if char in value:
            count += 1
            if count >= 1: # One or more is enough to suspect mojibake
                return True
    return False

def fix_mojibake_text(value: str) -> str:
    if not isinstance(value, str):
        return value
    try:
        # Re-encode as latin1 and decode as utf-8
        return value.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    except Exception:
        return value

def detect_encoding(file_path: str) -> str:
    with open(file_path, 'rb') as f:
        raw_data = f.read(10000)
        
    result = chardet.detect(raw_data)
    detected = result['encoding']
    
    if detected:
        if detected.lower().startswith('windows-1256') or detected.lower() == 'windows-1251':
            return 'cp1256'
        return detected.lower()
        
    return 'utf-8'

def detect_separator(sample_text: str) -> str:
    if '\t' in sample_text:
        return '\t'
    if ',' in sample_text:
        return ','
    if ';' in sample_text:
        return ';'
    return '\t'

def read_txt_file(file_path: str) -> pd.DataFrame:
    encoding = detect_encoding(file_path)
    with open(file_path, 'r', encoding=encoding, errors='replace') as f:
        sample = f.read(2048)
        f.seek(0)
        sep = detect_separator(sample)
        
    try:
        df = pd.read_csv(file_path, sep=sep, encoding=encoding, dtype=str, on_bad_lines='skip')
    except Exception:
        fallback_enc = 'utf-8' if encoding == 'cp1256' else 'cp1256'
        df = pd.read_csv(file_path, sep=sep, encoding=fallback_enc, dtype=str, on_bad_lines='skip')
        
    return df

def read_csv_file(file_path: str) -> pd.DataFrame:
    return read_txt_file(file_path)

def read_excel_file(file_path: str) -> pd.DataFrame:
    df = pd.read_excel(file_path, dtype=str)
    return df

def read_any_file(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.xlsx', '.xls']:
        return read_excel_file(file_path)
    return read_txt_file(file_path)
