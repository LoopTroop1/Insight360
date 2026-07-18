const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- e-Office Pro SMTP Settings Setup ---');

rl.question('Enter new SMTP Email Address (e.g. user@gmail.com): ', (email) => {
  // Mute standard output to hide the password as they type
  rl.stdoutMuted = true;
  process.stdout.write('Enter SMTP Password / App Password (typing hidden): ');
  
  rl.question('', (password) => {
    rl.stdoutMuted = false;
    console.log('\nSaving credentials...');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      console.log('Error: Email or Password cannot be empty.');
      rl.close();
      return;
    }

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Filter out old SMTP settings to keep .env clean
    const lines = envContent.split(/\r?\n/).filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('SMTP_USER=') && !trimmed.startsWith('SMTP_PASS=');
    });

    // Remove any trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    // Append new settings
    lines.push(`SMTP_USER=${cleanEmail}`);
    lines.push(`SMTP_PASS=${cleanPassword}`);

    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
    console.log('SMTP settings updated successfully in .env!');
    rl.close();
  });

  // Intercept write stream to mute password output
  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted) {
      // Print asterisks for typing feedback or omit
      if (stringToWrite !== '\r' && stringToWrite !== '\n' && stringToWrite !== '\r\n') {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    } else {
      rl.output.write(stringToWrite);
    }
  };
});
