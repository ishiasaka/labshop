
from beanie import PydanticObjectId
import pytest
from pytest_mock import MockerFixture
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient
from models import PurchaseStatus, User, Purchase
from beanie import init_beanie




@pytest.mark.asyncio
class TestUserAddPurchase:
    
    @pytest_asyncio.fixture(autouse=True, scope="function")
    async def test_setup(self, mocker: MockerFixture):
        await init_beanie(database=AsyncMongoMockClient().get_database("labshop_test"), document_models=[User, Purchase]) # type: ignore
    
    async def test_make_purchase(self, mocker: MockerFixture):
        
        user = User(
            student_id=1,
            first_name="Test",
            last_name="User",
            account_balance=100
        )
        
        user_inc_mock = mocker.patch.object(User, "inc", new_callable=mocker.AsyncMock)
        
        shelf_id = PydanticObjectId()
        
        result = await user.make_purchase(shelf_id=shelf_id, price=50)

        user_inc_mock.assert_called_with({"account_balance": 50})
        
        assert result.status == PurchaseStatus.completed
        assert result.price == 50
        assert result.student_id == 1
        assert result.shelf_id == shelf_id
        
    async def test_make_purchase_failure_on_user_update(self, mocker: MockerFixture):
        
        user = User(
            student_id=2,
            first_name="Test",
            last_name="User2",
            account_balance=100
        )
        
        user_inc_mock = mocker.patch.object(User, "inc", new_callable=mocker.AsyncMock)
        user_inc_mock.side_effect = Exception("Database error on user update")
        
        shelf_id = PydanticObjectId()
        
        with pytest.raises(Exception) as exc_info:
            await user.make_purchase(shelf_id=shelf_id, price=50)

    
        
        
        
        
        
        