import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Default Users for testing
  const users = [
    { phoneNumber: '+919999999999', email: 'admin@lending.com', role: Role.ADMIN },
    { phoneNumber: '+918888888888', email: 'officer@lending.com', role: Role.LOAN_OFFICER },
    { phoneNumber: '+917777777777', email: 'ops@lending.com', role: Role.OPERATIONS },
    { phoneNumber: '+916666666666', email: 'finance@lending.com', role: Role.FINANCE },
    { phoneNumber: '+915555555555', email: 'collections@lending.com', role: Role.COLLECTIONS },
    { phoneNumber: '+919876543210', email: 'customer@lending.com', role: Role.CUSTOMER },
    { phoneNumber: '+918765432109', email: 'merchant@lending.com', role: Role.MERCHANT },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { phoneNumber: u.phoneNumber },
      update: { role: u.role, email: u.email },
      create: { phoneNumber: u.phoneNumber, email: u.email, role: u.role },
    });
  }
  console.log('Users seeded.');

  // 2. Create Loan Products
  const products = [
    {
      name: 'Personal Loan (Reducing)',
      description: 'Standard personal loan with reducing balance interest computation.',
      minAmount: 50000,
      maxAmount: 500000,
      interestRate: 12.50,
      interestType: 'REDUCING',
      minTenure: 6,
      maxTenure: 36,
      processingFee: 1500,
      lateFeeRate: 2.00, // 2% per month
      bounceCharge: 500,
      isActive: true,
      downPaymentRate: 20.00,
      dbdRate: 2.00,
      supportedFrequencies: ['MONTHLY', 'WEEKLY', 'FORTNIGHTLY'],
      insurancePlans: [
        { name: 'Standard Protection', type: 'PERCENTAGE', value: 2.0 },
        { name: 'Screen Damage Protection', type: 'FIXED', value: 1500 },
        { name: 'Extended Warranty', type: 'PERCENTAGE', value: 3.5 }
      ],
    },
    {
      name: 'Merchant Growth Capital (Flat)',
      description: 'Quick merchant capital loan with flat interest charging.',
      minAmount: 20000,
      maxAmount: 200000,
      interestRate: 15.00,
      interestType: 'FLAT',
      minTenure: 3,
      maxTenure: 12,
      processingFee: 1000,
      lateFeeRate: 2.50,
      bounceCharge: 350,
      isActive: true,
      downPaymentRate: 10.00,
      dbdRate: 1.50,
      supportedFrequencies: ['MONTHLY', 'WEEKLY'],
      insurancePlans: [
        { name: 'Standard Protection', type: 'PERCENTAGE', value: 1.5 },
        { name: 'Extended Warranty', type: 'FIXED', value: 1000 }
      ],
    },
  ];

  for (const p of products) {
    await prisma.loanProduct.upsert({
      where: { name: p.name },
      update: {
        ...p,
        supportedFrequencies: p.supportedFrequencies,
        insurancePlans: p.insurancePlans,
      },
      create: {
        ...p,
        supportedFrequencies: p.supportedFrequencies,
        insurancePlans: p.insurancePlans,
      },
    });
  }
  console.log('Loan products seeded.');

  // 3. Create Configurable Eligibility Rules
  const rules = [
    {
      name: 'MIN_AGE',
      value: { minAge: 21 },
      description: 'Customer must be at least 21 years old.',
    },
    {
      name: 'MAX_AGE',
      value: { maxAge: 60 },
      description: 'Customer must be no older than 60 years old at the end of the loan.',
    },
    {
      name: 'MIN_INCOME',
      value: { minIncome: 25000 },
      description: 'Minimum monthly income required in INR.',
    },
    {
      name: 'MIN_EMPLOYMENT_DURATION',
      value: { minDuration: 12 },
      description: 'Minimum employment duration in months.',
    },
    {
      name: 'MAX_FOIR',
      value: { maxFoirPercent: 50 },
      description: 'Maximum Fixed Obligation to Income Ratio (percentage).',
    },
    {
      name: 'BLACKLISTED_PINCODES',
      value: { pincodes: ['110001', '400001', '560001'] },
      description: 'Array of blacklisted residential pincodes.',
    },
    {
      name: 'MIN_CIBIL_SCORE',
      value: { minScore: 650 },
      description: 'Minimum credit bureau CIBIL score required.',
    },
  ];

  for (const r of rules) {
    await prisma.eligibilityRule.upsert({
      where: { name: r.name },
      update: { value: r.value, description: r.description },
      create: { name: r.name, value: r.value, description: r.description },
    });
  }
  console.log('Eligibility rules seeded.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
