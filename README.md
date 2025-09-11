# ASC3 Contribution Management System v1.0

ระบบจัดการข้อมูล Contribution ของทีม Presale ที่ออกแบบมาเพื่อเก็บข้อมูล Impact และ Contribution ที่ทีมได้ทำให้กับ Account ต่างๆ ในปี 2025

## 🎯 Key Features

- **Modern UI/UX**: ออกแบบด้วย Tailwind CSS และ React ที่สวยงาม
- **Dual Language Support**: ภาษาไทย/อังกฤษพร้อม localStorage persistence
- **Dark/Light Theme**: โหมดมืด/สว่างพร้อม contrast ที่เหมาะสม
- **Comprehensive Dashboard**: Dashboard สำหรับ User และ Admin พร้อม Monthly Impact Matrix
- **Contribution Management**: จัดการ Contribution แบบ Draft, Submit, Review, Delete
- **User Management**: ระบบจัดการ User พร้อมสิทธิ์ Admin และ User
- **Report Generation**: สร้างรายงานแบบครบถ้วนพร้อม Print
- **HTTPS Support**: รองรับ HTTPS สำหรับ Production
- **Docker Ready**: พร้อมสำหรับ Docker deployment

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **SQLite** Database
- **JWT Authentication**
- **RESTful API**

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** สำหรับ UI ที่ Modern
- **React Router** สำหรับ Navigation
- **React Hook Form** สำหรับ Form Management

### Deployment
- **Docker** + **Docker Compose**
- **HTTPS** Support
- **Production Ready** Architecture

## 📋 Prerequisites

- **Node.js 18+** (แนะนำ 18.17.0 หรือใหม่กว่า)
- **npm 9+** หรือ **yarn 1.22+**
- **Docker** (สำหรับ Production)
- **Modern Browser** (Chrome 90+, Firefox 88+, Safari 14+)

## 🚀 Quick Start

### Development Mode

1. **Clone Repository**
```bash
git clone <repository-url>
cd presale-contribution-system
```

2. **Install Dependencies**
```bash
npm install
cd client && npm install
cd ..
```

3. **Start Development Server**
```bash
npm run dev
```

ระบบจะเริ่มทำงานที่:
- Backend: http://localhost:5001
- Frontend: http://localhost:3000

### Production Mode (HTTPS)

1. **Generate SSL Certificates**
```bash
npm run ssl:generate
```

2. **Build Application**
```bash
npm run build
```

3. **Start HTTPS Production Server**
```bash
npm run start:production
```

ระบบจะเริ่มทำงานที่:
- Backend HTTPS: https://localhost:5443
- Frontend: https://localhost:3000

### Docker Deployment

1. **Build Docker Image**
```bash
docker build -t presale-contribution-system .
```

2. **Run Container**
```bash
docker run -p 3000:3000 -p 5443:5443 presale-contribution-system
```

3. **Use Docker Compose (แนะนำ)**
```bash
docker-compose up -d
```

## 🔐 Default Login

ระบบมาพร้อมกับ Admin User เริ่มต้น:

- **Email**: admin@presale.com
- **Password**: password

## 📊 Database Schema

### Users Table
- `id`: Unique identifier (UUID v4)
- `fullName`: ชื่อ-นามสกุล
- `staffId`: รหัสพนักงาน
- `email`: อีเมล (ใช้เป็น Username)
- `password`: รหัสผ่าน (เข้ารหัสด้วย bcrypt)
- `involvedAccountNames`: รายชื่อ Account ที่เกี่ยวข้อง (JSON Array)
- `involvedSaleNames`: รายชื่อ Sale ที่เกี่ยวข้อง (JSON Array)
- `involvedSaleEmails`: อีเมล Sale ที่เกี่ยวข้อง (JSON Array)
- `role`: สิทธิ์ (user/admin)
- `canViewOthers`: สามารถดูข้อมูลคนอื่นได้หรือไม่
- `status`: สถานะบัญชี (pending/approved/rejected)
- `createdAt`, `updatedAt`: วันที่สร้างและอัปเดต

### Contributions Table
- `id`: Unique identifier
- `userId`: รหัส User ที่สร้าง
- `accountName`: ชื่อ Account
- `saleName`: ชื่อ Sale
- `saleEmail`: อีเมล Sale
- `contributionType`: ประเภท Contribution (technical/business/relationship/innovation/other)
- `title`: หัวข้อ Contribution
- `description`: รายละเอียด
- `impact`: ระดับ Impact (low/medium/high/critical)
- `effort`: ระดับความพยายาม (low/medium/high)
- `estimatedImpactValue`: มูลค่าประมาณการ
- `contributionMonth`: เดือนที่ทำ Contribution
- `status`: สถานะ (draft/submitted/approved/rejected)
- `tags`: Tags (JSON Array)
- `createdAt`, `updatedAt`: วันที่สร้างและอัปเดต

## 🔧 Configuration

### Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:

```env
# Environment
NODE_ENV=development

# Server Configuration
PORT=5001
HOST=localhost

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
DB_PATH=./data/presale_contributions.db

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# HTTPS Configuration (Production)
HTTPS_PORT=5443
SSL_KEY_PATH=./ssl/private-key.pem
SSL_CERT_PATH=./ssl/certificate.pem

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5001
REACT_APP_ENVIRONMENT=development
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/profile` - ดูข้อมูล Profile

### Users (Admin Only)
- `GET /api/users` - ดูรายชื่อ User ทั้งหมด
- `POST /api/users` - สร้าง User ใหม่
- `PUT /api/users/:id` - แก้ไขข้อมูล User
- `DELETE /api/users/:id` - ลบ User

### Contributions
- `GET /api/contributions` - ดู Contribution ของตัวเอง
- `GET /api/contributions/admin` - ดู Contribution ทั้งหมด (Admin)
- `POST /api/contributions` - สร้าง Contribution ใหม่
- `PUT /api/contributions/:id` - แก้ไข Contribution
- `DELETE /api/contributions/:id` - ลบ Contribution

### Reports
- `GET /api/reports/dashboard` - ข้อมูล Dashboard
- `GET /api/reports/timeline` - ข้อมูล Timeline
- `POST /api/reports/comprehensive` - รายงานแบบครบครัน

## 🐳 Docker Architecture

### แนะนำ: Single Docker Container
สำหรับระบบนี้แนะนำให้ใช้ **Single Docker Container** เพราะ:

1. **Simplicity**: ง่ายต่อการจัดการและ deploy
2. **Resource Efficiency**: ใช้ resource น้อยกว่า multi-container
3. **Development**: ง่ายต่อการ development และ testing
4. **Maintenance**: ง่ายต่อการ maintain และ update

### Docker Structure
```
presale-contribution-system/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── dist/ (built application)
```

## 🔒 Security Features

- **JWT Authentication** พร้อม Token Expiration
- **Password Hashing** ด้วย bcrypt
- **Input Validation** และ Sanitization
- **CORS Protection**
- **HTTPS Support** สำหรับ Production
- **Generic Error Messages** เพื่อป้องกัน enumeration attacks

## 📈 Performance Features

- **Database Indexing** สำหรับ Query ที่ใช้บ่อย
- **Response Compression**
- **Static File Caching**
- **Optimized Re-renders** ด้วย React hooks
- **Efficient State Management** ด้วย Context API

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - เปลี่ยน PORT ใน .env file
   - ตรวจสอบ process ที่ใช้ port เดียวกัน

2. **Build Error**
   - ลบ node_modules และ install ใหม่
   - ตรวจสอบ Node.js version (ต้องเป็น 18+)

3. **HTTPS Certificate Issues**
   - ใช้ `npm run ssl:generate` เพื่อสร้าง self-signed certificates
   - สำหรับ production ให้ใช้ certificates จาก trusted CA

4. **Docker Build Issues**
   - ตรวจสอบ Dockerfile syntax
   - ตรวจสอบ .dockerignore file

## 🤝 Contributing

1. Fork repository
2. สร้าง feature branch
3. Commit changes
4. Push to branch
5. สร้าง Pull Request

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ README นี้ก่อน
2. ดู Issues ใน GitHub
3. สร้าง Issue ใหม่พร้อมรายละเอียด

---

**Built with ❤️ for Presale Teams**