import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './pages/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup.tsx';
import { Dashboard } from './pages/Dashboard';
import { Analysis } from './pages/Analysis';
import { WorkspaceProvider } from './components/workspace/WorkspaceProvider';
import { AuthProvider } from './providers/auth/AuthProvider';
// import { useAuth } from './hooks/useAuth';
import { MainContent } from './components/layout/MainContent';
import { SpeedInsights } from '@vercel/speed-insights/react';

// 🔹 Main Layout without FloatingNav
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

// 🔹 Main App with Routing
const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <SpeedInsights />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/analysis" element={<MainLayout><Analysis /></MainLayout>} />
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;
