import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { ClassSubject } from '../../types';
import { FileSpreadsheet, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const GradeReport: React.FC = () => {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedCsId, setSelectedCsId] = useState<string>('');
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadClassSubjects();
  }, []);

  const loadClassSubjects = async () => {
    const list = await ApiClient.getClassSubjects();
    setClassSubjects(list);
    if (list.length > 0) {
      setSelectedCsId(list[0].id);
    }
  };

  const handleFetchReport = async () => {
    if (!selectedCsId) return;
    setLoading(true);
    try {
      const data = await ApiClient.getGradesReport(selectedCsId);
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report) return;

    // Build rows for Excel
    const rows = report.reportData.map((row: any, idx: number) => {
      const excelRow: Record<string, any> = {
        'No': idx + 1,
        'NISN': row.nisn || '',
        'NIS': row.nis || '',
        'Nama Lengkap': row.studentName,
      };

      report.gradeEntries.forEach((ge: any) => {
        excelRow[ge.title] = row.scores[ge.id] ?? '-';
      });

      return excelRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Nilai');

    const fileName = `Laporan_Nilai_${report.className}_${report.subjectName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      {/* Filter Row */}
      <div className="card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '240px' }}>
            <label className="form-label">Pilih Kelas & Mata Pelajaran</label>
            <select 
              className="form-control" 
              value={selectedCsId}
              onChange={(e) => setSelectedCsId(e.target.value)}
            >
              <option value="">Pilih...</option>
              {classSubjects.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  Kelas {cs.className} — {cs.subjectName} ({cs.teacherName})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleFetchReport}
            disabled={!selectedCsId || loading}
            style={{ height: '42px' }}
          >
            <Filter size={16} />
            Filter Laporan
          </button>

          {report && (
            <button 
              className="btn btn-secondary" 
              onClick={handleExportExcel}
              style={{ height: '42px' }}
            >
              <Download size={16} />
              Ekspor Excel
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Memuat data laporan nilai...
        </div>
      )}

      {/* Report Table Card */}
      {report && !loading && (
        <div className="card" style={{ padding: '24px 0 0 0', overflow: 'hidden' }}>
          <div style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <FileSpreadsheet size={18} color="var(--accent-teal)" />
              Laporan Rekap Nilai: Kelas {report.className} — {report.subjectName}
            </h3>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NISN</th>
                  <th>Nama Siswa</th>
                  {report.gradeEntries.map((ge: any) => (
                    <th key={ge.id} style={{ textAlign: 'center' }}>
                      {ge.title}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-teal)' }}>Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {report.reportData.map((row: any, idx: number) => {
                  // Calculate average dynamically
                  const scores = Object.values(row.scores).filter((s): s is number => s !== null);
                  const avg = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

                  return (
                    <tr key={row.studentId}>
                      <td style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                      <td style={{ fontSize: '0.85rem' }}>{row.nisn || '-'}</td>
                      <td style={{ fontWeight: 500 }}>{row.studentName}</td>
                      {report.gradeEntries.map((ge: any) => {
                        const score = row.scores[ge.id];
                        return (
                          <td key={ge.id} style={{ 
                            textAlign: 'center',
                            color: score === null ? 'var(--text-tertiary)' : score < 75 ? 'var(--danger)' : 'var(--text-primary)'
                          }}>
                            {score ?? '-'}
                          </td>
                        );
                      })}
                      <td style={{ 
                        textAlign: 'center', 
                        fontWeight: 700, 
                        color: avg < 75 ? 'var(--danger)' : 'var(--success)',
                        backgroundColor: 'rgba(255,255,255,0.01)'
                      }}>
                        {Math.round(avg * 10) / 10}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
