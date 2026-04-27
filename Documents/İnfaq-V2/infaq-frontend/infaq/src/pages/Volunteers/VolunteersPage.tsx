import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { usePagination } from '../../hooks/usePagination';
import styles from './Volunteers.module.css';

const VolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  useEffect(() => {
    volunteerService.getAll().then(res => setVolunteers(res.data)).catch(() => toast.error('Yüklənmədi'));
  }, []);
  const { search, setSearch, currentPage, setCurrentPage, totalPages, paginated } = usePagination(volunteers, 10);

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Könüllülər</h1>
          <Link to="/volunteers/new" className={styles.addBtn}>+ Yeni könüllü</Link>
        </div>
        <input type="text" placeholder="Axtar..." value={search} onChange={e => setSearch(e.target.value)} className={styles.search} />
        <div className={styles.grid}>
          {paginated.map((v, idx) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={styles.card}>
              <img src={v.image || 'https://via.placeholder.com/80'} alt={v.person_id?.full_name} className={styles.avatar} />
              <h3>{v.person_id?.full_name}</h3>
              <p>Tel: {v.person_id?.phone}</p>
              <p>Komandalar: {v.teams?.join(', ')}</p>
              <p>Boş vaxt: {v.free_time}</p>
                <Link to={`/volunteers/${v.person_id?._id}`} className={styles.detailLink}>Ətraflı</Link>

            </motion.div>
          ))}
        </div>
        <div className={styles.pagination}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Əvvəlki</button>
          <span>Səhifə {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sonrakı</button>
        </div>
      </div>
    </>
  );
};
export default VolunteersPage;