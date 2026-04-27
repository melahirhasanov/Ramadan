import React, { useEffect, useState } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './CategoryManager.module.css';

interface Category {
  _id: string;
  name: string;
  created_at: string;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await tradeService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Kateqoriyaları yükləmə xətası:', error);
      toast.error('Kateqoriyaları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setFormData({ name: '' });
    setSelectedCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (category: Category) => {
    setFormData({ name: category.name });
    setSelectedCategory(category);
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCategory(null);
    resetForm();
    document.body.style.overflow = 'unset';
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Kateqoriya adını daxil edin');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'edit' && selectedCategory) {
        await tradeService.updateCategory(selectedCategory._id, { name: formData.name });
        toast.success('Kateqoriya yeniləndi');
      } else {
        await tradeService.createCategory({ name: formData.name });
        toast.success('Kateqoriya əlavə edildi');
      }
      
      closeModal();
      fetchCategories();
    } catch (error: any) {
      console.error('Əməliyyat xətası:', error);
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate')) {
        toast.error('Bu adda kateqoriya artıq mövcuddur');
      } else {
        toast.error(modalType === 'edit' ? 'Yeniləmə xətası' : 'Əlavə etmə xətası');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      await tradeService.deleteCategory(selectedCategory._id);
      toast.success('Kateqoriya silindi');
      closeModal();
      fetchCategories();
    } catch (error: any) {
      console.error('Silinmə xətası:', error);
      if (error.response?.status === 409) {
        toast.error('Bu kateqoriyaya aid məhsullar olduğu üçün silinə bilmir');
      } else {
        toast.error('Silinmə xətası');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
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
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>📁</span>
              Kateqoriyalar
            </h1>
            <div className={styles.statsBadge}>
              {categories.length} kateqoriya
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.primaryBtn}>
            <span>+</span> Yeni kateqoriya
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Kateqoriya axtar..."
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
                {filteredCategories.length} / {categories.length} nəticə
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Kateqoriyalar yüklənir...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <p className={styles.emptyText}>
              {searchTerm ? `"${searchTerm}" üçün nəticə tapılmadı` : 'Heç bir kateqoriya yoxdur'}
            </p>
            {!searchTerm && (
              <button onClick={openCreateModal} className={styles.emptyBtn}>
                + İlk kateqoriyanı əlavə et
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredCategories.map((category) => (
              <div key={category._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <span>📁</span>
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    <p className={styles.categoryDate}>
                      {formatDate(category.created_at)}
                    </p>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => openEditModal(category)}
                    className={styles.editBtn}
                  >
                    ✏️ Düzəliş
                  </button>
                  <button
                    onClick={() => openDeleteModal(category)}
                    className={styles.deleteBtn}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== CREATE/EDIT MODAL ========== */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalType === 'create' ? '🆕 Yeni kateqoriya' : '✏️ Kateqoriyanı yenilə'}
              </h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>✖</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Kateqoriya adı <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    placeholder="Məsələn: Toxuma, Taxta, Keramika..."
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className={styles.modalInput}
                    autoFocus
                    maxLength={50}
                    disabled={submitting}
                  />
                  <span className={styles.charCount}>{formData.name.length}/50</span>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                  Ləğv et
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? (
                    '⏳ Yüklənir...'
                  ) : (
                    modalType === 'create' ? '➕ Əlavə et' : '💾 Yenilə'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {modalType === 'delete' && selectedCategory && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🗑️ Kateqoriyanı sil</h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>✖</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteConfirm}>
                <div className={styles.deleteIcon}>⚠️</div>
                <p>
                  <strong>"{selectedCategory.name}"</strong> kateqoriyasını silmək istədiyinizdən əminsiniz?
                </p>
                <p className={styles.deleteWarning}>
                  Bu kateqoriyaya aid məhsullar varsa, silinməyəcək!
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                Ləğv et
              </button>
              <button onClick={handleDelete} className={styles.deleteBtn} disabled={submitting}>
                {submitting ? '⏳ Silinir...' : '🗑️ Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryManager;