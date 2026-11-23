import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CheckInRecord } from '../types/cna';
import { getRoleCountsForRecords, toLocalDateKey } from './analytics';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value: string): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatRecordTime(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return isoTimestamp;
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function exportCheckInsToCsv(records: CheckInRecord[], filenamePrefix = 'cna-attendance'): void {
  const headers = ['Date', 'Check-In Time', 'Member Name', 'Phone', 'Email', 'Role', 'Department', 'Location', 'Sync Status'];
  const rows = records.map((r) => [
    escapeCsvCell(r.dateKey),
    escapeCsvCell(formatRecordTime(r.timestamp)),
    escapeCsvCell(r.name),
    escapeCsvCell(r.phone),
    escapeCsvCell(r.email),
    escapeCsvCell(r.role),
    escapeCsvCell(r.department),
    escapeCsvCell(r.location),
    escapeCsvCell(r.syncStatus === 'synced' ? 'Synced' : 'Cached Locally'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, `${filenamePrefix}-${toLocalDateKey()}.csv`);
}

function escapeXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportCheckInsToXls(records: CheckInRecord[], filenamePrefix = 'cna-attendance'): void {
  const headers = ['Date', 'Check-In Time', 'Member Name', 'Phone', 'Email', 'Role', 'Department', 'Location', 'Sync Status'];
  const headerXml = headers
    .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const rowsXml = records
    .map((r) => {
      const cells = [
        r.dateKey,
        formatRecordTime(r.timestamp),
        r.name,
        r.phone,
        r.email,
        r.role,
        r.department,
        r.location,
        r.syncStatus === 'synced' ? 'Synced' : 'Cached Locally',
      ];
      return `<Row>${cells
        .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`)
        .join('')}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="CNA Check-Ins">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerBlobDownload(blob, `${filenamePrefix}-${toLocalDateKey()}.xls`);
}

export function exportCheckInsToPdf(
  records: CheckInRecord[],
  options: { title?: string; subtitle?: string; filename?: string } = {}
): void {
  const todayKey = toLocalDateKey();
  const title = options.title || 'California Nurses Association — Participation Report';
  const subtitle =
    options.subtitle ||
    `Generated ${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${records.length} Check-In Records`;
  const filename = options.filename || `cna-attendance-report-${todayKey}.pdf`;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 40, 62);

  const roleCounts = getRoleCountsForRecords(records);

  autoTable(doc, {
    startY: 78,
    head: [['Total Checked In', 'Union Reps', 'Unit Reps', 'PPC Members']],
    body: [[
      String(records.length),
      String(roleCounts['Union Rep']),
      String(roleCounts['Unit Rep']),
      String(roleCounts['PPC']),
    ]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 12, fontStyle: 'bold', textColor: [15, 23, 42] },
    margin: { left: 40, right: 40 },
  });

  const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;

  const tableRows = records.map((r, idx) => [
    String(idx + 1),
    r.dateKey,
    formatRecordTime(r.timestamp),
    r.name,
    r.phone || '—',
    r.email || '—',
    r.role,
    r.department,
    r.location,
  ]);

  autoTable(doc, {
    startY: lastY + 16,
    head: [['#', 'Date', 'Time', 'Member Name', 'Phone', 'Email', 'Role', 'Department', 'Location']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'No matching check-in records', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 62 },
      2: { cellWidth: 52 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
