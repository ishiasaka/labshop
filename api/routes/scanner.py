from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class ScanData(BaseModel):
    idm: str
    usb_port: Optional[int] = None
    reader_type: Optional[str] = None


# スキャン履歴を保持（メモリ内）
scan_history: list[dict] = []

@router.post("/ic_cards/scan")
async def receive_scan(data: ScanData):
    """カードスキャンデータを受信"""
    record = {
        "idm": data.idm,
        "usb_port": data.usb_port,
        "reader_type": data.reader_type,
        "timestamp": datetime.now().isoformat(),
    }
    scan_history.append(record)
    print(f"Received: IDm={data.idm}, USB_Port={data.usb_port}, Reader={data.reader_type}")
    return {"status": "ok", "received": record}


@router.get("/ic_cards/scans")
async def get_scans():
    """スキャン履歴を取得"""
    return {"scans": scan_history}