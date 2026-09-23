import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory OTP store on the server with 10-minute TTL
interface ServerPendingOtp {
  code: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
}

const serverOtpStore = new Map<string, ServerPendingOtp>();
const serverPasswordResetRequestStore = new Map<string, number>(); // email -> last request timestamp

// Configure Resend Client with user-provided API key
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey && apiKey.length > 0) {
    return new Resend(apiKey);
  }
  return null;
}

// Configure mail transporter (Gmail, Brevo, custom SMTP)
function getMailTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !rawPass) {
    return null;
  }

  // Remove spaces from Google 16-character App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = (user.endsWith('@gmail.com') || host?.includes('gmail')) 
    ? rawPass.replace(/\s+/g, '') 
    : rawPass;

  // Use specialized Gmail service if host is smtp.gmail.com or user is @gmail.com
  if (host?.includes('gmail') || user.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }

  return null;
}

// API Health & Config Status Check
app.get('/api/health', (req, res) => {
  const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
  const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    emailProvider: hasResend ? 'Resend' : hasSmtp ? 'SMTP' : 'None',
    emailConfigured: hasResend || hasSmtp,
    resendConfigured: hasResend,
    smtpConfigured: hasSmtp,
  });
});

// API: Send 6-Digit Email OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isReset = purpose === 'password_reset';

    // 24-hour rate limiting check for password reset requests
    if (isReset) {
      const lastRequestTime = serverPasswordResetRequestStore.get(cleanEmail) || 0;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - lastRequestTime < twentyFourHours) {
        const remainingHours = Math.ceil((twentyFourHours - (Date.now() - lastRequestTime)) / (60 * 60 * 1000));
        return res.status(400).json({
          success: false,
          message: `To protect your account, multiple password reset requests are limited to once every 24 hours. Please wait before requesting another code (approx. ${remainingHours}h remaining).`,
        });
      }
      serverPasswordResetRequestStore.set(cleanEmail, Date.now());
    }

    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    serverOtpStore.set(cleanEmail, {
      code,
      purpose: purpose || 'registration',
      expiresAt,
      attempts: 0,
    });

    const actionTitle = isReset ? 'Password Reset Verification' : 'Eldra Account Registration Verification';
    const emailSubject = `${code} is your Eldra verification code`;
    const emailText = `Your Eldra verification code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0e14; color: #f4f4f5; padding: 40px 20px; text-align: center;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #141b27; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="font-size: 24px; font-weight: 900; color: #f59e0b; letter-spacing: 2px; margin-bottom: 8px;">ELDRA ECOSYSTEM</div>
          <div style="font-size: 14px; font-weight: 700; color: #e4e4e7; margin-bottom: 24px;">${actionTitle}</div>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
            Please enter the 8-digit confirmation code below. This code is valid for <strong>5 minutes</strong>.
          </p>
          <div style="background-color: #06080d; border: 2px solid #f59e0b; border-radius: 12px; padding: 18px 24px; font-size: 28px; font-family: monospace; font-weight: 800; letter-spacing: 6px; color: #fbbf24; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #71717a; margin-top: 24px;">
            If you did not request this security code, please safely ignore this email. Never share this code with anyone.
          </p>
        </div>
      </div>
    `;

    let emailSent = false;
    let errorMessage = '';

    // 1. Send via Resend API (Primary Provider)
    const resend = getResendClient();
    if (!emailSent && resend) {
      try {
        const rawFrom = process.env.RESEND_FROM || '';
        const resendFrom = (rawFrom && !rawFrom.includes('eldrasecurity') && rawFrom.includes('@')) ? rawFrom : 'onboarding@resend.dev';
        const fromHeader = `Eldra Security <${resendFrom}>`;

        console.log(`[Resend API] Dispatching 8-digit OTP email to ${cleanEmail}`);

        const resendResponse = await resend.emails.send({
          from: fromHeader,
          to: [cleanEmail],
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        });

        if (resendResponse.error) {
          console.error('[Resend Error]', resendResponse.error);
          errorMessage = resendResponse.error.message;

          if (
            resendResponse.error.message?.includes('testing emails') ||
            resendResponse.error.message?.includes('own email address') ||
            resendResponse.error.message?.includes('verify a domain')
          ) {
            errorMessage =
              'Resend is in testing mode. You can only send to your own registered email address until you verify a domain at resend.com/domains.';
          }
        } else {
          console.log(`[Resend] Successfully dispatched 8-digit OTP email to ${cleanEmail} (ID: ${resendResponse.data?.id})`);
          emailSent = true;
        }
      } catch (resendErr: any) {
        console.error('[Resend Exception]', resendErr.message);
        errorMessage = resendErr.message;
      }
    }

    // 2. Send via Brevo HTTPS REST API (Fallback Provider)
    const brevoApiKey =
      process.env.BREVO_API_KEY?.trim() ||
      (process.env.SMTP_PASS?.trim().startsWith('xkeysib-') ? process.env.SMTP_PASS.trim() : '');

    if (!emailSent && brevoApiKey) {
      try {
        const senderEmail =
          process.env.BREVO_SENDER_EMAIL?.trim() ||
          process.env.SMTP_FROM?.match(/<([^>]+)>/)?.[1] ||
          process.env.SMTP_FROM?.trim() ||
          process.env.SMTP_USER?.trim() ||
          'xeelclick@gmail.com';

        const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Eldra Security';

        console.log(`[Brevo API] Dispatching 8-digit OTP email to ${cleanEmail} via sender: ${senderEmail}`);

        const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail,
            },
            to: [{ email: cleanEmail }],
            subject: emailSubject,
            textContent: emailText,
            htmlContent: emailHtml,
          }),
        });

        const brevoData = await brevoResp.json().catch(() => ({}));
        if (brevoResp.ok && (brevoData.messageId || brevoData.messageIds)) {
          console.log(
            `[Brevo API] Successfully dispatched 8-digit OTP email to ${cleanEmail} (MessageId: ${
              brevoData.messageId || brevoData.messageIds?.[0]
            })`
          );
          emailSent = true;
          errorMessage = '';
        } else {
          console.error('[Brevo API Error]', brevoResp.status, brevoData);
          let bMsg = brevoData.message || 'Brevo API rejected the email request.';
          if (bMsg.includes('unauthorized') || bMsg.includes('Key not found') || brevoResp.status === 401) {
            bMsg = 'Invalid BREVO_API_KEY. Please verify your v3 API key in the Brevo Dashboard under SMTP & API.';
          } else if (bMsg.includes('sender') || bMsg.includes('not valid') || bMsg.includes('not allowed')) {
            bMsg = `Sender email "${senderEmail}" is not recognized as a verified sender in Brevo. Please set BREVO_SENDER_EMAIL to your Brevo account email.`;
          }
          errorMessage = bMsg;
        }
      } catch (brevoErr: any) {
        console.error('[Brevo API Exception]', brevoErr.message);
        errorMessage = `Brevo connection error: ${brevoErr.message}`;
      }
    }

    // 3. Send via SendGrid REST API if SENDGRID_API_KEY is provided
    const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
    if (!emailSent && sendgridApiKey) {
      try {
        const sendgridFrom = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'security@eldra.io';
        const fromEmail = sendgridFrom.match(/<([^>]+)>/)?.[1] || sendgridFrom;
        const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: cleanEmail }] }],
            from: { email: fromEmail.trim(), name: 'Eldra Security' },
            subject: emailSubject,
            content: [
              { type: 'text/plain', value: emailText },
              { type: 'text/html', value: emailHtml },
            ],
          }),
        });

        if (sgResp.status >= 200 && sgResp.status < 300) {
          console.log(`[SendGrid API] Successfully dispatched OTP email to ${cleanEmail}`);
          emailSent = true;
          errorMessage = '';
        } else {
          const sgData = await sgResp.json().catch(() => ({}));
          console.error('[SendGrid Error]', sgData);
          errorMessage = sgData.errors?.[0]?.message || `SendGrid rejected email with status ${sgResp.status}`;
        }
      } catch (sgErr: any) {
        console.error('[SendGrid Exception]', sgErr.message);
        errorMessage = sgErr.message;
      }
    }

    // 4. Fallback to standard SMTP (Gmail / Custom SMTP) if not sent yet
    if (!emailSent) {
      const transporter = getMailTransporter();
      if (transporter) {
        try {
          const rawFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'security@eldra.io';
          const fromHeader = rawFrom.includes('<') ? rawFrom : `"Eldra Security" <${rawFrom}>`;
          await transporter.sendMail({
            from: fromHeader,
            to: cleanEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
          });
          console.log(`[SMTP] Successfully dispatched OTP email to ${cleanEmail}`);
          emailSent = true;
          errorMessage = '';
        } catch (mailErr: any) {
          console.error(`[SMTP Error] Failed to send email to ${cleanEmail}:`, mailErr.message);
          let friendly = mailErr.message || 'SMTP delivery failed.';
          if (friendly.includes('535') || friendly.includes('Authentication') || friendly.includes('invalid credentials')) {
            friendly = 'SMTP Authentication failed. Please check your SMTP username/password or Google App Password.';
          } else if (friendly.includes('550') || friendly.includes('sender') || friendly.includes('not allowed')) {
            friendly = `Sender address not allowed. Ensure SMTP_FROM is verified with your mail provider.`;
          } else if (friendly.includes('ETIMEDOUT') || friendly.includes('ECONNREFUSED')) {
            friendly = `Connection to SMTP server timed out. Cloud hosting firewall may be blocking raw SMTP ports; consider using an API key (Resend, Brevo, or SendGrid).`;
          }
          errorMessage = friendly;
        }
      }
    }

    // If external mail wasn't configured or failed, provide development fallback success with code logged
    if (!emailSent) {
      console.warn(`[Email Dispatch Notice] Mail not sent externally for ${cleanEmail}: ${errorMessage || 'No external email provider configured'}. Running in OTP preview mode.`);
      console.log(`🔑 [OTP Code Generated] Verification code for ${cleanEmail}: ${code}`);
      return res.json({
        success: true,
        emailSent: false,
        code: code,
        message: `Verification code generated successfully! (Preview code: ${code})`,
      });
    }

    return res.json({
      success: true,
      emailSent: true,
      code: code,
      message: `An 8-digit confirmation code has been dispatched to ${cleanEmail}. Please check your email inbox and spam folder.`,
    });
  } catch (err: any) {
    console.error('send-otp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while dispatching verification email. Please try again.',
    });
  }
});

// API: Verify 6-Digit Email OTP
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = serverOtpStore.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No pending security code found for this email. Please request a new code.',
      });
    }

    if (Date.now() > stored.expiresAt) {
      serverOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    stored.attempts += 1;
    if (stored.attempts > 5) {
      serverOtpStore.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    if (stored.code !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // Successfully verified -> clean up
    serverOtpStore.delete(cleanEmail);
    return res.json({ success: true, message: 'Email successfully verified!' });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify security code.' });
  }
});

// Setup Vite or Static File Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eldra Server listening on port ${PORT}`);
  });
}

start();
