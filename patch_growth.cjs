const fs = require('fs');
let html = fs.readFileSync('views/growth.ejs', 'utf-8');

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('growth\.heroTitle'\) : 'Spiritual Disciplines\.' %>/g,
    'Our Experiences.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('growth\.heroSubtitle'\) : 'Daily rhythms that shape a resilient faith\.' %>/g,
    'Warm • Spiritual • Young • Welcoming • Honest • Joyful • Deep'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('growth\.section1\.title'\) : 'Cultivating Spiritual Habits' %>/g,
    '12 Months • 12 Experiences'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('growth\.section1\.q1'\) : '"Train yourself to be godly\. For physical training is of some value, but godliness has value for all things\." \(1 Timothy 4:7-8\)' %>/g,
    'We want people to walk in and think: "There is something different about this community." Not because we are trying to be different for the sake of being different, but because we want to create an environment where people can feel welcomed, build relationships, encounter God, study His Word, be honest, and grow together.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('growth\.section1\.p1'\) : 'Spiritual growth is intentional\. Prayer, fasting, solitude, and daily scripture reading are the life-giving rhythms through which the Spirit conforms us into Christ\\'s image\.' %>/g,
    'Starting after January, we have one special program every month. Each month has a different theme: Identity in Christ, Prayer, Purpose & Calling, Relationships, Faith, Evangelism, Worship, Spiritual Growth, Christian Leadership, Young Adults & Life, Serving Others, Thanksgiving & Celebration.'
);

// Add Conferences section
const confHtml = `
            <div class="mb-8">
                <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-3">
                    <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    The Big Vision: Youth & Young Adult Conferences
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                    "Put the Net Near the Ocean" <br><br>
                    Our Bible study is the boat. Our members are the fishermen. Our conferences are the net. We don't only wait for people to come to us. We take the Gospel and the community where people are. 
                </p>
                <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                    We host 3 major gatherings every year (every 4 months) designed for our Bible study members, friends, young adults, church members, and people outside our community.
                </p>
            </div>
`;
html = html.replace('</div>\n        \n        <div class="mt-16', '</div>\n' + confHtml + '        \n        <div class="mt-16');


fs.writeFileSync('views/growth.ejs', html);
