# 🚀 Deployment Guide - Smart Campus for MNSUET

## Quick Deployment Options

### 1. Vercel (Recommended - Free & Easy)

#### Step 1: Prepare Your Code

```bash
# Make sure your code is in a GitHub repository
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure environment variables:
   ```
   DATABASE_URL=your_mysql_connection_string
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   ```
6. Click "Deploy"

#### Step 3: Database Setup

1. Use a cloud database service (PlanetScale, Railway, or AWS RDS)
2. Update your `DATABASE_URL` in Vercel environment variables
3. Run migrations: `npx prisma db push`

### 2. Railway (Alternative - Free Tier)

#### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add MySQL database service
4. Configure environment variables
5. Deploy

### 3. Netlify (Static Hosting)

#### Step 1: Build for Static Export

```bash
# Update next.config.ts
export default {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

# Build
npm run build
```

#### Step 2: Deploy

1. Upload the `out` folder to Netlify
2. Or connect your GitHub repository

## Environment Variables Setup

### Required Variables

```env
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Email (Optional - for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Options

#### 1. PlanetScale (Recommended)

- Free tier available
- MySQL compatible
- Easy setup

#### 2. Railway Database

- Free tier available
- Automatic backups
- Easy integration

#### 3. AWS RDS

- Production ready
- Scalable
- Pay-as-you-go

## Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build successful locally
- [ ] All API routes tested
- [ ] Authentication working
- [ ] Responsive design verified

## Post-Deployment Steps

1. **Test All Features**

   - User registration/login
   - Role-based access
   - All CRUD operations
   - File uploads (if any)

2. **Performance Optimization**

   - Enable caching
   - Optimize images
   - Monitor performance

3. **Security Review**
   - HTTPS enabled
   - Environment variables secure
   - Database access restricted

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Database Connection

- Check `DATABASE_URL` format
- Verify database credentials
- Ensure database is accessible

#### Environment Variables

- Verify all required variables are set
- Check for typos in variable names
- Restart deployment after changes

## Monitoring & Maintenance

### Performance Monitoring

- Use Vercel Analytics
- Monitor Core Web Vitals
- Track API response times

### Database Maintenance

- Regular backups
- Monitor query performance
- Clean up old data

### Security Updates

- Keep dependencies updated
- Monitor for vulnerabilities
- Regular security audits

## Support

For deployment issues:

1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Contact support if needed

---

**Your Smart Campus for MNSUET is now ready for live deployment! 🎉**
