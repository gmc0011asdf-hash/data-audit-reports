import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..services.file_reader import read_any_file, detect_encoding, detect_separator, detect_mojibake, fix_mojibake_text
from ..models.schemas import PreviewResponse, PreviewWarning

router = APIRouter(prefix="/api", tags=["Preview"])

UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"

@router.get("/preview/{file_id}", response_model=PreviewResponse)
def preview_file(file_id: str):
    matched_files = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="الملف غير موجود")
        
    file_path = matched_files[0]
    ext = file_path.suffix.lower()
    
    warnings = []
    
    try:
        encoding = detect_encoding(str(file_path)) if ext in ['.txt', '.csv'] else "N/A"
        
        sep = "N/A"
        if ext in ['.txt', '.csv']:
            try:
                with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                    sample = f.read(2048)
                    sep = detect_separator(sample)
            except Exception:
                warnings.append(PreviewWarning(type="read_error", message="تعذر تحديد الفاصل بشكل دقيق"))

        df = read_any_file(str(file_path))
        
        row_count = len(df)
        columns = list(df.columns)
        
        preview_df = df.head(20).fillna("")
        
        # معالجة mojibake
        was_mojibake_fixed = False
        
        # 1. تنظيف وإصلاح أسماء الأعمدة
        clean_columns = []
        for i, col in enumerate(columns):
            col_str = str(col)
            
            # إصلاح mojibake
            if detect_mojibake(col_str):
                col_str = fix_mojibake_text(col_str)
                was_mojibake_fixed = True
                
            if "Unnamed" in col_str or col_str.strip() == "":
                clean_col = f"عمود_غير_معروف_{i+1}"
                warnings.append(PreviewWarning(
                    type="unnamed_column", 
                    message=f"تم اكتشاف عمود بدون اسم في الفهرس {i+1}"
                ))
            else:
                clean_col = col_str
            clean_columns.append(clean_col)
            
        # تحديث الأعمدة في الـ DataFrame المعروض
        if clean_columns != columns:
            preview_df.columns = clean_columns
            
        preview_rows = preview_df.to_dict(orient="records")
        
        # 2. تنظيف القيم في الصفوف
        fixed_preview_rows = []
        for row in preview_rows:
            fixed_row = {}
            for k, v in row.items():
                val_str = str(v)
                if detect_mojibake(val_str):
                    val_str = fix_mojibake_text(val_str)
                    was_mojibake_fixed = True
                fixed_row[k] = val_str
            fixed_preview_rows.append(fixed_row)

        if was_mojibake_fixed:
            warnings.append(PreviewWarning(
                type="encoding_repaired",
                message="تم اكتشاف نص عربي مشوّه وتمت محاولة إصلاح الترميز"
            ))

        return PreviewResponse(
            file_id=file_id,
            detected_encoding=encoding,
            detected_separator=sep,
            columns=clean_columns,
            row_count=row_count,
            preview_rows=fixed_preview_rows,
            warnings=warnings
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء قراءة الملف: {str(e)}")
