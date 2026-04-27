import React, { useEffect, useState, useCallback } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaPlus, FaEdit, FaTrash, FaTimes, 
  FaBoxes, FaCube, FaSave, FaInfoCircle, FaMoneyBillWave
} from 'react-icons/fa';
import styles from './Trade.module.css';

interface Category {
  _id: string;
  name: string;
}

interface Master {
  _id: string;
  full_name: string;
}

interface Material {
  _id: string;
  name: string;
  unit: string;
  quantity_per_unit?: number;
}

interface ExtraCost {
  _id: string;
  name: string;
  amount: number;
  cost_type: 'per_product' | 'batch';
  batch_quantity?: number;
  master_id: string | { _id: string; full_name: string };
  product_id?: string;
  cost_date: string;
}

interface ProductMaterial {
  _id?: string;
  material_id: string;
  quantity_per_product: number;
}

interface ProductExtraCost {
  _id?: string;
  extra_cost_id: string;
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  category_id: Category | string;
  master_id: Master | string;
  description: string;
  image: string;
  is_approved: boolean;
  created_at: string;
  material_requirements?: { material_id: string | { _id: string; name: string }; quantity: number }[];
  extra_cost_requirements?: { extra_cost_id: string | { _id: string; name: string }; quantity: number }[];
}

type ModalType = 'create' | 'edit' | 'delete' | null;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    master_id: '',
    description: '',
    image: ''
  });
  const [materialRequirements, setMaterialRequirements] = useState<ProductMaterial[]>([]);
  const [extraCostRequirements, setExtraCostRequirements] = useState<ProductExtraCost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, mastersRes, materialsRes, extraCostsRes] = await Promise.all([
        tradeService.getProducts(),
        tradeService.getCategories(),
        tradeService.getMasters(),
        tradeService.getMaterials(),
        tradeService.getExtraCosts()
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setMasters(mastersRes.data || []);
      setMaterials(materialsRes.data || []);
      setExtraCosts(extraCostsRes.data || []);
    } catch (error: any) {
      console.error('Yükləmə xətası:', error);
      toast.error(error?.response?.data?.message || 'Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  // ID-ə görə məhsulu tap
  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p._id === productId);
  };

  // Məhsulun material tələblərini yüklə (vahid -> dənə)
  const fetchProductMaterials = async (productId: string) => {
    try {
      const product = getProductById(productId);
      const materialsArr = product?.material_requirements || [];
      setMaterialRequirements(materialsArr.map(m => {
        const materialId = typeof m.material_id === 'object' ? (m.material_id as any)._id : m.material_id;
        const material = materials.find(mat => mat._id === materialId);
        let quantityInPieces = m.quantity;
        if (material && material.quantity_per_unit && material.quantity_per_unit > 0) {
          quantityInPieces = m.quantity * material.quantity_per_unit;
        }
        return {
          material_id: materialId,
          quantity_per_product: parseFloat(quantityInPieces.toFixed(2))
        };
      }));
    } catch (error) {
      console.error('Material tələbləri yüklənmədi:', error);
      setMaterialRequirements([]);
    }
  };

  // Məhsulun əlavə xərc tələblərini yüklə
  const fetchProductExtraCosts = async (productId: string) => {
    try {
      const product = getProductById(productId);
      const extraCostsArr = product?.extra_cost_requirements || [];
      setExtraCostRequirements(extraCostsArr.map(ec => ({
        extra_cost_id: typeof ec.extra_cost_id === 'object' ? (ec.extra_cost_id as any)._id : ec.extra_cost_id,
        quantity: ec.quantity
      })));
    } catch (error) {
      console.error('Əlavə xərc tələbləri yüklənmədi:', error);
      setExtraCostRequirements([]);
    }
  };

  // Material tələbi əlavə et
  const addMaterialRequirement = () => {
    setMaterialRequirements([...materialRequirements, { material_id: '', quantity_per_product: 0 }]);
  };

  const updateMaterialRequirement = (index: number, field: keyof ProductMaterial, value: string | number) => {
    const newRequirements = [...materialRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setMaterialRequirements(newRequirements);
  };

  const removeMaterialRequirement = (index: number) => {
    const newRequirements = materialRequirements.filter((_, i) => i !== index);
    setMaterialRequirements(newRequirements);
  };

  // Əlavə xərc tələbi əlavə et
  const addExtraCostRequirement = () => {
    setExtraCostRequirements([...extraCostRequirements, { extra_cost_id: '', quantity: 1 }]);
  };

  const updateExtraCostRequirement = (index: number, field: keyof ProductExtraCost, value: string | number) => {
    const newRequirements = [...extraCostRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setExtraCostRequirements(newRequirements);
  };

  const removeExtraCostRequirement = (index: number) => {
    const newRequirements = extraCostRequirements.filter((_, i) => i !== index);
    setExtraCostRequirements(newRequirements);
  };

  const resetForm = () => {
    setForm({
      name: '',
      category_id: '',
      master_id: '',
      description: '',
      image: ''
    });
    setMaterialRequirements([]);
    setExtraCostRequirements([]);
    setEditingId(null);
    setSelectedProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = async (product: Product) => {
    setForm({
      name: product.name,
      category_id: typeof product.category_id === 'object' ? product.category_id._id : product.category_id,
      master_id: typeof product.master_id === 'object' ? product.master_id._id : product.master_id,
      description: product.description || '',
      image: product.image || ''
    });
    setEditingId(product._id);
    await fetchProductMaterials(product._id);
    await fetchProductExtraCosts(product._id);
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedProduct(null);
    resetForm();
    document.body.style.overflow = 'unset';
  };

  // Şəkil yükləmə
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'infaq_preset');
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) throw new Error('Cloudinary cloud name tapılmadı');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Şəkil yüklənmədi');
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Zəhmət olmasa şəkil faylı seçin');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Şəkil ölçüsü 5MB-dan böyük ola bilməz');
      return;
    }
    setUploading(true);
    toast.loading('Şəkil yüklənir...', { id: 'upload' });
    try {
      const imageUrl = await uploadImage(file);
      setForm(prev => ({ ...prev, image: imageUrl }));
      toast.success('Şəkil uğurla yükləndi', { id: 'upload' });
    } catch (error: any) {
      toast.error(error.message || 'Şəkil yüklənərkən xəta baş verdi', { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: '' }));
    toast.success('Şəkil silindi');
  };

  // Material tələblərini saxla (dənə -> vahid)
  const saveMaterialRequirements = async (productId: string) => {
    setSubmittingMaterial(true);
    try {
      const updatedMaterials = materialRequirements
        .filter(req => req.material_id && req.quantity_per_product > 0)
        .map(req => {
          const material = materials.find(m => m._id === req.material_id);
          let quantityInUnits = req.quantity_per_product;
          if (material && material.quantity_per_unit && material.quantity_per_unit > 0) {
            quantityInUnits = req.quantity_per_product / material.quantity_per_unit;
          }
          return {
            material_id: req.material_id,
            quantity: parseFloat(quantityInUnits.toFixed(4))
          };
        });
      
      await tradeService.updateProduct(productId, {
        material_requirements: updatedMaterials
      } as any);
      
      console.log('Material tələbləri saxlanıldı (vahid):', updatedMaterials);
    } catch (error) {
      console.error('Material tələblərini saxlama xətası:', error);
      throw error;
    } finally {
      setSubmittingMaterial(false);
    }
  };

  // Əlavə xərc tələblərini saxla (birbaşa dənə)
  const saveExtraCostRequirements = async (productId: string) => {
    try {
      const updatedExtraCosts = extraCostRequirements
        .filter(req => req.extra_cost_id && req.quantity > 0)
        .map(req => ({
          extra_cost_id: req.extra_cost_id,
          quantity: req.quantity
        }));
      
      await tradeService.updateProduct(productId, {
        extra_cost_requirements: updatedExtraCosts
      } as any);
      
      console.log('Əlavə xərc tələbləri saxlanıldı:', updatedExtraCosts);
    } catch (error) {
      console.error('Əlavə xərc tələblərini saxlama xətası:', error);
      throw error;
    }
  };

  const handleCreateProduct = async () => {
    if (!form.name || !form.category_id || !form.master_id) {
      toast.error('Ad, kateqoriya və ustad mütləqdir');
      return;
    }

    setSubmitting(true);
    try {
const productRes = await tradeService.createProduct({
  name: form.name,
  category_id: form.category_id,
  master_id: form.master_id,
  description: form.description,
  image: form.image,
  is_approved: false
});
      const newProductId = productRes.data._id;
      await saveMaterialRequirements(newProductId);
      await saveExtraCostRequirements(newProductId);
      
      toast.success('Məhsul əlavə edildi');
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Əməliyyat xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingId || !form.name) {
      toast.error('Məhsul adı daxil edin');
      return;
    }

    setSubmitting(true);
    try {
      await tradeService.updateProduct(editingId, {
        name: form.name,
        category_id: form.category_id,
        description: form.description,
        image: form.image
      } as any);
      
      await saveMaterialRequirements(editingId);
      await saveExtraCostRequirements(editingId);
      
      toast.success('Məhsul yeniləndi');
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Yeniləmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await tradeService.deleteProduct(selectedProduct._id);
      toast.success('Məhsul silindi');
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id: string) => {
    try {
      await tradeService.approveProduct(id);
      toast.success('Məhsul təsdiqləndi');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Təsdiqləmə xətası');
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterStatus === 'approved') return p.is_approved;
    if (filterStatus === 'pending') return !p.is_approved;
    return true;
  });

  const getCategoryName = (category: Category | string): string => {
    if (typeof category === 'object' && category?.name) return category.name;
    const found = categories.find(c => c._id === category);
    return found?.name || 'Naməlum';
  };

  const getMasterName = (master: Master | string): string => {
    if (typeof master === 'object' && master?.full_name) return master.full_name;
    const found = masters.find(m => m._id === master);
    return found?.full_name || 'Naməlum';
  };

  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m._id === materialId);
    return material?.name || 'Naməlum';
  };

  const getMaterialUnit = (materialId: string): string => {
    const material = materials.find(m => m._id === materialId);
    return material?.unit || '';
  };

  const getExtraCostName = (extraCostId: string): string => {
    const extraCost = extraCosts.find(ec => ec._id === extraCostId);
    return extraCost?.name || 'Naməlum';
  };

  const getExtraCostAmount = (extraCostId: string): number => {
    const extraCost = extraCosts.find(ec => ec._id === extraCostId);
    return extraCost?.amount || 0;
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>🛍️</span>
            Məhsullar
          </h1>
          <button onClick={openCreateModal} className={styles.primaryBtn}>
            + Yeni məhsul
          </button>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status:</span>
            <div className={styles.filterButtons}>
              <button className={`${styles.filterChip} ${filterStatus === 'all' ? styles.active : ''}`} onClick={() => setFilterStatus('all')}>Hamısı</button>
              <button className={`${styles.filterChip} ${filterStatus === 'approved' ? styles.active : ''}`} onClick={() => setFilterStatus('approved')}>✅ Təsdiqlənənlər</button>
              <button className={`${styles.filterChip} ${filterStatus === 'pending' ? styles.active : ''}`} onClick={() => setFilterStatus('pending')}>⏳ Gözləmədə</button>
            </div>
          </div>
          <div className={styles.stats}>
            <span className={styles.statsBadge}>📊 {filteredProducts.length} / {products.length} məhsul</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Məhsullar yüklənir...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <p className={styles.emptyText}>
              {filterStatus !== 'all' ? `Bu kateqoriyada ${filterStatus === 'approved' ? 'təsdiqlənmiş' : 'gözləmədə'} məhsul yoxdur` : 'Hələ heç bir məhsul əlavə edilməyib'}
            </p>
            <button onClick={openCreateModal} className={styles.emptyBtn}>+ İlk məhsulu əlavə et</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map(product => (
              <div key={product._id} className={styles.card}>
                {product.image && (
                  <div className={styles.cardImageWrapper}>
                    <img src={product.image} alt={product.name} className={styles.cardImage} />
                    <div className={`${styles.statusBadge} ${product.is_approved ? styles.approved : styles.pending}`}>
                      {product.is_approved ? '✅ Təsdiqlənib' : '⏳ Gözləmədə'}
                    </div>
                  </div>
                )}
                <div className={styles.cardContent}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.productMeta}><span className={styles.metaIcon}>📂</span><span>{getCategoryName(product.category_id)}</span></div>
                  <div className={styles.productMeta}><span className={styles.metaIcon}>👤</span><span>{getMasterName(product.master_id)}</span></div>
                  {product.description && <p className={styles.productDescription}>{product.description}</p>}
                </div>
                <div className={styles.cardActions}>
                  {!product.is_approved && <button onClick={() => approve(product._id)} className={styles.approveBtn}>Təsdiq et</button>}
                  <button onClick={() => openEditModal(product)} className={styles.editBtn}>✏️ Düzəliş</button>
                  <button onClick={() => openDeleteModal(product)} className={styles.deleteBtn}>🗑️ Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== MODAL (Məhsul yarat/redaktə et) ========== */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalType === 'create' ? '🆕 Yeni məhsul' : '✏️ Məhsulu yenilə'}</h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>✖</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Məhsul adı *</label>
                <input type="text" placeholder="Məsələn: Toxunmuş çanta" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={submitting} autoFocus />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Kateqoriya *</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} disabled={submitting}>
                    <option value="">Kateqoriya seçin</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Ustad *</label>
                  <select value={form.master_id} onChange={e => setForm({ ...form, master_id: e.target.value })} disabled={submitting}>
                    <option value="">Ustad seçin</option>
                    {masters.map(m => <option key={m._id} value={m._id}>{m.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Təsvir</label>
                <textarea placeholder="Məhsul haqqında qısa məlumat" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} disabled={submitting} />
              </div>

              <div className={styles.formGroup}>
                <label>Şəkil</label>
                <div className={styles.imageUploadArea}>
                  <div className={styles.imageUploadWrapper}>
                    <label className={styles.uploadLabel}>
                      <input type="file" accept="image/*" onChange={handleImageChange} disabled={submitting} />
                      <span>📸 Şəkil seç</span>
                    </label>
                    {uploading && <div className={styles.uploadSpinner}>⏳ Yüklənir...</div>}
                  </div>
                  {form.image && (
                    <div className={styles.imagePreviewContainer}>
                      <img src={form.image} alt="Preview" className={styles.imagePreview} />
                      <button type="button" onClick={removeImage} className={styles.removeImageBtn}>✖</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ========== MATERIAL TƏLƏBLƏRİ BÖLMƏSİ ========== */}
              <div className={styles.materialSection}>
                <div className={styles.materialHeader}>
                  <strong>📦 Material tələbləri</strong>
                  <button type="button" onClick={addMaterialRequirement} className={styles.addMaterialBtn}>
                    <FaPlus size={12} /> Material əlavə et
                  </button>
                </div>
                <div className={styles.materialList}>
                  {materialRequirements.length === 0 ? (
                    <p className={styles.noMaterials}>Hələ material tələbi yoxdur</p>
                  ) : (
                    materialRequirements.map((req, idx) => (
                      <div key={idx} className={styles.materialItem}>
                        <select
                          value={req.material_id}
                          onChange={e => updateMaterialRequirement(idx, 'material_id', e.target.value)}
                          className={styles.materialSelect}
                          disabled={submitting}
                        >
                          <option value="">Material seçin</option>
                          {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Miqdar (dənə)"
                          value={req.quantity_per_product || ''}
                          onChange={e => updateMaterialRequirement(idx, 'quantity_per_product', +e.target.value)}
                          className={styles.materialQuantity}
                          min="1"
                          step="1"
                          disabled={submitting}
                        />
                        <button type="button" onClick={() => removeMaterialRequirement(idx)} className={styles.removeMaterialBtn}>
                          <FaTimes />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <p className={styles.hint}>
                  <FaInfoCircle className={styles.hintIcon} />
                  Miqdarı dənə ilə daxil edin. Sistem avtomatik olaraq vahidə çevirəcək.
                </p>
              </div>

              {/* ========== ƏLAVƏ XƏRCLƏR BÖLMƏSİ ========== */}
              <div className={styles.extraCostSection}>
                <div className={styles.materialHeader}>
                  <strong>💰 Əlavə xərclər</strong>
                  <button type="button" onClick={addExtraCostRequirement} className={styles.addMaterialBtn}>
                    <FaPlus size={12} /> Xərc əlavə et
                  </button>
                </div>
                <div className={styles.materialList}>
                  {extraCostRequirements.length === 0 ? (
                    <p className={styles.noMaterials}>Hələ əlavə xərc tələbi yoxdur</p>
                  ) : (
                    extraCostRequirements.map((req, idx) => (
                      <div key={idx} className={styles.materialItem}>
                        <select
                          value={req.extra_cost_id}
                          onChange={e => updateExtraCostRequirement(idx, 'extra_cost_id', e.target.value)}
                          className={styles.materialSelect}
                          disabled={submitting}
                        >
                          <option value="">Əlavə xərc seçin</option>
                          {extraCosts.map(ec => (
                            <option key={ec._id} value={ec._id}>
                              {ec.name} ({ec.amount} AZN) - {ec.cost_type === 'per_product' ? 'bir məhsula' : `partiya (${ec.batch_quantity} ədəd)`}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Neçə dənə?"
                          value={req.quantity || ''}
                          onChange={e => updateExtraCostRequirement(idx, 'quantity', +e.target.value)}
                          className={styles.materialQuantity}
                          min="1"
                          step="1"
                          disabled={submitting}
                        />
                        {req.extra_cost_id && (
                          <span className={styles.materialUnitHint}>
                            Cəmi: {(getExtraCostAmount(req.extra_cost_id) * (req.quantity || 0)).toFixed(2)} AZN
                          </span>
                        )}
                        <button type="button" onClick={() => removeExtraCostRequirement(idx)} className={styles.removeMaterialBtn}>
                          <FaTimes />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <p className={styles.hint}>
                  <FaInfoCircle className={styles.hintIcon} />
                  Əlavə xərclər məhsulun maya dəyərinə əlavə olunacaq.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>Ləğv et</button>
              <button onClick={modalType === 'create' ? handleCreateProduct : handleUpdateProduct} className={styles.saveBtn} disabled={submitting}>
                {submitting ? <><FaSpinner className={styles.btnSpinner} /> Yüklənir...</> : <><FaSave /> {modalType === 'create' ? 'Əlavə et' : 'Yenilə'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {modalType === 'delete' && selectedProduct && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🗑️ Məhsulu sil</h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>✖</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteConfirm}>
                <div className={styles.deleteIcon}>⚠️</div>
                <p><strong>"{selectedProduct.name}"</strong> məhsulunu silmək istədiyinizdən əminsiniz?</p>
                <p className={styles.deleteWarning}>Bu əməliyyat geri alına bilməz!</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.cancelBtn}>Ləğv et</button>
              <button onClick={handleDeleteProduct} className={styles.deleteBtn}>🗑️ Sil</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsPage;