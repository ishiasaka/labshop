import pytest
import websockets as ws
import os
import json
from services.ws import WSSchema
import httpx
from datetime import datetime, timezone
import asyncio



@pytest.mark.asyncio
class TestFlows:
    url: str
    ws_url: str
    
    @pytest.fixture(autouse=True)
    def setup(self) -> None:
        url = os.environ.get('API_URL', 'localhost:8000')
        self.ws_url = f"ws://{url}"
        self.url = f"http://{url}"

    async def test_full_flow(self):
        async with httpx.AsyncClient(base_url=self.url) as client:
            # 1. Create a admin user
            admin_data = {
                "username": f"testadmin_{int(datetime.now(timezone.utc).timestamp())}",
                "password": "testpassword",
                "first_name": f"Test_{int(datetime.now(timezone.utc).timestamp())}",
                "last_name": "Admin"
            }
            
            admin_create_resp = await client.post(f"/admin/", json=admin_data)
            assert admin_create_resp.status_code == 200
            assert admin_create_resp.json().get("username") == admin_data["username"]
            
            # 2. Login as admin
            login_data = {
                "username": admin_data["username"],
                "password": admin_data["password"]
            }
            
            login_resp = await client.post(f"/admin/login", json=login_data)
            assert login_resp.status_code == 200
            
            token = login_resp.json().get("token")
            assert token is not None
            
            # 3. Create a user with the token
            user_data = {
                "student_id": int(datetime.now(timezone.utc).timestamp()),
                "first_name": f"Test_{int(datetime.now(timezone.utc).timestamp())}",
                "last_name": "Student"
            }
            
            headers = {"Authorization": f"Bearer {token}"}
            user_create_resp = await client.post(f"/users/", json=user_data, headers=headers)
            assert user_create_resp.status_code == 200
            
            
            headers = {"Authorization": f"Bearer {token}"}
            user_resp = await client.get(f"/users/{user_data['student_id']}", headers=headers)
            assert user_resp.status_code == 200
            assert user_resp.json().get("student_id") == user_data["student_id"]
            assert user_resp.json().get("first_name") == user_data["first_name"]
            assert user_resp.json().get("last_name") == user_data["last_name"]
            
            
            # 4. Scan a new IC card
            ic_card_number = f"TESTCARD{int(datetime.now(timezone.utc).timestamp())}"
            scan_data = {
                "idm": ic_card_number,
                "usb_port": 5, # Admin PORT
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            scan_resp = await client.post(f"/ic_cards/scan", json=scan_data)
            print(scan_resp.json())
            assert scan_resp.status_code == 200
            assert scan_resp.json().get("status") == "new_card"
            assert "Card captured" in scan_resp.json().get("message", "")
            
            # 5. Link the card to the user
            link_data = {
                "student_id": user_data["student_id"]
            }
            
            link_resp = await client.post(f"/ic_cards/{ic_card_number}/register", json=link_data, headers=headers)
            print(link_resp)
            assert link_resp.status_code == 200
            
            print(link_resp.json())
            
            # 6. create shelf
            shelf_data = {
                "shelf_id": f"testshelfF{int(datetime.now(timezone.utc).timestamp())}",
                "usb_port": 1,
                "price": 100
            }
            
            shelf_resp = await client.post(f"/shelves/", json=shelf_data, headers=headers)
            assert shelf_resp.status_code == 200
            
            # 7. Scan the card again to simulate a purchase
            scan_data_2 = {
                "idm": ic_card_number,
                "usb_port": 1, # Shelf PORT
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            scan_resp_2 = await client.post(f"/ic_cards/scan", json=scan_data_2, headers=headers)
            assert scan_resp_2.status_code == 200
            assert scan_resp_2.json().get("status") == "success"
            
            # 8. Check the user's account balance
            user_resp_2 = await client.get(f"/users/{user_data['student_id']}", headers=headers)
            assert user_resp_2.status_code == 200
            assert user_resp_2.json().get("account_balance") == 100
            
            #9 Scan card to toggle payback
            async with ws.connect(self.ws_url + "/ws/tablet") as websocket:
                await asyncio.sleep(1)
                
                test_message = "HELLO API"
                await websocket.send(test_message)
                data = await websocket.recv()
                ws_instace = WSSchema.model_validate_json(json.loads(data))
                assert ws_instace.action == "ECHO"
                
                print("Received WS message:", ws_instace.action)
                
                await asyncio.sleep(1)
                
                ws_listen_task = asyncio.create_task(websocket.recv())
                
                
                
                scan_data_3 = {
                    "idm": ic_card_number,
                    "usb_port": 5, # Admin PORT
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
                resp = await client.post(f"/ic_cards/scan", json=scan_data_3, headers=headers)
                ws_message = await asyncio.wait_for(ws_listen_task, timeout=5)
                assert resp.status_code == 200
                resp_json = resp.json()
                assert resp_json.get("status") == "identified"
                assert resp_json.get("student_id") == user_data["student_id"]
                assert resp_json.get("name") == user_data["first_name"]
                
                ws_data = json.loads(ws_message)
                assert ws_data.get("action") == "PAY_BACK"
                assert ws_data.get("student_id") == str(user_data["student_id"])
                assert ws_data.get("student_name") == user_data["first_name"]
                assert ws_data.get("debt_amount") == 100
                
            # 10. Pay back
            payback_data = {
                "student_id": user_data["student_id"],
                "amount_paid": 100,
            }
            
            payback_resp = await client.post(f"/payments/", json=payback_data, headers=headers)
            assert payback_resp.status_code == 200
            assert payback_resp.json().get("status") == "completed"
            
            # 11. Check the user's account balance is now 0
            user_resp_3 = await client.get(f"/users/{user_data['student_id']}", headers=headers)
            assert user_resp_3.status_code == 200
            assert user_resp_3.json().get("account_balance") == 0
                