import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { auth } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await auth.updateProfile({ name, email });
      updateUser(response.data.user);
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await auth.changePassword({ currentPassword, newPassword });
      showSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h2>Profile Settings</h2>

      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h3>Profile Information</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                type="text"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                type="email"
                id="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {user?.email_verified !== undefined && (
              <div className="profile-badge">
                {user.email_verified ? (
                  <span className="badge badge--success">Email Verified</span>
                ) : (
                  <span className="badge badge--warning">Email Not Verified</span>
                )}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
