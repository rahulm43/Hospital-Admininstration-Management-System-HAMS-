# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] PostgreSQL 15+ installed and running
- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Environment variables configured
- [ ] Database backups automated
- [ ] Monitoring setup ready
- [ ] CDN configured (optional)

## Environment Setup

Create `.env.production`:

```env
# Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=hospital_admin_db
DB_USER=hospital_admin
DB_PASSWORD=your-strong-password-here

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production

# Email (configure with your provider)
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@hospital-admin.com

# CORS
CORS_ORIGIN=https://hospital-admin.com

# Logging
LOG_LEVEL=error
```

## Docker Deployment

### Using Docker Compose Production Build

```bash
# Build and deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Monitor health
docker-compose ps
```

### Health Checks

```bash
# Check backend
curl https://hospital-admin.com/health

# Check frontend
curl https://hospital-admin.com
```

## Database Backup Strategy

### Automated Daily Backup

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="hospital_db_$DATE.sql"

docker-compose exec -T postgres pg_dump \
  -U hospital_admin hospital_admin_db | \
  gzip > "$BACKUP_DIR/$FILENAME.gz"

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $FILENAME.gz"
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Database Restore

```bash
# List available backups
ls -la /backups/

# Restore from backup
gunzip -c /backups/hospital_db_20241115_020000.sql.gz | \
docker-compose exec -T postgres psql -U hospital_admin hospital_admin_db
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot certonly --standalone -d hospital-admin.com -d www.hospital-admin.com

# Update nginx.conf to use certificates
# Copy certs to ./certs directory
cp /etc/letsencrypt/live/hospital-admin.com/fullchain.pem ./certs/
cp /etc/letsencrypt/live/hospital-admin.com/privkey.pem ./certs/
```

Update `nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name hospital-admin.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name hospital-admin.com;
    return 301 https://$server_name$request_uri;
}
```

## Performance Optimization

### Database Connection Pooling

Already configured in `database.js`:
```javascript
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
}
```

Increase for production:
```javascript
pool: {
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000,
}
```

### Caching

Add Redis for caching:

```bash
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

### CDN Configuration

1. CloudFlare:
   - Add your domain
   - Update nameservers
   - Enable caching rules

2. AWS CloudFront:
   - Create distribution
   - Point to your nginx domain
   - Configure cache behaviors

## Monitoring & Logging

### Application Monitoring

Monitor logs directory:
```bash
# Real-time log viewing
tail -f logs/combined.log
tail -f logs/error.log

# Log rotation setup (add to backend Dockerfile)
RUN apt-get install -y logrotate
```

### Health Monitoring

Set up health checks:

```bash
# Kubernetes health check endpoint
curl https://hospital-admin.com/health

# Response:
# {"status":"ok","timestamp":"2024-11-15T..."}
```

### Server Monitoring

Install monitoring tools:

```bash
# Ubuntu/Debian
apt-get install htop iotop nethogs

# Monitor resources
htop
```

## Security Hardening

### Firewall Configuration

```bash
# UFW (Uncomplicated Firewall)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Rate Limiting

Already configured in backend. Adjust in `index.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

Update for production domain:

```env
CORS_ORIGIN=https://hospital-admin.com,https://www.hospital-admin.com
```

## Update & Maintenance

### Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify
docker-compose ps
```

### Database Maintenance

```bash
# Connect to database
docker-compose exec postgres psql -U hospital_admin hospital_admin_db

# Analyze tables
ANALYZE;

# Vacuum and analyze
VACUUM ANALYZE;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname != 'pg_catalog' ORDER BY pg_total_relation_size DESC;
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if postgres is running
docker ps | grep postgres

# Check logs
docker logs hospital_db_prod

# Restart database
docker-compose restart postgres
```

### High Memory Usage

```bash
# Check memory
free -h
docker stats

# Increase Docker memory limit in docker-compose.yml:
backend:
  deploy:
    resources:
      limits:
        memory: 2G
```

### Slow Queries

Enable query logging:

```sql
-- Connect to database
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();
```

## Disaster Recovery

### Full Backup

```bash
# Backup everything
docker-compose exec postgres pg_dumpall -U postgres > full_backup.sql
```

### Recovery Process

```bash
# Stop services
docker-compose down

# Restore from backup
docker-compose up -d postgres
sleep 10
docker-compose exec postgres psql -U postgres < full_backup.sql

# Restart all services
docker-compose up -d
```

---

For more information, see README.md and DEVELOPMENT.md
