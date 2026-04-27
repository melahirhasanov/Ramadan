import React, { useEffect, useState, useCallback } from 'react';
import { tradeService } from '../../services/tradeService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaSearch, FaTimes, FaFilter, FaChartLine, 
  FaMoneyBillWave, FaPercent, FaUser, FaUsers,
  FaCalculator, FaSlidersH, FaDollarSign
} from 'react-icons/fa';
import styles from './ProductCostsPage.module.css';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  category_id: Category | string;
  master_id: string | { _id: string; full_name: string };
  description: string;
  image: string;
  is_approved: boolean;
}

interface ProductCost {
  cost: number;
  sellingPrice: number;
}

const ProductCostsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState<{ [key: string]: boolean }>({});
  const [costs, setCosts] = useState<{ [key: string]: ProductCost }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profitMargin, setProfitMargin] = useState<number>(2.0); // satış qiyməti = maya * profitMargin
  const [masterSharePercent, setMasterSharePercent] = useState<number>(80); // ustad payı faizi
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      calculateAllCosts();
    }
  }, [products, profitMargin]);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        tradeService.getProducts(),
        tradeService.getCategories()
      ]);
      // Yalnız təsdiqlənmiş məhsulları göstər
      const approvedProducts = (productsRes.data || []).filter((p: Product) => p.is_approved);
      setProducts(approvedProducts);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      console.error('Yükləmə xətası:', error);
      toast.error(error?.response?.data?.message || 'Məlumat yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllCosts = async () => {
    const newCosts: { [key: string]: ProductCost } = {};
    for (const product of products) {
      setCalculating(prev => ({ ...prev, [product._id]: true }));
      try {
        const res = await tradeService.getProductCost(product._id);
        const cost = res.data.cost || 0;
        const sellingPrice = cost * profitMargin;
        newCosts[product._id] = { cost, sellingPrice };
      } catch (error) {
        console.error(`Maya dəyəri hesablanmadı (${product.name}):`, error);
        newCosts[product._id] = { cost: 0, sellingPrice: 0 };
      } finally {
        setCalculating(prev => ({ ...prev, [product._id]: false }));
      }
    }
    setCosts(newCosts);
  };

  const recalculateAllCosts = () => {
    calculateAllCosts();
  };

  const getCategoryName = (category: Category | string): string => {
    if (typeof category === 'object' && category?.name) return category.name;
    const found = categories.find(c => c._id === category);
    return found?.name || 'Naməlum';
  };

  const getMasterName = (master: string | { _id: string; full_name: string }): string => {
    if (typeof master === 'object' && master?.full_name) return master.full_name;
    return 'Naməlum';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (typeof product.category_id === 'object' 
        ? product.category_id._id === selectedCategory 
        : product.category_id === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const formatMoney = (value: number) => {
    return value.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Hesablamalar
  const getProductCost = (productId: string) => costs[productId]?.cost || 0;
  const getSellingPrice = (productId: string) => (costs[productId]?.cost || 0) * profitMargin;
  const getMasterShare = (productId: string) => getSellingPrice(productId) * (masterSharePercent / 100);
  const getTechnicalShare = (productId: string) => getSellingPrice(productId) * ((100 - masterSharePercent) / 100);
  const getNetProfit = (productId: string) => getSellingPrice(productId) - getProductCost(productId);

  const totalProducts = filteredProducts.length;
  const totalCostSum = filteredProducts.reduce((sum, p) => sum + getProductCost(p._id), 0);
  const totalRevenueSum = filteredProducts.reduce((sum, p) => sum + getSellingPrice(p._id), 0);
  const totalMasterSum = filteredProducts.reduce((sum, p) => sum + getMasterShare(p._id), 0);
  const totalTechnicalSum = filteredProducts.reduce((sum, p) => sum + getTechnicalShare(p._id), 0);

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FaChartLine />
            </div>
            <div>
              <h1 className={styles.title}>Maya dəyəri və gəlir bölgüsü</h1>
              <p className={styles.subtitle}>Hər məhsulun maya dəyəri, satış qiyməti və paylar</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`${styles.settingsBtn} ${showSettings ? styles.active : ''}`}
          >
            <FaSlidersH /> Parametrlər
          </button>
        </div>

        {/* Parametrlər paneli */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className={styles.settingsPanel}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className={styles.settingsRow}>
                <div className={styles.settingGroup}>
                  <label>Satış qiyməti əmsalı</label>
                  <div className={styles.rangeInput}>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                    />
                    <span className={styles.rangeValue}>{profitMargin.toFixed(2)}x</span>
                  </div>
                  <p className={styles.settingHint}>Maya dəyəri × {profitMargin.toFixed(2)} = Satış qiyməti</p>
                </div>
                <div className={styles.settingGroup}>
                  <label>Ustad payı faizi</label>
                  <div className={styles.rangeInput}>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="1"
                      value={masterSharePercent}
                      onChange={(e) => setMasterSharePercent(parseInt(e.target.value))}
                    />
                    <span className={styles.rangeValue}>{masterSharePercent}%</span>
                  </div>
                  <p className={styles.settingHint}>Ustad: {masterSharePercent}% | Texniki heyət: {100 - masterSharePercent}%</p>
                </div>
                <button onClick={recalculateAllCosts} className={styles.recalcBtn}>
                  <FaCalculator /> Yenidən hesabla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistikalar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <h3>{formatMoney(totalCostSum)} AZN</h3>
              <p>Ümumi maya dəyəri</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💵</div>
            <div className={styles.statInfo}>
              <h3>{formatMoney(totalRevenueSum)} AZN</h3>
              <p>Ümumi satış qiyməti</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👤</div>
            <div className={styles.statInfo}>
              <h3>{formatMoney(totalMasterSum)} AZN</h3>
              <p>Ümumi ustad payı ({masterSharePercent}%)</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏢</div>
            <div className={styles.statInfo}>
              <h3>{formatMoney(totalTechnicalSum)} AZN</h3>
              <p>Ümumi texniki pay ({100 - masterSharePercent}%)</p>
            </div>
          </div>
        </div>

        {/* Filtrlər */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Məhsul adına görə axtar..."
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
          <div className={styles.categoryFilter}>
            <FaFilter className={styles.filterIcon} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">Bütün kateqoriyalar</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Məhsullar qridi */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Məhsullar yüklənir...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3>Heç bir məhsul tapılmadı</h3>
            <p>Filtr parametrlərini dəyişin və ya məhsul əlavə edin</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => {
              const cost = getProductCost(product._id);
              const sellingPrice = getSellingPrice(product._id);
              const masterShare = getMasterShare(product._id);
              const technicalShare = getTechnicalShare(product._id);
              const netProfit = getNetProfit(product._id);
              const isLoading = calculating[product._id];

              return (
                <motion.div
                  key={product._id}
                  className={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  {product.image && (
                    <div className={styles.cardImageWrapper}>
                      <img src={product.image} alt={product.name} className={styles.cardImage} />
                    </div>
                  )}
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <span className={styles.categoryBadge}>{getCategoryName(product.category_id)}</span>
                    </div>
                    <p className={styles.masterName}>
                      <FaUser /> {getMasterName(product.master_id)}
                    </p>
                    {product.description && (
                      <p className={styles.productDescription}>{product.description}</p>
                    )}

                    {isLoading ? (
                      <div className={styles.loadingCost}>
                        <FaSpinner className={styles.smallSpinner} />
                        <span>Hesablanır...</span>
                      </div>
                    ) : (
                      <div className={styles.costGrid}>
                        <div className={styles.costItem}>
                          <span className={styles.costLabel}>Maya dəyəri</span>
                          <span className={styles.costValue}>{formatMoney(cost)} AZN</span>
                        </div>
                        <div className={styles.costItem}>
                          <span className={styles.costLabel}>Satış qiyməti</span>
                          <span className={styles.sellingValue}>{formatMoney(sellingPrice)} AZN</span>
                        </div>
                        <div className={styles.costItem}>
                          <span className={styles.costLabel}>Xalis mənfəət</span>
                          <span className={styles.profitValue}>{formatMoney(netProfit)} AZN</span>
                        </div>
                        <div className={styles.shareItem}>
                          <div className={styles.shareBar}>
                            <div 
                              className={styles.masterBar} 
                              style={{ width: `${masterSharePercent}%` }}
                              title={`Ustad: ${formatMoney(masterShare)} AZN`}
                            />
                            <div 
                              className={styles.technicalBar} 
                              style={{ width: `${100 - masterSharePercent}%` }}
                              title={`Texniki: ${formatMoney(technicalShare)} AZN`}
                            />
                          </div>
                          <div className={styles.shareLabels}>
                            <span className={styles.masterLabel}>👤 Ustad: {formatMoney(masterShare)} AZN</span>
                            <span className={styles.technicalLabel}>🏢 Texniki: {formatMoney(technicalShare)} AZN</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCostsPage;