# 📊 Data Management Guide

## 🚨 Data Persistence Issue

Railway ใช้ **ephemeral storage** ซึ่งหมายความว่าข้อมูลจะหายเมื่อ:
- Container restart
- Service redeploy
- Service update

## 🔧 Solutions

### 1. Railway Volume (Recommended)
```toml
# railway.toml
[volume]
mountPath = "/app/data"
```

### 2. Auto Admin User Creation
ระบบจะสร้าง Admin user อัตโนมัติเมื่อ database ว่าง:
- **Email**: admin@presale.com
- **Password**: password

### 3. Database Backup & Restore

#### Create Backup
```bash
npm run backup:create
```

#### List Backups
```bash
npm run backup:list
```

#### Restore from Backup
```bash
npm run backup:restore <backup-file>
```

#### Create Admin User
```bash
npm run admin:create
```

## 📁 File Structure

```
/app/data/
├── presale_contributions.db    # Main database
└── backups/                    # Backup files
    ├── presale_contributions_2024-01-01T00-00-00-000Z.db
    └── ...
```

## 🔄 Startup Process

1. **Container starts**
2. **Create admin user** (if not exists)
3. **Start server**
4. **Database persists** (with Railway Volume)

## ⚠️ Important Notes

- **Always backup data** before major updates
- **Test restore process** regularly
- **Monitor database size** (Railway has limits)
- **Use Railway Volume** for production

## 🆘 Recovery Steps

If data is lost:

1. **Check Railway Volume** is mounted
2. **Create admin user**: `npm run admin:create`
3. **Restore from backup**: `npm run backup:restore <file>`
4. **Verify data**: Check admin dashboard

## 📞 Support

If you need help with data recovery:
1. Check Railway logs
2. Verify volume mount
3. Run backup/restore scripts
4. Contact support with logs
