// Secure Email OTP Service
// Dispatches 6-digit verification codes to the user's real email address via backend SMTP / Email API

export interface SendOtpResult {
  success: boolean;
  message: string;
  code?: string;
  emailSent?: boolean;
}

export class EmailOtpService {
  private static instance: EmailOtpService;

  private constructor() {}

  public static getInstance(): EmailOtpService {
    if (!EmailOtpService.instance) {
      EmailOtpService.instance = new EmailOtpService();
    }
    return EmailOtpService.instance;
  }

  /**
   * Request backend to dispatch 6-digit numeric OTP to the recipient's real email inbox
   */
  public async sendOtp(
    email: string,
    purpose: 'registration' | 'password_reset'
  ): Promise<SendOtpResult> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        return {
          success: true,
          code: data.code,
          emailSent: data.emailSent,
          message:
            data.message ||
            `An 8-digit confirmation code has been dispatched to ${cleanEmail}. Please check your email inbox and spam folder.`,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to dispatch verification code. Please check your email configuration.',
        };
      }
    } catch (err: any) {
      console.error('send-otp request failed:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your internet connection and try again.',
      };
    }
  }

  /**
   * Verify provided 8-digit OTP code against backend
   */
  public async verifyOtp(
    email: string,
    inputCode: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const code = inputCode.trim();

    if (!code || code.length !== 8) {
      return {
        success: false,
        message: 'Please enter a valid 8-digit numeric verification code.',
      };
    }

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Email successfully verified!' };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid or expired verification code. Please check your email.',
        };
      }
    } catch (err: any) {
      console.error('verify-otp request failed:', err);
      return {
        success: false,
        message: 'Could not verify code. Please ensure you are connected to the network.',
      };
    }
  }
}

export const emailOtpService = EmailOtpService.getInstance();
