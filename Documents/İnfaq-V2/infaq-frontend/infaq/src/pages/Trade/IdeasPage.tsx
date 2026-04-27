import React, { useEffect, useState } from 'react';
import { volunteerService } from '../../services/volunteerService';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaClock, FaUser, FaCalendar, FaTag, FaImage, FaTimes } from 'react-icons/fa';
import styles from './IdeasPage.module.css';

interface Master {
  _id: string;
  full_name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Idea {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  is_approved: boolean;
  created_at: string;
  volunteer_name?: string;
}

const IdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<{ [key: string]: string }>({});
  const [converting, setConverting] = useState<{ [key: string]: boolean }>({});
  const [approving, setApproving] = useState<{ [key: string]: boolean }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ideasRes, mastersRes, categoriesRes] = await Promise.all([
        volunteerService.getAllIdeas(),
        tradeService.getMasters(),
        tradeService.getCategories()
      ]);
      setIdeas(ideasRes.data || []);
      setMasters(mastersRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      console.error('Yükləmə xətası:', error);
      toast.error(error?.response?.data?.message || 'Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setApproving(prev => ({ ...prev, [id]: true }));
    try {
      await volunteerService.approveIdea(id);
      toast.success('İdeya təsdiq edildi');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Təsdiqləmə xətası');
    } finally {
      setApproving(prev => ({ ...prev, [id]: false }));
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c._id === categoryId);
    return category?.name || categoryId;
  };

  const openConvertModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedIdea(null);
  };

  const convertToProduct = async () => {
    if (!selectedIdea) return;
    
    const masterId = selectedMaster[selectedIdea._id];
    if (!masterId) {
      toast.error('Zəhmət olmasa ustad seçin');
      return;
    }

    setConverting(prev => ({ ...prev, [selectedIdea._id]: true }));
    
    try {
      await tradeService.createProduct({
        name: selectedIdea.title,
        category_id: selectedIdea.category,
        master_id: masterId,
        description: selectedIdea.description,
        image: selectedIdea.images?.[0] || '',
        is_approved: true
      });
      
      toast.success('İdeya uğurla məhsula çevrildi!');
      
      if (volunteerService.deleteIdea) {
        await volunteerService.deleteIdea(selectedIdea._id);
      }
      
      closeModal();
      fetchData();
    } catch (error: any) {
      console.error('Çevirmə xətası:', error);
      toast.error(error?.response?.data?.message || 'Məhsula çevrilmə xətası');
    } finally {
      setConverting(prev => ({ ...prev, [selectedIdea._id]: false }));
    }
  };

  const handleMasterChange = (ideaId: string, masterId: string) => {
    setSelectedMaster(prev => ({ ...prev, [ideaId]: masterId }));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const pendingIdeas = ideas.filter(idea => !idea.is_approved);
  const approvedIdeas = ideas.filter(idea => idea.is_approved);

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <span>💡</span>
            </div>
            <div>
              <h1 className={styles.title}>İdeyaların İdarəsi</h1>
              <p className={styles.subtitle}>Könüllü ideyalarını təsdiqlə və məhsula çevir</p>
            </div>
          </div>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>{ideas.length}</h3>
              <p>Ümumi ideya</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h3>{approvedIdeas.length}</h3>
              <p>Təsdiqlənən</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <h3>{pendingIdeas.length}</h3>
              <p>Gözləmədə</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>İdeyalar yüklənir...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💭</div>
            <h3>Heç bir ideya yoxdur</h3>
            <p>Hələlik könüllülər tərəfindən paylaşılmış ideya yoxdur</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {ideas.map((idea) => (
              <motion.div
                key={idea._id}
                className={`${styles.card} ${idea.is_approved ? styles.approvedCard : styles.pendingCard}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                {/* Şəkil bölməsi */}
                {idea.images && idea.images[0] && (
                  <div className={styles.cardImageWrapper}>
                    <img
                      src={idea.images[0]}
                      alt={idea.title}
                      className={styles.cardImage}
                      onClick={() => setSelectedImage(idea.images[0])}
                    />
                    {idea.images.length > 1 && (
                      <div className={styles.imageCountBadge}>
                        <FaImage /> {idea.images.length}
                      </div>
                    )}
                    <div className={`${styles.statusBadge} ${idea.is_approved ? styles.approved : styles.pending}`}>
                      {idea.is_approved ? <FaCheckCircle /> : <FaClock />}
                      <span>{idea.is_approved ? 'Təsdiqlənib' : 'Gözləmədə'}</span>
                    </div>
                  </div>
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <span className={styles.category}>
                      <FaTag size={12} /> {getCategoryName(idea.category)}
                    </span>
                    <span className={styles.date}>
                      <FaCalendar size={12} /> {formatDate(idea.created_at)}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{idea.title}</h3>
                  <p className={styles.cardDescription}>{idea.description}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.author}>
                      <FaUser size={14} />
                      <span>{idea.volunteer_name || 'Könüllü'}</span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {!idea.is_approved ? (
                      <button
                        onClick={() => approve(idea._id)}
                        disabled={approving[idea._id]}
                        className={styles.approveBtn}
                      >
                        {approving[idea._id] ? (
                          <><FaSpinner className={styles.btnSpinner} /> Təsdiqlənir...</>
                        ) : (
                          <>✅ Təsdiq et</>
                        )}
                      </button>
                    ) : (
                      <>
                        <select
                          value={selectedMaster[idea._id] || ''}
                          onChange={(e) => handleMasterChange(idea._id, e.target.value)}
                          className={styles.masterSelect}
                        >
                          <option value="">👤 Ustad seçin</option>
                          {masters.map(m => (
                            <option key={m._id} value={m._id}>{m.full_name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => openConvertModal(idea)}
                          disabled={converting[idea._id] || !selectedMaster[idea._id]}
                          className={styles.convertBtn}
                        >
                          {converting[idea._id] ? (
                            <><FaSpinner className={styles.btnSpinner} /> Çevrilir...</>
                          ) : (
                            <>🔄 Məhsula çevir</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Məhsula çevirmə modalı */}
      <AnimatePresence>
        {modalOpen && selectedIdea && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>🔄 İdeyanı məhsula çevir</h2>
                <button onClick={closeModal} className={styles.modalCloseBtn}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.ideaPreview}>
                  {selectedIdea.images && selectedIdea.images[0] && (
                    <img src={selectedIdea.images[0]} alt={selectedIdea.title} className={styles.previewImage} />
                  )}
                  <div className={styles.ideaInfo}>
                    <h3>{selectedIdea.title}</h3>
                    <p className={styles.ideaCategory}>
                      📁 {getCategoryName(selectedIdea.category)}
                    </p>
                    <p className={styles.ideaDescription}>{selectedIdea.description}</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Ustad seçin *</label>
                  <select
                    value={selectedMaster[selectedIdea._id] || ''}
                    onChange={(e) => handleMasterChange(selectedIdea._id, e.target.value)}
                    className={styles.modalSelect}
                  >
                    <option value="">👤 Ustad seçin</option>
                    {masters.map(m => (
                      <option key={m._id} value={m._id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.warningBox}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>İdeya təsdiqləndikdən sonra məhsula çevrilə bilər</span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={closeModal} className={styles.cancelBtn}>
                  Ləğv et
                </button>
                <button
                  onClick={convertToProduct}
                  disabled={converting[selectedIdea._id] || !selectedMaster[selectedIdea._id]}
                  className={styles.confirmBtn}
                >
                  {converting[selectedIdea._id] ? '⏳ Çevrilir...' : '🔄 Təsdiqlə və çevir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Şəkil böyütmə modalı */}
      <AnimatePresence>
        {selectedImage && (
          <div className={styles.imageModalOverlay} onClick={() => setSelectedImage(null)}>
            <motion.div
              className={styles.imageModal}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button className={styles.imageModalClose} onClick={() => setSelectedImage(null)}>
                ✕
              </button>
              <img src={selectedImage} alt="Böyük görünüş" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default IdeasPage;