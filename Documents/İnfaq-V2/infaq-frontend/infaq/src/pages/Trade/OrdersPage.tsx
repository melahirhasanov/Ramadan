import React, { useEffect, useState, useCallback } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaTimes, 
  FaInstagram, FaUserFriends, FaHandsHelping, FaCalendar,
  FaMoneyBillWave, FaBox, FaUser, FaClipboardList,
  FaCheckCircle, FaClock, FaSpinner as FaSpinnerIcon,
  FaTools, FaShippingFast, FaHome, FaSave, FaSearch,
  FaChartLine, FaTags, FaInfoCircle
} from 'react-icons/fa';
import styles from './OrdersPage.module.css';

interface Product { 
  _id: string; 
  name: string; 
  is_approved: boolean; 
}

interface Person { 
  _id: string; 
  full_name: string; 
  role?: string;
}

// 🔥 product_id həm string, həm də populated obyekt ola bilər
interface OrderItem { 
  product_id: string | { _id: string; name: string }; 
  quantity: number; 
  unit_selling_price: number; 
  product_name?: string;
}

interface Order {
  _id: string; 
  order_date: string; 
  total_price: number; 
  platform: string;
  responsible_user_id: string | Person;
  status: string; 
  notes: string; 
  items?: OrderItem[];
  created_at: string;
}

interface OrderForm {
  order_date: string;
  platform: string;
  responsible_user_id: string;
  status: string;
  notes: string;
  items: OrderItem[];
}

type ModalType = 'create' | 'edit' | 'delete' | null;

// Platform ikonları və adları
const platformConfig: Record<string, { icon: JSX.Element; label: string; color: string }> = {
  instagram: { icon: <FaInstagram />, label: 'Instagram', color: '#E4405F' },
  tanis: { icon: <FaUserFriends />, label: 'Tanış', color: '#3B82F6' },
  konullu: { icon: <FaHandsHelping />, label: 'Könüllü', color: '#10B981' }
};

// Status konfiqurasiyası
const statusConfig: Record<string, { icon: JSX.Element; label: string; color: string; bg: string }> = {
  gozlemede: { icon: <FaClock />, label: 'Gözləmədə', color: '#F59E0B', bg: '#FEF3C7' },
  qebul_edilib: { icon: <FaCheckCircle />, label: 'Qəbul edilib', color: '#10B981', bg: '#D1FAE5' },
  davam_edir: { icon: <FaSpinnerIcon />, label: 'Davam edir', color: '#6366F1', bg: '#E0E7FF' },
  hazirlanir: { icon: <FaTools />, label: 'Hazırlanır', color: '#8B5CF6', bg: '#EDE9FE' },
  gonderilib: { icon: <FaShippingFast />, label: 'Göndərilib', color: '#3B82F6', bg: '#DBEAFE' },
  catdirilib: { icon: <FaHome />, label: 'Çatdırılıb', color: '#059669', bg: '#A7F3D0' }
};

const statusOptions = Object.keys(statusConfig);
const statusLabels = Object.fromEntries(Object.entries(statusConfig).map(([k, v]) => [k, v.label]));

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderForm>({
    order_date: new Date().toISOString().slice(0, 10),
    platform: 'instagram',
    responsible_user_id: '',
    status: 'gozlemede',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_selling_price: 0 }]
  });
  const [editForm, setEditForm] = useState<OrderForm>({
    order_date: '',
    platform: 'instagram',
    responsible_user_id: '',
    status: 'gozlemede',
    notes: '',
    items: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, personsRes] = await Promise.all([
        tradeService.getOrders(),
        tradeService.getProducts(),
        tradeService.getPersons()
      ]);
      setOrders(ordersRes.data || []);
      setProducts(productsRes.data?.filter((p: Product) => p.is_approved) || []);
      setPersons(personsRes.data || []);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const getPersonName = (person: string | Person | undefined): string => {
    if (!person) return 'Naməlum';
    if (typeof person === 'string') {
      const found = persons.find(p => p._id === person);
      return found?.full_name || person;
    }
    return person.full_name || 'Naməlum';
  };

  const getProductName = (product: string | { _id: string; name: string } | undefined): string => {
    if (!product) return 'Naməlum';
    if (typeof product === 'string') {
      const found = products.find(p => p._id === product);
      return found?.name || product;
    }
    return product.name || 'Naməlum';
  };

  const openCreateModal = () => {
    setForm({
      order_date: new Date().toISOString().slice(0, 10),
      platform: 'instagram',
      responsible_user_id: '',
      status: 'gozlemede',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_selling_price: 0 }]
    });
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = async (order: Order) => {
    setSelectedOrder(order);
    let responsibleId = '';
    if (typeof order.responsible_user_id === 'string') {
      responsibleId = order.responsible_user_id;
    } else {
      responsibleId = order.responsible_user_id?._id || '';
    }
    setEditForm({
      order_date: order.order_date.split('T')[0],
      platform: order.platform,
      responsible_user_id: responsibleId,
      status: order.status,
      notes: order.notes || '',
      items: (order.items || []).map(item => ({ 
        product_id: typeof item.product_id === 'string' ? item.product_id : item.product_id._id,
        quantity: item.quantity,
        unit_selling_price: item.unit_selling_price
      }))
    });
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedOrder(null);
    document.body.style.overflow = 'unset';
  };

  const addItem = (currentForm: OrderForm, setCurrentForm: React.Dispatch<React.SetStateAction<OrderForm>>) => {
    setCurrentForm({
      ...currentForm,
      items: [...currentForm.items, { product_id: '', quantity: 1, unit_selling_price: 0 }]
    });
  };

  const removeItem = (idx: number, currentForm: OrderForm, setCurrentForm: React.Dispatch<React.SetStateAction<OrderForm>>) => {
    const newItems = currentForm.items.filter((_, i) => i !== idx);
    setCurrentForm({ ...currentForm, items: newItems });
    if (newItems.length === 0) {
      addItem(currentForm, setCurrentForm);
    }
  };

  const updateItem = (idx: number, field: keyof OrderItem, value: string | number, currentForm: OrderForm, setCurrentForm: React.Dispatch<React.SetStateAction<OrderForm>>) => {
    const newItems = [...currentForm.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setCurrentForm({ ...currentForm, items: newItems });
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.unit_selling_price * item.quantity), 0);
  };

  // 🔥 DÜZƏLDİ: Backend-ə göndərilən items-lərdə product_id sadəcə string olsun
  const handleCreate = async () => {
    if (!form.responsible_user_id) {
      toast.error('Məsul şəxs seçin');
      return;
    }
    if (form.items.some(item => !item.product_id || item.quantity <= 0)) {
      toast.error('Məhsul və miqdar düzgün deyil');
      return;
    }

    setSubmitting(true);
    try {
      const total = calculateTotal(form.items);
      const itemsForBackend = form.items.map(item => ({
        product_id: typeof item.product_id === 'string' ? item.product_id : item.product_id._id,
        quantity: item.quantity,
        unit_selling_price: item.unit_selling_price
      }));
      await tradeService.createOrder({ ...form, items: itemsForBackend, total_price: total });
      toast.success('Sifariş yaradıldı');
      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 DÜZƏLDİ: Backend-ə göndərilən items-lərdə product_id sadəcə string olsun
  const handleUpdate = async () => {
    if (!selectedOrder) return;
    if (!editForm.responsible_user_id) {
      toast.error('Məsul şəxs seçin');
      return;
    }
    if (editForm.items.some(item => !item.product_id || item.quantity <= 0)) {
      toast.error('Məhsul və miqdar düzgün deyil');
      return;
    }

    setSubmitting(true);
    try {
      const total = calculateTotal(editForm.items);
      const itemsForBackend = editForm.items.map(item => ({
        product_id: typeof item.product_id === 'string' ? item.product_id : item.product_id._id,
        quantity: item.quantity,
        unit_selling_price: item.unit_selling_price
      }));
      await tradeService.updateOrder(selectedOrder._id, { ...editForm, items: itemsForBackend, total_price: total });
      toast.success('Sifariş yeniləndi');
      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Yeniləmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await tradeService.deleteOrder(selectedOrder._id);
      toast.success('Sifariş silindi');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await tradeService.updateOrderStatus(id, status);
      toast.success('Status yeniləndi');
      fetchData();
    } catch (error) {
      toast.error('Xəta');
    }
  };

  const getPersonNameForSearch = (person: string | Person | undefined): string => {
    if (!person) return '';
    if (typeof person === 'string') {
      const found = persons.find(p => p._id === person);
      return found?.full_name || person;
    }
    return person.full_name || '';
  };

  const filteredOrders = orders.filter(order => {
    const personName = getPersonNameForSearch(order.responsible_user_id).toLowerCase();
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personName.includes(searchTerm.toLowerCase()) ||
      (order.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const pendingOrders = orders.filter(o => o.status === 'gozlemede' || o.status === 'qebul_edilib').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, type: 'spring', stiffness: 100 } }
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
              <FaClipboardList />
            </div>
            <div>
              <h1 className={styles.title}>Sifarişlər</h1>
              <p className={styles.subtitle}>Müştəri sifarişlərinin tam idarəsi</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal} 
            className={styles.createBtn}
          >
            <FaPlus /> Yeni sifariş
          </motion.button>
        </div>

        {/* Statistikalar */}
        <motion.div 
          className={styles.statsGrid}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <h3>{totalRevenue.toLocaleString()} AZN</h3>
              <p>Ümumi gəlir</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statInfo}>
              <h3>{totalOrders}</h3>
              <p>Sifariş sayı</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>{avgOrderValue.toFixed(2)} AZN</h3>
              <p>Orta sifariş dəyəri</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <h3>{pendingOrders}</h3>
              <p>Aktiv sifarişlər</p>
            </div>
          </div>
        </motion.div>

        {/* Filtrlər və axtarış */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Sifariş ID, məsul şəxs və ya qeydə görə axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={styles.clearBtn}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className={styles.filterGroup}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Bütün statuslar</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            
            <select 
              value={platformFilter} 
              onChange={(e) => setPlatformFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Bütün platformalar</option>
              <option value="instagram">Instagram</option>
              <option value="tanis">Tanış</option>
              <option value="konullu">Könüllü</option>
            </select>
          </div>
        </div>

        {/* Sifarişlər qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Sifarişlər yüklənir...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>{searchTerm || statusFilter !== 'all' || platformFilter !== 'all' ? 'Nəticə tapılmadı' : 'Heç bir sifariş yoxdur'}</h3>
            <p>
              {searchTerm || statusFilter !== 'all' || platformFilter !== 'all' 
                ? 'Filtr parametrlərini dəyişin'
                : 'İlk sifarişi yaradın'}
            </p>
            {!searchTerm && statusFilter === 'all' && platformFilter === 'all' && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                <FaPlus /> İlk sifarişi yarat
              </button>
            )}
          </div>
        ) : (
          <motion.div 
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredOrders.map((order) => {
              const platform = platformConfig[order.platform] || platformConfig.instagram;
              const status = statusConfig[order.status] || statusConfig.gozlemede;
              const itemsArray = order.items || [];
              const totalItems = itemsArray.reduce((sum, i) => sum + i.quantity, 0);
              
              return (
                <motion.div
                  key={order._id}
                  className={styles.card}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.platformBadge} style={{ background: platform.color }}>
                      {platform.icon}
                      <span>{platform.label}</span>
                    </div>
                    <div className={styles.orderId}>#{order._id.slice(-6)}</div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.dateRow}>
                      <FaCalendar className={styles.icon} />
                      <span>{formatDate(order.order_date)}</span>
                    </div>
                    
                    <div className={styles.totalRow}>
                      <FaMoneyBillWave className={styles.icon} />
                      <span className={styles.totalAmount}>{order.total_price.toLocaleString()} AZN</span>
                    </div>

                    <div className={styles.itemsRow}>
                      <FaBox className={styles.icon} />
                      <span>{itemsArray.length} məhsul, {totalItems} ədəd</span>
                    </div>

                    <div className={styles.responsibleRow}>
                      <FaUser className={styles.icon} />
                      <span>{getPersonName(order.responsible_user_id)}</span>
                    </div>

                    {/* Məhsul siyahısı */}
                    {itemsArray.length > 0 && (
                      <div className={styles.itemsDetail}>
                        <strong>Məhsullar:</strong>
                        {itemsArray.map((item, idx) => (
                          <div key={idx} className={styles.orderItem}>
                            <span className={styles.itemName}>
                              {getProductName(item.product_id)}
                            </span>
                            <span className={styles.itemQuantity}>x {item.quantity}</span>
                            <span className={styles.itemPrice}>{item.unit_selling_price} AZN</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.notes && (
                      <div className={styles.notesRow}>
                        <FaInfoCircle className={styles.icon} />
                        <span className={styles.notesText}>{order.notes}</span>
                      </div>
                    )}

                    <div className={styles.statusRow}>
                      <div className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{statusLabels[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal(order)} className={styles.editBtn}>
                      <FaEdit /> Düzəliş
                    </button>
                    <button onClick={() => openDeleteModal(order)} className={styles.deleteBtn}>
                      <FaTrash /> Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ========== CREATE/EDIT MODAL ========== */}
      <AnimatePresence>
        {(modalType === 'create' || modalType === 'edit') && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  {modalType === 'create' ? '➕ Yeni sifariş' : '✏️ Sifarişi yenilə'}
                </h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Tarix */}
                <div className={styles.formGroup}>
                  <label>Sifariş tarixi *</label>
                  <input
                    type="date"
                    value={modalType === 'create' ? form.order_date : editForm.order_date}
                    onChange={e => modalType === 'create' 
                      ? setForm({ ...form, order_date: e.target.value })
                      : setEditForm({ ...editForm, order_date: e.target.value })
                    }
                    className={styles.input}
                  />
                </div>

                {/* Platforma */}
                <div className={styles.formGroup}>
                  <label>Platforma *</label>
                  <div className={styles.platformButtons}>
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => modalType === 'create'
                          ? setForm({ ...form, platform: key })
                          : setEditForm({ ...editForm, platform: key })
                        }
                        className={`${styles.platformBtn} ${(modalType === 'create' ? form.platform : editForm.platform) === key ? styles.active : ''}`}
                        style={{ borderColor: config.color }}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Məsul şəxs */}
                <div className={styles.formGroup}>
                  <label>Məsul şəxs *</label>
                  <select
                    value={modalType === 'create' ? form.responsible_user_id : editForm.responsible_user_id}
                    onChange={e => modalType === 'create'
                      ? setForm({ ...form, responsible_user_id: e.target.value })
                      : setEditForm({ ...editForm, responsible_user_id: e.target.value })
                    }
                    className={styles.select}
                  >
                    <option value="">Məsul şəxs seçin</option>
                    {persons.map(p => (
                      <option key={p._id} value={p._id}>{p.full_name} {p.role === 'master' ? '(Ustad)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Qeyd */}
                <div className={styles.formGroup}>
                  <label>Qeyd</label>
                  <textarea
                    placeholder="Əlavə qeyd..."
                    value={modalType === 'create' ? form.notes : editForm.notes}
                    onChange={e => modalType === 'create'
                      ? setForm({ ...form, notes: e.target.value })
                      : setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className={styles.textarea}
                    rows={2}
                  />
                </div>

                {/* Məhsullar */}
                <div className={styles.formGroup}>
                  <label>Məhsullar *</label>
                  <div className={styles.itemsList}>
                    {(modalType === 'create' ? form.items : editForm.items).map((item, idx) => (
                      <div key={idx} className={styles.itemRow}>
                        <select
                          value={item.product_id as string}
                          onChange={e => updateItem(idx, 'product_id', e.target.value, 
                            modalType === 'create' ? form : editForm,
                            modalType === 'create' ? setForm : setEditForm
                          )}
                          className={styles.itemSelect}
                        >
                          <option value="">Məhsul seçin</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Miqdar"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', +e.target.value,
                            modalType === 'create' ? form : editForm,
                            modalType === 'create' ? setForm : setEditForm
                          )}
                          className={styles.itemQuantity}
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Qiymət (AZN)"
                          value={item.unit_selling_price}
                          onChange={e => updateItem(idx, 'unit_selling_price', +e.target.value,
                            modalType === 'create' ? form : editForm,
                            modalType === 'create' ? setForm : setEditForm
                          )}
                          className={styles.itemPrice}
                          step="0.01"
                          min="0"
                        />
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx,
                            modalType === 'create' ? form : editForm,
                            modalType === 'create' ? setForm : setEditForm
                          )}
                          className={styles.removeItemBtn}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(
                      modalType === 'create' ? form : editForm,
                      modalType === 'create' ? setForm : setEditForm
                    )}
                    className={styles.addItemBtn}
                  >
                    <FaPlus /> Məhsul əlavə et
                  </button>
                </div>

                {/* Cəmi önizləmə */}
                <div className={styles.totalPreview}>
                  <FaMoneyBillWave />
                  <span>Cəmi: <strong>
                    {calculateTotal(modalType === 'create' ? form.items : editForm.items).toLocaleString()} AZN
                  </strong></span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button 
                  onClick={modalType === 'create' ? handleCreate : handleUpdate} 
                  className={styles.submitModalBtn} 
                  disabled={submitting}
                >
                  {submitting ? <><FaSpinner className={styles.btnSpinner} /> Yüklənir...</> : <><FaSave /> {modalType === 'create' ? 'Yarat' : 'Yenilə'}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== DELETE MODAL ========== */}
      <AnimatePresence>
        {modalType === 'delete' && selectedOrder && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🗑️ Sifarişi sil</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteIcon}>⚠️</div>
                  <p>
                    <strong>#{selectedOrder._id.slice(-6)}</strong> sifarişini silmək istədiyinizdən əminsiniz?
                  </p>
                  <p className={styles.deleteWarning}>
                    <strong>Tarix:</strong> {formatDate(selectedOrder.order_date)}<br />
                    <strong>Məbləğ:</strong> {selectedOrder.total_price} AZN<br />
                    <strong>Platforma:</strong> {platformConfig[selectedOrder.platform]?.label || selectedOrder.platform}
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

export default OrdersPage;