const cron = require('node-cron');
const Person = require('../models/Person');
const Volunteer = require('../models/Volunteer');

const checkAndActivateVolunteers = async () => {
  const now = new Date();
  const expired = await Volunteer.find({ deactivated_until: { $lte: now, $ne: null } });
  
  for (const vol of expired) {
    const person = await Person.findById(vol.person_id);
    if (person && !person.is_active) {
      person.is_active = true;
      await person.save();
      console.log(`✅ ${person.full_name} adlı könüllü avtomatik aktivləşdirildi.`);
      // İstersen burada adminə email/sms də göndərə bilərsən
    }
    vol.deactivated_until = null;
    await vol.save();
  }
};

// Hər gün saat 00:00-da işlə
cron.schedule('0 0 * * *', checkAndActivateVolunteers);

module.exports = checkAndActivateVolunteers;