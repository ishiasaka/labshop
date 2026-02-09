from fastapi import WebSocket
from typing import Dict, Dict


class ConnectionManager:
    tablet_connection: WebSocket | None

    def __init__(self):
        self.tablet_connection = None

    async def connect_tablet(self, websocket: WebSocket):
        await websocket.accept()
        self.tablet_connection = websocket

    def is_connected(self) -> bool:
        return self.tablet_connection is not None
    
    async def disconnect_tablet(self):
        if self.tablet_connection:
            await self.tablet_connection.close()
            self.tablet_connection = None

    async def send_payload_to_tablet(self, payload: Dict):
        if self.tablet_connection:
            await self.tablet_connection.send_json(payload)
            return
        raise ConnectionError("No tablet connected")


ws_connection_manager = ConnectionManager()