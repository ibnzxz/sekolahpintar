import React from 'react';
import { 
  Users, 
  GraduationCap, 
  School, 
  Percent, 
  TrendingUp, 
  Award,
  CheckCircle,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ApiClient } from '../api/client';

export const Dashboard: React.FC = () => {
  const [students, setStudents] = React.useState<any[]>([]);
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, t, c, u] = await Promise.all([
          ApiClient.getStudents(),
          ApiClient.getTeachers(),
          ApiClient.getClasses(),
          ApiClient.getCurrentUser().catch(() => null),
        ]);
        setStudents(s);
        setTeachers(t);
        setClasses(c);
        setUser(u);
      } catch (error) {
        console.error('Failed loading dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Memuat data dashboard...</div>;

  const stats = [
    { label: 'Total Siswa', value: students.length, icon: Users, change: 'Siswa aktif', color: 'var(--accent-primary)' },
    { label: 'Total Guru', value: teachers.length, icon: GraduationCap, change: 'Guru terdaftar', color: 'var(--accent-secondary)' },
    { label: 'Total Kelas', value: classes.length, icon: School, change: 'Rombel aktif', color: 'var(--info)' },
    { label: 'Total Hadir', value: '-', icon: Percent, change: 'Data belum ada', color: 'var(--success)' },
  ];

  // Charts Data
  const gradeData: any[] = [];

  const attendanceData: any[] = [];

  const trendData: any[] = [];

  const recentActivities: any[] = [];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(99, 102, 241, 0.05))',
        border: '1px solid rgba(20, 184, 166, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>Selamat Datang, {user?.fullName || 'Pengguna'}! 👋</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong>{user?.schoolName || 'Sekolah Pintar'}</strong> • Tahun Ajaran <strong>2025/2026</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status Akreditasi</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-teal)' }}>Grade A</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status Dapodik</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>Tersinkron</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px' }}>{stat.value}</h3>
                </div>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '10px', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: stat.color
                }}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: '24px' }}></div>

      {/* Charts Grid */}
      <div className="grid-3">
        {/* Rata-rata Nilai */}
        <div className="card" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <h3 className="card-title">
            <TrendingUp size={16} color="var(--accent-teal)" />
            Rata-rata Nilai Mapel per Kelas
          </h3>
          <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {gradeData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="nilai" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Belum ada data nilai semester ini.</div>
            )}
          </div>
        </div>

        {/* Kehadiran Donut */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title">
            <CheckCircle size={16} color="var(--success)" />
            Status Kehadiran Siswa
          </h3>
          <div style={{ width: '100%', height: '180px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {attendanceData.length > 0 ? (
              <>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>94.2%</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Hadir</div>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Data kehadiran belum diinput.</div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '16px' }}>
            {attendanceData.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: '24px' }}></div>

      {/* Analytics Trend and Activities */}
      <div className="grid-3">
        {/* Trend Perkembangan */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title">
            <Award size={16} color="var(--accent-indigo)" />
            Tren Nilai Sekolah
          </h3>
          <div style={{ width: '100%', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="bulan" stroke="var(--text-secondary)" fontSize={10} />
                  <YAxis domain={[50, 100]} stroke="var(--text-secondary)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }} />
                  <Line type="monotone" dataKey="nilai" stroke="var(--accent-indigo)" strokeWidth={2} dot={{ fill: 'var(--accent-indigo)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Belum ada histori nilai.</div>
            )}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="card" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <h3 className="card-title">
            <FileText size={16} color="var(--info)" />
            Aktivitas Guru Terbaru
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities.length > 0 ? recentActivities.map((act) => (
              <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    marginTop: '2px',
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    backgroundColor: act.type === 'nilai' ? 'var(--accent-teal-glow)' : act.type === 'absen' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.65rem'
                  }}>
                    {act.type === 'nilai' ? '📊' : act.type === 'absen' ? '📋' : '📚'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {act.desc}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', marginLeft: '20px' }}>
                  {act.time}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                Belum ada aktivitas guru yang terekam.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
