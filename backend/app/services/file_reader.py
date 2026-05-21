import chardet
import pandas as pd
import os
from typing import Optional

# ── Canonical Column Map ─────────────────────────────────────────────────────
# Maps every known variant → one of the 8 canonical display names
CANONICAL_COLUMN_MAP = {
    # الاستمارة
    'رقم الاستمارة': 'الاستمارة', 'الاستمارة': 'الاستمارة',
    'رقم استمارة': 'الاستمارة',
    # رب الأسرة
    'رب الأسرة': 'رب الأسرة', 'رب الاسرة': 'رب الأسرة',
    'اسم رب الأسرة': 'رب الأسرة', 'اسم رب الاسرة': 'رب الأسرة',
    # اسم الزوجة
    'اسم الزوجة': 'اسم الزوجة', 'الزوجة': 'اسم الزوجة',
    # اسم الأم
    'اسم الأم': 'اسم الأم', 'اسم الام': 'اسم الأم',
    'الأم': 'اسم الأم', 'الام': 'اسم الأم',
    # المحلة
    'المحلة': 'المحلة', 'محلة': 'المحلة',
    # الزقاق
    'الزقاق': 'الزقاق', 'زقاق': 'الزقاق',
    # رقم الدار
    'رقم الدار': 'رقم الدار', 'الدار': 'رقم الدار',
    # العنوان
    'العنوان': 'العنوان', 'المنطقة': 'العنوان',
    'العنوان / المنطقة': 'العنوان', 'عنوان': 'العنوان',
}

CANONICAL_8 = frozenset(CANONICAL_COLUMN_MAP.values())

# ── Mojibake helpers ─────────────────────────────────────────────────────────

def detect_mojibake(value: str) -> bool:
    if not isinstance(value, str):
        return False
    for char in ('Ø', 'Ù', 'æ', 'ß', 'Ç', 'È', 'É', 'Ê', 'Ë'):
        if char in value:
            return True
    return False

def fix_mojibake_text(value: str) -> str:
    if not isinstance(value, str):
        return value
    try:
        return value.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    except Exception:
        return value

# ── Encoding / Separator ─────────────────────────────────────────────────────

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

# ── Column Normalisation ─────────────────────────────────────────────────────

def normalize_columns(raw_columns: list) -> tuple:
    """
    Map raw file column names → canonical 8 names where possible.

    Returns:
        (normalized_list, status)
        status: 'normalized' | 'partial' | 'unrecognized'
    """
    cleaned = []
    for col in raw_columns:
        c = str(col).strip()
        if detect_mojibake(c):
            c = fix_mojibake_text(c)
        cleaned.append(c)

    # Count how many cells match a known canonical column
    hits = sum(1 for c in cleaned if c in CANONICAL_COLUMN_MAP)

    if hits < 4:
        # Not enough canonical matches — likely wrong header row or unknown format
        fallback = [f"عمود_غير_معروف_{i+1}" for i in range(len(raw_columns))]
        return fallback, 'unrecognized'

    seen: dict = {}
    result = []
    for i, col in enumerate(cleaned):
        canonical = CANONICAL_COLUMN_MAP.get(col, col)
        if canonical in CANONICAL_8:
            if canonical not in seen:
                seen[canonical] = True
                result.append(canonical)
            else:
                result.append(f"عمود_مكرر_{i+1}")
        elif not col or "Unnamed" in col:
            result.append(f"عمود_غير_معروف_{i+1}")
        else:
            result.append(col)

    status = 'normalized' if hits >= len(CANONICAL_8) - 1 else 'partial'
    return result, status

# ── Header Detection ─────────────────────────────────────────────────────────

def detect_header_row(file_path: str, encoding: str, sep: str) -> tuple:
    """
    Scans up to 50 rows for the actual header row.
    A valid header row must have ≥ 4 cells that match known canonical column names.

    Returns: (header_row_index, detection_method, score)
    """
    try:
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            raw_rows = []
            for i, line in enumerate(f):
                if i >= 50:
                    break
                raw_rows.append(line.rstrip('\n\r'))

        best_idx = 0
        best_score = 0

        for idx, line in enumerate(raw_rows):
            cells = [c.strip() for c in line.split(sep)]
            # Repair mojibake before checking
            cells_clean = [fix_mojibake_text(c) if detect_mojibake(c) else c for c in cells]
            score = sum(1 for c in cells_clean if c in CANONICAL_COLUMN_MAP)
            if score > best_score:
                best_score = score
                best_idx = idx

        if best_score >= 4:
            return best_idx, 'keyword_detection', best_score

        return 0, 'default', best_score

    except Exception:
        return 0, 'default', 0

# ── Label-Inline Format Helpers ──────────────────────────────────────────────
# Some files embed the field labels in columns 0-7 of EVERY row,
# with the actual data in columns 8-15.
# Example row: [الاستمارة, رب الأسرة, ..., العنوان, 1001, محمد علي, ...]

CANONICAL_ORDER = [
    'الاستمارة', 'رب الأسرة', 'اسم الزوجة', 'اسم الأم',
    'المحلة', 'الزقاق', 'رقم الدار', 'العنوان'
]


def _check_label_inline(file_path: str, encoding: str, sep: str) -> bool:
    """
    Returns True if the file uses label-inline format:
    each row has 16+ cells where cells 0-7 are canonical field labels
    and cells 8-15 are the actual data values.
    """
    try:
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            lines = [f.readline() for _ in range(5)]

        consistent_labels: set = set()
        for line in lines[:3]:
            cells = [c.strip() for c in line.rstrip('\n\r').split(sep)]
            if len(cells) < 16:
                return False
            # Fix mojibake in cells before checking
            cells_clean = [fix_mojibake_text(c) if detect_mojibake(c) else c for c in cells]
            label_tuple = tuple(cells_clean[:8])
            consistent_labels.add(label_tuple)

        if len(consistent_labels) != 1:
            return False  # Labels are not constant across rows

        labels = list(consistent_labels)[0]
        matches = sum(1 for lbl in labels if lbl in CANONICAL_COLUMN_MAP)
        return matches >= 4

    except Exception:
        return False


def _read_label_inline(file_path: str, encoding: str, sep: str) -> pd.DataFrame:
    """
    Read a label-inline file.
    Returns DataFrame with canonical 8 column names and data from cols 8-15.
    """
    try:
        df_raw = pd.read_csv(
            file_path, sep=sep, encoding=encoding,
            header=None, dtype=str, on_bad_lines='skip'
        )
    except Exception:
        fallback_enc = 'utf-8' if encoding == 'cp1256' else 'cp1256'
        df_raw = pd.read_csv(
            file_path, sep=sep, encoding=fallback_enc,
            header=None, dtype=str, on_bad_lines='skip'
        )

    # Data is in columns 8-15
    n = len(df_raw.columns)
    data_idx = list(range(8, min(16, n)))
    df_data = df_raw.iloc[:, data_idx].copy()
    df_data.columns = CANONICAL_ORDER[:len(data_idx)]
    return df_data


# ── File Reading ─────────────────────────────────────────────────────────────

def read_txt_file(file_path: str) -> pd.DataFrame:
    encoding = detect_encoding(file_path)
    with open(file_path, 'r', encoding=encoding, errors='replace') as f:
        sample = f.read(2048)
        f.seek(0)
        sep = detect_separator(sample)

    # ── Check for label-inline format FIRST ──────────────────
    if _check_label_inline(file_path, encoding, sep):
        return _read_label_inline(file_path, encoding, sep)

    # ── Standard format: detect header row ───────────────────
    header_idx, _, _ = detect_header_row(file_path, encoding, sep)

    try:
        df = pd.read_csv(
            file_path, sep=sep, encoding=encoding, dtype=str,
            on_bad_lines='skip', skiprows=header_idx, header=0
        )
    except Exception:
        fallback_enc = 'utf-8' if encoding == 'cp1256' else 'cp1256'
        df = pd.read_csv(
            file_path, sep=sep, encoding=fallback_enc, dtype=str,
            on_bad_lines='skip', skiprows=header_idx, header=0
        )

    # Normalise column names in-place
    norm_cols, _ = normalize_columns(list(df.columns))
    df.columns = norm_cols
    return df

def read_csv_file(file_path: str) -> pd.DataFrame:
    return read_txt_file(file_path)

def read_excel_file(file_path: str) -> pd.DataFrame:
    df = pd.read_excel(file_path, dtype=str)
    norm_cols, _ = normalize_columns(list(df.columns))
    df.columns = norm_cols
    return df

def read_any_file(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.xlsx', '.xls']:
        return read_excel_file(file_path)
    return read_txt_file(file_path)
