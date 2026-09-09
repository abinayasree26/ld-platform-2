const { query } = require('./src/config/database');
const { clearPreparedQuestions } = require('./src/services/questionGenerator');

async function run() {
  const email = process.argv[2] || 'milo123@gmail.com';
  const user = (await query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
  if (!user) { console.error('User not found'); process.exit(1); }
  
  console.log(`Resetting ${email} to Level 1...`);
  
  // Reset current_level to 1
  await query('UPDATE students SET current_level=1 WHERE user_id=$1', [user.id]);
  
  // Clear all prepared questions
  for (let l = 1; l <= 5; l++) {
    await clearPreparedQuestions(user.id, l);
  }
  
  // Delete past test attempts (so fresh start)
  await query('DELETE FROM test_attempts WHERE student_id=$1', [user.id]);
  
  console.log('✅ Reset complete. Student is back at Level 1 with no history.');
  console.log('Now run: node trigger-generate.js ' + email + ' 1');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
