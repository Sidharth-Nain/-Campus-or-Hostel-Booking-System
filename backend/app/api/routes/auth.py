"""Registration, login, and current-user API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead


router = APIRouter(prefix="/auth")
DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register a student")
def register(payload: RegisterRequest, database: DatabaseSession) -> User:
    """Create a new student account with a securely hashed password."""

    normalized_email = str(payload.email).lower()
    existing_user = database.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already uses this email.")

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
    )
    database.add(user)
    database.commit()
    database.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse, summary="Log in")
def login(payload: LoginRequest, database: DatabaseSession) -> TokenResponse:
    """Verify credentials and issue a bearer token."""

    normalized_email = str(payload.email).lower()
    user = database.scalar(select(User).where(User.email == normalized_email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserRead, summary="Get the current user")
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return the safe profile of the user represented by the bearer token."""

    return current_user
