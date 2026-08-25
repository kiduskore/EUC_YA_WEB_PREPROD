const fs = require('fs');
const path = require('path');

const enTsPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.ts');
let content = fs.readFileSync(enTsPath, 'utf8');

const additions = [
  { key: 'salvation.section1.q1', val: 'The Bible names it clearly: "For all have sinned and fall short of the glory of God" (Romans 3:23). We were created for deep, unbroken relationship with our Creator, but sin — our decision to live as our own god — severed that connection at its root.' },
  { key: 'salvation.section2.q1', val: `But God didn't look at the wreckage of humanity and walk away. He ran toward us. "For God so loved the world, that He gave His only Son, that whoever believes in Him should not perish but have eternal life" (John 3:16).` },
  { key: 'salvation.section3.q1', val: `So how do you receive this? Salvation is not a checklist, a performance review, or something you earn by being "good enough." Scripture is crystal clear: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast" (Ephesians 2:8-9). It's a gift.` },
  { key: 'salvation.section4.q1', val: 'The second you placed your faith in Jesus, something supernatural happened. The Holy Spirit took up residence inside of you (Romans 8:9).' },
  { key: 'waterBaptism.section1.q1', val: 'Baptism does not save you — Jesus does. Baptism is an act of joyful obedience to the One who saved you. Before Jesus ascended, He gave this command: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit" (Matthew 28:19).' },
  { key: 'waterBaptism.section2.q1', val: 'First and most importantly: because Jesus did it (Matthew 3:13-17). If Jesus considered baptism essential to fulfill all righteousness, it matters deeply for every believer.' },
  { key: 'kingdom.section1.q1', val: 'The Kingdom of God is the sovereign rule and reign of Jesus Christ in the hearts of His people and across all creation. Jesus proclaimed: "The time is fulfilled, and the kingdom of God is at hand; repent and believe in the gospel" (Mark 1:15).' }
];

let lines = content.split('\n');
const lastBraceIndex = lines.findIndex(line => line.trim() === '};');

for (const {key, val} of additions) {
    if (!content.includes(`'${key}':`)) {
        lines.splice(lastBraceIndex, 0, `  '${key}': '${val.replace(/'/g, "\\'")}',`);
    }
}

fs.writeFileSync(enTsPath, lines.join('\n'));
console.log('done');
