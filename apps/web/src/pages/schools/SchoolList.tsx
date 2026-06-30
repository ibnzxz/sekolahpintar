import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { Plus, School, Globe, Shield, MapPin, CheckCircle, Trash2 } from 'lucide-react';

interface SchoolData {
  id: string;
  npsn: string;
  name: string;
  city: string;
  adminEmail: string;
  status: string;
  _count?: { teachers: number; students: number; classes: number };
}

export const SchoolList: React.FC = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  // New school form fields
  const [name, setName] = useState<string>('');
  const [npsn, setNpsn] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [status, setStatus] = useState<string>('NEGERI');

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const list = await ApiClient.getSchools();
      setSchools(list);
    } catch (e) {
      console.error('Failed loading school list', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !npsn || !city || !adminEmail) return;
    setLoading(true);

    try {
      const created = await ApiClient.createSchool({
        name,
        npsn,
        city,
        adminEmail,
        adminPassword,
        status,
        level: 'SMP'
      });
      setSchools((current) => [...current, created]);
      setIsModalOpen(false);
      resetForm();
      alert('Klien berhasil dibuat! Admin sekolah baru sekarang dapat login menggunakan kredensial yang diberikan.');
    } catch (e: any) {
      alert(e.message || 'Gagal membuat klien baru');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    alert('Penghapusan sekolah belum diimplementasikan di API.');
  };

  const resetForm = () => {
    setName('');
    setNpsn('');
    setCity('');
    setAdminEmail('');
    setAdminPassword('admin123');
    setStatus('NEGERI');
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Daftar Sekolah Klien (SekolahPintar)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Portal manajemen lisensi sekolah pembeli layanan SekolahPintar MVP.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} disabled={loading}>
          <Plus size={16} /> Register Sekolah Baru
        </button>
      </div>

      {/* Grid Overview Info */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--success-glow)' }}>
              <School size={20} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Sekolah Klien</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{schools.length} Sekolah</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--accent-primary-glow)' }}>
              <Shield size={20} color="var(--accent-secondary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status Akun Admin</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{schools.length} Aktif</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
              <Globe size={20} color="var(--info)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Server Region</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>Asia (Jakarta)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table List of Schools */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>NPSN</th>
              <th>Nama Sekolah</th>
              <th>Wilayah / Kota</th>
              <th>Email Admin Utama</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 'bold' }}>{item.npsn}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      🏫
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lisensi: Aktif</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <MapPin size={14} color="var(--text-secondary)" />
                    {item.city}
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>
                  {item.adminEmail}
                </td>
                <td>
                  <span className={`badge ${item.status === 'NEGERI' ? 'badge-success' : 'badge-warning'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--danger)', 
                      cursor: 'pointer',
                      padding: '4px' 
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add School Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Sekolah Klien Baru</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nama Sekolah</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="SMP Negeri 2 Bandung"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">NPSN (Dapodik)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="20100002"
                      value={npsn}
                      onChange={(e) => setNpsn(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Kota / Kabupaten</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Bandung"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Sekolah</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
                    >
                      <option value="NEGERI">NEGERI</option>
                      <option value="SWASTA">SWASTA</option>
                    </select>
                  </div>
                </div>

                <div style={{ 
                  margin: '10px 0 20px 0', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'rgba(15, 23, 42, 0.02)',
                  border: '1px dashed var(--glass-border)'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>
                    🔑 Buat Akun Administrator Sekolah Utama
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email Admin Utama</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="admin2@smpn2bandung.sch.id"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Password Default</label>
                    <input
                      type="text"
                      className="form-control"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Lisensi Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
