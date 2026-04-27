import React, { useEffect, useState } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaTimes, 
  FaBus, FaCalendar, FaMoneyBillWave, FaSave, 
  FaChartLine, FaInfoCircle, FaSearch
} from 'react-icons/fa';
import styles from './DailyTransportPage.module.css';

interface Transport {
  _id: string;
  cost_date: string;
  total_amount: number;
  notes?: string;
  created_at: string;
}

interface TransportForm {
  cost_date: string;
  total_amount: number;
  notes: string;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

const DailyTransportPage: React.FC = () => {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [form, setForm] = useState<TransportForm>({
    cost_date: new Date().toISOString().split('T')[0],
    total_amount: 0,
    notes: ''
  });
  const [editForm, setEditForm] = useState<TransportForm>({
    cost_date: '',
    total_amount: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransports();
  }, []);

  const fetchTransports = async () => {
    setLoading(true);
    try {
      const res = await tradeService.getDailyTransport();
      setTransports(res.data || []);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      cost_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      notes: ''
    });
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (transport: Transport) => {
    setSelectedTransport(transport);
    setEditForm({
      cost_date: transport.cost_date.split('T')[0],
      total_amount: transport.total_amount,
      notes: transport.notes || ''
    });
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (transport: Transport) => {
    setSelectedTransport(transport);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedTransport(null);
    document.body.style.overflow = 'unset';
  };

  const handleCreate = async () => {
    if (!form.cost_date || !form.total_amount) {
      toast.error('Tarix və məbləğ daxil edin');
      return;
    }

    setSubmitting(true);
    try {
      await tradeService.createDailyTransport(form);
      toast.success('Gündəlik yol pulu əlavə edildi');
      closeModal();
      fetchTransports();
    } catch (error) {
      toast.error('Əlavə etmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransport) return;
    if (!editForm.cost_date || !editForm.total_amount) {
      toast.error('Tarix və məbləğ daxil edin');
      return;
    }

    setSubmitting(true);
    try {
      await tradeService.updateDailyTransport(selectedTransport._id, editForm);
      toast.success('Gündəlik yol pulu yeniləndi');
      closeModal();
      fetchTransports();
    } catch (error) {
      toast.error('Yeniləmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransport) return;

    setSubmitting(true);
    try {
      await tradeService.deleteDailyTransport(selectedTransport._id);
      toast.success('Gündəlik yol pulu silindi');
      closeModal();
      fetchTransports();
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransports = transports.filter(transport => {
    const dateStr = new Date(transport.cost_date).toLocaleDateString('az-AZ');
    const notesStr = transport.notes?.toLowerCase() || '';
    const amountStr = transport.total_amount.toString();
    const search = searchTerm.toLowerCase();
    return dateStr.includes(search) || notesStr.includes(search) || amountStr.includes(search);
  });

  const totalAmount = transports.reduce((sum, t) => sum + t.total_amount, 0);
  const averageAmount = transports.length ? totalAmount / transports.length : 0;
  const currentMonthTotal = transports.filter(t => {
    const date = new Date(t.cost_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, t) => sum + t.total_amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FaBus />
            </div>
            <div>
              <h1 className={styles.title}>Gündəlik yol pulu</h1>
              <p className={styles.subtitle}>Hər gün üçün nəqliyyat xərclərinin qeydi</p>
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.createBtn}>
            <FaPlus /> Yeni qeyd
          </button>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <h3>{totalAmount.toLocaleString()} AZN</h3>
              <p>Ümumi xərc</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>{averageAmount.toFixed(2)} AZN</h3>
              <p>Gündəlik ortalama</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <h3>{currentMonthTotal.toLocaleString()} AZN</h3>
              <p>Bu ayın xərci</p>
            </div>
          </div>
        </div>

        {/* Axtarış */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Tarix, məbləğ və ya qeydə görə axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={styles.clearBtn}>
                ✖
              </button>
            )}
          </div>
          <div className={styles.filterInfo}>
            {searchTerm && (
              <span className={styles.filterResult}>
                {filteredTransports.length} / {transports.length} nəticə
              </span>
            )}
          </div>
        </div>

        {/* Qeydlər qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Məlumatlar yüklənir...</p>
          </div>
        ) : filteredTransports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚌</div>
            <h3>{searchTerm ? 'Nəticə tapılmadı' : 'Heç bir qeyd yoxdur'}</h3>
            <p>
              {searchTerm 
                ? `"${searchTerm}" üçün qeyd tapılmadı`
                : 'İlk gündəlik yol pulu qeydini əlavə edin'}
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                <FaPlus /> İlk qeydi əlavə et
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTransports.map((transport) => (
              <motion.div
                key={transport._id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.dateBadge}>
                    <FaCalendar className={styles.dateIcon} />
                    <span className={styles.dateText}>{formatDate(transport.cost_date)}</span>
                  </div>
                  <div className={styles.amountBadge}>
                    <FaMoneyBillWave />
                    <span>{transport.total_amount.toLocaleString()} AZN</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {transport.notes && (
                    <div className={styles.notesInfo}>
                      <FaInfoCircle className={styles.notesIcon} />
                      <span className={styles.notesText}>{transport.notes}</span>
                    </div>
                  )}
                  {!transport.notes && (
                    <div className={styles.noNotes}>Qeyd yoxdur</div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button onClick={() => openEditModal(transport)} className={styles.editBtn}>
                    <FaEdit /> Düzəliş
                  </button>
                  <button onClick={() => openDeleteModal(transport)} className={styles.deleteBtn}>
                    <FaTrash /> Sil
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ========== CREATE MODAL ========== */}
      <AnimatePresence>
        {modalType === 'create' && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>➕ Yeni gündəlik yol pulu</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Tarix *</label>
                  <input
                    type="date"
                    value={form.cost_date}
                    onChange={e => setForm({ ...form, cost_date: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Məbləğ (AZN) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={form.total_amount || ''}
                    onChange={e => setForm({ ...form, total_amount: +e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qeyd (istəyə bağlı)</label>
                  <textarea
                    placeholder="Əlavə qeyd..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button onClick={handleCreate} className={styles.createModalBtn} disabled={submitting}>
                  {submitting ? <><FaSpinner className={styles.btnSpinner} /> Yüklənir...</> : <><FaSave /> Əlavə et</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== EDIT MODAL ========== */}
      <AnimatePresence>
        {modalType === 'edit' && selectedTransport && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>✏️ Qeydi yenilə</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Tarix *</label>
                  <input
                    type="date"
                    value={editForm.cost_date}
                    onChange={e => setEditForm({ ...editForm, cost_date: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Məbləğ (AZN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.total_amount || ''}
                    onChange={e => setEditForm({ ...editForm, total_amount: +e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qeyd (istəyə bağlı)</label>
                  <textarea
                    placeholder="Əlavə qeyd..."
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button onClick={handleUpdate} className={styles.updateModalBtn} disabled={submitting}>
                  {submitting ? <><FaSpinner className={styles.btnSpinner} /> Yenilənir...</> : <><FaSave /> Yenilə</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== DELETE MODAL ========== */}
      <AnimatePresence>
        {modalType === 'delete' && selectedTransport && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🗑️ Qeydi sil</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteIcon}>⚠️</div>
                  <p>
                    Bu qeydi silmək istədiyinizdən əminsiniz?
                  </p>
                  <p className={styles.deleteWarning}>
                    <strong>Tarix:</strong> {formatDate(selectedTransport.cost_date)}<br />
                    <strong>Məbləğ:</strong> {selectedTransport.total_amount} AZN
                    {selectedTransport.notes && <><br /><strong>Qeyd:</strong> {selectedTransport.notes}</>}
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button onClick={handleDelete} className={styles.deleteConfirmBtn} disabled={submitting}>
                  {submitting ? 'Silinir...' : 'Bəli, sil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyTransportPage;