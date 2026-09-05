-- ============================================================
-- Taranom Mehr — Cloudflare D1 schema
-- Run with:  npx wrangler d1 execute taranom-mehr-db --remote --file=./schema.sql
-- (and again with --local for local dev)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  mobile        TEXT UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',
  field         TEXT NOT NULL DEFAULT 'tajrobi',
  grade         TEXT,
  city          TEXT,
  age            INTEGER,
  avatar        TEXT,
  target_major  TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  mobile     TEXT PRIMARY KEY,
  code       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- Counselor-authored plans shared across counselor and student devices.
CREATE TABLE IF NOT EXISTS study_plans (
  student_id    TEXT PRIMARY KEY,
  plan_json     TEXT NOT NULL,
  counselor_id  TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_plans_counselor ON study_plans(counselor_id);

-- Student → counselor reverse sync.
-- Task completion ticks (per student, whole map as JSON keyed by day/shift).
CREATE TABLE IF NOT EXISTS task_progress (
  student_id    TEXT PRIMARY KEY,
  progress_json TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Daily reports submitted by students, readable by counselor/admin (and parents).
CREATE TABLE IF NOT EXISTS daily_reports (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL,
  student_name TEXT,
  text         TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_student ON daily_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_created ON daily_reports(created_at);

-- Rate limiting (brute-force protection for login / OTP).
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- Zarinpal payment sessions: store the amount per authority so verify can
-- confirm the exact amount (Zarinpal requires the same amount at verify time).
CREATE TABLE IF NOT EXISTS payment_sessions (
  authority  TEXT PRIMARY KEY,
  amount     INTEGER NOT NULL,
  student_id TEXT,
  created_at TEXT NOT NULL
);

-- پاسخ‌های تست کاربران ربات (تلگرام/بله) برای داشبورد و تحلیل روانشناسی
CREATE TABLE IF NOT EXISTS bot_quiz_log (
  id         TEXT PRIMARY KEY,
  platform   TEXT NOT NULL,          -- telegram | bale
  chat_id    TEXT NOT NULL,
  subject    TEXT,
  field      TEXT,
  year       TEXT,
  correct    INTEGER NOT NULL,       -- 1 درست / 0 غلط
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bot_quiz_chat ON bot_quiz_log (platform, chat_id, created_at);

-- آخرین سوال فعال هر کاربر ربات (برای پاسخ عددی در بله که دکمه ندارد)
CREATE TABLE IF NOT EXISTS bot_quiz_state (
  platform    TEXT NOT NULL,
  chat_id     TEXT NOT NULL,
  qi          INTEGER NOT NULL,
  correct_idx INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (platform, chat_id)
);

-- پروفایل ثبت‌نام کاربران ربات (رشته/پایه) برای تست شخصی‌سازی‌شده
CREATE TABLE IF NOT EXISTS bot_profiles (
  platform   TEXT NOT NULL,
  chat_id    TEXT NOT NULL,
  name       TEXT,
  field      TEXT,
  grade      TEXT,
  step       TEXT NOT NULL DEFAULT 'field',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (platform, chat_id)
);

-- ستون‌های معدل و سن پروفایل ربات (v2)
-- ALTER TABLE bot_profiles ADD COLUMN gpa REAL;
-- ALTER TABLE bot_profiles ADD COLUMN age INTEGER;

-- سهمیه/مصرف روزانه مشاوره هوشمند ربات (مبنای محاسبه اعتبار)
CREATE TABLE IF NOT EXISTS bot_chat_quota (
  platform TEXT NOT NULL,
  chat_id  TEXT NOT NULL,
  day      TEXT NOT NULL,
  used     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (platform, chat_id, day)
);

-- آمار هر سوال بانک (مرتب‌سازی/سطح‌بندی بهتر سوالات بر اساس عملکرد واقعی کاربران)
CREATE TABLE IF NOT EXISTS question_stats (
  qi         INTEGER PRIMARY KEY,   -- ایندکس سوال در بانک quiz-lite
  subject    TEXT,
  field      TEXT,
  year       TEXT,
  attempts   INTEGER NOT NULL DEFAULT 0,
  correct    INTEGER NOT NULL DEFAULT 0,
  likes      INTEGER NOT NULL DEFAULT 0,
  dislikes   INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

-- نظرات کاربران روی تک‌تک سوالات (از ربات تلگرام/بله و سایت)
CREATE TABLE IF NOT EXISTS question_comments (
  id         TEXT PRIMARY KEY,
  platform   TEXT NOT NULL,          -- telegram | bale | web
  chat_id    TEXT NOT NULL,
  qi         INTEGER NOT NULL,
  subject    TEXT,
  comment    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_question_comments_qi ON question_comments (qi);

-- حالت «در انتظار نظر» کاربر ربات (بعد از زدن دکمه 💬 نظر روی سوال)
CREATE TABLE IF NOT EXISTS bot_comment_state (
  platform   TEXT NOT NULL,
  chat_id    TEXT NOT NULL,
  qi         INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (platform, chat_id)
);

-- فیلتر فعال تست هر کاربر ربات (درس/سال) — «سوال بعدی» در همان درس می‌ماند
CREATE TABLE IF NOT EXISTS bot_quiz_filter (
  platform   TEXT NOT NULL,
  chat_id    TEXT NOT NULL,
  subject    TEXT,
  year       TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (platform, chat_id)
);

-- اتصال کاربر ربات به حساب سایت + توکن ورود یک‌بارمصرف (ورود یک‌کلیکی از تلگرام/بله)
CREATE TABLE IF NOT EXISTS bot_login_tokens (
  token      TEXT PRIMARY KEY,
  platform   TEXT NOT NULL,
  chat_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
-- ستون اتصال پروفایل ربات به users سایت (v3):
-- ALTER TABLE bot_profiles ADD COLUMN site_user_id TEXT;

-- شارژهای خریداری‌شده اعتبار ربات (زرین‌پال / کارت‌به‌کارت — تایید ادمین)
CREATE TABLE IF NOT EXISTS bot_payments (
  id         TEXT PRIMARY KEY,
  platform   TEXT NOT NULL,
  chat_id    TEXT NOT NULL,
  amount     INTEGER NOT NULL,          -- تومان
  method     TEXT,                      -- zarinpal | card | admin
  note       TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bot_payments_user ON bot_payments (platform, chat_id);

-- رزرو جلسه حضوری «اسنپی» (دانش‌آموز ↔ مربی ↔ محل: مدرسه/فضای کار اشتراکی)
CREATE TABLE IF NOT EXISTS inperson_bookings (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  mobile         TEXT NOT NULL,
  requester_role TEXT,               -- student | parent | coach
  city           TEXT,
  venue_id       TEXT,
  venue_name     TEXT,
  tutor_tier     TEXT,               -- همراه | ارشد | ویژه
  session_type   TEXT,               -- تحلیل کارنامه | برنامه‌ریزی جمع‌بندی | رفع اشکال | مشاوره روانشناسی
  preferred_date TEXT,
  est_price      INTEGER,            -- تومان (مربی + اجاره فضا)
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'new',  -- new | contacted | confirmed | done | canceled
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- ثبت فضای اجاره‌ای توسط مدرسه/دفتر/فضای کار اشتراکی (سمت عرضه)
CREATE TABLE IF NOT EXISTS venue_offers (
  id             TEXT PRIMARY KEY,
  org_name       TEXT NOT NULL,
  contact_name   TEXT,
  mobile         TEXT NOT NULL,
  city           TEXT,
  address        TEXT,
  venue_type     TEXT,               -- مدرسه | فضای کار اشتراکی | دفتر آموزشی
  capacity       INTEGER,
  price_per_hour INTEGER,            -- تومان
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'new',  -- new | reviewing | approved | rejected
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- درخواست‌های ثبت‌نام مشاوره (CRM)
CREATE TABLE IF NOT EXISTS counseling_requests (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  mobile     TEXT NOT NULL,
  field      TEXT,
  grade      TEXT,
  topic      TEXT,
  status     TEXT NOT NULL DEFAULT 'new',  -- new | contacted | done
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ثبت‌کننده هر کاربر (برای مدیریت دانش‌آموز توسط مشاور)
-- ALTER TABLE users ADD COLUMN created_by TEXT;

-- خلق ثبت‌نام ربات (v3): ALTER TABLE bot_profiles ADD COLUMN mood INTEGER;
-- آرشیو متن کامل صفحات دفترچه‌های رسمی (پایه دیتابیس ۱۰ ساله)
CREATE TABLE IF NOT EXISTS exam_pages_archive (
  pdf  TEXT NOT NULL,
  page INTEGER NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (pdf, page)
);

-- سوالات استخراج‌شده از آرشیو دفترچه‌ها (staging — تا کلیدزنی و تایید، وارد بانک اصلی نمی‌شوند)
CREATE TABLE IF NOT EXISTS extracted_questions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  q       TEXT NOT NULL,
  o1 TEXT, o2 TEXT, o3 TEXT, o4 TEXT,
  answer  INTEGER,             -- کلید (بعد از کلیدزنی AI دومرحله‌ای)
  year    TEXT, field TEXT, subject TEXT,
  src_pdf TEXT, pg INTEGER, qnum INTEGER,
  status  TEXT DEFAULT 'pending'   -- pending | keyed | verified | rejected
);

-- ============================================================
-- Chatre Danesh / HaqYar — Law CRM & Bar Exam Extensions
-- ============================================================

CREATE TABLE IF NOT EXISTS law_referrers (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  name            TEXT NOT NULL DEFAULT '',
  bar_rank        TEXT,
  referral_code   TEXT NOT NULL UNIQUE,
  commission_pct  REAL NOT NULL DEFAULT 20.0,
  status          TEXT NOT NULL DEFAULT 'active',
  total_earnings  INTEGER DEFAULT 0,
  available_bal   INTEGER DEFAULT 0,
  total_signups   INTEGER DEFAULT 0,
  iban            TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS law_payouts (
  id              TEXT PRIMARY KEY,
  referrer_id     TEXT NOT NULL,
  referrer_name   TEXT NOT NULL DEFAULT '',
  amount          INTEGER NOT NULL,
  iban            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | paid | rejected
  created_at      TEXT NOT NULL,
  processed_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_law_referrers_code ON law_referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_law_payouts_status ON law_payouts(status);

-- آرشیو صفحات دفترچه آزمون‌های رسمی وکالت و حقوق
CREATE TABLE IF NOT EXISTS exam_pages_archive (
  id TEXT PRIMARY KEY,
  booklet_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  exam_year TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  full_text TEXT NOT NULL,
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exam_pages_lookup ON exam_pages_archive(booklet_id, page_number);
