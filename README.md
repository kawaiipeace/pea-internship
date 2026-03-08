# ระบบจัดการนักศึกษาฝึกงาน PEA
System จัดการฝึกงาน

ระบบที่ครอบคลุมสำหรับจัดการฝึกงาน สร้างด้วยเทคโนโลยีเว็บสมัยใหม่ เพื่อการไหลเห็นของกระบวนการสมัครและการจัดการฝึกงาน

## 📋 โครงสร้างโปรเจค

```
pea-internship/
├── frontend-main/          # แอปพลิเคชัน Frontend หลักของระบบ (NextJS)
├── frontend-itt/           # ไมโครเซอร์วิส Frontend สำหรับบันทึกเวลา (NextJS)
├── backend-main/           # Backend API หลักของระบบ (ElysiaJS + Bun)
├── db/                     # ฐานข้อมูล PostgreSQL
├── bruno-api-spec/         # ข้อมูล API Specifications (Bruno)
├── docker-compose.yml      # ไฟล์ Docker Compose Configuration
└── README.md              # ไฟล์นี้
```

## 🏗️ เทคโนโลยีที่ใช้

| Service | Technology | Port | วัตถุประสงค์ |
|---------|-----------|------|---------|
| frontend-main | Next.js 16+ | 2700 | ระบบจัดการนักศึกษาฝึกงาน |
| frontend-itt | Next.js 16+ | 2701 | ระบบบันทึกเวลานักศึกษาฝึกงาน |
| backend-main | Elysia + Bun | 2702 | REST API Backend |
| db | PostgreSQL 18 | 2703 | ฐานข้อมูล |
| minio | MinIO (S3) | 2704/2705 | Object Storage สำหรับไฟล์เอกสาร |

## 🌐 ลิงก์การเข้าถึง Production (Simulation)

| Service | URL | วัตถุประสงค์ |
|---------|-----|---------|
| Frontend Main | https://pea-internship-main.vercel.app/ | ระบบจัดการนักศึกษาฝึกงาน |
| Frontend ITT | https://pea-internship-itt.vercel.app/ | ระบบบันทึกเวลานักศึกษาฝึกงาน |
| Backend API | https://pea-internship-backend.up.railway.app/docs | REST API และ Swagger Documentation |
| Database | `postgresql://postgres:yajQMgjvGdfDTFHWOuZANSeDSlmhJXcw@shortline.proxy.rlwy.net:42595/pea-internship` | PostgreSQL Connection String |
| MinIO | https://pea-internship-minio.up.railway.app | Object Storage สำหรับไฟล์เอกสาร |


## 🚀 เริ่มต้นด่วน

### ความต้องการ

- Docker & Docker Compose (สำหรับการ Deploy ใน Container)
- Node.js 20+ (สำหรับการพัฒนาในเครื่อง)
- Bun 1.2+ (สำหรับการพัฒนา backend-main ในเครื่อง)

### ตัวเลือกที่ 1: Docker Compose (แนะนำ)

1. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/pea-internship.git
   cd pea-internship
   ```

2. **สร้างไฟล์ environment:**
   ```bash
   cp .env.example .env
   ```

3. **Build และ Start ทุก Service:**
   ```bash
   docker-compose up -d
   ```

4. **เข้าใช้งานแอปพลิเคชัน:**
   - Frontend Main: http://localhost:2700
   - Frontend ITT: http://localhost:2701
   - Backend API: http://localhost:2702
   - API Docs: http://localhost:2702/docs
   - Database: localhost:2703
   - MinIO Console: http://localhost:2705
   - MinIO API: http://localhost:2704
5. **ดูลอก:**
   ```bash
   docker-compose logs -f
   ```

6. **หยุด Services:**
   ```bash
   docker-compose down
   ```

### ตัวเลือกที่ 2: พัฒนาในเครื่อง

#### การตั้งค่า Backend (ElysiaJS + Bun)

```bash
cd backend-main

# ติดตั้ง dependencies
bun install

# รัน development server (ใช้ port 2702)
bun run dev

# หรือ ใช้ environment variable
PORT=2702 bun run src/index.ts
```

#### การตั้งค่า Frontend Main

```bash
cd frontend-main

# ติดตั้ง dependencies
npm install

# รัน development server (ใช้ port 2700)
npm run dev
```

#### การตั้งค่า Frontend ITT

```bash
cd frontend-itt

# ติดตั้ง dependencies
npm install

# รัน development server (ใช้ port 2701)
npm run dev -p 2701
# หรือ
npm start  
```

#### การตั้งค่าฐานข้อมูล

```bash
# ใช้ Docker สำหรับฐานข้อมูลเท่านั้น
docker run -d \
  --name pea-db \
  -e POSTGRES_DB=intern-pea \
  -e POSTGRES_PASSWORD=postgres \
  -p 2703:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:18.1

# หรือใช้ docker-compose สำหรับทั้ง Services
docker-compose up -d
```

## 🐳 Docker Deployment

### สร้าง Docker Images แต่ละตัว

```bash
# Backend
docker build -t pea-internship-backend:latest ./backend-main

# Frontend Main
docker build -t pea-internship-frontend-main:latest ./frontend-main

# Frontend ITT
docker build -t pea-internship-frontend-itt:latest ./frontend-itt

# Database
docker build -t pea-internship-db:latest ./db
```

### รัน Docker Compose

```bash
# Start ทั้ง Services
docker-compose up -d

# Stop ทั้ง Services
docker-compose down

# ดูลอก
docker-compose logs -f [service-name]

# Rebuild images
docker-compose up -d --build
```

## 🚢 Railway Deployment

โปรเจคนี้ถูกสร้างให้ Deploy บน [Railway.app](https://railway.com/)

### ขั้นตอนการ Deploy:

1. **เชื่อมต่อ GitHub repository** ของคุณกับ Railway
2. **ตั้งค่า Environment Variables** ใน Railway dashboard:
   ```
   NODE_ENV=production
   DB_USER=postgres
   DB_PASSWORD=รหัสผ่านที่ปลอดภัย
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=รหัสผ่านที่ปลอดภัย
   MINIO_BUCKET=intern-pea
   ```
3. **ดูการ Deploy** - Railway จะ Build และ Deploy อัตโนมัติจาก Dockerfiles

### การตั้งค่า Service สำหรับ Railway:

ทุก Service ได้รับการตั้งค่าแล้ว:
- **Dockerfile**: Multi-stage builds เพื่อความเหมาะสม
- **Port Exposure**: Services expose ports ที่ตั้งค่าไว้
- **Health Checks**: ระบบตรวจสอบสุขภาพอัตโนมัติ
- **Environment Variables**: รองรับการตั้งค่าให้ยืดหยุ่น

## 📁 รายละเอียด Service

### Frontend Main (`frontend-main/`)
- Next.js 16+ กับ TypeScript
- Tailwind CSS สำหรับ styling
- Redux สำหรับจัดการ state
- ระบบจัดการนักศึกษาฝึกงาน

### Frontend ITT (`frontend-itt/`)
- ระบบไมโครเซอร์วิสแยกสำหรับบันทึกเวลาของนักศึกษา
- Deployment แยกจาก frontend-main
- NextJS กับ React 19
- ระบบจัดการปฏิทิน และบันทึกเวลา

### Backend Main (`backend-main/`)
- ElysiaJS REST API framework
- Bun runtime สำหรับประสิทธิภาพสูง
- Drizzle ORM สำหรับการจัดการฐานข้อมูล
- PostgreSQL integration
- Swagger API documentation ที่ `/docs`

### Database (`db/`)
- PostgreSQL 18.1
- pg_cron extension สำหรับ scheduled tasks
- TDS FDW สำหรับการเชื่อมต่อแหล่งข้อมูลภายนอก
- Automatic schema initialization

### MinIO Object Storage (`minio/`)
- S3-compatible object storage สำหรับไฟล์เอกสาร
- Ports: 2704 (API), 2705 (Web Console)
- Default credentials: minioadmin / minioadmin
- Bucket name: intern-pea
- Persistent storage ด้วย Docker volume
- Health checks สำหรับ API endpoint
- ใช้สำหรับเก็บไฟล์เอกสารนักศึกษา (resume, transcripts, application documents)

## 🔧 Environment Variables

สร้างไฟล์ `.env` ในโปรเจค root:

```bash
# ฐานข้อมูล
DB_USER=postgres
DB_PASSWORD=รหัสผ่าน

# MinIO Object Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=intern-pea

# สภาพแวดล้อมแอปพลิเคชัน
NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:2702
```

## 📝 API Documentation

Swagger/OpenAPI documentation อยู่ที่:
- **Local**: http://localhost:2702/docs
- **Production**: https://pea-internship-backend.up.railway.app/docs

MinIO Console เข้าถึงได้ที่:
- **Local**: http://localhost:2705
- **Production**: https://pea-internship-minio.up.railway.app

## 🔐 ความปลอดภัย

- รหัสผ่านฐานข้อมูลควรเปลี่ยนในการ Production
- MinIO credentials (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD) ควรเปลี่ยนเป็นรหัสผ่านที่ปลอดภัย
- ใช้ environment variables สำหรับข้อมูลที่ไวต่อ
- Health checks ได้รับการตั้งค่าสำหรับทั้ง Services
- Dockerfiles ใช้ base images ที่มีขนาดเล็ก
- Production builds มีเฉพาะ dependencies ที่จำเป็น

## 📊 Health Checks

ทั้ง Services มี health checks:

```bash
# ตรวจสอบ Backend health
curl http://localhost:2702/docs

# ตรวจสอบ Frontend
curl http://localhost:2700

# ตรวจสอบ MinIO
curl http://localhost:2704/minio/health/live

# ตรวจสอบฐานข้อมูล
docker-compose exec db pg_isready -U postgres -d intern-pea
```

## 🤝 การมีส่วนร่วม

1. สร้าง feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push branch: `git push origin feature/your-feature`
4. แจ้ง Pull Request

## 📄 License

โปรเจคนี้ได้รับอนุญาตภายใต้ MIT License - ดู [LICENSE](LICENSE) file สำหรับรายละเอียด

## 📧 Support

สำหรับปัญหาและคำถาม โปรดเปิด issue ใน GitHub

---

**ปรับปรุงครั้งล่าสุด**: มีนาคม 2026
**เวอร์ชัน**: 1.0.0
