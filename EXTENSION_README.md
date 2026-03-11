# LearnHub LMS — Full Extension Guide

## What Was Added

### Backend Extensions

#### 1. User Role System (`apps/users/`)
- **New `role` field**: `student` | `instructor` | `admin`
- **New fields**: `is_banned`, `instructor_approved`
- **New serializer**: `UserAdminSerializer` with enrollment/course counts
- **New API endpoints**:
  - `GET /api/users/admin/users/` — list all users (admin only)
  - `PATCH /api/users/admin/users/<id>/` — change role, ban/unban
  - `GET /api/users/admin/analytics/` — platform-wide stats

#### 2. Course System (`apps/courses/`)
- **New `Module` model**: Course → Module → Lesson hierarchy
- **New `approval_status`** on Course: `draft → pending → approved/rejected`
- **New `lesson_type`** on Lesson: `video` or `text`
- **New `text_content`** field on Lesson for markdown articles
- **New API endpoints**:
  - `POST /api/courses/modules/create/` — create module
  - `GET/PATCH/DELETE /api/courses/modules/<id>/`
  - `POST /api/courses/instructor/<slug>/submit/` — submit for approval
  - `GET /api/courses/admin/courses/` — admin course list
  - `PATCH /api/courses/admin/courses/<id>/approve/` — approve/reject
  - `DELETE /api/courses/admin/reviews/<id>/` — remove review

#### 3. Quiz System (`apps/quiz/`)
- **New fields** on Quiz: `time_limit_minutes`, `max_attempts`
- **New `question_type`** on Question: `multiple` | `truefalse`
- **New `explanation`** field on Question
- **Full attempt history** returned with detailed per-question results
- **New API endpoints**:
  - `POST /api/quiz/create/` — instructor creates quiz
  - `POST /api/quiz/<id>/questions/` — add question
  - `DELETE /api/quiz/questions/<id>/` — remove question
  - `GET /api/quiz/my/history/` — student quiz history

### Migrations to Run
```bash
cd backend
python manage.py migrate users 0003_role_fields
python manage.py migrate courses 0006_module_lesson_type_approval
python manage.py migrate quiz 0002_quiz_extensions
```

### Frontend Extensions

#### New Pages
| Page | Path | Access |
|------|------|--------|
| Admin Panel | `/admin-panel` | Admin only |
| Instructor Dashboard | `/instructor` | Instructor/Admin |
| Student Dashboard | `/dashboard` | All authenticated |
| Learn Page | `/learn/:slug` | Enrolled students |

#### Admin Panel Tabs
- **Overview** — 10 KPI cards + recent enrollment activity
- **Users** — searchable table, role dropdown, ban/unban
- **Courses** — filter by status, approve/reject with notes modal
- **Analytics** — monthly signups bar chart, completion rate

#### Instructor Dashboard Tabs
- **Overview** — stats cards + quick action buttons
- **My Courses** — list with approval status badges, submit for review
- **New Course** — full creation form with auto-slug
- **Add Module** — attach to any owned course
- **Add Lesson** — video (YouTube URL) or text (markdown)
- **Add Quiz** — settings + question builder (multiple choice / T/F)
- **Students** — per-course progress table

#### Student Dashboard
- Stats grid (enrolled, in-progress, completed, streak, watch time, lessons)
- "Continue Learning" banner linking to last-accessed course
- Course cards with progress bars and certificate links
- **Quiz History** tab with scores, pass/fail, time taken

#### Learn Page
- Collapsible lesson sidebar with progress indicators
- YouTube iframe player (auto-extracts video ID from any YT URL)
- Text lesson renderer
- Mark Complete button + auto-advance
- Prev/Next navigation
- **Inline Quiz Panel** — slides in from right, full quiz flow with timer
- Course completion banner → certificate link

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Role Testing

Create admin:
```bash
python manage.py createsuperuser
# Then set role='admin' in shell or Django admin
```

Create instructor via registration form (select Instructor role).

Create student (default role).
