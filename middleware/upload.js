const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createDirIfNotExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

createDirIfNotExists('./storage/avatars');
createDirIfNotExists('./storage/activities');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.params.type;
        let uploadPath = './storage/';
        
        if (type === 'avatar') {
            uploadPath += 'avatars';
        } else if (type === 'activity') {
            uploadPath += 'activities';
        } else {
            return cb(new Error('Неверный тип загрузки'));
        }
        
        createDirIfNotExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неверный формат файла. Разрешены: jpg, png, webp'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

const uploadMiddleware = upload.single('file');

module.exports = { uploadMiddleware };