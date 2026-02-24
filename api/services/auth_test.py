import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timedelta
import jwt
from services import auth
from services.auth import encode_token, decode_token, get_current_admin, TokenData
from pytest_mock import MockerFixture

# Mocking SECRET_KEY for tests since it's loaded at module level
TEST_SECRET_KEY = "012588c4754cdeca76c13d53146033cba0717e9df6d9d9cb43a04b9641d572f8"

@pytest.fixture(autouse=True)
def mock_secret_key(mocker: MockerFixture):
    mocker.patch("os.getenv", return_value=TEST_SECRET_KEY)

class TestAuth:
    @pytest.mark.asyncio
    async def test_encode_token_success(self):
        data = TokenData(id="123", username="testuser", full_name="Test User")
        token = encode_token(data)
        
        assert isinstance(token, str)
        # Verify manually
        decoded = jwt.decode(token, TEST_SECRET_KEY, algorithms=["HS256"])
        assert decoded["id"] == "123"
        assert decoded["username"] == "testuser"
        assert decoded["full_name"] == "Test User"
        assert "exp" in decoded

    

    @pytest.mark.asyncio
    async def test_decode_token_success(self):
        data_payload = {
            "id": "456",
            "username": "anotheruser",
            "full_name": "Another User"
        }
        token = jwt.encode(data_payload, TEST_SECRET_KEY, algorithm="HS256")
        
        token_data = decode_token(token)
        
        assert isinstance(token_data, TokenData)
        assert token_data.id == "456"
        assert token_data.username == "anotheruser"
        assert token_data.full_name == "Another User"

    @pytest.mark.asyncio
    async def test_decode_token_missing_fields(self):
        # Determine behavior when fields are missing (defaults to empty string based on current impl)
        data_payload = {"id": "789"} # Missing username, full_name
        token = jwt.encode(data_payload, TEST_SECRET_KEY, algorithm="HS256")
        
        token_data = decode_token(token)
        
        assert token_data.id == "789"
        assert token_data.username == ""
        assert token_data.full_name == ""

    @pytest.mark.asyncio
    async def test_get_current_admin_success(self, mocker: MockerFixture):
        token_str = "valid_token"
        expected_data = TokenData(id="1", username="admin", full_name="Admin")
        
        # Mock decode_token to return expected_data
        mocker.patch("services.auth.decode_token", return_value=expected_data)
        
        httpCreditials = MagicMock()
        httpCreditials.credentials = token_str
        
        result = get_current_admin(httpCreditials)
        assert result == expected_data

    @pytest.mark.asyncio
    async def test_get_current_admin_decode_error(self, mocker: MockerFixture):
        print("Mock type:", type(mocker))
        token_str = "invalid_token"
        
        # Mock decode_token to raise an exception 
        # (jwt.decode raises pyjwt exceptions, but get_current_admin catches Exception)
        mocker.patch("services.auth.decode_token", side_effect=jwt.PyJWTError("Invalid token"))
        
        httpCreditials = MagicMock()
        httpCreditials.credentials = token_str
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_admin(httpCreditials)
        
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Could not validate credentials"

    @pytest.mark.asyncio
    async def test_get_current_admin_missing_id(self, mocker: MockerFixture):
        token_str = "token_with_no_id"
        # Return a TokenData with None id if that's possible (though pydantic might enforce types, 
        # let's assume decode_token might return a TokenData with empty strings or None if logic allows)
        
        # Looking at decode_token implementation:
        # return TokenData(id=decoded.get("id") or "", ...)
        # It returns empty string if None.
        
        # However, get_current_admin checks: if token_data.id is None:
        # If it's an empty string "", it is not None. 
        # Let's verify what the check is. 
        # Code: if token_data.id is None: raise credentials_expection
        
        # But decode_token ensures it is empty string if missing. 
        # So "is None" might never happen unless decode_token is mocked to return something else 
        # or implementation changes.
        
        # Let's force it via mock to test the check logic.
        mock_data = MagicMock(spec=TokenData)
        mock_data.id = None 
        
        mocker.patch("services.auth.decode_token", return_value=mock_data)
        
        httpCreditials = MagicMock()
        httpCreditials.credentials = token_str
        
        with pytest.raises(HTTPException) as exc_info:
             get_current_admin(httpCreditials)
             
        assert exc_info.value.status_code == 401
