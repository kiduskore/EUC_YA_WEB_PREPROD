import os
import psycopg2
import sqlite3

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    conn = psycopg2.connect(DATABASE_URL)
    c = conn.cursor()
    c.execute("SELECT id, code FROM invite_codes")
    print("Postgres invites:", c.fetchall())
else:
    conn = sqlite3.connect('euc_ya.db')
    c = conn.cursor()
    c.execute("SELECT id, code FROM invite_codes")
    print("SQLite invites:", c.fetchall())
