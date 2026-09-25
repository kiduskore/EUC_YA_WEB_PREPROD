const fs = require('fs');
let html = fs.readFileSync('views/membership.ejs', 'utf-8');

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.heroTitle'\) : 'Plant Your Roots\.' %>/g,
    'Connecting to the Church.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.heroSubtitle'\) : 'Commit to a local body and be known\.' %>/g,
    'Bible Study &rarr; Discipleship &rarr; Church Community &rarr; One Body'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.section1\.title'\) : 'Why Membership Matters' %>/g,
    'A Ministry of Fellowship and Discipleship'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.section1\.q1'\) : 'The New Testament doesn\\'t know anything about isolated, free-agent Christians\. When Paul wrote his letters, he wrote them to churches — specific, named, local communities of believers who were committed to one another \\(1 Corinthians 12:12-27\\)\.' %>/g,
    'Our Bible study is a ministry of fellowship and discipleship, but we also want people to become connected to the larger church family. We want people to experience that we are not building a separate community disconnected from the church. We are helping people become part of one Body in Christ.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.section1\.p1'\) : 'Membership is not a country club card — it is you saying, "I am choosing to be known here\. I am choosing to be accountable here\. I am planting my life in this soil and letting my roots go deep\."' %>/g,
    'We intentionally encourage Bible study participants to: Attend Friday worship & prayer &rarr; Attend Sunday worship &rarr; Build relationships within the church &rarr; Participate in church ministries &rarr; Become members of Emmanuel United Church.'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.section3\.title'\) : 'The Membership Covenant' %>/g,
    'Belonging Before Believing'
);

html = html.replace(
    /<%= typeof t !== 'undefined' \? t\('membership\.section3\.p1'\) : 'Membership is a two-way covenant\. As a member, you commit to gather consistently, serve with your spiritual gifts, give generously, pursue holiness, and live in authentic community\.' %>/g,
    'We also recognize that not everyone who attends our Bible study will immediately become a member of Emmanuel United Church. We will welcome them, love them, disciple them, and encourage them without making membership a condition for belonging to the Bible study. Our hope is that, over time, they will understand the beauty of being connected to the local church and choose to become part of Emmanuel United Church.'
);

fs.writeFileSync('views/membership.ejs', html);
