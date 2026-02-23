const express = require('express');
const router = express.Router();
const { sendMessage, allMessages, markAsRead, deleteMessage, clearChat } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/:chatId').get(protect, allMessages);
router.route('/read/:chatId').put(protect, markAsRead);
router.route('/clear/:chatId').delete(protect, clearChat);
router.route('/:messageId').delete(protect, deleteMessage);
router.route('/').post(protect, sendMessage);
router.route('/upload').post(protect, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: req.file.path });
});

module.exports = router;
