import prisma from './db';
import { calculateEmi } from './emi-engine';
import { LoanProduct, Profile } from '@prisma/client';

export interface EligibilityResult {
  eligible: boolean;
  riskFlags: string[];
  results: {
    age: { value: number; passed: boolean; limit: number };
    income: { value: number; passed: boolean; limit: number };
    employmentDuration: { value: number; passed: boolean; limit: number };
    foir: { value: number; passed: boolean; limit: number; proposedEmi: number };
    pincode: { value: string; passed: boolean };
    loanAmount: { value: number; passed: boolean; min: number; max: number };
    loanTenure: { value: number; passed: boolean; min: number; max: number };
    cibil: { value: number | string; passed: boolean; limit: number };
  };
}

export async function evaluateEligibility(
  profile: Profile,
  product: LoanProduct,
  requestedAmount: number,
  requestedTenure: number
): Promise<EligibilityResult> {
  const riskFlags: string[] = [];
  
  // 1. Fetch Eligibility Rules from DB
  const dbRules = await prisma.eligibilityRule.findMany();
  const getRuleVal = (name: string, defaultVal: any) => {
    const r = dbRules.find((x) => x.name === name);
    return r ? (r.value as any) : defaultVal;
  };

  const minAgeRule = getRuleVal('MIN_AGE', { minAge: 21 });
  const maxAgeRule = getRuleVal('MAX_AGE', { maxAge: 60 });
  const minIncomeRule = getRuleVal('MIN_INCOME', { minIncome: 25000 });
  const minEmpDurationRule = getRuleVal('MIN_EMPLOYMENT_DURATION', { minDuration: 12 });
  const maxFoirRule = getRuleVal('MAX_FOIR', { maxFoirPercent: 50 });
  const blacklistedPincodesRule = getRuleVal('BLACKLISTED_PINCODES', { pincodes: [] });
  const minCibilRule = getRuleVal('MIN_CIBIL_SCORE', { minScore: 650 });

  // 2. Perform Age Check
  const today = new Date();
  const dob = new Date(profile.dob);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  const agePassed = age >= minAgeRule.minAge && age <= maxAgeRule.maxAge;
  if (age < minAgeRule.minAge) riskFlags.push('UNDER_AGE');
  if (age > maxAgeRule.maxAge) riskFlags.push('OVER_AGE');

  // 3. Perform Income Check
  const monthlyIncome = Number(profile.monthlyIncome);
  const incomePassed = monthlyIncome >= minIncomeRule.minIncome;
  if (!incomePassed) riskFlags.push('UNDER_INCOME');

  // 4. Perform Employment Duration Check
  const empDurationPassed = profile.employmentDuration >= minEmpDurationRule.minDuration;
  if (!empDurationPassed) riskFlags.push('UNDER_EMPLOYED');

  // 5. Perform FOIR Check
  // Estimate proposed loan installment
  const proposedEmi = calculateEmi(
    requestedAmount,
    Number(product.interestRate),
    requestedTenure,
    product.interestType as 'FLAT' | 'REDUCING'
  );

  const totalObligations = Number(profile.existingEmi) + proposedEmi;
  const foir = monthlyIncome > 0 ? (totalObligations / monthlyIncome) * 100 : 100;
  const foirPassed = foir <= maxFoirRule.maxFoirPercent;
  if (!foirPassed) riskFlags.push('FOIR_LIMIT_EXCEEDED');

  // 6. Perform Pincode Check
  const isPincodeBlacklisted = blacklistedPincodesRule.pincodes.includes(profile.pincode);
  const pincodePassed = !isPincodeBlacklisted;
  if (isPincodeBlacklisted) riskFlags.push('BLACKLISTED_PINCODE');

  // 7. Perform Loan Product Limits Checks
  const minAmount = Number(product.minAmount);
  const maxAmount = Number(product.maxAmount);
  const amountPassed = requestedAmount >= minAmount && requestedAmount <= maxAmount;
  if (!amountPassed) riskFlags.push('INVALID_LOAN_AMOUNT');

  const tenurePassed = requestedTenure >= product.minTenure && requestedTenure <= product.maxTenure;
  if (!tenurePassed) riskFlags.push('INVALID_LOAN_TENURE');

  // 8. Perform CIBIL Score Check
  const cibil = profile.cibilScore !== null ? Number(profile.cibilScore) : null;
  const cibilPassed = cibil === null || cibil >= minCibilRule.minScore;
  if (cibil !== null && !cibilPassed) riskFlags.push('LOW_CIBIL_SCORE');

  const eligible = riskFlags.length === 0;

  return {
    eligible,
    riskFlags,
    results: {
      age: { value: age, passed: agePassed, limit: age < minAgeRule.minAge ? minAgeRule.minAge : maxAgeRule.maxAge },
      income: { value: monthlyIncome, passed: incomePassed, limit: minIncomeRule.minIncome },
      employmentDuration: { value: profile.employmentDuration, passed: empDurationPassed, limit: minEmpDurationRule.minDuration },
      foir: { value: Math.round(foir * 100) / 100, passed: foirPassed, limit: maxFoirRule.maxFoirPercent, proposedEmi },
      pincode: { value: profile.pincode, passed: pincodePassed },
      loanAmount: { value: requestedAmount, passed: amountPassed, min: minAmount, max: maxAmount },
      loanTenure: { value: requestedTenure, passed: tenurePassed, min: product.minTenure, max: product.maxTenure },
      cibil: { value: cibil !== null ? cibil : 'N/A', passed: cibilPassed, limit: minCibilRule.minScore },
    },
  };
}
