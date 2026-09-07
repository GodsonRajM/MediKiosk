"""
Centralized Domain Exceptions and Exception Handlers.
Prevents internal stack trace leakage to patients and kiosk clients.
"""
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.logging import logger


class MediKioskException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class PatientNotFoundError(MediKioskException):
    def __init__(self, message: str = "Patient record not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="PATIENT_NOT_FOUND"
        )


class AccessDeniedError(MediKioskException):
    def __init__(self, message: str = "Access to patient record is denied. Active doctor-patient authorization required."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="ACCESS_DENIED"
        )


class ConsentRequiredError(MediKioskException):
    def __init__(self, consent_type: str):
        super().__init__(
            message=f"Consent for '{consent_type}' has not been granted by the patient.",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="CONSENT_REQUIRED",
            details={"consent_type": consent_type}
        )


class AuthenticationError(MediKioskException):
    def __init__(self, message: str = "Authentication failed or token invalid"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED"
        )


class DocumentProcessingError(MediKioskException):
    def __init__(self, message: str = "Document processing failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="DOCUMENT_PROCESSING_FAILED"
        )


async def medikiosk_exception_handler(request: Request, exc: MediKioskException) -> JSONResponse:
    logger.warning(f"Handled application exception: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning(f"Request validation error on {request.url.path}: {exc.errors()}")
    # Format cleaner error message
    first_error = exc.errors()[0] if exc.errors() else {}
    msg = first_error.get("msg", "Invalid request parameters")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": f"Validation Error: {msg}",
            "error_code": "VALIDATION_ERROR",
            "details": {"errors": exc.errors()}
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "An unexpected error occurred. Please contact the clinical administrator.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )
