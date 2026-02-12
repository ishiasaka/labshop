from fastapi import FastAPI, WebSocket
from routes.websocket import router as websocket_router
from routes.scanner import router as scanner_router
app = FastAPI()

app.include_router(websocket_router)
app.include_router(scanner_router)

@app.get("/")
async def read_root():
    return {"Hello": "World"}
