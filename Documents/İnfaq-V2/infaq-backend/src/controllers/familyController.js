const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const FamilyVisit = require('../models/FamilyVisit');
const FamilyNeed = require('../models/FamilyNeed');
const AidHistory = require('../models/AidHistory');
const SpiritualSupport = require('../models/SpiritualSupport');

// --- Family CRUD ---
const createFamily = async (req, res) => {
  try {
    const familyData = { ...req.body, created_by: req.user._id };
    const family = await Family.create(familyData);
    res.status(201).json(family);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFamilies = async (req, res) => {
  try {
    const filter = { deleted_at: null };
    if (req.query.status) filter.status = req.query.status;
    const families = await Family.find(filter).populate('created_by', 'full_name');
    res.json(families);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFamilyById = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id).populate('created_by', 'full_name');
    if (!family || family.deleted_at) {
      return res.status(404).json({ message: 'Family not found' });
    }
    const members = await FamilyMember.find({ family_id: family._id });
    const visits = await FamilyVisit.find({ family_id: family._id }).populate('visited_by', 'full_name');
    const needs = await FamilyNeed.find({ family_id: family._id });
    const aids = await AidHistory.find({ family_id: family._id });
    res.json({ family, members, visits, needs, aids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family || family.deleted_at) {
      return res.status(404).json({ message: 'Family not found' });
    }
    Object.assign(family, req.body);
    await family.save();
    res.json(family);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family || family.deleted_at) {
      return res.status(404).json({ message: 'Family not found' });
    }
    family.deleted_at = Date.now();
    await family.save();
    res.json({ message: 'Family deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Family Members ---
const addFamilyMember = async (req, res) => {
  try {
    const member = await FamilyMember.create({ ...req.body, family_id: req.params.id });
    await Family.findByIdAndUpdate(req.params.id, { $inc: { child_count: 1 } });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFamilyMember = async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    Object.assign(member, req.body);
    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFamilyMember = async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndDelete(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await Family.findByIdAndUpdate(req.params.id, { $inc: { child_count: -1 } });
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Family Visits ---
const addFamilyVisit = async (req, res) => {
  try {
    const visit = await FamilyVisit.create({
      family_id: req.params.id,
      visited_by: req.user._id,
      visit_date: req.body.visit_date,
      notes: req.body.notes
    });
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Family Needs ---
const addFamilyNeed = async (req, res) => {
  try {
    const need = await FamilyNeed.create({ ...req.body, family_id: req.params.id });
    res.status(201).json(need);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// --- Aid History ---
const addAidHistory = async (req, res) => {
  try {
    const aid = await AidHistory.create({ ...req.body, family_id: req.params.id });
    res.status(201).json(aid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Spiritual Support ---
const addSpiritualSupport = async (req, res) => {
  try {
    // Öncə ailə üzvünün mövcudluğunu yoxla
    const member = await FamilyMember.findById(req.body.family_member_id);
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    const support = await SpiritualSupport.create(req.body);
    res.status(201).json(support);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSpiritualSupport = async (req, res) => {
  try {
    const support = await SpiritualSupport.findById(req.params.supportId);
    if (!support) return res.status(404).json({ message: 'Spiritual support not found' });
    Object.assign(support, req.body);
    await support.save();
    res.json(support);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateVisit = async (req, res) => {
  try {
    const { id, visitId } = req.params;
    const { visit_date, notes } = req.body;
    const visit = await FamilyVisit.findOneAndUpdate(
      { _id: visitId, family_id: id },
      { visit_date, notes },
      { new: true }
    );
    if (!visit) return res.status(404).json({ message: 'Ziyarət tapılmadı' });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVisit = async (req, res) => {
  try {
    const { id, visitId } = req.params;
    const visit = await FamilyVisit.findOneAndDelete({ _id: visitId, family_id: id });
    if (!visit) return res.status(404).json({ message: 'Ziyarət tapılmadı' });
    res.json({ message: 'Ziyarət silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== EHTİYAC ==========
const updateNeed = async (req, res) => {
  try {
    const { id, needId } = req.params;
    const { category, description, medicine_image, is_fulfilled } = req.body;
    const need = await FamilyNeed.findOneAndUpdate(
      { _id: needId, family_id: id },
      { category, description, medicine_image, is_fulfilled },
      { new: true }
    );
    if (!need) return res.status(404).json({ message: 'Ehtiyac tapılmadı' });
    res.json(need);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNeed = async (req, res) => {
  try {
    const { id, needId } = req.params;
    const need = await FamilyNeed.findOneAndDelete({ _id: needId, family_id: id });
    if (!need) return res.status(404).json({ message: 'Ehtiyac tapılmadı' });
    res.json({ message: 'Ehtiyac silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== YARDIM ==========
const updateAid = async (req, res) => {
  try {
    const { id, aidId } = req.params;
    const { aid_type, amount, description, aid_date } = req.body;
    const aid = await AidHistory.findOneAndUpdate(
      { _id: aidId, family_id: id },
      { aid_type, amount, description, aid_date },
      { new: true }
    );
    if (!aid) return res.status(404).json({ message: 'Yardım tapılmadı' });
    res.json(aid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAid = async (req, res) => {
  try {
    const { id, aidId } = req.params;
    const aid = await AidHistory.findOneAndDelete({ _id: aidId, family_id: id });
    if (!aid) return res.status(404).json({ message: 'Yardım tapılmadı' });
    res.json({ message: 'Yardım silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addFamilyVisit,
  addFamilyNeed,
  addAidHistory,
  addSpiritualSupport,
  updateSpiritualSupport,
    updateVisit,
  deleteVisit,
  updateNeed,
  deleteNeed,
  updateAid,
  deleteAid
};