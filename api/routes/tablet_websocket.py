from fastapi import APIRouter, WebSocket
from ws.connection_manager import ws_connection_manager

router = APIRouter()

@router.websocket("/ws/tablet")
async def websocket_endpoint(ws: WebSocket):
    await ws_connection_manager.connect_tablet(ws)
    try:
        while True:
            data = await ws.receive_text()
            print(f"Received data from tablet: {data}")
            await ws.send_text(f"<ECHO> {data}")
    except Exception as e:
        print(f"WebSocket connection closed: {e}")
    finally:
        await ws_connection_manager.disconnect_tablet()