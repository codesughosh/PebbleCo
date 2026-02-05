import os, json, time
import razorpay
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

# ---------- Razorpay ----------
client = razorpay.Client(
    auth=(
        os.environ["RAZORPAY_KEY_ID"],
        os.environ["RAZORPAY_KEY_SECRET"]
    )
)

# ---------- Google Sheets ----------
creds_dict = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
scopes = ["https://www.googleapis.com/auth/spreadsheets"]
creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
gc = gspread.authorize(creds)

sheet = gc.open_by_key(os.environ["GOOGLE_SHEET_ID"])
ws = sheet.worksheet("Payments")

# ---------------------------------------------------
# Sheet structure:
# Row 1 -> headers
# Row 2 -> totals (formulas, handled in Sheets)
# Row 3+ -> data
# ---------------------------------------------------

rows = ws.get_all_records()  # reads starting from row 3
existing = {row["payment_id"]: idx + 3 for idx, row in enumerate(rows)}

now = datetime.utcnow().isoformat()

# ---------- Fetch payments (last 30 days) ----------
from_ts = int(time.time()) - 30 * 24 * 3600

payments = client.payment.all({
    "from": from_ts,
    "count": 100
})["items"]

for p in payments:
    pid = p["id"]

    # ---------- SAFE notes handling ----------
    notes = p.get("notes")
    if isinstance(notes, dict):
        name = notes.get("name", "")
    else:
        name = ""

    data = [
        pid,
        p.get("order_id", ""),
        datetime.fromtimestamp(p["created_at"]).isoformat(),
        p["status"],
        name,
        p.get("contact", ""),
        p["amount"] / 100,
        p["currency"],
        now
    ]

    if pid in existing:
        row = existing[pid]
        ws.update(f"A{row}:I{row}", [data])
    else:
        ws.append_row(data, table_range="A3")
