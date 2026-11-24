/**
 * Netlify Function: submit-enquiry
 * POST /api/submit-enquiry
 *
 * Receives a quote request, validates inputs, saves to Supabase,
 * and sends email notifications via Resend.
 *
 * Required environment variables (set in Netlify dashboard â†’ Site â†’ Environment variables):
 *   SUPABASE_URL          â€“ e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  â€“ Service role key (never expose to frontend)
 *   RESEND_API_KEY        â€“ from resend.com
 *   BUSINESS_EMAIL        â€“ your Gmail e.g. angelsdisplaysolutionsllp@gmail.com
 *   SENDER_EMAIL          â€“ from verified Resend domain e.g. noreply@yourdomain.com
 *   ALLOWED_ORIGIN        â€“ your Netlify site URL e.g. https://angel-display-solutions.netlify.app
 */

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 submissions per IP per minute
const ipTimestamps = new Map(); // in-memory, resets on function cold start

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(allowedOrigin),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, allowedOrigin);
  }

  // â”€â”€ 1. Rate limiting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const now = Date.now();
  const timestamps = (ipTimestamps.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return jsonResponse(
      { error: 'Too many requests. Please wait a moment and try again.' },
      429,
      allowedOrigin
    );
  }
  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);

  // â”€â”€ 2. Parse body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request format.' }, 400, allowedOrigin);
  }

  // â”€â”€ 3. Honeypot check (spam bots fill hidden fields) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (body.website || body.phone_confirm) {
    // Silently accept but do nothing â€” fool the bot
    return jsonResponse({ success: true, id: 'HONEYPOT' }, 200, allowedOrigin);
  }

  // â”€â”€ 4. Validate inputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const name = sanitize(body.name);
  const email = sanitize(body.email);
  const brief = sanitize(body.brief);

  const errors = {};
  if (!name || name.length < 2) errors.name = 'Please enter your name.';
  if (name.length > 200) errors.name = 'Name is too long.';
  if (!email || !isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (email.length > 254) errors.email = 'Email address is too long.';
  if (!brief || brief.length < 5) errors.brief = 'Please tell us a little about your project (at least 5 characters).';
  if (brief && brief.length > 5000) errors.brief = 'Brief is too long (max 5000 characters).';

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: 'Validation failed.', fields: errors }, 422, allowedOrigin);
  }

  // â”€â”€ 5. Save to Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    return jsonResponse(
      { error: 'Service configuration error. Please contact us directly by email.' },
      500,
      allowedOrigin
    );
  }

  let enquiryId;
  let savedAt;
  try {
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        customer_name: name,
        customer_email: email,
        project_brief: brief || '',
        status: 'New',
      }),
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error('Supabase insert error:', errText);
      throw new Error('Database insert failed.');
    }

    const [row] = await dbRes.json();
    enquiryId = row.id;
    savedAt = new Date(row.created_at).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });
  } catch (err) {
    console.error('Database save failed:', err.message);
    return jsonResponse(
      { error: 'We could not save your enquiry. Please try again or contact us directly.' },
      500,
      allowedOrigin
    );
  }

  // â”€â”€ 6. Send emails via Resend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const resendKey = process.env.RESEND_API_KEY;
  const businessEmail = process.env.BUSINESS_EMAIL || 'angelsdisplaysolutionsllp@gmail.com';
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@angelsdisplaysolutions.in';

  if (resendKey) {
    // Fire both emails in parallel; don't block success response on email failure
    await Promise.allSettled([
      sendBusinessNotification({
        resendKey,
        senderEmail,
        businessEmail,
        name,
        email,
        brief,
        enquiryId,
        savedAt,
      }),
      sendCustomerAcknowledgement({
        resendKey,
        senderEmail,
        name,
        email,
        enquiryId,
        savedAt,
      }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Email ${i === 0 ? 'business notification' : 'customer acknowledgement'} failed:`, r.reason);
        }
      });
    });
  } else {
    console.warn('RESEND_API_KEY not set â€” emails skipped.');
  }

  // â”€â”€ 7. Return success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return jsonResponse(
    {
      success: true,
      id: enquiryId,
      message:
        'Thank you for your enquiry! Your quote request has been received successfully. Our team will contact you shortly.',
    },
    200,
    allowedOrigin
  );
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function sanitize(val) {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/[\u0000-\u001F\u007F]/g, ''); // strip control chars
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function corsHeaders(allowedOrigin) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status, allowedOrigin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
    },
  });
}

async function sendBusinessNotification({
  resendKey,
  senderEmail,
  businessEmail,
  name,
  email,
  brief,
  enquiryId,
  savedAt,
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;color:#1e1b18;background:#fbf7ef;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e0d4c0;max-width:600px">
        <tr>
          <td style="background:#0d0d0d;padding:28px 36px">
            <p style="margin:0;color:#c8a451;font-size:11px;letter-spacing:.18em;text-transform:uppercase">Angels Display Solutions LLP</p>
            <p style="margin:6px 0 0;color:#fbf7ef;font-size:22px">New Quote Request</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #ede6da">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Enquiry ID</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#c8a451;font-family:monospace">${enquiryId}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #ede6da">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Customer Name</p>
                  <p style="margin:4px 0 0;font-size:16px">${escapeHtml(name)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #ede6da">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Customer Email</p>
                  <p style="margin:4px 0 0;font-size:16px"><a href="mailto:${escapeHtml(email)}" style="color:#c8a451">${escapeHtml(email)}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #ede6da">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Project Brief</p>
                  <p style="margin:4px 0 0;font-size:14px;line-height:1.6">${escapeHtml(brief || '(No brief provided)')}  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Received</p>
                  <p style="margin:4px 0 0;font-size:13px">${savedAt} IST</p>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0">
              <a href="mailto:${escapeHtml(email)}?subject=Re: Your enquiry to Angels Display Solutions (${enquiryId})"
                 style="display:inline-block;padding:12px 22px;background:#1e1b18;color:#c8a451;text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase">
                Reply to Customer â†—
              </a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;background:#f5ece0;font-size:11px;color:#84796d;border-top:1px solid #e0d4c0">
            Angels Display Solutions LLP Â· Badangpet, Hyderabad 500058
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resendPost(resendKey, {
    from: senderEmail,
    to: [businessEmail],
    subject: `New Quote Request â€” ${name} (${enquiryId})`,
    html,
  });
}

async function sendCustomerAcknowledgement({
  resendKey,
  senderEmail,
  name,
  email,
  enquiryId,
  savedAt,
}) {
  const firstName = name.split(' ')[0];
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;color:#1e1b18;background:#fbf7ef;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e0d4c0;max-width:600px">
        <tr>
          <td style="background:#0d0d0d;padding:28px 36px">
            <p style="margin:0;color:#c8a451;font-size:11px;letter-spacing:.18em;text-transform:uppercase">Angels Display Solutions LLP</p>
            <p style="margin:6px 0 0;color:#fbf7ef;font-size:22px">Your enquiry is received.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px">
            <p style="font-size:16px;line-height:1.65;margin:0 0 20px">Dear ${escapeHtml(firstName)},</p>
            <p style="font-size:14px;line-height:1.75;color:#3f3428;margin:0 0 20px">
              Thank you for reaching out to <strong>Angels Display Solutions LLP</strong>. We have received your quote request and our team will review it and get back to you shortly.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ece0;border:1px solid #e0d4c0;margin:0 0 24px">
              <tr>
                <td style="padding:16px 20px">
                  <p style="margin:0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#84796d">Your Enquiry Reference</p>
                  <p style="margin:6px 0 0;font-size:16px;color:#c8a451;font-family:monospace">${enquiryId}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#84796d">${savedAt} IST</p>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;line-height:1.75;color:#5d554c;margin:0 0 20px">
              In the meantime, feel free to reach us directly:<br>
              Email: <a href="mailto:angelsdisplaysolutionsllp@gmail.com" style="color:#c8a451">angelsdisplaysolutionsllp@gmail.com</a><br>
              WhatsApp: <a href="https://wa.me/917799881118" style="color:#c8a451">+91 7799881118</a>
            </p>
            <p style="font-size:13px;line-height:1.65;color:#84796d;margin:0">
              Warm regards,<br>
              <strong>Angels Display Solutions Team</strong><br>
              Angels Display Solutions LLP<br>
              Badangpet, Hyderabad 500058
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;background:#f5ece0;font-size:11px;color:#84796d;border-top:1px solid #e0d4c0">
            Angels Display Solutions LLP Â· Jewellery Display Solutions, Showroom Design, Visual Merchandising &amp; Packaging
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resendPost(resendKey, {
    from: senderEmail,
    to: [email],
    reply_to: ['angelsdisplaysolutionsllp@gmail.com'],
    subject: `Enquiry received â€” Angels Display Solutions (Ref: ${enquiryId})`,
    html,
  });
}

async function resendPost(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
  return res.json();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const config = { path: '/api/submit-enquiry' };
