# 🚀 Railway Deployment Guide

## Quick Deploy to Railway

### 1. Go to Railway
- **URL**: https://railway.app/
- **Sign up** with GitHub account

### 2. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"goasutlor/presale-contribution-system"**
4. Click **"Deploy Now"**

### 3. Configure Environment Variables
Add these environment variables in Railway dashboard:

```
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DB_PATH=/tmp/data/presale_contributions.db
CORS_ORIGIN=https://your-app-name.railway.app
```

### 4. Deploy
- Railway will automatically:
  - Install dependencies
  - Build the application
  - Deploy to production
  - Provide HTTPS URL

## Features

✅ **Free Tier Available**
- 500 hours/month free
- $5 credit monthly
- HTTPS included

✅ **Auto Deploy**
- Deploy on every push
- GitHub integration
- Zero configuration

✅ **Environment Variables**
- Easy configuration
- Secure secrets management

## Cost

- **Free Tier**: 500 hours/month
- **Pro Plan**: $5/month for unlimited usage
- **Total**: $0/month with free tier

## Service URL

After deployment, your app will be available at:
`https://your-app-name.railway.app`

## Monitoring

- **Dashboard**: https://railway.app/dashboard
- **Logs**: Available in Railway dashboard
- **Metrics**: CPU, Memory, Network usage

## Alternative Platforms

### Vercel
- **URL**: https://vercel.com/
- **Free**: Unlimited static sites
- **Deploy**: Connect GitHub repo

### Heroku
- **URL**: https://heroku.com/
- **Free**: Limited hours/month
- **Deploy**: Connect GitHub repo

### Netlify
- **URL**: https://netlify.com/
- **Free**: 100GB bandwidth/month
- **Deploy**: Connect GitHub repo
