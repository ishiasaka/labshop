from fastapi import FastAPI, WebSocket
from routes.tablet_websocket import router as tablet_router
app = FastAPI()

app.include_router(tablet_router)

@app.get("/")
async def read_root():
    return {"Hello": "World"}
