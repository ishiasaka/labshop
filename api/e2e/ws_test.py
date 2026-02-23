import pytest
import websockets as ws
import os
import json
from ws.ws_schema import WSSchema


@pytest.mark.asyncio
class TestWebSocketConnection:
    url: str
    
    @pytest.fixture(autouse=True)
    def setup(self) -> None:
        url = os.environ.get('API_URL', '127.0.0.1:8000')
        self.url = f"ws://{url}"

    async def test_websocket_connection(self):
        async with ws.connect(f"{self.url}/ws/tablet") as websocket:
            test_message = "HELLO API"
            await websocket.send(test_message)
            data = await websocket.recv()
            ws_instace = WSSchema.model_validate_json(json.loads(data))
            assert ws_instace.action == "ECHO"
        

