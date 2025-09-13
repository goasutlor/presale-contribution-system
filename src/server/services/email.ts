import nodemailer from 'nodemailer';

const hasSmtp = !!process.env.SMTP_HOST;

let transporter: nodemailer.Transporter | null = null;

if (hasSmtp) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'noreply@asc.com';
  const recipients = Array.isArray(to) ? to.join(',') : to;

  if (!transporter) {
    console.log('📧 [LOG ONLY] Email send requested:', { from, to: recipients, subject });
    return;
  }

  await transporter.sendMail({ from, to: recipients, subject, html });
}

export function renderTemplate(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="font-family: Google Sans, Arial, sans-serif; background:#f7f7f8; padding:16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:auto;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.05)"><tr><td style="padding:24px"><h2 style="margin:0 0 12px;color:#111">${title}</h2><div style="color:#333;line-height:1.6">${body}</div><div style="margin-top:24px;color:#888;font-size:12px">ASC</div></td></tr></table></body></html>`;
}


