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

rows = ws.get_all_records()
existing = {row["payment_id"]: idx + 2 for idx, row in enumerate(rows)}

now = datetime.utcnow().isoformat()

# ---------- Fetch payments (last 7 days) ----------
from_ts = int(time.time()) - 7 * 24 * 3600

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
        ws.append_row(data)

# ---------- TOTALS (always last row) ----------
values = ws.get_all_values()
last_row = len(values)

# Remove old TOTAL row if exists
if last_row > 1 and values[-1][0] == "TOTAL":
    ws.delete_rows(last_row)
    last_row -= 1

total_row = last_row + 1

ws.update(f"A{total_row}", "TOTAL")
ws.update(f"G{total_row}", f"=SUM(G2:G{total_row-1})")
ws.update(f"J{total_row}", f"=SUM(J2:J{total_row-1})")
ws.update(f"K{total_row}", f"=SUM(K2:K{total_row-1})")
ws.update(f"L{total_row}", f"=SUM(L2:L{total_row-1})")
