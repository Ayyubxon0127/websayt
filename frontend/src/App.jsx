import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LearnPage from './pages/LearnPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CertificatePage from './pages/CertificatePage';
import InstructorDashboard from './pages/InstructorDashboard';
import ProfileSettings from './pages/ProfileSettings';
import Wishlist from './pages/Wishlist';
import Bookmarks from './pages/Bookmarks';
import AdminPanel from './pages/AdminPanel';
import InstructorProfile from './pages/InstructorProfile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/learn/:slug" element={<LearnPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/certificate/:slug" element={<CertificatePage />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/instructors/:username" element={<InstructorProfile />} />
            <Route path="*" element={
              <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 64 }}>🚫</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>404 — Page Not Found</h1>
                <a href="/" style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>← Back to Home</a>
              </div>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
