"""Promote an existing CampusFlow account to administrator from the terminal."""

import argparse
import sys
from pathlib import Path

from sqlalchemy import select


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIRECTORY))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import User, UserRole  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Promote an existing registered CampusFlow user to administrator."
    )
    parser.add_argument("email", help="Email address of the registered account")
    arguments = parser.parse_args()
    normalized_email = arguments.email.strip().lower()

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as database:
        user = database.scalar(select(User).where(User.email == normalized_email))
        if user is None:
            raise SystemExit(
                f"No account found for {normalized_email}. Register it through the API first."
            )
        if user.role == UserRole.ADMIN:
            print(f"{normalized_email} is already an administrator.")
            return

        user.role = UserRole.ADMIN
        database.commit()
        print(f"Promoted {normalized_email} to administrator.")


if __name__ == "__main__":
    main()
