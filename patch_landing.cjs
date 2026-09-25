const fs = require('fs');
let html = fs.readFileSync('views/landing.ejs', 'utf-8');

// Update Next Steps text
html = html.replace(/2\. Join a Small Group/g, '2. Join a Tribe');
html = html.replace(/Authentic community where life happens. Find your circle and build deep, Christ-centered friendships./g, 'A family within the family. Connect to one of our 12 tribes for prayer, fellowship, and belonging.');
html = html.replace(/Find a Group/g, 'Find a Tribe');

html = html.replace(/3\. Discover Your Calling/g, '3. Make Disciples');
html = html.replace(/Use your God-given gifts to serve others and advance the Kingdom in Maryland and beyond./g, 'Not everyone will lead, but everyone is called to be a disciple. Serve according to your gifts and help someone else grow.');
html = html.replace(/Start Serving/g, 'Start Your Journey');

html = html.replace(/Join us every Tuesday at 7:00 PM for powerful worship and diving deep into the Word./g, 'Join us every Tuesday for our unique DNA: Fasting, Prayer, Worship, Word, Discussion, and Fellowship.');

html = html.replace(/A vibrant community of believers/g, 'Grow Bigger, Stay Closer.');
html = html.replace(/Growing Together in Grace/g, 'Growing Together in the Word, Prayer & Fellowship');
html = html.replace(/Empowering the next generation/g, 'We Are Building a Spiritual Family');

fs.writeFileSync('views/landing.ejs', html);
