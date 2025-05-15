import { BrowserRouter, Routes as RouterRoutes, Route, useParams, Outlet } from 'react-router-dom';
import { Layout } from '@/components/layout';
import Login from '@/pages/Login';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Workspaces } from '@/pages/Workspaces';
import { Tools } from '@/pages/Tools';
import { Help } from '@/pages/Help';
import { NotFound } from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import { Analysis } from '@/pages/Analysis';

// Components
import { NewAnalysis } from '@/components/analysis/NewAnalysis';
import { AnalysisDashboard } from '@/components/analysis/AnalysisDashboard';
import { ComprehensiveReport } from '@/components/reports/ComprehensiveReport';
import { AutoSummaryView } from '@/components/analysis/AutoSummaryView';
import { ScenarioSimulation } from '@/components/analysis/ScenarioSimulation';
import { CustomModelView } from '@/components/analysis/CustomModelView';
import { IntegrationsPanel } from '@/components/integrations/IntegrationsPanel';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SettingsView } from '@/components/settings/SettingsView';
import { WorkspaceView } from '@/components/workspace/WorkspaceView';
import { SharedWorkspaces } from '@/components/workspace/SharedWorkspaces';
import { WorkspaceTemplates } from '@/components/workspace/WorkspaceTemplates';
import { BusinessMetrics } from '@/components/Business/BusinessMetrics';

// Custom wrapper component for CustomModelView
function CustomModelViewWrapper() {
  const { id } = useParams<{ id: string }>();
  return <CustomModelView workspaceId={id} />;
}

export function Routes() {
  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Main Routes */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Profile Route */}
          <Route path="/profile" element={<Profile />} />
          
          {/* Analysis Section */}
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/analysis/new" element={<NewAnalysis />} />
          <Route path="/analysis/results" element={<AnalysisDashboard />} />
          <Route path="/analysis/reports" element={<ComprehensiveReport />} />
          <Route path="/analysis/insights" element={<AutoSummaryView />} />
          <Route path="/analysis/simulations" element={<ScenarioSimulation data={{ fields: [] }} config={{ iterations: 1000, timeHorizon: 12, confidenceLevel: 0.95 }} />} />

          {/* Workspace Section */}
          <Route path="/workspaces">
            <Route index element={<Workspaces />} />
            <Route path="shared" element={<SharedWorkspaces />} />
            <Route path="templates" element={<WorkspaceTemplates />} />
            <Route path=":id" element={<WorkspaceView />} />
          </Route>

          {/* Tools Section */}
          <Route path="/tools">
            <Route index element={<Tools />} />
            <Route path="models" element={<CustomModelViewWrapper />} />
            <Route path="integrations" element={<IntegrationsPanel />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="metrics" element={<BusinessMetrics data={{ fields: [] }} results={null} />} />
          </Route>

          {/* Settings & Help */}
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/help" element={<Help />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </BrowserRouter>
  );
}