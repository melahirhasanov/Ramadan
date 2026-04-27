import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <header className={styles.header}>
      <div className={styles.userInfo}>
        <FaUserCircle size={32} color="#1E88E5" />
        <span className={styles.name}>{user?.full_name}</span>
        <span className={styles.role}>{user?.role}</span>
      </div>
      <button onClick={logout} className={styles.logoutBtn}>
        <FaSignOutAlt /> Çıxış
      </button>
    </header>
  );
};

export default Header;