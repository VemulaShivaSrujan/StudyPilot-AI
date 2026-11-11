
import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error('Email credentials are missing in .env');
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: emailUser,
            pass: emailPass
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000
    });

    const mailOptions = {
        from: `"StudyPilot AI" <${emailUser}>`,
        to,
        subject,
        html
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', result.messageId);

        return result;

    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};
