const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your_github_token_here';
const GITHUB_REPO = process.env.GITHUB_REPO || 'your_username/your_repo';
const GITHUB_API_BASE = 'https://api.github.com';

// GitHub API helper functions
async function githubRequest(method, path, data = null) {
    try {
        const config = {
            method,
            url: `${GITHUB_API_BASE}${path}`,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        throw error;
    }
}

async function getFileFromGitHub(filePath) {
    try {
        const response = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${filePath}`);
        return JSON.parse(Buffer.from(response.content, 'base64').toString());
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

async function saveFileToGitHub(filePath, content, message) {
    try {
        const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
        
        // Check if file exists to get SHA
        let sha = null;
        try {
            const existingFile = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${filePath}`);
            sha = existingFile.sha;
        } catch (error) {
            // File doesn't exist, that's okay
        }
        
        const data = {
            message,
            content: encodedContent,
            ...(sha && { sha })
        };
        
        return await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${filePath}`, data);
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        throw error;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, examType, grade } = req.body;
        
        // Get existing users
        const users = await getFileFromGitHub('data/users.json') || [];
        
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: uuidv4(),
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            examType,
            grade,
            isAdmin: false,
            score: 0,
            rank: users.length + 1,
            streak: 0,
            testsCompleted: 0,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Save to GitHub
        await saveFileToGitHub('data/users.json', users, `Add new user: ${email}`);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: newUser.id,
                name: `${newUser.firstName} ${newUser.lastName}`,
                email: newUser.email,
                score: newUser.score,
                rank: newUser.rank,
                streak: newUser.streak,
                isAdmin: newUser.isAdmin
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get users from GitHub
        const users = await getFileFromGitHub('data/users.json') || [];
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                score: user.score,
                rank: user.rank,
                streak: user.streak,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get daily questions
app.get('/api/questions/:examType', authenticateToken, async (req, res) => {
    try {
        const { examType } = req.params;
        const today = new Date().toISOString().split('T')[0];
        
        // Get questions for today
        const questions = await getFileFromGitHub(`data/questions/${examType}/${today}.json`);
        
        if (!questions) {
            return res.status(404).json({ error: 'No questions available for today' });
        }
        
        // Remove correct answers from response
        const questionsWithoutAnswers = questions.map(q => ({
            id: q.id,
            subject: q.subject,
            question: q.question,
            options: q.options
        }));
        
        res.json(questionsWithoutAnswers);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Submit exam
app.post('/api/submit-exam', authenticateToken, async (req, res) => {
    try {
        const { examType, answers, timeSpent } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        // Get questions with correct answers
        const questions = await getFileFromGitHub(`data/questions/${examType}/${today}.json`);
        
        if (!questions) {
            return res.status(404).json({ error: 'Questions not found' });
        }
        
        // Calculate score
        let correctAnswers = 0;
        const results = questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            if (isCorrect) correctAnswers++;
            
            return {
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correct,
                isCorrect
            };
        });
        
        const score = Math.round((correctAnswers / questions.length) * 100);
        const points = correctAnswers * (examType === 'jee' ? 4 : 4); // 4 points per correct answer
        
        // Get user data
        const users = await getFileFromGitHub('data/users.json') || [];
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user stats
        users[userIndex].score += points;
        users[userIndex].testsCompleted += 1;
        users[userIndex].lastExamDate = today;
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (users[userIndex].lastExamDate === yesterdayStr) {
            users[userIndex].streak += 1;
        } else if (users[userIndex].lastExamDate !== today) {
            users[userIndex].streak = 1;
        }
        
        // Save updated users
        await saveFileToGitHub('data/users.json', users, `Update user stats: ${req.user.email}`);
        
        // Save exam result
        const examResult = {
            id: uuidv4(),
            userId: req.user.id,
            examType,
            date: today,
            score,
            correctAnswers,
            totalQuestions: questions.length,
            timeSpent,
            points,
            results,
            submittedAt: new Date().toISOString()
        };
        
        const examResults = await getFileFromGitHub('data/exam-results.json') || [];
        examResults.push(examResult);
        await saveFileToGitHub('data/exam-results.json', examResults, `Add exam result: ${req.user.email}`);
        
        // Calculate new rank
        const sortedUsers = users.sort((a, b) => b.score - a.score);
        const newRank = sortedUsers.findIndex(u => u.id === req.user.id) + 1;
        const oldRank = users[userIndex].rank;
        const rankChange = oldRank - newRank;
        
        // Update ranks
        sortedUsers.forEach((user, index) => {
            user.rank = index + 1;
        });
        
        await saveFileToGitHub('data/users.json', sortedUsers, 'Update user rankings');
        
        res.json({
            score,
            correctAnswers,
            totalQuestions: questions.length,
            points,
            newRank,
            rankChange,
            results
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
    try {
        const { filter = 'overall', page = 1, limit = 20 } = req.query;
        
        const users = await getFileFromGitHub('data/users.json') || [];
        
        // Sort users by score
        const sortedUsers = users
            .sort((a, b) => b.score - a.score)
            .map((user, index) => ({
                rank: index + 1,
                name: `${user.firstName} ${user.lastName}`,
                score: user.score,
                testsCompleted: user.testsCompleted,
                streak: user.streak,
                change: Math.floor(Math.random() * 21) - 10 // Random for demo
            }));
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
        
        res.json({
            users: paginatedUsers,
            totalUsers: sortedUsers.length,
            currentPage: parseInt(page),
            totalPages: Math.ceil(sortedUsers.length / limit)
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const users = await getFileFromGitHub('data/users.json') || [];
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's exam history
        const examResults = await getFileFromGitHub('data/exam-results.json') || [];
        const userResults = examResults.filter(result => result.userId === req.user.id);
        
        res.json({
            user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
                examType: user.examType,
                grade: user.grade,
                score: user.score,
                rank: user.rank,
                streak: user.streak,
                testsCompleted: user.testsCompleted,
                createdAt: user.createdAt
            },
            examHistory: userResults.slice(-10) // Last 10 exams
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Admin: Add questions
app.post('/api/admin/questions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { examType, date, questions } = req.body;
        
        // Validate questions format
        const validatedQuestions = questions.map((q, index) => ({
            id: uuidv4(),
            subject: q.subject,
            question: q.question,
            options: q.options,
            correct: q.correct,
            difficulty: q.difficulty || 'medium',
            createdAt: new Date().toISOString()
        }));
        
        // Save questions to GitHub
        await saveFileToGitHub(
            `data/questions/${examType}/${date}.json`,
            validatedQuestions,
            `Add ${examType} questions for ${date}`
        );
        
        res.json({ message: 'Questions added successfully', count: validatedQuestions.length });
    } catch (error) {
        console.error('Error adding questions:', error);
        res.status(500).json({ error: 'Failed to add questions' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await getFileFromGitHub('data/users.json') || [];
        
        const userList = users.map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            examType: user.examType,
            grade: user.grade,
            score: user.score,
            rank: user.rank,
            streak: user.streak,
            testsCompleted: user.testsCompleted,
            createdAt: user.createdAt
        }));
        
        res.json(userList);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Get analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await getFileFromGitHub('data/users.json') || [];
        const examResults = await getFileFromGitHub('data/exam-results.json') || [];
        
        const analytics = {
            totalUsers: users.length,
            totalExams: examResults.length,
            averageScore: examResults.length > 0 ? 
                examResults.reduce((sum, result) => sum + result.score, 0) / examResults.length : 0,
            examTypeDistribution: {
                jee: users.filter(u => u.examType === 'jee' || u.examType === 'both').length,
                neet: users.filter(u => u.examType === 'neet' || u.examType === 'both').length
            },
            gradeDistribution: {
                '11': users.filter(u => u.grade === '11').length,
                '12': users.filter(u => u.grade === '12').length,
                'dropper': users.filter(u => u.grade === 'dropper').length
            },
            dailyExams: examResults.reduce((acc, result) => {
                const date = result.date;
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {})
        };
        
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Daily task to update rankings
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running daily ranking update...');
        const users = await getFileFromGitHub('data/users.json') || [];
        
        // Sort users by score and update ranks
        const sortedUsers = users.sort((a, b) => b.score - a.score);
        sortedUsers.forEach((user, index) => {
            user.rank = index + 1;
        });
        
        await saveFileToGitHub('data/users.json', sortedUsers, 'Daily ranking update');
        console.log('Daily ranking update completed');
    } catch (error) {
        console.error('Error in daily ranking update:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});