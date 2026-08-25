const fs = require('fs');
const path = require('path');
const enTsPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.ts');
let content = fs.readFileSync(enTsPath, 'utf8');

content = content.replace("'Available in 4 languages: English, አማርኛ, ትግርኛ, and Afaan Oromoo.'", "'Available in 4 languages: English, አማርኛ, ትግርኛ, and Afaan Oromoo.',");

const additions = [
  { key: 'availability.section1.q1', val: `"Then I heard the voice of the Lord saying, "Whom shall I send? And who will go for us?" And I said, "Here am I. Send me!"" (Isaiah 6:8)` },
  { key: 'community.section1.q1', val: `"Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up." (Ecclesiastes 4:9-10)` },
  { key: 'generosity.section1.q1', val: `"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." (2 Corinthians 9:7)` },
  { key: 'growth.section1.q1', val: `"Train yourself to be godly. For physical training is of some value, but godliness has value for all things." (1 Timothy 4:7-8)` },
  { key: 'maturity.section1.q1', val: `"Then we will no longer be infants, tossed back and forth by the waves... Instead, speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ." (Ephesians 4:14-15)` },
  { key: 'membership.section1.q1', val: `The New Testament doesn't know anything about isolated, free-agent Christians. When Paul wrote his letters, he wrote them to churches — specific, named, local communities of believers who were committed to one another (1 Corinthians 12:12-27).` },
  { key: 'membership.section2.q1', val: `We believe the Bible is the inspired, authoritative Word of God. We believe in one God eternally existent in three persons: Father, Son, and Holy Spirit. We believe in salvation by grace through faith in Jesus Christ alone.` },
  { key: 'mentorship.section1.q1', val: `"Walk with the wise and become wise, for a companion of fools suffers harm." (Proverbs 13:20)` },
  { key: 'scriptureMemory.section1.q1', val: `"I have hidden your word in my heart that I might not sin against you." (Psalm 119:11)` },
  { key: 'serving.section1.q1', val: `"For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." (Ephesians 2:10)` },
  
  // Also auth keys that were deleted
  { key: 'auth.joinDashboard', val: `Join Dashboard` },
  { key: 'auth.joinDashboardSubtitle', val: `Enter your invite code to create your account.` },
  { key: 'auth.fullNameLabel', val: `Full Name` },
  { key: 'auth.emailLabel', val: `Email Address` },
  { key: 'auth.newPasswordLabel', val: `New Password` },
  { key: 'auth.createAccountBtn', val: `Create Account` },
  { key: 'auth.forgotPasswordTitle', val: `Forgot Password` },
  { key: 'auth.forgotPasswordSubtitle', val: `Enter your email and we'll send you a link to reset your password.` },
  { key: 'auth.directResetLink', val: `Direct Reset Link:` },
  { key: 'auth.openResetForm', val: `Open Password Reset Form →` },
  { key: 'auth.returnToSignIn', val: `Return to Sign In` },
  { key: 'auth.rememberPassword', val: `Remember your password?` },
  { key: 'auth.resetPasswordSubtitle', val: `Enter your new password below.` },
  { key: 'auth.confirmPasswordLabel', val: `Confirm Password` },
  { key: 'auth.updatePasswordBtn', val: `Update Password` }
];

let lines = content.split('\n');
const lastBraceIndex = lines.findIndex(line => line.trim() === '};');

for (const {key, val} of additions) {
    if (!content.includes(`'${key}':`)) {
        lines.splice(lastBraceIndex, 0, `  '${key}': '${val.replace(/'/g, "\\'")}',`);
    }
}

fs.writeFileSync(enTsPath, lines.join('\n'));
console.log('done updating en.ts');
