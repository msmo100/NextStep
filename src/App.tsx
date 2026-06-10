import { useMemo, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApplications } from './hooks/useApplications';
import './App.css';

// De här tre sidorna är "tunga" och laddas först när de faktiskt behövs, i stället för
// direkt vid start. Då går appen snabbare att öppna. Statistiksidan drar t.ex. in ett stort
// diagram-bibliotek, och det hade gjort starten långsam om det laddades varje gång.
const KanbanBoard = lazy(() =>
  import('./components/Kanban/KanbanBoard').then((m) => ({ default: m.KanbanBoard }))
);
const JobSearch = lazy(() =>
  import('./components/JobSearch/JobSearch').then((m) => ({ default: m.JobSearch }))
);
const Statistics = lazy(() =>
  import('./components/Statistics/Statistics').then((m) => ({ default: m.Statistics }))
);

// Vakt runt sidor som kräver inloggning: visar "Laddar…" medan vi kollar,
// skickar den som inte är inloggad till inloggningssidan, och släpper annars in den.
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

// Själva appinnehållet: hämtar ansökningarna och bestämmer vilken adress som visar vilken sida.
function AppContent() {
  // Hämtar listan med ansökningar och alla funktioner för att ändra dem från ett gemensamt ställe.
  const {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    moveApplication,
    getApplicationsByStatus,
  } = useApplications();

  // Samlar id:n för annonser som redan är sparade, så jobbsöket kan visa "Sparad" på dem.
  // Listan räknas bara om när ansökningarna ändras, inte i onödan vid varje omritning.
  const savedJobIds = useMemo(
    () => new Set(applications.filter((a) => a.sourceId).map((a) => a.sourceId!)),
    [applications]
  );

  return (
    // Visar en laddningstext medan en av de tunga sidorna hämtas i bakgrunden.
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
        {/* Startsidan (/) = Kanban-tavlan. Den får datan och funktionerna skickade till sig. */}
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
    </Suspense>
  );
}

// Yttersta komponenten: slår in hela appen i adresshanteringen och inloggningsinfon.
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
