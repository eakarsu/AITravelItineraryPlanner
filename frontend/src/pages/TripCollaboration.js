import React, { useState, useEffect } from 'react';
import { trips, collaborators } from '../services/api';

const TripCollaboration = () => {
  const [tripList, setTripList] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [tripCollabs, setTripCollabs] = useState([]);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('myTrips');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsRes, sharedRes] = await Promise.all([
        trips.getAll(),
        collaborators.getSharedTrips()
      ]);
      setTripList(Array.isArray(tripsRes.data) ? tripsRes.data : tripsRes.data.data || []);
      setSharedTrips(sharedRes.data.data || []);
    } catch {}
  };

  const loadCollaborators = async (tripId) => {
    if (!tripId) return;
    try {
      const res = await collaborators.getTripCollaborators(tripId);
      setTripCollabs(res.data.data || []);
    } catch {
      setTripCollabs([]);
    }
  };

  const handleTripSelect = (tripId) => {
    setSelectedTrip(tripId);
    loadCollaborators(tripId);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedTrip || !email.trim()) {
      setMessage({ text: 'Select a trip and enter an email', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await collaborators.invite(selectedTrip, { email: email.trim(), role });
      setMessage({ text: `Invitation sent to ${email}`, type: 'success' });
      setEmail('');
      loadCollaborators(selectedTrip);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to send invitation', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collabId) => {
    if (!window.confirm('Remove this collaborator?')) return;
    try {
      await collaborators.removeCollaborator(selectedTrip, collabId);
      setTripCollabs(prev => prev.filter(c => c.id !== collabId));
    } catch {
      setMessage({ text: 'Failed to remove collaborator', type: 'error' });
    }
  };

  const statusBadge = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      accepted: { bg: '#dcfce7', color: '#166534' },
      declined: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = colors[status] || colors.pending;
    return (
      <span style={{
        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
        fontWeight: 600, background: style.bg, color: style.color
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
          Trip Collaboration
        </h1>
        <p style={{ color: '#64748b' }}>Invite others to view and contribute to your trips</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { key: 'myTrips', label: 'My Trips' },
          { key: 'shared', label: `Shared With Me (${sharedTrips.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.6rem 1.2rem', border: 'none', cursor: 'pointer', fontWeight: 600,
              background: 'none', borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.key ? '#3b82f6' : '#6b7280'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'myTrips' && (
        <>
          {/* Trip selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              Select Your Trip
            </label>
            <select
              value={selectedTrip}
              onChange={e => handleTripSelect(e.target.value)}
              style={{
                width: '100%', maxWidth: '400px', padding: '0.6rem 1rem',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem'
              }}
            >
              <option value="">-- Choose a trip --</option>
              {tripList.map(t => (
                <option key={t.id} value={t.id}>{t.name} {t.destination ? `(${t.destination})` : ''}</option>
              ))}
            </select>
          </div>

          {selectedTrip && (
            <>
              {/* Invite Form */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>Invite Collaborator</h3>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="collaborator@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      flex: '1', minWidth: '220px', padding: '0.6rem 1rem',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem'
                    }}
                  />
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      padding: '0.6rem 1rem', border: '1px solid #d1d5db',
                      borderRadius: '8px', fontSize: '1rem'
                    }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.6rem 1.5rem', background: '#3b82f6', color: '#fff',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontWeight: 600, opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>

                {message.text && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    fontSize: '0.9rem'
                  }}>
                    {message.text}
                  </div>
                )}
              </div>

              {/* Collaborators List */}
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>
                Collaborators ({tripCollabs.length})
              </h3>

              {tripCollabs.length === 0 ? (
                <div style={{ color: '#9ca3af', padding: '1rem 0' }}>
                  No collaborators yet. Invite someone above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tripCollabs.map(collab => (
                    <div
                      key={collab.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: '10px', padding: '0.875rem 1rem'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#3b82f6', color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, flexShrink: 0
                      }}>
                        {collab.collaborator_email[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{collab.collaborator_email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Role: <strong>{collab.role}</strong> &bull; Invited {new Date(collab.invited_at).toLocaleDateString()}
                        </div>
                      </div>
                      {statusBadge(collab.status)}
                      <button
                        onClick={() => handleRemove(collab.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ef4444', fontSize: '1.1rem'
                        }}
                        title="Remove collaborator"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'shared' && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
            Trips Shared With You
          </h3>
          {sharedTrips.length === 0 ? (
            <div style={{ color: '#9ca3af', padding: '1rem 0' }}>
              No shared trips yet. Ask a trip owner to invite you.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sharedTrips.map(trip => (
                <div
                  key={trip.id}
                  style={{
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: '12px', padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                        {trip.name}
                      </div>
                      {trip.destination && (
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Destination: {trip.destination}
                        </div>
                      )}
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Owner: {trip.owner_name || trip.owner_email}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {statusBadge(trip.invite_status)}
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        Your role: {trip.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripCollaboration;
