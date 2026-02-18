import pytest
import pytest_asyncio
from pytest_mock import MockerFixture, mocker
from unittest.mock import AsyncMock, MagicMock
from mongomock_motor import AsyncMongoMockClient
from models import User, ICCard, AdminLog
from beanie import PydanticObjectId, init_beanie
from schema import ICCardCreate, ICCardStatus, CardRegistrationRequest
from services.auth import TokenData
from fastapi import HTTPException
from routes.ic_cards import register_card
from routes.ic_cards import create_ic_card





class TestCreateICCard:
    @pytest_asyncio.fixture(autouse=True)
    async def test_setup(self,mocker: MockerFixture):
        
        client = AsyncMongoMockClient()
        await init_beanie(database=client.get_database("labshop_test"), document_models=[User, ICCard]) # type: ignore
    
    @pytest.mark.asyncio
    async def test_create_ic_card_success(self, mocker: MockerFixture):
        user = User(student_id=1, first_name="Test", last_name="Student")
        card_data = ICCardCreate(
            uid="testuid123",
            student_id=1,
            status=ICCardStatus.active
        )
        # Mock User.find_one to return a user for the given student_id
        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = user
        
        # Mock ICCard.find_one to return None (no existing card with same UID)
        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.return_value = None

        iccard_insert_mock = mocker.patch.object(ICCard, "insert", new_callable=mocker.AsyncMock)
        

        
        ic_card = await create_ic_card(card_data)
        
        assert ic_card.uid == "testuid123"
        assert ic_card.student_id == 1
        assert ic_card.status == ICCardStatus.active
        assert iccard_insert_mock.called

    @pytest.mark.asyncio
    async def test_create_ic_card_duplicate_uid(self, mocker: MockerFixture):
        user = User(student_id=1, first_name="Test", last_name="Student")
        card_data = ICCardCreate(
            uid="testuid123",
            student_id=1,
            status=ICCardStatus.active
        )
        duplicate_card = ICCard(
            uid="testuid123",
             student_id=2, 
             status=ICCardStatus.active
        )
        # Mock User.find_one to return a user for the given student_id
        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = user
        
        # Mock ICCard.find_one to return the duplicate card (simulating a duplicate UID)
        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.return_value = duplicate_card
        with pytest.raises(HTTPException) as exc_info:
            await create_ic_card(card_data)
            assert exc_info.value.status_code == 400
        
    
    @pytest.mark.asyncio
    async def test_create_ic_card_nonexistent_student(self, mocker: MockerFixture):
        card_data = ICCardCreate(
            uid="testuid123",
            student_id=999,  # Nonexistent student ID
            status=ICCardStatus.active
        )
        # Mock User.find_one to return None (no user found for given student_id)
        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            await create_ic_card(card_data)
            assert exc_info.value.status_code == 400


@pytest.mark.asyncio
class TestRegisterCard:
    
    @pytest_asyncio.fixture(autouse=True)
    async def test_setup(self,mocker: MockerFixture):
        
            # 1. Create the detailed mocks first
        mock_session = mocker.AsyncMock(name="MotorSession")
        mock_transaction = mocker.AsyncMock(name="MotorTransaction")

        # 2. Configure the Session (The Context Manager)
        # When we do 'async with session', we want the session back
        mock_session.__aenter__.return_value = mock_session

        # 3. Configure the Transaction (CRITICAL STEP)
        # start_transaction must be a SYNC mock that returns the transaction object.
        # If this were an AsyncMock, it would return a coroutine, causing your error.
        mock_session.start_transaction = mocker.Mock(return_value=mock_transaction)

        # 4. Configure the Transaction Context Manager
        mock_transaction.__aenter__.return_value = mock_transaction

        # 5. Setup the Client
        client = AsyncMongoMockClient()

        # Force start_session to be an AsyncMock (so it can be awaited)
        # BUT make its return_value the session object directly.
        client.start_session = mocker.AsyncMock(return_value=mock_session)

        
        await init_beanie(database=client.get_database("labshop_test"), document_models=[User, ICCard, AdminLog]) # type: ignore
        

    
    
    @pytest.mark.asyncio
    async def test_register_card_success(self, mocker: MockerFixture):
        
        req = CardRegistrationRequest(student_id=1)
        


        user_findone_mock =mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = User(student_id=req.student_id, first_name="Test", last_name="Student")

        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.return_value = None  # No existing active card for student

        iccard_insert_mock = mocker.patch.object(ICCard, "insert", autospec=True)

        admin_log_insert_mock = mocker.patch.object(AdminLog, "insert", autospec=True)

        

        res = await register_card(
            uid="testuid123",
            data=req,
            admin=TokenData(id="6994629ac66386d0be4b2ae3", username="admin", full_name="Admin User")
        )

        assert res["message"] == "Card testuid123 linked to student 1 by Admin User"
        iccard_insert_call_args, _ = iccard_insert_mock.call_args
        inserted_card = iccard_insert_call_args[0]  # The first argument to insert() is the ICCard instance

        print("Inserted Card:", iccard_insert_call_args)

        assert inserted_card.uid == "testuid123"
        assert inserted_card.student_id == 1
        assert inserted_card.status == ICCardStatus.active

        admin_log_insert_call_args, _ = admin_log_insert_mock.call_args
        inserted_admin_log = admin_log_insert_call_args[0]  # The first argument to insert() is the AdminLog instance

        assert inserted_admin_log.admin_id == PydanticObjectId("6994629ac66386d0be4b2ae3")
        assert inserted_admin_log.admin_name == "Admin User"
        assert inserted_admin_log.action == "Linked card testuid123 to student 1"
        assert inserted_admin_log.target == f"Student: {user_findone_mock.return_value.first_name} {user_findone_mock.return_value.last_name}"
        assert inserted_admin_log.targeted_student_id == 1


    @pytest.mark.asyncio
    async def test_register_card_student_not_found(self, mocker: MockerFixture):
        req = CardRegistrationRequest(student_id=42)

        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await register_card(uid="anyuid", data=req, admin=TokenData(id="1", username="admin", full_name="A"))
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_register_card_existing_active_card_for_student(self, mocker: MockerFixture):
        req = CardRegistrationRequest(student_id=1)

        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = User(student_id=1, first_name="T", last_name="S")

        existing_card = ICCard(uid="otheruid", student_id=1, status=ICCardStatus.active)

        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.side_effect = [existing_card, None]

        with pytest.raises(HTTPException) as exc_info:
            await register_card(uid="testuid", data=req, admin=TokenData(id="1", username="admin", full_name="A"))
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_register_card_deactivated_card_cannot_link(self, mocker: MockerFixture):
        req = CardRegistrationRequest(student_id=1)

        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = User(student_id=1, first_name="T", last_name="S")

        # No existing active card for student
        # Then card by uid is deactivated
        deactivated_card = ICCard(uid="testuid", student_id=None, status=ICCardStatus.deactivated)

        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.side_effect = [None, deactivated_card]

        with pytest.raises(HTTPException) as exc_info:
            await register_card(uid="testuid", data=req, admin=TokenData(id="1", username="admin", full_name="A"))
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_register_card_update_existing_unlinked_card(self, mocker: MockerFixture):
        req = CardRegistrationRequest(student_id=1)

        user_inst = User(student_id=1, first_name="Test", last_name="Student")
        user_findone_mock = mocker.patch.object(User, "find_one", new_callable=mocker.AsyncMock)
        user_findone_mock.return_value = user_inst

        # existing_card check -> None; card by uid -> existing unlinked card
        unlinked_card = ICCard(uid="testuid", student_id=None, status=ICCardStatus.active)
        card_save_mock = mocker.patch.object(ICCard, "save", autospec=True)
        iccard_findone_mock = mocker.patch.object(ICCard, "find_one", new_callable=mocker.AsyncMock)
        iccard_findone_mock.side_effect = [None, unlinked_card]

        admin_log_insert_mock = mocker.patch.object(AdminLog, "insert", autospec=True)

        res = await register_card(
            uid="testuid",
            data=req,
            admin=TokenData(id="6994629ac66386d0be4b2ae3", username="admin", full_name="Admin User"),
        )

        unlinked_card_args = card_save_mock.call_args[0][0]  # The first argument to save() is the ICCard instance

        assert res["message"] == "Card testuid linked to student 1 by Admin User"
        assert unlinked_card_args.student_id == 1
        assert unlinked_card_args.status == ICCardStatus.active
        assert card_save_mock.called
        admin_log_insert_mock.assert_called()
    




    