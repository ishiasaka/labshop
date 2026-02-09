
from fastapi.testclient import TestClient
from main import app



class TestWebSocketConnection:
    client = TestClient(app)
    def test_websocket_connection(self):
        with self.client.websocket_connect("/ws/tablet") as ws:
            test_message = "HELLO API"
            ws.send_text(test_message)
            data = ws.receive_text()
            assert data == f"<ECHO> {test_message}"
        

