const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 5; // Max requests
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimiter(req, res, next) {
    const ip = req.ip;
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

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Projects data
const projects = [
    {
        id: 1,
        title: 'Query Bot',
        description: 'An intelligent conversational bot designed to answer user queries in real-time. Leverages natural language processing to provide accurate and contextual responses.',
        icon: 'fa-comments',
        tag: 'AI/NLP',
        link: '#',
        status: 'coming-soon'
    },
    {
        id: 2,
        title: 'Temporary Plate Number Application',
        description: 'A web application for generating and managing temporary plate numbers. Simplifies the vehicle registration process with instant issuance and tracking capabilities.',
        icon: 'fa-car',
        tag: 'Web App',
        link: 'https://tpn-react.vercel.app/',
        status: 'live'
    },
    {
        id: 3,
        title: 'AI Resume Builder',
        description: 'An AI-powered tool that helps professionals create optimized resumes. Features intelligent content suggestions and formatting to maximize interview chances.',
        icon: 'fa-file-alt',
        tag: 'AI Tools',
        link: 'https://find-resumebuilder-ai.vercel.app/',
        status: 'live'
    },
    {
        id: 4,
        title: 'CBT Multi-User Application',
        description: 'A comprehensive Computer Based Testing platform supporting multiple concurrent users. Enables institutions to conduct secure, scalable online examinations with real-time analytics.',
        icon: 'fa-brain',
        tag: 'Web Application',
        link: '#',
        status: 'coming-soon'
    },
    {
        id: 5,
        title: 'ML Model: Diabetes Detection',
        description: 'A machine learning model trained to predict diabetes risk based on patient health metrics. Achieves 92% accuracy using advanced classification algorithms.',
        icon: 'fa-heartbeat',
        tag: 'Machine Learning',
        link: '#',
        status: 'coming-soon'
    },
    {
        id: 6,
        title: 'ML Model: Breast Cancer Detection',
        description: 'An advanced machine learning model for early breast cancer detection from medical imaging. Utilizes deep learning to identify patterns with high sensitivity and specificity.',
        icon: 'fa-microscope',
        tag: 'Machine Learning',
        link: '#',
        status: 'coming-soon'
    }
];

// Skills data
const skills = [
    {
        category: 'Machine Learning',
        icon: 'fa-brain',
        description: 'Building and deploying intelligent ML models for predictive analytics, classification, and pattern recognition tasks.',
        technologies: ['Python', 'TensorFlow', 'Scikit-learn', 'Deep Learning']
    },
    {
        category: 'Web Development',
        icon: 'fa-code',
        description: 'Full-stack web development with modern frameworks and best practices. Building scalable, maintainable web applications.',
        technologies: ['JavaScript', 'React', 'Node.js', 'TypeScript']
    },
    {
        category: 'Data Science',
        icon: 'fa-chart-bar',
        description: 'Analyzing complex datasets to extract insights and drive data-driven decisions through statistical methods and visualization.',
        technologies: ['Python', 'Pandas', 'Data Visualization', 'SQL']
    },
    {
        category: 'Software Architecture',
        icon: 'fa-sitemap',
        description: 'Designing robust and scalable software systems with emphasis on maintainability, performance, and clean code principles.',
        technologies: ['Design Patterns', 'Microservices', 'API Design', 'System Design']
    }
];

// Stats data
const stats = {
    experience: '4+',
    projects: '40+',
    maintained: '6+'
};

// ==================== ROUTES ====================

// Home route - serve portfolio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
// Get all projects
app.get('/api/projects', (req, res) => {
    res.json({
        success: true,
        data: projects
    });
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }
    
    res.json({
        success: true,
        data: project
    });
});

// Get all skills
app.get('/api/skills', (req, res) => {
    res.json({
        success: true,
        data: skills
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        data: stats
    });
});

// Contact form submission
app.post('/api/contact', rateLimiter, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'olasilvaolunleke@gmail.com',
            subject: `Portfolio Contact: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00ff88;">New Contact Form Submission</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background: white; padding: 15px; border-radius: 4px;">${message}</p>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        Sent from your portfolio website contact form
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Auto-reply to sender
        const autoReplyOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting Olaiya Silva',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00ff88;">Thank You for Reaching Out!</h2>
                    <p>Hi ${name},</p>
                    <p>I've received your message and will get back to you as soon as possible.</p>
                    <p>Here's a summary of your message:</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    </div>
                    <p>Best regards,</p>
                    <p><strong>Olaiya Silva</strong><br>Software Engineer</p>
                </div>
            `
        };

        await transporter.sendMail(autoReplyOptions);

        res.json({
            success: true,
            message: 'Message sent successfully! I\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Visitor tracking
let visitorCount = 0;
app.post('/api/visitor', (req, res) => {
    visitorCount++;
    res.json({
        success: true,
        count: visitorCount
    });
});

app.get('/api/visitors', (req, res) => {
    res.json({
        success: true,
        count: visitorCount
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});