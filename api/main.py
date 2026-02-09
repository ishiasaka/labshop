from fastapi import FastAPI, WebSocket
from routes.websocket import router as websocket_router
app = FastAPI()

app.include_router(websocket_router)

@app.get("/")
async def read_root():
    return {"Hello": "World"}
