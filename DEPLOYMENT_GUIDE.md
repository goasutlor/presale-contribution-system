# 🚀 Deployment Guide - ASC3 Contribution System

## Overview
This guide provides multiple ways to deploy the ASC3 Contribution System to AWS App Runner.

## Prerequisites

### 1. AWS Account
- [ ] AWS Free Tier account (1 year free)
- [ ] AWS CLI installed and configured
- [ ] IAM permissions for App Runner

### 2. GitHub Repository
- [ ] Code pushed to GitHub
- [ ] GitHub Actions enabled
- [ ] AWS credentials in GitHub Secrets

## Deployment Methods

### Method 1: Quick Deploy (Recommended)

#### Windows PowerShell:
```powershell
.\quick-deploy.ps1
```

#### Linux/macOS:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### Method 2: Manual Deploy

#### Windows PowerShell:
```powershell
.\deploy-aws.ps1
```

#### Linux/macOS:
```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

### Method 3: GitHub Actions (Automatic)

1. **Add AWS Secrets to GitHub:**
   - Go to: https://github.com/goasutlor/presale-contribution-system/settings/secrets/actions
   - Add secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions will automatically:**
   - Build the application
   - Deploy to AWS App Runner
   - Provide the service URL

### Method 4: AWS Console (Manual)

1. **Go to AWS App Runner Console:**
   - https://console.aws.amazon.com/apprunner/

2. **Create Service:**
   - Source: GitHub
   - Repository: `goasutlor/presale-contribution-system`
   - Branch: `main`
   - Configuration: Use `apprunner.yaml`

3. **Configure Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   DB_PATH=/tmp/data/presale_contributions.db
   ```

## Configuration Files

### apprunner.yaml
```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm cache clean --force
      - npm install --legacy-peer-deps --force
      - cd client && npm install --legacy-peer-deps --force
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 5001
```

### .github/workflows/deploy.yml
- Automatic deployment on push to main
- Build and deploy to AWS App Runner
- Environment variables configuration

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5001` | Application port |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret |
| `DB_PATH` | `/tmp/data/presale_contributions.db` | Database file path |

## Cost Estimation

### AWS Free Tier (1 Year)
- **App Runner**: 750 hours/month free
- **Data Transfer**: 1 GB/month free
- **Storage**: 1 GB free
- **Total**: $0/month for first year

### After Free Tier
- **App Runner**: ~$7-15/month (depending on usage)
- **Data Transfer**: $0.09/GB
- **Storage**: $0.10/GB/month

## Troubleshooting

### Common Issues

1. **TypeScript Version Conflict**
   - Solution: Use `--legacy-peer-deps` flag
   - Fixed in deployment scripts

2. **AWS CLI Not Configured**
   - Solution: Run `aws configure`
   - Provide AWS credentials

3. **GitHub Actions Failing**
   - Check AWS secrets in GitHub
   - Verify repository permissions

4. **App Runner Service Not Starting**
   - Check environment variables
   - Verify build commands
   - Check CloudWatch logs

### Debug Commands

```bash
# Check AWS CLI
aws sts get-caller-identity

# Check App Runner services
aws apprunner list-services

# Check service status
aws apprunner describe-service --service-arn <SERVICE_ARN>

# Check logs
aws logs describe-log-groups --log-group-name-prefix /aws/apprunner
```

## Monitoring

### AWS Console
- **App Runner**: https://console.aws.amazon.com/apprunner/
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **IAM**: https://console.aws.amazon.com/iam/

### GitHub Actions
- **Actions**: https://github.com/goasutlor/presale-contribution-system/actions
- **Secrets**: https://github.com/goasutlor/presale-contribution-system/settings/secrets/actions

## Support

If you encounter issues:

1. **Check logs** in AWS CloudWatch
2. **Verify configuration** in deployment scripts
3. **Test locally** before deploying
4. **Check GitHub Actions** for build errors

## Success Indicators

✅ **Deployment Successful When:**
- GitHub Actions shows green checkmark
- AWS App Runner service is running
- Service URL is accessible
- Application loads without errors
- Database is created and accessible

🎉 **Your application is now live on AWS App Runner!**
