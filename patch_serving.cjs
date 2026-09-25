const fs = require('fs');
let html = fs.readFileSync('views/serving.ejs', 'utf-8');

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.heroTitle'\) : 'Use Your Gifts\.' %>/g,
    'Discover Your Calling.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.heroSubtitle'\) : 'You were created on purpose, with purpose — now step into it\.' %>/g,
    'Serve according to your gifts and help someone else grow.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.section1\.title'\) : 'Created to Serve' %>/g,
    'Everyone is Called to be a Disciple'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.section1\.p1'\) : 'You were not saved merely to sit in a seat and consume\. You were redeemed and commissioned to bring the light of Jesus to your world through active service\.' %>/g,
    'Not everyone will be a leader. Not everyone will serve in the same way. But everyone is called to be a disciple. That is how disciples make disciples.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.section2\.title'\) : 'Where You Can Serve' %>/g,
    'How You Can Serve'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('serving\.section2\.p1'\) : 'From worship team to sound engineering, hospitality, greeting, youth ministry, and local outreach — there is an open door for your unique spiritual gifts\.' %>/g,
    'Some may lead. Some may teach. Some may worship. Some may serve behind the scenes. Some may encourage. Some may pray. Some may simply faithfully live out their calling in their everyday life.'
);

fs.writeFileSync('views/serving.ejs', html);
