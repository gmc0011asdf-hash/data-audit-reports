import math
from fastapi import APIRouter, HTTPException, Query
from ..db import get_connection, db_available, build_where_clause

router = APIRouter(prefix="/api", tags=["Records"])


@router.get("/datasets")
def list_datasets():
    """Return all datasets imported into DATA_AUDIT_DB."""
    if not db_available():
        raise HTTPException(
            status_code=503,
            detail="قاعدة البيانات غير متاحة. تأكد من تشغيل SQL Server وتنفيذ سكربت الاستيراد أولاً."
        )
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, original_filename, detected_encoding, detected_separator, "
            "row_count, created_at FROM datasets ORDER BY created_at DESC"
        )
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = str(r["created_at"])
        return {"datasets": rows}
    finally:
        conn.close()


@router.get("/records")
def get_records(
    dataset_id:     int = Query(default=None, description="تصفية حسب مجموعة البيانات"),
    page:           int = Query(default=1,   ge=1),
    page_size:      int = Query(default=100, ge=1, le=500),
    search:         str = Query(default=""),
    form_number:    str = Query(default=""),
    head_name:      str = Query(default=""),
    area:           str = Query(default=""),
    classification: str = Query(default=""),
    status:         str = Query(default=""),
):
    """
    Paginated, searchable records from SQL Server.
    Supports: dataset_id, search, form_number, head_name, area, classification, status.
    """
    if not db_available():
        raise HTTPException(
            status_code=503,
            detail="قاعدة البيانات غير متاحة. تأكد من تشغيل SQL Server وتنفيذ سكربت الاستيراد أولاً."
        )

    where, params = build_where_clause(
        dataset_id=dataset_id, search=search, form_number=form_number,
        head_name=head_name, area=area, classification=classification, status=status
    )

    conn = get_connection()
    try:
        cursor = conn.cursor()

        # ── Count ────────────────────────────────────────────────
        cursor.execute(f"SELECT COUNT(*) FROM records {where}", params)
        total_records = cursor.fetchone()[0]
        total_pages = max(1, math.ceil(total_records / page_size))
        page = min(page, total_pages)

        # ── Fetch page ───────────────────────────────────────────
        offset = (page - 1) * page_size
        query = (
            f"SELECT id, dataset_id, form_number, head_name, wife_name, mother_name, "
            f"district, alley, house_number, raw_address, normalized_area, "
            f"address_classification, record_status, classification_reason "
            f"FROM records {where} "
            f"ORDER BY id "
            f"OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        )
        cursor.execute(query, params + [offset, page_size])

        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]

        for r in rows:
            for k, v in r.items():
                if v is None:
                    r[k] = ""

        return {
            "records":       rows,
            "total_records": total_records,
            "page":          page,
            "page_size":     page_size,
            "total_pages":   total_pages,
        }
    finally:
        conn.close()
