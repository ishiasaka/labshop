from fastapi import APIRouter, WebSocket
from ws.connection_manager import ws_connection_manager
from ws.ws_schema import WSSchema

router = APIRouter(prefix="/ws")

@router.websocket("/tablet")
async def websocket_endpoint(ws: WebSocket):
    await ws_connection_manager.connect_tablet(ws)
    try:
        while True:
            data = await ws.receive_text()
            print(f"Received data from tablet: {data}")
            await ws.send_json(WSSchema(
                action="ECHO"
            ).model_dump_json())
    except Exception as e:
        print(f"WebSocket connection closed: {e}")
    finally:
        await ws_connection_manager.disconnect_tablet()