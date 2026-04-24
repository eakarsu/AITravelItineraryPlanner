export const exportToCSV = (data, columns, columnLabels, filename) => {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columnLabels.map(escapeCSV).join(',');
  const rows = data.map((item) =>
    columns.map((col) => escapeCSV(item[col])).join(',')
  );
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (data, columns, columnLabels, title) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        p { font-size: 12px; color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f3f4f6; padding: 8px 6px; text-align: left; border: 1px solid #d1d5db; font-weight: 600; }
        td { padding: 6px; border: 1px solid #d1d5db; }
        tr:nth-child(even) td { background: #f9fafb; }
        @media print {
          body { margin: 0; }
          @page { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Exported on ${new Date().toLocaleDateString()} — ${data.length} records</p>
      <table>
        <thead>
          <tr>${columnLabels.map((l) => `<th>${l}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((item) => `<tr>${columns.map((col) => `<td>${item[col] ?? '-'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
