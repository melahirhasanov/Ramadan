const Product = require('../models/Product');
const ProductMaterial = require('../models/ProductMaterial');
const MaterialPurchase = require('../models/MaterialPurchase');
const ExtraCost = require('../models/ExtraCost');
const DailyTransportCost = require('../models/DailyTransportCost');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const ProfitDistribution = require('../models/ProfitDistribution');

/**
 * Bir məhsulun maya dəyərini hesablayır
 * @param {string} productId - Məhsul ID
 * @param {Date} productionDate - İstehsal tarixi (yol pulu bölgüsü üçün)
 * @param {string|null} masterId - Ustad ID (opsional)
 * @returns {Promise<number>}
 */
async function calculateProductCost(productId, productionDate = new Date(), masterId = null) {
  const startOfDay = new Date(productionDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(productionDate);
  endOfDay.setHours(23, 59, 59, 999);

  // ========== 1. MATERIAL XƏRCLƏRİ ==========
  const productMaterials = await ProductMaterial.find({ product_id: productId }).populate('material_id');
  let materialCost = 0;
  
  for (const pm of productMaterials) {
    const material = pm.material_id;
    const filter = { material_id: material._id };
    if (masterId) filter.master_id = masterId;
    const lastPurchase = await MaterialPurchase.findOne(filter).sort({ purchase_date: -1 });
    
    if (lastPurchase && material.quantity_per_unit) {
      // Dənə -> vahid çevrilməsi (1 məhsul üçün neçə vahid material lazımdır)
      const requiredUnits = pm.quantity_per_product / material.quantity_per_unit;
      materialCost += requiredUnits * lastPurchase.unit_price;
    } else if (lastPurchase) {
      materialCost += pm.quantity_per_product * lastPurchase.unit_price;
    }
  }

  // ========== 2. BİRBAŞA ƏLAVƏ XƏRCLƏR (per_product) ==========
  const directExtras = await ExtraCost.find({
    product_id: productId,
    cost_type: 'per_product',
    ...(masterId && { master_id: masterId })
  });
  let extraCost = 0;
  for (const ec of directExtras) {
    let amountPerProduct = ec.amount;
    // Əgər quantity_per_unit varsa, dənə -> vahid çevrilməsi
    if (ec.quantity_per_unit && ec.quantity_per_unit > 0) {
      amountPerProduct = ec.amount / ec.quantity_per_unit;
    }
    extraCost += amountPerProduct;
  }

  // ========== 3. PARTİYA ÜMUMİ XƏRCLƏR (batch) ==========
  const batchExtras = await ExtraCost.find({
    product_id: productId,
    cost_type: 'batch',
    ...(masterId && { master_id: masterId })
  });
  let batchExtraCost = 0;
  for (const be of batchExtras) {
    let amountPerProduct = be.amount;
    // Əgər quantity_per_unit varsa, dənə -> vahid çevrilməsi
    if (be.quantity_per_unit && be.quantity_per_unit > 0) {
      amountPerProduct = be.amount / be.quantity_per_unit;
    }
    if (be.batch_quantity && be.batch_quantity > 0) {
      batchExtraCost += amountPerProduct / be.batch_quantity;
    }
  }

  // ========== 4. GÜNDƏLİK YOL PULU ==========
  let transportCostPerProduct = 0;
  const dailyTransport = await DailyTransportCost.findOne({
    cost_date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (dailyTransport && dailyTransport.total_amount > 0) {
    // Həmin gün alınan materialların ümumi məhsul sayını (product_quantity cəmi) tap
    const purchases = await MaterialPurchase.find({
      purchase_date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    let totalProductCount = 0;
    for (const purchase of purchases) {
      totalProductCount += purchase.product_quantity || 1;
    }
    const productCount = totalProductCount > 0 ? totalProductCount : 1;
    transportCostPerProduct = dailyTransport.total_amount / productCount;
    
    // 🔥 DEBUG: konsola yazdırmaq istəsəniz
    // console.log(`Yol pulu: ${dailyTransport.total_amount} AZN, ${productCount} məhsul, hər məhsula: ${transportCostPerProduct} AZN`);
  }

  const totalCost = materialCost + extraCost + batchExtraCost + transportCostPerProduct;
  return parseFloat(totalCost.toFixed(4));
}

/**
 * Sifariş maddəsi üçün profit distribution yaradır
 */
async function createProfitDistribution(orderItem, productionDate) {
  try {
    const order = await Order.findById(orderItem.order_id);
    if (!order) throw new Error('Order not found');
    
    const product = await Product.findById(orderItem.product_id);
    if (!product) throw new Error('Product not found');
    
    const cost = await calculateProductCost(product._id, productionDate, product.master_id);
    
    const netProfit = orderItem.unit_selling_price - cost;
    if (netProfit <= 0) {
      console.warn(`Mənfi mənfəət: product ${product._id}, cost ${cost}, price ${orderItem.unit_selling_price}`);
    }
    
    const masterShare = netProfit * 0.8;
    const technicalShare = netProfit * 0.2;
    
    await ProfitDistribution.create({
      order_item_id: orderItem._id,
      product_id: product._id,
      master_id: product.master_id,
      cost_of_goods: cost,
      net_profit: netProfit,
      master_share: masterShare,
      technical_share: technicalShare,
      calculated_at: new Date()
    });
  } catch (error) {
    console.error('ProfitDistribution xətası:', error);
    throw error;
  }
}

/**
 * Müəyyən aydakı ümumi gəliri hesabla
 */
async function getTotalIncomeForMonth(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const orderItems = await OrderItem.find().populate({
    path: 'order_id',
    match: { order_date: { $gte: startDate, $lte: endDate } }
  });
  let total = 0;
  for (const item of orderItems) {
    if (item.order_id) {
      total += item.unit_selling_price * item.quantity;
    }
  }
  return total;
}

/**
 * Müəyyən aydakı ümumi xərci hesabla
 */
async function getTotalExpenseForMonth(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const purchases = await MaterialPurchase.find({
    purchase_date: { $gte: startDate, $lte: endDate }
  });
  const materialCost = purchases.reduce((sum, p) => sum + p.total_cost, 0);
  
  const extras = await ExtraCost.find({
    cost_date: { $gte: startDate, $lte: endDate }
  });
  const extraCost = extras.reduce((sum, e) => sum + e.amount, 0);
  
  const transports = await DailyTransportCost.find({
    cost_date: { $gte: startDate, $lte: endDate }
  });
  const transportCost = transports.reduce((sum, t) => sum + t.total_amount, 0);
  
  return materialCost + extraCost + transportCost;
}

module.exports = {
  calculateProductCost,
  createProfitDistribution,
  getTotalIncomeForMonth,
  getTotalExpenseForMonth
};