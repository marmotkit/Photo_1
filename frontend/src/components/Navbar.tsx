import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

interface User {
  username: string;
  role: string;
  permissions: {
    canManageUsers: boolean;
  };
}

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="nav-left">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            相簿列表
          </Link>
          {user.role === 'admin' && user.permissions.canManageUsers && (
            <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
              用戶管理
            </Link>
          )}
        </div>
        <div className="nav-right">
          <span className="user-info">
            {user.username} ({user.role === 'admin' ? '管理員' : '一般用戶'})
          </span>
          <button className="logout-btn" onClick={onLogout}>
            登出
          </button>
        </div>
      </div>
    </nav>
  );
} 