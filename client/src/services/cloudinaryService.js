import api from './api';

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'vaani_uploads'); // Ensure this matches Cloudinary setup

    // For simplicity, we'll proxy the upload through our backend to keep keys secure
    // or use the server's signed upload if configured. 
    // Here we'll use our existing multer endpoint on the backend.
    
    // We'll create a new endpoint on backend for this or use a existing one if we had.
    // Let's assume we use /api/message/upload
    
    const { data } = await api.post('/message/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    
    return data.url;
};

export default { uploadToCloudinary };
