const fs = require('fs');
let content = fs.readFileSync('views/reset_password.ejs', 'utf-8');

content = content.replace("t('auth.newPasswordLabel')", "t('auth.newPassword')");
content = content.replace("t('auth.confirmPasswordLabel')", "t('auth.confirmPassword')");

content = content.replace("t('auth.resetPasswordSubtitle')", "(t('auth.resetPasswordSubtitle') === 'auth.resetPasswordSubtitle' ? 'Enter your new password below.' : t('auth.resetPasswordSubtitle'))");
content = content.replace("t('auth.updatePasswordBtn')", "(t('auth.updatePasswordBtn') === 'auth.updatePasswordBtn' ? 'Update Password' : t('auth.updatePasswordBtn'))");

fs.writeFileSync('views/reset_password.ejs', content);
console.log("Fixed views/reset_password.ejs");
