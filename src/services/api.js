/**
 * Centralized API & Storage Adapter
 * Communicates with backend endpoints (default: http://localhost:5000/api)
 * Includes robust local persistence fallback to ensure seamless zero-crash functionality.
 */

const BASE_URL = 'http://localhost:5000/api';
const STORAGE_PREFIX = 'sikarir_';

// Seed Initial Storage if empty
export function initSeedData() {
  if (!localStorage.getItem(`${STORAGE_PREFIX}initialized`)) {
    // 1. Initial Users
    const initialUsers = [
      {
        id: 'usr_admin_1',
        name: 'Administrator Karir',
        email: 'admin@karir.go.id',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        phone: '081234567890',
        token: 'token_admin_mock'
      },
      {
        id: 'usr_pk_1',
        name: 'Rizky Pratama, S.Kom',
        email: 'rizky.pratama@gmail.com',
        role: 'PencariKerja',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
        phone: '082198765432',
        headline: 'Frontend Developer & UI/UX Specialist',
        statusKarir: 'Bekerja', // 'Menganggur' | 'Magang' | 'Bekerja' | 'Pelatihan'
        location: 'Jakarta Selatan, DKI Jakarta',
        bio: 'Fresh Graduate Ilmu Komputer dengan pengalaman pengembangan antarmuka web modern menggunakan React, JavaScript, dan REST API.',
        targetGaji: 9000000,
        token: 'token_pk_mock'
      },
      {
        id: 'usr_pt_1',
        name: 'PT Telkom Digital Solusi',
        email: 'hrd@telkomdigital.co.id',
        role: 'Perusahaan',
        avatar: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=200&q=80',
        industry: 'Teknologi Informasi & Telekomunikasi',
        location: 'Jakarta Pusat, DKI Jakarta',
        website: 'https://telkomdigital.co.id',
        verified: true,
        description: 'Perusahaan BUMN penyedia solusi transformasi digital, infrastruktur cloud, dan aplikasi cerdas terkemuka di Asia Tenggara.',
        token: 'token_pt_mock'
      }
    ];

    // 2. Initial Jobs (Lowongan)
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
        statusVerifikasi: 'Disetujui', // 'Menunggu' | 'Disetujui' | 'Ditolak'
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

    // 3. Initial Applications (Lamaran)
    const initialApplications = [
      {
        id: 'app_1',
        jobId: 'job_1',
        jobTitle: 'Junior React Frontend Developer',
        companyName: 'PT Telkom Digital Solusi',
        applicantId: 'usr_pk_1',
        applicantName: 'Rizky Pratama, S.Kom',
        applicantEmail: 'rizky.pratama@gmail.com',
        applicantPhone: '082198765432',
        matchScore: 94,
        status: 'Jadwal Wawancara', // 'Terkirim' | 'Seleksi Berkas' | 'Jadwal Wawancara' | 'Diterima' | 'Ditolak'
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

    // 4. Initial Education Records
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

    // 5. Initial Work Experience Records
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

    // 6. Initial Skills Records
    const initialSkills = [
      { id: 'skl_1', userId: 'usr_pk_1', name: 'React', category: 'Frontend', level: 5, verified: true },
      { id: 'skl_2', userId: 'usr_pk_1', name: 'JavaScript', category: 'Frontend', level: 5, verified: true },
      { id: 'skl_3', userId: 'usr_pk_1', name: 'CSS3 / Vanilla CSS', category: 'Frontend', level: 5, verified: true },
      { id: 'skl_4', userId: 'usr_pk_1', name: 'REST API', category: 'Backend Integration', level: 4, verified: true },
      { id: 'skl_5', userId: 'usr_pk_1', name: 'Git & GitHub', category: 'Tools', level: 4, verified: true },
      { id: 'skl_6', userId: 'usr_pk_1', name: 'SQL', category: 'Database', level: 3, verified: false }
    ];

    // 7. Initial Career Activity Milestones
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

    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(initialUsers));
    localStorage.setItem(`${STORAGE_PREFIX}jobs`, JSON.stringify(initialJobs));
    localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(initialApplications));
    localStorage.setItem(`${STORAGE_PREFIX}educations`, JSON.stringify(initialEducations));
    localStorage.setItem(`${STORAGE_PREFIX}experiences`, JSON.stringify(initialExperiences));
    localStorage.setItem(`${STORAGE_PREFIX}skills`, JSON.stringify(initialSkills));
    localStorage.setItem(`${STORAGE_PREFIX}activities`, JSON.stringify(initialActivities));
    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
}

// Auto-run initialization
initSeedData();

/**
 * Universal Storage & API Helper
 */
export const api = {
  // Try calling actual backend if available; fallback gracefully
  async get(endpoint) {
    try {
      const token = localStorage.getItem(`${STORAGE_PREFIX}token`);
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Server returned ${res.status}`);
    } catch {
      // Fallback local persistence
      return null;
    }
  },

  // Local Storage Generic Operations
  getCollection(name) {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    return data ? JSON.parse(data) : [];
  },

  setCollection(name, items) {
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(items));
    return items;
  },

  addItem(name, item) {
    const list = this.getCollection(name);
    const newItem = {
      id: `${name.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      ...item
    };
    list.unshift(newItem);
    this.setCollection(name, list);
    return newItem;
  },

  updateItem(name, id, updates) {
    const list = this.getCollection(name);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
      this.setCollection(name, list);
      return list[index];
    }
    return null;
  },

  deleteItem(name, id) {
    const list = this.getCollection(name);
    const filtered = list.filter(i => i.id !== id);
    this.setCollection(name, filtered);
    return true;
  }
};

export default api;
