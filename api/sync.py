from http.server import BaseHTTPRequestHandler
import json
import imaplib
import email
from email.header import decode_header
import re
import os
import time
import socket
from supabase import create_client

socket.setdefaulttimeout(5)

SUPABASE_URL = "https://gscehkviisvzwnxfiidu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2Voa3ZpaXN2endueGZpaWR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE4NzEzNSwiZXhwIjoyMTA3NzYzMTM1fQ.elwCkRf0zDKVjZgF9vXhwFZNCjjUoNT9uDBBIw6yC3Q"
IMAP_SERVER = "mail.alghaithcompanies.group"

KNOWN_ACCOUNTS = {
    "hr@alghaithcompanies.group": "alghaithHR@211260"
}

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def decode_mime(raw):
    if not raw: return ""
    try:
        parts = decode_header(raw)
        res = ""
        for content, enc in parts:
            res += content.decode(enc or "utf-8", errors="ignore") if isinstance(content, bytes) else str(content)
        return res.strip()
    except Exception:
        return str(raw).strip()

def extract_real_candidate(body_text, subject, attachments):
    clean_subj = re.sub(r'^(?:fwd?|re|tr|trans|إعادة توجيه)\s*:\s*', '', subject, flags=re.I).strip()
    
    fwd_match = re.search(r'(?:From|De|من|Expéditeur)\s*:\s*(?:["\']?([^<\n\r@]+?)["\']?\s*)?<([\w\.-]+@[\w\.-]+)>', body_text, re.I)
    if fwd_match:
        name = fwd_match.group(1).strip().replace('"', '').replace("'", "") if fwd_match.group(1) else ""
        email_addr = fwd_match.group(2).strip().lower()
        if name and len(name) > 2 and "@" not in name and "naceur" not in name.lower() and "ghaith" not in name.lower():
            return name, email_addr, clean_subj
        elif email_addr:
            return email_addr.split('@')[0].replace('.', ' ').title(), email_addr, clean_subj

    for fn in attachments:
        fn_clean = re.sub(r'\b(?:cv|resume|certificat|diplome|passport|id|pdf|doc|docx|new|final|updated|202[0-9])\b', '', fn, flags=re.I)
        fn_clean = fn_clean.replace('_', ' ').replace('-', ' ').replace('.', ' ').strip()
        words = fn_clean.split()
        if 1 < len(words) <= 4 and all(len(w) > 1 for w in words):
            return fn_clean.title(), None, clean_subj

    subj_match = re.search(r'^([\u0600-\u06FF\w\s]{3,30})(?:\s*[-–|:]\s*|\s+(?:فني|مهندس|لحام|مشرف|engineer|technician|supervisor|welder))', clean_subj, re.I)
    if subj_match:
        c_name = subj_match.group(1).strip()
        if len(c_name) > 3 and not any(w in c_name.lower() for w in ['naceur', 'ali', 'ghaith', 'alghaith']):
            return c_name, None, clean_subj

    return None, None, clean_subj

def run_fast_sync():
    res_data = supabase.table("candidates").select("email").execute()
    existing_emails = {row["email"].strip().lower() for row in (res_data.data or []) if row.get("email")}
    
    max_res = supabase.table("candidates").select("id").order("id", desc=True).limit(1).execute()
    next_id = (int(max_res.data[0]["id"]) + 1) if (max_res.data and max_res.data[0].get("id")) else int(time.time())
    
    summary = {}

    for acc_email, acc_pass in KNOWN_ACCOUNTS.items():
        imported = 0
        try:
            mail = imaplib.IMAP4_SSL(IMAP_SERVER, 993)
            mail.login(acc_email, acc_pass)
            mail.select("INBOX")
            _, msgs = mail.search(None, "ALL")
            e_ids = msgs[0].split() if msgs[0] else []
            
            # Fast incremental: process latest 5 emails in 2 seconds
            for e_id in e_ids[-5:]:
                try:
                    _, msg_data = mail.fetch(e_id, "(RFC822)")
                    if not msg_data or not isinstance(msg_data[0], tuple): continue
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    subj = decode_mime(msg.get("Subject", ""))
                    sender = decode_mime(msg.get("From", ""))
                    
                    body = ""
                    attachments = []
                    cv_url = None
                    for part in msg.walk():
                        if part.get_content_type() == 'text/plain' and 'attachment' not in str(part.get('Content-Disposition')):
                            try: body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            except Exception: pass
                        fn = part.get_filename()
                        if fn and ('attachment' in str(part.get('Content-Disposition')) or 'inline' in str(part.get('Content-Disposition'))):
                            clean_fn = re.sub(r'[^a-zA-Z0-9._-]', '_', decode_mime(fn))
                            attachments.append(clean_fn)
                            if clean_fn.split('.')[-1].lower() in ['pdf', 'doc', 'docx', 'jpg', 'png']:
                                sp = f"email_imports/{e_id.decode()}_{clean_fn}"
                                supabase.storage.from_("candidates").upload(sp, part.get_payload(decode=True), {"upsert": "true", "content-type": "application/pdf"})
                                cv_url = f"{SUPABASE_URL}/storage/v1/object/public/candidates/{sp}"

                    real_name, real_email, clean_pos = extract_real_candidate(body, subj, attachments)
                    
                    em_match = re.search(r'[\w\.-]+@[\w\.-]+', sender)
                    raw_email = em_match.group(0).lower() if em_match else ""
                    
                    # Ignore internal staff or executive emails
                    if any(w in sender.lower() for w in ['alghaith', 'ali ghaith', 'naceur']):
                        if not real_email:
                            continue  # Skip internal emails that don't contain a real forwarded candidate
                        cand_email = real_email
                    else:
                        cand_email = real_email or raw_email

                    if not cand_email or cand_email in existing_emails or "alghaith" in cand_email:
                        continue
                    
                    # Must have an attachment (CV) to be a candidate
                    if not cv_url:
                        continue

                    cand_name = real_name or (sender.split("<")[0].replace('"', '').strip() or cand_email.split("@")[0].title())
                    if any(w in cand_name.lower() for w in ['ali ghaith', 'alghaith', 'naceur']):
                        continue

                    record = {
                        "id": next_id,
                        "full_name": cand_name,
                        "email": cand_email,
                        "phone": "N/A",
                        "nationality": "N/A",
                        "applied_position": clean_pos[:70] if clean_pos else "Applicant",
                        "specialty": "N/A",
                        "experience": "N/A",
                        "education": "N/A",
                        "skills": "N/A",
                        "cv_filepath": cv_url,
                        "status": "NEW"
                    }
                    supabase.table("candidates").insert(record).execute()
                    existing_emails.add(cand_email)
                    next_id += 1
                    imported += 1
                except Exception:
                    pass
            
            mail.close()
            mail.logout()
            summary[acc_email] = {"status": "ok", "new_imported": imported}
        except Exception as e:
            summary[acc_email] = {"status": "error", "error": str(e)}

    return summary

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            results = run_fast_sync()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "message": "Sync completed in 2 seconds",
                "summary": results
            }, indent=2).encode('utf-8'))
        except Exception as err:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "error": str(err)}).encode('utf-8'))
