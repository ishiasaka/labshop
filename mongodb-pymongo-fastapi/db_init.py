#!/usr/bin/env python3
"""
Create MongoDB collections with JSON Schema validators and indexes

Usage:
  Set `MONGODB_URL` (and optionally `MONGODB_DB`) environment variables, then run:
    python db_init.py

This script is idempotent: it will create collections if missing and will attempt
to update validators via the `collMod` command when collections already exist.
"""
from __future__ import annotations

import os
import sys
from typing import Dict

from pymongo import MongoClient, errors


def get_db():
    url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB", "labshop")
    client = MongoClient(url)
    return client[db_name]


def create_or_update_validator(db, name: str, validator: Dict):
    try:
        db.create_collection(name, validator=validator, validationLevel="moderate")
        print(f"Created collection: {name}")
    except errors.CollectionInvalid:
        # Already exists -> try to update validator
        try:
            db.command("collMod", name, validator=validator, validationLevel="moderate")
            print(f"Updated validator for collection: {name}")
        except Exception as e:
            print(f"Could not modify collection validator for {name}: {e}")


def ensure_indexes(db):
    # user.id unique
    db.user.create_index([("id", 1)], unique=True, name="user_id_uidx")
    # ic_card primary id and uid unique
    db.ic_card.create_index([("id", 1)], unique=True, name="ic_card_id_uidx")
    db.ic_card.create_index([("uid", 1)], unique=False, name="ic_card_uid_idx")
    db.ic_card.create_index([("student_id", 1)], name="ic_card_student_idx")
    # admin
    db.admin.create_index([("id", 1)], unique=True, name="admin_id_uidx")
    # admin_log
    db.admin_log.create_index([("id", 1)], unique=True, name="admin_log_id_uidx")
    db.admin_log.create_index([("admin_id", 1)], name="admin_log_admin_idx")
    db.admin_log.create_index([("targeted_student_id", 1)], name="admin_log_targeted_idx")
    # shelf primary key is string id
    db.shelf.create_index([("id", 1)], unique=True, name="shelf_id_uidx")
    # purchase/payment
    db.purchase.create_index([("id", 1)], unique=True, name="purchase_id_uidx")
    db.purchase.create_index([("student_id", 1)], name="purchase_student_idx")
    db.payment.create_index([("id", 1)], unique=True, name="payment_id_uidx")
    db.payment.create_index([("student_id", 1)], name="payment_student_idx")
    # system_setting primary key
    db.system_setting.create_index([("key", 1)], unique=True, name="system_setting_key_uidx")


def main():
    db = get_db()

    # Validators based on provided schema
    user_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "first_name", "last_name", "account_balance", "created_at", "updated_at", "status"],
            "properties": {
                "id": {"bsonType": "long"},
                "first_name": {"bsonType": "string"},
                "last_name": {"bsonType": "string"},
                "account_balance": {"bsonType": "int"},
                "created_at": {"bsonType": "date"},
                "updated_at": {"bsonType": "date"},
                "status": {"enum": ["active", "suspended", "graduated", "off_boarded"]},
            },
        }
    }

    ic_card_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "uid", "student_id", "status", "created_at"],
            "properties": {
                "id": {"bsonType": "long"},
                "uid": {"bsonType": "string"},
                "student_id": {"bsonType": "long"},
                "status": {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
            },
        }
    }

    admin_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "first_name", "last_name", "password_hash", "role"],
            "properties": {
                "id": {"bsonType": "int"},
                "first_name": {"bsonType": "string"},
                "last_name": {"bsonType": "string"},
                "password_hash": {"bsonType": "string"},
                "role": {"bsonType": "string"},
            },
        }
    }

    admin_log_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "admin_id", "action"],
            "properties": {
                "id": {"bsonType": "long"},
                "admin_id": {"bsonType": "int"},
                "action": {"bsonType": "string"},
                "targeted_student_id": {"bsonType": "long"},
            },
        }
    }

    shelf_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "price"],
            "properties": {
                "id": {"bsonType": "string"},
                "price": {"bsonType": "int"},
            },
        }
    }

    purchase_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "student_id", "shelf_id", "price", "status", "created_at"],
            "properties": {
                "id": {"bsonType": "long"},
                "student_id": {"bsonType": "long"},
                "shelf_id": {"bsonType": "string"},
                "price": {"bsonType": "int"},
                "status": {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
            },
        }
    }

    payment_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["id", "student_id", "amount_paid", "status", "created_at"],
            "properties": {
                "id": {"bsonType": "long"},
                "student_id": {"bsonType": "long"},
                "amount_paid": {"bsonType": "int"},
                "status": {"bsonType": "string"},
                "external_transaction_id": {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
            },
        }
    }

    system_setting_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["key", "value"],
            "properties": {"key": {"bsonType": "string"}, "value": {"bsonType": "string"}},
        }
    }

    collections = [
        ("user", user_validator),
        ("ic_card", ic_card_validator),
        ("admin", admin_validator),
        ("admin_log", admin_log_validator),
        ("shelf", shelf_validator),
        ("purchase", purchase_validator),
        ("payment", payment_validator),
        ("system_setting", system_setting_validator),
    ]

    for name, validator in collections:
        print(f"Ensuring collection: {name}")
        create_or_update_validator(db, name, validator)

    print("Ensuring indexes...")
    ensure_indexes(db)
    print("Done.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Fatal error: {exc}")
        sys.exit(2)
