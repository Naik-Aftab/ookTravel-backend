/**
 * Email test script — run with:  node test-email.js
 * All test emails are sent to TEST_TO (defaults to SMTP_USER).
 */
require('dotenv').config();

const {
  sendEmail,
  agentWelcomeEmail,
  onboardingCertificateEmail,
  commissionPaidEmail,
  rmApprovalEmail,
} = require('../src/utils/email');

const TEST_TO = process.env.TEST_EMAIL || process.env.SMTP_USER;

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockAgent = {
  id:          1,
  full_name:   'Rajesh Kumar',
  email:       TEST_TO,
  mobile:      '9876543210',
  agency_name: 'Kumar Travels',
  status:      'active',
  kyc_status:  'verified',
};

const mockAgentPending = { ...mockAgent, status: 'pending', kyc_status: 'pending' };

const mockRm = {
  id:        1,
  full_name: 'Priya Sharma',
  email:     TEST_TO,
};

// ─── Test runner ──────────────────────────────────────────────────────────────

const tests = [
  {
    name:    'Welcome Email — Active (RM assigned at signup)',
    payload: agentWelcomeEmail(mockAgent),
  },
  {
    name:    'Welcome Email — Pending (no RM at signup)',
    payload: agentWelcomeEmail(mockAgentPending),
  },
  {
    name:    'Onboarding Certificate (KYC verified)',
    payload: onboardingCertificateEmail(mockAgent),
  },
  {
    name:    'Commission Paid',
    payload: commissionPaidEmail(mockAgent, '2,500'),
  },
  {
    name:    'RM Approval',
    payload: rmApprovalEmail(mockRm),
  },
];

async function run() {
  console.log(`\nSending ${tests.length} test emails to: ${TEST_TO}\n`);

  for (const test of tests) {
    process.stdout.write(`  ▶ ${test.name} ... `);
    try {
      // Override recipient to TEST_TO regardless of what the template sets
      await sendEmail({ ...test.payload, to: TEST_TO });
      console.log('✓ sent');
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
    }
  }

  console.log('\nDone.\n');
}

run();
