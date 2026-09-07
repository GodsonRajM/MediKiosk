"""
Clinical Input Validation and Boundary Checking.
"""
from typing import Optional, Dict, Any


def validate_vital_ranges(vital_name: str, value: float) -> Dict[str, Any]:
    """Validates patient-reported or OCR-extracted vital sign boundaries."""
    limits = {
        "heart_rate": (30, 240),
        "systolic_bp": (50, 280),
        "diastolic_bp": (30, 180),
        "spo2": (50, 100),
        "temperature_f": (92.0, 108.0),
        "blood_sugar": (20, 1000)
    }
    
    if vital_name in limits:
        low, high = limits[vital_name]
        is_valid = low <= value <= high
        return {
            "valid": is_valid,
            "low": low,
            "high": high,
            "warning": None if is_valid else f"{vital_name} value {value} is outside plausible physiological range ({low}-{high})"
        }
    return {"valid": True, "warning": None}
