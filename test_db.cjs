const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT data FROM app_state ORDER BY id DESC LIMIT 1')
  .then(res => {
    if (res.rows.length > 0) {
      console.log('DB Users:', JSON.stringify(res.rows[0].data.users, null, 2));
    } else {
      console.log('No data in DB');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });
