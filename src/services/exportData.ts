import type { JobApplication } from '../types';
import { STATUS_LABELS } from '../types';

// Exporterar alla ansökningar till en CSV-fil och laddar ner den.
export function exportToCsv(applications: JobApplication[]): void {
  // Kolumnrubriker överst i filen.
  const headers = [
    'Jobbtitel',
    'Företag',
    'Plats',
    'Status',
    'Ansökningsdatum',
    'Taggar',
    'Anteckningar',
    'Länk',
    'Skapad',
  ];

  // En rad per ansökan i samma ordning som rubrikerna.
  const rows = applications.map((app) => [
    app.jobTitle,
    app.company,
    app.location,
    STATUS_LABELS[app.status],
    app.applicationDate,
    app.tags.join('; '),
    app.notes.replace(/\n/g, ' '),
    app.url || '',
    new Date(app.createdAt).toLocaleDateString('sv-SE'),
  ]);

  // Slå ihop rubrik + rader till CSV-text. Varje cell citeras och inre citattecken dubblas.
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Ett osynligt tecken först i filen säger åt Excel att läsa den som svensk text,
  // annars riskerar å, ä och ö att visas som konstiga tecken.
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `nextstep-ansokan-${new Date().toISOString().split('T')[0]}.csv`);
}

// Exporterar ansökningarna till PDF genom att öppna en utskriftsvänlig sida.
export function exportToPdf(applications: JobApplication[]): void {
  // Gruppera ansökningarna per status så varje status får en egen tabell.
  const statusGroups = new Map<string, JobApplication[]>();
  for (const app of applications) {
    const label = STATUS_LABELS[app.status];
    if (!statusGroups.has(label)) statusGroups.set(label, []);
    statusGroups.get(label)!.push(app);
  }

  // Bygg HTML-dokumentet som ska skrivas ut (stil + en tabell per statusgrupp).
  const html = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>NextStep - Mina ansökningar</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; color: #111; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.875rem; }
    h2 { font-size: 1.125rem; margin-top: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.8125rem; }
    th { text-align: left; padding: 0.5rem; background: #f8f9fa; border-bottom: 1px solid #e5e7eb; }
    td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .total { margin-top: 2rem; font-weight: 600; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>NextStep - Mina ansökningar</h1>
  <p class="subtitle">Exporterad ${new Date().toLocaleDateString('sv-SE')} | Totalt ${applications.length} ansökningar</p>
  ${Array.from(statusGroups.entries())
    .map(
      ([label, apps]) => `
    <h2>${label} (${apps.length})</h2>
    <table>
      <thead><tr><th>Jobbtitel</th><th>Företag</th><th>Plats</th><th>Datum</th><th>Taggar</th></tr></thead>
      <tbody>
        ${apps
          .map(
            (app) => `<tr>
            <td>${escapeHtml(app.jobTitle)}</td>
            <td>${escapeHtml(app.company)}</td>
            <td>${escapeHtml(app.location)}</td>
            <td>${app.applicationDate}</td>
            <td>${app.tags.map(escapeHtml).join(', ')}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>`
    )
    .join('')}
</body>
</html>`;

  // Öppna HTML:en i en ny flik och starta utskriftsdialogen när sidan laddats.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }
}

// Skapar en aktivitetsrapport för Arbetsförmedlingen över sökta jobb i ett datumintervall.
export function exportArbetsformedlingenReport(
  applications: JobApplication[],
  fromDate: string,
  toDate: string
): void {
  // Ta bara med faktiskt sökta jobb (inte "att söka") inom det valda intervallet, sorterade på datum.
  const filtered = applications
    .filter((app) => app.status !== 'to-apply')
    .filter((app) => app.applicationDate >= fromDate && app.applicationDate <= toDate)
    .sort((a, b) => a.applicationDate.localeCompare(b.applicationDate));

  // Liten hjälpare för att formatera datum på svenska.
  const fmt = (d: string) => new Date(d).toLocaleDateString('sv-SE');

  // Bygg tabellen – eller ett meddelande om perioden saknar ansökningar.
  const tableHtml = filtered.length === 0
    ? `<p class="empty">Inga ansökningar i den valda perioden.</p>`
    : `<table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Yrke / Tjänst</th>
          <th>Arbetsgivare</th>
          <th>Plats</th>
          <th>Länk</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((app) => `<tr>
          <td class="date">${app.applicationDate}</td>
          <td>${escapeHtml(app.jobTitle)}</td>
          <td>${escapeHtml(app.company)}</td>
          <td>${escapeHtml(app.location)}</td>
          <td>${app.url ? `<a href="${escapeHtml(app.url)}">${escapeHtml(app.url)}</a>` : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  // Hela rapportens HTML (rubrik, period och tabellen ovan).
  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>Aktivitetsrapport - Arbetsförmedlingen</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; padding: 2.5rem; color: #1a1a1a; max-width: 820px; margin: 0 auto; line-height: 1.5; }
    h1 { font-size: 1.875rem; font-weight: 500; margin: 0 0 0.125rem; letter-spacing: -0.02em; }
    .subtitle { color: #6b6358; margin: 0 0 0.5rem; font-size: 0.9375rem; font-style: italic; }
    .meta { font-size: 0.75rem; color: #6b6358; margin: 0 0 2rem; padding-bottom: 1rem; border-bottom: 1px solid #1a1a1a; letter-spacing: 0.04em; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    th { text-align: left; padding: 0.625rem 0.75rem 0.625rem 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.625rem; color: #6b6358; border-bottom: 1px solid #1a1a1a; }
    td { padding: 0.75rem 0.75rem 0.75rem 0; border-bottom: 1px solid #d8d2c5; vertical-align: top; }
    td.date { white-space: nowrap; font-variant-numeric: tabular-nums; }
    td a { color: #1a1a1a; word-break: break-all; }
    .empty { padding: 3rem 0; text-align: center; color: #6b6358; font-style: italic; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Aktivitetsrapport</h1>
  <p class="subtitle">Sökta jobb</p>
  <p class="meta">${fmt(fromDate)} – ${fmt(toDate)} &nbsp;·&nbsp; ${filtered.length} ansökningar</p>
  ${tableHtml}
</body>
</html>`;

  // Öppna rapporten i ny flik och starta utskrift.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }
}

// Gör specialtecken (< > & ") ofarliga så att t.ex. ett företagsnamn med < i sig
// visas som text i rapporten i stället för att råka tolkas som HTML-kod.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Startar en filnedladdning genom att i smyg skapa en länk, "klicka" på den och ta bort den igen.
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
