require('dotenv').config();
const express = require('express');
const path    = require('path');
const { Resend } = require('resend');

const app    = express();
const PORT   = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Contact Form ─────────────────────────────────────────────
app.post('/contact', async (req, res) => {
  const { name, email, business, phone, plan, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Send email notification
  try {
    await resend.emails.send({
      from: 'Forge Digital <onboarding@resend.dev>',
      to:   'hello@forgedigital.us.com',
      reply_to: email,
      subject: `New enquiry from ${name}${plan ? ` — ${plan}` : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="margin:0 0 20px;font-size:20px;color:#111;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#6b7280;width:100px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#b8972a;">${email}</a></td></tr>
            ${business ? `<tr><td style="padding:8px 0;color:#6b7280;">Business</td><td style="padding:8px 0;">${business}</td></tr>` : ''}
            ${phone    ? `<tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>` : ''}
            ${plan     ? `<tr><td style="padding:8px 0;color:#6b7280;">Plan</td><td style="padding:8px 0;">${plan}</td></tr>` : ''}
            ${message  ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top;">Message</td><td style="padding:8px 0;">${message}</td></tr>` : ''}
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Hit reply to respond directly to ${name}.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend error:', err);
  }

  console.log(`✦ Contact from ${name} <${email}>`);
  res.json({ ok: true });
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel (serverless)
module.exports = app;

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✦ Forge Digital running → http://localhost:${PORT}`);
  });
}
