import React, { useEffect, useState } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, 
  FaBoxes, FaTags, FaPlusCircle, FaCheck,
  FaInfoCircle
} from 'react-icons/fa';
import styles from './MaterialsPage.module.css';

// 🔥 DÜZƏLİŞ: Material interface-inə quantity_per_unit əlavə edildi
interface Material {
  _id: string;
  name: string;
  unit: string;
  quantity_per_unit: number;
  created_at: string;
}

interface MaterialForm {
  name: string;
  unit: string;
  quantity_per_unit: number;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

// Dinamik vahidlər - istifadəçi tərəfindən artırıla bilər
const DEFAULT_UNITS = ['dənə', 'metr', 'kq', 'qram', 'litr', 'ədəd', 'paket', 'rulon', 'iplik', 'kutu'];

// Vahid üçün ikon seç
const getUnitIcon = (unit: string): string => {
  const unitIcons: { [key: string]: string } = {
    'dənə': '🔢',
    'ədəd': '🔢',
    'metr': '📏',
    'kq': '⚖️',
    'qram': '⚖️',
    'litr': '💧',
    'paket': '📦',
    'rulon': '🧻',
    'iplik': '🧵',
    'kutu': '📦'
  };
  return unitIcons[unit] || '📐';
};

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialForm>({ name: '', unit: '', quantity_per_unit: 1 });
  const [editForm, setEditForm] = useState<MaterialForm>({ name: '', unit: '', quantity_per_unit: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Yeni vahid əlavə etmək üçün
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<string[]>(DEFAULT_UNITS);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    loadUnitsFromMaterials();
  }, [materials]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await tradeService.getMaterials();
      setMaterials(res.data || []);
    } catch (error) {
      toast.error('Materiallar yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  // Materiallardan istifadə edilən vahidləri topla
  const loadUnitsFromMaterials = () => {
    const existingUnits = materials.map(m => m.unit);
    const uniqueUnits = [...new Set([...DEFAULT_UNITS, ...existingUnits])];
    setAvailableUnits(uniqueUnits);
  };

  // Yeni vahid əlavə et
  const addNewUnit = () => {
    if (!customUnit.trim()) {
      toast.error('Vahid adını daxil edin');
      return;
    }
    
    const normalizedUnit = customUnit.trim().toLowerCase();
    if (availableUnits.includes(normalizedUnit)) {
      toast.error('Bu vahid artıq mövcuddur');
      setCustomUnit('');
      setShowCustomUnitInput(false);
      return;
    }
    
    setAvailableUnits(prev => [...prev, normalizedUnit]);
    setForm(prev => ({ ...prev, unit: normalizedUnit }));
    setCustomUnit('');
    setShowCustomUnitInput(false);
    toast.success(`"${normalizedUnit}" vahidi əlavə edildi`);
  };

  const openCreateModal = () => {
    setForm({ name: '', unit: '', quantity_per_unit: 1 });
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setEditForm({ 
      name: material.name, 
      unit: material.unit,
      quantity_per_unit: material.quantity_per_unit || 1
    });
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (material: Material) => {
    setSelectedMaterial(material);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedMaterial(null);
    setForm({ name: '', unit: '', quantity_per_unit: 1 });
    setEditForm({ name: '', unit: '', quantity_per_unit: 1 });
    setShowCustomUnitInput(false);
    setCustomUnit('');
    document.body.style.overflow = 'unset';
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Material adını daxil edin');
      return;
    }
    if (!form.unit.trim()) {
      toast.error('Vahid seçin və ya əlavə edin');
      return;
    }

    setSubmitting(true);
    try {
      await tradeService.createMaterial({ 
        name: form.name, 
        unit: form.unit,
        quantity_per_unit: form.quantity_per_unit || 1
      });
      toast.success('Material əlavə edildi');
      closeModal();
      fetchMaterials();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Bu adda material artıq mövcuddur');
      } else {
        toast.error('Əlavə etmə xətası');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMaterial) return;
    if (!editForm.name.trim()) {
      toast.error('Material adını daxil edin');
      return;
    }
    if (!editForm.unit.trim()) {
      toast.error('Vahid seçin');
      return;
    }

    setSubmitting(true);
    try {
      await tradeService.updateMaterial(selectedMaterial._id, { 
        name: editForm.name, 
        unit: editForm.unit,
        quantity_per_unit: editForm.quantity_per_unit || 1
      });
      toast.success('Material yeniləndi');
      closeModal();
      fetchMaterials();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Bu adda material artıq mövcuddur');
      } else {
        toast.error('Yeniləmə xətası');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;

    setSubmitting(true);
    try {
      await tradeService.deleteMaterial(selectedMaterial._id);
      toast.success('Material silindi');
      closeModal();
      fetchMaterials();
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Quantity per unit göstəricisi
  const getQuantityDisplay = (material: Material) => {
    if (material.quantity_per_unit && material.quantity_per_unit > 1 && material.unit !== 'dənə') {
      return `1 ${material.unit} = ${material.quantity_per_unit} dənə`;
    }
    return null;
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
              <FaBoxes />
            </div>
            <div>
              <h1 className={styles.title}>Materiallar</h1>
              <p className={styles.subtitle}>İstehsal üçün lazım olan materialların idarəsi</p>
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.createBtn}>
            <FaPlus /> Yeni material
          </button>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statInfo}>
              <h3>{materials.length}</h3>
              <p>Ümumi material</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏷️</div>
            <div className={styles.statInfo}>
              <h3>{availableUnits.length}</h3>
              <p>Fərqli vahid</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔢</div>
            <div className={styles.statInfo}>
              <h3>{materials.filter(m => m.quantity_per_unit && m.quantity_per_unit > 1).length}</h3>
              <p>Daxili miqdarı olan</p>
            </div>
          </div>
        </div>

        {/* Axtarış və filtr */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Material axtar..."
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
                {filteredMaterials.length} / {materials.length} nəticə
              </span>
            )}
          </div>
        </div>

        {/* Materiallar qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Materiallar yüklənir...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>{searchTerm ? 'Nəticə tapılmadı' : 'Heç bir material yoxdur'}</h3>
            <p>
              {searchTerm 
                ? `"${searchTerm}" üçün material tapılmadı`
                : 'İlk materialı əlavə edin'}
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                <FaPlus /> İlk materialı əlavə et
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredMaterials.map((material) => (
              <motion.div
                key={material._id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.cardIcon}>
                  <FaBoxes />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.materialName}>{material.name}</h3>
                  <div className={styles.materialUnit}>
                    <span className={styles.unitEmoji}>{getUnitIcon(material.unit)}</span>
                    <span>{material.unit}</span>
                  </div>
                  {getQuantityDisplay(material) && (
                    <div className={styles.quantityInfo}>
                      <FaInfoCircle className={styles.quantityIcon} />
                      <span>{getQuantityDisplay(material)}</span>
                    </div>
                  )}
                  <div className={styles.materialDate}>
                    <FaTags className={styles.dateIcon} />
                    <span>{formatDate(material.created_at)}</span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => openEditModal(material)} className={styles.editBtn}>
                    <FaEdit /> Düzəliş
                  </button>
                  <button onClick={() => openDeleteModal(material)} className={styles.deleteBtn}>
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
                <h2>➕ Yeni material</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Material adı *</label>
                  <input
                    type="text"
                    placeholder="Məsələn: Pələng gözü muncuq, İp, Muncuq..."
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Vahid *</label>
                  {!showCustomUnitInput ? (
                    <div className={styles.unitSelection}>
                      <select
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                        className={styles.select}
                      >
                        <option value="">Vahid seçin</option>
                        {availableUnits.map(unit => (
                          <option key={unit} value={unit}>
                            {getUnitIcon(unit)} {unit}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCustomUnitInput(true)}
                        className={styles.addUnitBtn}
                        title="Yeni vahid əlavə et"
                      >
                        <FaPlusCircle /> Yeni
                      </button>
                    </div>
                  ) : (
                    <div className={styles.customUnitInput}>
                      <input
                        type="text"
                        placeholder="Yeni vahid adı (məsələn: iplik, kutu, banka)"
                        value={customUnit}
                        onChange={e => setCustomUnit(e.target.value)}
                        className={styles.input}
                        autoFocus
                      />
                      <div className={styles.customUnitActions}>
                        <button onClick={addNewUnit} className={styles.confirmUnitBtn}>
                          <FaCheck /> Əlavə et
                        </button>
                        <button 
                          onClick={() => {
                            setShowCustomUnitInput(false);
                            setCustomUnit('');
                          }} 
                          className={styles.cancelUnitBtn}
                        >
                          <FaTimes /> Ləğv et
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vahid başına düşən miqdar */}
                <div className={styles.formGroup}>
                  <label>1 {form.unit || 'vahid'} daxilində neçə dənə var? <span className={styles.optional}>(isteğe bağlı)</span></label>
                  <div className={styles.quantityInputGroup}>
                    <input
                      type="number"
                      placeholder="Məsələn: 340"
                      value={form.quantity_per_unit || ''}
                      onChange={e => setForm({ ...form, quantity_per_unit: +e.target.value })}
                      className={styles.input}
                      min="1"
                      step="1"
                    />
                    <span className={styles.quantityHint}>dənə</span>
                  </div>
                  <p className={styles.hint}>
                    <FaInfoCircle className={styles.hintIcon} />
                    Məsələn: 1 iplik = 340 dənə muncuq
                  </p>
                </div>

                {/* Mövcud vahidlər siyahısı */}
                {!showCustomUnitInput && (
                  <div className={styles.existingUnits}>
                    <label>Mövcud vahidlər:</label>
                    <div className={styles.unitsList}>
                      {availableUnits.map(unit => (
                        <span 
                          key={unit} 
                          className={`${styles.unitTag} ${form.unit === unit ? styles.activeUnit : ''}`}
                          onClick={() => setForm({ ...form, unit })}
                        >
                          {getUnitIcon(unit)} {unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button onClick={handleCreate} className={styles.createModalBtn} disabled={submitting}>
                  {submitting ? <><FaSpinner className={styles.btnSpinner} /> Yüklənir...</> : <><FaPlus /> Əlavə et</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== EDIT MODAL ========== */}
      <AnimatePresence>
        {modalType === 'edit' && selectedMaterial && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>✏️ Materialı yenilə</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Material adı *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Vahid *</label>
                  <select
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className={styles.select}
                  >
                    <option value="">Vahid seçin</option>
                    {availableUnits.map(unit => (
                      <option key={unit} value={unit}>
                        {getUnitIcon(unit)} {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vahid başına düşən miqdar */}
                <div className={styles.formGroup}>
                  <label>1 {editForm.unit || 'vahid'} daxilində neçə dənə var?</label>
                  <div className={styles.quantityInputGroup}>
                    <input
                      type="number"
                      value={editForm.quantity_per_unit || ''}
                      onChange={e => setEditForm({ ...editForm, quantity_per_unit: +e.target.value })}
                      className={styles.input}
                      min="1"
                      step="1"
                    />
                    <span className={styles.quantityHint}>dənə</span>
                  </div>
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
        {modalType === 'delete' && selectedMaterial && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🗑️ Materialı sil</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.deleteConfirm}>
                  <div className={styles.deleteIcon}>⚠️</div>
                  <p>
                    <strong>"{selectedMaterial.name}"</strong> materialını silmək istədiyinizdən əminsiniz?
                  </p>
                  <p className={styles.deleteWarning}>
                    Bu materiala aid məhsullar varsa, silinməyəcək!
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

export default MaterialsPage;