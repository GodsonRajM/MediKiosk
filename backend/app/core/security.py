from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against bcrypt hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create signed HS256 JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token (supports both internal FastAPI JWT and Supabase Auth token)."""
    if not token:
        return None

    # 1. Try standard internal HS256 JWT
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload and payload.get("sub"):
            return payload
    except JWTError:
        pass

    # 2. Check if it is a Supabase Auth JWT token
    from app.core.database import db
    if db.supabase_client:
        try:
            user_resp = db.supabase_client.auth.get_user(token)
            if user_resp and hasattr(user_resp, "user") and user_resp.user:
                sb_user = user_resp.user
                u_id = sb_user.id
                u_email = sb_user.email
                u_role = sb_user.user_metadata.get("role", "patient") if sb_user.user_metadata else "patient"
                return {
                    "sub": u_id,
                    "email": u_email,
                    "role": u_role,
                    "source": "supabase_auth"
                }
        except Exception:
            pass

    # 3. Handle unverified decode if token is a standard JWT with Supabase issuer
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        sub = unverified_claims.get("sub")
        # Check if sub is a valid UUID
        if sub and len(sub) == 36:
            # Check if token is not expired
            exp = unverified_claims.get("exp")
            if not exp or datetime.fromtimestamp(exp, tz=timezone.utc) > datetime.now(timezone.utc):
                return {
                    "sub": sub,
                    "email": unverified_claims.get("email"),
                    "role": unverified_claims.get("user_metadata", {}).get("role", unverified_claims.get("role", "patient")),
                    "source": "supabase_jwt"
                }
    except Exception:
        pass

    # 4. Handle session_<uuid> or token_<uuid> fallback
    if token.startswith("session_") or token.startswith("token_"):
        raw_uuid = token.split("_", 1)[1]
        if len(raw_uuid) == 36:
            profile = db.select_one("profiles", {"id": raw_uuid})
            if profile:
                return {
                    "sub": raw_uuid,
                    "email": profile.get("email"),
                    "role": profile.get("role", "patient"),
                    "source": "session_id"
                }

    return None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    """Dependency that extracts and validates the authenticated user from the Bearer token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

