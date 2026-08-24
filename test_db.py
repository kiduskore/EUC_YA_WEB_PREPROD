import psycopg2

db_url = "postgresql://euc_ya_db_user:GoVthrKFnvjwUTOXym7UfyEwMoBqTFPk@dpg-da3lfmrm8hqs73cas9n0-a.ohio-postgres.render.com/euc_ya_db"
# Wait, Render internal URL is dpg-...-a, external URL is dpg-...-a.oregon-postgres.render.com
# The user provided the internal URL: dpg-da3lfmrm8hqs73cas9n0-a/euc_ya_db
# Let's try to connect to the external URL since I'm running this locally.
# Usually Render DBs have the region in the hostname. The user didn't provide it.
# Let's try .oregon-postgres.render.com and .ohio-postgres.render.com
