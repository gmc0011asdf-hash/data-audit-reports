from typing import List
from ..models.schemas import CanonicalRecord
from .area_classifier import classify_address

def classify_canonical_records(records: List[CanonicalRecord]) -> List[CanonicalRecord]:
    for record in records:
        raw_addr = record.raw_address
        
        norm_area, cls, note, status, reason = classify_address(raw_addr)
        
        record.normalized_area = norm_area
        record.address_classification = cls
        record.administrative_note = note
        record.record_status = status
        record.classification_reason = reason
        
    return records
