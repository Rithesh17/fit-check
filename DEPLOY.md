# Deploying Fit-Check to Vercel

This guide will help you deploy your Fit-Check app to Vercel (free tier).

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free)
2. **GitHub Account**: (optional, but recommended for automatic deployments)
3. **Supabase Project**: Already set up with your database

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to GitHub

1. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/yourusername/fit-check.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`fit-check`)
4. Vercel will auto-detect SvelteKit

### Step 3: Configure Build Settings

Vercel should auto-detect, but verify:
- **Framework Preset**: SvelteKit
- **Build Command**: `npm run build`
- **Output Directory**: `build` (for static adapter)
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

In the Vercel project settings, go to **Settings** → **Environment Variables** and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- Add these for **Production**, **Preview**, and **Development** environments
- Get these values from your Supabase project settings → API

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (select your account)
- Link to existing project? **No** (first time)
- Project name? **fit-check** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

### Step 4: Add Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Post-Deployment Checklist

### ✅ Verify Deployment

1. Visit your deployed URL
2. Check browser console for any errors
3. Test creating a workout
4. Verify Supabase connection

### ✅ Update Supabase CORS (if needed)

If you get CORS errors, update your Supabase project settings:
1. Go to Supabase Dashboard → Settings → API
2. Add your Vercel domain to **Allowed CORS origins**:
   - `https://your-project.vercel.app`
   - `https://your-project-*.vercel.app` (for preview deployments)

### ✅ Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel

**Error: Build output not found**
- Verify `svelte.config.js` uses `adapter-static` with `pages: 'build'`
- Check that build command is `npm run build`

### Runtime Errors

**Supabase connection fails**
- Check environment variables are set correctly
- Verify Supabase project is active
- Check browser console for specific error messages

**404 errors on routes**
- This is normal for static sites with client-side routing
- Vercel should handle this automatically with the `fallback: 'index.html'` setting

### Performance

**Slow initial load**
- Enable Vercel's Edge Network (automatic)
- Consider enabling compression in `vercel.json` (optional)

---

## Continuous Deployment

Once connected to GitHub, Vercel will:
- ✅ Automatically deploy on every push to `main`
- ✅ Create preview deployments for pull requests
- ✅ Show build logs and deployment status

---

## Free Tier Limits

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL certificates
- ✅ Global CDN
- ✅ Preview deployments

This is more than enough for a personal fitness app!

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit Deployment Guide](https://kit.svelte.dev/docs/adapter-static)
- [Supabase Documentation](https://supabase.com/docs)
