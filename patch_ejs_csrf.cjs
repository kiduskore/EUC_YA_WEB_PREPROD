const fs = require('fs');
const path = require('path');

const addCsrfToForm = (filePath) => {
  const file = path.join(__dirname, filePath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /(<form[^>]*>)/,
    '$1\n                        <input type="hidden" name="csrf_token" value="<%= typeof csrf_token !== \'undefined\' ? csrf_token : \'\' %>">'
  );
  fs.writeFileSync(file, content);
};

addCsrfToForm('views/login.ejs');
addCsrfToForm('views/claim_account.ejs');
addCsrfToForm('views/forgot_password.ejs');
addCsrfToForm('views/reset_password.ejs');

console.log("EJS CSRF patched");
