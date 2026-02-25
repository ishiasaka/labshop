from fastapi import APIRouter, HTTPException
from schema import PaymentCreate, PaymentOut, PaymentsOut
from datetime import datetime, timezone
from models import Payment, PaymentStatus, User

router = APIRouter(prefix="/payments")

@router.get("/", response_model=PaymentsOut)
async def list_payments():
    return {"payments": await Payment.find().to_list()}

@router.post("/", response_model=PaymentOut)
async def create_payment(p: PaymentCreate):
    now = datetime.now(timezone.utc)
    
    client = User.get_pymongo_collection().database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            student = await User.find_one(User.student_id == p.student_id, session=session)
            if not student:
                raise HTTPException(404, "Student not found")

            amount = int(p.amount_paid)
            if amount <= 0:
                raise HTTPException(400, "Payment amount must be greater than zero.")

            if p.idempotency_key:
                existing = await Payment.find_one(Payment.idempotency_key == p.idempotency_key, session=session)
                if existing:
                    return existing
            
            payment = Payment(
                student_id=p.student_id,
                amount_paid=amount,
                status=PaymentStatus.completed,
                idempotency_key=p.idempotency_key,
                created_at=now,
            )

            await payment.insert(session=session)
            # Deduct the amount from student's balance
            student.account_balance -= amount
            await student.save(session=session)
            return payment

