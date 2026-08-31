import { useState, useEffect } from 'react';
import { getMyCertificates } from '../api/certificateApi';
import { useAuth } from '../context/AuthContext';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    getMyCertificates()
      .then(res => { 
        setCerts(res.data || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  // Retrieve current logged-in user details from auth state or localStorage
  const savedUserStr = localStorage.getItem('olms_user');
  let activeUser = user;
  if (!activeUser && savedUserStr) {
    try { activeUser = JSON.parse(savedUserStr); } catch {}
  }

  // Format logged-in username / name cleanly
  const rawIdentifier = activeUser?.fullName || activeUser?.email || '';
  const formattedUserName = rawIdentifier.includes('@') 
    ? rawIdentifier.split('@')[0].charAt(0).toUpperCase() + rawIdentifier.split('@')[0].slice(1)
    : rawIdentifier || 'Learner';

  const handleOpenModal = (cert) => {
    setSelectedCert(cert);
    setCustomName(formattedUserName);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Certificates</h1>
        <p>Your earned achievements and verified course certifications</p>
      </div>

      {certs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          <h3>No certificates earned yet</h3>
          <p>Complete course assessments to automatically earn verified certificates</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {certs.map(cert => {
            const courseTitle = cert.course?.title || cert.certificateName?.replace(' Certificate of Completion', '') || 'General Course';
            const instructor = cert.course?.instructor || 'OLMS Academy';

            return (
              <div key={cert.id} className="card" style={{ textAlign: 'center', padding: '28px 20px', position: 'relative' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  margin: '0 auto 16px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                }}>
                  🏆
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.5px' }}>
                    Course Certificate
                  </span>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {courseTitle}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '4px', fontWeight: 600 }}>
                  👤 Awarded to: <span style={{ color: 'var(--primary)' }}>{formattedUserName}</span>
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  <div>📅 Issued: {cert.issuedDate || 'Recently'}</div>
                  <div>🎓 Instructor: {instructor}</div>
                </div>

                <button 
                  className="btn btn-sm btn-primary btn-block"
                  onClick={() => handleOpenModal(cert)}>
                  View Official Certificate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Certificate Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', padding: '36px', border: '3px solid #10b981', borderRadius: '16px', background: 'var(--bg-card)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                CERTIFICATE OF COMPLETION
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ONLINE LEARNING MANAGEMENT SYSTEM
              </p>

              <div style={{ margin: '24px 0', borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '6px' }}>This is to certify that</p>
                
                <div style={{ margin: '12px 0' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '1.6rem', 
                      fontWeight: 800, 
                      color: '#10b981', 
                      border: 'none', 
                      borderBottom: '2px solid #10b981',
                      borderRadius: '0',
                      background: 'transparent',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}
                    title="Click to edit name on certificate"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>(Logged-in user name — click to edit before printing)</div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '12px' }}>has successfully completed the course</p>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>
                  {selectedCert.course?.title || selectedCert.certificateName}
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>
                  <strong>Issue Date:</strong> {selectedCert.issuedDate || 'N/A'}
                </div>
                <div>
                  <strong>Certificate ID:</strong> OLMS-CERT-{selectedCert.id}
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Print / Download PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedCert(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
