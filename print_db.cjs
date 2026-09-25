const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
pool.query('SELECT data FROM app_state ORDER BY id DESC LIMIT 1').then(res => {
  if (res.rows.length > 0) {
    const data = res.rows[0].data;
    const user = data.users.find(u => u.email === 'keku121@gmail.com');
    console.log("User in DB:", user);
    console.log("Role permissions:", data.rolePermissions ? data.rolePermissions.length : 'undefined');
  }
  pool.end();
}).catch(e => {
  console.log("No DB connection");
  process.exit(0);
});
