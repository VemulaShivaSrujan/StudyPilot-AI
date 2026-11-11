
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension !== '.pdf' || file.mimetype !== 'application/pdf') {
        return callback(new Error('Only PDF files are allowed.'));
    }

    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export default upload;
