import psycopg2

try:
    conn = psycopg2.connect("postgresql://euc_ya_db_user:GoVthrKFnvjwUTOXym7UfyEwMoBqTFPk@dpg-da3lfmrm8hqs73cas9n0-a.oregon-postgres.render.com/euc_ya_db")
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS test_bool (id SERIAL, val BOOLEAN)")
    cur.execute("INSERT INTO test_bool (val) VALUES (%s)", (1,))
    cur.execute("INSERT INTO test_bool (val) VALUES (%s)", (0,))
    cur.execute("SELECT * FROM test_bool")
    print(cur.fetchall())
    conn.rollback()
except Exception as e:
    print("Error:", e)
