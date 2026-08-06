/**
 * seedQuestionPool.js — Pre-generate a batch of AI questions into question_pool.
 *
 * Fills the offline fallback bank so students get grade-appropriate questions
 * even when the AI server (llama.cpp) is not running.
 *
 * Requires llama.cpp running (LLAMA_BASE_URL). Run:
 *   node src/db/seedQuestionPool.js
 *
 * Optional args:
 *   --grades=1,2,3        (default 1..8)
 *   --levels=1,2,3,4,5    (default 1..5)
 *   --categories=phonics,reading,writing,math  (default those 4)
 *   --per=5               questions per (grade,level,category) slot (default 5)
 */

require('../config/env');
const llamaService = require('../services/llamaService');
const questionPool = require('../services/questionPool');

function argVal(name, def) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
}

const GRADES = argVal('grades', '1,2,3,4,5,6,7,8').split(',').map(Number);
const LEVELS = argVal('levels', '1,2,3,4,5').split(',').map(Number);
const CATEGORIES = argVal('categories', 'phonics,reading,writing,math').split(',');
const PER = parseInt(argVal('per', '5'), 10);
const SCOPE = argVal('scope', 'practice');

async function run() {
  const ok = await llamaService.isAvailable();
  if (!ok) {
    console.error('❌ llama.cpp is not reachable. Start the AI server first, then re-run.');
    process.exit(1);
  }

  console.log(`🌱 Seeding question pool: grades=${GRADES}, levels=${LEVELS}, categories=${CATEGORIES}, per=${PER}`);
  let total = 0;

  for (const grade of GRADES) {
    for (const level of LEVELS) {
      for (const category of CATEGORIES) {
        // Skip if slot already has enough
        const existing = await questionPool.countPooled({ scope: SCOPE, category, grade, level });
        if (existing >= PER) {
          console.log(`  ⏭  G${grade} L${level} ${category}: already has ${existing}, skipping`);
          continue;
        }
        try {
          const questions = await llamaService.generatePracticeQuestions({
            category, grade, level, ldType: 'not_detected', count: PER,
          });
          if (questions && questions.length) {
            const savedIds = await questionPool.savePooled({ scope: SCOPE, category, grade, level, ldType: null, questions });
            const saved = Array.isArray(savedIds) ? savedIds.length : savedIds;
            total += saved;
            console.log(`  ✅ G${grade} L${level} ${category}: +${saved}`);
          } else {
            console.log(`  ⚠️  G${grade} L${level} ${category}: AI returned nothing`);
          }
        } catch (e) {
          console.log(`  ❌ G${grade} L${level} ${category}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Done. Inserted ${total} questions into the pool.`);
  process.exit(0);
}

run().catch(err => { console.error('Seed failed:', err); process.exit(1); });
