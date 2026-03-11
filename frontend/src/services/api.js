import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/users/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return api(orig);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authService = {
  register:      (d) => api.post('/users/register/', d),
  login:         (d) => api.post('/users/login/', d),
  me:            ()  => api.get('/users/me/'),
  updateProfile: (d) => api.patch('/users/profile/', d),
  uploadAvatar:  (f) => api.patch('/users/profile/', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const courseService = {
  list:          (p) => api.get('/courses/', { params: p }),
  detail:        (s) => api.get(`/courses/${s}/`),
  categories:    ()  => api.get('/courses/categories/'),
  enroll:        (s) => api.post(`/courses/${s}/enroll/`),
  unenroll:      (s) => api.delete(`/courses/${s}/unenroll/`),
  myEnrollments: ()  => api.get('/courses/my/enrollments/'),
  lessons:       (s) => api.get(`/courses/${s}/lessons/`),
  modules:       (s) => api.get(`/courses/${s}/modules/`),
  create:        (d) => api.post('/courses/create/', d),
  update:        (s, d) => api.patch(`/courses/${s}/`, d),
  delete:        (s) => api.delete(`/courses/${s}/`),
  createModule:  (d) => api.post('/courses/modules/create/', d),
  updateModule:  (id, d) => api.patch(`/courses/modules/${id}/`, d),
  deleteModule:  (id) => api.delete(`/courses/modules/${id}/`),
  createLesson:  (d) => api.post('/courses/lessons/create/', d),
  updateLesson:  (id, d) => api.patch(`/courses/lessons/${id}/`, d),
  deleteLesson:  (id) => api.delete(`/courses/lessons/${id}/`),
  featured:      ()  => api.get('/courses/', { params: { is_featured: true } }),
  trending:      ()  => api.get('/courses/', { params: { trending: true } }),
  popular:       ()  => api.get('/courses/', { params: { popular: true } }),
  topRated:      ()  => api.get('/courses/', { params: { top_rated: true } }),
  byCategory:    (s) => api.get('/courses/', { params: { 'category__slug': s } }),
  submitForApproval: (slug) => api.post(`/courses/instructor/${slug}/submit/`),
};

export const reviewService = {
  list:   (slug) => api.get(`/courses/${slug}/reviews/`),
  create: (slug, d) => api.post(`/courses/${slug}/reviews/`, d),
  update: (id, d) => api.patch(`/courses/reviews/${id}/`, d),
  delete: (id) => api.delete(`/courses/reviews/${id}/`),
};

export const progressService = {
  markComplete:   (id)    => api.post(`/progress/lessons/${id}/complete/`),
  markIncomplete: (id)    => api.post(`/progress/lessons/${id}/incomplete/`),
  savePosition:   (id, d) => api.post(`/progress/lessons/${id}/position/`, d),
  courseProgress: (slug)  => api.get(`/progress/courses/${slug}/`),
  dashboardStats: ()      => api.get('/progress/dashboard/'),
  getCertificate: (slug)  => api.get(`/progress/certificates/${slug}/`),
};

export const bookmarkService = {
  add:    (id, note = '') => api.post(`/courses/lessons/${id}/bookmark/`, { note }),
  remove: (id)            => api.delete(`/courses/lessons/${id}/bookmark/`),
  list:   ()              => api.get('/courses/my/bookmarks/'),
};

export const wishlistService = {
  add:    (slug) => api.post(`/courses/${slug}/wishlist/`),
  remove: (slug) => api.delete(`/courses/${slug}/wishlist/`),
  list:   ()     => api.get('/courses/my/wishlist/'),
};

export const notificationService = {
  list:     () => api.get('/courses/notifications/'),
  markRead: () => api.post('/courses/notifications/read/'),
};

export const quizService = {
  get:          (id)      => api.get(`/quiz/lessons/${id}/`),
  submit:       (id, d)   => api.post(`/quiz/lessons/${id}/submit/`, d),
  create:       (d)       => api.post('/quiz/create/', d),
  addQuestion:  (id, d)   => api.post(`/quiz/${id}/questions/`, d),
  deleteQuestion: (id)    => api.delete(`/quiz/questions/${id}/`),
  myHistory:    ()        => api.get('/quiz/my/history/'),
};

export const instructorService = {
  dashboard: ()     => api.get('/courses/instructor/dashboard/'),
  students:  (slug) => api.get(`/courses/instructor/${slug}/students/`),
  profile:   (u)    => api.get(`/users/instructors/${u}/`),
};

export const adminService = {
  // Users
  getUsers:              (p)    => api.get('/users/admin/users/', { params: p }),
  updateUser:            (id, d) => api.patch(`/users/admin/users/${id}/`, d),
  // Pending instructors
  getPendingInstructors: ()     => api.get('/users/admin/pending-instructors/'),
  approveInstructor:     (id)   => api.patch(`/users/admin/users/${id}/`, { instructor_approved: true }),
  rejectInstructor:      (id)   => api.patch(`/users/admin/users/${id}/`, { role: 'student', instructor_approved: false }),
  // Analytics
  analytics:             ()     => api.get('/users/admin/analytics/'),
  // Courses
  getCourses:            (p)    => api.get('/courses/admin/courses/', { params: p }),
  approveCourse:         (id, d) => api.patch(`/courses/admin/courses/${id}/approve/`, d),
  editCourse:            (id, d) => api.patch(`/courses/admin/courses/${id}/edit/`, d),
  deleteCourse:          (slug)  => api.delete(`/courses/${slug}/`),
  // Categories
  getCategories:         ()     => api.get('/courses/admin/categories/'),
  createCategory:        (d)    => api.post('/courses/admin/categories/', d),
  updateCategory:        (id, d) => api.patch(`/courses/admin/categories/${id}/`, d),
  deleteCategory:        (id)   => api.delete(`/courses/admin/categories/${id}/`),
  // Reviews / Moderation
  getReviews:            (p)    => api.get('/courses/admin/reviews/', { params: p }),
  deleteReview:          (id)   => api.delete(`/courses/admin/reviews/${id}/`),
  flagReview:            (id)   => api.patch(`/courses/admin/reviews/${id}/flag/`),
};

export default api;
