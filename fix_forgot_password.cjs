const fs = require('fs');
let content = fs.readFileSync('views/forgot_password.ejs', 'utf-8');

content = content.replace("t('auth.forgotPasswordTitle')", "t('auth.resetPasswordTitle')");
content = content.replace("t('auth.forgotPasswordSubtitle')", "t('auth.resetSubtitle')");
content = content.replace("t('auth.emailLabel')", "t('auth.email')");
content = content.replace("t('auth.returnToSignIn')", "t('auth.backToLogin')");

// For keys that don't exist at all, we replace the `t(...)` logic to fallback properly
// The issue is t returns the key itself. So we can just check if it equals the key.
content = content.replace("t('auth.rememberPassword')", "(t('auth.rememberPassword') === 'auth.rememberPassword' ? 'Remember your password?' : t('auth.rememberPassword'))");
content = content.replace("t('auth.directResetLink')", "(t('auth.directResetLink') === 'auth.directResetLink' ? 'Direct Reset Link:' : t('auth.directResetLink'))");
content = content.replace("t('auth.openResetForm')", "(t('auth.openResetForm') === 'auth.openResetForm' ? 'Open Password Reset Form →' : t('auth.openResetForm'))");

fs.writeFileSync('views/forgot_password.ejs', content);
console.log("Fixed views/forgot_password.ejs");
