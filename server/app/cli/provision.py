"""
CLI tool for secure initial platform administrator and organisation provisioning.
Usage:
    python -m app.cli.provision --admin-email admin@qualitrust.ai --admin-password <password>
"""

import sys
import argparse
from app.database.session import SessionLocal
from app.services.user_service import create_user
from app.models.organisation import Organisation


def main():
    parser = argparse.ArgumentParser(description="QualiTrust AI Provisioning Tool")
    parser.add_argument("--admin-email", required=True, help="Platform Admin email")
    parser.add_argument("--admin-password", required=True, help="Platform Admin password")
    parser.add_argument("--admin-name", default="Platform Admin", help="Admin full name")

    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = create_user(
            db=db,
            email=args.admin_email,
            password=args.admin_password,
            role="PLATFORM_ADMIN",
            organisation_id=None,
            full_name=args.admin_name,
        )
        print(f"Successfully provisioned platform admin: {user.email} (ID: {user.id})")
    except Exception as exc:
        print(f"Provisioning error: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

