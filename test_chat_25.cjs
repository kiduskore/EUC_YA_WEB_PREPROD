const http = require('http');

const data = JSON.stringify({ message: "Hello!" });
const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Cookie': 'csrf_token=testtoken',
    'x-csrf-token': 'testtoken'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Response:', body));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
