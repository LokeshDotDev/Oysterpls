export interface AmortizationLine {
  installmentNo: number;
  dueDate: Date;
  principal: number;
  interest: number;
  amountDue: number;
}

export function calculateEmi(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  type: 'FLAT' | 'REDUCING'
): number {
  if (tenureMonths <= 0) return 0;
  
  if (type === 'FLAT') {
    const totalInterest = principal * (annualRate / 100) * (tenureMonths / 12);
    return Math.round(((principal + totalInterest) / tenureMonths) * 100) / 100;
  } else {
    // REDUCING balance interest
    const r = (annualRate / 12) / 100;
    if (r === 0) return Math.round((principal / tenureMonths) * 100) / 100;
    
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
  }
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  type: 'FLAT' | 'REDUCING',
  startDate: Date
): AmortizationLine[] {
  const schedule: AmortizationLine[] = [];
  const emi = calculateEmi(principal, annualRate, tenureMonths, type);
  
  let outstandingPrincipal = principal;
  let currentDate = new Date(startDate);

  for (let i = 1; i <= tenureMonths; i++) {
    // Increment to next month's due date
    currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    
    let interest = 0;
    let principalPaid = 0;

    if (type === 'FLAT') {
      const annualRateFraction = annualRate / 100;
      interest = Math.round(((principal * annualRateFraction) / 12) * 100) / 100;
      principalPaid = Math.round((principal / tenureMonths) * 100) / 100;
    } else {
      // REDUCING
      const r = (annualRate / 12) / 100;
      interest = Math.round((outstandingPrincipal * r) * 100) / 100;
      principalPaid = Math.round((emi - interest) * 100) / 100;
    }

    // Adjust for rounding on the final installment
    if (i === tenureMonths) {
      principalPaid = Math.round(outstandingPrincipal * 100) / 100;
      interest = Math.round((emi - principalPaid) * 100) / 100;
      if (interest < 0) interest = 0;
    }

    schedule.push({
      installmentNo: i,
      dueDate: new Date(currentDate),
      principal: principalPaid,
      interest: interest,
      amountDue: Math.round((principalPaid + interest) * 100) / 100,
    });

    outstandingPrincipal -= principalPaid;
  }

  return schedule;
}

export interface ForeclosureQuote {
  outstandingPrincipal: number;
  accruedInterest: number;
  foreclosureCharges: number;
  totalAmountDue: number;
}

export function calculateForeclosureQuote(
  outstandingPrincipal: number,
  annualRate: number,
  daysSinceLastEmi: number,
  chargePercentage = 2.00
): ForeclosureQuote {
  // Compute accrued interest since last billing date
  const dailyRate = annualRate / 365 / 100;
  const accruedInterest = Math.round((outstandingPrincipal * dailyRate * daysSinceLastEmi) * 100) / 100;
  const foreclosureCharges = Math.round((outstandingPrincipal * (chargePercentage / 100)) * 100) / 100;
  
  return {
    outstandingPrincipal,
    accruedInterest,
    foreclosureCharges,
    totalAmountDue: Math.round((outstandingPrincipal + accruedInterest + foreclosureCharges) * 100) / 100,
  };
}

export function calculateOverdueCharges(
  dueDate: Date,
  amountDue: number,
  amountPaid: number,
  annualLateFeeRate: number,
  bounceCharge: number,
  failedAttempts: number
): { penalty: number; lateFee: number; totalDue: number } {
  const unpaidAmount = amountDue - amountPaid;
  if (unpaidAmount <= 0) {
    return { penalty: 0, lateFee: 0, totalDue: 0 };
  }

  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate late fee: unpaid amount * (annual rate / 365 / 100) * days
  const dailyRate = (annualLateFeeRate / 100) / 365;
  const lateFee = Math.round((unpaidAmount * dailyRate * diffDays) * 100) / 100;

  // Bounce charge: applied flat per failed debit attempt
  const penalty = failedAttempts * bounceCharge;

  return {
    penalty,
    lateFee,
    totalDue: Math.round((unpaidAmount + penalty + lateFee) * 100) / 100,
  };
}
