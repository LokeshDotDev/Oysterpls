import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const isMock = keyId.startsWith('rzp_test_mock') || !keyId || !keySecret;

// Initialize Razorpay SDK client if not running in mock mode
const razorpayClient = isMock
  ? null
  : new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

export interface MandateResult {
  mandateId: string;
  authUrl: string;
}

export async function createRazorpayCustomer(
  name: string,
  email: string,
  phone: string
): Promise<string> {
  if (isMock) {
    console.log(`[Mock Razorpay] Creating customer: ${name}, ${email}, ${phone}`);
    return `cust_mock_${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    const customer = await razorpayClient!.customers.create({
      name,
      email: email || undefined,
      contact: phone,
    });
    return customer.id;
  } catch (error: any) {
    console.error('Razorpay Customer Creation Error:', error);
    throw new Error(error.description || 'Razorpay customer creation failed');
  }
}

export async function setupRazorpayMandate(
  applicationId: string,
  customerId: string,
  amount: number
): Promise<MandateResult> {
  if (isMock) {
    const mockMandateId = `sub_mock_${Math.random().toString(36).substr(2, 9)}`;
    // Returns a mock authentication URL pointing to our local simulator
    const authUrl = `/api/webhooks/razorpay/mock-auth-flow?applicationId=${applicationId}&mandateId=${mockMandateId}`;
    console.log(`[Mock Razorpay] Setting up mandate for customer ${customerId}, amount: ${amount}`);
    return { mandateId: mockMandateId, authUrl };
  }

  try {
    // eMandate is set up via Razorpay Subscriptions or Token Authorization Order
    // In standard eMandate, we create a subscription with custom parameters
    const subscription = await razorpayClient!.subscriptions.create({
      plan_id: 'plan_DEMO1234567', // In real setup, you create a plan beforehand or pass params
      customer_id: customerId,
      total_count: 12,
      quantity: 1,
      addons: [],
      notes: {
        applicationId,
      },
    } as any);

    return {
      mandateId: subscription.id,
      authUrl: subscription.short_url,
    };
  } catch (error: any) {
    console.error('Razorpay Mandate Setup Error:', error);
    throw new Error(error.description || 'Razorpay mandate creation failed');
  }
}

export async function chargeRazorpayMandate(
  mandateId: string,
  amount: number,
  description: string
): Promise<{ paymentId: string; status: 'captured' | 'failed' }> {
  if (isMock) {
    console.log(`[Mock Razorpay] Charging mandate ${mandateId} for amount ${amount}`);
    const success = Math.random() > 0.05; // 95% success rate for simulation
    return {
      paymentId: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
      status: success ? 'captured' : 'failed',
    };
  }

  try {
    // In real setup, we use Recurring Payments API to charge the token/subscription
    // razorpay.payments.createRecurring(...)
    // Since we are mocking eMandates for demo, we'll simulate real behavior.
    throw new Error('Real recurring debit requires production credentials.');
  } catch (error: any) {
    console.error('Razorpay Charge Mandate Error:', error);
    throw error;
  }
}

export async function triggerRazorpayXPayout(
  accountNo: string,
  ifsc: string,
  name: string,
  amount: number,
  referenceId: string
): Promise<{ payoutId: string; status: 'processed' | 'failed' }> {
  if (isMock) {
    console.log(`[Mock RazorpayX] Dispatching payout to A/C: ${accountNo}, IFSC: ${ifsc}, Amount: ${amount}`);
    return {
      payoutId: `pout_mock_${Math.random().toString(36).substr(2, 9)}`,
      status: 'processed',
    };
  }

  try {
    // Real RazorpayX Payout API uses custom HTTP client to target API endpoint:
    // https://api.razorpay.com/v1/payouts
    // Since payouts are not supported in the standard SDK directly, we fetch it:
    const response = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name,
            ifsc,
            account_number: accountNo,
          },
        },
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'disbursement',
        queue_if_low_balance: true,
        reference_id: referenceId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Payout failed');
    }

    return {
      payoutId: data.id,
      status: data.status === 'rejected' || data.status === 'failed' ? 'failed' : 'processed',
    };
  } catch (error: any) {
    console.error('RazorpayX Payout Error:', error);
    throw error;
  }
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (isMock && signature === 'mock_signature') {
    return true;
  }
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  } catch (error) {
    return false;
  }
}
