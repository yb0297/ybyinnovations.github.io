// Leaderboard functionality
let currentFilter = 'overall';
let currentPage = 1;
const itemsPerPage = 20;
let leaderboardData = [];

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
async function initializeLeaderboard() {
    await loadLeaderboard();
    updateUserRank();
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
async function loadLeaderboard() {
    try {
        const response = await userAPI.getLeaderboard(currentFilter, currentPage, itemsPerPage);
        leaderboardData = response.users;
        
        displayLeaderboard(leaderboardData);
        updatePagination(response.currentPage, response.totalPages);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Fallback to sample data
        generateSampleData();
        displayLeaderboard(leaderboardData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        updatePagination(currentPage, Math.ceil(leaderboardData.length / itemsPerPage));
    }
}

// Generate sample leaderboard data (fallback)
function generateSampleData() {
    const names = ['Rahul Kumar', 'Priya Sharma', 'Sneha Patel', 'Arjun Patel', 'Kavya Singh', 'Rohit Gupta', 'Ananya Reddy', 'Vikram Joshi'];
    const avatars = [
        'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'
    ];
    
    leaderboardData = [];
    
    for (let i = 0; i < 200; i++) {
        leaderboardData.push({
            rank: i + 1,
            name: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            score: Math.floor(Math.random() * 3000) + 500,
            testsCompleted: Math.floor(Math.random() * 100) + 20,
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

// Display leaderboard
function displayLeaderboard(users) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    users.forEach(student => {
        const row = createLeaderboardRow(student);
        leaderboardBody.appendChild(row);
    });
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
            <img src="${student.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'}" alt="${student.name}">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Active student</p>
            </div>
        </div>
        <div class="table-cell score">${student.score.toLocaleString()}</div>
        <div class="table-cell tests">${student.testsCompleted}</div>
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
function updatePagination(current, total) {
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    currentPage = current;
    
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
        const end = Math.min(total, currentPage + 2);
        
        for (let i = start; i <= end; i++) {
            const pageBtn = createPageButton(i);
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageNumbers.appendChild(pageBtn);
        }
        
        // Show last page
        if (currentPage < total - 2) {
            if (currentPage < total - 3) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                pageNumbers.appendChild(dots);
            }
            
            const lastBtn = createPageButton(total);
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
        nextBtn.disabled = currentPage === total;
        nextBtn.onclick = () => {
            if (currentPage < total) {
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
    
    const rankPosition = document.querySelector('.rank-position');
    const rankChange = document.querySelector('.rank-change span');
    
    if (rankPosition && currentUser.rank) {
        rankPosition.textContent = `#${currentUser.rank}`;
    }
    
    if (rankChange) {
        const change = Math.floor(Math.random() * 21) - 10; // Random for demo
        rankChange.textContent = change > 0 ? `+${change}` : change;
    }
}