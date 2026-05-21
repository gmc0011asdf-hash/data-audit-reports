import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..services.file_reader import read_any_file, detect_mojibake, fix_mojibake_text
from ..services.mapping_service import dataframe_to_canonical_records, validate_mapping_columns
from ..models.schemas import MappingApplyRequest, MappingApplyResponse, PreviewWarning

router = APIRouter(prefix="/api", tags=["Mapping"])

UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"

@router.post("/mapping/apply", response_model=MappingApplyResponse)
def apply_mapping(request: MappingApplyRequest):
    matched_files = list(UPLOAD_DIR.glob(f"{request.file_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="الملف غير موجود")
        
    file_path = matched_files[0]
    
    warnings = []
    
    try:
        df = read_any_file(str(file_path))
        
        # معالجة موجيبيكي على أسماء الأعمدة إذا وجدت
        clean_columns = []
        for col in df.columns:
            col_str = str(col)
            if detect_mojibake(col_str):
                col_str = fix_mojibake_text(col_str)
            clean_columns.append(col_str)
            
        if clean_columns != list(df.columns):
            df.columns = clean_columns

        # التحقق من صحة الأعمدة المختارة
        is_valid, validation_warnings = validate_mapping_columns(df, request.mapping)
        warnings.extend(validation_warnings)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="بعض الأعمدة المختارة غير موجودة في الملف المرفوع.")

        # معالجة القيم للموجيبيكي في الـ 50 صف الأولى فقط لتسريع المعاينة
        limit = 50
        preview_df = df.head(limit).copy()
        
        for col in preview_df.columns:
            preview_df[col] = preview_df[col].apply(lambda x: fix_mojibake_text(str(x)) if detect_mojibake(str(x)) else x)
            
        records = dataframe_to_canonical_records(preview_df, request.mapping, limit=limit)
        
        return MappingApplyResponse(
            file_id=request.file_id,
            mapped_count=len(records),
            records_preview=records,
            warnings=warnings
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تطبيق الربط: {str(e)}")
