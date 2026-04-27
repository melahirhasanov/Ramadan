import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { personService, Person } from '../../services/personService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FaEdit, FaTrash, FaArrowLeft, FaEnvelope, FaPhone, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './BackendResponsibles.module.css';

const BackendResponsibleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      personService.getById(id)
        .then(res => setPerson(res.data))
        .catch(() => toast.error('Məlumat yüklənmədi'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bu istifadəçini silmək istədiyinizdən əminsiniz?')) return;
    try {
      await personService.delete(id!);
      toast.success('İstifadəçi silindi');
      navigate('/backend-responsibles');
    } catch (error) {
      toast.error('Silinmə xətası');
    }
  };

  if (loading) return <div className={styles.loader}>Yüklənir...</div>;
  if (!person) return <div className={styles.empty}>İstifadəçi tapılmadı</div>;

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.detailHeader}>
          <Link to="/backend-responsibles" className={styles.backBtn}>
            <FaArrowLeft /> Geri
          </Link>
          <div>
            <Link to={`/backend-responsibles/edit/${person._id}`} className={styles.editBtn}>
              <FaEdit /> Redaktə et
            </Link>
            <button onClick={handleDelete} className={styles.deleteBtn}>
              <FaTrash /> Sil
            </button>
          </div>
        </div>

        <div className={styles.detailCard}>
          <img
            src={person.profile_image || 'https://via.placeholder.com/120'}
            alt={person.full_name}
            className={styles.detailAvatar}
          />
          <h1>{person.full_name}</h1>
          <div className={styles.detailInfo}>
            <p><FaEnvelope /> {person.email}</p>
            <p><FaPhone /> {person.phone}</p>
            <p>Rol: <strong>Səlahiyyətli Şəxs</strong></p>
            <p>
              Status: 
              {person.is_active ? <FaCheckCircle className={styles.activeIcon} /> : <FaTimesCircle className={styles.inactiveIcon} />}
              {person.is_active ? ' Aktiv' : ' Deaktiv'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackendResponsibleDetailsPage;