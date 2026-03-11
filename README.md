# 🎓 LearnHub — Production-Ready LMS

A modern Learning Management System built with Django REST API + React (Vite).

## 🏗 Architecture

```
learnhub-lms/
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── courses/           # Courses, Lessons, Categories, Reviews, Wishlist, Notifications
│   │   ├── progress/          # Lesson progress, Learning streaks, Certificates
│   │   ├── quiz/              # Quizzes, Questions, Attempts
│   │   └── users/             # Auth, Profiles, Instructor system
│   └── learnhub/              # Django settings & URL routing
└── frontend/                  # React + Vite
    └── src/
        ├── components/        # Navbar, CourseCard, SkeletonLoader, StarRating
        ├── context/           # AuthContext (JWT)
        ├── pages/             # All 14 pages
        └── services/          # API service layer
```

## ✨ Features Implemented

### 🎬 Course Experience
- HD video lessons with YouTube embed
- **Resume from last position** (saves every lesson watch position)
- **Sequential lesson locking** (unlock only after completing previous)
- Mark lesson complete / incomplete
- Course progress bar (percentage + count)
- Previous / Next lesson navigation
- **Confetti celebration** on course completion

### 📊 Student Dashboard
- 6-stat grid: Enrolled, In Progress, Completed, Streak, Watch Time, Lessons Done
- **Continue Learning** card with resume button
- **Learning Streak** tracker with fire emoji + milestones
- Recently Watched lessons list
- Tab-filtered course list (All / In Progress / Completed)

### 🔍 Course Discovery
- Hero with animated gradient text + search
- Category grid with icons and colors
- Featured courses section
- **Trending courses** with rank badges (#1, #2, #3)
- Popular / Top Rated sort options
- Debounced search with URL params

### 📖 Course Detail Page
- Sticky enrollment sidebar with course meta
- "What You'll Learn" checklist
- Requirements list
- **Expandable curriculum** with duration, free preview badges, lock indicators
- **Instructor profile card** with bio, social links
- **Rating breakdown** bar chart (5★ → 1★)
- Review list with avatars and timestamps
- Write review form with star picker (enrolled students only)

### 📝 Quiz System
- Multiple choice questions with lettered options
- Auto-grading with score percentage
- Pass/fail feedback with correct count
- Retry functionality
- Quiz history (last attempt shown)

### 🏆 Certificates
- Auto-generated on course completion
- Unique certificate ID
- Beautiful styled certificate card with decorative borders
- Print to PDF support
- Certificate badge in learn page top bar

### 🎨 UI/UX
- **Dark theme**: Deep midnight palette (#05050e background)
- **Fonts**: Sora (display) + Plus Jakarta Sans (body) + JetBrains Mono
- **Skeleton loaders** for all data-loading states
- Smooth CSS animations (fade-in, slide-up, stagger)
- Confetti burst on completion
- Glassmorphism navbar with scroll shadow
- Hover zoom on course thumbnails
- Responsive grid layouts

### 🔔 Notifications
- Bell icon with unread badge counter
- Dropdown with notification feed
- Auto-mark-read on open
- Types: enrollment, completion, certificate, quiz_passed, streak milestones, system

### 👤 Platform Features
- **Wishlist**: Heart button on course cards, full wishlist page
- **Bookmarks**: Bookmark any lesson, view all bookmarks
- **Profile Settings**: Edit name, bio, avatar URL, social links
- **Instructor Dashboard**: Stats, course table, student list modal, course creation form

### 🏫 Instructor System
- Instructor dashboard with stats (courses, students, avg rating)
- Course creation form
- Student enrollment viewer
- Per-course analytics (enrollment count, avg rating)

## 🚀 Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Edit with your DB credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

### Firebase ulash (ixtiyoriy, lekin tayyor)
1. Firebase Console'da yangi project yarating va Web App qo‘shing.
2. `frontend/.env` fayliga quyidagilarni kiriting:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Izoh: loyiha hozir ham Django JWT auth bilan ishlaydi. Firebase config to‘ldirilsa `frontend/src/services/firebase.js` orqali Firebase xizmatlari (Auth/Firestore/Storage/Analytics) ham ishga tushadi.

## 🔑 API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/users/register/` | Register |
| `POST /api/users/login/` | Login (returns JWT) |
| `GET /api/courses/` | List courses (filter: level, category, search, trending, popular) |
| `GET /api/courses/:slug/` | Course detail with lessons, reviews |
| `POST /api/courses/:slug/enroll/` | Enroll in course |
| `POST /api/progress/lessons/:id/complete/` | Mark lesson complete |
| `POST /api/progress/lessons/:id/position/` | Save video position |
| `GET /api/progress/dashboard/` | Dashboard stats + streak |
| `GET /api/progress/certificates/:slug/` | Get certificate |
| `POST /api/courses/:slug/wishlist/` | Add to wishlist |
| `POST /api/courses/lessons/:id/bookmark/` | Bookmark lesson |
| `GET /api/courses/notifications/` | Notifications |
| `GET /api/courses/instructor/dashboard/` | Instructor stats |
| `GET /api/quiz/lessons/:id/` | Get quiz for lesson |
| `POST /api/quiz/lessons/:id/submit/` | Submit quiz answers |

## 🗂 New Models

- **Wishlist**: user + course
- **Notification**: enrollment/completion/streak milestones
- **LearningStreak**: current streak, longest, total days, watch minutes
- **Certificate**: unique ID, auto-generated on completion
- Enhanced **LessonProgress**: last_position_seconds, watch_time_seconds
- Enhanced **Course**: what_you_learn, requirements, total_duration_minutes
- Enhanced **User**: avatar_url, website, twitter, linkedin, location
