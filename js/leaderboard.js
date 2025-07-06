// Leaderboard functionality
let currentFilter = 'overall';
let currentPage = 1;
const itemsPerPage = 20;

// Sample leaderboard data
const leaderboardData = [
    { rank: 1, name: 'Rahul Kumar', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop', score: 3567, tests: 95, streak: 45, change: 0 },
    { rank: 2, name: 'Priya Sharma', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop', score: 3245, tests: 89, streak: 32, change: 1 },
    { rank: 3, name: 'Sneha Patel', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop', score: 3123, tests: 87, streak: 28, change: -1 },
    // Add more sample data...
];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    initializeLeaderboard();
    setupFilterTabs();
});

// Initialize leaderboard
function initializeLeaderboard() {
    generateSampleData();
    loadLeaderboard();
    updateUserRank();
}

// Generate sample leaderboard data
function generateSampleData() {
    const names = ['Arjun Patel', 'Kavya Singh', 'Rohit Gupta', 'Ananya Reddy', 'Vikram Joshi'];
    const avatars = [
        'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'
    ];
    
    // Generate more sample data
    for (let i = leaderboardData.length; i < 200; i++) {
        leaderboardData.push({
            rank: i + 1,
            name: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            score: Math.floor(Math.random() * 3000) + 500,
            tests: Math.floor(Math.random() * 100) + 20,
            streak: Math.floor(Math.random() * 50) + 1,
            change: Math.floor(Math.random() * 21) - 10
        });
    }
    
    // Sort by score
    leaderboardData.sort((a, b) => b.score - a.score);
    
    // Update ranks
    leaderboardData.forEach((item, index) => {
        item.rank = index + 1;
    });
}

// Setup filter tabs
function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update current filter
            currentFilter = this.getAttribute('data-filter');
            currentPage = 1;
            
            // Reload leaderboard
            loadLeaderboard();
        });
    });
}

// Load leaderboard data
function loadLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = leaderboardData.slice(startIndex, endIndex);
    
    pageData.forEach(student => {
        const row = createLeaderboardRow(student);
        leaderboardBody.appendChild(row);
    });
    
    updatePagination();
}

// Create leaderboard row
function createLeaderboardRow(student) {
    const row = document.createElement('div');
    row.className = 'table-row';
    
    // Highlight current user
    if (currentUser && student.name === currentUser.name) {
        row.classList.add('current-user');
    }
    
    row.innerHTML = `
        <div class="table-cell rank">
            <span class="rank-number">${student.rank}</span>
            ${student.rank <= 3 ? `<i class="fas fa-medal ${student.rank === 1 ? 'gold' : student.rank === 2 ? 'silver' : 'bronze'}"></i>` : ''}
        </div>
        <div class="table-cell student">
            <img src="${student.avatar}" alt="${student.name}">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Active student</p>
            </div>
        </div>
        <div class="table-cell score">${student.score.toLocaleString()}</div>
        <div class="table-cell tests">${student.tests}</div>
        <div class="table-cell streak">
            <span class="streak-badge">${student.streak}</span>
        </div>
        <div class="table-cell change">
            <span class="change-badge ${student.change > 0 ? 'positive' : student.change < 0 ? 'negative' : 'neutral'}">
                ${student.change > 0 ? '+' : ''}${student.change}
            </span>
        </div>
    `;
    
    return row;
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (pageNumbers) {
        pageNumbers.innerHTML = '';
        
        // Show first page
        if (currentPage > 3) {
            const firstBtn = createPageButton(1);
            pageNumbers.appendChild(firstBtn);
            
            if (currentPage > 4) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                pageNumbers.appendChild(dots);
            }
        }
        
        // Show current page and surrounding pages
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        
        for (let i = start; i <= end; i++) {
            const pageBtn = createPageButton(i);
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageNumbers.appendChild(pageBtn);
        }
        
        // Show last page
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                pageNumbers.appendChild(dots);
            }
            
            const lastBtn = createPageButton(totalPages);
            pageNumbers.appendChild(lastBtn);
        }
    }
    
    // Update navigation buttons
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadLeaderboard();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadLeaderboard();
            }
        };
    }
}

// Create page button
function createPageButton(pageNum) {
    const button = document.createElement('button');
    button.className = 'page-btn';
    button.textContent = pageNum;
    button.onclick = () => {
        currentPage = pageNum;
        loadLeaderboard();
    };
    return button;
}

// Update user rank display
function updateUserRank() {
    if (!currentUser) return;
    
    // Find user in leaderboard
    const userRank = leaderboardData.find(student => student.name === currentUser.name);
    
    if (userRank) {
        const rankPosition = document.querySelector('.rank-position');
        const rankChange = document.querySelector('.rank-change span');
        
        if (rankPosition) {
            rankPosition.textContent = `#${userRank.rank}`;
        }
        
        if (rankChange) {
            rankChange.textContent = userRank.change > 0 ? `+${userRank.change}` : userRank.change;
        }
    }
}