import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { Teacher } from '../../types';
import { Plus, Search, Edit2, Key, UserCheck, UserX, AlertCircle } from 'lucide-react';

export const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Import states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [nuptk, setNuptk] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [role, setRole] = useState<'GURU' | 'ADMIN' | 'KEPALA_SEKOLAH' | 'SUPER_ADMIN'>('GURU');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await ApiClient.getTeachers();
      setTeachers(list);
    } catch (error) {
      console.error('Failed loading teacher page data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedTeacher(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setNuptk('');
    setNip('');
    setGender('L');
    setRole('GURU');
    setPassword('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setSelectedTeacher(t);
    setFullName(t.fullName);
    setEmail(t.email);
    setPhone(t.phone || '');
    setNuptk(t.nuptk || '');
    setNip(t.nip || '');
    setGender(t.gender || 'L');
    setRole(t.role);
    setPassword('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: any = {
      id: selectedTeacher?.id,
      fullName,
      email,
      phone,
      nuptk,
      nip,
      gender,
      role,
    };

    if (password) {
      data.password = password;
    }

    try {
      const saved = await ApiClient.saveTeacher(data);
      setTeachers((current) => {
        return current.some((t) => t.id === saved.id)
          ? current.map((t) => (t.id === saved.id ? { ...t, ...saved } : t))
          : [...current, saved];
      });
      setIsFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin me-reset password guru ini ke default?');
    if (confirm) {
      const res = await ApiClient.saveTeacher({ id, password: 'guru123' });
      if (res) {
        alert('Password berhasil di-reset menjadi: guru123');
      }
    }
  };

  const handleToggleStatus = async (t: Teacher) => {
    const confirm = window.confirm(`Apakah Anda yakin ingin ${t.isActive ? 'menonaktifkan' : 'mengaktifkan'} guru ini?`);
    if (!confirm) return;

    try {
      const updated = await ApiClient.saveTeacher({ id: t.id, isActive: !t.isActive });
      setTeachers((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (err) {
      console.error(err);
    }
  };

  // Import handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setImportPreview([
      {
        fullName: `File Excel: ${file.name}`,
        email: 'Ditentukan otomatis dari NUPTK/Nama',
        nuptk: 'Diparsing otomatis',
        phone: 'Diparsing otomatis'
      }
    ]);
  };

  const handleImportSubmit = async () => {
    if (!excelFile) return;
    try {
      await ApiClient.importTeachers(excelFile);
      alert('Impor data guru berhasil diproses di server database!');
      setIsImportOpen(false);
      setExcelFile(null);
      setImportPreview([]);
      loadData();
    } catch (err: any) {
      alert('Gagal mengimpor data guru: ' + err.message);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    return t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (t.nuptk && t.nuptk.includes(searchTerm));
  });

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input 
            type="text" 
            placeholder="Cari guru berdasarkan nama, email, NUPTK..." 
            className="form-control" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-secondary)' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)}>
            <Plus size={16} />
            Impor Guru (Dapodik Excel)
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd} disabled={saving}>
            <Plus size={16} />
            Tambah Akun Guru
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
                <th>NUPTK</th>
                <th>NIP</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>No. Telepon</th>
                <th>Hak Akses</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner"></div>
                      <div>Memuat data...</div>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td>{t.nuptk || '-'}</td>
                    <td>{t.nip || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{t.fullName}</td>
                    <td>{t.email}</td>
                    <td>{t.phone || '-'}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: t.role === 'ADMIN' ? 'var(--danger-glow)' : 'rgba(99, 102, 241, 0.08)', 
                        color: t.role === 'ADMIN' ? '#fca5a5' : 'var(--accent-indigo)', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600 
                      }}>
                        {t.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '4px', 
                          backgroundColor: t.isActive ? '#10b981' : '#ef4444' 
                        }} />
                        <span style={{ fontSize: '0.8rem', color: t.isActive ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                          {t.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-icon" onClick={() => handleOpenEdit(t)} title="Edit Profil">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-icon" onClick={() => handleResetPassword(t.id)} title="Reset Password ke default (guru123)">
                          <Key size={13} color="var(--accent-teal)" />
                        </button>
                        <button 
                          className="btn btn-icon" 
                          onClick={() => handleToggleStatus(t)} 
                          title={t.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {t.isActive ? <UserX size={13} color="#f87171" /> : <UserCheck size={13} color="#34d399" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px' }}>
                    Tidak ada data guru ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedTeacher ? 'Edit Akun Guru' : 'Tambah Akun Guru Baru'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Budi Santoso, S.Pd." />
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Email Utama</label>
                    <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="budi@sekolah.id" />
                  </div>
                  <div>
                    <label className="form-label">No. Telepon / HP</label>
                    <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789" />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Jenis Kelamin</label>
                    <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">NUPTK (16 Digit)</label>
                    <input type="text" className="form-control" value={nuptk} onChange={(e) => setNuptk(e.target.value)} maxLength={16} placeholder="1234567890123456" />
                  </div>
                  <div>
                    <label className="form-label">NIP (PNS)</label>
                    <input type="text" className="form-control" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="198008202005011002" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hak Akses / Peran</label>
                  <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="GURU">GURU (Input Nilai & Absensi Kelas)</option>
                    <option value="ADMIN">ADMINISTRATOR (Tata Usaha/Akses Penuh)</option>
                    <option value="KEPALA_SEKOLAH">KEPALA SEKOLAH (Melihat Laporan & Grafik)</option>
                  </select>
                </div>

                {!selectedTeacher && (
                  <div className="form-group">
                    <label className="form-label">Password Awal</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="guru123" 
                    />
                    <small style={{ color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                      Jika dikosongkan, password default adalah: <strong>guru123</strong>
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {isImportOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Impor Data Guru Massal (Excel Dapodik)</h3>
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
                  <strong>Kompatibilitas Import Dapodik Aktif:</strong><br />
                  Anda dapat langsung mengunggah file Excel <code>daftar-guru-xxxx.xlsx</code> hasil ekspor data pendidik/tenaga kependidikan dari portal Dapodik. Pendidik baru akan terdaftar dengan password default: <code>guru123</code>.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih File Excel Pendidik (.xlsx)</label>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  className="form-control" 
                  onChange={handleFileChange}
                  style={{ padding: '8px' }}
                />
              </div>

              {importPreview.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Pratinjau File:
                  </h4>
                  <div style={{ 
                    padding: '12px', 
                    fontSize: '0.8rem', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0,0,0,0.2)'
                  }}>
                    {importPreview[0].fullName}<br />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Status: Siap diunggah dan diparsing otomatis oleh server database.
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsImportOpen(false)}>Batal</button>
              <button 
                className="btn btn-primary" 
                onClick={handleImportSubmit}
                disabled={!excelFile}
              >
                Impor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
