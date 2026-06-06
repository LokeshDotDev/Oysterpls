import prisma from './db';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP';

interface SendNotificationOptions {
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
}

export async function sendNotification({
  userId,
  channel,
  recipient,
  subject,
  content,
}: SendNotificationOptions) {
  let status = 'SENT';
  let errorMessage: string | null = null;

  try {
    const isMock = process.env.MOCK_NOTIFICATIONS === 'true';
    const apiKey = process.env.BREVO_API_KEY;

    console.log(`[Notification] Dispatching ${channel} to ${recipient}...`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);

    if (channel === 'EMAIL' && !isMock && apiKey) {
      // Premium HTML template structure
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject || 'Lending Platform Notification'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #f8fafc;
              padding: 40px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 20px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .content {
              padding: 32px 24px;
              color: #334155;
              line-height: 1.6;
              font-size: 15px;
            }
            .content p {
              margin: 0 0 16px 0;
            }
            .content p:last-child {
              margin-bottom: 0;
            }
            .highlight-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-left: 4px solid #4f46e5;
              padding: 16px;
              border-radius: 4px;
              margin: 20px 0;
              font-family: inherit;
              white-space: pre-wrap;
              color: #0f172a;
            }
            .footer {
              background-color: #f8fafc;
              padding: 16px 24px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Digital Lending Platform</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <div class="highlight-box">${content.replace(/\n/g, '<br/>')}</div>
                <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
                  Best regards,<br>
                  <strong>System Notification Engine</strong>
                </p>
              </div>
              <div class="footer">
                This is an automated operational notification. Please do not reply to this email directly.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;
      try {
        response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            sender: {
              name: 'Digital Lending Platform',
              email: 'purohitlokesh46@gmail.com',
            },
            to: [
              {
                email: recipient,
              },
            ],
            subject: subject || 'Digital Lending Platform Notification',
            htmlContent: emailHtml,
            textContent: content,
          }),
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Brevo email API request timed out after 5 seconds');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo HTTP error! Status: ${response.status}, Detail: ${errorText}`);
      }

      console.log(`[Notification SUCCESS] Sent Brevo email to ${recipient}`);
    } else {
      console.log(`[Notification BYPASS] Channel is ${channel} (or mock active)`);
    }

    // Create database log
    const notification = await prisma.notification.create({
      data: {
        userId,
        channel,
        recipient,
        subject,
        content,
        status,
      },
    });

    return notification;
  } catch (error: any) {
    console.error('Failed to log or send notification:', error);
    status = 'FAILED';
    errorMessage = error?.message || String(error);

    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          channel,
          recipient,
          subject,
          content,
          status,
          errorMessage,
        },
      });
      return notification;
    } catch (dbError) {
      console.error('Failed to write error notification log to database:', dbError);
    }

    return null;
  }
}

