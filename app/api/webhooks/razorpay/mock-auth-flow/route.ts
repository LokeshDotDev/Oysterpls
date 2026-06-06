import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('applicationId') || 'unknown';
  const mandateId = searchParams.get('mandateId') || 'unknown';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Razorpay eMandate Secure Simulator</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Outfit', sans-serif; }
      </style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <!-- Glowing background lights -->
        <div class="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-10"></div>
        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-10"></div>

        <div class="relative z-10">
          <div class="text-center mb-6">
            <div class="mx-auto w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h1 class="text-xl font-bold tracking-tight">Setup Autopay (eMandate)</h1>
            <p class="text-slate-400 text-xs mt-1">Razorpay Secure Autopay Registration</p>
          </div>

          <!-- Alert warning for Aadhaar mandate -->
          <div class="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-400 font-semibold">
            <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div>
              <span class="block font-bold">Aadhaar Mandate Disabled</span>
              <span class="text-slate-400 font-normal">Aadhaar OTP authorization is currently not accepted for eMandate setup. Please use Net Banking or Debit Card.</span>
            </div>
          </div>

          <div class="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-xs space-y-2 mb-6 font-medium">
            <div class="flex justify-between border-b border-slate-900 pb-1.5">
              <span class="text-slate-500">Loan ID:</span>
              <span class="font-mono text-emerald-400">${applicationId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Subscription Token:</span>
              <span class="font-mono text-indigo-400">${mandateId}</span>
            </div>
          </div>

          <!-- Bank Selection & Authorization details -->
          <div class="space-y-4 mb-8 text-xs font-semibold text-slate-300">
            <div>
              <label class="block text-slate-400 mb-2">Select Your Bank</label>
              <select id="bankSelect" class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="SBI">State Bank of India</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-2">Select Authorization Type</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 p-3 bg-slate-950 border border-indigo-500/30 rounded-xl cursor-pointer">
                  <input type="radio" name="authType" value="netbanking" checked class="text-indigo-500 focus:ring-0">
                  <span>Net Banking</span>
                </label>
                <label class="flex items-center gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl cursor-pointer">
                  <input type="radio" name="authType" value="debitcard" class="text-indigo-500 focus:ring-0">
                  <span>Debit Card</span>
                </label>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <button onclick="triggerWebhook('subscription.activated')" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 transition-all font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] text-slate-950">
              Confirm & Authorize Autopay
            </button>
            
            <button onclick="triggerWebhook('subscription.failed')" class="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/20 font-semibold rounded-2xl active:scale-[0.98]">
              Cancel Setup
            </button>
          </div>

          <div id="statusMsg" class="mt-6 text-center text-sm text-slate-500 hidden"></div>
        </div>
      </div>

      <script>
        async function triggerWebhook(event) {
          const statusDiv = document.getElementById('statusMsg');
          const bank = document.getElementById('bankSelect').value;
          statusDiv.innerText = 'Processing secure subscription register...';
          statusDiv.classList.remove('hidden');

          const payload = {
            entity: 'event',
            account_id: 'acc_mock_123',
            event: event,
            payload: {
              subscription: {
                entity: {
                  id: '${mandateId}',
                  status: event === 'subscription.activated' ? 'active' : 'failed',
                  notes: {
                    applicationId: '${applicationId}',
                    authorizedBank: bank
                  }
                }
              }
            }
          };

          try {
            const res = await fetch('/api/webhooks/razorpay', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': 'mock_signature'
              },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              statusDiv.innerHTML = '<span class="text-emerald-400 font-bold">✓ eMandate Setup Successful via ' + bank + '! Redirecting...</span>';
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1800);
            } else {
              const err = await res.json();
              statusDiv.innerHTML = '<span class="text-rose-400">✗ Verification failed: ' + (err.error || 'Gateway Timeout') + '</span>';
            }
          } catch (e) {
            statusDiv.innerHTML = '<span class="text-rose-400">✗ Network Exception: ' + e.message + '</span>';
          }
        }
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
