import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { Student } from '../../types';
import { Plus, Search, Edit2, Trash2, Upload, FileDown, Eye, AlertCircle } from 'lucide-react';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [religion, setReligion] = useState<string>('');
  const [nisn, setNisn] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [className, setClassName] = useState<string>('7A');
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');

  // Import fields
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, classList] = await Promise.all([
        ApiClient.getStudents(),
        ApiClient.getClasses()
      ]);
      setStudents(list);
      setClasses(classList);
    } catch (error) {
      console.error('Failed loading student page data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setFullName('');
    setReligion('');
    setNisn('');
    setNis('');
    setGender('L');
    setBirthPlace('');
    setBirthDate('');
    setClassName('7A');
    setFatherName('');
    setMotherName('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFullName(student.fullName);
    setReligion(student.religion || '');
    setNisn(student.nisn || '');
    setNis(student.nis || '');
    setGender(student.gender || 'L');
    setBirthPlace(student.birthPlace || '');
    setBirthDate(student.birthDate ? (typeof student.birthDate === 'string' ? student.birthDate.substring(0, 10) : new Date(student.birthDate).toISOString().substring(0, 10)) : '');
    setClassName(student.className || '7A');
    setFatherName(student.fatherName || '');
    setMotherName(student.motherName || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      id: selectedStudent?.id,
      fullName,
      religion,
      nisn,
      nis,
      gender,
      birthPlace,
      birthDate,
      className,
      fatherName,
      motherName,
    };

    try {
      const saved = await ApiClient.saveStudent(data);
      setStudents((current) => {
        const exists = current.some((s) => s.id === saved.id);
        if (exists) {
          return current.map((s) => (s.id === saved.id ? { ...s, ...saved } : s));
        }
        return [...current, saved];
      });

      const prevClassName = selectedStudent?.className;
      const nextClassName = saved.className;
      const isNew = !selectedStudent?.id;
      if (nextClassName) {
        setClasses((current) => current.map((c) => {
          if (c.name === nextClassName && isNew) {
            return { ...c, studentCount: (c.studentCount || 0) + 1 };
          }
          if (!isNew && prevClassName && prevClassName !== nextClassName && c.name === prevClassName) {
            return { ...c, studentCount: Math.max(0, (c.studentCount || 0) - 1) };
          }
          if (!isNew && prevClassName && prevClassName !== nextClassName && c.name === nextClassName) {
            return { ...c, studentCount: (c.studentCount || 0) + 1 };
          }
          return c;
        }));
      }

      setIsFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;
    setDeletingId(id);
    const studentToDelete = students.find((s) => s.id === id);

    try {
      await ApiClient.deleteStudent(id);
      setStudents((current) => current.filter((s) => s.id !== id));
      if (studentToDelete?.className) {
        setClasses((current) => current.map((c) => c.name === studentToDelete.className ? { ...c, studentCount: Math.max(0, (c.studentCount || 0) - 1) } : c));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa? Tindakan ini tidak dapat dibatalkan.')) return;
    setLoading(true);
    try {
      await ApiClient.deleteAllStudents();
      setStudents([]);
      setClasses((current) => current.map((c) => ({ ...c, studentCount: 0 })));
    } finally {
      setLoading(false);
    }
  };

  // CSV/Excel Import Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      // Show excel file detection placeholder in preview
      setImportPreview([
        {
          fullName: `File Excel: ${file.name}`,
          className: 'Ditentukan otomatis dari Rombel Dapodik',
          nisn: 'Diparsing otomatis',
          gender: 'Diparsing otomatis'
        }
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map((h) => h.trim());
      
      const parsedData = rows.slice(1).map((row, idx) => {
        const values = row.split(',').map((v) => v.trim());
        if (values.length < headers.length) return null;
        
        const obj: Record<string, string> = {};
        headers.forEach((h, hIdx) => {
          obj[h] = values[hIdx];
        });
        return obj;
      }).filter(Boolean);

      setImportPreview(parsedData);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      await ApiClient.importStudents(csvFile);
      alert('Impor data siswa berhasil!');
      setIsImportOpen(false);
      setCsvFile(null);
      setImportPreview([]);
      loadData();
    } catch (err: any) {
      alert('Gagal mengimpor: ' + (err.message || 'Koneksi API bermasalah'));
    } finally {
      setIsImporting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.nisn && s.nisn.includes(searchTerm));
    const matchesClass = selectedClass ? s.className === selectedClass : true;
    return matchesSearch && matchesClass;
  });

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Cari siswa berdasarkan nama atau NISN..." 
              className="form-control" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-secondary)' }} />
          </div>
          <select 
            className="form-control" 
            style={{ width: '140px' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} 
            onClick={handleDeleteAll}
            disabled={students.length === 0}
          >
            Hapus Semua
          </button>
          <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)}>
            <Upload size={16} />
            Impor CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>NIS</th>
                <th>Nama Lengkap</th>
                <th>Panggilan</th>
                <th>Kelas</th>
                <th>L/P</th>
                <th>Tempat, Tgl Lahir</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner"></div>
                      <div>Memuat data...</div>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>{s.nisn || '-'}</td>
                    <td>{s.nis || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{s.fullName}</td>
                    <td>{s.nickname || '-'}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: 'rgba(20, 184, 166, 0.08)', 
                        color: 'var(--accent-teal)', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600 
                      }}>
                        {s.className}
                      </span>
                    </td>
                    <td>{s.gender}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {s.birthPlace ? `${s.birthPlace}, ` : ''}
                      {s.birthDate ? new Date(s.birthDate).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleOpenEdit(s)}
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={12} color="var(--accent-teal)" />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleDelete(s.id)}
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={12} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Tidak ada data siswa ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                Halaman {currentPage} dari {totalPages}
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Budi Pratama" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Agama</label>
                  <input type="text" className="form-control" value={religion} onChange={(e) => setReligion(e.target.value)} placeholder="Islam" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Kelas</label>
                  <select className="form-control" value={className} onChange={(e) => setClassName(e.target.value)}>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">NISN (10 Digit)</label>
                  <input type="text" className="form-control" value={nisn} onChange={(e) => setNisn(e.target.value)} maxLength={10} placeholder="0012345001" />
                </div>

                <div className="form-group">
                  <label className="form-label">NIS (Internal)</label>
                  <input type="text" className="form-control" value={nis} onChange={(e) => setNis(e.target.value)} placeholder="2025001" />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>



                <div className="form-group">
                  <label className="form-label">Tempat Lahir</label>
                  <input type="text" className="form-control" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Bandung" />
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Lahir</label>
                  <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Ayah</label>
                  <input type="text" className="form-control" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Bapak Budi" />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Ibu</label>
                  <input type="text" className="form-control" value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Ibu Budi" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV/Excel IMPORT MODAL */}
      {isImportOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Impor Data Siswa Massal (CSV / Excel Dapodik)</h3>
              <button className="close-btn" onClick={() => setIsImportOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid var(--accent-teal)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: '#a7f3d0',
                marginBottom: '20px',
                lineHeight: 1.4,
                display: 'flex',
                gap: '10px'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, color: 'var(--accent-teal)' }} />
                <div>
                  <strong>Kompatibilitas Import Dapodik & Template Standar:</strong><br />
                  Anda dapat langsung mengunggah file Excel <code>daftar_pd-xxxx.xlsx</code> hasil ekspor data peserta didik dari portal Dapodik. Jika tidak memiliki file Dapodik, Anda dapat menggunakan template standar kami.
                </div>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => ApiClient.downloadStudentTemplate()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileDown size={16} />
                  Unduh Template Excel Standar
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih File (CSV / Excel .xlsx)</label>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  className="form-control" 
                  onChange={handleFileChange}
                  style={{ padding: '8px' }}
                />
              </div>

              {importPreview.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Pratinjau Data ({importPreview.length} baris):
                  </h4>
                  <div style={{ 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    fontSize: '0.75rem', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0,0,0,0.2)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                        <tr>
                          <th style={{ padding: '8px' }}>Nama</th>
                          <th style={{ padding: '8px' }}>Kelas</th>
                          <th style={{ padding: '8px' }}>NISN</th>
                          <th style={{ padding: '8px' }}>L/P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '8px' }}>{row.fullName}</td>
                            <td style={{ padding: '8px' }}>{row.className}</td>
                            <td style={{ padding: '8px' }}>{row.nisn}</td>
                            <td style={{ padding: '8px' }}>{row.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 5 && (
                      <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-tertiary)', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                        ...dan {importPreview.length - 5} baris lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsImportOpen(false)} disabled={isImporting}>Batal</button>
              <button 
                className="btn btn-primary" 
                onClick={handleImportSubmit}
                disabled={importPreview.length === 0 || isImporting}
              >
                {isImporting ? 'Memproses...' : 'Impor Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
