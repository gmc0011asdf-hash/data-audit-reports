#!/usr/bin/env python
"""
Classify SQL Records
====================
Reads records from DATA_AUDIT_DB, applies classify_address on raw_address,
and updates: normalized_area, address_classification, record_status, classification_reason.

Usage:
    python scripts/classify_sql_records.py
    python scripts/classify_sql_records.py --dataset-id 1
"""

import sys, os, io, argparse

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.join(_SCRIPT_DIR, '..', 'backend')
sys.path.insert(0, _BACKEND_DIR)

import pyodbc
from app.services.area_classifier import classify_address

CONN_STR = r"DRIVER={SQL Server};SERVER=localhost\SALES_DEV;DATABASE=DATA_AUDIT_DB;Trusted_Connection=yes;"
BATCH_SIZE = 500


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-id", type=int, default=None, help="Classify only this dataset")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(" Classify SQL Records")
    print(f"{'='*60}")

    conn = pyodbc.connect(CONN_STR)
    cursor = conn.cursor()

    # Count
    if args.dataset_id:
        cursor.execute("SELECT COUNT(*) FROM records WHERE dataset_id=?", args.dataset_id)
    else:
        cursor.execute("SELECT COUNT(*) FROM records")
    total = cursor.fetchone()[0]
    print(f" Total records   : {total}")

    if total == 0:
        print(" Nothing to classify.")
        conn.close()
        return

    # Load all records (id + raw_address)
    if args.dataset_id:
        cursor.execute("SELECT id, raw_address FROM records WHERE dataset_id=?", args.dataset_id)
    else:
        cursor.execute("SELECT id, raw_address FROM records")

    all_rows = cursor.fetchall()
    print(f" Classifying {len(all_rows)} records...\n")

    batch: list = []
    classified = 0

    for rec_id, raw_address in all_rows:
        raw = str(raw_address or '').strip()
        norm_area, cls, admin_note, rec_status, reason = classify_address(raw)

        batch.append((
            norm_area if norm_area else None,
            cls, rec_status,
            reason if reason else None,
            rec_id
        ))

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(
                "UPDATE records SET normalized_area=?, address_classification=?, "
                "record_status=?, classification_reason=? WHERE id=?",
                batch
            )
            classified += len(batch)
            batch = []
            print(f"  ...{classified} records classified")

    if batch:
        cursor.executemany(
            "UPDATE records SET normalized_area=?, address_classification=?, "
            "record_status=?, classification_reason=? WHERE id=?",
            batch
        )
        classified += len(batch)

    conn.commit()

    # Summary
    cursor.execute(
        "SELECT address_classification, COUNT(*) FROM records "
        + ("WHERE dataset_id=?" if args.dataset_id else "")
        + " GROUP BY address_classification ORDER BY COUNT(*) DESC",
        *([args.dataset_id] if args.dataset_id else [])
    )
    print(f"\n{'='*60}")
    print(f" ✓ Classification complete — {classified} records updated\n")
    print(" Distribution (address_classification):")
    for cls, cnt in cursor.fetchall():
        print(f"   {str(cls):<25} : {cnt:>6}")

    cursor.execute(
        "SELECT COUNT(*) FROM records WHERE address_classification IS NULL"
        + (" AND dataset_id=?" if args.dataset_id else ""),
        *([args.dataset_id] if args.dataset_id else [])
    )
    null_count = cursor.fetchone()[0]
    print(f"\n Unclassified remaining: {null_count}  (should be 0)")
    print(f"{'='*60}\n")

    conn.close()


if __name__ == '__main__':
    main()
