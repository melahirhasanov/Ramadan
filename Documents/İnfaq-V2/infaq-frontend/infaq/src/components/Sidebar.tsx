import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBars, FaHome, FaUsers, FaStore, FaChartLine, 
  FaLightbulb, FaBox, FaTruck, FaDollarSign, FaUserFriends,
  FaUserTie, FaCrown
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

interface LinkItem {
  to: string;
  icon: React.JSX.Element;
  label: string;
}

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const role = user?.role;

  const adminLinks: LinkItem[] = useMemo(() => [
    { to: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { to: '/families', icon: <FaUsers />, label: 'Ailələr' },
    { to: '/volunteers', icon: <FaUserFriends />, label: 'Könüllülər' },
    { to: '/backend-responsibles', icon: <FaUserTie />, label: 'Səlahiyyətli Şəxslər' },
    { to: '/masters', icon: <FaCrown />, label: 'Ustadlar' },
    { to: '/trade/ideas', icon: <FaLightbulb />, label: 'İdeyalar' },
        { to: '/categories', icon: <FaChartLine />, label: 'Kateqoriyalar' },
    { to: '/trade/products', icon: <FaBox />, label: 'Məhsullar' },
    { to: '/trade/materials', icon: <FaBox />, label: 'Materiallar' },
    { to: '/trade/purchases', icon: <FaTruck />, label: 'Alışlar' },
    { to: '/trade/extracosts', icon: <FaDollarSign />, label: 'Əlavə xərclər' },
    { to: '/trade/dailytransport', icon: <FaTruck />, label: 'Gündəlik yol pulu' },
        { to: '/product-costs', icon: <FaChartLine />, label: 'Qiymət Hesablanması' },

    { to: '/trade/orders', icon: <FaStore />, label: 'Sifarişlər' },
    { to: '/reports', icon: <FaChartLine />, label: 'Hesabatlar' },

    
  ], []);

  const volunteerLinks: LinkItem[] = useMemo(() => [
    { to: '/my-ideas', icon: <FaLightbulb />, label: 'İdeyalarım' },
    { to: '/all-ideas', icon: <FaUsers />, label: 'Bütün ideyalar' },
  ], []);

  const masterLinks: LinkItem[] = useMemo(() => [
    { to: '/my-products', icon: <FaBox />, label: 'Məhsullarım' },
    { to: '/my-purchases', icon: <FaTruck />, label: 'Alışlarım' },
    { to: '/my-extracosts', icon: <FaDollarSign />, label: 'Xərclərim' },
    { to: '/my-income', icon: <FaChartLine />, label: 'Gəlirlərim' },
  ], []);

  let links: LinkItem[] = [];
  if (role === 'admin' || role === 'backend_responsible') links = adminLinks;
  else if (role === 'volunteer') links = volunteerLinks;
  else if (role === 'master') links = masterLinks;

  return (
    <>
      <button 
        className={styles.hamburger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menyu"
      >
        <FaBars />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={styles.sidebar}
          >
            <div className={styles.logo}>
              <span>İnfaq</span>
              <span className={styles.logoSub}>Yardım Birliyi</span>
            </div>
            <nav className={styles.nav}>
              <div className={styles.navScroll}>
                {links.map((link: LinkItem) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => (isActive ? styles.active : styles.link)}
                  >
                    <span className={styles.icon}>{link.icon}</span>
                    <span className={styles.label}>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
            <div className={styles.footer}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name?.split(' ')[0] || 'İstifadəçi'}</span>
                <span className={styles.userRole}>
                  {role === 'backend_responsible' ? 'Səlahiyyətli' : 
                   role === 'master' ? 'Ustad' : 
                   role === 'volunteer' ? 'Könüllü' : role}
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;