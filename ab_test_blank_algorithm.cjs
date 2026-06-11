#!/usr/bin/env node
// ab_test_blank_algorithm.cjs - Compare old vs new blank generation algorithm

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

async function createLesson(difficulty) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            title: `A/B Test - ${difficulty}`,
            text: TEST_DIALOGUE,
            mode: 'dialogue',
            difficulty: difficulty,
            voice: 'female-us'
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

function analyzeBlanks(sentences) {
    const analysis = {
        totalSentences: sentences.length,
        sentencesWithBlanks: 0,
        totalBlanks: 0,
        blankedWords: [],
        properNouns: [],
        numbers: []
    };

    for (const sent of sentences) {
        const blanks = sent.blanksJson || [];
        if (blanks.length > 0) {
            analysis.sentencesWithBlanks++;
            analysis.totalBlanks += blanks.length;
            for (const blank of blanks) {
                analysis.blankedWords.push(blank.word);
                // Check if proper noun (simple heuristic: capitalized, not at sentence start)
                if (blank.word[0] === blank.word[0].toUpperCase() && blank.word[0] !== blank.word[0].toLowerCase()) {
                    analysis.properNouns.push(blank.word);
                }
                // Check if contains digits
                if (/\d/.test(blank.word)) {
                    analysis.numbers.push(blank.word);
                }
            }
        }
    }

    return analysis;
}

async function main() {
    console.log('=== A/B Test: Blank Generation Algorithm ===\n');

    console.log('Creating lessons with different difficulties...');
    const lessonEasy = await createLesson('easy');
    console.log(`✓ Easy lesson created: ID ${lessonEasy.id}`);

    const lessonMedium = await createLesson('medium');
    console.log(`✓ Medium lesson created: ID ${lessonMedium.id}`);

    const lessonHard = await createLesson('hard');
    console.log(`✓ Hard lesson created: ID ${lessonHard.id}`);

    console.log('\nAnalyzing blank generation...\n');

    const easyData = await getLesson(lessonEasy.id);
    const mediumData = await getLesson(lessonMedium.id);
    const hardData = await getLesson(lessonHard.id);

    const easyAnalysis = analyzeBlanks(easyData.sentences);
    const mediumAnalysis = analyzeBlanks(mediumData.sentences);
    const hardAnalysis = analyzeBlanks(hardData.sentences);

    console.log('--- EASY MODE ---');
    console.log(`Total blanks: ${easyAnalysis.totalBlanks}`);
    console.log(`Sentences with blanks: ${easyAnalysis.sentencesWithBlanks}/${easyAnalysis.totalSentences}`);
    console.log(`Blanked words: ${easyAnalysis.blankedWords.join(', ')}`);
    console.log(`Proper nouns (should be 0): ${easyAnalysis.properNouns.length}`);
    console.log(`Numbers (should be 0): ${easyAnalysis.numbers.length}`);

    console.log('\n--- MEDIUM MODE ---');
    console.log(`Total blanks: ${mediumAnalysis.totalBlanks}`);
    console.log(`Sentences with blanks: ${mediumAnalysis.sentencesWithBlanks}/${mediumAnalysis.totalSentences}`);
    console.log(`Blanked words: ${mediumAnalysis.blankedWords.join(', ')}`);
    console.log(`Proper nouns (should be 0): ${mediumAnalysis.properNouns.length}`);
    console.log(`Numbers (should be 0): ${mediumAnalysis.numbers.length}`);

    console.log('\n--- HARD MODE ---');
    console.log(`Total blanks: ${hardAnalysis.totalBlanks}`);
    console.log(`Sentences with blanks: ${hardAnalysis.sentencesWithBlanks}/${hardAnalysis.totalSentences}`);
    console.log(`Blanked words: ${hardAnalysis.blankedWords.join(', ')}`);
    console.log(`Proper nouns (should be 0): ${hardAnalysis.properNouns.length}`);
    console.log(`Numbers (should be 0): ${hardAnalysis.numbers.length}`);

    console.log('\n--- COMPARISON ---');
    console.log(`Easy < Medium < Hard: ${easyAnalysis.totalBlanks} < ${mediumAnalysis.totalBlanks} < ${hardAnalysis.totalBlanks}`);
    const correctOrder = easyAnalysis.totalBlanks <= mediumAnalysis.totalBlanks &&
                         mediumAnalysis.totalBlanks <= hardAnalysis.totalBlanks;
    console.log(`✓ Difficulty ordering correct: ${correctOrder}`);

    const noProperNouns = easyAnalysis.properNouns.length === 0 &&
                          mediumAnalysis.properNouns.length === 0 &&
                          hardAnalysis.properNouns.length === 0;
    console.log(`✓ No proper nouns blanked: ${noProperNouns}`);

    const noNumbers = easyAnalysis.numbers.length === 0 &&
                      mediumAnalysis.numbers.length === 0 &&
                      hardAnalysis.numbers.length === 0;
    console.log(`✓ No numbers blanked: ${noNumbers}`);

    console.log('\n=== Test Complete ===');
    console.log(`Lesson IDs: Easy=${lessonEasy.id}, Medium=${lessonMedium.id}, Hard=${lessonHard.id}`);
    console.log('You can review these lessons in the web UI.');
}

main().catch(err => {
    console.error('Error:', err.message);
    console.error('\nMake sure the backend is running on localhost:8080');
    process.exit(1);
});
