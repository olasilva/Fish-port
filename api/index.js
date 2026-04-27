const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function rateLimiter(req, res, next) {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const timestamps = requestCounts.get(ip).filter(time => now - time < RATE_WINDOW);
    
    if (timestamps.length >= RATE_LIMIT) {
        return res.status(429).json({ 
            success: false, 
            message: 'Too many requests. Please try again later.' 
        });
    }
    
    timestamps.push(now);
    requestCounts.set(ip, timestamps);
    next();
}

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Contact form
app.post('/api/contact', rateLimiter, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // If email credentials exist, send email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
                subject: `Portfolio Contact: ${subject}`,
                html: `<h3>New Contact</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Message:</b> ${message}</p>`
            });
        }

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// Catch-all route - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Export for Vercel
module.exports = app;

// Start server locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}