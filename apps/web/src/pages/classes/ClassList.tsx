import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { ClassRoom, Teacher, Subject, ClassSubject } from '../../types';
import { Plus, Link2, Calendar, BookOpen, User, Edit2 } from 'lucide-react';

export const ClassList: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

  // Form Class
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<number>(1);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string>('');

  // Form Assign
  const [classPlottingState, setClassPlottingState] = useState<Record<string, string>>({});
  const [savingClass, setSavingClass] = useState<boolean>(false);
  const [savingPlotting, setSavingPlotting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes, subjectsRes, classSubjectsRes] = await Promise.all([
        ApiClient.getClasses(),
        ApiClient.getTeachers(),
        ApiClient.getSubjects(),
        ApiClient.getClassSubjects()
      ]);
      setClasses(classesRes);
      setTeachers(teachersRes);
      setSubjects(subjectsRes);
      setClassSubjects(classSubjectsRes);
    } catch (error) {
      console.error('Failed loading classes page data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClassPlotting = (c: ClassRoom) => {
    setSelectedClassId(c.id);
    const subjectsInClass = classSubjects.filter(cs => cs.classId === c.id);
    const initialState: Record<string, string> = {};
    subjectsInClass.forEach(cs => {
      initialState[cs.subjectId] = cs.teacherId;
    });
    setClassPlottingState(initialState);
    setIsAssignModalOpen(true);
  };

  const handleOpenAddClass = () => {
    setSelectedClassId(null);
    setClassName('');
    setGradeLevel(1);
    setHomeroomTeacherId('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: ClassRoom) => {
    setSelectedClassId(c.id);
    setClassName(c.name);
    setGradeLevel(c.gradeLevel || 1);
    setHomeroomTeacherId(c.homeroomTeacherId || '');
    setIsClassModalOpen(true);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClass(true);
    try {
      const saved = await ApiClient.saveClass({
        id: selectedClassId || undefined,
        name: className,
        gradeLevel,
        homeroomTeacherId,
      });
      setClasses((current) => {
        return current.some((c) => c.id === saved.id)
          ? current.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
          : [...current, saved];
      });
      setIsClassModalOpen(false);
    } finally {
      setSavingClass(false);
    }
  };

  const handleSaveClassPlotting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setSavingPlotting(true);
    try {
      const promises: Promise<any>[] = [];
      const updated = [...classSubjects];

      for (const subject of subjects) {
        const teacherId = classPlottingState[subject.id];
        const existingIndex = updated.findIndex((cs) => cs.classId === selectedClassId && cs.subjectId === subject.id);
        const existing = existingIndex >= 0 ? updated[existingIndex] : null;

        if (teacherId) {
          if (!existing) {
            promises.push(ApiClient.assignSubject(selectedClassId, subject.id, teacherId));
            const teacher = teachers.find((t) => t.id === teacherId);
            const selectedClass = classes.find((c) => c.id === selectedClassId);
            updated.push({
              id: `cs-${Date.now()}-${subject.id}`,
              classId: selectedClassId,
              className: selectedClass?.name || '',
              subjectId: subject.id,
              teacherId,
              subjectName: subject.name,
              teacherName: teacher?.fullName || '',
            });
          } else if (existing.teacherId !== teacherId) {
            promises.push(ApiClient.assignSubject(selectedClassId, subject.id, teacherId));
            const teacher = teachers.find((t) => t.id === teacherId);
            updated[existingIndex] = {
              ...existing,
              teacherId,
              teacherName: teacher?.fullName || existing.teacherName,
            };
          }
        } else if (existing) {
          promises.push(ApiClient.removeSubject(selectedClassId, subject.id));
          updated.splice(existingIndex, 1);
        }
      }

      await Promise.all(promises);
      setClassSubjects(updated);
      setIsAssignModalOpen(false);
    } finally {
      setSavingPlotting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Daftar Rombongan Belajar & Penugasan Mengajar</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleOpenAddClass} disabled={savingClass || savingPlotting}>
            <Plus size={16} />
            Tambah Kelas Baru
          </button>
        </div>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="spinner"></div>
            <div>Memuat data...</div>
          </div>
        </div>
      ) : classes.length > 0 ? (
        <div className="grid-2">
          {classes.map((c) => {
          const subjectsInClass = classSubjects.filter((cs) => cs.classId === c.id);
          return (
            <div key={c.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-teal)' }}>Kelas {c.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <Calendar size={12} />
                    <span>Grade Level: {c.gradeLevel}</span>
                    <span style={{ color: 'var(--glass-border)' }}>|</span>
                    <span>{c.studentCount} Siswa</span>
                  </div>
                </div>
                {c.homeroomTeacherName ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block' }}>Wali Kelas</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{c.homeroomTeacherName}</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditClass(c)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                      Set Wali Kelas
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <BookOpen size={16} color="var(--accent-indigo)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {subjectsInClass.length} Mapel Diplot
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenClassPlotting(c)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    <Link2 size={14} style={{ marginRight: '6px' }}/> Atur Mapel
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditClass(c)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    <Edit2 size={14} style={{ marginRight: '6px' }}/> Edit Kelas
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Belum ada data kelas yang terdaftar.
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {isClassModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedClassId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
              <button className="close-btn" onClick={() => setIsClassModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Kelas</label>
                  <input type="text" className="form-control" value={className} onChange={(e) => setClassName(e.target.value)} required placeholder="7C, 8B, 9A" />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenjang/Tingkat Kelas (Grade Level)</label>
                  <select className="form-control" value={gradeLevel} onChange={(e) => setGradeLevel(parseInt(e.target.value, 10))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={g}>Kelas {g} {g <= 6 ? '(SD)' : g <= 9 ? '(SMP)' : '(SMA)'}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Wali Kelas</label>
                  <select className="form-control" value={homeroomTeacherId} onChange={(e) => setHomeroomTeacherId(e.target.value)} required>
                    <option value="">Pilih Wali Kelas...</option>
                    {teachers.filter(t => t.role === 'GURU').map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsClassModalOpen(false)} disabled={savingClass}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={savingClass}>
                  {savingClass ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN GURU & MAPEL MODAL */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Plotting Guru & Mata Pelajaran</h3>
              <button className="close-btn" onClick={() => setIsAssignModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveClassPlotting}>
              <div className="modal-body">
                {subjects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                    {subjects.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ flex: 1, paddingRight: '16px' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{s.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{s.code}</span>
                        </div>
                        <div style={{ width: '200px' }}>
                          <select 
                            className="form-control" 
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            value={classPlottingState[s.id] || ''}
                            onChange={(e) => setClassPlottingState({ ...classPlottingState, [s.id]: e.target.value })}
                          >
                            <option value="">(Belum Diplot)</option>
                            {teachers.filter(t => t.role === 'GURU').map(t => (
                              <option key={t.id} value={t.id}>{t.fullName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Belum ada data mata pelajaran.</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)} disabled={loading}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                      Menyimpan...
                    </span>
                  ) : 'Simpan Plotting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
