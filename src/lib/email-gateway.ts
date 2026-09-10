import nodemailer from "nodemailer";
import { getStoreSettings } from "./store-data";

export type EmailProvider = "gmail" | "smtp" | "brevo" | "resend" | "none";

export interface EmailDispatchResult {
  sent: boolean;
  provider: EmailProvider;
  message: string;
  error?: string;
  details?: any;
}

/**
 * Generate a responsive brutalist HTML email for GreenO 6-digit OTP verification.
 * Contains ONLY the 6-digit verification passcode and NO sign-in or magic links.
 */
function buildBrandedEmailHtml(otpCode: string, recipientName?: string): string {
  const name = recipientName ? recipientName.trim() : "Valued Member";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GreenO Security Verification Passcode</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
    .container { max-width: 540px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; padding: 40px 32px; }
    .header { border-bottom: 2px solid #ffffff; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff; margin: 0; }
    .subbrand { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; margin-top: 6px; }
    .title { font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; margin-bottom: 12px; }
    .text { font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px; }
    .code-box { background-color: #1a1a1a; border: 1px solid #333333; padding: 24px; text-align: center; margin: 28px 0; }
    .code { font-size: 38px; font-weight: 900; letter-spacing: 0.35em; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 0; }
    .code-hint { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #888888; margin-top: 10px; }
    .security-note { font-size: 11px; color: #777777; line-height: 1.5; border-top: 1px solid #222222; padding-top: 20px; margin-top: 30px; }
    .footer { text-align: center; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #555555; margin-top: 30px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d;">
  <div class="container" style="max-width: 540px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; padding: 40px 32px;">
    <div class="header" style="border-bottom: 2px solid #ffffff; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 class="brand" style="font-size: 20px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff; margin: 0;">GREENO</h1>
      <div class="subbrand" style="font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; margin-top: 6px;">OFF-DUTY ATELIER &bull; VERIFICATION GATEWAY</div>
    </div>

    <div class="title" style="font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; margin-bottom: 12px;">SECURITY VERIFICATION PASSCODE</div>

    <p class="text" style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px;">
      Hello ${name},<br />
      Please use the 6-digit verification passcode below to verify your GreenO identity. Do not share this passcode with anyone:
    </p>

    <div class="code-box" style="background-color: #1a1a1a; border: 1px solid #333333; padding: 24px; text-align: center; margin: 28px 0;">
      <div class="code" style="font-size: 38px; font-weight: 900; letter-spacing: 0.35em; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 0;">
        ${otpCode}
      </div>
      <div class="code-hint" style="font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #888888; margin-top: 10px;">
        EXPIRES IN 10 MINUTES &bull; ONE-TIME USE ONLY
      </div>
    </div>

    <p class="text" style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px;">
      Enter this 6-digit code in the verification screen. If you did not initiate this request, you can safely ignore this email.
    </p>

    <div class="security-note" style="font-size: 11px; color: #777777; line-height: 1.5; border-top: 1px solid #222222; padding-top: 20px; margin-top: 30px;">
      <strong>Security Notice:</strong> GreenO staff will never ask you for your passcode or password under any circumstance.
    </div>

    <div class="footer" style="text-align: center; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #555555; margin-top: 30px;">
      &copy; ${new Date().getFullYear()} GREENO CLOTHING CO. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatch real verification email with 6-digit OTP code to recipient's email address.
 * Dispatches ONLY the 6-digit code via configured mail servers (Gmail SMTP, Custom SMTP, Brevo, Resend).
 * NEVER dispatches any sign-in or magic links.
 */
export async function sendRealEmail(
  targetEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<EmailDispatchResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();

  // Load configured store settings
  let settings: any = {};
  try {
    settings = await getStoreSettings();
  } catch (e) {
    // Ignore store read error
  }

  // Determine credentials from Store Settings or Environment Variables
  const preferredProvider: string =
    settings.emailProvider || process.env.EMAIL_PROVIDER || "gmail";

  // SMTP Settings
  const smtpHost =
    settings.smtpHost ||
    process.env.SMTP_HOST ||
    (preferredProvider === "gmail" ? "smtp.gmail.com" : "");

  const smtpPort =
    Number(settings.smtpPort || process.env.SMTP_PORT) ||
    (preferredProvider === "gmail" ? 465 : 587);

  const smtpSecure =
    settings.smtpSecure !== undefined
      ? Boolean(settings.smtpSecure)
      : smtpPort === 465;

  let smtpUser = settings.smtpUser || process.env.SMTP_USER || "";
  let smtpPass = settings.smtpPass || process.env.SMTP_PASS || "";

  // If credentials are missing in process.env (e.g. if server was started before .env.local was updated), read directly from disk
  if (!smtpPass || !smtpUser) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf-8").split("\n");
        for (const line of lines) {
          const parts = line.split("=");
          if (parts.length >= 2) {
            const k = parts[0].trim();
            const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
            if (k === "SMTP_PASS" && !smtpPass) smtpPass = val;
            if (k === "SMTP_USER" && !smtpUser) smtpUser = val;
          }
        }
      }
    } catch {
      // Ignore disk read error
    }
  }

  const smtpFrom =
    settings.smtpFrom ||
    process.env.SMTP_FROM ||
    (smtpUser ? `GreenO Security <${smtpUser}>` : "GreenO Security <concierge@greeno.in>");

  // Brevo API Key
  const brevoApiKey = settings.brevoApiKey || process.env.BREVO_API_KEY || "";

  // Resend API Key
  const resendApiKey = settings.resendApiKey || process.env.RESEND_API_KEY || "";

  // 1. Try Brevo REST API if configured
  if (brevoApiKey && (preferredProvider === "brevo" || (!smtpUser && !resendApiKey))) {
    const brevoResult = await dispatchBrevoApi(brevoApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (brevoResult.sent) return brevoResult;
  }

  // 2. Try Resend REST API if configured
  if (resendApiKey && (preferredProvider === "resend" || (!smtpUser && !brevoApiKey))) {
    const resendResult = await dispatchResendApi(resendApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (resendResult.sent) return resendResult;
  }

  // 3. Try SMTP / Gmail if credentials exist
  if (smtpUser && smtpPass) {
    const smtpResult = await dispatchNodemailerSmtp(
      {
        host: smtpHost || "smtp.gmail.com",
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      },
      cleanEmail,
      otpCode,
      recipientName
    );
    if (smtpResult.sent) return smtpResult;
  }

  // 4. Secondary fallback: Brevo if available
  if (brevoApiKey) {
    const brevoResult = await dispatchBrevoApi(brevoApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (brevoResult.sent) return brevoResult;
  }

  console.log(`\n======================================================`);
  console.log(`[REAL EMAIL GATEWAY NOTICE]`);
  console.log(`No active Email SMTP or API Key configured.`);
  console.log(`Recipient: ${cleanEmail}`);
  console.log(`Generated OTP: ${otpCode}`);
  console.log(`To receive the 6-digit code in your Gmail / email inbox:`);
  console.log(`1. Enter your Gmail & App Password in /admin -> EMAIL GATEWAY`);
  console.log(`   or in .env.local as SMTP_USER=... and SMTP_PASS=...`);
  console.log(`2. Or enter a free Brevo / Resend API key.`);
  console.log(`======================================================\n`);

  return {
    sent: false,
    provider: "none",
    message:
      "Email SMTP not configured. Please enter your Gmail App Password or Brevo API Key in /admin -> EMAIL GATEWAY or .env.local to receive 6-digit codes in your inbox.",
  };
}

/**
 * Dispatch email via Nodemailer SMTP (Gmail, Brevo SMTP, Outlook, Custom SMTP).
 * Sends pure 6-digit code - zero sign-in links.
 */
async function dispatchNodemailerSmtp(
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  },
  toEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<EmailDispatchResult> {
  try {
    const cleanPass = (config.pass || "").replace(/\s+/g, "");
    const cleanUser = (config.user || "").trim();
    const isGmail = config.host.includes("gmail") || cleanUser.endsWith("@gmail.com");

    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
          }
        : {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 15000,
          }
    );

    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security verification code is: ${otpCode}. Valid for 10 minutes. Enter this code on the verification screen.`;

    const info = await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: `GreenO Verification Passcode: [${otpCode}]`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[REAL EMAIL DELIVERED via SMTP] 6-digit code sent to ${toEmail}. Message ID: ${info.messageId}`);

    return {
      sent: true,
      provider: config.host.includes("gmail") ? "gmail" : "smtp",
      message: `Real verification email with 6-digit passcode delivered to ${toEmail} via SMTP!`,
      details: { messageId: info.messageId },
    };
  } catch (err: any) {
    console.warn("[SMTP Dispatch Error]:", err.message);
    return {
      sent: false,
      provider: "smtp",
      message: `SMTP Error: ${err.message}`,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Brevo (Sendinblue) REST API.
 * Sends pure 6-digit code - zero sign-in links.
 */
async function dispatchBrevoApi(
  apiKey: string,
  toEmail: string,
  otpCode: string,
  recipientName?: string,
  fromHeader?: string
): Promise<EmailDispatchResult> {
  try {
    let fromEmail = "noreply@greeno.in";
    let fromName = "GreenO Security";

    if (fromHeader && fromHeader.includes("<")) {
      const match = fromHeader.match(/^(.*)<(.*)>$/);
      if (match) {
        fromName = match[1].trim() || fromName;
        fromEmail = match[2].trim() || fromEmail;
      }
    }

    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security verification code is: ${otpCode}. Valid for 10 minutes. Enter this code on the verification screen.`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail, name: recipientName || toEmail }],
        subject: `GreenO Verification Passcode: [${otpCode}]`,
        htmlContent,
        textContent,
      }),
    });

    const json = await res.json();

    if (res.ok && json.messageId) {
      console.log(`[REAL EMAIL DELIVERED via Brevo] 6-digit code sent to ${toEmail}. ID: ${json.messageId}`);
      return {
        sent: true,
        provider: "brevo",
        message: `Real verification email delivered to ${toEmail} via Brevo!`,
        details: json,
      };
    }

    return {
      sent: false,
      provider: "brevo",
      message: `Brevo API returned: ${json.message || JSON.stringify(json)}`,
      error: json.message,
    };
  } catch (err: any) {
    console.warn("[Brevo API Error]:", err.message);
    return {
      sent: false,
      provider: "brevo",
      message: `Brevo network error: ${err.message}`,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Resend REST API.
 * Sends pure 6-digit code - zero sign-in links.
 */
async function dispatchResendApi(
  apiKey: string,
  toEmail: string,
  otpCode: string,
  recipientName?: string,
  fromHeader?: string
): Promise<EmailDispatchResult> {
  try {
    const fromAddress = fromHeader || "GreenO Security <onboarding@resend.dev>";
    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security verification code is: ${otpCode}. Valid for 10 minutes. Enter this code on the verification screen.`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: `GreenO Verification Passcode: [${otpCode}]`,
        html: htmlContent,
        text: textContent,
      }),
    });

    const json = await res.json();

    if (res.ok && json.id) {
      console.log(`[REAL EMAIL DELIVERED via Resend] 6-digit code sent to ${toEmail}. ID: ${json.id}`);
      return {
        sent: true,
        provider: "resend",
        message: `Real verification email delivered to ${toEmail} via Resend!`,
        details: json,
      };
    }

    return {
      sent: false,
      provider: "resend",
      message: `Resend API returned: ${json.message || JSON.stringify(json)}`,
      error: json.message,
    };
  } catch (err: any) {
    console.warn("[Resend API Error]:", err.message);
    return {
      sent: false,
      provider: "resend",
      message: `Resend network error: ${err.message}`,
      error: err.message,
    };
  }
}
