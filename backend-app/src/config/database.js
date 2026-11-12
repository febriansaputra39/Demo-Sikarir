const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DATA_PATH } = require('./environment');

let db = {
  users: [],
  educations: [],
  experiences: [],
  skills: [],
  activities: [],
  jobs: [],
  applications: [],
  notifications: []
};

function getSeedData() {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const initialUsers = [
    {
      id: 'usr_admin_1',
      name: 'Administrator Karir',
      email: 'admin@karir.go.id',
      password: hashedPassword,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      phone: '081234567890',
      verified: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_pk_1',
      name: 'Rizky Pratama, S.Kom',
      email: 'rizky.pratama@gmail.com',
      password: hashedPassword,
      role: 'PencariKerja',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      phone: '082198765432',
      headline: 'Frontend Developer & UI/UX Specialist',
      statusKarir: 'Bekerja',
      location: 'Jakarta Selatan, DKI Jakarta',
      bio: 'Fresh Graduate Ilmu Komputer dengan pengalaman pengembangan antarmuka web modern menggunakan React, JavaScript, dan REST API.',
      targetGaji: 9000000,
      verified: true,
      createdAt: '2026-01-15T00:00:00.000Z'
    },
    {
      id: 'usr_pt_1',
      name: 'PT Telkom Digital Solusi',
      email: 'hrd@telkomdigital.co.id',
      password: hashedPassword,
      role: 'Perusahaan',
      avatar: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=200&q=80',
      industry: 'Teknologi Informasi & Telekomunikasi',
      location: 'Jakarta Pusat, DKI Jakarta',
      website: 'https://telkomdigital.co.id',
      verified: true,
      description: 'Perusahaan BUMN penyedia solusi transformasi digital, infrastruktur cloud, dan aplikasi cerdas terkemuka di Asia Tenggara.',
      createdAt: '2026-01-10T00:00:00.000Z'
    }
  ];

  const initialJobs = [
    {
      id: 'job_1',
      companyId: 'usr_pt_1',
      companyName: 'PT Telkom Digital Solusi',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80',
      title: 'Junior React Frontend Developer',
      category: 'IT & Software',
      jobType: 'Full Time',
      workplaceType: 'Hybrid',
      location: 'Jakarta Pusat, DKI Jakarta',
      salaryMin: 7500000,
      salaryMax: 11000000,
      experienceLevel: '1-3 tahun',
      educationLevel: 'S1 / D4',
      requiredSkills: ['React', 'JavaScript', 'CSS3', 'REST API', 'Git'],
      description: 'Kami mencari talenta Frontend Developer yang antusias mengembangkan aplikasi berskala enterprise dengan standar arsitektur modern.',
      responsibilities: [
        'Mengembangkan antarmuka pengguna web menggunakan React dan Vanilla CSS yang responsif.',
        'Mengintegrasikan API RESTful bersama tim backend.',
        'Melakukan pengujian performa dan optimasi kecepatan aplikasi.'
      ],
      requirements: [
        'Pendidikan minimal S1 Teknik Informatika, Ilmu Komputer, atau bidang terkait.',
        'Pengalaman 1+ tahun dengan React.js dan state management.',
        'Memahami responsive layout dan cross-browser compatibility.'
      ],
      statusVerifikasi: 'Disetujui',
      isActive: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      applicantCount: 14
    },
    {
      id: 'job_2',
      companyId: 'usr_pt_1',
      companyName: 'PT Telkom Digital Solusi',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80',
      title: 'Data Analyst & Visualization',
      category: 'Data & AI',
      jobType: 'Full Time',
      workplaceType: 'On-site',
      location: 'Bandung, Jawa Barat',
      salaryMin: 8000000,
      salaryMax: 12500000,
      experienceLevel: '1-2 tahun',
      educationLevel: 'S1',
      requiredSkills: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel'],
      description: 'Menganalisis tren data penyerapan tenaga kerja dan menyiapkan dashboard laporan eksekutif.',
      responsibilities: [
        'Menyusun query analitik database dan visualisasi tren berkala.',
        'Berkoordinasi dengan tim bisnis untuk menghasilkan insight data akurat.'
      ],
      requirements: [
        'Mahir SQL dan visualisasi data menggunakan Power BI atau Tableau.',
        'Memiliki daya analisis numerik yang kritis.'
      ],
      statusVerifikasi: 'Disetujui',
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      applicantCount: 22
    },
    {
      id: 'job_3',
      companyId: 'usr_pt_1',
      companyName: 'PT Telkom Digital Solusi',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80',
      title: 'UI/UX Product Designer',
      category: 'Desain Grafis & UI/UX',
      jobType: 'Full Time',
      workplaceType: 'Remote',
      location: 'Jakarta Selatan, DKI Jakarta',
      salaryMin: 9000000,
      salaryMax: 13000000,
      experienceLevel: '2+ tahun',
      educationLevel: 'D3 / S1',
      requiredSkills: ['Figma', 'UI/UX', 'Wireframing', 'Prototyping', 'Design System'],
      description: 'Merancang pengalaman visual produk digital yang elegan dan mudah digunakan jutaan pengguna.',
      responsibilities: [
        'Membuat user flow, wireframe, dan prototipe high-fidelity.',
        'Mengembangkan design system terstandar.'
      ],
      requirements: [
        'Portofolio UI/UX yang kuat.',
        'Keahlian mendalam dalam Figma dan usability testing.'
      ],
      statusVerifikasi: 'Menunggu',
      isActive: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      applicantCount: 7
    }
  ];

  const initialApplications = [
    {
      id: 'app_1',
      jobId: 'job_1',
      jobTitle: 'Junior React Frontend Developer',
      companyId: 'usr_pt_1',
      companyName: 'PT Telkom Digital Solusi',
      applicantId: 'usr_pk_1',
      applicantName: 'Rizky Pratama, S.Kom',
      applicantEmail: 'rizky.pratama@gmail.com',
      applicantPhone: '082198765432',
      matchScore: 94,
      status: 'Jadwal Wawancara',
      coverLetter: 'Saya memiliki antusiasme dan keahlian di bidang pengembangan frontend modern dengan React dan optimasi antarmuka pengguna.',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'Terkirim', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Lamaran berhasil diajukan' },
        { status: 'Seleksi Berkas', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Berkas portofolio memenuhi kriteria' },
        { status: 'Jadwal Wawancara', timestamp: new Date().toISOString(), note: 'Undangan wawancara teknis via Google Meet' }
      ]
    }
  ];

  const initialEducations = [
    {
      id: 'edu_1',
      userId: 'usr_pk_1',
      institution: 'Universitas Indonesia',
      degree: 'S1',
      major: 'Ilmu Komputer',
      gpa: '3.82',
      startYear: '2020',
      endYear: '2024',
      description: 'Lulus dengan predikat Cum Laude. Fokus riset sistem temu balik informasi dan web architecture.'
    }
  ];

  const initialExperiences = [
    {
      id: 'exp_1',
      userId: 'usr_pk_1',
      company: 'PT Inovasi Teknologi Nusantara',
      position: 'Junior Frontend Developer',
      jobType: 'Full Time',
      startDate: '2024-03-01',
      endDate: null,
      isCurrent: true,
      location: 'Jakarta, Indonesia',
      responsibilities: 'Mengembangkan dashboard analitik karir, mengoptimalkan re-rendering komponen, dan membangun reusable components.'
    }
  ];

  const initialSkills = [
    { id: 'skl_1', userId: 'usr_pk_1', name: 'React', category: 'Frontend', level: 5, verified: true },
    { id: 'skl_2', userId: 'usr_pk_1', name: 'JavaScript', category: 'Frontend', level: 5, verified: true },
    { id: 'skl_3', userId: 'usr_pk_1', name: 'CSS3 / Vanilla CSS', category: 'Frontend', level: 5, verified: true },
    { id: 'skl_4', userId: 'usr_pk_1', name: 'REST API', category: 'Backend Integration', level: 4, verified: true },
    { id: 'skl_5', userId: 'usr_pk_1', name: 'Git & GitHub', category: 'Tools', level: 4, verified: true },
    { id: 'skl_6', userId: 'usr_pk_1', name: 'SQL', category: 'Database', level: 3, verified: false }
  ];

  const initialActivities = [
    {
      id: 'act_1',
      userId: 'usr_pk_1',
      title: 'Sertifikasi Profesi Front End Web Specialist',
      category: 'Sertifikasi',
      provider: 'BNSP / Lembaga Sertifikasi Profesi',
      date: '2024-05-15',
      description: 'Uji kompetensi kelayakan pengembangan aplikasi web standar industri nasional.'
    },
    {
      id: 'act_2',
      userId: 'usr_pk_1',
      title: 'National Tech Job Fair & Networking 2024',
      category: 'Job Fair',
      provider: 'Kementerian Ketenagakerjaan',
      date: '2024-08-20',
      description: 'Menghadiri sesi bursa kerja dan wawancara pendahuluan dengan recruiter digital.'
    }
  ];

  return {
    users: initialUsers,
    jobs: initialJobs,
    applications: initialApplications,
    educations: initialEducations,
    experiences: initialExperiences,
    skills: initialSkills,
    activities: initialActivities,
    notifications: []
  };
}

function initDatabase() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_PATH)) {
    db = getSeedData();
    saveDatabase();
    console.log('Database initialized with default seed data.');
  } else {
    try {
      const data = fs.readFileSync(DATA_PATH, 'utf-8');
      db = JSON.parse(data);
      // Ensure all collections exist
      ['users', 'jobs', 'applications', 'educations', 'experiences', 'skills', 'activities', 'notifications'].forEach(key => {
        if (!Array.isArray(db[key])) {
          db[key] = [];
        }
      });
    } catch (err) {
      console.error('Failed reading database file, resetting to seed:', err);
      db = getSeedData();
      saveDatabase();
    }
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to database file:', err);
  }
}

// Database helper functions
const dbService = {
  get(collectionName) {
    return db[collectionName] || [];
  },

  find(collectionName, predicate) {
    const col = this.get(collectionName);
    return col.find(predicate);
  },

  filter(collectionName, predicate) {
    const col = this.get(collectionName);
    return col.filter(predicate);
  },

  findById(collectionName, id) {
    const col = this.get(collectionName);
    return col.find(item => item.id === id);
  },

  insert(collectionName, item) {
    if (!db[collectionName]) {
      db[collectionName] = [];
    }
    const newItem = {
      id: item.id || `${collectionName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      ...item
    };
    db[collectionName].unshift(newItem);
    saveDatabase();
    return newItem;
  },

  update(collectionName, id, updates) {
    const col = this.get(collectionName);
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return null;

    db[collectionName][index] = {
      ...db[collectionName][index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveDatabase();
    return db[collectionName][index];
  },

  delete(collectionName, id) {
    const col = this.get(collectionName);
    const initialLength = col.length;
    db[collectionName] = col.filter(item => item.id !== id);
    const deleted = db[collectionName].length < initialLength;
    if (deleted) {
      saveDatabase();
    }
    return deleted;
  },

  reset() {
    db = getSeedData();
    saveDatabase();
    return true;
  }
};

// Initialize right away
initDatabase();

module.exports = {
  db,
  initDatabase,
  saveDatabase,
  dbService
};
