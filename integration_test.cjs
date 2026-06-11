#!/usr/bin/env node
// integration_test.cjs
// End-to-end test: create lesson → generate blanks → generate audio → verify

const http = require('http');

const API_BASE = 'http://localhost:8080/api';

const TEST_DIALOGUE = `Customer: Hello, I'd like to book a flight to London.
Agent: Sure, when would you like to travel?
Customer: Next Monday, preferably in the morning.
Agent: We have a flight at 9:30 AM, flight number BA256.
Customer: That's perfect! How much is the ticket?
Agent: It's $450 for economy class.
Customer: Great, I'll take it. My name is John Smith.
Agent: Thank you, Mr. Smith. Your reservation is confirmed.`;

async function createLesson() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            title: "Integration Test - Dialogue",
            text: TEST_DIALOGUE,
            mode: 'dialogue',
            difficulty: 'medium',
            voice: 'female_young'
        });

        const req = http.request(`${API_BASE}/lessons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function getLesson(id) {
    return new Promise((resolve, reject) => {
        http.get(`${API_BASE}/lessons/${id}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

async function generateAudio(id) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${API_BASE}/lessons/${id}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function verifyBlanks(sentences) {
    console.log('\n=== Verifying Blanks ===');

    let properNounsBlanked = [];
    let numbersBlanked = [];
    let totalBlanks = 0;

    for (const sent of sentences) {
        const blanks = sent.blanksJson || [];
        totalBlanks += blanks.length;

        for (const blank of blanks) {
            const word = blank.word;

            // Check for proper nouns (simple heuristic)
            if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
                properNounsBlanked.push(word);
            }

            // Check for numbers
            if (/\d/.test(word)) {
                numbersBlanked.push(word);
            }
        }
    }

    console.log(`Total blanks: ${totalBlanks}`);
    console.log(`Proper nouns blanked: ${properNounsBlanked.length === 0 ? '✓ None' : '✗ ' + properNounsBlanked.join(', ')}`);
    console.log(`Numbers blanked: ${numbersBlanked.length === 0 ? '✓ None' : '✗ ' + numbersBlanked.join(', ')}`);

    return properNounsBlanked.length === 0 && numbersBlanked.length === 0;
}

function verifyAudio(sentences) {
    console.log('\n=== Verifying Audio ===');

    let audioCount = 0;
    let voicesUsed = new Set();

    for (const sent of sentences) {
        if (sent.audioPath) {
            audioCount++;
            if (sent.voice) {
                voicesUsed.add(sent.voice);
            }
        }
    }

    console.log(`Audio files generated: ${audioCount}/${sentences.length}`);
    console.log(`Voices used: ${voicesUsed.size} (${Array.from(voicesUsed).join(', ')})`);
    console.log(`Multi-speaker: ${voicesUsed.size > 1 ? '✓ Yes' : '✗ No'}`);

    return audioCount === sentences.length && voicesUsed.size > 1;
}

async function main() {
    console.log('=== Integration Test: Full Workflow ===\n');

    console.log('Step 1: Create lesson...');
    const lesson = await createLesson();
    console.log(`✓ Lesson created: ID ${lesson.id}, ${lesson.sentences.length} sentences`);

    console.log('\nStep 2: Verify blanks...');
    const blanksOk = verifyBlanks(lesson.sentences);

    console.log('\nStep 3: Generate audio (this may take a minute)...');
    const audioLesson = await generateAudio(lesson.id);
    console.log(`✓ Audio generation complete, status: ${audioLesson.status}`);

    console.log('\nStep 4: Verify audio...');
    const audioOk = verifyAudio(audioLesson.sentences);

    console.log('\n=== Test Summary ===');
    console.log(`Blanks: ${blanksOk ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Audio: ${audioOk ? '✓ PASS' : '✗ FAIL'}`);

    if (blanksOk && audioOk) {
        console.log('\n✓ All tests passed!');
        console.log(`Lesson ID: ${lesson.id}`);
        console.log('You can review in web UI or listen to audio files.');
    } else {
        console.log('\n✗ Some tests failed.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
