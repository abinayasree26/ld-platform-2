const { query } = require('./src/config/database');
const { generateQuestionsForLevel, getPreparedQuestions } = require('./src/services/questionGenerator');
const { isAvailable } = require('./src/services/llamaService');

async function run() {
  // Check AI
  const aiReady = await isAvailable();
  if (!aiReady) {
    console.error('❌ AI not available! Start llama.cpp first.');
    process.exit(1);
  }

  // Find all students who have completed screening but don't have prepared questions
  const { rows: students } = await query(`
    SELECT DISTINCT s.user_id, s.ld_type, s.class_grade, s.age, u.email, s.current_level
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.ld_type IS NOT NULL
  `);

  console.log(`Found ${students.length} screened students\n`);

  for (const st of students) {
    const level = st.current_level || 1;
    
    // Check if they already have prepared questions for their current level
    const existing = await getPreparedQuestions(st.user_id, level);
    if (existing && existing.length >= 10) {
      console.log(`✅ ${st.email} — Level ${level} already has ${existing.length} questions`);
      continue;
    }

    console.log(`⏳ ${st.email} — Generating Level ${level} (LD: ${st.ld_type})...`);
    await generateQuestionsForLevel(st.user_id, level, {
      ldType: st.ld_type,
      grade: st.class_grade,
      age: st.age,
    });

    // Verify
    const prepared = await getPreparedQuestions(st.user_id, level);
    console.log(`   ✅ Done! ${prepared ? prepared.length : 0} questions ready\n`);
  }

  console.log('\n🎯 All students have questions ready!');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
