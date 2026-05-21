import pandas as pd
from typing import List, Tuple, Optional
from ..models.schemas import ColumnMapping, CanonicalRecord, PreviewWarning

def validate_mapping_columns(df: pd.DataFrame, mapping: ColumnMapping) -> Tuple[bool, List[PreviewWarning]]:
    """التحقق من أن الأعمدة المختارة موجودة فعلياً في الملف"""
    warnings = []
    is_valid = True
    
    mapping_dict = mapping.model_dump(exclude_none=True)
    file_columns = list(df.columns)
    
    # الأعمدة الأساسية التي يجب توفرها
    required_fields = ['form_number', 'head_name', 'raw_address']
    
    for canonical_field, file_column in mapping_dict.items():
        if file_column and file_column not in file_columns:
            warnings.append(PreviewWarning(
                type="missing_column",
                message=f"العمود المختار '{file_column}' غير موجود في الملف الأصلي."
            ))
            is_valid = False
            
    for req_field in required_fields:
        if req_field not in mapping_dict or not mapping_dict[req_field]:
            warnings.append(PreviewWarning(
                type="missing_required_field",
                message=f"حقل '{req_field}' أساسي ويفضل اختياره لضمان جودة البيانات."
            ))
            # لا نوقف العملية ولكن نعطي تحذيراً

    return is_valid, warnings

def dataframe_to_canonical_records(df: pd.DataFrame, mapping: ColumnMapping, limit: Optional[int] = None) -> List[CanonicalRecord]:
    """تأخذ DataFrame وتحوّل الصفوف إلى نموذج CanonicalRecord. إذا limit=None تُعالج كل الصفوف."""
    records = []

    process_df = df if limit is None else df.head(limit)
    preview_df = process_df.fillna("")
    
    # تحويل الربط إلى قاموس، واستبعاد الحقول الفارغة
    mapping_dict = mapping.model_dump(exclude_none=True)
    
    for _, row in preview_df.iterrows():
        record_data = {}
        
        # ربط القيم
        for canonical_field, file_column in mapping_dict.items():
            if file_column and file_column in row:
                record_data[canonical_field] = str(row[file_column]).strip()
                
        # تعيين النسخة الأصلية للعنوان قبل أي تعديلات (احتياطياً)
        if 'raw_address' in record_data:
            record_data['original_address_variant'] = record_data['raw_address']
            
        record = CanonicalRecord(**record_data)
        records.append(record)
        
    return records
