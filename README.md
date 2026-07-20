# Salkara × CISO Marine World — Coupon Management

A small web app to run the **Joint Holiday Discount Coupon** program between
**Salkara Group of Restaurants** and **CISO Marine World**.

- **Salkara staff** issue a coupon for a customer (name + WhatsApp number).
- The customer shows the coupon at **CISO Marine World** for **10% off entry
  tickets**. Marine World staff mark it as used.
- Back at **Salkara**, the coupon now shows as *used at Marine World*, so staff
  apply **10% off the food bill** and mark it complete.
- Every screen has **WhatsApp buttons** with pre-filled messages (send the
  coupon to the customer, share it, or contact the venues).
- The coupon is rendered to match the printed artwork, with a **QR code** that
  opens it.

Built with **Next.js** and deployed on **Vercel**. Data is stored in **Vercel
Blob** (encrypted at rest). **No Supabase, no external database.**

---

## How the coupon flows

```
Salkara issues ──▶  issued
                      │  (Marine World scans / enters code, gives 10% off tickets)
                      ▼
                 marine_used
                      │  (Salkara applies 10% off food bill)
                      ▼
                  completed
```

A coupon can only be redeemed at Salkara **after** it has been used at Marine
World. Redemptions are one-way and cannot be repeated.

---

## 1. Deploy on Vercel

1. Push this repository to GitHub (already done if you're reading this there).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** and import
   this GitHub repo. Framework preset: **Next.js** (auto-detected).
3. **Add a Blob store** (this is the database):
   - In the Vercel project → **Storage → Create Database → Blob → Continue**.
   - Connect it to this project. Vercel automatically adds the
     `BLOB_READ_WRITE_TOKEN` environment variable.
4. Add the remaining **Environment Variables** (Project → Settings →
   Environment Variables). See the table below.
5. **Redeploy** so the new environment variables take effect.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `SESSION_SECRET` | ✅ | Long random string. Signs logins + derives the data encryption key. Generate: `openssl rand -base64 48` |
| `SALKARA_USERNAME` | ✅ | Login for Salkara staff |
| `SALKARA_PASSWORD` | ✅ | Password for Salkara staff |
| `MARINE_USERNAME` | ✅ | Login for Marine World staff |
| `MARINE_PASSWORD` | ✅ | Password for Marine World staff |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Added automatically when you create the Blob store |
| `NEXT_PUBLIC_SALKARA_WHATSAPP` | optional | Salkara WhatsApp number, digits only incl. country code (e.g. `9665XXXXXXXX`) |
| `NEXT_PUBLIC_MARINE_WHATSAPP` | optional | Marine World WhatsApp number, digits only |
| `NEXT_PUBLIC_BASE_URL` | recommended | Your production URL, e.g. `https://your-app.vercel.app`. Used inside WhatsApp coupon links. |
| `DATA_ENCRYPTION_KEY` | optional | Dedicated key to encrypt the data blob. Defaults to `SESSION_SECRET`. |

> After the first deploy you'll know your Vercel URL — set
> `NEXT_PUBLIC_BASE_URL` to it and redeploy so WhatsApp messages contain the
> correct link.

---

## 2. Run locally

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev
```

Open <http://localhost:3000>.

If you leave `BLOB_READ_WRITE_TOKEN` empty, the app stores coupons in a local
`.data/coupons.json` file (gitignored) so you can test without any cloud
service. Default logins in that mode are `salkara` / `salkara123` and
`marine` / `marine123` — **change these for production.**

---

## 3. Using the app

- **Home** (`/`) — two portals plus customer WhatsApp buttons.
- **Salkara dashboard** (`/salkara`) — issue coupons, search, send them on
  WhatsApp, and apply the food discount.
- **Marine World dashboard** (`/marine`) — look up a code (or scan the QR) and
  give 10% off tickets.
- **Coupon page** (`/coupon/CODE`) — the printable coupon + QR. Signed-in staff
  see the relevant redeem button here too (handy after scanning the QR).

### Redeeming by QR
The QR code on each coupon opens `/coupon/CODE`. If the staff member is signed
in, the correct redeem button appears right on that page.

---

## Notes on storage & privacy

- Coupon data (names + WhatsApp numbers) is **encrypted with AES-256-GCM**
  before being written to Vercel Blob, because Blob URLs are public.
- Reads use a cache-busting query so an update is immediately visible.
- Volume is expected to be low (one restaurant group + one attraction), so a
  single JSON blob is used with last-write-wins semantics. If you expect heavy
  simultaneous redemptions, move to a store with atomic updates.

## Tech

- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS
- `@vercel/blob` for storage
- `jose` for signed session cookies
- `qrcode.react` for the coupon QR code
