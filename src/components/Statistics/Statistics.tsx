import { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import type { JobApplication, ApplicationStatus } from '../../types';
import { ALL_STATUSES, STATUS_LABELS, STATUS_COLORS } from '../../types';
import { FileBarChart, Download, Target, TrendingUp, Clock, Percent } from 'lucide-react';
import { loadWeeklyGoal, saveWeeklyGoal } from '../../services/storage';
import { exportToCsv, exportToPdf, exportArbetsformedlingenReport } from '../../services/exportData';
import './Statistics.css';

// Registrerar de delar av Chart.js som behövs för cirkel-, stapel- och linjediagrammen.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// Props: alla ansökningar som statistiken ska räknas på.
interface StatisticsProps {
  applications: JobApplication[];
}

// Formaterar ett datum som YYYY-MM-DD i lokal tid (undviker tidszonsfel som toISOString kan ge).
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Statistiksidan: nyckeltal, diagram och exportfunktioner.
export function Statistics({ applications }: StatisticsProps) {
  // Veckomål och om det redigeras just nu.
  const [weeklyGoal, setWeeklyGoal] = useState(10);
  const [editingGoal, setEditingGoal] = useState(false);

  // Datumintervall för aktivitetsrapporten – från månadens första dag till idag som standard.
  const [afFromDate, setAfFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toLocalDateString(d);
  });
  const [afToDate, setAfToDate] = useState(() => toLocalDateString(new Date()));

  // Läs in det sparade veckomålet när sidan laddas.
  useEffect(() => {
    setWeeklyGoal(loadWeeklyGoal());
  }, []);

  // Räknar antal ansökningar per status (till översiktskorten och cirkeldiagrammet).
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => (counts[s] = 0));
    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  // De 8 företag man sökt flest jobb hos, mest överst (till stapeldiagrammet).
  const topCompanies = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      counts[app.company] = (counts[app.company] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [applications]);

  // Antal ansökningar per vecka över tid (till linjediagrammet).
  const timelineData = useMemo(() => {
    const byWeek: Record<string, number> = {};
    applications.forEach((app) => {
      // Avrunda varje datum till veckans måndag och räkna per sådan veckostart.
      const date = new Date(app.applicationDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const key = weekStart.toISOString().split('T')[0];
      byWeek[key] = (byWeek[key] || 0) + 1;
    });
    // Sortera kronologiskt och dela upp i etiketter (datum) och värden (antal).
    const sorted = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: sorted.map(([date]) => new Date(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })),
      values: sorted.map(([, count]) => count),
    };
  }, [applications]);

  // Svarsfrekvens: andel av de sökta jobben som gått vidare till intervju eller erbjudande.
  const responseRate = useMemo(() => {
    const applied = applications.filter(
      (a) => a.status !== 'to-apply'
    );
    if (applied.length === 0) return null;
    const progressed = applied.filter(
      (a) => a.status === 'interview' || a.status === 'offer'
    );
    return Math.round((progressed.length / applied.length) * 100);
  }, [applications]);

  // Genomsnittlig tid (i dagar) som ansökningar tillbringar i varje steg, ur statushistoriken.
  const avgTimePerStage = useMemo(() => {
    // Samla in alla uppmätta varaktigheter per status.
    const durations: Record<ApplicationStatus, number[]> = {
      'to-apply': [],
      applied: [],
      interview: [],
      rejected: [],
      offer: [],
    };

    for (const app of applications) {
      const history = app.statusHistory || [];
      if (history.length === 0) continue;

      // Utgå från när ansökan skapades och dess första status.
      let prevTime = new Date(app.createdAt).getTime();
      let prevStatus = history[0].from;

      // Gå igenom varje statusbyte och mät hur länge föregående status varade.
      for (const change of history) {
        const changeTime = new Date(change.timestamp).getTime();
        const days = (changeTime - prevTime) / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          durations[prevStatus].push(days);
        }
        prevTime = changeTime;
        prevStatus = change.to;
      }
    }

    // Räkna ut medelvärdet per status (avrundat till en decimal).
    const result: Partial<Record<ApplicationStatus, number>> = {};
    for (const status of ALL_STATUSES) {
      const vals = durations[status];
      if (vals.length > 0) {
        result[status] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      }
    }
    return result;
  }, [applications]);

  // Antal jobb man sökt den här veckan (måndag–nu) – mäts mot veckomålet.
  const weeklyProgress = useMemo(() => {
    // Räkna ut den här veckans måndag kl. 00:00.
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    // Räkna sökta jobb (ej "att söka") med ansökningsdatum från och med måndag.
    const thisWeek = applications.filter((app) => {
      const appDate = new Date(app.applicationDate);
      return appDate >= weekStart && app.status !== 'to-apply';
    });

    return thisWeek.length;
  }, [applications]);

  // Sparar ett nytt veckomål (klämt till 1–100) och stänger redigeringsläget.
  const handleGoalChange = (newGoal: number) => {
    const clamped = Math.max(1, Math.min(100, newGoal));
    setWeeklyGoal(clamped);
    saveWeeklyGoal(clamped);
    setEditingGoal(false);
  };

  // Hur stor andel av veckomålet som uppnåtts, i procent (max 100).
  const goalPercent = Math.min(100, Math.round((weeklyProgress / weeklyGoal) * 100));

  // Data för cirkeldiagrammet (fördelning per status).
  const doughnutData = {
    labels: ALL_STATUSES.map((s) => STATUS_LABELS[s]),
    datasets: [
      {
        data: ALL_STATUSES.map((s) => statusCounts[s]),
        backgroundColor: ALL_STATUSES.map((s) => STATUS_COLORS[s]),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Data för stapeldiagrammet (topp-företag).
  const barData = {
    labels: topCompanies.map(([name]) => name),
    datasets: [
      {
        label: 'Ansökningar',
        data: topCompanies.map(([, count]) => count),
        backgroundColor: 'rgba(26, 26, 26, 0.85)',
        borderRadius: 0,
      },
    ],
  };

  // Data för linjediagrammet (ansökningar över tid).
  const lineData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Ansökningar per vecka',
        data: timelineData.values,
        borderColor: '#1a1a1a',
        backgroundColor: 'rgba(26, 26, 26, 0.06)',
        fill: true,
        tension: 0,
        pointBackgroundColor: '#1a1a1a',
      },
    ],
  };

  // Gemensamma inställningar för diagrammen (anpassar storlek, döljer förklaring som standard).
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  // Utan ansökningar finns inget att visa – visa ett tomtillstånd i stället.
  if (applications.length === 0) {
    return (
      <div className="stats-empty">
        <FileBarChart size={48} strokeWidth={1.5} />
        <h3>Ingen statistik ännu</h3>
        <p>Lägg till ansökningar för att se din statistik här.</p>
      </div>
    );
  }

  // Sant om det finns minst en uppmätt snittid att visa.
  const hasTimeData = Object.keys(avgTimePerStage).length > 0;

  return (
    <div className="statistics">
      {/* Översiktskort: antal per status + totalt. */}
      <div className="stats-summary">
        {ALL_STATUSES.map((status) => (
          <div key={status} className="stat-card">
            <div className="stat-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
            <div>
              <span className="stat-value">{statusCounts[status]}</span>
              <span className="stat-label">{STATUS_LABELS[status]}</span>
            </div>
          </div>
        ))}
        <div className="stat-card stat-card-total">
          <div>
            <span className="stat-value">{applications.length}</span>
            <span className="stat-label">Totalt</span>
          </div>
        </div>
      </div>

      {/* Insiktskort: svarsfrekvens, veckomål och snittid per steg. */}
      <div className="insights-row">
        {/* Svarsfrekvens. */}
        <div className="insight-card">
          <div className="insight-header">
            <Percent size={18} />
            <h3>Svarsfrekvens</h3>
          </div>
          {responseRate !== null ? (
            <>
              <span className="insight-value">{responseRate}%</span>
              <p className="insight-desc">
                av ansökningar har fått svar (intervju eller erbjudande)
              </p>
            </>
          ) : (
            <p className="insight-desc">Skicka ansökningar för att se din svarsfrekvens.</p>
          )}
        </div>

        {/* Veckomål med progress-bar och möjlighet att ändra målet. */}
        <div className="insight-card">
          <div className="insight-header">
            <Target size={18} />
            <h3>Veckomål</h3>
            <button
              className="insight-edit-btn"
              onClick={() => setEditingGoal(true)}
              title="Ändra mål"
            >
              Ändra
            </button>
          </div>
          <div className="weekly-goal">
            <div className="goal-numbers">
              <span className="insight-value">{weeklyProgress}</span>
              <span className="goal-separator">/</span>
              {/* Visa inmatningsfält i redigeringsläge, annars bara siffran. */}
              {editingGoal ? (
                <input
                  type="number"
                  className="goal-input"
                  defaultValue={weeklyGoal}
                  min={1}
                  max={100}
                  autoFocus
                  onBlur={(e) => handleGoalChange(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGoalChange(Number((e.target as HTMLInputElement).value));
                    if (e.key === 'Escape') setEditingGoal(false);
                  }}
                />
              ) : (
                <span className="goal-target">{weeklyGoal}</span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${goalPercent >= 100 ? 'progress-complete' : ''}`}
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            <p className="insight-desc">
              {goalPercent >= 100
                ? 'Veckomålet uppnått!'
                : `${weeklyGoal - weeklyProgress} ansökningar kvar denna vecka`}
            </p>
          </div>
        </div>

        {/* Snittid per steg (om det finns historik att räkna på). */}
        <div className="insight-card">
          <div className="insight-header">
            <Clock size={18} />
            <h3>Snittid per steg</h3>
          </div>
          {hasTimeData ? (
            <div className="time-stages">
              {ALL_STATUSES.filter((s) => avgTimePerStage[s] !== undefined).map((status) => (
                <div key={status} className="time-stage-row">
                  <div className="time-stage-label">
                    <span className="stat-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
                    <span>{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="time-stage-value">
                    {/* Visa timmar om mindre än en dag, annars dagar. */}
                    {avgTimePerStage[status]! < 1
                      ? `${Math.round(avgTimePerStage[status]! * 24)}h`
                      : `${avgTimePerStage[status]} d`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="insight-desc">
              Flytta ansökningar mellan steg för att se snittider.
            </p>
          )}
        </div>
      </div>

      {/* Export: ladda ner CSV eller skriv ut PDF. */}
      <div className="export-row">
        <div className="export-card">
          <div className="export-info">
            <Download size={18} />
            <div>
              <h3>Exportera data</h3>
              <p>Ladda ner dina ansökningar som CSV eller skriv ut som PDF.</p>
            </div>
          </div>
          <div className="export-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => exportToCsv(applications)}>
              <TrendingUp size={14} /> CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportToPdf(applications)}>
              <FileBarChart size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Aktivitetsrapport till Arbetsförmedlingen: välj datumintervall och skapa rapport. */}
      <div className="export-row">
        <div className="export-card export-card-af">
          <div className="export-info">
            <FileBarChart size={18} />
            <div>
              <h3>Aktivitetsrapport till Arbetsförmedlingen</h3>
              <p>Lista över sökta jobb mellan valda datum.</p>
            </div>
          </div>
          <div className="af-controls">
            <div className="af-date-group">
              <label htmlFor="af-from">Från</label>
              <input
                id="af-from"
                type="date"
                className="af-date-input"
                value={afFromDate}
                max={afToDate}
                onChange={(e) => setAfFromDate(e.target.value)}
              />
            </div>
            <div className="af-date-group">
              <label htmlFor="af-to">Till</label>
              <input
                id="af-to"
                type="date"
                className="af-date-input"
                value={afToDate}
                min={afFromDate}
                onChange={(e) => setAfToDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => exportArbetsformedlingenReport(applications, afFromDate, afToDate)}
            >
              Skapa rapport
            </button>
          </div>
        </div>
      </div>

      {/* Diagrammen: cirkel (status), stapel (företag) och linje (över tid). */}
      <div className="stats-charts">
        <div className="chart-card">
          <h3>Status fördelning</h3>
          <div className="chart-container chart-doughnut">
            <Doughnut data={doughnutData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' as const } } }} />
          </div>
        </div>

        {topCompanies.length > 0 && (
          <div className="chart-card">
            <h3>Topp företag</h3>
            <div className="chart-container">
              <Bar data={barData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            </div>
          </div>
        )}

        {timelineData.labels.length > 1 && (
          <div className="chart-card chart-card-wide">
            <h3>Ansökningar över tid</h3>
            <div className="chart-container">
              <Line data={lineData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
