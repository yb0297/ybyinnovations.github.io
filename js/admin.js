// Admin functionality
let questionCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check admin status (in real app, this would be verified by the server)
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !user.isAdmin) {
        alert('Admin access required');
        window.location.href = 'dashboard.html';
        return;
    }
    
    initializeAdmin();
    setupAdminTabs();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('exam-date').value = today;
    
    // Add first question by default
    addQuestion();
});

// Initialize admin panel
function initializeAdmin() {
    loadUsers();
    loadAnalytics();
}

// Setup admin tabs
function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load data for specific tabs
            if (targetTab === 'users') {
                loadUsers();
            } else if (targetTab === 'analytics') {
                loadAnalytics();
            }
        });
    });
}

// Add question form
function addQuestion() {
    questionCount++;
    const container = document.getElementById('questions-container');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem;">
            <h4>Question ${questionCount}</h4>
            <button type="button" class="btn btn-outline" onclick="removeQuestion(this)" style="margin-left: auto;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="form-group">
            <label>Subject</label>
            <select name="subject" required>
                <option value="">Select Subject</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Question</label>
            <textarea name="question" rows="3" required placeholder="Enter the question..."></textarea>
        </div>
        
        <div class="form-group">
            <label>Options</label>
            <div class="option-inputs">
                <div class="option-input">
                    <input type="radio" name="correct-${questionCount}" value="0" required>
                    <input type="text" name="option1" placeholder="Option A" required>
                </div>
                <div class="option-input">
                    <input type="radio" name="correct-${questionCount}" value="1" required>
                    <input type="text" name="option2" placeholder="Option B" required>
                </div>
                <div class="option-input">
                    <input type="radio" name="correct-${questionCount}" value="2" required>
                    <input type="text" name="option3" placeholder="Option C" required>
                </div>
                <div class="option-input">
                    <input type="radio" name="correct-${questionCount}" value="3" required>
                    <input type="text" name="option4" placeholder="Option D" required>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label>Difficulty</label>
            <select name="difficulty">
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;
    
    container.appendChild(questionDiv);
}

// Remove question
function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.remove();
}

// Handle question form submission
document.getElementById('question-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const examType = formData.get('examType');
    const date = formData.get('date');
    
    // Collect all questions
    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    questionItems.forEach((item, index) => {
        const subject = item.querySelector('select[name="subject"]').value;
        const question = item.querySelector('textarea[name="question"]').value;
        const option1 = item.querySelector('input[name="option1"]').value;
        const option2 = item.querySelector('input[name="option2"]').value;
        const option3 = item.querySelector('input[name="option3"]').value;
        const option4 = item.querySelector('input[name="option4"]').value;
        const difficulty = item.querySelector('select[name="difficulty"]').value;
        
        // Find correct answer
        const correctRadio = item.querySelector(`input[name="correct-${index + 1}"]:checked`);
        const correct = correctRadio ? parseInt(correctRadio.value) : 0;
        
        questions.push({
            subject,
            question,
            options: [option1, option2, option3, option4],
            correct,
            difficulty
        });
    });
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                examType,
                date,
                questions
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`Successfully added ${result.count} questions for ${examType} on ${date}`);
            
            // Reset form
            document.getElementById('questions-container').innerHTML = '';
            questionCount = 0;
            addQuestion();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error adding questions:', error);
        alert('Failed to add questions. Please try again.');
    }
});

// Load users
async function loadUsers() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.examType.toUpperCase()}</td>
            <td>Class ${user.grade}</td>
            <td>${user.score}</td>
            <td>#${user.rank}</td>
            <td>${user.testsCompleted}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// Load analytics
async function loadAnalytics() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/analytics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const analytics = await response.json();
            displayAnalytics(analytics);
        } else {
            console.error('Failed to load analytics');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display analytics
function displayAnalytics(analytics) {
    const grid = document.getElementById('analytics-grid');
    grid.innerHTML = '';
    
    const cards = [
        { title: 'Total Users', value: analytics.totalUsers, icon: 'fas fa-users' },
        { title: 'Total Exams', value: analytics.totalExams, icon: 'fas fa-clipboard-list' },
        { title: 'Average Score', value: Math.round(analytics.averageScore) + '%', icon: 'fas fa-chart-line' },
        { title: 'JEE Students', value: analytics.examTypeDistribution.jee, icon: 'fas fa-atom' },
        { title: 'NEET Students', value: analytics.examTypeDistribution.neet, icon: 'fas fa-heartbeat' },
        { title: 'Class 12 Students', value: analytics.gradeDistribution['12'], icon: 'fas fa-graduation-cap' }
    ];
    
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'analytics-card';
        cardDiv.innerHTML = `
            <i class="${card.icon}" style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
            <div class="analytics-number">${card.value}</div>
            <div>${card.title}</div>
        `;
        grid.appendChild(cardDiv);
    });
    
    // Draw daily exams chart
    drawDailyExamsChart(analytics.dailyExams);
}

// Draw daily exams chart
function drawDailyExamsChart(dailyData) {
    const canvas = document.getElementById('daily-exams-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get last 7 days of data
    const dates = Object.keys(dailyData).sort().slice(-7);
    const values = dates.map(date => dailyData[date] || 0);
    
    if (dates.length === 0) return;
    
    const maxValue = Math.max(...values) || 1;
    const barWidth = canvas.width / dates.length;
    const barMaxHeight = canvas.height - 40;
    
    // Draw bars
    ctx.fillStyle = '#2563eb';
    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * barMaxHeight;
        const x = index * barWidth + 10;
        const y = canvas.height - barHeight - 20;
        
        ctx.fillRect(x, y, barWidth - 20, barHeight);
        
        // Draw value on top
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + (barWidth - 20) / 2, y - 5);
        
        // Draw date at bottom
        const date = new Date(dates[index]);
        const dateStr = date.getDate() + '/' + (date.getMonth() + 1);
        ctx.fillText(dateStr, x + (barWidth - 20) / 2, canvas.height - 5);
        
        ctx.fillStyle = '#2563eb';
    });
}