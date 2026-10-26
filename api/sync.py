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

# Fast socket timeout so the serverless function executes quickly
socket.setdefaulttimeout(10)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://gscehkviisvzwnxfiidu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2Voa3ZpaXN2endueGZpaWR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE4NzEzNSwiZXhwIjoyMTA3NzYzMTM1fQ.elwCkRf0zDKVjZgF9vXhwFZNCjjUoNT9uDBBIw6yC3Q")
IMAP_SERVER = "mail.alghaithcompanies.group"

KNOWN_ACCOUNTS = {
    "hr@alghaithcompanies.group": os.getenv("HR_EMAIL_PASSWORD", "alghaithHR@211260")
}

# Comprehensive junk/ignore list: bounces, invoices, spam, invitations, security alerts
IGNORE_KEYWORDS = [
    # System & Delivery
    "delivery status", "undelivered", "out of office", "autoresponder", 
    "failure notice", "re: [notice]", "mailer-daemon", "spam", "mail delivery",
    "postmaster", "bounce", "mail delivery subsystem", "daemon",
    # Verification & Security
    "verification code", "verify your email", "security alert", "password reset", 
    "reset your password", "code de vérification", "رمز التحقق", "two-factor", "2fa",
    "login alert", "new sign-in", "cpanel", "webmail notification", "cron <",
    # Invoices & Commercial
    "invoice", "facture", "فاتورة", "receipt", "reçu", "quittance",
    "payment", "paiement", "سداد", "دفعة", "bill", "billing", 
    "statement of account", "relevé de compte", "كشف حساب",
    "purchase order", "bon de commande", "order confirmation", "confirmation de commande",
    "quotation", "devis", "عرض أسعار", "quote #", "estimate",
    # Events & Marketing
    "invitation", "دعوة", "conference", "ملتقى", "webinar", "workshop", "seminar",
    "newsletter", "unsubscribe", "se désabonner", "opt-out", "promotions", 
    "weekly digest", "daily digest", "marketing"
]

IGNORED_SENDERS = [
    "mailer-daemon", "postmaster", "noreply", "no-reply", "notifications@",
    "billing@", "support@", "newsletter@", "security@", "alert@",
    "google.com", "microsoft.com", "apple.com", "facebook.com", "linkedin.com",
    "cpanel.net", "hostinger.com", "godaddy.com"
]

JUNK_ATTACHMENT_KEYWORDS = [
    "invoice", "facture", "receipt", "bill", "devis", "quote", "quotation",
    "ticket", "reservation", "poster", "invitation", "banner", "logo", "flyer",
    "statement", "releve", "signature", "image00", "icon"
]

JUNK_NAME_TERMS = [
    'application', 'job application', 'job offer', 'apply', 'applying', 'applicant',
    'candidate', 'candidat', 'candidature', 'cv', 'resume', 'curriculum', 'vitae',
    'hr', 'human resources', 'recruitment', 'recruiter', 'info', 'information',
    'sales', 'support', 'admin', 'administrator', 'manager', 'contact', 'service',
    'general applicant', 'unknown', 'me', 'sir', 'madam', 'dear',
    'طلب توظيف', 'سيرة ذاتية', 'توظيف', 'تقديم', 'دعوة للمشاركة', 'دعوة', 'ملتقى'
]

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

def clean_candidate_name(raw_name, email_address, attachment_filenames, body_text=""):
    """Sanitize and clean candidate name, stripping junk terms like 'Application', 'Support', etc."""
    name = (raw_name or "").strip().replace('"', '').replace("'", '')
    name = re.sub(r'[\r\n\t]+', ' ', name).strip()
    
    is_junk = False
    lower_name = name.lower()
    if not name or len(name) < 3 or "@" in name or "=?" in name:
        is_junk = True
    elif any(lower_name == j or lower_name.startswith(j + " ") or lower_name.startswith(j + " as ") or lower_name.startswith(j + " for ") for j in JUNK_NAME_TERMS):
        is_junk = True
    elif any(w in lower_name for w in ['ali ghaith', 'alghaith', 'naceur']):
        is_junk = True
        
    if not is_junk:
        return name.title()

    # Strategy 1: Extract from attachment filename (e.g. "Amr_Sherif_CV.pdf" -> "Amr Sherif")
    for fn in attachment_filenames or []:
        base = os.path.splitext(fn)[0]
        base = re.sub(r'^\d+[\s_-]*', '', base)
        base = re.sub(r'\b(?:cv|resume|certificat|diplome|passport|id|pdf|doc|docx|new|final|updated|202[0-9]|compressed|official)\b', '', base, flags=re.IGNORECASE)
        base = re.sub(r'[_\.-]+', ' ', base).strip()
        words = base.split()
        if 2 <= len(words) <= 4 and all(len(w) >= 2 for w in words) and not any(w.lower() in JUNK_NAME_TERMS for w in words):
            return base.title()

    # Strategy 2: Extract from email local part (e.g. "amr.sh.saber@gmail.com" -> "Amr Sh Saber")
    if email_address and "@" in email_address:
        local_part = email_address.split("@")[0]
        clean_local = re.sub(r'[\d_.-]+', ' ', local_part).strip()
        words = clean_local.split()
        if words:
            formatted = " ".join([w.title() for w in words if len(w) > 1 and not w.isdigit()])
            if formatted and len(formatted) > 2 and not any(formatted.lower() == j for j in JUNK_NAME_TERMS):
                return formatted

    return "Candidate Applicant"

def extract_real_candidate(body_text, subject, attachments):
    clean_subj = re.sub(r'^(?:fwd?|re|tr|trans|إعادة توجيه)\s*:\s*', '', subject, flags=re.I).strip()
    
    fwd_match = re.search(r'(?:From|De|من|Expéditeur)\s*:\s*(?:["\']?([^<\n\r@]+?)["\']?\s*)?<([\w\.-]+@[\w\.-]+)>', body_text, re.I)
    if fwd_match:
        name = fwd_match.group(1).strip().replace('"', '').replace("'", "") if fwd_match.group(1) else ""
        email_addr = fwd_match.group(2).strip().lower()
        if name and len(name) > 2 and "@" not in name and not any(w in name.lower() for w in ['naceur', 'ghaith', 'alghaith']):
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
            
            # Fast incremental: process latest 10 emails
            for e_id in e_ids[-10:]:
                try:
                    _, msg_data = mail.fetch(e_id, "(RFC822)")
                    if not msg_data or not isinstance(msg_data[0], tuple): continue
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    subj = decode_mime(msg.get("Subject", ""))
                    sender = decode_mime(msg.get("From", ""))
                    
                    subj_lower = subj.lower()
                    sender_lower = sender.lower()

                    # 1. Skip system notices, bounces, auto-replies, and ignored senders
                    if any(k in subj_lower for k in IGNORE_KEYWORDS):
                        continue
                    if any(s in sender_lower for s in IGNORED_SENDERS):
                        continue

                    body = ""
                    attachments = []
                    cv_url = None
                    valid_cv_found = False

                    for part in msg.walk():
                        if part.get_content_type() == 'text/plain' and 'attachment' not in str(part.get('Content-Disposition')):
                            try: body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            except Exception: pass
                        fn = part.get_filename()
                        if fn and ('attachment' in str(part.get('Content-Disposition')) or 'inline' in str(part.get('Content-Disposition'))):
                            clean_fn = re.sub(r'[^a-zA-Z0-9._-]', '_', decode_mime(fn))
                            lower_fn = clean_fn.lower()
                            ext = lower_fn.split('.')[-1]
                            
                            file_data = part.get_payload(decode=True)
                            # Must be at least 15KB (skip signature icons/tracking pixels)
                            if not file_data or len(file_data) < 15000:
                                continue
                                
                            # Skip invoices, receipts, banners, posters
                            if any(junk in lower_fn for junk in JUNK_ATTACHMENT_KEYWORDS):
                                continue

                            # For images (.jpg, .png), ONLY allow if explicitly named as CV/ID
                            if ext in ['jpg', 'jpeg', 'png']:
                                if not any(w in lower_fn for w in ['cv', 'resume', 'passport', 'id', 'cin', 'candidat', 'diplom', 'certif', 'بطاقة', 'جواز', 'سيرة']):
                                    continue

                            if ext in ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']:
                                attachments.append(clean_fn)
                                sp = f"email_imports/{e_id.decode()}_{clean_fn}"
                                mime_type = "application/pdf" if ext == "pdf" else "application/octet-stream"
                                supabase.storage.from_("candidates").upload(sp, file_data, {"upsert": "true", "content-type": mime_type})
                                cv_url = f"{SUPABASE_URL}/storage/v1/object/public/candidates/{sp}"
                                valid_cv_found = True

                    # Check candidate qualification: must have valid CV or explicit job keywords
                    has_job_keywords = any(w in subj_lower or w in body.lower() for w in ['cv', 'resume', 'job', 'apply', 'candidat', 'position', 'foreman', 'engineer', 'technician', 'welder', 'supervisor', 'سيرة', 'توظيف', 'انضمام', 'طلب عمل', 'لحام', 'مشرف'])
                    if not valid_cv_found and not has_job_keywords:
                        continue

                    # If no valid attachments at all, skip unless explicit candidate body
                    if not attachments and not has_job_keywords:
                        continue

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
                    
                    # Clean candidate name with sanitization
                    raw_cand_name = real_name or sender.split("<")[0].replace('"', '').strip()
                    cand_name = clean_candidate_name(raw_cand_name, cand_email, attachments, body)
                    
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
                "message": "Sync completed successfully",
                "summary": results
            }, indent=2).encode('utf-8'))
        except Exception as err:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "error": str(err)}).encode('utf-8'))
