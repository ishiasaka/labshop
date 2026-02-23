from fastapi import APIRouter, Depends, HTTPException
from models import SystemSetting, AdminLog
from schema import SystemSettingCreate, SystemSettingOut
from datetime import datetime, timezone
from services.auth import get_current_admin, TokenData

router = APIRouter(prefix="/settings")

@router.get("/{key}", response_model=SystemSettingOut)
async def get_system_setting(key: str):
    setting = await SystemSetting.find_one(SystemSetting.key == key)
    if not setting:
        raise HTTPException(status_code=404, detail="System setting not found")
    return setting


@router.put("/", response_model=SystemSettingOut)
async def create_or_update_system_setting(s: SystemSettingCreate, admin: TokenData = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    
    setting = await SystemSetting.find_one(SystemSetting.key == s.key)

    if setting:
        await setting.set({SystemSetting.value: s.value, SystemSetting.updated_at: now})
        action_msg = f"Updated {s.key} to {s.value}"
    else:
        setting = SystemSetting(key=s.key, value=s.value, updated_at=now)
        await setting.insert()
        action_msg = f"Created new setting {s.key} with value {s.value}"

    await AdminLog(
        admin_id=admin.id,
        admin_name=admin.full_name,
        action=action_msg,
        target="System Settings",
        created_at=now
    ).insert()

    return setting