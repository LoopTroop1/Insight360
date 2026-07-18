const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Load environment variables manually from .env and trim any hidden Windows carriage returns (\r)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim(); // Crucial: trims trailing \r in Windows
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function run() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.error('Error: SMTP environment variables are missing in .env!');
    return;
  }

  // Clean values of any residual carriage returns
  const cleanHost = host.trim();
  const cleanPort = parseInt(port.trim());
  const cleanUser = user.trim();
  const cleanPass = pass.trim();

  console.log('Initializing secure connection to: ' + cleanHost + ':' + cleanPort);
  console.log('Sending test email alert to ' + cleanUser + ' via ' + cleanUser + '...');

  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #1a3c6e 0%, #1e3a8a 100%); padding: 15px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 18px;">e-Office Pro Test Alert</h2>
        <span style="font-size: 11px; opacity: 0.8;">Secure Mailer Verification</span>
      </div>
      <div style="padding: 20px; background-color: #ffffff;">
        <p>Dear User,</p>
        <p>This is a verification email from your local <strong>Insight360 (e-Office Pro)</strong> instance.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; border-radius: 0 4px 4px 0;">
          <h3 style="margin: 0; color: #10b981; font-size: 15px;">SMTP Connection Verified</h3>
          <p style="margin: 10px 0 0 0; color: #334155; font-size: 13px; line-height: 1.5;">
            Your secure mail relay is functioning correctly. Real-time workflow alerts will now be dispatched directly to your inbox.
          </p>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 11px; color: #64748b;">
        This email was triggered manually via local testing CLI.
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: cleanHost,
      port: cleanPort,
      secure: false, // TLS upgrades automatically via STARTTLS on port 587
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    const info = await transporter.sendMail({
      from: '"e-Office Pro Alerts" <' + cleanUser + '>',
      to: cleanUser,
      subject: '[e-Office Pro] SMTP Test Verification Alert',
      html: html,
    });

    console.log('Email successfully sent! Message ID: ' + info.messageId);
    console.log('Finished test script execution.');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

run().catch(console.error);
