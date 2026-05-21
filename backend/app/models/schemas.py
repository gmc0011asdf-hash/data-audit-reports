from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UploadResponse(BaseModel):
    file_id: str
    original_filename: str
    saved_filename: str
    file_size: int
    message: str

class PreviewWarning(BaseModel):
    type: str
    message: str

class PreviewResponse(BaseModel):
    file_id: str
    detected_encoding: str
    detected_separator: str
    columns: List[str]
    row_count: int
    preview_rows: List[Dict[str, Any]]
    warnings: List[PreviewWarning] = []

class CanonicalRecord(BaseModel):
    form_number: Optional[str] = None
    head_name: Optional[str] = None
    wife_name: Optional[str] = None
    mother_name: Optional[str] = None
    district: Optional[str] = None
    alley: Optional[str] = None
    house_number: Optional[str] = None
    raw_address: Optional[str] = None
    normalized_area: Optional[str] = None
    original_address_variant: Optional[str] = None
    address_classification: str = "needs_review"
    administrative_note: Optional[str] = None
    record_status: str = "needs_review"
    duplicate_key: Optional[str] = None
    classification_reason: Optional[str] = None

class ColumnMapping(BaseModel):
    form_number: Optional[str] = None
    head_name: Optional[str] = None
    wife_name: Optional[str] = None
    mother_name: Optional[str] = None
    district: Optional[str] = None
    alley: Optional[str] = None
    house_number: Optional[str] = None
    raw_address: Optional[str] = None

class MappingApplyRequest(BaseModel):
    file_id: str
    mapping: ColumnMapping

class MappingApplyResponse(BaseModel):
    file_id: str
    mapped_count: int
    records_preview: List[CanonicalRecord]
    warnings: List[PreviewWarning] = []

class AreaStatisticsRow(BaseModel):
    area_name: str
    count: int
    percentage: float

class IssueRow(BaseModel):
    record_index: int
    issue_type: str
    description: str

class StatisticsSummary(BaseModel):
    total_records: int
    valid_areas_count: int
    non_areas_count: int
    empty_records_count: int
    issues_count: int
    top_areas: List[AreaStatisticsRow]
