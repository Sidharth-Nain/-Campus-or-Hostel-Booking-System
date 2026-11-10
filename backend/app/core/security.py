"""Password hashing and JSON Web Token helpers."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Create a one-way password hash for database storage."""

    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check a submitted password against its stored hash."""

    return password_hasher.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    """Create a signed, time-limited token for a user id."""

    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
