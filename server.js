require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Contact Form ─────────────────────────────────────────────
app.post('/contact', (req, res) => {
  const { name, email, business, phone, plan, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Log the submission (in production, send an email notification here)
  console.log('\n✦ New Contact Request ─────────────────────────');
  console.log(`  Name:     ${name}`);
  console.log(`  Email:    ${email}`);
  if (business) console.log(`  Business: ${business}`);
  if (phone)    console.log(`  Phone:    ${phone}`);
  if (plan)     console.log(`  Plan:     ${plan}`);
  if (message)  console.log(`  Message:  ${message}`);
  console.log('──────────────────────────────────────────────\n');

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
