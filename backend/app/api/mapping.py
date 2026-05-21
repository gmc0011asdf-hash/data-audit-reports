import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..services.file_reader import read_any_file, detect_mojibake, fix_mojibake_text
from ..services.mapping_service import dataframe_to_canonical_records, validate_mapping_columns
from ..models.schemas import MappingApplyRequest, MappingApplyResponse, PreviewWarning

router = APIRouter(prefix="/api", tags=["Mapping"])

UPLOAD_DIR    = Path(__file__).parent.parent / "storage" / "uploads"
PROCESSED_DIR = Path(__file__).parent.parent / "storage" / "processed"
PREVIEW_LIMIT = 100   # rows returned in response preview


@router.post("/mapping/apply", response_model=MappingApplyResponse)
def apply_mapping(request: MappingApplyRequest):
    matched_files = list(UPLOAD_DIR.glob(f"{request.file_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="الملف غير موجود")

    file_path = matched_files[0]
    warnings: list = []

    try:
        df = read_any_file(str(file_path))

        # Mojibake repair on column names (already normalised by read_any_file, but double-check)
        clean_columns = []
        for col in df.columns:
            col_str = str(col)
            if detect_mojibake(col_str):
                col_str = fix_mojibake_text(col_str)
            clean_columns.append(col_str)
        if clean_columns != list(df.columns):
            df.columns = clean_columns

        # Validate selected columns exist
        is_valid, validation_warnings = validate_mapping_columns(df, request.mapping)
        warnings.extend(validation_warnings)

        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail="بعض الأعمدة المختارة غير موجودة في الملف المرفوع."
            )

        # Mojibake repair in cell values (full df)
        for col in df.columns:
            df[col] = df[col].apply(
                lambda x: fix_mojibake_text(str(x)) if detect_mojibake(str(x)) else x
            )

        # ── Process ALL rows ─────────────────────────────────────────────────
        all_records = dataframe_to_canonical_records(df, request.mapping, limit=None)
        total = len(all_records)

        # ── Save full result to processed storage ────────────────────────────
        try:
            PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
            save_path = PROCESSED_DIR / f"{request.file_id}_mapped.json"
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump([r.model_dump() for r in all_records], f, ensure_ascii=False)
        except Exception:
            warnings.append(PreviewWarning(
                type="save_warning",
                message="تعذّر حفظ النتائج الكاملة مؤقتًا، لكن المعالجة اكتملت."
            ))

        # Return first PREVIEW_LIMIT rows only
        preview_records = all_records[:PREVIEW_LIMIT]

        if total > PREVIEW_LIMIT:
            warnings.append(PreviewWarning(
                type="preview_only",
                message=f"تم معالجة {total} سجل. يعرض الجدول أول {PREVIEW_LIMIT} سجل فقط للمعاينة."
            ))

        return MappingApplyResponse(
            file_id=request.file_id,
            mapped_count=total,
            records_preview=preview_records,
            warnings=warnings,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تطبيق الربط: {str(e)}")
