const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Log the contact for now (add email sending later)
        console.log('Contact form submission:', { name, email, subject, message });

        // Try to send email if credentials exist
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: 'olasilvaolunleke@gmail.com',
                    subject: 'Portfolio Contact: ' + subject,
                    html: '<h3>New Contact</h3><p><b>Name:</b> ' + name + '</p><p><b>Email:</b> ' + email + '</p><p><b>Message:</b> ' + message + '</p>'
                });
            } catch (emailError) {
                console.log('Email not sent:', emailError.message);
            }
        }

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel
module.exports = app;

// Start server locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('Server running on http://localhost:' + PORT);
    });
}