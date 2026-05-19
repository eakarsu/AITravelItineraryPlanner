import React, { useState, useEffect, useRef } from 'react';
import { trips, documentUploads } from '../services/api';

const DocumentVault = () => {
  const [tripList, setTripList] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    trips.getAll().then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setTripList(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchDocuments();
    }
  }, [selectedTrip]);

  const fetchDocuments = async () => {
    if (!selectedTrip) return;
    setLoading(true);
    try {
      const res = await documentUploads.list(selectedTrip);
      setDocuments(res.data.data || res.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files) => {
    if (!selectedTrip) {
      setMessage('Please select a trip first');
      return;
    }
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage('');

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await documentUploads.upload(selectedTrip, formData);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setMessage('Documents uploaded successfully!');
    setUploading(false);
    fetchDocuments();
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentUploads.delete(selectedTrip, docId);
      setDocuments(docs => docs.filter(d => d.id !== docId));
    } catch {
      setMessage('Failed to delete document');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
          Document Vault
        </h1>
        <p style={{ color: '#64748b' }}>
          Upload passports, tickets, confirmations. AI automatically extracts booking details.
        </p>
      </div>

      {/* Trip Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
          Select Trip
        </label>
        <select
          value={selectedTrip}
          onChange={e => setSelectedTrip(e.target.value)}
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
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '12px',
              padding: '2.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#eff6ff' : '#f9fafb',
              marginBottom: '1.5rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📎</div>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              PDF, images, Word docs up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'none' }}
              onChange={e => handleUpload(e.target.files)}
            />
          </div>

          {message && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
              background: message.includes('success') ? '#dcfce7' : '#fee2e2',
              color: message.includes('success') ? '#166534' : '#991b1b'
            }}>
              {message}
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading documents...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              No documents uploaded yet for this trip.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {documents.map(doc => {
                const extracted = typeof doc.ai_extracted === 'string'
                  ? JSON.parse(doc.ai_extracted || '{}')
                  : (doc.ai_extracted || {});
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: '12px', padding: '1.25rem',
                      display: 'flex', gap: '1rem', alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                      {doc.mime_type === 'application/pdf' ? '📄' : '🖼️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                        {doc.original_name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                        {(doc.size_bytes / 1024).toFixed(1)} KB &bull;{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>

                      {extracted && Object.keys(extracted).some(k => extracted[k]) && (
                        <div style={{
                          background: '#f0f9ff', border: '1px solid #bae6fd',
                          borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem'
                        }}>
                          <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            AI Extracted Info
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '0.8rem' }}>
                            {extracted.document_type && (
                              <span><strong>Type:</strong> {extracted.document_type}</span>
                            )}
                            {extracted.confirmation_number && (
                              <span><strong>Confirmation:</strong> {extracted.confirmation_number}</span>
                            )}
                            {extracted.flight_number && (
                              <span><strong>Flight:</strong> {extracted.flight_number}</span>
                            )}
                            {extracted.airline && (
                              <span><strong>Airline:</strong> {extracted.airline}</span>
                            )}
                            {extracted.hotel_name && (
                              <span><strong>Hotel:</strong> {extracted.hotel_name}</span>
                            )}
                            {extracted.dates?.departure && (
                              <span><strong>Departure:</strong> {extracted.dates.departure}</span>
                            )}
                            {extracted.dates?.checkin && (
                              <span><strong>Check-in:</strong> {extracted.dates.checkin}</span>
                            )}
                            {extracted.dates?.checkout && (
                              <span><strong>Check-out:</strong> {extracted.dates.checkout}</span>
                            )}
                          </div>
                          {extracted.notes && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#374151' }}>
                              <strong>Notes:</strong> {extracted.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', fontSize: '1.1rem', flexShrink: 0
                      }}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentVault;
