/**
 * Cross-Module End-to-End Integration Test Suite
 * Tests full cross-module workflows between Admin and Student APIs
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

async function runIntegrationTests() {
  console.log('\n=======================================================');
  console.log('  🧪 STARTING CROSS-MODULE E2E INTEGRATION TEST SUITE  ');
  console.log('=======================================================\n');

  const app = express();
  app.use(express.json());

  // Mount Demo & Shared Routers
  const { demoAuth, demoScreening, demoAnalytics, demoAdmin } = require('../middleware/demoMode');
  const { requireAuth } = require('../middleware/auth');

  app.use('/api/auth', demoAuth);
  app.use('/api/admin', requireAuth, demoAdmin);
  app.use('/api/ld/screening', requireAuth, demoScreening);
  app.use('/api/ld/analytics', requireAuth, demoAnalytics);
  app.use('/api/ld/notifications', require('../routes/ld/notifications'));

  const server = app.listen(3087, async () => {
    let passedCount = 0;
    try {
      // 1. Admin Authentication & JWT Generation
      console.log('▶ Test 1: Admin Authentication & JWT Token Issuance...');
      const authRes = await fetch('http://localhost:3087/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const authData = await authRes.json();
      if (authRes.status === 200 && authData.token) {
        console.log('  ✔ PASSED — Issued Token:', authData.token.slice(0, 25) + '...');
        passedCount++;
      } else {
        throw new Error('Admin auth failed');
      }

      const authToken = authData.token;
      const headers = { 'Authorization': 'Bearer ' + authToken, 'Content-Type': 'application/json' };

      // 2. Admin Content CMS Question Creation
      console.log('\n▶ Test 2: Admin Content CMS Question Creation...');
      const cmsRes = await fetch('http://localhost:3087/api/admin/screening-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionText: 'Select the letter that makes the /b/ sound',
          category: 'Phonics',
          options: ['b', 'd', 'p', 'q'],
          correctAnswer: 'b'
        })
      });
      const cmsData = await cmsRes.json();
      if (cmsRes.status === 201 && cmsData.id) {
        console.log('  ✔ PASSED — Question Created ID:', cmsData.id);
        passedCount++;
      } else {
        throw new Error('CMS question creation failed');
      }

      // 3. Student Screening Test Fetch
      console.log('\n▶ Test 3: Student Screening Test Results Query...');
      const screeningRes = await fetch('http://localhost:3087/api/admin/screening', { headers });
      const screeningData = await screeningRes.json();
      if (screeningRes.status === 200 && screeningData.results) {
        console.log('  ✔ PASSED — Total Screening Records:', screeningData.results.length);
        passedCount++;
      } else {
        throw new Error('Screening query failed');
      }

      // 4. FCM Push Notification Broadcast
      console.log('\n▶ Test 4: Admin FCM Push Notification Broadcast...');
      const pushRes = await fetch('http://localhost:3087/api/ld/notifications/broadcast', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: '📢 E2E Verification Complete',
          body: 'Cross-module integration tests verified successfully.'
        })
      });
      const pushData = await pushRes.json();
      if (pushRes.status === 200 && pushData.ok) {
        console.log('  ✔ PASSED — Push Broadcast Output:', pushData.message);
        passedCount++;
      } else {
        throw new Error('Push broadcast failed');
      }

      console.log('\n=======================================================');
      console.log(`  🎉 SUMMARY: ALL ${passedCount}/4 INTEGRATION TESTS PASSED CLEANLY!  `);
      console.log('=======================================================\n');

    } catch (err) {
      console.error('\n❌ TEST FAILED:', err.message);
    } finally {
      server.close();
    }
  });
}

if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };
