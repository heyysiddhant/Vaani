const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Access or create a 1-on-1 chat
// @route   POST /api/chat
// @access  Private
exports.accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'UserId param not sent with request' });
    }

    try {
        let isChat = await Chat.find({
            isGroup: false,
            $and: [
                { participants: { $elemMatch: { $eq: req.user._id } } },
                { participants: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate('participants', '-password')
            .populate('lastMessage');

        isChat = await User.populate(isChat, {
            path: 'lastMessage.sender',
            select: 'name email avatar bio',
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            const chatData = {
                chatName: 'sender',
                isGroup: false,
                participants: [req.user._id, userId],
            };

            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                'participants',
                '-password'
            );
            res.status(200).json(fullChat);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Private
exports.fetchChats = async (req, res) => {
    try {
        Chat.find({ 
            participants: { $elemMatch: { $eq: req.user._id } },
            hiddenBy: { $ne: req.user._id },
            archivedBy: { $ne: req.user._id }
        })
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'lastMessage.sender',
                    select: 'name avatar email',
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a group chat
// @route   POST /api/chat/group
// @access  Private
exports.createGroupChat = async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: 'Please fill all fields' });
    }

    const users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.status(400).send('More than 2 users are required to form a group chat');
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            groupName: req.body.name,
            groupDescription: req.body.description || "",
            groupAvatar: req.body.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=" + req.body.name,
            participants: users,
            isGroup: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update group details (name, description, avatar)
// @route   PUT /api/chat/group-details
// @access  Private
exports.updateGroupDetails = async (req, res) => {
    const { chatId, groupName, groupDescription, groupAvatar } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat Not Found' });
        }

        // Check if user is admin
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only admins can update group details' });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                groupName: groupName || chat.groupName,
                groupDescription: groupDescription !== undefined ? groupDescription : chat.groupDescription,
                groupAvatar: groupAvatar || chat.groupAvatar,
            },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage');

        const fullUpdatedChat = await User.populate(updatedChat, {
            path: 'lastMessage.sender',
            select: 'name email avatar bio',
        });

        res.json(fullUpdatedChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Rename a group chat
// @route   PUT /api/chat/rename
// @access  Private
exports.renameGroup = async (req, res) => {
    const { chatId, groupName } = req.body;

    try {
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { groupName },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        if (!updatedChat) {
            res.status(404).json({ message: 'Chat Not Found' });
        } else {
            res.json(updatedChat);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add user to group
// @route   PUT /api/chat/groupadd
// @access  Private
exports.addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat Not Found' });

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        const added = await Chat.findByIdAndUpdate(
            chatId,
            { $push: { participants: userId } },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage');

        const fullAddedChat = await User.populate(added, {
            path: 'lastMessage.sender',
            select: 'name email avatar bio',
        });

        res.json(fullAddedChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remove user from group
// @route   PUT /api/chat/groupremove
// @access  Private
exports.removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat Not Found' });

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only admins can remove members' });
        }

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { participants: userId } },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage');

        const fullRemovedChat = await User.populate(removed, {
            path: 'lastMessage.sender',
            select: 'name email avatar bio',
        });

        res.json(fullRemovedChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Hide a chat for the current user
// @route   PUT /api/chat/hide
// @access  Private
exports.hideChat = async (req, res) => {
    const { chatId } = req.body;

    try {
        const chat = await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { hiddenBy: req.user._id } },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json({ message: 'Chat hidden successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete (archive) a group
// @route   PUT /api/chat/delete
// @access  Private
exports.deleteGroup = async (req, res) => {
    const { chatId } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only admins can delete groups' });
        }

        chat.isDeleted = true;
        await chat.save();

        // Populate to send back full info
        const updatedChat = await Chat.findById(chatId)
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage');

        res.json(updatedChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Archive/Unarchive a chat for the current user
// @route   PUT /api/chat/archive
// @access  Private
exports.archiveChat = async (req, res) => {
    const { chatId } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const isArchived = chat.archivedBy.includes(req.user._id);

        let updatedChat;
        if (isArchived) {
            updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                { $pull: { archivedBy: req.user._id } },
                { new: true }
            );
        } else {
            updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                { $addToSet: { archivedBy: req.user._id } },
                { new: true }
            );
        }

        res.json({ message: isArchived ? 'Chat unarchived' : 'Chat archived' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Fetch archived chats for a user
// @route   GET /api/chat/archived
// @access  Private
exports.fetchArchivedChats = async (req, res) => {
    try {
        Chat.find({ 
            participants: { $elemMatch: { $eq: req.user._id } },
            archivedBy: { $elemMatch: { $eq: req.user._id } }
        })
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'lastMessage.sender',
                    select: 'name avatar email',
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
