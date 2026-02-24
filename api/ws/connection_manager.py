from fastapi import WebSocket
from typing import Dict
from ws.ws_schema import WSSchema


class ConnectionManager:
    __tablet_connection: WebSocket | None

    def __init__(self):
        self.__tablet_connection = None

    @property
    def tablet_connection(self) -> WebSocket:
        if self.__tablet_connection:
            return self.__tablet_connection
        raise ConnectionError("No tablet connected")

    async def connect_tablet(self, websocket: WebSocket):
        await websocket.accept()
        self.__tablet_connection = websocket

    def is_connected(self) -> bool:
        return self.__tablet_connection is not None
    
    async def disconnect_tablet(self):
        self.__tablet_connection = None

    async def send_payload_to_tablet(self, payload: WSSchema):
        print("Sending payload to tablet:", self.__tablet_connection)
        if self.__tablet_connection:
            await self.__tablet_connection.send_json(payload.model_dump())
            return
        raise ConnectionError("No tablet connected")


ws_connection_manager = ConnectionManager()