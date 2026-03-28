# SkillBridge AI - Complete Backend Implementation Guide

## 📍 System Architecture

```
Frontend (React + Vite)
    ↓ (HTTP Requests)
Node.js Backend (Express) ← Main API Server
    ├─ Database (MongoDB)
    ├─ Cache (Redis)
    ├─ Auth (JWT)
    └─ Calls FastAPI → 
        FastAPI Backend (Python)
        ├─ LLM Processing (Skill Extraction)
        └─ AI Features (Learning Plan Generation)
```

---

## 🎯 Node.js Backend (Server.js & Express) - What To Do

### 1. Core Server Setup

**File: `server.js`**

```javascript
// Basic structure needed:
1. Import all dependencies (express, cors, dotenv, etc.)
2. Load environment variables (.env file)
3. Initialize Express app
4. Setup CORS middleware (allow frontend URL)
5. Setup body parser middleware
6. Connect to MongoDB
7. Connect to Redis
8. Setup request logging (morgan)
9. Setup error handling middleware
10. Register all API routes
11. Start listening on PORT
```

### 2. Environment Configuration

**File: `.env`**

```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/skillbridge

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379

# FastAPI Integration
FASTAPI_URL=http://localhost:8000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

### 3. Database Models (MongoDB Schemas)

**Files needed:**
- `models/User.js` - User schema (seeker & provider)
- `models/Job.js` - Job posting schema
- `models/Application.js` - Job application schema
- `models/Resume.js` - Resume file metadata
- `models/LearningPlan.js` - Learning plan schema
- `models/Activity.js` - Learning activity logs
- `models/Achievement.js` - User achievements/badges

**Example User schema fields:**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed with bcrypt),
  name: String,
  role: "seeker" || "provider",
  profile: {
    bio: String,
    skills: [String],
    experience: String,
    preferences: Object,
    profilePictureUrl: String
  },
  resumeIds: [ObjectId],
  applications: [ObjectId],
  learningPlans: [ObjectId],
  achievements: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Route Structure

**Create these route files:**

1. **`routes/auth.js`** - Authentication routes
   - POST `/api/auth/login`
   - POST `/api/auth/signup`
   - POST `/api/auth/refresh-token`
   - POST `/api/auth/logout`

2. **`routes/users.js`** - User management routes
   - GET `/api/user/profile/{userId}`
   - PUT `/api/user/profile/{userId}`
   - PUT `/api/user/profile` (authenticated)

3. **`routes/resumes.js`** - Resume routes
   - POST `/api/resume/upload`
   - GET `/api/resume/{resumeId}`
   - GET `/api/user/{userId}/resumes`
   - DELETE `/api/resume/{resumeId}`
   - POST `/api/resume/extract-skills` (calls FastAPI)

4. **`routes/jobs.js`** - Job routes
   - GET `/api/jobs`
   - POST `/api/jobs/post`
   - GET `/api/jobs/{jobId}`
   - PUT `/api/jobs/{jobId}`
   - DELETE `/api/jobs/{jobId}`
   - GET `/api/jobs/matches/{userId}` (calls FastAPI for matching)
   - GET `/api/jobs/provider/{providerId}`
   - POST `/api/jobs/{jobId}/apply`
   - GET `/api/user/{userId}/applications`
   - GET `/api/jobs/{jobId}/skill-gap/{userId}`

5. **`routes/learning.js`** - Learning routes
   - POST `/api/learning-plan/generate` (calls FastAPI)
   - GET `/api/user/{userId}/learning-plans`
   - GET `/api/learning-plan/{planId}`
   - PUT `/api/learning-plan/{planId}`
   - DELETE `/api/learning-plan/{planId}`
   - POST `/api/learning-activity/log`
   - GET `/api/user/{userId}/activities`
   - GET `/api/user/{userId}/achievements`
   - GET `/api/user/{userId}/progress`

### 5. Middleware Stack

**Create: `middleware/auth.js`**

```javascript
// Middleware functions needed:
1. verifyToken() - Check JWT validity
2. verifyRefreshToken() - Check refresh token
3. requireAuth() - Route protection (user must be logged in)
4. requireRole(role) - Role-based access (seeker/provider)
5. handleErrors() - Global error handler
6. requestLogger() - Log all requests
```

### 6. Authentication System

**File: `services/authService.js`**

```javascript
// Functions needed:
1. hashPassword(password) - Hash password with bcryptjs
2. comparePassword(password, hash) - Verify password
3. generateJWT(userId, role) - Create JWT token
4. generateRefreshToken(userId) - Create refresh token
5. verifyJWT(token) - Validate JWT
6. storeRefreshTokenInRedis(userId, refreshToken) - Redis storage
7. revokeToken(token) - Logout (remove from Redis)
```

### 7. File Upload Handling

**File: `services/uploadService.js`**

```javascript
// Functions needed:
1. configureMulter() - Setup multer middleware
2. uploadResume(file, userId) - Save file to disk/S3
3. deleteResume(fileId) - Remove file
4. getFileUrl(fileId) - Return accessible URL
5. validateFileSize(file) - Check file size limits
6. validateFileType(file) - Check MIME type (PDF only)
```

### 8. Caching with Redis

**File: `services/cacheService.js`**

```javascript
// Functions needed:
1. cacheUserData(userId, userData, ttl) - Store in Redis
2. getCachedUserData(userId) - Retrieve from Redis
3. invalidateUserCache(userId) - Clear cache
4. cacheJobMatches(jobMatches, ttl) - Cache search results
5. cacheRefreshToken(userId, token, ttl) - Store refresh tokens
```

---

## 🔗 FastAPI Backend -  What To Do

### Integration Points

FastAPI backend handles **AI-heavy processing** that Node.js cannot do efficiently:

### 1. Skill Extraction from Resume

**Endpoint: POST /extract-skills**

```python
# Node.js calls this when:
# 1. User uploads resume
# 2. Manually requests skill extraction

# FastAPI receives: Resume file (PDF)
# FastAPI does: 
#   - Parse PDF to text
#   - Use LLM (GPT-4, Claude, etc.) to extract skills
#   - Return structured skill list

# FastAPI returns: 
{
  "skills": ["Python", "React", "AWS", "SQL"],
  "proficiency": ["Advanced", "Intermediate", "Intermediate", "Beginner"]
}

# Node.js then:
# 1. Stores skills in Resume model
# 2. Updates User model with extracted skills
```

### 2. Job Matching Algorithm

**Endpoint: POST /match-jobs**

```python
# Node.js calls this when:
# 1. User visits "Matched Jobs" page
# 2. Fetches personalized job recommendations

# FastAPI receives:
{
  "userId": "user123",
  "userSkills": ["Python", "React", "AWS"],
  "experience": "intermediate",
  "filters": { "minMatch": 70 }
}

# FastAPI does:
#   - Use ML algorithm to calculate similarity scores
#   - Consider: skill match, experience level, location preference
#   - Rank jobs by match percentage
#   - Return top N matches with scores

# FastAPI returns:
{
  "matches": [
    {
      "jobId": "job1",
      "score": 95,
      "matchedSkills": ["Python", "React"],
      "missingSkills": ["AWS"]
    },
    ...
  ]
}

# Node.js then:
# 1. Stores scores in cache (Redis)
# 2. Enrich with job details from MongoDB
# 3. Return to frontend with match percentages
```

### 3. Learning Plan Generation

**Endpoint: POST /generate-learning-plan**

```python
# Node.js calls this when:
# 1. User navigates to "Generate Learning Plan"
# 2. User wants personalized skill development path

# FastAPI receives:
{
  "userId": "user123",
  "currentSkills": ["JavaScript", "React"],
  "targetSkills": ["TypeScript", "AWS", "Docker"],
  "experience": "intermediate",
  "hoursPerWeek": 10,
  "preferredLearningStyle": "video-based"  # optional
}

# FastAPI does:
#   - Use LLM to create structured learning path
#   - Generate: modules, resources, timeline, milestones
#   - Consider: learning style, time availability, skill gaps
#   - Suggest: courses (Udemy, Coursera), projects, practice problems

# FastAPI returns:
{
  "plan": {
    "title": "AWS & DevOps Mastery Path",
    "duration": "12 weeks",
    "modules": [
      {
        "week": 1,
        "title": "Docker Basics",
        "topics": ["Containers", "Images", "Compose"],
        "resources": [
          {
            "type": "video",
            "title": "Docker Tutorial",
            "url": "...",
            "duration": "4 hours"
          }
        ],
        "project": "Create Docker image for Node.js app"
      },
      ...
    ],
    "milestones": [
      { "week": 3, "achievement": "First Docker container deployed" },
      { "week": 8, "achievement": "Multi-container setup complete" }
    ]
  }
}

# Node.js then:
# 1. Stores plan in LearningPlan model
# 2. Creates Activity records for tracking
# 3. Returns plan to frontend for display
```

### 4. Skill Gap Analysis

**Endpoint: POST /analyze-skill-gap**

```python
# Node.js calls this when:
# 1. User views job details
# 2. Shows what skills user is missing

# FastAPI receives:
{
  "jobId": "job123",
  "userSkills": ["Python", "React"],
  "requiredSkills": ["Python", "React", "AWS", "Docker"]
}

# FastAPI does:
#   - Compare user skills vs job requirements
#   - Identify gaps
#   - Suggest learning resources for missing skills
#   - Calculate recommendations

# FastAPI returns:
{
  "gap": {
    "presentSkills": ["Python", "React"],
    "missingSkills": ["AWS", "Docker"],
    "recommendations": [
      {
        "skill": "AWS",
        "importance": "High",
        "resources": [
          { "type": "course", "name": "AWS Fundamentals", "url": "..." }
        ],
        "estimatedTime": "30 hours"
      }
    ]
  }
}

# Node.js then:
# 1. Caches result in Redis
# 2. Returns to frontend with recommendations
```

---

## 🔄 Complete API Flow Examples

### Example 1: Resume Upload Flow

```
1. FRONTEND
   └─ User selects resume PDF → POST /api/resume/upload (with file)

2. NODE.JS BACKEND
   ├─ Validate file (PDF, < 10MB)
   ├─ Save file to uploads/ or S3
   ├─ Create Resume document in MongoDB
   └─ Call FastAPI → POST /extract-skills

3. FASTAPI BACKEND
   ├─ Parse PDF to text
   ├─ Use LLM to extract skills
   └─ Return: { skills: ["Python", "React", ...] }

4. NODE.JS BACKEND (continue)
   ├─ Update Resume document with extracted skills
   ├─ Update User model with new skills
   ├─ Cache result in Redis
   └─ Return to frontend: { success: true, skills: [...] }

5. FRONTEND
   └─ Display: "Resume uploaded! Skills extracted: Python, React, ..."
```

### Example 2: Browse Matched Jobs Flow

```
1. FRONTEND
   └─ User clicks "Matched Jobs" → GET /api/jobs/matches/{userId}

2. NODE.JS BACKEND
   ├─ Get user skills from MongoDB
   ├─ Get all jobs from MongoDB
   └─ Call FastAPI → POST /match-jobs

3. FASTAPI BACKEND
   ├─ Run ML algorithm on all jobs
   ├─ Calculate match scores for each job
   └─ Return: { matches: [{ jobId, score, missingSkills }] }

4. NODE.JS BACKEND (continue)
   ├─ Enrich matches with full job details from MongoDB
   ├─ Cache results in Redis for 1 hour
   └─ Return to frontend: 
       {
         jobs: [
           {
             id: "job1",
             title: "Senior React Developer",
             matchScore: 92,
             missingSkills: ["TypeScript"]
           },
           ...
         ]
       }

5. FRONTEND
   └─ Display jobs sorted by match score
```

### Example 3: Generate Learning Plan Flow

```
1. FRONTEND
   └─ User submits form → POST /api/learning-plan/generate

2. NODE.JS BACKEND
   ├─ Validate user is authenticated
   ├─ Get user current skills from MongoDB
   └─ Call FastAPI → POST /generate-learning-plan

3. FASTAPI BACKEND
   ├─ Use LLM to create personalized learning path
   ├─ Generate: modules, resources, timeline
   └─ Return: Complete learning plan structure

4. NODE.JS BACKEND (continue)
   ├─ Create LearningPlan document in MongoDB
   ├─ Create Activity records for each module
   ├─ Cache plan in Redis
   └─ Return to frontend: { planId, modules, timeline }

5. FRONTEND
   ├─ Display learning plan with modules
   └─ Allow user to log activities/progress
```

---

## 🔐 Authentication Flow

### Login Process

```
1. FRONTEND (LoginPage)
   └─ POST /api/auth/login
      { email: "user@example.com", password: "password123" }

2. NODE.JS BACKEND
   ├─ Find user in MongoDB by email
   ├─ Compare password with bcryptjs
   ├─ Generate JWT token (expires 7 days)
   ├─ Generate Refresh token
   ├─ Store refresh token in Redis
   └─ Return: { user, token }

3. FRONTEND
   ├─ Store token in localStorage as "access_token"
   └─ Redirect to dashboard

4. SUBSEQUENT REQUESTS
   ├─ Frontend adds header: Authorization: Bearer {token}
   ├─ Node.js verifies JWT in middleware
   └─ If valid → proceed, if invalid → 401 error
```

### Token Refresh Flow (using Redis)

```
1. Frontend makes API call with expired token
   ├─ Node.js detects: JWT expired (error 401)
   └─ Return: { error: "Token expired" }

2. Frontend sends refresh token to backend
   └─ POST /api/auth/refresh-token
      { refreshToken: "..." }

3. Node.js Backend
   ├─ Validate refresh token exists in Redis
   ├─ Check if not revoked
   ├─ Generate new JWT token
   ├─ Update refresh token in Redis
   └─ Return: { newToken }

4. Frontend
   ├─ Update localStorage with new token
   └─ Retry original API call

5. Logout Flow
   ├─ POST /api/auth/logout
   ├─ Node.js deletes refresh token from Redis
   ├─ Frontend clears localStorage
   └─ User redirected to login
```

---

## 📦 Database Schema Overview

### Collections in MongoDB

#### 1. users
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  role: "seeker" | "provider",
  profile: {
    bio: String,
    skills: [String],
    experience: String,
    profilePicture: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. jobs
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  requiredSkills: [String],
  salary: String,
  location: String,
  providerId: ObjectId (ref: users),
  status: "open" | "closed",
  applicantCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. applications
```javascript
{
  _id: ObjectId,
  jobId: ObjectId (ref: jobs),
  userId: ObjectId (ref: users),
  coverLetter: String,
  status: "pending" | "accepted" | "rejected",
  appliedAt: Date,
  updatedAt: Date
}
```

#### 4. resumes
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  filename: String,
  fileUrl: String,
  extractedSkills: [String],
  uploadedAt: Date
}
```

#### 5. learningPlans
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  title: String,
  targetSkills: [String],
  modules: [Object],
  timeline: String,
  status: "active" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. activities
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  type: "course" | "practice" | "project" | "reading",
  skill: String,
  duration: Number (minutes),
  description: String,
  earnedPoints: Number,
  learningPlanId: ObjectId (optional),
  loggedAt: Date
}
```

#### 7. achievements
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  badge: String,
  title: String,
  description: String,
  icon: String,
  earnedAt: Date
}
```

---

## ⚙️ Middleware & Utility Functions

### Required Middleware

1. **CORS** - Allow frontend requests
2. **Body Parser** - Parse JSON requests
3. **Request Logger** - Log all requests (morgan)
4. **Authentication** - Verify JWT
5. **Error Handler** - Catch all errors
6. **Rate Limiter** - Prevent abuse (optional)

### Required Utilities

1. **Response formatter** - Standardize API responses
2. **Error handler** - Consistent error messages
3. **Validators** - Validate user inputs (Joi)
4. **File uploader** - Handle file uploads
5. **Cache manager** - Redis operations
6. **Mail sender** - Send emails (optional)

---

## 🚀 Implementation Checklist

### Phase 1: Setup
- [ ] Install all npm packages
- [ ] Create `.env` file
- [ ] Connect to MongoDB
- [ ] Connect to Redis
- [ ] Setup Express server
- [ ] Setup CORS middleware

### Phase 2: Authentication
- [ ] Create User model
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT generation
- [ ] Implement token refresh with Redis
- [ ] Implement logout

### Phase 3: User Management
- [ ] Create GET /api/user/profile/{userId}
- [ ] Create PUT /api/user/profile/{userId}
- [ ] Create profile update functionality

### Phase 4: File Upload & Resume
- [ ] Setup Multer for file uploads
- [ ] Create POST /api/resume/upload
- [ ] Create DELETE /api/resume/{resumeId}
- [ ] Create GET /api/user/{userId}/resumes
- [ ] Integrate with FastAPI skill extraction

### Phase 5: Jobs
- [ ] Create Job model
- [ ] Create POST /api/jobs/post
- [ ] Create GET /api/jobs
- [ ] Create GET /api/jobs/{jobId}
- [ ] Create PUT /api/jobs/{jobId}
- [ ] Create DELETE /api/jobs/{jobId}
- [ ] Create GET /api/jobs/matches/{userId} (integrate FastAPI)

### Phase 6: Applications
- [ ] Create Application model
- [ ] Create POST /api/jobs/{jobId}/apply
- [ ] Create GET /api/user/{userId}/applications
- [ ] Create GET /api/jobs/{jobId}/skill-gap/{userId}

### Phase 7: Learning
- [ ] Create LearningPlan model
- [ ] Create Activity model
- [ ] Create POST /api/learning-plan/generate (FastAPI)
- [ ] Create GET /api/user/{userId}/learning-plans
- [ ] Create POST /api/learning-activity/log
- [ ] Create GET /api/user/{userId}/progress

### Phase 8: Testing & Deployment
- [ ] Test all endpoints with Postman
- [ ] Test with frontend
- [ ] Setup error handling
- [ ] Deploy to production

---

## 🔗 Integration Summary

### When Node.js Calls FastAPI

| Scenario | Node.js Endpoint | FastAPI Endpoint | FastAPI Returns |
|----------|------------------|------------------|-----------------|
| Upload Resume | POST /resume/upload | POST /extract-skills | skills: [] |
| View Matched Jobs | GET /jobs/matches/{userId} | POST /match-jobs | matches with scores |
| Generate Plan | POST /learning-plan/generate | POST /generate-learning-plan | plan modules |
| Job Details | GET /jobs/{jobId} | POST /analyze-skill-gap | missing skills |

---

**Next Steps:**
1. Setup server.js with Express
2. Connect to MongoDB & Redis
3. Create middleware
4. Implement authentication
5. Create models
6. Implement routes
7. Test with frontend
8. Deploy!

Good luck! 🚀
