import React, { useEffect, useState } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaTimes, 
  FaShoppingCart, FaUser, FaBox, FaMoneyBillWave, 
  FaCalendar, FaChartLine, FaSave, FaTruck
} from 'react-icons/fa';
import styles from './PurchasesPage.module.css';

interface Master {
  _id: string;
  full_name: string;
}

interface Material {
  _id: string;
  name: string;
  unit: string;
}

interface Purchase {
  _id: string;
  master_id: Master | string;
  material_id: Material | string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
}

interface PurchaseForm {
  master_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  purchase_date: string;
  notes: string;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [form, setForm] = useState<PurchaseForm>({
    master_id: '',
    material_id: '',
    quantity: 0,
    unit_price: 0,
    purchase_date: '',
    notes: ''
  });
  const [editForm, setEditForm] = useState<PurchaseForm>({
    master_id: '',
    material_id: '',
    quantity: 0,
    unit_price: 0,
    purchase_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, materialsRes, mastersRes] = await Promise.all([
        tradeService.getPurchases(),
        tradeService.getMaterials(),
        tradeService.getMasters()
      ]);
      setPurchases(purchasesRes.data || []);
      setMaterials(materialsRes.data || []);
      setMasters(mastersRes.data || []);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      master_id: '',
      material_id: '',
      quantity: 0,
      unit_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditForm({
      master_id: typeof purchase.master_id === 'object' ? purchase.master_id._id : purchase.master_id,
      material_id: typeof purchase.material_id === 'object' ? purchase.material_id._id : purchase.material_id,
      quantity: purchase.quantity,
      unit_price: purchase.unit_price,
      purchase_date: purchase.purchase_date.split('T')[0],
      notes: purchase.notes || ''
    });
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedPurchase(null);
    document.body.style.overflow = 'unset';
  };

  const handleCreate = async () => {
    if (!form.master_id || !form.material_id || !form.quantity || !form.unit_price || !form.purchase_date) {
      toast.error('Bütün sahələri doldurun');
      return;
    }
    setSubmitting(true);
    try {
      await tradeService.createPurchase(form);
      toast.success('Material alışı əlavə edildi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Əlavə etmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPurchase) return;
    if (!editForm.master_id || !editForm.material_id || !editForm.quantity || !editForm.unit_price || !editForm.purchase_date) {
      toast.error('Bütün sahələri doldurun');
      return;
    }
    setSubmitting(true);
    try {
      await tradeService.updatePurchase(selectedPurchase._id, editForm);
      toast.success('Material alışı yeniləndi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Yeniləmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPurchase) return;
    setSubmitting(true);
    try {
      await tradeService.deletePurchase(selectedPurchase._id);
      toast.success('Material alışı silindi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const getMasterName = (master: Master | string): string => {
    if (typeof master === 'object' && master?.full_name) return master.full_name;
    const found = masters.find(m => m._id === master);
    return found?.full_name || 'Naməlum';
  };

  const getMaterialName = (material: Material | string): string => {
    if (typeof material === 'object' && material?.name) return material.name;
    const found = materials.find(m => m._id === material);
    return found?.name || 'Naməlum';
  };

  const getMaterialUnit = (material: Material | string): string => {
    if (typeof material === 'object' && material?.unit) return material.unit;
    const found = materials.find(m => m._id === material);
    return found?.unit || '';
  };

  const filteredPurchases = purchases.filter(purchase => {
    const masterName = getMasterName(purchase.master_id).toLowerCase();
    const materialName = getMaterialName(purchase.material_id).toLowerCase();
    return masterName.includes(searchTerm.toLowerCase()) || materialName.includes(searchTerm.toLowerCase());
  });

  const totalSpent = purchases.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  const currentMonthTotal = purchases.filter(p => {
    const date = new Date(p.purchase_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);

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
              <FaShoppingCart />
            </div>
            <div>
              <h1 className={styles.title}>Material alışları</h1>
              <p className={styles.subtitle}>Ustadların material xərclərinin idarəsi</p>
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.createBtn}>
            <FaPlus /> Yeni alış
          </button>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <h3>{totalSpent.toLocaleString()} AZN</h3>
              <p>Ümumi xərc</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <h3>{currentMonthTotal.toLocaleString()} AZN</h3>
              <p>Bu ayın xərci</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statInfo}>
              <h3>{purchases.length}</h3>
              <p>Alış sayı</p>
            </div>
          </div>
        </div>

        {/* Axtarış */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Ustad və ya materiala görə axtar..."
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
                {filteredPurchases.length} / {purchases.length} nəticə
              </span>
            )}
          </div>
        </div>

        {/* Alışlar qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Alışlar yüklənir...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🧾</div>
            <h3>{searchTerm ? 'Nəticə tapılmadı' : 'Heç bir alış yoxdur'}</h3>
            <p>
              {searchTerm 
                ? `"${searchTerm}" üçün alış tapılmadı`
                : 'İlk material alışını əlavə edin'}
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                <FaPlus /> İlk alışı əlavə et
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredPurchases.map((purchase) => {
              const total = purchase.quantity * purchase.unit_price;
              return (
                <motion.div
                  key={purchase._id}
                  className={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.masterInfo}>
                      <FaUser className={styles.masterIcon} />
                      <span className={styles.masterName}>{getMasterName(purchase.master_id)}</span>
                    </div>
                    <div className={styles.dateInfo}>
                      <FaCalendar className={styles.dateIcon} />
                      <span>{formatDate(purchase.purchase_date)}</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.materialInfo}>
                      <FaBox className={styles.materialIcon} />
                      <div>
                        <div className={styles.materialName}>{getMaterialName(purchase.material_id)}</div>
                        <div className={styles.materialUnit}>{getMaterialUnit(purchase.material_id)}</div>
                      </div>
                    </div>

                    <div className={styles.priceInfo}>
                      <div className={styles.quantityInfo}>
                        <span className={styles.label}>Miqdar:</span>
                        <span className={styles.value}>{purchase.quantity}</span>
                      </div>
                      <div className={styles.unitPriceInfo}>
                        <span className={styles.label}>Vahid qiymət:</span>
                        <span className={styles.value}>{purchase.unit_price} AZN</span>
                      </div>
                      <div className={styles.totalInfo}>
                        <span className={styles.label}>Cəmi:</span>
                        <span className={styles.totalValue}>{total} AZN</span>
                      </div>
                    </div>

                    {purchase.notes && (
                      <div className={styles.notes}>
                        <span className={styles.notesLabel}>📝 Qeyd:</span>
                        <span className={styles.notesText}>{purchase.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal(purchase)} className={styles.editBtn}>
                      <FaEdit /> Düzəliş
                    </button>
                    <button onClick={() => openDeleteModal(purchase)} className={styles.deleteBtn}>
                      <FaTrash /> Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
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
                <h2>➕ Yeni material alışı</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Ustad *</label>
                  <select
                    value={form.master_id}
                    onChange={e => setForm({ ...form, master_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Ustad seçin</option>
                    {masters.map(m => (
                      <option key={m._id} value={m._id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Material *</label>
                  <select
                    value={form.material_id}
                    onChange={e => setForm({ ...form, material_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Material seçin</option>
                    {materials.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Miqdar *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.quantity || ''}
                      onChange={e => setForm({ ...form, quantity: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Vahid qiymət (AZN) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={form.unit_price || ''}
                      onChange={e => setForm({ ...form, unit_price: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Alış tarixi *</label>
                  <input
                    type="date"
                    value={form.purchase_date}
                    onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qeyd</label>
                  <textarea
                    placeholder="Əlavə qeyd..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>

                {form.quantity > 0 && form.unit_price > 0 && (
                  <div className={styles.totalPreview}>
                    <FaMoneyBillWave />
                    <span>Cəmi: <strong>{(form.quantity * form.unit_price).toLocaleString()} AZN</strong></span>
                  </div>
                )}
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
        {modalType === 'edit' && selectedPurchase && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>✏️ Material alışını yenilə</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Ustad *</label>
                  <select
                    value={editForm.master_id}
                    onChange={e => setEditForm({ ...editForm, master_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Ustad seçin</option>
                    {masters.map(m => (
                      <option key={m._id} value={m._id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Material *</label>
                  <select
                    value={editForm.material_id}
                    onChange={e => setEditForm({ ...editForm, material_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Material seçin</option>
                    {materials.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Miqdar *</label>
                    <input
                      type="number"
                      value={editForm.quantity || ''}
                      onChange={e => setEditForm({ ...editForm, quantity: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Vahid qiymət (AZN) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.unit_price || ''}
                      onChange={e => setEditForm({ ...editForm, unit_price: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Alış tarixi *</label>
                  <input
                    type="date"
                    value={editForm.purchase_date}
                    onChange={e => setEditForm({ ...editForm, purchase_date: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qeyd</label>
                  <textarea
                    placeholder="Əlavə qeyd..."
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>

                {editForm.quantity > 0 && editForm.unit_price > 0 && (
                  <div className={styles.totalPreview}>
                    <FaMoneyBillWave />
                    <span>Cəmi: <strong>{(editForm.quantity * editForm.unit_price).toLocaleString()} AZN</strong></span>
                  </div>
                )}
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
        {modalType === 'delete' && selectedPurchase && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🗑️ Alışı sil</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteIcon}>⚠️</div>
                  <p>
                    Bu alışı silmək istədiyinizdən əminsiniz?
                  </p>
                  <p className={styles.deleteWarning}>
                    <strong>Material:</strong> {getMaterialName(selectedPurchase.material_id)}<br />
                    <strong>Miqdar:</strong> {selectedPurchase.quantity} {getMaterialUnit(selectedPurchase.material_id)}<br />
                    <strong>Məbləğ:</strong> {(selectedPurchase.quantity * selectedPurchase.unit_price).toLocaleString()} AZN
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

export default PurchasesPage;