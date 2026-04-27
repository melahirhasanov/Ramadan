const ProductCategory = require('../models/ProductCategory');
const Productss = require('../models/Product');
const Material = require('../models/Material');
const ProductMaterial = require('../models/ProductMaterial');
const MaterialPurchase = require('../models/MaterialPurchase');
const ExtraCost = require('../models/ExtraCost');
const DailyTransportCost = require('../models/DailyTransportCost');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const ProfitDistribution = require('../models/ProfitDistribution');
const { calculateProductCost, createProfitDistribution } = require('../utils/costCalculator');

// ========== KATEQORİYALAR ==========
const createCategory = async (req, res) => {
  try {
    const category = await ProductCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    const existingCategory = await ProductCategory.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
    if (existingCategory) return res.status(409).json({ message: 'Bu adda kateqoriya artıq mövcuddur' });
    const updated = await ProductCategory.findByIdAndUpdate(req.params.id, { name: req.body.name, updated_at: Date.now() }, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kateqoriya tapılmadı' });
    const productsInCategory = await Productss.findOne({ category_id: req.params.id });
    if (productsInCategory) return res.status(409).json({ message: 'Bu kateqoriyaya aid məhsullar olduğu üçün silinə bilməz' });
    await category.deleteOne();
    res.json({ message: 'Kateqoriya uğurla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MƏHSULLAR ==========
const createProduct = async (req, res) => {
  try {
    const allowedRoles = ['master', 'admin', 'backend_responsible'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Yalnız admin, backend məsul və ustadlar məhsul yarada bilər' });
    }
    let masterId = req.user._id;
    if (req.user.role === 'admin' || req.user.role === 'backend_responsible') {
      if (req.body.master_id) masterId = req.body.master_id;
    } else {
      masterId = req.user._id;
    }
    let categoryId = req.body.category_id;
    if (!categoryId && req.body.category_name) {
      const category = await ProductCategory.findOne({ name: req.body.category_name });
      if (!category) return res.status(404).json({ message: `"${req.body.category_name}" kateqoriyası tapılmadı` });
      categoryId = category._id;
    }
    if (!categoryId) return res.status(400).json({ message: 'Kateqoriya ID-si və ya adı tələb olunur' });
    
    const product = await Productss.create({
      name: req.body.name,
      category_id: categoryId,
      master_id: masterId,
      description: req.body.description || '',
      image: req.body.image || '',
      is_approved: req.user.role === 'master' ? false : (req.body.is_approved || false),
      material_requirements: req.body.material_requirements || [],
      extra_cost_requirements: req.body.extra_cost_requirements || []
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Məhsul yaratma xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.is_approved) filter.is_approved = req.query.is_approved === 'true';
    if (req.query.category_id) filter.category_id = req.query.category_id;
    if (req.user.role !== 'admin' && req.user.role !== 'backend_responsible') filter.is_approved = true;
    const products = await Productss.find(filter)
      .populate('category_id', 'name')
      .populate('master_id', 'full_name')
      .populate('material_requirements.material_id', 'name unit quantity_per_unit')
      .populate('extra_cost_requirements.extra_cost_id', 'name amount cost_type batch_quantity');
    res.json(products);
  } catch (error) {
    console.error('getProducts xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const approveProduct = async (req, res) => {
  try {
    const product = await Productss.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.is_approved = true;
    product.updated_at = Date.now();
    await product.save();
    res.json({ message: 'Product approved', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Productss.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.category_id !== undefined) product.category_id = req.body.category_id;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.image !== undefined) product.image = req.body.image;
    if (req.body.is_approved !== undefined) product.is_approved = req.body.is_approved;
    if (req.body.material_requirements !== undefined) {
      product.material_requirements = req.body.material_requirements.map(item => ({
        material_id: item.material_id,
        quantity: item.quantity
      }));
    }
    if (req.body.extra_cost_requirements !== undefined) {
      product.extra_cost_requirements = req.body.extra_cost_requirements.map(item => ({
        extra_cost_id: item.extra_cost_id,
        quantity: item.quantity
      }));
    }
    product.updated_at = Date.now();
    await product.save();
    const updatedProduct = await Productss.findById(product._id)
      .populate('category_id', 'name')
      .populate('master_id', 'full_name')
      .populate('material_requirements.material_id', 'name unit quantity_per_unit')
      .populate('extra_cost_requirements.extra_cost_id', 'name amount cost_type batch_quantity');
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Productss.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MATERIALLAR ==========
const createMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MƏHSUL-MATERİAL ƏLAQƏSİ ==========
const addProductMaterial = async (req, res) => {
  try {
    const pm = await ProductMaterial.create(req.body);
    res.status(201).json(pm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MATERIAL ALIŞLARI (product_id tamamilə çıxarıldı) ==========
const createMaterialPurchase = async (req, res) => {
  try {
    const { master_id, material_id, quantity, unit_price, purchase_date, notes } = req.body;
    const total_cost = quantity * unit_price;
    
    const purchase = await MaterialPurchase.create({
      master_id,
      material_id,
      quantity,
      unit_price,
      total_cost,
      product_quantity: 1, // Artıq istifadə olunmur, lakin model tələb edir
      purchase_date,
      notes
    });
    res.status(201).json(purchase);
  } catch (error) {
    console.error('Material alışı xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMaterialPurchases = async (req, res) => {
  try {
    const filter = {};
    if (req.query.master_id) filter.master_id = req.query.master_id;
    const purchases = await MaterialPurchase.find(filter)
      .populate('master_id', 'full_name')
      .populate('material_id', 'name unit');
    // product_id populyasiyası tamamilə çıxarıldı
    res.json(purchases);
  } catch (error) {
    console.error('getMaterialPurchases xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== ƏLAVƏ XƏRCLƏR ==========
const createExtraCost = async (req, res) => {
  try {
    const extraCost = await ExtraCost.create(req.body);
    res.status(201).json(extraCost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExtraCosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.master_id) filter.master_id = req.query.master_id;
    const costs = await ExtraCost.find(filter).populate('master_id product_id');
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GÜNDƏLİK YOL PULU ==========
const createDailyTransport = async (req, res) => {
  try {
    const transport = await DailyTransportCost.create(req.body);
    res.status(201).json(transport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDailyTransports = async (req, res) => {
  try {
    const transports = await DailyTransportCost.find();
    res.json(transports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== SİFARİŞLƏR ==========
const createOrder = async (req, res) => {
  try {
    const { order_date, platform, responsible_user_id, status, notes, items } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'Sifarişdə ən azı bir məhsul olmalıdır' });
    if (!responsible_user_id) return res.status(400).json({ message: 'Məsul şəxs seçilməyib' });

    const productionDate = new Date(order_date);
    let total_price = 0;
    const orderItemsData = [];

    for (const item of items) {
      const cost = await calculateProductCost(item.product_id, productionDate, req.user.role === 'master' ? req.user._id : null);
      const sellingPrice = parseFloat((cost * 2).toFixed(2));
      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_selling_price: sellingPrice
      });
      total_price += sellingPrice * item.quantity;
    }

    const order = await Order.create({
      order_date: productionDate,
      total_price,
      platform,
      responsible_user_id,
      status: status || 'gozlemede',
      notes: notes || ''
    });

    const orderItems = [];
    for (const item of orderItemsData) {
      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_selling_price: item.unit_selling_price
      });
      orderItems.push(orderItem);
      try {
        await createProfitDistribution(orderItem, productionDate);
      } catch (profitError) {
        console.error('Profit distribution xətası (sifariş davam edir):', profitError);
      }
    }
    res.status(201).json({ order, orderItems });
  } catch (error) {
    console.error('Sifariş yaratma xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('responsible_user_id', 'full_name');
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order_id: order._id }).populate('product_id', 'name');
      return {
        ...order.toObject(),
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_selling_price: item.unit_selling_price
        }))
      };
    }));
    res.json(ordersWithItems);
  } catch (error) {
    console.error('getOrders xətası:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = req.body.status;
    order.updated_at = Date.now();
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GƏLİR BÖLGÜSÜ ==========
const getMyProfitDistributions = async (req, res) => {
  try {
    if (req.user.role !== 'master') return res.status(403).json({ message: 'Only masters can view their profit' });
    const profits = await ProfitDistribution.find({ master_id: req.user._id }).populate('order_item_id product_id');
    res.json(profits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== Məhsul maya dəyəri endpointi ==========
const getProductCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { productionDate, masterId } = req.query;
    const cost = await calculateProductCost(
      id,
      productionDate ? new Date(productionDate) : new Date(),
      masterId || null
    );
    const sellingPrice = parseFloat((cost * 2).toFixed(2));
    res.json({ cost, sellingPrice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GÜNDƏLİK YOL PULU - UPDATE & DELETE ==========
const updateDailyTransport = async (req, res) => {
  try {
    const transport = await DailyTransportCost.findById(req.params.id);
    if (!transport) return res.status(404).json({ message: 'Transport cost not found' });
    const updated = await DailyTransportCost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDailyTransport = async (req, res) => {
  try {
    const transport = await DailyTransportCost.findById(req.params.id);
    if (!transport) return res.status(404).json({ message: 'Transport cost not found' });
    await transport.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== ƏLAVƏ XƏRCLƏR - UPDATE & DELETE ==========
const updateExtraCost = async (req, res) => {
  try {
    const cost = await ExtraCost.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Extra cost not found' });
    const updated = await ExtraCost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExtraCost = async (req, res) => {
  try {
    const cost = await ExtraCost.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Extra cost not found' });
    await cost.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MATERIAL - UPDATE & DELETE ==========
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    const updated = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    await material.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== SİFARİŞLƏR - UPDATE & DELETE ==========
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await OrderItem.deleteMany({ order_id: req.params.id });
    await order.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MATERİAL ALIŞLARI - UPDATE & DELETE (product_id çıxarıldı) ==========
const updatePurchase = async (req, res) => {
  try {
    const purchase = await MaterialPurchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    if (req.body.quantity || req.body.unit_price) {
      const quantity = req.body.quantity || purchase.quantity;
      const unit_price = req.body.unit_price || purchase.unit_price;
      req.body.total_cost = quantity * unit_price;
    }
    // product_id yeniləməsi silindi
    const updated = await MaterialPurchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = await MaterialPurchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    await purchase.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MƏHSUL-MATERİAL ƏLAQƏSİ (tam CRUD) ==========
const getProductMaterialsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const materials = await ProductMaterial.find({ product_id: productId }).populate('material_id', 'name unit quantity_per_unit');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProductMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ProductMaterial.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Əlaqə tapılmadı' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProductMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProductMaterial.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Əlaqə tapılmadı' });
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProductMaterials = async (req, res) => {
  try {
    const materials = await ProductMaterial.find()
      .populate('product_id', 'name')
      .populate('material_id', 'name unit quantity_per_unit');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== EXPORTS ==========
module.exports = {
  createCategory, getCategories, updateCategory, deleteCategory,
  createProduct, getProducts, approveProduct, updateProduct, deleteProduct,
  createMaterial, getMaterials, updateMaterial, deleteMaterial,
  addProductMaterial, getProductMaterialsByProduct, updateProductMaterial, deleteProductMaterial,
  createMaterialPurchase, getMaterialPurchases, updatePurchase, deletePurchase,
  createExtraCost, getExtraCosts, updateExtraCost, deleteExtraCost,
  createDailyTransport, getDailyTransports, updateDailyTransport, deleteDailyTransport,
  createOrder, getOrders, updateOrderStatus, updateOrder, deleteOrder,
  getMyProfitDistributions, getProductCost, getAllProductMaterials
};