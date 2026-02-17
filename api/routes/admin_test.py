import pytest
import pytest_asyncio
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timedelta
import jwt
from services import auth
from services.auth import encode_token, decode_token, get_current_admin, TokenData
from pytest_mock import MockerFixture, mocker
from models import Admin
from schema import AdminLogin
from beanie import PydanticObjectId, init_beanie
from mongomock_motor import AsyncMongoMockClient

# Mocking SECRET_KEY for tests since it's loaded at module level
TEST_SECRET_KEY = "012588c4754cdeca76c13d53146033cba0717e9df6d9d9cb43a04b9641d572f8"



class TestAuth:
    @pytest_asyncio.fixture(autouse=True)
    async def test_setup(self,mocker: MockerFixture):
        mocker.patch("services.auth.SECRET_KEY", TEST_SECRET_KEY)
        client = AsyncMongoMockClient()
        await init_beanie(database=client.get_database("labshop_test"), document_models=[Admin]) # type: ignore
        

    @pytest.mark.asyncio
    async def test_admin_login_success(self, mocker: MockerFixture):
        
        findone_mock = mocker.patch.object(Admin, "find_one", new_callable=mocker.AsyncMock)
        findone_mock.return_value = Admin(
            id=PydanticObjectId("507f1f77bcf86cd799439011"),
            username="testadmin",
            first_name="Test",
            last_name="Admin",
            password_hash="this_is_password"
        )
            
        checkpw_mock = mocker.patch("bcrypt.checkpw", return_value=True)
        encode_token_mock = mocker.patch("services.auth.encode_token", return_value="mocked_token")
        from routes.admin import admin_login
        resp = await admin_login(
            AdminLogin(
                username="testadmin",
                password="this_is_password"
            )
        )
        findone_mock.assert_called_once_with(Admin.username == "testadmin")
        checkpw_mock.assert_called_once_with(
            "this_is_password".encode("utf-8"),
            "this_is_password".encode("utf-8"),
        )
        encode_token_mock.assert_called_once()
        assert resp == {
            "admin_id": PydanticObjectId("507f1f77bcf86cd799439011"),
            "full_name": "Test Admin",
            "token": "mocked_token"
        }

        findone_mock.reset_mock()
        checkpw_mock.reset_mock()
        encode_token_mock.reset_mock()

    @pytest.mark.asyncio
    async def test_admin_login_invalid_credentials(self, mocker: MockerFixture):
        findone_mock = mocker.patch.object(Admin, "find_one", new_callable=mocker.AsyncMock)
        findone_mock.return_value = None
            
        from routes.admin import admin_login
        with pytest.raises(HTTPException) as exc_info:
            await admin_login(
                AdminLogin(
                    username="nonexistent",
                    password="wrongpassword"
                )
            )
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"
        findone_mock.assert_called_once_with(Admin.username == "nonexistent")
