
import crypto from 'crypto';

export const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

export const hashOTP = (otp) => {
    return crypto
        .createHmac('sha256', process.env.OTP_SECRET)
        .update(otp)
        .digest('hex');
};

export const verifyOTP = (otp, hashedOTP) => {
    const enteredHash = hashOTP(otp);

    const storedBuffer = Buffer.from(hashedOTP, 'hex');
    const enteredBuffer = Buffer.from(enteredHash, 'hex');

    return (
        storedBuffer.length === enteredBuffer.length &&
        crypto.timingSafeEqual(storedBuffer, enteredBuffer)
    );
};
