// Profile functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    initializeProfile();
    setupProfileTabs();
});

// Initialize profile page
function initializeProfile() {
    updateProfileData();
    loadRecentActivity();
    loadPerformanceData();
}

// Setup profile tabs
function setupProfileTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Update profile data
function updateProfileData() {
    if (!currentUser) return;
    
    // Update profile information
    const elements = {
        'profile-name': currentUser.name,
        'total-score': currentUser.score?.toLocaleString() || '0',
        'current-rank': `#${currentUser.rank || 'N/A'}`,
        'streak-count': currentUser.streak || '0',
        'tests-taken': Math.floor(Math.random() * 100) + 50 // Sample data
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Load recent activity
function loadRecentActivity() {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed) return;
    
    // Sample activity data
    const activities = [
        {
            icon: 'fas fa-trophy',
            title: 'Achieved new rank #156',
            description: 'Moved up 12 positions in today\'s JEE practice test',
            time: '2 hours ago'
        },
        {
            icon: 'fas fa-check-circle',
            title: 'Completed NEET Biology Test',
            description: 'Scored 42/45 in today\'s biology practice',
            time: '1 day ago'
        },
        {
            icon: 'fas fa-fire',
            title: '23-day streak milestone',
            description: 'Maintained consistent daily practice for 23 days',
            time: '1 day ago'
        }
    ];
    
    activityFeed.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        activityFeed.appendChild(activityItem);
    });
}

// Load performance data
function loadPerformanceData() {
    // Sample test history
    const testHistory = document.querySelector('.test-history');
    if (!testHistory) return;
    
    const tests = [
        { date: 'Today', name: 'JEE Physics', score: '28/30' },
        { date: 'Yesterday', name: 'NEET Biology', score: '42/45' },
        { date: '2 days ago', name: 'JEE Chemistry', score: '25/30' }
    ];
    
    testHistory.innerHTML = '';
    
    tests.forEach(test => {
        const testItem = document.createElement('div');
        testItem.className = 'test-item';
        testItem.innerHTML = `
            <span class="test-date">${test.date}</span>
            <span class="test-name">${test.name}</span>
            <span class="test-score">${test.score}</span>
        `;
        testHistory.appendChild(testItem);
    });
}

// Toggle edit mode
function toggleEditMode() {
    alert('Edit mode functionality coming soon!');
}

// Edit avatar
function editAvatar() {
    alert('Avatar editing functionality coming soon!');
}

// Edit cover
function editCover() {
    alert('Cover editing functionality coming soon!');
}