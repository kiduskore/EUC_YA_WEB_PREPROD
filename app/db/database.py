import sqlite3
import psycopg2
from flask import g
from app.config import Config

class CursorWrapper:
    def __init__(self, cursor, is_postgres):
        self._cursor = cursor
        self.is_postgres = is_postgres
        self.lastrowid = None
        self.rowcount = 0

    def _convert_query(self, query):
        if not self.is_postgres:
            return query
        query = query.replace('?', '%s')
        query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        query = query.replace("DEFAULT (date('now'))", "DEFAULT CURRENT_DATE")
        query = query.replace("strftime('%Y-%m', join_date)", "to_char(join_date, 'YYYY-MM')")
        query = query.replace("BOOLEAN DEFAULT 1", "BOOLEAN DEFAULT true")
        query = query.replace("BOOLEAN DEFAULT 0", "BOOLEAN DEFAULT false")
        query = query.replace('is_active=1', 'is_active=true')
        query = query.replace('present=1', 'present=true')
        return query

    def execute(self, query, params=()):
        q = self._convert_query(query)
        is_insert = q.strip().upper().startswith('INSERT')
        
        if self.is_postgres and is_insert and 'RETURNING ' not in q.upper():
            if 'role_permissions' not in q.lower() and 'ON CONFLICT DO NOTHING' not in q.upper():
                q = q.rstrip(';') + ' RETURNING id'
            
        self._cursor.execute(q, params)
        self.rowcount = self._cursor.rowcount
        
        if is_insert:
            if self.is_postgres:
                try:
                    self.lastrowid = self._cursor.fetchone()[0]
                except Exception:
                    pass
            else:
                self.lastrowid = self._cursor.lastrowid

    def executemany(self, query, params_list):
        q = self._convert_query(query)
        if self.is_postgres:
            for p in params_list:
                self._cursor.execute(q, p)
        else:
            self._cursor.executemany(q, params_list)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        self._cursor.close()

class ConnWrapper:
    def __init__(self, conn, is_postgres):
        self._conn = conn
        self.is_postgres = is_postgres

    def cursor(self):
        if self.is_postgres:
            from psycopg2.extras import DictCursor
            c = self._conn.cursor(cursor_factory=DictCursor)
        else:
            c = self._conn.cursor()
        return CursorWrapper(c, self.is_postgres)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        if Config.IS_POSTGRES:
            conn = psycopg2.connect(Config.DATABASE_URL)
            db = g._database = ConnWrapper(conn, True)
        else:
            conn = sqlite3.connect(Config.DATABASE_LOCAL_PATH)
            conn.row_factory = sqlite3.Row
            db = g._database = ConnWrapper(conn, False)
    return db

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
