
export const sendEmail = async (to, subject, html) => {
    const apiKey = process.env.BREVO_API_KEY;
    const emailUser = process.env.EMAIL_USER;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is missing in environment variables');
    }

    if (!emailUser) {
        throw new Error('EMAIL_USER is missing in environment variables');
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'StudyPilot AI',
                    email: emailUser
                },
                to: [
                    {
                        email: to
                    }
                ],
                subject: subject,
                htmlContent: html
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || 'Brevo email sending failed'
            );
        }

        console.log('Email sent successfully:', result.messageId);

        return result;

    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};
