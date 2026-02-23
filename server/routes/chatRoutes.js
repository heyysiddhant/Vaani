const express = require('express');
const router = express.Router();
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    updateGroupDetails,
    hideChat,
    deleteGroup,
    archiveChat,
    fetchArchivedChats
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, accessChat);
router.route('/').get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/group-details').put(protect, updateGroupDetails);
router.route('/hide').put(protect, hideChat);
router.route('/delete').put(protect, deleteGroup);
router.route('/archive').put(protect, archiveChat);
router.route('/archived').get(protect, fetchArchivedChats);

module.exports = router;
