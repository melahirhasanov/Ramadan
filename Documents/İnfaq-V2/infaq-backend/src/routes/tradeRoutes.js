const express = require('express');
const {
  createCategory, getCategories,
  createProduct, getProducts, approveProduct,
  createMaterial, getMaterials,
  addProductMaterial,
  createMaterialPurchase, getMaterialPurchases,
  createExtraCost, getExtraCosts,
  createDailyTransport, getDailyTransports,
  createOrder, getOrders, updateOrderStatus,
  getMyProfitDistributions, updateDailyTransport,
  deleteDailyTransport,
  updateExtraCost,
  deleteExtraCost,
  updateMaterial,
  deleteMaterial,
  updateOrder,
  deleteOrder,
  updateProduct,
  deleteProduct,
  updatePurchase,
  deletePurchase,
  updateCategory,
  deleteCategory,
  getProductMaterialsByProduct,
  updateProductMaterial,
  deleteProductMaterial,
  getProductCost,
  getAllProductMaterials
} = require('../controllers/tradeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ========== KATEQORİYALAR ==========
router.post('/categories', authorize('admin', 'backend_responsible'), createCategory);
router.get('/categories', getCategories);
router.put('/categories/:id', authorize('admin', 'backend_responsible'), updateCategory);
router.delete('/categories/:id', authorize('admin'), deleteCategory);

// ========== MƏHSULLAR ==========
router.post('/productes', createProduct); // yalnız master (controller-də yoxlanır)
router.get('/productes', getProducts);
router.put('/productes/:id/approve', authorize('admin', 'backend_responsible'), approveProduct);
router.put('/productes/:id', authorize('admin', 'backend_responsible'), updateProduct);
router.delete('/productes/:id', authorize('admin', 'backend_responsible'), deleteProduct);
// 🔥 YENİ: Məhsulun cari maya dəyəri və satış qiyməti
router.get('/productes/:id/cost', protect, getProductCost);

// ========== MATERİALLAR ==========
router.post('/materials', authorize('admin', 'backend_responsible'), createMaterial);
router.get('/materials', getMaterials);
router.put('/materials/:id', authorize('admin', 'backend_responsible'), updateMaterial);
router.delete('/materials/:id', authorize('admin', 'backend_responsible'), deleteMaterial);

// ========== MƏHSUL-MATERİAL ƏLAQƏSİ (tam CRUD) ==========
router.post('/product-materials', authorize('admin', 'backend_responsible'), addProductMaterial);
router.get('/product-materials/product/:productId', authorize('admin', 'backend_responsible'), getProductMaterialsByProduct);
router.put('/product-materials/:id', authorize('admin', 'backend_responsible'), updateProductMaterial);
router.delete('/product-materials/:id', authorize('admin', 'backend_responsible'), deleteProductMaterial);

// ========== MATERİAL ALIŞLARI ==========
router.post('/material-purchases', authorize('admin', 'backend_responsible'), createMaterialPurchase);
router.get('/material-purchases', authorize('admin', 'backend_responsible'), getMaterialPurchases);
router.put('/material-purchases/:id', authorize('admin', 'backend_responsible'), updatePurchase);
router.delete('/material-purchases/:id', authorize('admin', 'backend_responsible'), deletePurchase);
router.get('/product-materials', authorize('admin', 'backend_responsible'), getAllProductMaterials);

// ========== ƏLAVƏ XƏRCLƏR ==========
router.post('/extra-costs', authorize('admin', 'backend_responsible'), createExtraCost);
router.get('/extra-costs', authorize('admin', 'backend_responsible'), getExtraCosts);
router.put('/extra-costs/:id', authorize('admin', 'backend_responsible'), updateExtraCost);
router.delete('/extra-costs/:id', authorize('admin', 'backend_responsible'), deleteExtraCost);

// ========== GÜNDƏLİK YOL PULU ==========
router.post('/daily-transport', authorize('admin', 'backend_responsible'), createDailyTransport);
router.get('/daily-transport', authorize('admin', 'backend_responsible'), getDailyTransports);
router.put('/daily-transport/:id', authorize('admin', 'backend_responsible'), updateDailyTransport);
router.delete('/daily-transport/:id', authorize('admin', 'backend_responsible'), deleteDailyTransport);

// ========== SİFARİŞLƏR ==========
router.post('/orders', authorize('admin', 'backend_responsible'), createOrder);
router.get('/orders', authorize('admin', 'backend_responsible'), getOrders);
router.put('/orders/:id/status', authorize('admin', 'backend_responsible'), updateOrderStatus);
router.put('/orders/:id', authorize('admin', 'backend_responsible'), updateOrder);
router.delete('/orders/:id', authorize('admin', 'backend_responsible'), deleteOrder);

// ========== GƏLİR BÖLGÜSÜ ==========
router.get('/my-profit', getMyProfitDistributions);

module.exports = router;