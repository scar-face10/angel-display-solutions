# Angels Display Solutions LLP — Production Deployment Guide

This guide details how to configure and deploy the permanent Quote Request enquiry system with **Netlify Functions**, **Supabase PostgreSQL**, and **Resend**.

---

## Architecture Overview

```
[Customer Browser]
       │
       ▼ (POST /api/submit-enquiry)
[Netlify Serverless Function]
       ├── Rate Limiting (3/min per IP)
       ├── Honeypot Spam Filter
       ├── Input Validation & Sanitization
       │
       ├──► [Supabase PostgreSQL]  (Permanent DB storage in `enquiries` table)
       │
       └──► [Resend API]
             ├──► Business Notification to angelsdisplaysolutionsllp@gmail.com
             └──► Customer Acknowledgement to customer's email
```

---

## Step 1: Supabase Database Setup

1. Sign in or create a free account at [Supabase](https://supabase.com).
2. Click **New Project** and name it (e.g., `angels-display-solutions`).
3. Select your preferred database region (e.g., `ap-south-1` / Mumbai for lowest latency in India).
4. Go to **SQL Editor** in the left sidebar, click **New query**, and paste the contents of `supabase-schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS enquiries (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name   TEXT          NOT NULL,
  customer_email  TEXT          NOT NULL,
  project_brief   TEXT          NOT NULL DEFAULT '',
  status          TEXT          NOT NULL DEFAULT 'New',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public read"
  ON enquiries
  FOR SELECT
  TO public
  USING (false);

CREATE POLICY "No public insert"
  ON enquiries
  FOR INSERT
  TO public
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS enquiries_email_idx   ON enquiries (customer_email);
CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries (created_at DESC);
```

5. Click **Run**.
6. Go to **Project Settings** (gear icon) → **API**.
7. Note down:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`) → `SUPABASE_URL`
   - **service_role key** (under Project API keys; click *Reveal*) → `SUPABASE_SERVICE_KEY`
   > **CRITICAL**: Never share or expose the `service_role` key in frontend code. It is only used by backend Netlify Functions.

---

## Step 2: Resend Email Setup

1. Sign up or log in at [Resend](https://resend.com).
2. Go to **API Keys** → **Create API Key** (name it `Angels Display Production`, Permission: *Full access*).
3. Copy the key (starts with `re_...`) → `RESEND_API_KEY`.
4. Domain verification:
   - Go to **Domains** → **Add Domain** (e.g. `angelsdisplaysolutions.in`).
   - Add the DNS records (DKIM, SPF) to your domain registrar (e.g. GoDaddy, Namecheap, Cloudflare).
   - Once verified, your `SENDER_EMAIL` can be `enquiry@angelsdisplaysolutions.in` or `contact@angelsdisplaysolutions.in`.
   - *Note for testing*: If domain DNS is pending, you can use Resend's testing sender `onboarding@resend.dev` (delivers only to the email address you signed up with at Resend).

---

## Step 3: Push Code to GitHub

Ensure all files are committed and pushed to your GitHub repository:

```bash
git add -A
git commit -m "feat: complete permanent quote request system with Netlify, Supabase, and Resend"
git push origin main
```

---

## Step 4: Netlify Deployment & Environment Variables

1. Sign in to [Netlify](https://app.netlify.com).
2. Click **Add new site** → **Import an existing project**.
3. Select **GitHub** and choose your repository: `scar-face10/angel-display-solutions`.
4. Build configuration:
   - **Build command**: *(leave empty)*
   - **Publish directory**: `.`
   - **Functions directory**: `netlify/functions` (detected automatically via `netlify.toml`)
5. Click **Deploy site**.
6. Once created, go to **Site configuration** → **Environment variables** → **Add a variable** (or **Import from .env**):

| Variable | Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://your-ref.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | `ey...` | Supabase service_role key |
| `RESEND_API_KEY` | `re_...` | Resend API Key |
| `BUSINESS_EMAIL` | `angelsdisplaysolutionsllp@gmail.com` | Receives quote request notifications |
| `SENDER_EMAIL` | `enquiry@angelsdisplaysolutions.in` | Verified sender email |
| `ALLOWED_ORIGIN` | `https://your-site.netlify.app` | Your live Netlify domain URL |

7. After adding environment variables, trigger a redeploy:
   - Go to **Deploys** → **Trigger deploy** → **Deploy site**.

---

## Step 5: Verification & Testing Checklist

After deployment is complete:

1. **Submission Test**:
   - Open your live website on desktop and mobile.
   - Fill in:
     - Name: `Test Client`
     - Email: `your-email@example.com`
     - Brief: `We need custom acrylic & brass counter displays for a 500 sq.ft jewellery store.`
   - Click **Prepare enquiry ↗**.
   - Verify that the button switches to "Sending…" and disables.
   - Verify the success message appears:
     > *"Thank you for your enquiry! Your quote request has been received successfully. Our team will contact you shortly."*
2. **Database Verification**:
   - Go to Supabase → **Table Editor** → `enquiries`.
   - Confirm the new row exists with status `"New"` and the exact submitted data.
3. **Email Notification Check**:
   - Check `angelsdisplaysolutionsllp@gmail.com` for the branded business notification with Enquiry ID.
   - Check customer email inbox for the branded acknowledgement receipt.
4. **Validation Check**:
   - Attempt submitting with an empty field or invalid email.
   - Verify that invalid fields show a red underline and clear guidance without reloading.
5. **Anti-Spam Check**:
   - Hidden honeypot fields (`website`, `phone_confirm`) protect against automated spam bots silently.
   - Rate limiting prevents flood attacks (max 3 submissions per IP per minute).
