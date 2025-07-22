const { sequelize } = require('../config/database');
const User = require('./User');
const OTP = require('./OTP');
const Recording = require('./Recording');

// Define associations
User.hasMany(Recording, { 
  foreignKey: 'userId', 
  as: 'recordings',
  onDelete: 'CASCADE'
});

Recording.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  OTP,
  Recording,
  syncDatabase
};