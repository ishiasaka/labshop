from beanie import init_beanie, PydanticObjectId
import argparse
from datetime import datetime, timezone
from dotenv import load_dotenv
from services.auth import encode_token, TokenData
import os



def main():
    now = datetime.now(timezone.utc)
    argumentParser = argparse.ArgumentParser(description="Generate an development admin token")
    argumentParser.add_argument("--username", required=True, help="Admin username")
    argumentParser.add_argument("--id", help="Admin ID", default=str(PydanticObjectId()))
    argumentParser.add_argument("--name", help="Admin name", default=f"Admin_{now}")

    args = argumentParser.parse_args()
    print(f"Generating token for admin {args.username} with ID {args.id} and name {args.name}")
    token_data = encode_token(
        TokenData(
            id=args.id,
            username=args.username,
            full_name=args.name
        )
    )
    print(token_data)

if __name__ == "__main__":
    load_dotenv()
    main()
