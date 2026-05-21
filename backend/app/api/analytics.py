import math
from fastapi import APIRouter, HTTPException, Query
from ..db import get_connection, db_available, build_where_clause

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/analytics/summary")
def get_analytics_summary(
    dataset_id:     int = Query(default=None),
    search:         str = Query(default=""),
    form_number:    str = Query(default=""),
    head_name:      str = Query(default=""),
    area:           str = Query(default=""),
    classification: str = Query(default=""),
    status:         str = Query(default=""),
):
    """
    Returns classification/status summaries and area distribution
    for the given filter parameters — all computed from SQL.
    """
    if not db_available():
        raise HTTPException(
            status_code=503,
            detail="قاعدة البيانات غير متاحة."
        )

    where, params = build_where_clause(
        dataset_id=dataset_id, search=search, form_number=form_number,
        head_name=head_name, area=area, classification=classification, status=status
    )

    conn = get_connection()
    try:
        cur = conn.cursor()

        # ── Total ────────────────────────────────────────────────
        cur.execute(f"SELECT COUNT(*) FROM records {where}", params)
        total = cur.fetchone()[0]

        # ── Classification breakdown ─────────────────────────────
        cur.execute(
            f"SELECT address_classification, COUNT(*) FROM records {where} "
            f"GROUP BY address_classification",
            params
        )
        cls_raw = {row[0]: row[1] for row in cur.fetchall()}
        classification_summary = {
            "area":         cls_raw.get("area",         0),
            "empty":        cls_raw.get("empty",        0),
            "non_area":     cls_raw.get("non_area",     0),
            "needs_review": cls_raw.get("needs_review", 0),
        }

        # ── Status breakdown ─────────────────────────────────────
        cur.execute(
            f"SELECT record_status, COUNT(*) FROM records {where} "
            f"GROUP BY record_status",
            params
        )
        status_raw = {row[0]: row[1] for row in cur.fetchall()}
        status_summary = {
            "complete":     status_raw.get("complete",     0),
            "incomplete":   status_raw.get("incomplete",   0),
            "needs_review": status_raw.get("needs_review", 0),
        }

        # ── Area distribution (where records ARE classified as area) ─
        # Include WHERE conditions PLUS the area filter already applied
        area_conds = list(params)  # copy
        area_where_extra = where + (" AND " if where else "WHERE ")
        area_where_extra += "address_classification = 'area' AND normalized_area IS NOT NULL AND normalized_area <> ''"

        cur.execute(
            f"SELECT normalized_area, COUNT(*) as cnt FROM records "
            f"{area_where_extra} "
            f"GROUP BY normalized_area ORDER BY cnt DESC",
            area_conds
        )
        area_distribution = [
            {"area_name": row[0], "count": row[1]}
            for row in cur.fetchall()
        ]

        top_areas = area_distribution[:10]

        # ── Review records count ─────────────────────────────────
        review_where, review_params = build_where_clause(
            dataset_id=dataset_id, search=search, form_number=form_number,
            head_name=head_name, area=area, classification=classification, status=status
        )
        needs_review_clause = (
            review_where + " AND record_status = 'needs_review'"
            if review_where
            else "WHERE record_status = 'needs_review'"
        )
        cur.execute(f"SELECT COUNT(*) FROM records {needs_review_clause}", review_params)
        review_records_count = cur.fetchone()[0]

        # ── Distinct areas for dropdown ──────────────────────────
        cur.execute(
            "SELECT DISTINCT normalized_area FROM records "
            "WHERE address_classification='area' AND normalized_area IS NOT NULL AND normalized_area<>'' "
            "ORDER BY normalized_area"
        )
        distinct_areas = [row[0] for row in cur.fetchall()]

        return {
            "total_records":          total,
            "classification_summary": classification_summary,
            "status_summary":         status_summary,
            "area_distribution":      area_distribution,
            "top_areas":              top_areas,
            "review_records_count":   review_records_count,
            "distinct_areas":         distinct_areas,
        }

    finally:
        conn.close()
