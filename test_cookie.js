const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.cookie('test', '123', { httpOnly: false });
  res.send('ok');
});
app.listen(3001, () => console.log('started'));
