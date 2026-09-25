const { store } = require('./src/data/store.js');
const bcrypt = require('bcryptjs');
const token = store.createPasswordResetToken('admin@euc.org');
store.resetPassword(token, 'newpassword123');

const user = store.users.find(u => u.email === 'admin@euc.org');
console.log('Stored hash:', user.password_hash);
console.log('Match newpassword123?', bcrypt.compareSync('newpassword123', user.password_hash));

// Wait, the store is memory-based. If I run this script, it won't affect the running server!
// I should make an HTTP request to the running server.
