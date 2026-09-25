const http = require('http');

http.get('http://localhost:3000/api/prayer', {
  headers: {
    'Cookie': 'user_id=1; role_id=1'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
