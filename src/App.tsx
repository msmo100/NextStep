import { useMemo, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApplications } from './hooks/useApplications';
import './App.css';

// De här tre sidorna är tunga och laddas först när de behövs, så appen öppnas snabbare.
// (Statistiksidan drar t.ex. in ett stort diagram-bibliotek.)
const KanbanBoard = lazy(() =>
  import('./components/Kanban/KanbanBoard').then((m) => ({ default: m.KanbanBoard }))
);
const JobSearch = lazy(() =>
  import('./components/JobSearch/JobSearch').then((m) => ({ default: m.JobSearch }))
);
const Statistics = lazy(() =>
  import('./components/Statistics/Statistics').then((m) => ({ default: m.Statistics }))
);

// Vakt runt sidor som kräver inloggning: utloggade skickas till inloggningssidan.
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Laddar…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Inloggningssidan. Är man redan inloggad skickas man till startsidan.
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Laddar…</div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

// Appinnehållet: hämtar ansökningarna och kopplar adresser till sidor.
function AppContent() {
  // Hämtar ansökningarna och funktionerna för att ändra dem, från ett gemensamt ställe.
  const {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    moveApplication,
    getApplicationsByStatus,
  } = useApplications();

  // Id:n för redan sparade annonser, så jobbsöket kan visa "Sparad". Räknas bara om när ansökningarna ändras.
  const savedJobIds = useMemo(
    () => new Set(applications.filter((a) => a.sourceId).map((a) => a.sourceId!)),
    [applications]
  );

  return (
    // Laddningstext medan en tung sida hämtas i bakgrunden.
    <Suspense fallback={<div className="app-loading">Laddar…</div>}>
      <Routes>
        <Route path="login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Startsidan (/) = Kanban-tavlan, med datan och funktionerna skickade till sig. */}
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
        {/* /statistics = statistiksidan, som räknar på samma ansökningar. */}
        <Route
          path="statistics"
          element={<Statistics applications={applications} />}
        />
        </Route>
      </Routes>
    </Suspense>
  );
}

// Yttersta komponenten: slår in appen i adresshantering och inloggningsinfo.
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
