# Deploy ardent-admin-panel to Firebase Hosting

Project: **ardent-mds**  
Hosting site: **ardent-admin-panel** (separate from the default `ardent-mds` site)

Default URLs for this app only:

- `https://ardent-admin-panel.web.app`
- `https://ardent-admin-panel.firebaseapp.com`

The main app stays on `https://ardent-mds.web.app` — do not deploy this repo to the `ardent-mds` site.

## One-time setup (done in repo)

- `firebase.json` — `site: ardent-admin-panel`, serves `dist/` with SPA rewrites
- `.firebaserc` — default project `ardent-mds`

## Deploy

```bash
npm run deploy
```

Or step by step:

```bash
npm run build
npx -y firebase-tools@latest deploy --only hosting:ardent-admin-panel
```

Production env vars are baked in at build time from `.env` (Vite `VITE_*` variables). Ensure `.env` has the correct values before deploying.

## Add a custom domain

1. Open [Firebase Console → Hosting](https://console.firebase.google.com/project/ardent-mds/hosting/sites) and select the **ardent-admin-panel** site (not `ardent-mds`).
2. In **Domains**, click **Add custom domain**.
3. Enter your domain (e.g. `admin.yourdomain.com` or `yourdomain.com`).
4. Follow the wizard to add the DNS records at your registrar (A/AAAA or CNAME as shown).
5. Wait for SSL provisioning (often 24–48 hours for new domains; subdomains are usually faster).

### After the custom domain is live

1. **Firebase Authentication → Settings → Authorized domains**  
   Add your custom hostname so sign-in works on that URL.

2. **Optional:** If you want OAuth redirects to use the custom domain, configure [Firebase Auth custom domain](https://firebase.google.com/docs/auth/web/custom-domain) in the console. Until then, keep `VITE_FIREBASE_AUTH_DOMAIN=ardent-mds.firebaseapp.com` in `.env` (recommended default).

3. Rebuild and redeploy if you change any `VITE_*` values:

   ```bash
   npm run deploy
   ```

## Preview channel (test before production)

```bash
npm run build
npx -y firebase-tools@latest hosting:channel:deploy preview-admin
```

Use the printed `*.web.app` preview URL to verify before `npm run deploy`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on refresh / deep links | SPA rewrite in `firebase.json` should route `**` → `/index.html` |
| Auth fails on custom domain | Add domain under **Authorized domains** |
| Stale UI after deploy | Hard refresh; `index.html` is set to `no-cache` |
| CLI not logged in | `npx -y firebase-tools@latest login` |
