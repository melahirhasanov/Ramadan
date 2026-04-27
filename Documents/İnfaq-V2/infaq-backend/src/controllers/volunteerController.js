const Person = require('../models/Person');
const Volunteer = require('../models/Volunteer');
const VolunteerIdea = require('../models/VolunteerIdea'); // dəyişdirildi

// ---------- Könüllü yaratma (admin/backend) ----------
const createVolunteer = async (req, res) => {
  try {
    const { full_name, email, phone, password, free_time, teams, image, notes } = req.body;
    
    const person = await Person.create({
      full_name,
      email,
      phone,
      password_hash: password,
      role: 'volunteer',
      profile_image: image || ''
    });
    
    const volunteer = await Volunteer.create({
      person_id: person._id,
      free_time,
      teams: teams || [],
      image: image || '',
      notes: notes || ''
    });
    
    res.status(201).json({
      message: 'Volunteer created successfully',
      person: { _id: person._id, full_name, email, role: person.role },
      volunteer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Bütün könüllüləri listələ (admin/backend) ----------
const getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find().populate('person_id', 'full_name email phone profile_image is_active');
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Tək könüllü məlumatı ----------
const getVolunteerProfile = async (req, res) => {
  try {
    const personId = req.params.id || req.user._id;
    if (req.user.role !== 'admin' && req.user.role !== 'backend_responsible' && req.user._id.toString() !== personId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const volunteer = await Volunteer.findOne({ person_id: personId }).populate('person_id', '-password_hash');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Könüllü məlumatlarını yenilə ----------
const updateVolunteer = async (req, res) => {
  try {
    const personId = req.params.id || req.user._id;
    if (req.user.role !== 'admin' && req.user.role !== 'backend_responsible' && req.user._id.toString() !== personId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const volunteer = await Volunteer.findOne({ person_id: personId });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    
    const { free_time, teams, image, notes } = req.body;
    if (free_time !== undefined) volunteer.free_time = free_time;
    if (teams !== undefined) volunteer.teams = teams;
    if (image !== undefined) volunteer.image = image;
    if (notes !== undefined) volunteer.notes = notes;
    await volunteer.save();
    
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Könüllü sil (ideyalar silinmir) ----------
const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await Volunteer.findOne({ person_id: id });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    
    await Volunteer.deleteOne({ person_id: id });
    await Person.findByIdAndDelete(id);
    
    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- İdeya yarat (yalnız könüllü özü) ----------
const createIdea = async (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can create ideas' });
    }
    const idea = await VolunteerIdea.create({
      volunteer_id: req.user._id,
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      images: req.body.images || [],
      links: req.body.links || []
    });
    res.status(201).json(idea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- İdeyaları listələ ----------
const getIdeas = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin' && req.user.role !== 'backend_responsible') {
      filter.$or = [
        { is_approved: true },
        { volunteer_id: req.user._id }
      ];
    }
    const ideas = await VolunteerIdea.find(filter)
      .populate('volunteer_id', 'full_name profile_image')
      .populate('approved_by', 'full_name')
      .populate('likes', 'full_name');
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- İdeyanı təsdiqlə (admin/backend) ----------
const approveIdea = async (req, res) => {
  try {
    const idea = await VolunteerIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    idea.is_approved = true;
    idea.approved_by = req.user._id;
    idea.approved_at = new Date();
    await idea.save();
    res.json({ message: 'Idea approved', idea });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- İdeyanı bəyən (like) ----------
const likeIdea = async (req, res) => {
  try {
    const idea = await VolunteerIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    if (!idea.likes.includes(req.user._id)) {
      idea.likes.push(req.user._id);
      await idea.save();
    }
    res.json({ message: 'Idea liked', likesCount: idea.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- İdeyanı bəyəndən çıxar (unlike) ----------
const unlikeIdea = async (req, res) => {
  try {
    const idea = await VolunteerIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    idea.likes = idea.likes.filter(uid => uid.toString() !== req.user._id.toString());
    await idea.save();
    res.json({ message: 'Idea unliked', likesCount: idea.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Könüllü deaktiv et (admin/backend) ----------
const deactivateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { deactivated_until } = req.body;
    
    const person = await Person.findById(id);
    if (!person) return res.status(404).json({ message: 'Person not found' });
    
    if (person.is_active) {
      person.is_active = false;
      await person.save();
    }
    
    let volunteer = await Volunteer.findOne({ person_id: id });
    if (volunteer) {
      volunteer.deactivated_until = deactivated_until || null;
      await volunteer.save();
    }
    
    res.json({ message: 'Volunteer deactivated', deactivated_until: volunteer?.deactivated_until });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- Könüllü aktiv et ----------
const activateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    if (!person) return res.status(404).json({ message: 'Person not found' });
    
    person.is_active = true;
    await person.save();
    
    const volunteer = await Volunteer.findOne({ person_id: id });
    if (volunteer) {
      volunteer.deactivated_until = null;
      await volunteer.save();
    }
    
    res.json({ message: 'Volunteer activated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getIdeaById = async (req, res) => {
  try {
    const idea = await VolunteerIdea.findById(req.params.id)
      .populate('volunteer_id', 'full_name email phone')
      .populate('approved_by', 'full_name');
    
    if (!idea) {
      return res.status(404).json({ success: false, message: 'İdeya tapılmadı' });
    }
    
    res.status(200).json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    İdeya yenilə
// @route   PUT /api/volunteers/ideas/:id
// @access  Private (yalnız öz ideyasını yeniləyə bilər)
const updateIdea = async (req, res) => {
  try {
    let idea = await VolunteerIdea.findById(req.params.id);
    
    if (!idea) {
      return res.status(404).json({ success: false, message: 'İdeya tapılmadı' });
    }
    
    // Yalnız ideya sahibi yeniləyə bilər
    if (idea.volunteer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bu ideyanı yeniləməyə icazəniz yoxdur' });
    }
    
    // Təsdiqlənmiş ideyalar yenilənə bilməz
    if (idea.is_approved) {
      return res.status(400).json({ success: false, message: 'Təsdiqlənmiş ideya yenilənə bilməz' });
    }
    
    const { category, title, description, images, links } = req.body;
    
    idea = await VolunteerIdea.findByIdAndUpdate(
      req.params.id,
      {
        category,
        title,
        description,
        images: images || [],
        links: links || [],
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    İdeya sil
// @route   DELETE /api/volunteers/ideas/:id
// @access  Private (öz ideyasını silə bilər) və ya Admin/Backend_responsible
const deleteIdea = async (req, res) => {
  try {
    const idea = await VolunteerIdea.findById(req.params.id);
    
    if (!idea) {
      return res.status(404).json({ success: false, message: 'İdeya tapılmadı' });
    }
    
    // İcazə yoxlaması: öz ideyası və ya admin/backend_responsible
    const isOwner = idea.volunteer_id.toString() === req.user._id.toString();
    const isAuthorized = ['admin', 'backend_responsible'].includes(req.user.role);
    
    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ success: false, message: 'Bu ideyanı silməyə icazəniz yoxdur' });
    }
    
    await idea.deleteOne();
    
    res.status(200).json({ success: true, message: 'İdeya uğurla silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  createVolunteer,
  getVolunteers,
  getVolunteerProfile,
  updateVolunteer,
  deleteVolunteer,
  createIdea,
  getIdeas,
  approveIdea,
  likeIdea,
  unlikeIdea,
  activateVolunteer,
  deactivateVolunteer,
  deleteIdea,
  updateIdea,
  getIdeaById

};