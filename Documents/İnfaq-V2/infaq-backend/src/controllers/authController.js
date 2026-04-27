const jwt = require('jsonwebtoken');
const Person = require('../models/Person');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const person = await Person.findOne({ email });
    if (!person || person.deleted_at) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await person.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!person.is_active) {
      return res.status(401).json({ message: 'Account disabled' });
    }
    const token = generateToken(person._id);
    res.json({
      _id: person._id,
      full_name: person.full_name,
      email: person.email,
      role: person.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new person (admin or backend_responsible)
const createPerson = async (req, res) => {
  try {
    const { full_name, email, phone, role, password } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'backend_responsible') {
      return res.status(403).json({ message: 'Access denied. Only admin or backend responsible can create users.' });
    }

    if (req.user.role === 'backend_responsible') {
      if (role !== 'volunteer' && role !== 'master') {
        return res.status(403).json({ message: 'Backend responsible can only create volunteers or masters.' });
      }
    }

    const exists = await Person.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Person already exists' });
    }

    const person = await Person.create({
      full_name,
      email,
      phone,
      password_hash: password,
      role: role || 'volunteer'
    });

    res.status(201).json({
      _id: person._id,
      full_name: person.full_name,
      email: person.email,
      role: person.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update person (admin or backend_responsible with restrictions)
const updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.user.role !== 'admin') {
      const targetPerson = await Person.findById(id);
      if (!targetPerson) return res.status(404).json({ message: 'Person not found' });
      if (targetPerson.role !== 'volunteer' && targetPerson.role !== 'master') {
        return res.status(403).json({ message: 'Access denied. You can only update volunteers or masters.' });
      }
      if (updates.role && updates.role !== targetPerson.role) {
        return res.status(403).json({ message: 'You cannot change role of this user.' });
      }
    }

    if (updates.password) {
      updates.password_hash = updates.password;
      delete updates.password;
    }

    const person = await Person.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password_hash');
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all persons (admin or backend_responsible)
const listPersons = async (req, res) => {
  try {
    const { role, is_active } = req.query;
    const filter = { deleted_at: null };
    
    if (req.user.role === 'backend_responsible') {
      filter.role = { $in: ['volunteer', 'master'] };
    }
    
    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    
    const persons = await Person.find(filter).select('-password_hash');
    res.json(persons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update own profile (avatar, name, phone, password)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { full_name, phone, password, profile_image } = req.body;
    
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (profile_image) updates.profile_image = profile_image;
    if (password) updates.password_hash = password;
    
    const person = await Person.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password_hash');
    if (!person) return res.status(404).json({ message: 'User not found' });
    
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get person by ID (admin and backend_responsible)
const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id).select('-password_hash');
    if (!person || person.deleted_at) {
      return res.status(404).json({ message: 'Person not found' });
    }
    if (req.user.role === 'backend_responsible') {
      if (person.role !== 'volunteer' && person.role !== 'master') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete person (admin and backend_responsible)
const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const targetPerson = await Person.findById(id);
    if (!targetPerson || targetPerson.deleted_at) {
      return res.status(404).json({ message: 'Person not found' });
    }

    if (req.user.role !== 'admin') {
      if (targetPerson.role !== 'volunteer' && targetPerson.role !== 'master') {
        return res.status(403).json({ message: 'Access denied. You can only delete volunteers or masters.' });
      }
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    targetPerson.deleted_at = new Date();
    await targetPerson.save();

    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  login, 
  getMe, 
  createPerson, 
  updatePerson, 
  listPersons, 
  updateProfile,
  getPersonById,
  deletePerson
};