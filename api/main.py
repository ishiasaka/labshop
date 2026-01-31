from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

app = FastAPI()


class ScanData(BaseModel):
    idm: str
    usb_port: Optional[int] = None


# スキャン履歴を保持（メモリ内）
scan_history: list[dict] = []


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.post("/api/scan")
async def receive_scan(data: ScanData):
    """カードスキャンデータを受信"""
    record = {
        "idm": data.idm,
        "usb_port": data.usb_port,
        "timestamp": datetime.now().isoformat(),
    }
    scan_history.append(record)
    print(f"Received: IDm={data.idm}, USB_Port={data.usb_port}")
    return {"status": "ok", "received": record}


@app.get("/api/scans")
async def get_scans():
    """スキャン履歴を取得"""
    return {"scans": scan_history}