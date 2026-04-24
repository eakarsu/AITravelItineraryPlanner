import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>✈️</span>
        AI Travel Planner
      </Link>
      <div className="navbar-user">
        <span>Welcome, {user?.name || user?.email}</span>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
