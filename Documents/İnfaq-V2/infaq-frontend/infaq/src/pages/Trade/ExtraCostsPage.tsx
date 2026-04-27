import React, { useEffect, useState, useCallback } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaTimes, 
  FaMoneyBillWave, FaUser, FaBox, FaCalendar, 
  FaTag, FaPercent, FaSave, FaMoneyCheckAlt,
  FaInfoCircle
} from 'react-icons/fa';
import styles from './ExtraCostsPage.module.css';

interface Master { 
  _id: string; 
  full_name: string; 
}

interface Product { 
  _id: string; 
  name: string; 
}

interface ExtraCostItem {
  _id: string; 
  name: string; 
  amount: number;
  cost_type: 'per_product' | 'batch';
  batch_quantity?: number;
  quantity_per_unit?: number;
  cost_date: string; 
  master_id: string | Master;
  product_id?: string | Product;
  created_at: string;
}

interface ExtraCostForm {
  master_id: string;
  product_id: string;
  name: string;
  amount: number;
  cost_type: 'per_product' | 'batch';
  batch_quantity: number;
  quantity_per_unit: number;
  cost_date: string;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

const ExtraCostsPage: React.FC = () => {
  const [costs, setCosts] = useState<ExtraCostItem[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCost, setSelectedCost] = useState<ExtraCostItem | null>(null);
  const [form, setForm] = useState<ExtraCostForm>({
    master_id: '',
    product_id: '',
    name: '',
    amount: 0,
    cost_type: 'per_product',
    batch_quantity: 1,
    quantity_per_unit: 1,
    cost_date: new Date().toISOString().split('T')[0]
  });
  const [editForm, setEditForm] = useState<ExtraCostForm>({
    master_id: '',
    product_id: '',
    name: '',
    amount: 0,
    cost_type: 'per_product',
    batch_quantity: 1,
    quantity_per_unit: 1,
    cost_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [costsRes, mastersRes, productsRes] = await Promise.all([
        tradeService.getExtraCosts(),
        tradeService.getMasters(),
        tradeService.getProducts()
      ]);
      setCosts(costsRes.data || []);
      setMasters(mastersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      master_id: '',
      product_id: '',
      name: '',
      amount: 0,
      cost_type: 'per_product',
      batch_quantity: 1,
      quantity_per_unit: 1,
      cost_date: new Date().toISOString().split('T')[0]
    });
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (cost: ExtraCostItem) => {
    setSelectedCost(cost);
    setEditForm({
      master_id: typeof cost.master_id === 'object' ? cost.master_id._id : cost.master_id,
      product_id: cost.product_id ? (typeof cost.product_id === 'object' ? cost.product_id._id : cost.product_id) : '',
      name: cost.name,
      amount: cost.amount,
      cost_type: cost.cost_type,
      batch_quantity: cost.batch_quantity || 1,
      quantity_per_unit: cost.quantity_per_unit || 1,
      cost_date: cost.cost_date.split('T')[0]
    });
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (cost: ExtraCostItem) => {
    setSelectedCost(cost);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCost(null);
    document.body.style.overflow = 'unset';
  };

  const handleCreate = async () => {
    if (!form.master_id || !form.name || !form.amount || !form.cost_date) {
      toast.error('Bütün sahələri doldurun');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        master_id: form.master_id,
        name: form.name,
        amount: form.amount,
        cost_type: form.cost_type,
        batch_quantity: form.batch_quantity,
        quantity_per_unit: form.quantity_per_unit || 1,
        cost_date: form.cost_date,
        product_id: form.product_id || undefined
      };
      await tradeService.createExtraCost(submitData);
      toast.success('Əlavə xərc əlavə edildi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Əlavə etmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCost) return;
    if (!editForm.master_id || !editForm.name || !editForm.amount || !editForm.cost_date) {
      toast.error('Bütün sahələri doldurun');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        master_id: editForm.master_id,
        name: editForm.name,
        amount: editForm.amount,
        cost_type: editForm.cost_type,
        batch_quantity: editForm.batch_quantity,
        quantity_per_unit: editForm.quantity_per_unit || 1,
        cost_date: editForm.cost_date,
        product_id: editForm.product_id || undefined
      };
      await tradeService.updateExtraCost(selectedCost._id, submitData);
      toast.success('Əlavə xərc yeniləndi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Yeniləmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCost) return;
    setSubmitting(true);
    try {
      await tradeService.deleteExtraCost(selectedCost._id);
      toast.success('Əlavə xərc silindi');
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

  const getProductName = (product: Product | string | undefined): string => {
    if (!product) return 'Ümumi';
    if (typeof product === 'object' && product?.name) return product.name;
    const found = products.find(p => p._id === product);
    return found?.name || 'Naməlum';
  };

  const filteredCosts = costs.filter(cost => {
    const masterName = getMasterName(cost.master_id).toLowerCase();
    const costName = cost.name.toLowerCase();
    const productName = getProductName(cost.product_id).toLowerCase();
    return masterName.includes(searchTerm.toLowerCase()) || 
           costName.includes(searchTerm.toLowerCase()) ||
           productName.includes(searchTerm.toLowerCase());
  });

  const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const perProductTotal = costs.filter(c => c.cost_type === 'per_product').reduce((sum, cost) => sum + cost.amount, 0);
  const batchTotal = costs.filter(c => c.cost_type === 'batch').reduce((sum, cost) => sum + cost.amount, 0);

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
              <FaMoneyCheckAlt />
            </div>
            <div>
              <h1 className={styles.title}>Əlavə xərclər</h1>
              <p className={styles.subtitle}>Məhsullara və partiyalara aid əlavə xərclərin idarəsi</p>
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.createBtn}>
            <FaPlus /> Yeni xərc
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
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statInfo}>
              <h3>{perProductTotal.toLocaleString()} AZN</h3>
              <p>Bir məhsula aydın</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>{batchTotal.toLocaleString()} AZN</h3>
              <p>Partiya ümumi</p>
            </div>
          </div>
        </div>

        {/* Axtarış */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Xərc adı, ustad və ya məhsula görə axtar..."
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
                {filteredCosts.length} / {costs.length} nəticə
              </span>
            )}
          </div>
        </div>

        {/* Xərclər qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Xərclər yüklənir...</p>
          </div>
        ) : filteredCosts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💰</div>
            <h3>{searchTerm ? 'Nəticə tapılmadı' : 'Heç bir xərc yoxdur'}</h3>
            <p>
              {searchTerm 
                ? `"${searchTerm}" üçün xərc tapılmadı`
                : 'İlk əlavə xərci əlavə edin'}
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                <FaPlus /> İlk xərci əlavə et
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredCosts.map((cost) => (
              <motion.div
                key={cost._id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.costTypeBadge}>
                    {cost.cost_type === 'per_product' ? '📦 Bir məhsula' : '📊 Partiya ümumi'}
                  </div>
                  <div className={styles.dateInfo}>
                    <FaCalendar className={styles.dateIcon} />
                    <span>{formatDate(cost.cost_date)}</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.costName}>{cost.name}</h3>
                  <div className={styles.amountInfo}>
                    <FaMoneyBillWave className={styles.amountIcon} />
                    <span className={styles.amountValue}>{cost.amount.toLocaleString()} AZN</span>
                  </div>
                  <div className={styles.masterInfo}>
                    <FaUser className={styles.masterIcon} />
                    <span>{getMasterName(cost.master_id)}</span>
                  </div>
                  {cost.product_id && (
                    <div className={styles.productInfo}>
                      <FaBox className={styles.productIcon} />
                      <span>{getProductName(cost.product_id)}</span>
                    </div>
                  )}
                  {cost.cost_type === 'batch' && cost.batch_quantity && (
                    <div className={styles.batchInfo}>
                      <FaTag className={styles.batchIcon} />
                      <span>Partiyada {cost.batch_quantity} məhsul</span>
                    </div>
                  )}
                  {cost.quantity_per_unit && cost.quantity_per_unit > 1 && (
                    <div className={styles.quantityInfo}>
                      <FaInfoCircle className={styles.quantityIcon} />
                      <span>1 vahid = {cost.quantity_per_unit} dənə</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => openEditModal(cost)} className={styles.editBtn}>
                    <FaEdit /> Düzəliş
                  </button>
                  <button onClick={() => openDeleteModal(cost)} className={styles.deleteBtn}>
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
                <h2>➕ Yeni əlavə xərc</h2>
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
                  <label>Məhsul (istəyə bağlı)</label>
                  <select
                    value={form.product_id}
                    onChange={e => setForm({ ...form, product_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Bütün məhsullar üçün</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Xərc adı *</label>
                  <input
                    type="text"
                    placeholder="Məsələn: Kuryer xidməti"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Məbləğ (AZN) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount || ''}
                      onChange={e => setForm({ ...form, amount: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tarix *</label>
                    <input
                      type="date"
                      value={form.cost_date}
                      onChange={e => setForm({ ...form, cost_date: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Xərc tipi *</label>
                  <div className={styles.typeButtons}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cost_type: 'per_product', batch_quantity: 1 })}
                      className={`${styles.typeBtn} ${form.cost_type === 'per_product' ? styles.active : ''}`}
                    >
                      📦 Bir məhsula aydın
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cost_type: 'batch', batch_quantity: 1 })}
                      className={`${styles.typeBtn} ${form.cost_type === 'batch' ? styles.active : ''}`}
                    >
                      📊 Partiya ümumi
                    </button>
                  </div>
                </div>
                {form.cost_type === 'batch' && (
                  <div className={styles.formGroup}>
                    <label>Partiyadakı məhsul sayı *</label>
                    <input
                      type="number"
                      value={form.batch_quantity}
                      onChange={e => setForm({ ...form, batch_quantity: +e.target.value })}
                      className={styles.input}
                      min="1"
                    />
                    <p className={styles.hint}>
                      <FaInfoCircle className={styles.hintIcon} />
                      Xərc {form.batch_quantity} məhsula bərabər bölünəcək
                    </p>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>1 vahiddə neçə dənə? <span className={styles.optional}>(isteğe bağlı)</span></label>
                  <input
                    type="number"
                    placeholder="Məsələn: 100 (1 paket = 100 ədəd)"
                    value={form.quantity_per_unit || ''}
                    onChange={e => setForm({ ...form, quantity_per_unit: +e.target.value })}
                    className={styles.input}
                    min="1"
                    step="1"
                  />
                  <p className={styles.hint}>
                    <FaInfoCircle className={styles.hintIcon} />
                    Məsələn: 1 paket = 10 dənə
                  </p>
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
        {modalType === 'edit' && selectedCost && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>✏️ Əlavə xərci yenilə</h2>
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
                  <label>Məhsul (istəyə bağlı)</label>
                  <select
                    value={editForm.product_id}
                    onChange={e => setEditForm({ ...editForm, product_id: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Bütün məhsullar üçün</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Xərc adı *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Məbləğ (AZN) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount || ''}
                      onChange={e => setEditForm({ ...editForm, amount: +e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tarix *</label>
                    <input
                      type="date"
                      value={editForm.cost_date}
                      onChange={e => setEditForm({ ...editForm, cost_date: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Xərc tipi *</label>
                  <div className={styles.typeButtons}>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, cost_type: 'per_product', batch_quantity: 1 })}
                      className={`${styles.typeBtn} ${editForm.cost_type === 'per_product' ? styles.active : ''}`}
                    >
                      📦 Bir məhsula aydın
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, cost_type: 'batch', batch_quantity: 1 })}
                      className={`${styles.typeBtn} ${editForm.cost_type === 'batch' ? styles.active : ''}`}
                    >
                      📊 Partiya ümumi
                    </button>
                  </div>
                </div>
                {editForm.cost_type === 'batch' && (
                  <div className={styles.formGroup}>
                    <label>Partiyadakı məhsul sayı *</label>
                    <input
                      type="number"
                      value={editForm.batch_quantity}
                      onChange={e => setEditForm({ ...editForm, batch_quantity: +e.target.value })}
                      className={styles.input}
                      min="1"
                    />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>1 vahiddə neçə dənə?</label>
                  <input
                    type="number"
                    value={editForm.quantity_per_unit || ''}
                    onChange={e => setEditForm({ ...editForm, quantity_per_unit: +e.target.value })}
                    className={styles.input}
                    min="1"
                    step="1"
                  />
                  <p className={styles.hint}>
                    <FaInfoCircle className={styles.hintIcon} />
                    Məsələn: 1 paket = 10 dənə
                  </p>
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
        {modalType === 'delete' && selectedCost && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🗑️ Xərci sil</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteIcon}>⚠️</div>
                  <p>
                    <strong>"{selectedCost.name}"</strong> xərcini silmək istədiyinizdən əminsiniz?
                  </p>
                  <p className={styles.deleteWarning}>
                    <strong>Məbləğ:</strong> {selectedCost.amount.toLocaleString()} AZN<br />
                    <strong>Ustad:</strong> {getMasterName(selectedCost.master_id)}<br />
                    <strong>Məhsul:</strong> {getProductName(selectedCost.product_id)}
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

export default ExtraCostsPage;