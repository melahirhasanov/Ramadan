import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaUsers,
  FaHandHoldingHeart,
  FaChartLine,
  FaStore,
  FaLightbulb,
  FaBox,
  FaTruck,
  FaDollarSign,
  FaUserFriends,
  FaHeart,
  FaUserTie,
  FaCrown
} from 'react-icons/fa';
import styles from './DashboardPage.module.css';

interface Stats {
  activeFamilies: number;
  volunteers: number;
  todayAids: number;
  totalProducts: number;
  totalOrders: number;
  pendingIdeas: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        setStats(res.data);
      } catch (error) {
        toast.error('Statistika yüklənmədi');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'backend_responsible';

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header />
        <div className={styles.container}>
          <div className={styles.loader}>
            <div className={styles.loaderSpinner} />
            Yüklənir...
          </div>
        </div>
      </>
    );
  }

  const ModuleCard = ({
    icon,
    title,
    desc,
    path
  }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    path: string;
  }) => (
    <motion.div
      variants={itemVariants}
      className={styles.moduleCard}
      onClick={() => navigate(path)}
    >
      <div className={styles.moduleIconWrapper}>
        <span className={styles.moduleIcon}>{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );

  const statData = [
    { icon: <FaUsers />, value: stats?.activeFamilies ?? 0, label: 'Aktiv ailələr' },
    { icon: <FaUserFriends />, value: stats?.volunteers ?? 0, label: 'Könüllülər' },
    { icon: <FaHandHoldingHeart />, value: stats?.todayAids ?? 0, label: 'Bugünkü yardımlar' },
    ...(isAdmin
      ? [
          { icon: <FaBox />, value: stats?.totalProducts ?? 0, label: 'Təsdiqlənmiş məhsullar' },
          { icon: <FaStore />, value: stats?.totalOrders ?? 0, label: 'Sifarişlər' },
          { icon: <FaLightbulb />, value: stats?.pendingIdeas ?? 0, label: 'Gözləyən ideyalar' }
        ]
      : [])
  ];

  return (
    <>
      <Sidebar />
      <Header />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={styles.container}
      >
        <div className={styles.headerSection}>
          <div>
            <h1 className={styles.welcome}>
              Xoş gəldin, <span>{user?.full_name}</span>!
            </h1>
            <p className={styles.subtitle}>
              Rolunuz: <span className={styles.rolePill}>
                {role === 'backend_responsible' ? 'Səlahiyyətli Şəxs' : 
                 role === 'master' ? 'Ustad' : 
                 role === 'volunteer' ? 'Könüllü' : role}
              </span>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Stat Cards */}
        <motion.div
          className={styles.statsGrid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {statData.map((s, i) => (
            <motion.div key={i} variants={itemVariants} className={styles.statCard}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statNumber}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Admin & Backend Responsible Modules */}
        {isAdmin && (
          <>
            <h2 className={styles.sectionTitle}>Modullar</h2>
            <motion.div
              className={styles.modulesGrid}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <ModuleCard icon={<FaUsers />} title="Ailələr" desc="Ailə məlumatlarını idarə et" path="/families" />
              <ModuleCard icon={<FaUserFriends />} title="Könüllülər" desc="Könüllü qeydiyyatı və idarə" path="/volunteers" />
              <ModuleCard icon={<FaUserTie />} title="Səlahiyyətli Şəxslər" desc="Backend responsible idarəsi" path="/backend-responsibles" />
              <ModuleCard icon={<FaCrown />} title="Ustadlar" desc="Ustadların idarəsi" path="/masters" />
              <ModuleCard icon={<FaLightbulb />} title="İdeyalar" desc="Könüllü ideyalarını təsdiqlə" path="/trade/ideas" />
              <ModuleCard icon={<FaBox />} title="Məhsullar" desc="Məhsul və kateqoriyalar" path="/trade/products" />
              <ModuleCard icon={<FaBox />} title="Materiallar" desc="Levazimatları idarə et" path="/trade/materials" />
              <ModuleCard icon={<FaTruck />} title="Alışlar" desc="Material alışları" path="/trade/purchases" />
              <ModuleCard icon={<FaDollarSign />} title="Əlavə xərclər" desc="Xərcləri izlə" path="/trade/extracosts" />
              <ModuleCard icon={<FaTruck />} title="Gündəlik yol pulu" desc="Nəqliyyat xərcləri" path="/trade/dailytransport" />
              <ModuleCard icon={<FaStore />} title="Sifarişlər" desc="Sifarişləri idarə et" path="/trade/orders" />
              <ModuleCard icon={<FaChartLine />} title="Hesabatlar" desc="Aylıq maliyyə hesabatları" path="/reports" />
            </motion.div>
          </>
        )}

        {/* Volunteer Modules */}
        {role === 'volunteer' && (
          <>
            <h2 className={styles.sectionTitle}>İdeyalarım</h2>
            <motion.div
              className={styles.modulesGrid}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <ModuleCard icon={<FaLightbulb />} title="İdeyalarım" desc="Öz ideyalarını paylaş" path="/my-ideas" />
              <ModuleCard icon={<FaHeart />} title="Bütün ideyalar" desc="Digər ideyaları bəyən" path="/all-ideas" />
            </motion.div>
          </>
        )}

        {/* Master Modules */}
        {role === 'master' && (
          <>
            <h2 className={styles.sectionTitle}>Məhsullarım</h2>
            <motion.div
              className={styles.modulesGrid}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <ModuleCard icon={<FaBox />} title="Məhsullarım" desc="Öz məhsullarını idarə et" path="/my-products" />
              <ModuleCard icon={<FaTruck />} title="Alışlarım" desc="Material alışlarını izlə" path="/my-purchases" />
              <ModuleCard icon={<FaDollarSign />} title="Xərclərim" desc="Əlavə xərcləri idarə et" path="/my-extracosts" />
              <ModuleCard icon={<FaChartLine />} title="Gəlirlərim" desc="80% payını gör" path="/my-income" />
            </motion.div>
          </>
        )}
      </motion.div>
    </>
  );
};

export default DashboardPage;