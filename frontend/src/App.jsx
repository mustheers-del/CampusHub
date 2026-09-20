import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Registrations from './pages/Registrations';
import MyRegistrations from './pages/MyRegistrations';
import StudentManagement from './pages/StudentManagement';
import StudentProfile from './pages/StudentProfile';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <div className="main-content">
        <Navbar onToggleSidebar={toggleSidebar} />
        
        <main className="page-container">
          <Routes>
            {/* Dashboard (Admin or Student) */}
            <Route path="/" element={<Dashboard />} />

            {/* Events Browsing & Details */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />

            {/* Admin Only Routes */}
            <Route 
              path="/registrations" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Registrations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/students" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StudentManagement />
                </ProtectedRoute>
              } 
            />

            {/* Student Only Routes */}
            <Route 
              path="/my-registrations" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyRegistrations />
                </ProtectedRoute>
              } 
            />

            {/* Profile Route */}
            <Route path="/profile" element={<StudentProfile />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Portal Routes */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
