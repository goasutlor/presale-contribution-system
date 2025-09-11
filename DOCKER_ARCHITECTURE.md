# Docker Architecture Recommendation

## 🐳 แนะนำ: Single Docker Container

สำหรับระบบ ASC3 Contribution Management System แนะนำให้ใช้ **Single Docker Container** เพราะ:

### ✅ ข้อดีของ Single Container

1. **Simplicity**: ง่ายต่อการจัดการและ deploy
2. **Resource Efficiency**: ใช้ resource น้อยกว่า multi-container
3. **Development**: ง่ายต่อการ development และ testing
4. **Maintenance**: ง่ายต่อการ maintain และ update
5. **Cost Effective**: ประหยัดค่าใช้จ่ายในการ deploy
6. **Faster Startup**: เริ่มต้นเร็วขึ้น

### 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│        Docker Container             │
│  ┌─────────────────────────────────┐│
│  │        Frontend (React)         ││
│  │     - Static Files              ││
│  │     - Built with npm run build  ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │        Backend (Node.js)        ││
│  │     - Express Server            ││
│  │     - API Routes                ││
│  │     - Database (SQLite)         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 📁 File Structure

```
presale-contribution-system/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── dist/ (built application)
│   ├── server/ (backend)
│   └── client/ (frontend static files)
└── ssl/ (SSL certificates)
```

### 🔧 Docker Configuration

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose ports
EXPOSE 3000 5443

# Start application
CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  presale-contribution:
    build: .
    ports:
      - "3000:3000"  # Frontend
      - "5443:5443"  # Backend HTTPS
    volumes:
      - ./ssl:/app/ssl
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=5443
      - HTTPS_PORT=5443
    restart: unless-stopped
```

### 🚀 Deployment Options

#### 1. Development
```bash
docker-compose up --build
```

#### 2. Production
```bash
docker-compose -f docker-compose.yml up -d
```

#### 3. With SSL
```bash
# Generate SSL certificates first
npm run ssl:generate

# Then run with Docker
docker-compose up -d
```

### 🔒 Security Considerations

1. **SSL/TLS**: ใช้ HTTPS สำหรับ production
2. **Environment Variables**: ใช้ .env file สำหรับ sensitive data
3. **Volume Mounting**: mount SSL certificates และ database
4. **Network Security**: ใช้ internal networks

### 📊 Resource Requirements

#### Minimum
- **CPU**: 1 core
- **RAM**: 512MB
- **Storage**: 1GB

#### Recommended
- **CPU**: 2 cores
- **RAM**: 1GB
- **Storage**: 2GB

### 🔄 Alternative: Multi-Container (ไม่แนะนำ)

หากต้องการแยก container สามารถทำได้:

```
┌─────────────────┐  ┌─────────────────┐
│  Frontend       │  │  Backend        │
│  (Nginx)        │  │  (Node.js)      │
│  - Static Files │  │  - API Server   │
│  - Port 80/443  │  │  - Port 3000    │
└─────────────────┘  └─────────────────┘
```

แต่จะซับซ้อนกว่าและใช้ resource มากกว่า

### 🎯 Conclusion

สำหรับระบบนี้ **Single Docker Container** เป็นทางเลือกที่ดีที่สุด เพราะ:
- ระบบไม่ซับซ้อนมาก
- ไม่ต้องการ scale แยกกัน
- ง่ายต่อการจัดการ
- ประหยัด resource
