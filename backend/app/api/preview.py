import math
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from ..services.file_reader import (
    read_any_file, detect_encoding, detect_separator,
    detect_mojibake, fix_mojibake_text, detect_header_row, normalize_columns
)
from ..models.schemas import PreviewResponse, PreviewWarning

router = APIRouter(prefix="/api", tags=["Preview"])
UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"


@router.get("/preview/{file_id}", response_model=PreviewResponse)
def preview_file(
    file_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    search: str = Query(default=""),
    form_number: str = Query(default=""),
    head_name: str = Query(default=""),
):
    matched_files = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="الملف غير موجود")

    file_path = matched_files[0]
    ext = file_path.suffix.lower()
    warnings: list = []

    try:
        encoding = detect_encoding(str(file_path)) if ext in ['.txt', '.csv'] else "N/A"
        sep = "N/A"
        header_row_index = None
        header_detection_method = None

        if ext in ['.txt', '.csv']:
            try:
                with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                    sample = f.read(2048)
                    sep = detect_separator(sample)
            except Exception:
                warnings.append(PreviewWarning(type="read_error", message="تعذر تحديد الفاصل بشكل دقيق"))

            h_idx, h_method, h_score = detect_header_row(str(file_path), encoding, sep)
            header_row_index = h_idx
            header_detection_method = h_method

            if h_score < 4:
                warnings.append(PreviewWarning(
                    type="header_not_found",
                    message="لم يتم اكتشاف صف عناوين مطابق. يرجى مراجعة الملف وتأكد من وجود صف عناوين يحتوي الأعمدة الثمانية."
                ))
            elif h_idx > 0:
                warnings.append(PreviewWarning(
                    type="header_detected",
                    message=f"تم اكتشاف صف العناوين في السطر رقم {h_idx + 1} — تم تخطي {h_idx} سطر تمهيدي."
                ))

        # Read full DataFrame (columns already normalised by read_any_file)
        df = read_any_file(str(file_path))
        total_rows = len(df)
        columns = list(df.columns)

        # Validate normalisation worked
        norm_check_cols, norm_status = normalize_columns(columns)
        if norm_status == 'unrecognized':
            warnings.append(PreviewWarning(
                type="columns_unrecognized",
                message="أسماء الأعمدة غير معروفة. يرجى مراجعة الملف والتأكد من وجود عناوين أعمدة صحيحة."
            ))

        # Fix mojibake in cell values — operate on full df efficiently
        def fix_col(series):
            return series.apply(lambda v: fix_mojibake_text(str(v)) if detect_mojibake(str(v)) else str(v))

        was_fixed = False
        for col in df.columns:
            col_str = str(col)
            if df[col_str].apply(lambda v: detect_mojibake(str(v))).any():
                df[col_str] = fix_col(df[col_str])
                was_fixed = True

        df = df.fillna("")

        if was_fixed:
            warnings.append(PreviewWarning(
                type="encoding_repaired",
                message="تم اكتشاف نص عربي مشوّه وتمت محاولة إصلاح الترميز"
            ))

        # ── Apply search filters ─────────────────────────────────────────────
        mask = pd.Series([True] * len(df), index=df.index)

        if search.strip():
            term = search.strip()
            col_mask = pd.Series([False] * len(df), index=df.index)
            for col in df.columns:
                col_mask = col_mask | df[col].str.contains(term, na=False, regex=False)
            mask = mask & col_mask

        if form_number.strip() and 'الاستمارة' in df.columns:
            mask = mask & df['الاستمارة'].str.contains(form_number.strip(), na=False, regex=False)

        if head_name.strip() and 'رب الأسرة' in df.columns:
            mask = mask & df['رب الأسرة'].str.contains(head_name.strip(), na=False, regex=False)

        filtered_df = df[mask]
        filtered_count = len(filtered_df)

        # ── Pagination ───────────────────────────────────────────────────────
        total_pages = max(1, math.ceil(filtered_count / page_size))
        page = min(page, total_pages)
        start = (page - 1) * page_size
        end = start + page_size
        page_df = filtered_df.iloc[start:end]

        preview_rows = page_df.to_dict(orient="records")

        return PreviewResponse(
            file_id=file_id,
            detected_encoding=encoding,
            detected_separator=sep,
            columns=columns,
            row_count=total_rows,
            filtered_count=filtered_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            preview_rows=preview_rows,
            warnings=warnings,
            header_row_index=header_row_index,
            header_detection_method=header_detection_method,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء قراءة الملف: {str(e)}")
