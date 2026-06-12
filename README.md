# 🥗 Coach Noa — Personal Diet Coach PWA

A full-featured AI-powered diet coach that runs on every device — phone, tablet, desktop. No app store needed.

## What's inside

- **Today dashboard** — Garmin step sync, calorie/protein/water tracking, daily AI tip
- **Meal logging** — Log breakfast, lunch, dinner, snacks with photos
- **AI coach chat** — Ask "can I have this?", get instant honest answers
- **Meal ideas** — Curated suggestions for weight loss + sustained energy
- **Push notifications** — Scheduled daily nudges (8am, 12:30pm, 2pm, 4pm, 7:30pm)
- **PWA** — Installable on iPhone, Android, Mac, Windows from a single URL

---

## 🚀 Deploy in 5 minutes (Vercel — free)

### Step 1 — Get your Anthropic API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account → API Keys → New key
3. Copy it (starts with `sk-ant-...`)

### Step 2 — Add the API key to the app
Open `public/app.js` and find the `callClaude` function (near the bottom).
Add your key to the headers:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-YOUR_KEY_HERE',        // ← add this line
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

> ⚠️ **Security note**: For a personal-only app this is fine. If you ever share the URL publicly, move the API calls to a serverless function (see the `api/` folder section below for a ready-made example).

### Step 3 — Push to GitHub
```bash
git init
git add .
git commit -m "Coach Noa PWA"
git remote add origin https://github.com/YOUR_USERNAME/coach-noa.git
git push -u origin main
```

### Step 4 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. **Root directory**: set to `public`
4. Click Deploy

That's it. You'll get a URL like `https://coach-noa.vercel.app`.

---

## 📱 Install on your iPhone (Safari)

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button (square with arrow)
3. Scroll down → **"Add to Home Screen"**
4. Tap **Add**

The app appears on your home screen like a native app — fullscreen, no browser bar.

**Enable push notifications**: Open the app from your home screen → tap Alerts tab → tap "Enable notifications". iOS requires the app to be added to home screen first (iOS 16.4+).

## 💻 Install on Mac / Windows (Chrome or Edge)

Look for the install icon (⊕) in the browser address bar, or go to:
- Chrome: Menu → "Install Coach Noa"
- Edge: Menu → Apps → "Install this site as an app"

---

## 🔗 Garmin integration

The app currently uses a demo mode (enter steps manually). To connect real Garmin data:

1. Register at [developer.garmin.com](https://developer.garmin.com) (free)
2. Create an app → get your **Consumer Key** and **Consumer Secret**
3. Implement OAuth 1.0a flow — Garmin's Health API returns daily step counts
4. Replace the `connectGarmin()` function in `app.js` with the OAuth redirect

A serverless function example for Garmin OAuth is in `api/garmin-auth.js` (see below).

---

## 🔒 Secure API setup (optional but recommended)

To keep your API key off the client, create `api/chat.js` in your project root:

```js
// api/chat.js — Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.json(data);
}
```

Then in `app.js`, change the fetch URL from `https://api.anthropic.com/v1/messages` to `/api/chat`.

Add your key in Vercel: Project Settings → Environment Variables → `ANTHROPIC_API_KEY`.

---

## 📁 File structure

```
coach-noa/
├── public/
│   ├── index.html       ← App shell
│   ├── app.css          ← All styles (light + dark mode)
│   ├── app.js           ← App logic + Claude integration
│   ├── manifest.json    ← PWA manifest (icons, name, theme)
│   ├── sw.js            ← Service worker (offline + notifications)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── vercel.json          ← Vercel routing config
```

---

## 🛠 Local development

```bash
cd public
npx serve .
# Open http://localhost:3000
```

---

## What's next (future ideas)

- **Real Garmin OAuth** — live step sync every hour
- **Weekly progress charts** — weight, calories, steps over time  
- **Meal photo analysis** — send photo to Claude Vision for auto calorie estimate
- **Recipe database** — save favourite meals for one-tap logging
- **Serverless notifications** — cron job sends push notifications via a backend (bypasses iOS PWA limitation)
