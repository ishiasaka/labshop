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
    
    student = await User.find_one(User.student_id == p.student_id)
    if not student:
        raise HTTPException(404, "Student not found")

    amount = int(p.amount_paid)
    if amount <= 0:
        raise HTTPException(400, "Payment amount must be greater than zero.")
    if student.account_balance < amount:
        raise HTTPException(400, "Your debt is less than what you want to pay")

    if p.idempotency_key:
        existing = await Payment.find_one(Payment.idempotency_key == p.idempotency_key)
        if existing:
            return existing
    
    payment = await student.make_payment(
        amount_paid=amount,
        external_transaction_id=p.external_transaction_id,
        idempotency_key=p.idempotency_key,
    )
    return payment

