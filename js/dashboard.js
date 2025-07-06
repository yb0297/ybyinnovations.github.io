// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize dashboard components
    initializeProgressChart();
    updateDashboardData();
});

// Initialize progress chart
function initializeProgressChart() {
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sample data for the last 7 days
    const data = [75, 80, 78, 85, 82, 88, 84.5];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Draw chart
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const stepX = width / (data.length - 1);
    const maxY = Math.max(...data);
    const minY = Math.min(...data);
    const range = maxY - minY || 1;
    
    data.forEach((value, index) => {
        const x = index * stepX;
        const y = height - ((value - minY) / range) * height * 0.8 - height * 0.1;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw points
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
    
    ctx.stroke();
}

// Update dashboard data
function updateDashboardData() {
    if (!currentUser) return;
    
    // Update user-specific data
    const elements = {
        'profile-name': currentUser.name,
        'current-rank': `#${currentUser.rank}`,
        'total-score': currentUser.score.toLocaleString(),
        'streak-count': currentUser.streak
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update current date
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}