import chardet
import pandas as pd
import csv

def detect_encoding(file_path: str) -> str:
    with open(file_path, 'rb') as f:
        raw_data = f.read(10000)
    result = chardet.detect(raw_data)
    encoding = result['encoding']
    if encoding and encoding.lower().startswith('windows-1256'):
        return 'cp1256'
    return encoding or 'utf-8'

def detect_separator(sample_text: str) -> str:
    if '\t' in sample_text:
        return '\t'
    if ',' in sample_text:
        return ','
    if ';' in sample_text:
        return ';'
    return '\t'

def read_txt_file(file_path: str) -> list[dict]:
    encoding = detect_encoding(file_path)
    with open(file_path, 'r', encoding=encoding) as f:
        sample = f.read(2048)
        f.seek(0)
        sep = detect_separator(sample)
        
    df = pd.read_csv(file_path, sep=sep, encoding=encoding, dtype=str)
    return df.to_dict('records')

def read_csv_file(file_path: str) -> list[dict]:
    return read_txt_file(file_path)

def read_excel_file(file_path: str) -> list[dict]:
    df = pd.read_excel(file_path, dtype=str)
    return df.to_dict('records')

def read_any_file(file_path: str) -> list[dict]:
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        return read_excel_file(file_path)
    return read_txt_file(file_path)
