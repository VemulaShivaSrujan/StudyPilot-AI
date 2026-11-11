
import { getDB } from '../config/db.js';

const OTP_COLLECTION = 'email_otps';

export const getOTPCollection = () => {
    const db = getDB();
    return db.collection(OTP_COLLECTION);
};


export const saveOTP = async (
    email,
    otpHash,
    purpose = 'registration'
) => {
    const otps = getOTPCollection();

    return await otps.updateOne(
        {
            email: email.toLowerCase().trim(),
            purpose
        },
        {
            $set: {
                otpHash,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                attempts: 0,
                createdAt: new Date()
            }
        },
        { upsert: true }
    );
};


export const findOTPByEmail = async (
    email,
    purpose = 'registration'
) => {
    const otps = getOTPCollection();

    return await otps.findOne({
        email: email.toLowerCase().trim(),
        purpose
    });
};


export const deleteOTP = async (
    email,
    purpose = 'registration'
) => {
    const otps = getOTPCollection();

    return await otps.deleteOne({
        email: email.toLowerCase().trim(),
        purpose
    });
};
