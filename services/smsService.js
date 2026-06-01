const crypto = require('crypto');

const codes = new Map();

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationCode(phone) {
    const code = generateCode();

    codes.set(phone, {
        code,
        expires: Date.now() + 5 * 60 * 1000
    });

    console.log(`SMS to ${phone}: ${code}`); 

    return true;
}

function verifyCode(phone, code) {
    const data = codes.get(phone);
    if (!data) return false;

    if (Date.now() > data.expires) {
        codes.delete(phone);
        return false;
    }

    if (data.code !== code) return false;

    codes.delete(phone);
    return true;
}

module.exports = { sendVerificationCode, verifyCode };