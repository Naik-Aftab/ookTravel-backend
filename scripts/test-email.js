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
  policyRequestInvoiceEmail,
} = require('../src/utils/email');
const { generatePolicyInvoicePdf }        = require('../src/utils/invoice-pdf');
const { generateOnboardingCertificatePdf } = require('../src/utils/certificate-pdf');
const { logoEmailAttachment }              = require('../src/utils/logo');

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

const mockPolicyRequestSingle = {
  request_number:     'OOK-REQ-1730000000000-123',
  traveler_name:      'Ananya Verma',
  traveler_email:     TEST_TO,
  travel_date:        '2026-08-10',
  return_date:        '2026-08-20',
  plan_type:          'individual',
  num_travelers:      1,
  estimated_premium:  499,
  payment_amount:     549, // 499 * 1 + Rs.50 platform fee
};

const mockPolicyRequestBulk = {
  request_number:     'OOK-REQ-1730000000000-456',
  traveler_name:      'Rohit Singh',
  traveler_email:     TEST_TO,
  travel_date:        '2026-09-01',
  return_date:        '2026-09-15',
  plan_type:          'bulk',
  num_travelers:      4,
  estimated_premium:  499,
  payment_amount:     2046, // 499 * 4 + Rs.50 platform fee
};

// ─── Test runner ──────────────────────────────────────────────────────────────

const tests = [
  // {
  //   name:    'Welcome Email — Active (RM assigned at signup)',
  //   payload: agentWelcomeEmail(mockAgent),
  // },
  // {
  //   name:    'Welcome Email — Pending (no RM at signup)',
  //   payload: agentWelcomeEmail(mockAgentPending),
  // },
  // {
  //   name:    'Commission Paid',
  //   payload: commissionPaidEmail(mockAgent, '2,500'),
  // },
  // {
  //   name:    'RM Approval',
  //   payload: rmApprovalEmail(mockRm),
  // },
  {
    name:    'Policy Request Invoice — Individual (with PDF + logo)',
    payload: policyRequestInvoiceEmail(mockPolicyRequestSingle),
    buildAttachments: async () => [logoEmailAttachment(), {
      filename:    `Invoice-${mockPolicyRequestSingle.request_number}.pdf`,
      content:     await generatePolicyInvoicePdf(mockPolicyRequestSingle),
      contentType: 'application/pdf',
    }],
  },
  {
    name:    'Policy Request Invoice — Bulk, 4 travellers (with PDF + logo)',
    payload: policyRequestInvoiceEmail(mockPolicyRequestBulk),
    buildAttachments: async () => [logoEmailAttachment(), {
      filename:    `Invoice-${mockPolicyRequestBulk.request_number}.pdf`,
      content:     await generatePolicyInvoicePdf(mockPolicyRequestBulk),
      contentType: 'application/pdf',
    }],
  },
  {
    name:    'Onboarding Certificate (KYC verified, with PDF + logo)',
    payload: onboardingCertificateEmail(mockAgent),
    buildAttachments: async () => [logoEmailAttachment(), {
      filename:    `Onboarding-Certificate-${mockAgent.id}.pdf`,
      content:     await generateOnboardingCertificatePdf(mockAgent),
      contentType: 'application/pdf',
    }],
  },
];

async function run() {
  console.log(`\nSending ${tests.length} test emails to: ${TEST_TO}\n`);

  for (const test of tests) {
    process.stdout.write(`  ▶ ${test.name} ... `);
    try {
      const attachments = test.buildAttachments ? await test.buildAttachments() : undefined;

      // Override recipient to TEST_TO regardless of what the template sets
      await sendEmail({ ...test.payload, to: TEST_TO, attachments });
      console.log('✓ sent');
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
    }
  }

  console.log('\nDone.\n');
}

run();
