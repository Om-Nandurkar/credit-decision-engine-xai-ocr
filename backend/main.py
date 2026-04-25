from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from ocr_service import process_loan_application
from scoring_service import calculate_credit_score, supabase

# Added redirect_slashes=False to prevent "Failed to fetch" on slash mismatches
app = FastAPI(redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CRITICAL: Manual Options Handler for Browsers ---
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
            "Access-Control-Allow-Headers": "*",
        },
    )

class LoanRequest(BaseModel):
    loan_id: str

class UserCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str
    role: str

@app.get("/")
def home():
    return {"status": "FynXai Backend is RUNNING"}

# --- OCR Trigger ---
@app.post("/trigger-ocr")
async def trigger_ocr(request: LoanRequest, background_tasks: BackgroundTasks):
    print(f"\n[API] 🔔 OCR Triggered for: {request.loan_id}")
    background_tasks.add_task(process_loan_application, request.loan_id)
    return {"message": "OCR processing started", "loan_id": request.loan_id}

# --- Credit Scoring Trigger ---
@app.post("/calculate-score")
async def trigger_scoring(request: LoanRequest, background_tasks: BackgroundTasks):
    print(f"\n[API] 🎲 Scoring Triggered for: {request.loan_id}")
    background_tasks.add_task(calculate_credit_score, request.loan_id)
    return {"message": "Credit Scoring started", "loan_id": request.loan_id}

# --- Admin Stats Calculation API ---
@app.get("/admin/stats")
async def get_admin_stats():
    print("\n[API] 📈 Fetching Admin Dashboard Stats...")
    try:
        loans_res = supabase.table('loans').select('created_at, officer_decision, officer_comments').execute()
        loans = loans_res.data or []

        total_apps = len(loans)
        decided_apps = [l for l in loans if l.get('officer_decision')]
        approved_apps = [l for l in decided_apps if l.get('officer_decision') == 'approved']

        approval_rate = 0
        if len(decided_apps) > 0:
            approval_rate = round((len(approved_apps) / len(decided_apps)) * 100)

        total_hours = 0
        processed_count = 0

        for loan in decided_apps:
            created_at_str = loan.get('created_at')
            comments = loan.get('officer_comments') or []

            decision_time_str = None
            if isinstance(comments, list):
                for c in comments:
                    if isinstance(c, dict) and c.get('type') == 'decision_log':
                        decision_time_str = c.get('timestamp')
                        break

            if created_at_str and decision_time_str:
                try:
                    created_dt = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    decision_dt = datetime.fromisoformat(decision_time_str.replace('Z', '+00:00'))
                    diff = decision_dt - created_dt
                    total_hours += diff.total_seconds() / 3600
                    processed_count += 1
                except Exception as e:
                    print(f"[API] ⚠️ Error parsing dates: {e}")

        avg_processing_time = "0h"
        if processed_count > 0:
            avg_hours = total_hours / processed_count
            if avg_hours < 1:
                avg_processing_time = f"{round(avg_hours * 60)}m"
            else:
                avg_processing_time = f"{round(avg_hours, 1)}h"

        users_res = supabase.table('users').select('role').execute()
        users = users_res.data or []
        
        active_officers = len([u for u in users if u.get('role') in ['Officer', 'Senior Officer', 'Admin']])
        if active_officers == 0:
            active_officers = 3

        return {
            "totalApplications": total_apps,
            "approvalRate": f"{approval_rate}%",
            "avgProcessingTime": avg_processing_time,
            "activeOfficers": active_officers
        }
    except Exception as e:
        print(f"[API] ❌ Failed to fetch admin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate stats")

# --- Admin User Management API ---
@app.post("/admin/create-user")
async def create_admin_user(request: UserCreateRequest):
    print(f"\n[API] 👤 Creating new user: {request.email} as {request.role}")
    try:
        temp_password = "Password123!" 
        auth_res = supabase.auth.admin.create_user({
            "email": request.email,
            "password": temp_password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": request.first_name,
                "last_name": request.last_name,
                "role": request.role
            }
        })
        
        user_id = auth_res.user.id
        
        supabase.table('users').upsert({
            "id": user_id,
            "first_name": request.first_name,
            "last_name": request.last_name,
            "email": request.email,
            "phone_number": request.phone_number,
            "role": request.role
        }).execute()
        
        return {"message": "User created successfully", "user_id": user_id}
    except Exception as e:
        print(f"[API] ❌ Failed to create user: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/admin/delete-user/{user_id}")
async def delete_admin_user(user_id: str):
    print(f"\n[API] 🗑️ Deleting user: {user_id}")
    try:
        supabase.table('users').delete().eq('id', user_id).execute()

        supabase.auth.admin.delete_user(user_id)
        
        return {"message": "User deleted completely"}
    except Exception as e:
        print(f"[API] ❌ Failed to delete user: {e}")
        raise HTTPException(status_code=400, detail=str(e))