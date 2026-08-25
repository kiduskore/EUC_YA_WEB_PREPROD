const fs = require('fs');
const path = require('path');
const enTsPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.ts');
let lines = fs.readFileSync(enTsPath, 'utf8').split('\n');

// Find lines from 333 to 357 (index 332 to 356) and remove them
// Wait, to be safe, I'll filter out lines that contain these broken keys.
const badKeys = [
  'availability.section1.q1', 'auth.joinDashboard', 'auth.joinDashboardSubtitle', 
  'auth.fullNameLabel', 'auth.emailLabel', 'auth.newPasswordLabel', 
  'auth.createAccountBtn', 'community.section1.q1', 'auth.forgotPasswordTitle', 
  'auth.forgotPasswordSubtitle', 'auth.directResetLink', 'auth.openResetForm', 
  'auth.returnToSignIn', 'auth.rememberPassword', 'generosity.section1.q1', 
  'growth.section1.q1', 'maturity.section1.q1', 'membership.section1.q1', 
  'membership.section2.q1', 'mentorship.section1.q1', 'auth.resetPasswordSubtitle', 
  'auth.confirmPasswordLabel', 'auth.updatePasswordBtn', 'scriptureMemory.section1.q1', 
  'serving.section1.q1', "doesn'", "and we'"
];

const newLines = lines.filter(line => {
    for (const bk of badKeys) {
        if (line.includes(`'${bk}':`)) return false;
    }
    if (line.includes("doesn'") || line.includes("we\\'")) return false; // remove the broken ones
    return true;
});

// Remove trailing commas before the end bracket, just in case
const filteredLines = newLines.filter(l => l.trim() !== '');

fs.writeFileSync(enTsPath, filteredLines.join('\n'));
console.log('cleaned');
