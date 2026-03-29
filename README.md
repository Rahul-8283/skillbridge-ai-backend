# 🚀 SkillBridge AI - Backend

![SkillBridge AI](https://img.shields.io/badge/SkillBridge-AI-0F172A?style=for-the-badge&logo=vercel&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge)

**SkillBridge AI Backend** is a robust Node.js/Express REST API that powers the intelligent career-skills platform. It handles authentication, data persistence, AI service orchestration, file uploads, and manages the entire job seeker & recruiter ecosystem.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express-4-black?logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248?logo=mongodb&logoColor=white) |
| **Cache/Session** | ![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?logo=redis&logoColor=white) |
| **Authentication** | ![JWT](https://img.shields.io/badge/JWT-7d%20Expiry-black) ![bcryptjs](https://img.shields.io/badge/bcryptjs-Hashing-blue) |
| **File Upload** | ![Multer](https://img.shields.io/badge/Multer-File%20Upload-green) |
| **Validation** | ![Joi](https://img.shields.io/badge/Joi-Validation-red) |
| **API Integration** | ![Axios](https://img.shields.io/badge/Axios-HTTP%20Client-blue) |
| **Deployment** | ![Render](https://img.shields.io/badge/Render-Backend%20Hosting-46E3B7?logo=render&logoColor=black) |

---

## 📁 Project Structure

```
skillbridge-ai-backend/
├── config/
│   ├── database.js         # MongoDB connection
│   ├── redis.js            # Redis cache setup
│   └── env.js              # Environment variables
├── controllers/
│   ├── authController.js   # Login, signup, JWT
│   ├── userController.js   # User profiles, roles
│   ├── resumeController.js # Resume upload, analysis
│   ├── jobController.js    # Job CRUD, matching
│   ├── seekerController.js # Seeker-specific operations
│   ├── providerController.js # Provider-specific operations
│   └── learningController.js # Learning plan generation
├── models/
│   ├── User.js             # User schema (seeker/provider)
│   ├── Resume.js           # Resume & analysis data
│   ├── Job.js              # Job listings
│   ├── Application.js      # Job applications
│   └── LearningPlan.js     # Learning roadmaps
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── user.js             # User routes
│   ├── seeker.js           # Seeker routes
│   ├── provider.js         # Provider routes
│   ├── jobs.js             # Job routes
│   ├── learning.js         # Learning plan routes
│   └── index.js            # Route aggregator
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── roleCheck.js        # Role-based access control
│   ├── errorHandler.js     # Global error handling
│   └── rateLimiter.js      # Rate limiting (Redis)
├── services/
│   ├── aiService.js        # FastAPI integration
│   ├── resumeService.js    # Resume analysis logic
│   ├── jobMatcherService.js # Job matching logic
│   └── cacheService.js     # Redis caching
├── utils/
│   ├── validators.js       # Data validation
│   ├── logger.js           # Logging utility
│   └── errorHandler.js     # Custom errors
├── uploads/                # File storage (temp)
├── .env                    # Environment variables
├── .gitignore
├── server.js               # Express app entry point
├── main.js                 # Server startup
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ installed
- MongoDB instance (local or Atlas)
- Redis instance (local or cloud)

### **Step 1: Clone Repository**
```bash
git clone https://github.com/Rahul-8283/skillbridge-ai-backend.git
cd skillbridge-ai-backend
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Environment Configuration**
Create `.env` file in root directory:
```bash
# Server
PORT=5000
NODE_ENV=development

# URLs
CLIENT_URL_DEV=http://localhost:5173
CLIENT_URL_PROD=https://skillbridge-ai-web.vercel.app
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://your_mongo_connection_string
MONGO_DB_NAME=skillbridge_db

# Cache & Session
REDIS_URL=redis://:password@host:port
REDIS_TTL=3600

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# AI Service
FASTAPI_URL=http://localhost:8000
FASTAPI_TIMEOUT=30000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### **Step 4: Start Backend Server**
```bash
npm run dev
# ✅ Backend runs on http://localhost:5000
```

---

## 📚 API Endpoints

### **Authentication Routes** (`/api/auth`)
```
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login & get JWT token
POST   /api/auth/refresh-token   # Refresh expired token
POST   /api/auth/logout          # Logout (clear session)
GET    /api/auth/verify          # Verify token validity
```

### **User Routes** (`/api/user`)
```
GET    /api/user/profile         # Get user profile
PUT    /api/user/profile         # Update user profile
GET    /api/user/role            # Get user role (seeker/provider)
PUT    /api/user/change-password # Change password
DELETE /api/user/account         # Delete account
```

### **Job Seeker Routes** (`/api/seeker`)
```
POST   /api/seeker/resume/upload     # Upload resume PDF
GET    /api/seeker/resume            # Get user's resume analysis
DELETE /api/seeker/resume/:id        # Delete resume
GET    /api/seeker/applications      # List user applications
GET    /api/seeker/applications/:id  # Get application details
PUT    /api/seeker/applications/:id  # Update application status
POST   /api/seeker/profile/complete  # Complete seeker profile
GET    /api/seeker/stats             # Get seeker dashboard stats
```

### **Job Provider Routes** (`/api/provider`)
```
POST   /api/provider/job/create      # Post new job
GET    /api/provider/jobs            # List provider's jobs
PUT    /api/provider/job/:id         # Edit job posting
DELETE /api/provider/job/:id         # Delete job posting
GET    /api/provider/candidates      # Browse candidates
GET    /api/provider/applications    # List applications received
PUT    /api/provider/applications/:id # Review/reject application
POST   /api/provider/profile/complete # Complete provider profile
GET    /api/provider/stats           # Get provider dashboard stats
```

### **Job Routes** (`/api/jobs`)
```
GET    /api/jobs                     # List all jobs (with filters)
GET    /api/jobs/:id                 # Get job details
POST   /api/jobs/search              # Search jobs by keywords
POST   /api/jobs/match               # Get job matches for user resume
```

### **Learning Plan Routes** (`/api/learning`)
```
POST   /api/learning/generate        # Generate roadmap for job/skill
GET    /api/learning/plans           # List user learning plans
GET    /api/learning/plans/:id       # Get roadmap details
PUT    /api/learning/plans/:id       # Update plan progress
DELETE /api/learning/plans/:id       # Delete learning plan
```

---

## ✨ Key Features

### 🔐 **1. Secure Authentication & Authorization**
- **JWT-Based Auth:** 7-day expiring tokens with refresh capability
- **Password Security:** bcryptjs hashing (10 salt rounds)
- **Role-Based Access Control:** Separate permissions for seekers and providers
- **Token Verification:** Middleware checks all protected routes
- **Session Management:** Redis-backed sessions with TTL
- **Account Security:** Password change, account deletion, logout endpoints

### 📤 **2. Resume Upload & Management**
- **PDF File Upload:** Multer middleware handles file storage
- **File Validation:** Type & size checking (10MB max)
- **Resume Storage:** MongoDB stores metadata, files via CDN/cloud storage
- **Analysis Integration:** Calls FastAPI AI Service for skill extraction
- **Multiple Resumes:** Users can upload and manage multiple resumes
- **Deletion Support:** Secure removal of resume files and records

### 🎯 **3. Intelligent Job Matching**
- **Smart Matching Algorithm:** Sends user skills to AI Service for semantic matching
- **Real-Time Scoring:** Match percentages calculated based on skill alignment
- **Job Filtering:** Filter by salary, experience, location, skills
- **Search Engine:** Full-text search across job descriptions
- **Candidate Ranking:** Jobs ranked by relevance and match score
- **Cached Results:** Redis caches match scores for performance

### 📊 **4. Application Tracking System**
- **Application Recording:** Log all job applications with timestamps
- **Status Management:** Track pending, accepted, rejected statuses
- **Provider Dashboard:** Recruiters view received applications
- **Applicant History:** Seekers see all application submissions
- **Communication Log:** Messages & notes between seeker and provider
- **Bulk Operations:** Mass update application statuses

### 📚 **5. Learning Plan Orchestration**
- **Roadmap Generation:** Integrates with FastAPI to create personalized paths
- **Skill Gap Analysis:** Identifies missing skills for target jobs
- **Module Organization:** Breaks learning into digestible sections
- **Progress Tracking:** Marks completed modules and calculates progress %
- **Resource Aggregation:** Stores YouTube, GitHub, docs links per skill
- **Time Estimation:** Displays hours needed per module

### 👤 **6. Dual User Role System**

#### **Job Seekers:**
- Upload and analyze resumes
- Browse jobs with personalized matches
- Track applications
- Generate learning roadmaps
- View profile completion metrics
- Access achievement badges

#### **Recruiters (Providers):**
- Post and manage job listings
- Browse candidate profiles
- Review applications
- Filter by match compatibility
- Track hiring pipeline
- Manage job requirements

### ⚡ **7. Performance & Caching**
- **Redis Caching:** Job listings, match scores cached with TTL
- **Rate Limiting:** API throttling to prevent abuse (Redis-backed)
- **Database Indexing:** MongoDB indexes on frequently queried fields
- **Async Operations:** Non-blocking I/O throughout
- **Connection Pooling:** Efficient database connection management
- **Compression:** Response compression for API payloads

### 🔒 **8. Security & Validation**
- **Input Validation:** Joi schemas for all request data
- **SQL Injection Prevention:** Mongoose parameterized queries
- **CORS Protection:** Restricted to authorized frontends
- **HTTP Security Headers:** helmet.js for secure headers
- **Error Handling:** Custom error responses (no stack traces exposed)
- **Logging:** Activity logging for audit trails

### 🔄 **9. AI Service Integration**
- **FastAPI Communication:** HTTP POST calls to AI microservice
- **Resume Analysis:** Sends PDF text to extraction agents
- **Job Matching:** Sends user skills + job requirements for scoring
- **Roadmap Generation:** Orchestrates learning plan creation
- **Error Handling:** Fallback if AI Service is unavailable
- **Async Processing:** Non-blocking AI service calls

### 📈 **10. Dashboard & Analytics**
- **Seeker Stats:** Applications count, match trends, profile completion
- **Provider Stats:** Posted jobs, applications received, hire rate
- **Activity Logs:** Track user actions and API usage
- **Error Monitoring:** Track failed requests and error rates
- **Performance Metrics:** API response times and throughput
- **Custom Reports:** Generate analytics dashboards

---

## 🏗️ Backend Architecture

### **Layered Architecture**

```
┌────────────────────────────────────────────────────────┐
│              REQUEST LAYER                             │
│  (Express Middleware: Auth, Validation, Rate Limit)    │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│           ROUTING LAYER                                │
│  (Express Routes: /auth, /user, /seeker, etc.)         │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│        CONTROLLER LAYER                                │
│  (Business Logic: Request processing, response)        │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│         SERVICE LAYER                                  │
│  (Core Logic: AI integration, matching, validation)    │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│      MODEL/DATABASE LAYER                              │
│  (Mongoose Schemas: User, Job, Resume, etc.)           │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│        DATA PERSISTENCE LAYER                          │
│  (MongoDB, Redis, File Storage)                        │
└────────────────────────────────────────────────────────┘
```

### **Request Flow Example: Job Matching**

```
1. Frontend sends: GET /api/jobs/match?resumeId=xyz
   
2. Auth Middleware
   → Verifies JWT token
   → Extracts user ID
   
3. Router: /api/jobs/match
   → Directs to jobController
   
4. Controller: matchJobs()
   → Validates input
   → Gets user resume from MongoDB
   
5. Service: jobMatcherService.calculateMatches()
   → Calls FastAPI with skills + job requirements
   → Receives match scores from AI Service
   → Caches results in Redis
   
6. Database: Retrieve all jobs
   → MongoDB query with pagination
   
7. Response Formatter
   → Ranks jobs by match score
   → Returns to frontend
   
8. Frontend receives: 
   {
     jobs: [
       { _id, title, matchScore: 92%, missingSkills: [] },
       { _id, title, matchScore: 78%, missingSkills: [] }
     ]
   }
```

### **Database Collections**

#### **Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: Hash,
  role: "seeker" | "provider",
  profile: {
    name: String,
    phone: String,
    experience: Number,
    location: String,
    skills: [String],
    education: [{degree, institution, year}]
  },
  profileCompletion: Number (0-100),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### **Resume Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  fileUrl: String,
  uploadedAt: DateTime,
  analysis: {
    extractedSkills: [{ name: String, confidence: Number }],
    experience: [{ company, title, duration, description }],
    education: [{ degree, institution, year }],
    certifications: [{ name, issuer, year }]
  }
}
```

#### **Job Collection**
```javascript
{
  _id: ObjectId,
  providerId: ObjectId (ref: User),
  title: String,
  description: String,
  requiredSkills: [String],
  minExperience: Number,
  salary: { min: Number, max: Number },
  location: String,
  jobType: "full-time" | "contract",
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### **Application Collection**
```javascript
{
  _id: ObjectId,
  jobId: ObjectId (ref: Job),
  seekerId: ObjectId (ref: User),
  providerId: ObjectId (ref: User),
  status: "pending" | "accepted" | "rejected",
  appliedAt: DateTime,
  reviewedAt: DateTime,
  notes: String
}
```

#### **Learning Plan Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  jobId: ObjectId (ref: Job),
  roadmapTitle: String,
  totalHours: Number,
  progress: Number (0-100),
  modules: [{
    moduleName: String,
    duration: Number,
    completed: Boolean,
    resources: {
      youtube: [String],
      github: [String],
      documentation: [String]
    }
  }],
  createdAt: DateTime
}
```

### **Middleware Stack**

| Middleware | Purpose |
|-----------|---------|
| `cors()` | Enable cross-origin requests from frontend |
| `express.json()` | Parse JSON request bodies |
| `helmet()` | Set security HTTP headers |
| `morgan()` | Log all HTTP requests |
| `rateLimiter` | Throttle API calls per IP/user (Redis) |
| `authMiddleware` | Verify JWT token on protected routes |
| `roleCheck` | Verify user role permissions |
| `errorHandler` | Catch and format errors globally |

---

## 🔗 API Integration Points

### **FastAPI AI Service Integration**

**Resume Analysis Endpoint:**
```javascript
// Backend Controller
POST http://localhost:8000/api/analyze-resume
{
  resumeText: String,
  fileFormat: "pdf" | "text"
}
// Response:
{
  skills: [{ name, confidence }],
  experience: [...],
  certifications: [...]
}
```

**Job Matching Endpoint:**
```javascript
POST http://localhost:8000/api/match-jobs
{
  userSkills: [String],
  jobs: [{ id, title, requiredSkills }]
}
// Response:
{
  matches: [{ jobId, matchScore, missingSkills }]
}
```

**Roadmap Generation Endpoint:**
```javascript
POST http://localhost:8000/api/generate-roadmap
{
  currentSkills: [String],
  targetSkills: [String],
  jobTitle: String
}
// Response:
{
  modules: [...],
  totalHours: Number,
  resources: {...}
}
```

---

## 🧪 Testing & Debugging

### **Local Testing with cURL**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Browse jobs
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer <your_jwt_token>"

# Upload resume
curl -X POST http://localhost:5000/api/seeker/resume/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "resume=@resume.pdf"
```

### **Environment Debugging**
```bash
# Check if MongoDB is connected
npm run test:db

# Check if Redis is working
npm run test:redis

# Check if FastAPI is reachable
npm run test:ai-service
```

---

## 📦 Dependencies

**Core:**
- `express` (4.x) - Web framework
- `mongoose` (7.x) - MongoDB ODM
- `redis` (4.x) - Caching & sessions
- `jsonwebtoken` (9.x) - JWT tokens
- `bcryptjs` (2.x) - Password hashing

**File Upload:**
- `multer` (1.x) - Middleware for file uploads

**Validation:**
- `joi` (17.x) - Schema validation
- `validator` (13.x) - String validation

**Utilities:**
- `axios` (1.x) - HTTP client for AI Service calls
- `cors` (2.x) - Cross-origin handling
- `dotenv` (16.x) - Environment variables
- `helmet` (7.x) - Security headers
- `morgan` (1.x) - HTTP request logging

---

## 🚀 Deployment

### **Deploy to Render**

1. **Create Render Account:** https://render.com
2. **Connect GitHub Repo:** Dashboard → New Web Service
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (MONGO_URI, REDIS_URL, JWT_SECRET)
4. **Deploy:** Render auto-deploys on git push

### **Environment Variables for Production**
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillbridge
REDIS_URL=redis://:password@redis-host:6379
JWT_SECRET=<very_long_random_secret>
FASTAPI_URL=https://your-fastapi-service.com
CLIENT_URL_PROD=https://skillbridge-ai-web.vercel.app
```

---

## 📝 Scripts

```json
{
  "start": "node main.js",
  "dev": "nodemon main.js",
  "test": "jest",
  "test:db": "node scripts/testDB.js",
  "test:redis": "node scripts/testRedis.js",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check MONGO_URI, ensure MongoDB service is running |
| Redis connection fails | Verify REDIS_URL, check Redis service status |
| FastAPI calls timeout | Ensure AI Service is running on port 8000 |
| JWT verification fails | Check JWT_SECRET matches frontend setup |
| CORS errors | Verify CLIENT_URL_DEV matches frontend port (5173) |
| File upload fails | Check UPLOAD_DIR permissions, MAX_FILE_SIZE setting |

---

## 📚 Related Repositories

- **[Frontend](https://github.com/Rahul-8283/skillbridge-ai-frontend)** - React UI for job seekers & recruiters
- **[AI Service](https://github.com/djivites/skillbridge-ai-service)** - Python FastAPI for resume analysis & matching

---
