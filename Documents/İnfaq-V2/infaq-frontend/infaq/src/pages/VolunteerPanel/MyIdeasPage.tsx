import React, { useState, useEffect, useRef, useCallback } from 'react';
import { volunteerService } from '../../services/volunteerService';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, FaTimes, FaTrash, FaEdit, 
  FaCheckCircle, FaClock, FaPlus, FaLink,
  FaLightbulb, FaImage, FaSpinner
} from 'react-icons/fa';
import styles from './VolunteerPanel.module.css';

interface Idea {
  _id: string;
  title: string;
  description: string;
  category: string;
  is_approved: boolean;
  volunteer_id: string | { _id: string; full_name: string };
  images: string[];
  links: string[];
  created_at: string;
}

interface IdeaForm {
  category: string;
  title: string;
  description: string;
  images: string[];
  links: string[];
}

interface Category {
  _id: string;
  name: string;
  created_at: string;
}

// Cloudinary yükləmə funksiyası
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'infaq_preset');
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME as string;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return data.secure_url;
};

const MyIdeasPage: React.FC = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [form, setForm] = useState<IdeaForm>({
    category: '',
    title: '',
    description: '',
    images: [],
    links: []
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Kateqoriyaları API-dən çək
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await tradeService.getCategories();
      setCategories(response.data || []);
      if (response.data && response.data.length > 0 && !form.category) {
        setForm(prev => ({ ...prev, category: response.data[0]._id }));
      }
    } catch (error) {
      console.error('Kateqoriyaları yükləmə xətası:', error);
      toast.error('Kateqoriyalar yüklənmədi');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // İdeyaları çək
  const fetchIdeas = useCallback(async () => {
    setLoadingIdeas(true);
    try {
      const res = await volunteerService.getAllIdeas();
      const myIdeas = res.data.filter((idea: Idea) => {
        const volunteerId = typeof idea.volunteer_id === 'object' ? idea.volunteer_id._id : idea.volunteer_id;
        return volunteerId === user?._id;
      });
      setIdeas(myIdeas);
    } catch (error) {
      toast.error('İdeyalar yüklənmədi');
    } finally {
      setLoadingIdeas(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchIdeas();
    }
  }, [user, fetchCategories, fetchIdeas]);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c._id === categoryId);
    return category?.name || categoryId;
  };

  const openCreateModal = () => {
    setForm({
      category: categories.length > 0 ? categories[0]._id : '',
      title: '',
      description: '',
      images: [],
      links: []
    });
    setSelectedIdea(null);
    setModalType('create');
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (idea: Idea) => {
    setForm({
      category: idea.category,
      title: idea.title,
      description: idea.description,
      images: idea.images,
      links: idea.links || []
    });
    setSelectedIdea(idea);
    setModalType('edit');
    document.body.style.overflow = 'hidden';
  };

  const openDeleteModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setModalType('delete');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedIdea(null);
    document.body.style.overflow = 'unset';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylı seçin');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Şəkil ölçüsü 5MB-dan az olmalıdır');
      return;
    }
    
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, images: [...prev.images, url] }));
      toast.success('Şəkil yükləndi');
    } catch (error) {
      toast.error('Şəkil yüklənmədi');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addLink = () => {
    const link = linkInputRef.current?.value;
    if (link && !form.links.includes(link)) {
      setForm(prev => ({ ...prev, links: [...prev.links, link] }));
      if (linkInputRef.current) linkInputRef.current.value = '';
    }
  };

  const removeLink = (index: number) => {
    setForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!form.category || !form.title || !form.description) {
      toast.error('Kateqoriya, başlıq və təsvir daxil edin');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'edit' && selectedIdea) {
        await volunteerService.updateIdea(selectedIdea._id, form);
        toast.success('İdeya yeniləndi');
      } else {
        await volunteerService.createIdea(form);
        toast.success('İdeya göndərildi');
      }
      closeModal();
      fetchIdeas();
    } catch (error) {
      toast.error(modalType === 'edit' ? 'Yeniləmə xətası' : 'Göndərmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIdea) return;
    
    setSubmitting(true);
    try {
      await volunteerService.deleteIdea(selectedIdea._id);
      toast.success('İdeya silindi');
      closeModal();
      fetchIdeas();
    } catch (error) {
      toast.error('Silinmə xətası');
    } finally {
      setSubmitting(false);
    }
  };

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
              <FaLightbulb />
            </div>
            <div>
              <h1 className={styles.title}>İdeyalarım</h1>
              <p className={styles.subtitle}>Yeni ideyalar paylaş və onları məhsula çevir</p>
            </div>
          </div>
          <button onClick={openCreateModal} className={styles.createBtn}>
            <FaPlus /> Yeni ideya
          </button>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💡</div>
            <div className={styles.statInfo}>
              <h3>{ideas.length}</h3>
              <p>Ümumi ideya</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h3>{ideas.filter(i => i.is_approved).length}</h3>
              <p>Təsdiqlənən</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <h3>{ideas.filter(i => !i.is_approved).length}</h3>
              <p>Gözləmədə</p>
            </div>
          </div>
        </div>

        {/* İdeyalar Qridi */}
        {loadingIdeas ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>İdeyalar yüklənir...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💭</div>
            <h3>Hələ heç bir ideya yoxdur</h3>
            <p>İlk ideyanızı paylaşın və onu məhsula çevirin</p>
            <button onClick={openCreateModal} className={styles.emptyBtn}>
              <FaPlus /> İlk ideyanı əlavə et
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {ideas.map((idea) => (
              <motion.div
                key={idea._id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {idea.images.length > 0 && (
                  <div className={styles.cardImageWrapper}>
                    <img
                      src={idea.images[0]}
                      alt={idea.title}
                      className={styles.cardImage}
                      onClick={() => setSelectedImage(idea.images[0])}
                    />
                    <div className={`${styles.statusBadge} ${idea.is_approved ? styles.approved : styles.pending}`}>
                      {idea.is_approved ? <FaCheckCircle /> : <FaClock />}
                      <span>{idea.is_approved ? 'Təsdiqlənib' : 'Gözləmədə'}</span>
                    </div>
                  </div>
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <span className={styles.category}>
                      📁 {getCategoryName(idea.category)}
                    </span>
                    <span className={styles.date}>{formatDate(idea.created_at)}</span>
                  </div>

                  <h3 className={styles.cardTitle}>{idea.title}</h3>
                  <p className={styles.cardDescription}>{idea.description}</p>

                  {idea.links && idea.links.length > 0 && (
                    <div className={styles.links}>
                      <FaLink className={styles.linkIcon} />
                      <span>{idea.links.length} link</span>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal(idea)} className={styles.editBtn}>
                      <FaEdit /> Düzəliş
                    </button>
                    <button onClick={() => openDeleteModal(idea)} className={styles.deleteBtn}>
                      <FaTrash /> Sil
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ========== CREATE/EDIT MODAL ========== */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                {modalType === 'create' ? '✨ Yeni ideya' : '✏️ İdeyanı redaktə et'}
              </h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Kateqoriya seçimi */}
              <div className={styles.formGroup}>
                <label>Kateqoriya</label>
                {loadingCategories ? (
                  <div className={styles.loadingCategories}>Yüklənir...</div>
                ) : categories.length === 0 ? (
                  <div className={styles.noCategories}>
                    ⚠️ Heç bir kateqoriya yoxdur
                  </div>
                ) : (
                  <div className={styles.categoryGrid}>
                    {categories.map(cat => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat._id })}
                        className={`${styles.categoryChip} ${form.category === cat._id ? styles.active : ''}`}
                      >
                        {form.category === cat._id ? '✓' : '📁'} {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Başlıq */}
              <div className={styles.formGroup}>
                <label>Başlıq *</label>
                <input
                  type="text"
                  placeholder="İdeyanızın başlığı"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={styles.input}
                />
              </div>

              {/* Təsvir */}
              <div className={styles.formGroup}>
                <label>Təsvir *</label>
                <textarea
                  placeholder="İdeyanızı ətraflı izah edin"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className={styles.textarea}
                />
              </div>

              {/* Şəkillər */}
              <div className={styles.formGroup}>
                <label>Şəkillər</label>
                <div className={styles.imageUploadArea}>
                  <label className={styles.uploadLabel}>
                    <FaUpload />
                    <span>{uploading ? 'Yüklənir...' : 'Şəkil əlavə et'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} hidden />
                  </label>
                  
                  {form.images.length > 0 && (
                    <div className={styles.imageGrid}>
                      {form.images.map((url, idx) => (
                        <div key={idx} className={styles.imageItem}>
                          <img src={url} alt={`Şəkil ${idx + 1}`} />
                          <button onClick={() => removeImage(idx)} className={styles.removeImageBtn}>
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Linklər */}
              <div className={styles.formGroup}>
                <label>Linklər</label>
                <div className={styles.linkInputGroup}>
                  <input
                    type="url"
                    placeholder="https://..."
                    ref={linkInputRef}
                    className={styles.linkInput}
                  />
                  <button onClick={addLink} className={styles.addLinkBtn}>
                    <FaPlus />
                  </button>
                </div>
                {form.links.length > 0 && (
                  <div className={styles.linkList}>
                    {form.links.map((link, idx) => (
                      <div key={idx} className={styles.linkItem}>
                        <FaLink />
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link.length > 40 ? link.substring(0, 40) + '...' : link}
                        </a>
                        <button onClick={() => removeLink(idx)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.cancelBtn} disabled={submitting}>
                Ləğv et
              </button>
              <button onClick={handleSubmit} className={styles.submitBtn} disabled={submitting}>
                {submitting ? (
                  <><FaSpinner className={styles.btnSpinner} /> Göndərilir...</>
                ) : (
                  <>{modalType === 'create' ? '✨ Yarat' : '💾 Yenilə'}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {modalType === 'delete' && selectedIdea && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <motion.div 
            className={styles.modalSmall}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>🗑️ İdeyanı sil</h2>
              <button onClick={closeModal} className={styles.modalCloseBtn}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.deleteConfirm}>
                <div className={styles.deleteIcon}>⚠️</div>
                <p>
                  <strong>"{selectedIdea.title}"</strong> ideyasını silmək istədiyinizdən əminsiniz?
                </p>
                <p className={styles.deleteWarning}>Bu əməliyyat geri alına bilməz!</p>
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

      {/* Şəkil böyütmə modalı */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className={styles.imageModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className={styles.imageModal}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button className={styles.imageModalClose} onClick={() => setSelectedImage(null)}>
                <FaTimes />
              </button>
              <img src={selectedImage} alt="Böyük görünüş" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MyIdeasPage;