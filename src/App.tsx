import { useMemo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { JobSearch } from './components/JobSearch/JobSearch';
import { Statistics } from './components/Statistics/Statistics';
import { Login } from './components/Auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApplications } from './hooks/useApplications';
import './App.css';

// Skyddar sidor som kräver inloggning: visar laddning, skickar utloggade till /login,
// och annars sidans innehåll.
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Laddar…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Inloggningssidan: redan inloggade skickas vidare till startsidan i stället.
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Laddar…</div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

// Själva appinnehållet: hämtar ansökningsdatan och definierar alla sidor (routes).
function AppContent() {
  // Hämtar ansökningarna och alla funktioner för att ändra dem från en gemensam hook.
  const {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    moveApplication,
    getApplicationsByStatus,
  } = useApplications();

  // Bygger en mängd av redan sparade annons-id:n så jobbsöket kan visa "Sparad".
  // useMemo räknar bara om detta när listan med ansökningar ändras.
  const savedJobIds = useMemo(
    () => new Set(applications.filter((a) => a.sourceId).map((a) => a.sourceId!)),
    [applications]
  );

  return (
    <Routes>
      <Route path="login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Startsidan (/) = Kanban-tavlan. Datan och funktionerna skickas ner som props. */}
        <Route
          index
          element={
            <KanbanBoard
              applications={applications}
              getByStatus={getApplicationsByStatus}
              onAdd={addApplication}
              onUpdate={updateApplication}
              onDelete={deleteApplication}
              onMove={moveApplication}
            />
          }
        />
        {/* /search = jobbsökningen. onSaveJob sparar en annons som en ny ansökan. */}
        <Route
          path="search"
          element={
            <JobSearch onSaveJob={addApplication} savedJobIds={savedJobIds} />
          }
        />
        {/* /statistics = statistiksidan, som räknar på samma applications-data. */}
        <Route
          path="statistics"
          element={<Statistics applications={applications} />}
        />
      </Route>
    </Routes>
  );
}

// Rot-komponenten: slår in allt i routern (URL-hantering) och inloggningskontexten.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
