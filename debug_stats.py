import sqlite3

# Test the group by query against sqlite
db = sqlite3.connect('euc_ya.db')
c = db.cursor()
c.execute("SELECT strftime('%Y-%m', join_date) as month, COUNT(*) as count FROM members GROUP BY strftime('%Y-%m', join_date) ORDER BY strftime('%Y-%m', join_date)")
print("Members by month:", c.fetchall())

