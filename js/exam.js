// Exam functionality
let currentExam = null;
let currentQuestionIndex = 0;
let examTimer = null;
let timeRemaining = 0;
let userAnswers = {};
let markedQuestions = new Set();

// Sample questions data
const examQuestions = {
    jee: [
        {
            id: 1,
            subject: 'Physics',
            question: 'A particle moves in a circle of radius R. What is the relationship between linear velocity v and angular velocity ω?',
            options: ['v = ωR', 'v = ω/R', 'v = ω²R', 'v = R/ω'],
            correct: 0
        },
        {
            id: 2,
            subject: 'Chemistry',
            question: 'Which of the following is the most electronegative element?',
            options: ['Oxygen', 'Fluorine', 'Nitrogen', 'Chlorine'],
            correct: 1
        },
        {
            id: 3,
            subject: 'Mathematics',
            question: 'What is the derivative of sin(x)?',
            options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
            correct: 0
        }
        // Add more questions as needed
    ],
    neet: [
        {
            id: 1,
            subject: 'Physics',
            question: 'The SI unit of electric current is:',
            options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
            correct: 1
        },
        {
            id: 2,
            subject: 'Chemistry',
            question: 'The atomic number of carbon is:',
            options: ['4', '6', '8', '12'],
            correct: 1
        },
        {
            id: 3,
            subject: 'Biology',
            question: 'The powerhouse of the cell is:',
            options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'],
            correct: 2
        }
        // Add more questions as needed
    ]
};

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
function startExam(examType) {
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
}

// Initialize exam interface
function initializeExam() {
    const questions = examQuestions[currentExam] || [];
    const examTitle = document.getElementById('exam-title');
    const totalQuestions = document.getElementById('total-questions');
    const questionGrid = document.getElementById('question-grid');
    
    if (examTitle) {
        examTitle.textContent = currentExam === 'jee' ? 'JEE Main Practice' : 'NEET Practice';
    }
    
    if (totalQuestions) {
        totalQuestions.textContent = questions.length;
    }
    
    // Generate question navigator
    if (questionGrid) {
        questionGrid.innerHTML = '';
        questions.forEach((_, index) => {
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
    const questions = examQuestions[currentExam] || [];
    const question = questions[currentQuestionIndex];
    
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
        const questions = examQuestions[currentExam] || [];
        if (currentQuestionIndex === questions.length - 1) {
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
    const questions = examQuestions[currentExam] || [];
    if (currentQuestionIndex < questions.length - 1) {
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
function submitExam() {
    if (examTimer) {
        clearInterval(examTimer);
    }
    
    // Calculate results
    const questions = examQuestions[currentExam] || [];
    let correctAnswers = 0;
    
    questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            correctAnswers++;
        }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeTaken = (currentExam === 'jee' ? 30 * 60 : 45 * 60) - timeRemaining;
    
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
    
    // Show results
    showResults(score, correctAnswers, questions.length, timeTaken);
}

// Show exam results
function showResults(score, correct, total, timeTaken) {
    document.getElementById('exam-interface').style.display = 'none';
    document.getElementById('exam-result').style.display = 'block';
    
    // Update result display
    const finalScore = document.getElementById('final-score');
    const correctAnswers = document.getElementById('correct-answers');
    const timeElement = document.getElementById('time-taken');
    const rankChange = document.getElementById('rank-change');
    
    if (finalScore) finalScore.textContent = score;
    if (correctAnswers) correctAnswers.textContent = `${correct}/${total}`;
    if (timeElement) {
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (rankChange) rankChange.textContent = `+${Math.floor(Math.random() * 20) + 1}`;
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