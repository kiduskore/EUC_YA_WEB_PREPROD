const fs = require('fs');

const updateTranslations = (filePath, isEnglish) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the title
    content = content.replace(/'connect\.location\.title': '.*?',/, "'connect.location.title': 'Emmanuel United Church of MD',");
    
    // Replace the desc
    const newDesc = "'Sunday Service, @10:30AM\\n12604 New Hampshire Ave, Silver Spring, MD 20904\\nCell: +12407162246'";
    content = content.replace(/'connect\.location\.desc': '.*?',/, "'connect.location.desc': " + newDesc + ",");

    // Fix am.ts and ti.ts specifically for the title to use Amharic/Tigrinya translation "ኢማኑኤል ዩናይትድ ቸርች ኦፍ ሜሪላንድ" if it was there before?
    // Actually, I'll just keep it English for consistency with the user's exact string request, or I can preserve the translated title. Let's just use the user's request.
    
    fs.writeFileSync(filePath, content);
};

updateTranslations('./src/i18n/locales/en.ts', true);
updateTranslations('./src/i18n/locales/am.ts', false);
updateTranslations('./src/i18n/locales/ti.ts', false);
updateTranslations('./src/i18n/locales/om.ts', false);

// Also update join-section.ejs default text
const ejsPath = './views/partials/join-section.ejs';
if (fs.existsSync(ejsPath)) {
    let ejsContent = fs.readFileSync(ejsPath, 'utf-8');
    ejsContent = ejsContent.replace(
        "<%= typeof t !== 'undefined' ? t('connect.location.title') : 'Meeting Location' %>",
        "<%= typeof t !== 'undefined' ? t('connect.location.title') : 'Emmanuel United Church of MD' %>"
    );
    ejsContent = ejsContent.replace(
        "<%= typeof t !== 'undefined' ? t('connect.location.desc') : 'Emmanuel United Church of MD\\n11800 Scaggsville Rd, Fulton, MD 20759' %>",
        "<%= typeof t !== 'undefined' ? t('connect.location.desc') : 'Sunday Service, @10:30AM\\n12604 New Hampshire Ave, Silver Spring, MD 20904\\nCell: +12407162246' %>"
    );
    fs.writeFileSync(ejsPath, ejsContent);
}

