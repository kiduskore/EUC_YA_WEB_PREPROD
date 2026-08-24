import sqlite3
conn = sqlite3.connect('euc_ya.db')
c = conn.cursor()
c.execute("INSERT INTO roles (name) VALUES ('Site Admin')")
c.execute("INSERT INTO permissions (name) VALUES ('view_dashboard'), ('manage_members'), ('manage_pods'), ('manage_users'), ('manage_settings')")
c.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 1)")
c.execute("INSERT INTO users (email, password_hash, role_id) VALUES ('admin@euc.org', 'test', 1)")
conn.commit()
conn.close()
