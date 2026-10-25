# Pulse — website

The marketing site for **Pulse**, an Android training log for gym and running.
The app itself lives in the separate `pulse-mobile` repo; this site only has:

| Route       | What it is                                                 |
| ----------- | ---------------------------------------------------------- |
| `/`         | Landing page with screenshots of the app                   |
| `/download` | "Get the Android App" — downloads the latest APK           |
| `/privacy`  | Privacy Policy                                             |
| `/terms`    | Terms of Service                                           |

Built with Next.js (App Router) + Tailwind, deployed on Netlify
(`pulse-strength-log`), which redeploys on every push to `main`.

## Publishing a new app version

The download button points at
`https://github.com/Rithesh17/fit-check/releases/latest/download/pulse.apk`, so a
new version is just a new GitHub Release with the APK attached as `pulse.apk`:

```bash
gh release create v1.0.1 path/to/app-release.apk#pulse.apk --title "Pulse 1.0.1"
```

The asset name must stay `pulse.apk`. No site redeploy is needed.

## Develop

```bash
npm install
npm run dev
```


The Supabase schema the app syncs to lives in the `pulse-mobile` repo at
`supabase/schema.sql`.
