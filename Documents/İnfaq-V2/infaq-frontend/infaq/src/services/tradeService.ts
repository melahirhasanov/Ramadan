import api from './api';

export interface ProductCategory {
  name: string;
}

export interface Product {
  name: string;
  category_id: string;
  master_id: string;
  description: string;
  image: string;
  is_approved?: boolean;
}

export interface Material {
  name: string;
  unit: string;
  quantity_per_unit?: number; // 1 vahiddə neçə dənə (məsələn: 1 iplik = 340 dənə)
}

export interface MaterialPurchase {
  master_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  purchase_date: string;
  notes?: string;
}

export interface ExtraCost {
  master_id: string;
  product_id?: string;
  name: string;
  amount: number;
  cost_type: 'per_product' | 'batch';
  batch_quantity?: number;
  cost_date: string;
    quantity_per_unit?: number; // 🔥 yeni

}

export interface DailyTransportCost {
  cost_date: string;
  total_amount: number;
  notes?: string;
}

export interface Order {
  order_date: string;
  total_price: number;
  platform: string;
  responsible_user_id: string;
  status: string;
  notes?: string;
  items: OrderItem[];
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_selling_price: number;
}

// Məhsul-material əlaqəsi üçün interface
export interface ProductMaterial {
  product_id: string;
  material_id: string;
  quantity_per_product: number;
}

export interface ProductCostResponse {
  cost: number;
  sellingPrice: number;
}

export const tradeService = {
  // ========== KATEQORİYALAR ==========
  getCategories: () => api.get('/categories'),
  createCategory: (data: ProductCategory) => api.post('/categories', data),
  updateCategory: (id: string, data: ProductCategory) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  // ========== MƏHSULLAR ==========
  getProducts: () => api.get('/productes'),
  createProduct: (data: Product) => api.post('/productes', data),
  updateProduct: (id: string, data: Partial<Product>) => api.put(`/productes/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/productes/${id}`),
  approveProduct: (id: string) => api.put(`/productes/${id}/approve`),
  // 🔥 YENİ: Məhsulun cari maya dəyəri və satış qiyməti
  getProductCost: (id: string, params?: { productionDate?: string; masterId?: string }) => 
    api.get<ProductCostResponse>(`/productes/${id}/cost`, { params }),

  // ========== MATERİALLAR ==========
  getMaterials: () => api.get('/materials'),
  createMaterial: (data: Material) => api.post('/materials', data),
  updateMaterial: (id: string, data: Partial<Material>) => api.put(`/materials/${id}`, data),
  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),

  // ========== MƏHSUL-MATERİAL ƏLAQƏSİ (tam CRUD) ==========
  getProductMaterials: () => api.get('/product-materials'),
  getProductMaterialsByProduct: (productId: string) => api.get(`/product-materials/product/${productId}`),
  createProductMaterial: (data: ProductMaterial) => api.post('/product-materials', data),
  updateProductMaterial: (id: string, data: Partial<ProductMaterial>) => api.put(`/product-materials/${id}`, data),
  deleteProductMaterial: (id: string) => api.delete(`/product-materials/${id}`),

  // ========== MATERİAL ALIŞLARI ==========
  getPurchases: () => api.get('/material-purchases'),
  createPurchase: (data: MaterialPurchase) => api.post('/material-purchases', data),
  updatePurchase: (id: string, data: Partial<MaterialPurchase>) => api.put(`/material-purchases/${id}`, data),
  deletePurchase: (id: string) => api.delete(`/material-purchases/${id}`),

  // ========== ƏLAVƏ XƏRCLƏR ==========
  getExtraCosts: () => api.get('/extra-costs'),
  createExtraCost: (data: ExtraCost) => api.post('/extra-costs', data),
  updateExtraCost: (id: string, data: Partial<ExtraCost>) => api.put(`/extra-costs/${id}`, data),
  deleteExtraCost: (id: string) => api.delete(`/extra-costs/${id}`),

  // ========== GÜNDƏLİK YOL PULU ==========
  getDailyTransport: () => api.get('/daily-transport'),
  createDailyTransport: (data: DailyTransportCost) => api.post('/daily-transport', data),
  updateDailyTransport: (id: string, data: Partial<DailyTransportCost>) => api.put(`/daily-transport/${id}`, data),
  deleteDailyTransport: (id: string) => api.delete(`/daily-transport/${id}`),

  // ========== SİFARİŞLƏR ==========
  getOrders: () => api.get('/orders'),
  createOrder: (order: Order) => api.post('/orders', order),
  updateOrder: (id: string, data: Partial<Order>) => api.put(`/orders/${id}`, data),
  deleteOrder: (id: string) => api.delete(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),

  // ========== İSTİFADƏÇİLƏR ==========
  getMasters: () => api.get('/persons?role=master'),
  getPersons: () => api.get('/persons'),
};