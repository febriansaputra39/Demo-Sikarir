import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { matchingService } from '../../services/matchingService';
import Badge from '../../components/common/Badge';
import { Cpu, Sliders, Sparkles, AlertTriangle } from 'lucide-react';

export function SmartMatching() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Algorithm Weights
  const [weights, setWeights] = useState({
    skills: 50,
    experience: 20,
    education: 15,
    location: 15
  });

  // Simulator selections
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    const rawUsers = api.getCollection('users');
    const rawJobs = api.getCollection('jobs');

    const users = (Array.isArray(rawUsers) ? rawUsers : []).filter(
      (u) => u.role === 'PencariKerja'
    );
    const allJobs = Array.isArray(rawJobs) ? rawJobs : [];

    setCandidates(users);
    setJobs(allJobs);

    if (users.length > 0) setSelectedCandidateId(users[0].id);
    if (allJobs.length > 0) setSelectedJobId(allJobs[0].id);
  }, []);

  const totalWeight =
    weights.skills + weights.experience + weights.education + weights.location;

  const handleRunSimulation = useCallback(() => {
    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    const job = jobs.find((j) => j.id === selectedJobId);

    if (!candidate || !job) return;

    const rawSkills = api.getCollection('skills');
    const rawExperiences = api.getCollection('experiences');
    const rawEducations = api.getCollection('educations');

    const candidateSkills = (Array.isArray(rawSkills) ? rawSkills : []).filter(
      (s) => s.userId === candidate.id
    );
    const candidateExperiences = (
      Array.isArray(rawExperiences) ? rawExperiences : []
    ).filter((e) => e.userId === candidate.id);
    const candidateEducations = (
      Array.isArray(rawEducations) ? rawEducations : []
    ).filter((e) => e.userId === candidate.id);

    const enrichedCandidate = {
      ...candidate,
      skills: candidateSkills,
      experiences: candidateExperiences,
      educationLevel: candidateEducations[0]?.degree || 'S1'
    };

    const decimalWeights = {
      skills: weights.skills / 100,
      experience: weights.experience / 100,
      education: weights.education / 100,
      location: weights.location / 100
    };

    const result = matchingService.calculateMatch(
      enrichedCandidate,
      job,
      decimalWeights
    );
    setSimulationResult(result);
  }, [candidates, jobs, selectedCandidateId, selectedJobId, weights]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Mesin Pencocokan Cerdas (Smart Matching Engine)
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Konfigurasi parameter pembobotan algoritma AI dan lakukan simulasi kalkulasi kecocokan kompetensi kandidat terhadap kebutuhan lowongan.
        </p>
      </div>

      <div className="grid grid-cols-3 mb-6">
        {/* Left: Weight Tuning */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Sliders size={20} color="#4f46e5" />
              <span>Kalibrasi Bobot Penilaian</span>
            </h3>
            <Badge variant={totalWeight === 100 ? 'success' : 'danger'}>
              Total: {totalWeight}%
            </Badge>
          </div>

          {totalWeight !== 100 && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                Total bobot saat ini <strong>{totalWeight}%</strong>. Sesuaikan hingga tepat <strong>100%</strong> untuk menjalankan simulasi.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Kesesuaian Keahlian (Skills)</span>
                <span style={{ color: '#4f46e5' }}>{weights.skills}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={weights.skills}
                onChange={(e) => setWeights({ ...weights, skills: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Pengalaman Kerja (Years of Exp)</span>
                <span style={{ color: '#4f46e5' }}>{weights.experience}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={weights.experience}
                onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Jenjang Pendidikan Formal</span>
                <span style={{ color: '#4f46e5' }}>{weights.education}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={weights.education}
                onChange={(e) => setWeights({ ...weights, education: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Domisili & Preferensi Kerja</span>
                <span style={{ color: '#4f46e5' }}>{weights.location}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={weights.location}
                onChange={(e) => setWeights({ ...weights, location: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <button
              type="button"
              onClick={() => setWeights({ skills: 50, experience: 20, education: 15, location: 15 })}
              className="btn btn-secondary btn-sm mt-2"
            >
              Reset ke Standar Default
            </button>
          </div>
        </div>

        {/* Right: Simulation Simulator Playground */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Cpu size={20} color="#7c3aed" />
              <span>Simulasi Uji Coba Pencocokan AI</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Sandbox Test</span>
          </div>

          <div className="grid grid-cols-2 mb-4">
            <div className="form-group">
              <label className="form-label">Pilih Kandidat Pencari Kerja:</label>
              <select
                className="form-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                disabled={candidates.length === 0}
              >
                {candidates.length === 0 ? (
                  <option value="">Belum ada data kandidat</option>
                ) : (
                  candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.headline || 'Pencari Kerja'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Lowongan Pekerjaan Target:</label>
              <select
                className="form-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                disabled={jobs.length === 0}
              >
                {jobs.length === 0 ? (
                  <option value="">Belum ada data lowongan</option>
                ) : (
                  jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.companyName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={totalWeight !== 100 || !selectedCandidateId || !selectedJobId}
            className="btn btn-primary btn-sm mb-6"
          >
            <Sparkles size={16} /> Kalkulasi Skor Kecocokan
          </button>

          {/* Simulation Output Card */}
          {simulationResult ? (
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>HASIL SKOR REKOMENDASI:</span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#4f46e5' }}>
                    {simulationResult.score ?? 0}%
                  </div>
                </div>
                {simulationResult.grade && (
                  <Badge variant={(simulationResult.score || 0) >= 80 ? 'success' : 'purple'} dot>
                    {simulationResult.grade}
                  </Badge>
                )}
              </div>

              {/* Progress bar */}
              <div className="match-progress-bar mb-4" style={{ height: '10px' }}>
                <div
                  className={`match-progress-fill ${(simulationResult.score || 0) >= 80 ? 'high' : ''}`}
                  style={{ width: `${Math.min(100, Math.max(0, simulationResult.score || 0))}%` }}
                />
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-4 mb-4" style={{ fontSize: '0.82rem' }}>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Keahlian</div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{simulationResult.breakdown?.skillsScore ?? 0}%</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Pengalaman</div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{simulationResult.breakdown?.experienceScore ?? 0}%</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Pendidikan</div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{simulationResult.breakdown?.educationScore ?? 0}%</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Lokasi</div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{simulationResult.breakdown?.locationScore ?? 0}%</strong>
                </div>
              </div>

              {/* Skill matches tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Keahlian Cocok ({simulationResult.matchedSkills?.length || 0}):
                  </span>
                  {simulationResult.matchedSkills?.length > 0 ? (
                    simulationResult.matchedSkills.map((s, i) => (
                      <span key={i} style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#64748b' }}>Tidak ada keahlian yang cocok</span>
                  )}
                </div>

                {simulationResult.missingSkills?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                      Keahlian Belum Dimiliki ({simulationResult.missingSkills.length}):
                    </span>
                    {simulationResult.missingSkills.map((s, i) => (
                      <span key={i} style={{ background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                        ! {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              Pilih kandidat dan lowongan di atas, lalu klik "Kalkulasi Skor Kecocokan" untuk melihat simulasi rekomendasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartMatching;