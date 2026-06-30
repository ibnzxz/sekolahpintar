import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { Subject } from '../../types';
import { Plus, Search, Edit2, Book, Trash2 } from 'lucide-react';

export const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await ApiClient.getSubjects();
      setSubjects(list);
    } catch (error) {
      console.error('Failed loading subject page data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedId(null);
    setName('');
    setCode('');
    setDescription('');
    setIsOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setSelectedId(s.id);
    setName(s.name);
    setCode(s.code);
    setDescription(s.description || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await ApiClient.saveSubject({ id: selectedId || undefined, name, code, description });
      setSubjects((current) => {
        return current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item))
          : [...current, saved];
      });
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus mata pelajaran ini?')) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteSubject(id);
      setSubjects((current) => current.filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input 
            type="text" 
            placeholder="Cari mata pelajaran berdasarkan nama/kode..." 
            className="form-control" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-secondary)' }} />
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          Tambah Mapel
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Mapel</th>
                <th>Nama Mata Pelajaran</th>
                <th>Deskripsi</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((s, idx) => (
                  <tr key={s.id} style={{ opacity: deletingId === s.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                    <td style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{s.code}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.description || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px' }} onClick={() => handleOpenEdit(s)} disabled={deletingId === s.id}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px', color: 'var(--accent-red)' }} onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}>
                          {deletingId === s.id ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Tidak ada data mata pelajaran ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Mata Pelajaran</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seni Musik" />
                </div>

                <div className="form-group">
                  <label className="form-label">Kode Singkatan</label>
                  <input type="text" className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="MUSIK" />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mata pelajaran dasar..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)} disabled={isSaving}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                      Menyimpan...
                    </span>
                  ) : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
