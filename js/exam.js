// Exam functionality
let currentExam = null;
let currentQuestionIndex = 0;
let examTimer = null;
let timeRemaining = 0;
let userAnswers = {};
let markedQuestions = new Set();
let examQuestions = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    updateCurrentDate();
    checkExamStatus();
});

// Update current date
function updateCurrentDate() {
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

// Check exam completion status
function checkExamStatus() {
    const completedExams = JSON.parse(localStorage.getItem('completedExams') || '{}');
    const today = new Date().toDateString();
    
    // Update exam status indicators
    const jeeStatus = document.getElementById('jee-status');
    const neetStatus = document.getElementById('neet-status');
    
    if (completedExams[today]?.includes('jee') && jeeStatus) {
        jeeStatus.style.display = 'flex';
    }
    
    if (completedExams[today]?.includes('neet') && neetStatus) {
        neetStatus.style.display = 'flex';
    }
}

// Start exam
async function startExam(examType) {
    try {
        // Fetch questions from server
        examQuestions = await examAPI.getQuestions(examType);
        
        if (!examQuestions || examQuestions.length === 0) {
            alert('No questions available for today. Please try again later.');
            return;
        }
        
        currentExam = examType;
        currentQuestionIndex = 0;
        userAnswers = {};
        markedQuestions = new Set();
        
        // Set timer based on exam type
        timeRemaining = examType === 'jee' ? 30 * 60 : 45 * 60; // 30 or 45 minutes in seconds
        
        // Hide exam selection and show exam interface
        document.getElementById('exam-selection').style.display = 'none';
        document.getElementById('exam-interface').style.display = 'flex';
        
        // Initialize exam
        initializeExam();
        startTimer();
        loadQuestion();
    } catch (error) {
        console.error('Error starting exam:', error);
        alert('Failed to start exam. Please try again.');
    }
}

// Initialize exam interface
function initializeExam() {
    const examTitle = document.getElementById('exam-title');
    const totalQuestions = document.getElementById('total-questions');
    const questionGrid = document.getElementById('question-grid');
    
    if (examTitle) {
        examTitle.textContent = currentExam === 'jee' ? 'JEE Main Practice' : 'NEET Practice';
    }
    
    if (totalQuestions) {
        totalQuestions.textContent = examQuestions.length;
    }
    
    // Generate question navigator
    if (questionGrid) {
        questionGrid.innerHTML = '';
        examQuestions.forEach((_, index) => {
            const questionBtn = document.createElement('button');
            questionBtn.textContent = index + 1;
            questionBtn.className = 'question-btn';
            questionBtn.onclick = () => goToQuestion(index);
            questionGrid.appendChild(questionBtn);
        });
    }
    
    updateQuestionNavigator();
}

// Start exam timer
function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    
    examTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeRemaining <= 0) {
            clearInterval(examTimer);
            submitExam();
        }
    }, 1000);
}

// Load current question
function loadQuestion() {
    const question = examQuestions[currentQuestionIndex];
    
    if (!question) return;
    
    // Update question info
    const currentQuestionNum = document.getElementById('current-question-num');
    const questionSubject = document.getElementById('question-subject');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    
    if (currentQuestionNum) {
        currentQuestionNum.textContent = currentQuestionIndex + 1;
    }
    
    if (questionSubject) {
        questionSubject.textContent = question.subject;
    }
    
    if (questionText) {
        questionText.textContent = question.question;
    }
    
    // Load options
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = 'answer';
            optionInput.value = index;
            optionInput.id = `option-${index}`;
            
            // Check if this option was previously selected
            if (userAnswers[currentQuestionIndex] === index) {
                optionInput.checked = true;
            }
            
            optionInput.addEventListener('change', () => {
                userAnswers[currentQuestionIndex] = index;
                updateQuestionNavigator();
            });
            
            const optionLabel = document.createElement('label');
            optionLabel.htmlFor = `option-${index}`;
            optionLabel.textContent = option;
            
            optionDiv.appendChild(optionInput);
            optionDiv.appendChild(optionLabel);
            optionsContainer.appendChild(optionDiv);
        });
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        if (currentQuestionIndex === examQuestions.length - 1) {
            nextBtn.textContent = 'Submit';
            nextBtn.onclick = submitExam;
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.onclick = nextQuestion;
        }
    }
    
    updateQuestionNavigator();
}

// Navigate to specific question
function goToQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
}

// Go to previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Go to next question
function nextQuestion() {
    if (currentQuestionIndex < examQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

// Mark question for review
function markForReview() {
    if (markedQuestions.has(currentQuestionIndex)) {
        markedQuestions.delete(currentQuestionIndex);
    } else {
        markedQuestions.add(currentQuestionIndex);
    }
    updateQuestionNavigator();
}

// Update question navigator
function updateQuestionNavigator() {
    const questionBtns = document.querySelectorAll('.question-btn');
    
    questionBtns.forEach((btn, index) => {
        btn.className = 'question-btn';
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }
        
        if (userAnswers.hasOwnProperty(index)) {
            btn.classList.add('answered');
        }
        
        if (markedQuestions.has(index)) {
            btn.classList.add('marked');
        }
    });
}

// Submit exam
async function submitExam() {
    if (examTimer) {
        clearInterval(examTimer);
    }
    
    try {
        const timeTaken = (currentExam === 'jee' ? 30 * 60 : 45 * 60) - timeRemaining;
        
        // Convert answers to array format
        const answersArray = [];
        for (let i = 0; i < examQuestions.length; i++) {
            answersArray[i] = userAnswers[i] !== undefined ? userAnswers[i] : -1; // -1 for unanswered
        }
        
        const result = await examAPI.submitExam(currentExam, answersArray, timeTaken);
        
        // Store exam completion
        const completedExams = JSON.parse(localStorage.getItem('completedExams') || '{}');
        const today = new Date().toDateString();
        
        if (!completedExams[today]) {
            completedExams[today] = [];
        }
        
        if (!completedExams[today].includes(currentExam)) {
            completedExams[today].push(currentExam);
        }
        
        localStorage.setItem('completedExams', JSON.stringify(completedExams));
        
        // Update current user data
        if (currentUser) {
            currentUser.score += result.points;
            currentUser.rank = result.newRank;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Show results
        showResults(result);
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert('Failed to submit exam. Please try again.');
    }
}

// Show exam results
function showResults(result) {
    document.getElementById('exam-interface').style.display = 'none';
    document.getElementById('exam-result').style.display = 'block';
    
    // Update result display
    const finalScore = document.getElementById('final-score');
    const correctAnswers = document.getElementById('correct-answers');
    const timeElement = document.getElementById('time-taken');
    const rankChange = document.getElementById('rank-change');
    
    if (finalScore) finalScore.textContent = result.score;
    if (correctAnswers) correctAnswers.textContent = `${result.correctAnswers}/${result.totalQuestions}`;
    if (timeElement) {
        const minutes = Math.floor(result.timeSpent / 60);
        const seconds = result.timeSpent % 60;
        timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (rankChange) {
        const change = result.rankChange;
        rankChange.textContent = change > 0 ? `+${change}` : change.toString();
        rankChange.className = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    }
    
    // Update subject-wise breakdown if available
    updateSubjectBreakdown(result.results);
}

// Update subject breakdown
function updateSubjectBreakdown(results) {
    const subjectResults = document.querySelector('.subject-results');
    if (!subjectResults || !results) return;
    
    // Group results by subject
    const subjectStats = {};
    
    results.forEach((result, index) => {
        const question = examQuestions[index];
        if (!question) return;
        
        const subject = question.subject;
        if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
        }
        
        subjectStats[subject].total++;
        if (result.isCorrect) {
            subjectStats[subject].correct++;
        }
    });
    
    // Update display
    subjectResults.innerHTML = '';
    Object.entries(subjectStats).forEach(([subject, stats]) => {
        const percentage = Math.round((stats.correct / stats.total) * 100);
        
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-result';
        subjectDiv.innerHTML = `
            <span class="subject">${subject}</span>
            <span class="score">${stats.correct}/${stats.total}</span>
            <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%"></div>
            </div>
        `;
        
        subjectResults.appendChild(subjectDiv);
    });
}

// View solutions
function viewSolutions() {
    alert('Solutions feature coming soon!');
}

// Back to exams
function backToExams() {
    document.getElementById('exam-result').style.display = 'none';
    document.getElementById('exam-selection').style.display = 'block';
    checkExamStatus();
}

// Share result
function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: 'My Exam Result',
            text: 'Check out my latest exam score!',
            url: window.location.href
        });
    } else {
        alert('Sharing feature not supported on this device');
    }
}