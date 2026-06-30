import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding SekolahPintar database...');

  // ═══════════════════════════════
  // 1. CREATE SCHOOL
  // ═══════════════════════════════
  const school = await prisma.school.create({
    data: {
      npsn: '20100001',
      name: 'SMP Negeri 1 Bandung',
      address: 'Jl. Merdeka No. 1, Bandung, Jawa Barat',
      phone: '022-1234567',
      email: 'admin@smpn1bandung.sch.id',
      status: 'NEGERI',
      level: 'SMP',
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Sumur Bandung',
    },
  });
  console.log('✅ School created:', school.name);

  // ═══════════════════════════════
  // 2. ACADEMIC YEAR & SEMESTERS
  // ═══════════════════════════════
  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: '2025/2026',
      startDate: new Date('2025-07-14'),
      endDate: new Date('2026-06-20'),
      isActive: true,
    },
  });

  const semester1 = await prisma.semester.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Ganjil',
      semesterNum: 1,
      startDate: new Date('2025-07-14'),
      endDate: new Date('2025-12-20'),
      isActive: false,
    },
  });

  const semester2 = await prisma.semester.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Genap',
      semesterNum: 2,
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-06-20'),
      isActive: true,
    },
  });
  console.log('✅ Academic year & semesters created');

  // ═══════════════════════════════
  // 3. SUBJECTS
  // ═══════════════════════════════
  const subjects = await Promise.all([
    prisma.subject.create({ data: { schoolId: school.id, name: 'Matematika', code: 'MTK' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Bahasa Indonesia', code: 'BIND' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Bahasa Inggris', code: 'BING' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'IPA (Ilmu Pengetahuan Alam)', code: 'IPA' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'IPS (Ilmu Pengetahuan Sosial)', code: 'IPS' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'PKN (Pendidikan Kewarganegaraan)', code: 'PKN' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Seni Budaya', code: 'SBD' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'PJOK (Pendidikan Jasmani)', code: 'PJOK' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Informatika', code: 'INF' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Pendidikan Agama Islam', code: 'PAI' } }),
  ]);
  console.log('✅ Subjects created:', subjects.length);

  // ═══════════════════════════════
  // 4. GRADE CATEGORIES
  // ═══════════════════════════════
  const categories = await Promise.all([
    prisma.gradeCategory.create({ data: { schoolId: school.id, name: 'Ulangan Harian', weight: 2.0 } }),
    prisma.gradeCategory.create({ data: { schoolId: school.id, name: 'UTS', weight: 3.0 } }),
    prisma.gradeCategory.create({ data: { schoolId: school.id, name: 'UAS', weight: 5.0 } }),
    prisma.gradeCategory.create({ data: { schoolId: school.id, name: 'Tugas', weight: 1.0 } }),
    prisma.gradeCategory.create({ data: { schoolId: school.id, name: 'Kuis', weight: 1.0 } }),
  ]);
  console.log('✅ Grade categories created');

  // ═══════════════════════════════
  // 5. TEACHERS
  // ═══════════════════════════════
  const adminTeacher = await prisma.teacher.create({
    data: {
      schoolId: school.id,
      fullName: 'Ir. Siti Rahayu, M.Pd.',
      email: 'admin@sekolahpintar.id',
      phone: '08123456789',
      passwordHash: await hashPassword('admin123'),
      role: 'ADMIN',
      gender: 'P',
      birthDate: new Date('1975-03-15'),
      birthPlace: 'Bandung',
    },
  });

  const superAdmin = await prisma.teacher.create({
    data: {
      schoolId: school.id, // technically doesn't matter for superadmin
      fullName: 'Super Admin SekolahPintar',
      email: 'superadmin@sekolahpintar.id',
      passwordHash: await hashPassword('superadmin123'),
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        nuptk: '1234567890123456',
        fullName: 'Budi Santoso, S.Pd.',
        email: 'budi@sekolahpintar.id',
        phone: '08129876543',
        passwordHash: await hashPassword('guru123'),
        role: 'GURU',
        gender: 'L',
        birthDate: new Date('1980-08-20'),
        birthPlace: 'Surabaya',
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        nuptk: '2345678901234567',
        fullName: 'Dewi Lestari, S.Pd.',
        email: 'dewi@sekolahpintar.id',
        phone: '08131234567',
        passwordHash: await hashPassword('guru123'),
        role: 'GURU',
        gender: 'P',
        birthDate: new Date('1985-12-10'),
        birthPlace: 'Jakarta',
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        nuptk: '3456789012345678',
        fullName: 'Ahmad Fauzi, S.Pd.',
        email: 'ahmad@sekolahpintar.id',
        phone: '08137654321',
        passwordHash: await hashPassword('guru123'),
        role: 'GURU',
        gender: 'L',
        birthDate: new Date('1990-05-25'),
        birthPlace: 'Yogyakarta',
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school.id,
        nuptk: '4567890123456789',
        fullName: 'Rina Wulandari, S.Pd.',
        email: 'rina@sekolahpintar.id',
        phone: '08141234567',
        passwordHash: await hashPassword('guru123'),
        role: 'GURU',
        gender: 'P',
        birthDate: new Date('1992-09-03'),
        birthPlace: 'Semarang',
      },
    }),
  ]);
  console.log('✅ Teachers created:', teachers.length + 1, '(including admin)');

  // ═══════════════════════════════
  // 6. CLASSES
  // ═══════════════════════════════
  const classes = await Promise.all([
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '7A', gradeLevel: 7, homeroomTeacherId: teachers[0].id },
    }),
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '7B', gradeLevel: 7, homeroomTeacherId: teachers[1].id },
    }),
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '8A', gradeLevel: 8, homeroomTeacherId: teachers[2].id },
    }),
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '9A', gradeLevel: 9, homeroomTeacherId: teachers[3].id },
    }),
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '9B', gradeLevel: 9 },
    }),
    prisma.class.create({
      data: { schoolId: school.id, academicYearId: academicYear.id, name: '9C', gradeLevel: 9 },
    }),
  ]);
  console.log('✅ Classes created:', classes.length);

  // ═══════════════════════════════
  // 7. STUDENTS — Realistic Indonesian names
  // ═══════════════════════════════
  const studentNames = [
    // Kelas 7A (30 siswa)
    { full: 'Kenzo Aditya Pratama', nick: 'Kenzo', gender: 'L' as const },
    { full: 'Putri Wulandari', nick: 'Putri', gender: 'P' as const },
    { full: 'Bagas Prasetyo', nick: 'Bagas', gender: 'L' as const },
    { full: 'Anisa Rahma Sari', nick: 'Anisa', gender: 'P' as const },
    { full: 'Rizky Firmansyah', nick: 'Rizky', gender: 'L' as const },
    { full: 'Nabila Azzahra', nick: 'Nabila', gender: 'P' as const },
    { full: 'Dimas Arya Putra', nick: 'Dimas', gender: 'L' as const },
    { full: 'Salsabila Maharani', nick: 'Salsa', gender: 'P' as const },
    { full: 'Farhan Dwi Cahyo', nick: 'Farhan', gender: 'L' as const },
    { full: 'Zahra Aulia Putri', nick: 'Zahra', gender: 'P' as const },
    { full: 'Muhammad Iqbal', nick: 'Iqbal', gender: 'L' as const },
    { full: 'Keysha Amelia', nick: 'Keysha', gender: 'P' as const },
    { full: 'Raffi Ahmad Hidayat', nick: 'Raffi', gender: 'L' as const },
    { full: 'Citra Dewi Anggraeni', nick: 'Citra', gender: 'P' as const },
    { full: 'Alvian Nugraha', nick: 'Alvian', gender: 'L' as const },
    { full: 'Intan Permatasari', nick: 'Intan', gender: 'P' as const },
    { full: 'Galang Ramadhan', nick: 'Galang', gender: 'L' as const },
    { full: 'Naura Syifa Hanum', nick: 'Naura', gender: 'P' as const },
    { full: 'Raka Surya Dharma', nick: 'Raka', gender: 'L' as const },
    { full: 'Alya Ramadhani', nick: 'Alya', gender: 'P' as const },
    { full: 'Daffa Mahendra', nick: 'Daffa', gender: 'L' as const },
    { full: 'Shafira Putri Andini', nick: 'Shafira', gender: 'P' as const },
    { full: 'Kenzo Prasetyo', nick: 'Kenzo P', gender: 'L' as const }, // Another Kenzo for testing disambiguation
    { full: 'Aurellia Rahmawati', nick: 'Aurel', gender: 'P' as const },
    { full: 'Fadhil Ardiansyah', nick: 'Fadhil', gender: 'L' as const },
    { full: 'Raisya Khairina', nick: 'Raisya', gender: 'P' as const },
    { full: 'Gibran Maulana', nick: 'Gibran', gender: 'L' as const },
    { full: 'Nayla Safitri', nick: 'Nayla', gender: 'P' as const },
    { full: 'Arka Dwi Putra', nick: 'Arka', gender: 'L' as const },
    { full: 'Bilqis Nuraini', nick: 'Bilqis', gender: 'P' as const },
  ];

  const studentNames8A = [
    { full: 'Hafiz Ramadhan', nick: 'Hafiz', gender: 'L' as const },
    { full: 'Azzura Safira', nick: 'Azzura', gender: 'P' as const },
    { full: 'Naufal Rizqullah', nick: 'Naufal', gender: 'L' as const },
    { full: 'Keyla Anggraeni', nick: 'Keyla', gender: 'P' as const },
    { full: 'Danish Pratama', nick: 'Danish', gender: 'L' as const },
    { full: 'Aqila Zahra', nick: 'Aqila', gender: 'P' as const },
    { full: 'Farel Adriansyah', nick: 'Farel', gender: 'L' as const },
    { full: 'Shakira Ayu', nick: 'Shakira', gender: 'P' as const },
    { full: 'Rayhan Maulana', nick: 'Rayhan', gender: 'L' as const },
    { full: 'Calista Putri', nick: 'Calista', gender: 'P' as const },
    { full: 'Arkana Dwi', nick: 'Arkana', gender: 'L' as const },
    { full: 'Quinsha Maharani', nick: 'Quinsha', gender: 'P' as const },
    { full: 'Zidan Hakim', nick: 'Zidan', gender: 'L' as const },
    { full: 'Freya Anindhita', nick: 'Freya', gender: 'P' as const },
    { full: 'Elang Pradipta', nick: 'Elang', gender: 'L' as const },
    { full: 'Kayla Azzahra', nick: 'Kayla', gender: 'P' as const },
    { full: 'Bintang Saputra', nick: 'Bintang', gender: 'L' as const },
    { full: 'Anindya Putri', nick: 'Anindya', gender: 'P' as const },
    { full: 'Satria Nugraha', nick: 'Satria', gender: 'L' as const },
    { full: 'Felicia Tanjung', nick: 'Felicia', gender: 'P' as const },
    { full: 'Abimanyu Wicaksono', nick: 'Abi', gender: 'L' as const },
    { full: 'Luna Safitri', nick: 'Luna', gender: 'P' as const },
    { full: 'Rakha Mahardika', nick: 'Rakha', gender: 'L' as const },
    { full: 'Jelita Amara', nick: 'Jelita', gender: 'P' as const },
    { full: 'Keanu Putra', nick: 'Keanu', gender: 'L' as const },
  ];

  // Create students for 7A
  const students7A = await Promise.all(
    studentNames.map((s, i) =>
      prisma.student.create({
        data: {
          schoolId: school.id,
          nisn: `00${1000 + i}`,
          nis: `2025${String(i + 1).padStart(3, '0')}`,
          fullName: s.full,
          nickname: s.nick,
          gender: s.gender,
          birthDate: new Date(2012, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          birthPlace: ['Bandung', 'Jakarta', 'Surabaya', 'Yogyakarta', 'Semarang'][Math.floor(Math.random() * 5)],
          religion: 'Islam',
          fatherName: `Bapak ${s.nick}`,
          fatherPhone: `0812${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          motherName: `Ibu ${s.nick}`,
          motherPhone: `0813${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          entryYear: 2025,
        },
      })
    )
  );

  // Create students for 8A
  const students8A = await Promise.all(
    studentNames8A.map((s, i) =>
      prisma.student.create({
        data: {
          schoolId: school.id,
          nisn: `00${2000 + i}`,
          nis: `2024${String(i + 1).padStart(3, '0')}`,
          fullName: s.full,
          nickname: s.nick,
          gender: s.gender,
          birthDate: new Date(2011, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          birthPlace: ['Bandung', 'Jakarta', 'Surabaya', 'Yogyakarta', 'Semarang'][Math.floor(Math.random() * 5)],
          religion: 'Islam',
          fatherName: `Bapak ${s.nick}`,
          motherName: `Ibu ${s.nick}`,
          entryYear: 2024,
        },
      })
    )
  );
  console.log('✅ Students created:', students7A.length + students8A.length);

  // ═══════════════════════════════
  // 8. ENROLL STUDENTS IN CLASSES
  // ═══════════════════════════════
  await Promise.all(
    students7A.map((s) =>
      prisma.classStudent.create({ data: { classId: classes[0].id, studentId: s.id } })
    )
  );
  await Promise.all(
    students8A.map((s) =>
      prisma.classStudent.create({ data: { classId: classes[2].id, studentId: s.id } })
    )
  );
  console.log('✅ Students enrolled in classes');

  // ═══════════════════════════════
  // 9. ASSIGN TEACHERS TO CLASS-SUBJECTS
  // ═══════════════════════════════
  const classSubjects = await Promise.all([
    // Budi mengajar MTK di 7A
    prisma.classSubject.create({
      data: {
        classId: classes[0].id, subjectId: subjects[0].id, teacherId: teachers[0].id,
        scheduleDay: 1, scheduleTime: '07:30', scheduleEndTime: '09:00',
      },
    }),
    // Budi mengajar MTK di 8A
    prisma.classSubject.create({
      data: {
        classId: classes[2].id, subjectId: subjects[0].id, teacherId: teachers[0].id,
        scheduleDay: 2, scheduleTime: '07:30', scheduleEndTime: '09:00',
      },
    }),
    // Dewi mengajar B.Indonesia di 7A
    prisma.classSubject.create({
      data: {
        classId: classes[0].id, subjectId: subjects[1].id, teacherId: teachers[1].id,
        scheduleDay: 1, scheduleTime: '09:15', scheduleEndTime: '10:45',
      },
    }),
    // Dewi mengajar B.Indonesia di 7B
    prisma.classSubject.create({
      data: {
        classId: classes[1].id, subjectId: subjects[1].id, teacherId: teachers[1].id,
        scheduleDay: 3, scheduleTime: '07:30', scheduleEndTime: '09:00',
      },
    }),
    // Ahmad mengajar IPA di 7A
    prisma.classSubject.create({
      data: {
        classId: classes[0].id, subjectId: subjects[3].id, teacherId: teachers[2].id,
        scheduleDay: 2, scheduleTime: '09:15', scheduleEndTime: '10:45',
      },
    }),
    // Ahmad mengajar IPA di 8A
    prisma.classSubject.create({
      data: {
        classId: classes[2].id, subjectId: subjects[3].id, teacherId: teachers[2].id,
        scheduleDay: 4, scheduleTime: '07:30', scheduleEndTime: '09:00',
      },
    }),
    // Rina mengajar B.Inggris di 7A
    prisma.classSubject.create({
      data: {
        classId: classes[0].id, subjectId: subjects[2].id, teacherId: teachers[3].id,
        scheduleDay: 3, scheduleTime: '09:15', scheduleEndTime: '10:45',
      },
    }),
    // Rina mengajar B.Inggris di 9A
    prisma.classSubject.create({
      data: {
        classId: classes[3].id, subjectId: subjects[2].id, teacherId: teachers[3].id,
        scheduleDay: 5, scheduleTime: '07:30', scheduleEndTime: '09:00',
      },
    }),
  ]);
  console.log('✅ Class-subject assignments created:', classSubjects.length);

  // ═══════════════════════════════
  // 10. SAMPLE GRADES
  // ═══════════════════════════════
  const gradeEntry1 = await prisma.gradeEntry.create({
    data: {
      classSubjectId: classSubjects[0].id, // MTK 7A
      categoryId: categories[0].id, // UH
      semesterId: semester2.id,
      title: 'Ulangan Harian 1 — Aljabar',
      maxScore: 100,
      date: new Date('2026-06-25'),
    },
  });

  // Add grades for all 7A students
  await Promise.all(
    students7A.map((s) =>
      prisma.grade.create({
        data: {
          gradeEntryId: gradeEntry1.id,
          studentId: s.id,
          score: Math.floor(Math.random() * 40) + 60, // 60-100
          inputMethod: 'MANUAL',
          createdById: teachers[0].id,
        },
      })
    )
  );
  console.log('✅ Sample grades created for UH 1 Matematika 7A');

  // ═══════════════════════════════
  // 11. SAMPLE ATTENDANCE
  // ═══════════════════════════════
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Promise.all(
    students7A.map((s, i) =>
      prisma.attendance.create({
        data: {
          classId: classes[0].id,
          studentId: s.id,
          date: today,
          status: i === 1 ? 'IZIN' : i === 2 ? 'SAKIT' : 'HADIR',
          notes: i === 1 ? 'Acara keluarga' : i === 2 ? 'Demam' : null,
          inputMethod: 'MANUAL',
          createdById: teachers[0].id,
        },
      })
    )
  );
  console.log('✅ Sample attendance created for 7A');

  // ═══════════════════════════════
  // 12. SAMPLE ACTIVITY LOGS
  // ═══════════════════════════════
  await prisma.activityLog.createMany({
    data: [
      {
        schoolId: school.id,
        teacherId: teachers[0].id,
        classId: classes[0].id,
        actionType: 'INPUT_NILAI',
        inputMethod: 'MANUAL',
        summary: '📊 Nilai UH 1 — Matematika\n30 siswa dinilai\nRata-rata: 78.5',
        detailData: { gradeEntryId: gradeEntry1.id, count: 30, average: 78.5 },
        referenceType: 'grade_entry',
        referenceId: gradeEntry1.id,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        schoolId: school.id,
        teacherId: teachers[0].id,
        classId: classes[0].id,
        actionType: 'INPUT_ABSENSI',
        inputMethod: 'VOICE',
        summary: '📋 Absensi 29 Juni 2026\n✅ 28 hadir | 📝 1 izin (Putri) | 🏥 1 sakit (Bagas)',
        detailData: { hadir: 28, izin: 1, sakit: 1, alpa: 0 },
        referenceType: 'attendance',
        createdAt: new Date(Date.now() - 1800000), // 30 min ago
      },
    ],
  });
  console.log('✅ Sample activity logs created');

  // ═══════════════════════════════
  // 13. TEACHER COLLABORATION GROUP
  // ═══════════════════════════════
  const mathGroup = await prisma.teacherGroup.create({
    data: {
      schoolId: school.id,
      name: 'MGMP Matematika',
      description: 'Musyawarah Guru Mata Pelajaran Matematika',
      groupType: 'MATA_PELAJARAN',
      createdById: teachers[0].id,
    },
  });

  await prisma.teacherGroupMember.create({
    data: { groupId: mathGroup.id, teacherId: teachers[0].id, role: 'ADMIN' },
  });
  console.log('✅ Teacher group created');

  // ═══════════════════════════════
  // 14. SCHEDULE EVENTS
  // ═══════════════════════════════
  await prisma.scheduleEvent.createMany({
    data: [
      {
        schoolId: school.id,
        teacherId: teachers[0].id,
        title: 'Mengajar MTK 7A',
        eventType: 'MENGAJAR',
        startTime: new Date('2026-06-30T07:30:00'),
        endTime: new Date('2026-06-30T09:00:00'),
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        classSubjectId: classSubjects[0].id,
      },
      {
        schoolId: school.id,
        teacherId: teachers[0].id,
        title: 'Rapat Guru Bulanan',
        eventType: 'RAPAT',
        startTime: new Date('2026-07-01T13:00:00'),
        endTime: new Date('2026-07-01T15:00:00'),
      },
    ],
  });
  console.log('✅ Schedule events created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:  admin@sekolahpintar.id / admin123');
  console.log('   Guru 1: budi@sekolahpintar.id / guru123');
  console.log('   Guru 2: dewi@sekolahpintar.id / guru123');
  console.log('   Guru 3: ahmad@sekolahpintar.id / guru123');
  console.log('   Guru 4: rina@sekolahpintar.id / guru123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
