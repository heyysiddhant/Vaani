const express = require('express');
const router = express.Router();
const { allUsers, getUserProfile, updateProfile, updatePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, allUsers);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateProfile)
    .delete(protect, deleteAccount);
router.route('/updatepassword').put(protect, updatePassword);

module.exports = router;
