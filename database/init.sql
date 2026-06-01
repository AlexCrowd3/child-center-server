PRAGMA foreign_keys = ON;

-- ===============================
-- 1. USERS (РОДИТЕЛИ)
-- ===============================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    avatar TEXT,
    bonus_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    phone_verified BOOLEAN DEFAULT 0
);

-- ===============================
-- 2. TEACHERS
-- ===============================
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    balance REAL DEFAULT 0,
    payout_day_1 INTEGER,
    payout_day_2 INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 3. CHILDREN
-- ===============================
CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    birth_date DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male','female')),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 4. SUBSCRIPTION TYPES (ГРУППОВЫЕ)
-- ===============================
CREATE TABLE IF NOT EXISTS subscription_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    level_value INTEGER NOT NULL,
    base_price_per_lesson REAL NOT NULL,
    teacher_payout_per_lesson REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1
);

-- ===============================
-- 5. ACTIVITY TYPES (БЕЗ ИНДИВИДУАЛЬНОЙ ЛОГИКИ)
-- ===============================
CREATE TABLE IF NOT EXISTS activity_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    level_value INTEGER,
    duration_minutes INTEGER NOT NULL,
    max_places INTEGER DEFAULT 8,
    image TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ===============================
-- 6. INDIVIDUAL ACTIVITIES
-- ===============================
CREATE TABLE IF NOT EXISTS individual_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_type_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    price_per_lesson REAL NOT NULL,
    teacher_payout_per_lesson REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ===============================
-- 7. USER SUBSCRIPTIONS
-- ===============================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription_type_id INTEGER,
    individual_activity_id INTEGER,
    lessons_total INTEGER NOT NULL,
    lessons_left INTEGER NOT NULL,
    price_per_lesson REAL NOT NULL,
    teacher_payout_per_lesson REAL NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 8. GROUP SCHEDULES
-- ===============================
CREATE TABLE IF NOT EXISTS group_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_type_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ===============================
-- 9. INDIVIDUAL SCHEDULES
-- ===============================
CREATE TABLE IF NOT EXISTS individual_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    individual_activity_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
    FOREIGN KEY (individual_activity_id) REFERENCES individual_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ===============================
-- 10. GROUP BOOKINGS
-- ===============================
CREATE TABLE IF NOT EXISTS group_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    status TEXT DEFAULT 'booked' CHECK(status IN ('booked','visited','cancelled','no_show')),
    teacher_payout REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES group_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 11. INDIVIDUAL BOOKINGS
-- ===============================
CREATE TABLE IF NOT EXISTS individual_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL UNIQUE,
    child_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    status TEXT DEFAULT 'booked' CHECK(status IN ('booked','visited','cancelled','no_show')),
    teacher_payout REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES individual_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 12. TEACHER PAYOUTS
-- ===============================
CREATE TABLE IF NOT EXISTS teacher_payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ===============================
-- 13. KPI SNAPSHOTS
-- ===============================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    revenue REAL DEFAULT 0,
    teacher_payouts REAL DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    avg_per_day REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 14. BACKUP LOGS
-- ===============================
CREATE TABLE IF NOT EXISTS backup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 15. ОПЛАТА
-- ===============================
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    purchase_request_id INTEGER,
    provider TEXT,
    provider_payment_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'RUB',
    status TEXT CHECK(status IN ('pending','success','failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    contract_number INTEGER,
    contract_label TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('mass','system')) NOT NULL,
    target_role TEXT CHECK(target_role IN ('all','parent','teacher')) DEFAULT 'all',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(notification_id) REFERENCES notifications(id)
);