import React, { useEffect, useState, useCallback } from 'react';
import { volunteerService } from '../../services/volunteerService';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaRegHeart, FaUser, FaCalendar, FaTag, 
  FaImage, FaLightbulb, FaSpinner, FaCheckCircle, FaLink
} from 'react-icons/fa';
import styles from './VolunteerPanel.module.css';

interface Idea {
  _id: string;
  title: string;
  description: string;
  category: string;
  likes: string[];
  is_approved: boolean;
  volunteer_id: string | { _id: string; full_name: string };
  images: string[];
  links: string[];
  created_at: string;
}

interface Category {
  _id: string;
  name: string;
}

const AllIdeasPage: React.FC = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, mostLiked: 0, categories: 0 });

  // Kateqoriyaları API-dən çək
  const fetchCategories = useCallback(async () => {
    try {
      const res = await tradeService.getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Kateqoriyaları yükləmə xətası:', error);
    }
  }, []);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await volunteerService.getAllIdeas();
      const approvedIdeas = res.data.filter((i: Idea) => i.is_approved);
      setIdeas(approvedIdeas);
      setFilteredIdeas(approvedIdeas);
      
      // Statistikaları hesabla
      const mostLiked = approvedIdeas.reduce((max: number, idea: Idea) => Math.max(max, idea.likes?.length || 0), 0);
      const uniqueCategories = new Set(approvedIdeas.map((idea: Idea) => idea.category));
      setStats({
        total: approvedIdeas.length,
        mostLiked: mostLiked,
        categories: uniqueCategories.size
      });
    } catch (error) {
      toast.error('İdeyalar yüklənmədi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchIdeas();
  }, [fetchCategories, fetchIdeas]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredIdeas(ideas);
    } else {
      setFilteredIdeas(ideas.filter((idea: Idea) => idea.category === selectedCategory));
    }
  }, [selectedCategory, ideas]);

  const handleLike = async (id: string) => {
    setLikingId(id);
    try {
      await volunteerService.likeIdea(id);
      await fetchIdeas();
      toast.success('Bəyəndiniz!');
    } catch (error) {
      toast.error('Xəta baş verdi');
    } finally {
      setLikingId(null);
    }
  };

  const handleUnlike = async (id: string) => {
    setLikingId(id);
    try {
      await volunteerService.unlikeIdea(id);
      await fetchIdeas();
      toast.success('Bəyəndən çıxdınız');
    } catch (error) {
      toast.error('Xəta baş verdi');
    } finally {
      setLikingId(null);
    }
  };

  const isLiked = (idea: Idea): boolean => {
    return idea.likes?.includes(user?._id || '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c: Category) => c._id === categoryId);
    return category?.name || categoryId;
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header />
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>İdeyalar yüklənir...</p>
          </div>
        </div>
      </>
    );
  }

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
              <h1 className={styles.title}>Bütün İdeyalar</h1>
              <p className={styles.subtitle}>Könüllülərin paylaşdığı fikir və təkliflər</p>
            </div>
          </div>
        </div>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💡</div>
            <div className={styles.statInfo}>
              <h3>{stats.total}</h3>
              <p>Ümumi ideya</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>❤️</div>
            <div className={styles.statInfo}>
              <h3>{stats.mostLiked}</h3>
              <p>Ən çox bəyənilən</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📁</div>
            <div className={styles.statInfo}>
              <h3>{stats.categories}</h3>
              <p>Kateqoriya</p>
            </div>
          </div>
        </div>

        {/* Kateqoriya filtri - API-dən gələn kateqoriyalar */}
        <div className={styles.categoryFilter}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.categoryActive : ''}`}
          >
            🎯 Hamısı
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`${styles.categoryBtn} ${selectedCategory === cat._id ? styles.categoryActive : ''}`}
            >
              📁 {cat.name}
            </button>
          ))}
        </div>

        {/* İdeyalar qridi */}
        {filteredIdeas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💭</div>
            <h3>Heç bir ideya tapılmadı</h3>
            <p>Bu kateqoriyada hələ ideya yoxdur</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredIdeas.map((idea: Idea) => (
              <motion.div
                key={idea._id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                {/* Şəkil bölməsi */}
                {idea.images.length > 0 && (
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
                    <div className={`${styles.statusBadge} ${styles.approved}`}>
                      <FaCheckCircle /> Təsdiqlənib
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

                  {idea.links && idea.links.length > 0 && (
                    <div className={styles.links}>
                      <FaLink className={styles.linkIcon} />
                      <span>{idea.links.length} link</span>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.author}>
                      <FaUser size={14} />
                      <span>
                        {typeof idea.volunteer_id === 'object'
                          ? idea.volunteer_id.full_name
                          : 'Könüllü'}
                      </span>
                    </div>

                    <div className={styles.likeSection}>
                      <button
                        onClick={() => isLiked(idea) ? handleUnlike(idea._id) : handleLike(idea._id)}
                        disabled={likingId === idea._id}
                        className={`${styles.likeBtn} ${isLiked(idea) ? styles.liked : ''}`}
                      >
                        {isLiked(idea) ? (
                          <FaHeart className={styles.heartIcon} />
                        ) : (
                          <FaRegHeart className={styles.heartIcon} />
                        )}
                        <span>{idea.likes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Şəkil modalı */}
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
                ✕
              </button>
              <img src={selectedImage} alt="Böyük görünüş" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AllIdeasPage;