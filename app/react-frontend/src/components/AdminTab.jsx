import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin;

function AdminTab({ showToast, currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      showToast('Failed to load users', true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (username, approve) => {
    try {
      const res = await fetch(`${API_BASE}/auth/approve/${username}?approved=${approve}`, { method: 'POST' });
      if (res.ok) {
        showToast(`User ${username} ${approve ? 'approved' : 'revoked'}!`);
        loadUsers();
      } else {
        showToast(`Action failed.`, true);
      }
    } catch (e) {
      showToast(`Server error.`, true);
    }
  };

  const deleteUser = async (username) => {
    if (!confirm(`Are you sure you want to delete ${username}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/auth/${username}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`User ${username} deleted!`);
        loadUsers();
      } else {
        showToast(`Delete failed.`, true);
      }
    } catch (e) {
      showToast(`Server error.`, true);
    }
  };

  const updateUserRole = async (username, role) => {
    try {
      const res = await fetch(`${API_BASE}/auth/role/${username}?role=${role}`, { method: 'POST' });
      if (res.ok) {
        showToast(`User ${username} role changed to ${role}!`);
        loadUsers();
      } else {
        showToast(`Role change failed.`, true);
      }
    } catch (e) {
      showToast(`Server error.`, true);
    }
  };

  return (
    <div className="glass-panel card">
      <h3>🔑 Admin Management</h3>
      <p className="caption">Manage user approvals, roles, and accounts.</p>
      <div className="table-container mt-2">
        {isLoading ? (
          <div className="spinner"></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = (u.username === currentUser);
                return (
                  <tr key={u.username}>
                    <td><strong>{u.username}</strong> {isSelf ? '(You)' : ''}</td>
                    <td style={{color:'#aaa'}}>{u.email || 'N/A'}</td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => updateUserRole(u.username, e.target.value)}
                        disabled={isSelf}
                        style={{padding:'4px', fontSize:'0.8rem', background:'var(--secondary-color)', color:'var(--text-color)', border:'none', borderRadius:'4px'}}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span style={{color: u.approved ? 'var(--success)' : 'var(--error)'}}>
                        {u.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td style={{display:'flex', gap:'8px'}}>
                      <button className="outline-btn" style={{padding:'4px 8px', fontSize:'0.8rem'}} onClick={() => toggleUserStatus(u.username, !u.approved)} disabled={isSelf}>
                        {u.approved ? 'Revoke' : 'Approve'}
                      </button>
                      <button className="outline-btn" style={{padding:'4px 8px', fontSize:'0.8rem', borderColor:'var(--error)', color:'var(--error)'}} onClick={() => deleteUser(u.username)} disabled={isSelf}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminTab;
