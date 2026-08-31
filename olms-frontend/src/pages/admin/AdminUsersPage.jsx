import { useState, useEffect } from 'react';
import { getAllAuditLogs } from '../../api/auditLogApi';

export default function AdminUsersPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAuditLogs().then(res => { setLogs(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Users &amp; Audit Logs</h1><p>Monitor platform activity and user actions</p></div>

      {logs.length === 0 ? (
        <div className="empty-state"><h3>No audit logs</h3><p>System activity will appear here</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                  <td>{log.user?.email || log.user?.fullName || '—'}</td>
                  <td><span className="badge badge-primary">{log.action}</span></td>
                  <td>{log.entityName || '—'}</td>
                  <td>{log.entityId || '—'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
