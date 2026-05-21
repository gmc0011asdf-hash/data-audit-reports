#!/usr/bin/env python
"""
Database Import Script
======================
Reads a data file (txt/csv/xlsx), detects encoding and header row,
normalises column names, removes duplicate-header rows and empty rows,
then inserts everything into DATA_AUDIT_DB on localhost\\SALES_DEV.

Usage:
    python scripts/import_to_sql.py "path/to/file.txt"
    python scripts/import_to_sql.py "path/to/file.txt" --name "اسم مجموعة البيانات"
"""

import sys
import os
import argparse
import io

# Force UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add backend to Python path so we can reuse existing services
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.join(_SCRIPT_DIR, '..', 'backend')
sys.path.insert(0, _BACKEND_DIR)

import pyodbc
from app.services.file_reader import (
    read_any_file, detect_encoding, detect_separator, detect_header_row,
    fix_mojibake_text, detect_mojibake
)
from app.services.area_classifier import classify_address

# ── Column mapping: canonical Arabic → database column name ──────────────────
COL_TO_DB = {
    'الاستمارة':  'form_number',
    'رب الأسرة':  'head_name',
    'اسم الزوجة': 'wife_name',
    'اسم الأم':   'mother_name',
    'المحلة':     'district',
    'الزقاق':     'alley',
    'رقم الدار':  'house_number',
    'العنوان':    'raw_address',
}

# Values that indicate a row is a repeated header (should be deleted)
HEADER_MARKER_VALUES = {
    'الاستمارة', 'رقم الاستمارة', 'رب الأسرة', 'رب الاسرة',
    'اسم الزوجة', 'الزوجة', 'اسم الأم', 'اسم الام', 'الأم', 'الام',
    'المحلة', 'الزقاق', 'رقم الدار', 'الدار', 'العنوان', 'المنطقة',
}


def is_duplicate_header_row(row: dict, threshold: int = 3) -> bool:
    """Returns True if this data row looks like a repeated header row."""
    count = sum(1 for v in row.values() if str(v).strip() in HEADER_MARKER_VALUES)
    return count >= threshold


def clean_rows(df) -> list:
    """
    Remove:
      - Repeated header rows
      - Fully empty rows
      - Rows where every cell is NaN/None
    Returns cleaned list of dicts.
    """
    cleaned = []
    skipped_headers = 0
    skipped_empty = 0

    for _, row in df.iterrows():
        row_dict = {col: str(v).strip() for col, v in row.items()}

        # Remove rows that are duplicated headers
        if is_duplicate_header_row(row_dict):
            skipped_headers += 1
            continue

        # Remove fully empty rows
        values = list(row_dict.values())
        if all(v in ('', 'nan', 'None', 'NaN', 'none') for v in values):
            skipped_empty += 1
            continue

        cleaned.append(row_dict)

    print(f"  Removed {skipped_headers} duplicate header rows.")
    print(f"  Removed {skipped_empty} empty rows.")
    return cleaned


def get_connection():
    conn_str = (
        r"DRIVER={SQL Server};"
        r"SERVER=localhost\SALES_DEV;"
        "DATABASE=DATA_AUDIT_DB;"
        "Trusted_Connection=yes;"
    )
    return pyodbc.connect(conn_str)


def main():
    parser = argparse.ArgumentParser(description="Import data file into DATA_AUDIT_DB")
    parser.add_argument("file_path", help="Path to the data file (.txt / .csv / .xlsx)")
    parser.add_argument("--name", default=None, help="Optional dataset name")
    args = parser.parse_args()

    file_path = os.path.abspath(args.file_path)
    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f" Import: {os.path.basename(file_path)}")
    print(f"{'='*60}")

    # ── Detect file properties ────────────────────────────────
    ext = os.path.splitext(file_path)[1].lower()

    if ext in ['.txt', '.csv']:
        encoding = detect_encoding(file_path)
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            sample = f.read(2048)
        sep = detect_separator(sample)
        h_idx, h_method, h_score = detect_header_row(file_path, encoding, sep)
        print(f" Encoding : {encoding}")
        print(f" Separator: {repr(sep)}")
        print(f" Header   : row {h_idx} ({h_method}, score={h_score})")
    else:
        encoding = 'excel'
        sep = 'N/A'

    # ── Read and normalise ────────────────────────────────────
    print("\n Reading file...")
    df = read_any_file(file_path)
    print(f" Rows read: {len(df)}")
    print(f" Columns  : {list(df.columns)}")

    # ── Clean ─────────────────────────────────────────────────
    print("\n Cleaning rows...")
    rows = clean_rows(df)
    print(f" Rows after cleaning: {len(rows)}")

    if not rows:
        print("ERROR: No rows to insert after cleaning.")
        sys.exit(1)

    original_filename = args.name or os.path.basename(file_path)

    # ── Insert into SQL Server ────────────────────────────────
    print("\n Connecting to SQL Server (localhost\\SALES_DEV)...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"ERROR: Cannot connect to SQL Server: {e}")
        sys.exit(1)

    cursor = conn.cursor()

    # Create dataset entry
    cursor.execute(
        "INSERT INTO datasets (original_filename, detected_encoding, detected_separator, row_count) "
        "OUTPUT INSERTED.id VALUES (?, ?, ?, ?)",
        original_filename, encoding, sep, len(rows)
    )
    dataset_id = cursor.fetchone()[0]
    print(f" Dataset created — id={dataset_id}")

    # Insert records in batches of 500
    print(f"\n Inserting {len(rows)} records...")
    inserted = 0
    batch = []
    BATCH_SIZE = 500

    def _val(row_dict, arabic_key):
        v = row_dict.get(arabic_key, '')
        if str(v).strip() in ('', 'nan', 'None', 'NaN', 'none'):
            return None
        return str(v).strip()

    for row_dict in rows:
        raw_addr = _val(row_dict, 'العنوان') or ''
        norm_area, cls, admin_note, rec_status, reason = classify_address(raw_addr)

        batch.append((
            dataset_id,
            _val(row_dict, 'الاستمارة'),   # form_number
            _val(row_dict, 'رب الأسرة'),   # head_name
            _val(row_dict, 'اسم الزوجة'),  # wife_name
            _val(row_dict, 'اسم الأم'),    # mother_name
            _val(row_dict, 'المحلة'),      # district
            _val(row_dict, 'الزقاق'),      # alley
            _val(row_dict, 'رقم الدار'),   # house_number
            raw_addr or None,              # raw_address
            norm_area if norm_area else None,
            cls, rec_status,
            reason if reason else None,
        ))

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(
                "INSERT INTO records "
                "(dataset_id, form_number, head_name, wife_name, mother_name, "
                " district, alley, house_number, raw_address, "
                " normalized_area, address_classification, record_status, classification_reason) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                batch
            )
            inserted += len(batch)
            batch = []
            print(f"  ...{inserted} rows inserted")

    if batch:
        cursor.executemany(
            "INSERT INTO records "
            "(dataset_id, form_number, head_name, wife_name, mother_name, "
            " district, alley, house_number, raw_address, "
            " normalized_area, address_classification, record_status, classification_reason) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            batch
        )
        inserted += len(batch)

    conn.commit()

    # Verify
    cursor.execute("SELECT COUNT(*) FROM records WHERE dataset_id=?", dataset_id)
    db_count = cursor.fetchone()[0]
    conn.close()

    print(f"\n{'='*60}")
    print(f" ✓ Import complete")
    print(f"   dataset_id  : {dataset_id}")
    print(f"   rows in DB  : {db_count}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
