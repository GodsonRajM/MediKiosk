"""
Security, Token and Authentication utilities.
Supports Demo Mode with mock tokens and standard JWT validation.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings
from app.core.exceptions import AuthenticationError

ALGORITHM = "HS256"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    # Support Demo Mode bypass tokens
    if settings.DEMO_MODE:
        if token == "demo-patient-token-p001":
            return {"sub": "11111111-1111-1111-1111-111111111111", "role": "patient", "code": "P001"}
        if token == "demo-doctor-token-001":
            return {"sub": "doctor-001-uuid", "role": "doctor", "name": "Dr. V. Rajesh"}
        if token == "demo-admin-token":
            return {"sub": "admin-001-uuid", "role": "admin", "name": "System Administrator"}

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        raise AuthenticationError(f"Invalid or expired credentials: {str(e)}")
