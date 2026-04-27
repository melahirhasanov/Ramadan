import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { personService, Person } from '../../services/personService';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './Masters.module.css';

const MastersPage: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      const res = await personService.getAll('master');
      setPersons(res.data);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`${name} adlı ustadı silmək istədiyinizdən əminsiniz?`)) return;
    try {
      await personService.delete(id);
      toast.success('Ustad silindi');
      fetchPersons();
    } catch (error) {
      toast.error('Silinmə xətası');
    }
  };

  const filteredPersons = persons.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className={styles.loader}>Yüklənir...</div>;

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Ustadlar</h1>
          <Link to="/masters/new" className={styles.addBtn}>
            <FaPlus /> Yeni ustad
          </Link>
        </div>

        <div className={styles.searchBox}>
          <FaSearch />
          <input
            type="text"
            placeholder="Axtar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.grid}>
          {filteredPersons.map((p, idx) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <img
                  src={p.profile_image || 'https://via.placeholder.com/80'}
                  alt={p.full_name}
                  className={styles.avatar}
                />
                <div>
                  <h3>{p.full_name}</h3>
                  <span className={styles.roleBadge}>Ustad</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p><strong>Email:</strong> {p.email}</p>
                <p><strong>Telefon:</strong> {p.phone}</p>
                <p><strong>Status:</strong> {p.is_active ? 'Aktiv' : 'Deaktiv'}</p>
              </div>
              <div className={styles.cardActions}>
                <Link to={`/masters/${p._id}`} className={styles.viewBtn}>
                  <FaEye /> Ətraflı
                </Link>
                <Link to={`/masters/edit/${p._id}`} className={styles.editBtn}>
                  <FaEdit /> Redaktə
                </Link>
                <button onClick={() => handleDelete(p._id, p.full_name)} className={styles.deleteBtn}>
                  <FaTrash /> Sil
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPersons.length === 0 && (
          <div className={styles.empty}>Heç bir ustad tapılmadı</div>
        )}
      </div>
    </>
  );
};

export default MastersPage;