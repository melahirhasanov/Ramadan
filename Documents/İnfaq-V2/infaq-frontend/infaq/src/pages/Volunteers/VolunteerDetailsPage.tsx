import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaEdit, FaTrash, FaArrowLeft, FaEnvelope, FaPhone, 
  FaClock, FaUsers, FaExclamationTriangle, FaTimes,
  FaBan, FaCheckCircle, FaCalendarAlt
} from 'react-icons/fa';
import styles from './Volunteers.module.css';

const VolunteerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivateUntil, setDeactivateUntil] = useState<Date | null>(null);

  const fetchVolunteer = async () => {
    if (!id) return;
    try {
      const res = await volunteerService.getById(id);
      setVolunteer(res.data);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteer();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await volunteerService.delete(id!);
      toast.success('Könüllü silindi');
      navigate('/volunteers');
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeactivate = async () => {
    setActivating(true);
    try {
      await volunteerService.deactivate(id!, deactivateUntil?.toISOString());
      toast.success('Könüllü deaktiv edildi');
      setShowDeactivateModal(false);
      setDeactivateUntil(null);
      fetchVolunteer();
    } catch (error) {
      toast.error('Xəta baş verdi');
    } finally {
      setActivating(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await volunteerService.activate(id!);
      toast.success('Könüllü aktiv edildi');
      fetchVolunteer();
    } catch (error) {
      toast.error('Xəta baş verdi');
    } finally {
      setActivating(false);
    }
  };

  if (loading) return (
    <>
      <Sidebar /><Header />
      <div className={styles.container}><div className={styles.loader}>Yüklənir...</div></div>
    </>
  );
  
  if (!volunteer) return (
    <>
      <Sidebar /><Header />
      <div className={styles.container}><div className={styles.loader}>Könüllü tapılmadı</div></div>
    </>
  );

  const p = volunteer.person_id;
  const isActive = p?.is_active;
  const deactivatedUntil = volunteer.deactivated_until ? new Date(volunteer.deactivated_until) : null;

  return (
    <>
      <Sidebar />
      <Header />
      <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className={styles.detailHeader}>
          <Link to="/volunteers" className={styles.backBtn}><FaArrowLeft /> Geri</Link>
          <div className={styles.actionButtons}>
            {isActive ? (
              <button onClick={() => setShowDeactivateModal(true)} className={styles.deactivateBtn}>
                <FaBan /> Deaktiv et
              </button>
            ) : (
              <button onClick={handleActivate} disabled={activating} className={styles.activateBtn}>
                <FaCheckCircle /> {activating ? 'Aktiv edilir...' : 'Aktiv et'}
              </button>
            )}
            <Link to={`/volunteers/edit/${id}`} className={styles.editBtn}>
              <FaEdit /> Redaktə et
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
              <FaTrash /> Sil
            </button>
          </div>
        </div>

        <div className={styles.detailCard}>
          <img 
            src={volunteer.image || 'https://via.placeholder.com/150'} 
            alt={p?.full_name} 
            className={styles.detailAvatar} 
          />
          <h1>{p?.full_name}</h1>
          
          {/* Status göstəricisi */}
          <div className={styles.statusBadge}>
            {isActive ? (
              <span className={styles.statusActive}><FaCheckCircle /> Aktiv</span>
            ) : (
              <span className={styles.statusInactive}>
                <FaBan /> Deaktiv
                {deactivatedUntil && (
                  <span className={styles.statusUntil}>
                    {' '}· {deactivatedUntil.toLocaleDateString('az-AZ')} tarixinə qədər
                  </span>
                )}
              </span>
            )}
          </div>

          <div className={styles.detailInfo}>
            <p><FaEnvelope /> {p?.email}</p>
            <p><FaPhone /> {p?.phone}</p>
            <p><FaClock /> Boş vaxt: {volunteer.free_time || '—'}</p>
            <p><FaUsers /> Komandalar: {volunteer.teams?.join(', ') || '—'}</p>
            <p>Qeyd: {volunteer.notes || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Silmə Modalı */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className={styles.modalContainer}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <FaExclamationTriangle className={styles.modalIcon} />
                <h3>Könüllü silinsin?</h3>
                <button className={styles.modalClose} onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p><strong>{p?.full_name}</strong> adlı könüllü tamamilə silinəcək.</p>
                <p>Bu əməliyyat geri alına bilməz. Könüllünün bütün məlumatları silinəcək.</p>
                <p className={styles.warningText}>⚠️ İdeyaları isə olduğu kimi qalacaq.</p>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancel} onClick={() => setShowDeleteModal(false)}>Ləğv et</button>
                <button className={styles.modalConfirm} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Silinir...' : 'Bəli, sil'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deaktivasiya Modalı */}
      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeactivateModal(false)}
          >
            <motion.div
              className={styles.modalContainer}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <FaBan className={styles.modalIconDeactivate} />
                <h3>Könüllü deaktiv et</h3>
                <button className={styles.modalClose} onClick={() => setShowDeactivateModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p><strong>{p?.full_name}</strong> adlı könüllü müvəqqəti olaraq deaktiv ediləcək.</p>
                <p>Deaktiv olan könüllü sistemə daxil ola bilməyəcək.</p>
                
                <div className={styles.datePickerGroup}>
                  <label><FaCalendarAlt /> Nə vaxta qədər? (opsiyonel)</label>
                  <input
                    type="datetime-local"
                    className={styles.datePicker}
                    value={deactivateUntil ? new Date(deactivateUntil.getTime() - deactivateUntil.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setDeactivateUntil(e.target.value ? new Date(e.target.value) : null)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <small>Boş buraxsaq, qeyri-müəyyən müddətə deaktiv olacaq.</small>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancel} onClick={() => setShowDeactivateModal(false)}>Ləğv et</button>
                <button className={styles.modalConfirmDeactivate} onClick={handleDeactivate} disabled={activating}>
                  {activating ? 'Deaktiv edilir...' : 'Deaktiv et'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VolunteerDetailsPage;