import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { familyService } from '../../services/familyService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { usePagination } from '../../hooks/usePagination';
import {
  FaUsers, FaPhone, FaSearch, FaPlus,
  FaInfoCircle, FaEdit, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import styles from './Families.module.css';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 240, damping: 22 }
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }
};

const FamiliesPage: React.FC = () => {
  const [families, setFamilies] = useState<any[]>([]);

  useEffect(() => {
    familyService.getAll()
      .then(res => setFamilies(res.data))
      .catch(() => toast.error('Yüklənmədi'));
  }, []);

  const { search, setSearch, currentPage, setCurrentPage, totalPages, paginated } =
    usePagination(families, 10);

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>
            <FaUsers style={{ color: 'var(--teal)', fontSize: 28 }} />
            Ailələr
          </h1>
          <Link to="/families/new" className={styles.addBtn}>
            <FaPlus size={12} /> Yeni ailə
          </Link>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 360, marginBottom: 30 }}>
          <FaSearch style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ink-soft)', fontSize: 13, pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Axtar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.search}
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* Grid */}
        <motion.div className={styles.grid} layout>
          <AnimatePresence>
            {paginated.map((family, idx) => (
              <motion.div
                key={family._id}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className={styles.card}
                layout
              >
                <div className={styles.cardBody}>
                  <h3>{family.name}</h3>
                  <p>
                    <FaPhone style={{ color: 'var(--teal-light)', flexShrink: 0 }} />
                    {family.contact_phone}
                  </p>
                  <p>
                    Status:&nbsp;
                    <span className={family.status === 'aktiv' ? styles.active : styles.inactive}>
                      {family.status}
                    </span>
                  </p>
                </div>
                <div className={styles.cardActions}>
                  <Link to={`/families/${family._id}`} className={styles.detailLink}>
                    <FaInfoCircle size={12} /> Ətraflı
                  </Link>
                  <Link to={`/families/${family._id}/edit`} className={styles.editLink}>
                    <FaEdit size={12} /> Redaktə
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <FaChevronLeft size={12} /> Əvvəlki
          </button>
          <span>Səhifə {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Sonrakı <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </>
  );
};

export default FamiliesPage;