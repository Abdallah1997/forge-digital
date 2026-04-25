require('dotenv').config();
const express = require('express');
const path    = require('path');
const { Resend } = require('resend');
const Stripe  = require('stripe');

const app    = express();
const PORT   = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const DOMAIN = process.env.DOMAIN || 'https://forgedigital.us.com';
const PRICES = {
  buildOnce : process.env.PRICE_BUILD_ONLY || 'price_1TPD1jBHNGp0scWhllUVRO8h',
  monthly   : process.env.PRICE_MONTHLY    || 'price_1TPD7IBHNGp0scWhJfaswqpj',
};

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Stripe Checkout Session ──────────────────────────────────
app.post('/api/create-checkout-session', async (req, res) => {
  const { plan } = req.body; // 'complete' | 'build-only'

  try {
    let session;

    if (plan === 'complete') {
      // $499.99 one-time setup fee + $34.99/month recurring
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          { price: PRICES.monthly, quantity: 1 },
        ],
        subscription_data: {
          add_invoice_items: [
            { price: PRICES.buildOnce, quantity: 1 },
          ],
        },
        success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}&plan=complete`,
        cancel_url:  `${DOMAIN}/#pricing`,
      });
    } else {
      // $499.99 one-time only
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          { price: PRICES.buildOnce, quantity: 1 },
        ],
        success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}&plan=build-only`,
        cancel_url:  `${DOMAIN}/#pricing`,
      });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Questionnaire Submission ─────────────────────────────────
app.post('/api/submit-questionnaire', async (req, res) => {
  const {
    sessionId, plan,
    businessName, ownerName, phone, email,
    city, state, serviceAreas,
    services,
    yearsInBusiness, responseTime, hours,
    wantsQuoteForm, wantsPricing,
    slogan, brandColors, stylePreference,
    facebook, instagram, nextdoor,
    googleBusiness, driveLink, inspiration, notes,
  } = req.body;

  if (!businessName || !email) {
    return res.status(400).json({ error: 'Business name and email are required.' });
  }

  const serviceList = Array.isArray(services)
    ? services.join(', ')
    : (services || 'Not specified');

  const planLabel = plan === 'complete' ? 'Complete Package ($499.99 + $34.99/mo)' : 'Build Only ($499.99)';

  const row = (label, val, shaded) =>
    `<tr style="background:${shaded ? '#f9fafb' : '#fff'}">
      <td style="padding:10px 14px;color:#6b7280;width:170px;font-size:13px;vertical-align:top">${label}</td>
      <td style="padding:10px 14px;font-size:13px;font-weight:500">${val || '<em style="color:#ccc">—</em>'}</td>
    </tr>`;

  try {
    await Promise.all([

      // ① Notification to you
      resend.emails.send({
        from    : 'Forge Digital <hello@forgedigital.us.com>',
        to      : 'hello@forgedigital.us.com',
        reply_to: email,
        subject : `🚀 New Website Order — ${businessName}`,
        html    : `
          <div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:10px;">
            <h2 style="margin:0 0 6px;font-size:22px;color:#111;">New Website Order 🎉</h2>
            <p style="color:#6b7280;font-size:12px;margin:0 0 24px;">
              Plan: <strong>${planLabel}</strong> &nbsp;|&nbsp;
              Stripe session: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${sessionId || 'N/A'}</code>
            </p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${row('Business Name',   businessName,    true)}
              ${row('Owner / Contact', ownerName,       false)}
              ${row('Email',           `<a href="mailto:${email}" style="color:#b8972a">${email}</a>`, true)}
              ${row('Phone',           phone,           false)}
              ${row('City, State',     `${city || '—'}, ${state || '—'}`, true)}
              ${row('Service Areas',   serviceAreas,    false)}
              ${row('Services',        serviceList,     true)}
              ${row('Years in Biz',    yearsInBusiness,  false)}
              ${row('Response Time',   responseTime,     true)}
              ${row('Hours',           hours,            false)}
              ${row('Quote Form',      wantsQuoteForm,   true)}
              ${row('Show Pricing',    wantsPricing,     false)}
              ${row('Slogan',          slogan,           true)}
              ${row('Brand Colors',    brandColors,      false)}
              ${row('Style Pref.',     stylePreference,  true)}
              ${row('Facebook',        facebook,        false)}
              ${row('Instagram',       instagram,       true)}
              ${row('Nextdoor',        nextdoor,        false)}
              ${row('Google Business', googleBusiness,  true)}
              ${row('Photos / Drive',  driveLink ? `<a href="${driveLink}" style="color:#b8972a">${driveLink}</a>` : '', false)}
              ${row('Inspiration',     inspiration,     true)}
              ${row('Notes',           notes,           false)}
            </table>
            <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Hit reply to respond directly to ${ownerName || businessName}.</p>
          </div>
        `,
      }),

      // ② Confirmation to the customer
      resend.emails.send({
        from   : 'Forge Digital <hello@forgedigital.us.com>',
        to     : email,
        subject: `We're building your website! ✦`,
        html   : `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:28px;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#111;">Your site is being built.</h2>
            <p style="color:#444;line-height:1.7;margin:0 0 16px;">
              Hey ${ownerName ? ownerName.split(' ')[0] : 'there'}, we've received everything we need to build
              <strong>${businessName}</strong>'s website and we're getting started right away.
            </p>
            <p style="color:#444;line-height:1.7;margin:0 0 16px;">
              You'll receive a <strong>preview link within 7 business days</strong> so you can review your site
              before it goes live. We'll email it to this address.
            </p>
            <p style="color:#444;line-height:1.7;margin:0 0 24px;">
              <strong>📸 Photos & logo:</strong> Send any photos or your logo file to
              <a href="mailto:hello@forgedigital.us.com" style="color:#b8972a;">hello@forgedigital.us.com</a>
              or share a Google Drive / Dropbox link by replying to this email.
            </p>
            <p style="color:#444;line-height:1.7;margin:0;">
              — Abdallah<br>
              <span style="color:#6b7280;font-size:13px;">Forge Digital</span>
            </p>
          </div>
        `,
      }),
    ]);

    console.log(`✦ Questionnaire received from ${businessName} <${email}>`);
    res.json({ ok: true });

  } catch (err) {
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Failed to submit questionnaire.' });
  }
});

// ── Legacy Contact Form (keep for fallback) ──────────────────
app.post('/contact', async (req, res) => {
  const { name, email, business, phone, plan, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  try {
    await Promise.all([
      resend.emails.send({
        from    : 'Forge Digital <hello@forgedigital.us.com>',
        to      : 'hello@forgedigital.us.com',
        reply_to: email,
        subject : `New enquiry from ${name}${plan ? ` — ${plan}` : ''}`,
        html    : `
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
          </div>
        `,
      }),
      resend.emails.send({
        from   : 'Forge Digital <hello@forgedigital.us.com>',
        to     : email,
        subject: `We received your message, ${name.split(' ')[0]} ✦`,
        html   : `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <p style="color:#444;line-height:1.6;margin:0 0 16px;">Hey ${name.split(' ')[0]}, we've received your message and will get back to you within 24 hours.</p>
            <p style="color:#444;line-height:1.6;margin:0;">— Abdallah<br><span style="color:#6b7280;font-size:13px;">Forge Digital</span></p>
          </div>
        `,
      }),
    ]);
  } catch (err) {
    console.error('Resend error:', err);
  }
  res.json({ ok: true });
});

// ── Catch-all → index.html ───────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✦ Forge Digital running → http://localhost:${PORT}`);
  });
}
