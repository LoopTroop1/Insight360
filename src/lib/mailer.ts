import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function sendEmailAlert(to: string, subject: string, htmlContent: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const timestamp = new Date().toISOString();

  // If SMTP environment variables are configured, send a real email
  if (host && port && user && pass) {
    try {
      const cleanHost = host.trim();
      const cleanPort = parseInt(port.trim());
      const cleanUser = user.trim();
      const cleanPass = pass.trim();

      const transporter = nodemailer.createTransport({
        host: cleanHost,
        port: cleanPort,
        secure: false, // TLS upgrades via STARTTLS automatically on port 587
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
      });

      await transporter.sendMail({
        from: '"e-Office Pro Alerts" <alerts@nic.in>',
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[${timestamp}] Real email alert successfully dispatched to ${to}`);
      return;
    } catch (error) {
      console.error(`[${timestamp}] Failed to send real email to ${to}:`, error);
    }
  }

  // Fallback: Simulation/Mock mode
  try {
    const logDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, 'mock-emails.log');

    const emailEntry = `
========================================
TIMESTAMP: ${timestamp}
TO: ${to}
SUBJECT: ${subject}
----------------------------------------
CONTENT (HTML):
${htmlContent}
========================================
\n`;

    fs.appendFileSync(logPath, emailEntry, 'utf8');
    console.log(`[${timestamp}] Simulated email alert logged to ${logPath} for ${to}`);
  } catch (err) {
    console.error(`[${timestamp}] Failed to write simulated email alert to log:`, err);
  }
}
