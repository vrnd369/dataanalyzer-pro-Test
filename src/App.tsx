import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Analysis } from './pages/Analysis';
import { Workspaces } from './pages/Workspaces';
import { Settings } from './pages/Settings';
import { VisualizationsPage } from './pages/analysis/visualizations';
import { Reports } from './pages/reports';
import { WorkspaceProvider } from './components/workspace/WorkspaceProvider';
import { AuthProvider } from './providers/auth/AuthProvider';
// import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import { SpeedInsights } from '@vercel/speed-insights/react';

// 🔹 Main App with Routing
const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={
              <MainLayout>
                <Home />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/dashboard" element={
              <MainLayout>
                <Dashboard />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/analysis" element={
              <MainLayout>
                <Analysis />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/analysis/visualizations" element={
              <MainLayout>
                <VisualizationsPage />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/analysis/reports" element={
              <MainLayout>
                <Reports />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/workspaces/*" element={
              <MainLayout>
                <Workspaces />
                <SpeedInsights />
              </MainLayout>
            } />
            <Route path="/settings" element={
              <MainLayout>
                <Settings />
                <SpeedInsights />
              </MainLayout>
            } />
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;