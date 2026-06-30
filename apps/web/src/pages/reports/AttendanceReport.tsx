import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { ClassRoom } from '../../types';
import { Calendar, CheckSquare, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export const AttendanceReport: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-06-20');
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const list = await ApiClient.getClasses();
    setClasses(list);
    if (list.length > 0) {
      setSelectedClassId(list[0].id);
    }
  };

  const handleFetchReport = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const data = await ApiClient.getAttendanceReport(selectedClassId, startDate, endDate);
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report) return;

    const rows = report.reportData.map((row: any, idx: number) => {
      const excelRow: Record<string, any> = {
        'No': idx + 1,
        'NISN': row.nisn || '',
        'Nama Siswa': row.studentName,
      };

      report.dates.forEach((d: string) => {
        excelRow[d] = row.attendance[d] || '-';
      });

      excelRow['Hadir'] = row.summary.hadir;
      excelRow['Izin'] = row.summary.izin;
      excelRow['Sakit'] = row.summary.sakit;
      excelRow['Alpa'] = row.summary.alpa;

      return excelRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi');

    const fileName = `Laporan_Presensi_Kelas_${report.className}_${startDate}_ke_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      {/* Filters Card */}
      <div className="card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
            <label className="form-label">Pilih Kelas</label>
            <select 
              className="form-control" 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Pilih...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '160px' }}>
            <label className="form-label">Tanggal Mulai</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '160px' }}>
            <label className="form-label">Tanggal Selesai</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleFetchReport}
            disabled={!selectedClassId || loading}
            style={{ height: '42px' }}
          >
            <Filter size={16} />
            Filter Presensi
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
          Memuat data laporan absensi...
        </div>
      )}

      {/* Report Table Card */}
      {report && !loading && (
        <div className="card" style={{ padding: '24px 0 0 0', overflow: 'hidden' }}>
          <div style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CheckSquare size={18} color="var(--accent-teal)" />
              Laporan Rekap Presensi Siswa: Kelas {report.className}
            </h3>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: 'middle' }}>No</th>
                  <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Nama Siswa</th>
                  <th colSpan={report.dates.length} style={{ textAlign: 'center', borderBottom: '1px solid var(--glass-border)' }}>Tanggal Rekap</th>
                  <th colSpan={4} style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>Total Status</th>
                </tr>
                <tr>
                  {report.dates.map((d: string) => {
                    const day = d.split('-')[2];
                    return (
                      <th key={d} style={{ textAlign: 'center', fontSize: '0.8rem', padding: '8px 12px' }}>
                        {day}
                      </th>
                    );
                  })}
                  <th style={{ textAlign: 'center', color: 'var(--success)', fontSize: '0.8rem', padding: '8px 12px' }}>H</th>
                  <th style={{ textAlign: 'center', color: 'var(--info)', fontSize: '0.8rem', padding: '8px 12px' }}>I</th>
                  <th style={{ textAlign: 'center', color: 'var(--warning)', fontSize: '0.8rem', padding: '8px 12px' }}>S</th>
                  <th style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.8rem', padding: '8px 12px' }}>A</th>
                </tr>
              </thead>
              <tbody>
                {report.reportData.map((row: any, idx: number) => (
                  <tr key={row.studentId}>
                    <td style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{row.studentName}</td>
                    {report.dates.map((d: string) => {
                      const status = row.attendance[d] || '-';
                      let color = 'var(--text-secondary)';
                      if (status === 'IZIN') color = 'var(--info)';
                      else if (status === 'SAKIT') color = 'var(--warning)';
                      else if (status === 'ALPA') color = 'var(--danger)';
                      else if (status === 'HADIR') color = 'var(--success)';
                      
                      const letterMap: Record<string, string> = {
                        'HADIR': 'H',
                        'IZIN': 'I',
                        'SAKIT': 'S',
                        'ALPA': 'A',
                        '-': '-'
                      };

                      return (
                        <td key={d} style={{ textAlign: 'center', fontWeight: 600, color, fontSize: '0.85rem' }}>
                          {letterMap[status]}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>{row.summary.hadir}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--info)' }}>{row.summary.izin}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--warning)' }}>{row.summary.sakit}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--danger)' }}>{row.summary.alpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
