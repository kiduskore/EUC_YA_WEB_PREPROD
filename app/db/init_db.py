from app.db.database import get_db

def init_db():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        join_date TEXT DEFAULT (date('now')),
        role TEXT DEFAULT 'member',
        spiritual_stage TEXT DEFAULT 'new',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        leader_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES members(id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pod_members (
        pod_id INTEGER,
        member_id INTEGER,
        joined_at TEXT DEFAULT (date('now')),
        PRIMARY KEY (pod_id, member_id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        pod_id INTEGER,
        date TEXT,
        present BOOLEAN DEFAULT 1
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS weekly_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pod_id INTEGER,
        leader_id INTEGER,
        week_date TEXT,
        bible_passage TEXT,
        discussion_questions TEXT,
        spiritual_goals TEXT,
        post_meeting_notes TEXT,
        members_struggling TEXT,
        members_ready_to_lead TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS prayer_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        requester_name TEXT,
        request_text TEXT NOT NULL,
        is_urgent BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active',
        testimony TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answered_at TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS prayer_supporters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER,
        member_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS newcomer_pipeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        stage TEXT DEFAULT 'first_contact',
        notes TEXT,
        assigned_to INTEGER,
        first_visit_date TEXT DEFAULT (date('now')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS devotionals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER,
        week_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    
    # Seed initial resources if empty
    cursor.execute('SELECT COUNT(*) FROM resources')
    if cursor.fetchone()[0] == 0:
        seed_resources = [
            ("How to Read the Bible for All Its Worth", "A foundational guide to understanding and interpreting Scripture effectively.", "Bible Study", "https://bibleproject.com/explore/how-to-read-the-bible/"),
            ("Gospel of John Study Guide", "A 12-week deep dive into the Gospel of John focusing on the identity of Jesus.", "Bible Study", "https://www.thegospelcoalition.org/course/knowing-bible-john/"),
            ("The Master Plan of Evangelism", "Robert Coleman's classic on how Jesus made disciples and how we can follow His model.", "Leadership", "https://discipleship.org/wp-content/uploads/2018/01/Master-Plan-of-Evangelism.pdf"),
            ("Spiritual Leadership", "J. Oswald Sanders' essential principles for guiding others through spiritual maturity.", "Leadership", "https://www.desiringgod.org/books/spiritual-leadership"),
            ("DNA Pod Leader Guide", "Internal guide on how to facilitate effective DNA pods, navigate difficult conversations, and multiply leaders.", "Leadership", "#"),
            ("New Morning Mercies", "Daily gospel-centered devotionals by Paul David Tripp.", "Devotional", "https://www.paultripp.com/new-morning-mercies"),
            ("Praying the Bible", "Donald Whitney's guide on how to use Scripture to guide your daily prayer life.", "Devotional", "https://www.crossway.org/books/praying-the-bible-tpb/")
        ]
        cursor.executemany('INSERT INTO resources (title, description, category, file_url) VALUES (?, ?, ?, ?)', seed_resources)
        
    try:
        cursor.execute("ALTER TABLE prayer_requests ADD COLUMN requester_name TEXT")
        db.commit()
    except Exception:
        db.rollback()

    db.commit()
