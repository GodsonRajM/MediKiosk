"""
Structured, Privacy-Preserving Logger.
Explicitly avoids logging PHI (Protected Health Information), raw clinical text,
voice streams, or secrets.
"""
import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any, Dict


class SafeJsonFormatter(logging.Formatter):
    """Formats logs as JSON while sanitizing sensitive healthcare data fields."""

    SENSITIVE_KEYS = {
        "password", "secret", "token", "api_key", "raw_answer",
        "audio_base64", "file_data", "ocr_text", "abha_id"
    }

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include safe extra metadata if present
        if hasattr(record, "metadata") and isinstance(record.metadata, dict):
            safe_meta = {}
            for k, v in record.metadata.items():
                if k.lower() in self.SENSITIVE_KEYS:
                    safe_meta[k] = "[REDACTED_PHI_OR_SECRET]"
                else:
                    safe_meta[k] = v
            log_obj["metadata"] = safe_meta

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logger(name: str = "medikiosk") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(SafeJsonFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    return logger


logger = setup_logger()
