import pytest
from pytest_mock import MockerFixture

from services.ws import ConnectionManager, WSSchema
    
@pytest.mark.asyncio
class TestWebSocketInstance:

        
    async def test_connect_tablet(self, mocker: MockerFixture):
        conn = ConnectionManager()
        ws = mocker.MagicMock()
        ws.accept = mocker.AsyncMock()
        await conn.connect_tablet(ws)
        ws.accept.assert_awaited_once()
        assert conn.tablet_connection == ws
        
    async def test_send_payload_to_tablet(self, mocker: MockerFixture):
        ws = mocker.MagicMock()
        ws.accept = mocker.AsyncMock()
        ws.send_json = mocker.AsyncMock()
        conn = ConnectionManager()
        await conn.connect_tablet(ws)
        
        schema = WSSchema(
            action="test_action",
            student_id="12345",
            shelf_id="shelf_1",
            student_name="Test Student",
            debt_amount=100,
            price=50
        )
        
        await conn.send_payload_to_tablet(schema)
        ws.send_json.assert_awaited_once_with(schema.model_dump())
        
    async def test_send_payload_no_tablet(self):
        conn = ConnectionManager()
        schema = WSSchema(
            action="test_action",
            student_id="12345",
            shelf_id="shelf_1",
            student_name="Test Student",
            debt_amount=100,
            price=50
        )
        
        with pytest.raises(ConnectionError, match="No tablet connected"):
            await conn.send_payload_to_tablet(schema)
            
    async def test_disconnect_tablet(self, mocker: MockerFixture):
        ws = mocker.MagicMock()
        ws.accept = mocker.AsyncMock()
        conn = ConnectionManager()
        await conn.connect_tablet(ws)
        await conn.disconnect_tablet()
        assert not conn.is_connected()
        
    async def test_tablet_connection_property_no_tablet(self):
        conn = ConnectionManager()
        with pytest.raises(ConnectionError, match="No tablet connected"):
            _ = conn.tablet_connection
    
    