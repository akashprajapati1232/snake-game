// Game Constants & Variables
let inputDir = {x: 0, y: 0};
const foodSound = new Audio('Assets/music/food.mp3');
const gameOverSound = new Audio('Assets/music/gameover.mp3');
const moveSound = new Audio('Assets/music/move.mp3');
const musicSound = new Audio('Assets/music/music.mp3');
let speed = 9;
let score = 0;
let lastPaintTime = 0;
let snakeArr = [{x: 13, y: 15}];
let food = {x: 6, y: 7};
let gameActive = false;
let isPaused = false;
let isMuted = false;
let specialFood = null;
let specialFoodTimer = null;
let countdownInterval = null;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameArea = document.getElementById('game-area');
const board = document.querySelector('.board');
const scoreBox = document.querySelector('.scoreBox');
const hiscoreBox = document.querySelector('.hiscoreBox');
const finalScore = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score-display');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');
const pauseBtn = document.getElementById('pause-btn');
const soundBtn = document.getElementById('sound-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// Mobile control buttons
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// Initialize high score
let hiscore = localStorage.getItem("hicore");
let hiscoreval = 0;
if (hiscore === null) {
    localStorage.setItem("hicore", JSON.stringify(hiscoreval));
} else {
    hiscoreval = JSON.parse(hiscore);
    hiscoreBox.innerHTML = "High Score: " + hiscoreval;
    highScoreDisplay.innerHTML = "High Score: " + hiscoreval;
}

// Event Listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
menuButton.addEventListener('click', showMainMenu);
pauseBtn.addEventListener('click', togglePause);
soundBtn.addEventListener('click', toggleSound);

// Difficulty buttons
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speed = parseInt(btn.dataset.speed);
        speedSlider.value = speed;
        speedValue.innerText = speed;
    });
});

// Speed slider
speedSlider.addEventListener('input', (e) => {
    speed = parseInt(e.target.value);
    speedValue.innerText = speed;

    // Update difficulty buttons based on speed
    difficultyBtns.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.speed) === speed) {
            btn.classList.add('active');
        }
    });
});

// Mobile controls
upBtn.addEventListener('touchstart', () => setDirection(0, -1));
downBtn.addEventListener('touchstart', () => setDirection(0, 1));
leftBtn.addEventListener('touchstart', () => setDirection(-1, 0));
rightBtn.addEventListener('touchstart', () => setDirection(1, 0));

// Keyboard controls
window.addEventListener('keydown', e => {
    if (!gameActive || isPaused) return;

    if (!isMuted) {
        moveSound.play();
    }

    switch(e.key) {
        case "ArrowUp":
            setDirection(0, -1);
            break;
        case "ArrowDown":
            setDirection(0, 1);
            break;
        case "ArrowLeft":
            setDirection(-1, 0);
            break;
        case "ArrowRight":
            setDirection(1, 0);
            break;
        case " ": // Space bar for pause
            togglePause();
            break;
        case "m": // 'm' key for mute/unmute
            toggleSound();
            break;
        default:
            break;
    }
});

// Helper function to set direction
function setDirection(x, y) {
    // Prevent 180-degree turns (snake can't turn back on itself)
    if (snakeArr.length > 1 &&
        (x !== 0 && x === -inputDir.x) ||
        (y !== 0 && y === -inputDir.y)) {
        return;
    }

    // If direction is changing, add a visual effect to the head
    if ((inputDir.x !== x || inputDir.y !== y) && (x !== 0 || y !== 0)) {
        const headElement = document.querySelector('.head');
        if (headElement) {
            // Add a quick scale effect when changing direction
            headElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                headElement.style.transform = 'scale(1)';
            }, 100);

            // Update eye positions
            const leftEye = headElement.querySelector('.snake-eye-left');
            const rightEye = headElement.querySelector('.snake-eye-right');
            if (leftEye && rightEye) {
                updateSnakeHeadAppearance(headElement, x, y);
            }
        }
    }

    inputDir.x = x;
    inputDir.y = y;
}

// Helper function to update the snake head appearance based on direction
function updateSnakeHeadAppearance(headElement, x, y) {
    // Set eye positions based on direction
    const leftEye = headElement.querySelector('.snake-eye-left');
    const rightEye = headElement.querySelector('.snake-eye-right');

    if (x === 1) { // Right
        leftEye.style.left = '60%';
        rightEye.style.left = '60%';
    } else if (x === -1) { // Left
        leftEye.style.left = '40%';
        rightEye.style.left = '40%';
    }

    if (y === 1) { // Down
        leftEye.style.top = '60%';
        rightEye.style.top = '60%';
    } else if (y === -1) { // Up
        leftEye.style.top = '40%';
        rightEye.style.top = '40%';
    }
}

// Game Functions
function startGame() {
    // Reset game state
    snakeArr = [{x: 13, y: 15}];
    food = {x: 6, y: 7};
    specialFood = null;
    clearTimeout(specialFoodTimer);
    inputDir = {x: 0, y: 0};
    score = 0;
    scoreBox.innerHTML = "Score: " + score;

    // Show game area, hide other screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');

    // Start countdown
    startCountdown();
}

function startCountdown() {
    // Create countdown element
    const countdownEl = document.createElement('div');
    countdownEl.classList.add('countdown');
    countdownEl.style.position = 'absolute';
    countdownEl.style.top = '50%';
    countdownEl.style.left = '50%';
    countdownEl.style.transform = 'translate(-50%, -50%)';
    countdownEl.style.fontSize = '5rem';
    countdownEl.style.color = 'white';
    countdownEl.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
    countdownEl.style.zIndex = '100';
    document.querySelector('.board-container').appendChild(countdownEl);

    let count = 3;
    countdownEl.textContent = count;

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else if (count === 0) {
            countdownEl.textContent = 'GO!';
        } else {
            clearInterval(countdownInterval);
            countdownEl.remove();
            gameActive = true;
            if (!isMuted) {
                musicSound.play();
            }
            window.requestAnimationFrame(main);
        }
    }, 1000);
}

function showMainMenu() {
    gameActive = false;
    isPaused = false;
    gameArea.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    musicSound.pause();
    musicSound.currentTime = 0;
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';

    // Add or remove paused class to the head
    const headElement = document.querySelector('.head');
    if (headElement) {
        if (isPaused) {
            headElement.style.filter = 'grayscale(50%) brightness(70%)';
            headElement.style.animation = 'none';
        } else {
            headElement.style.filter = '';
            headElement.style.animation = 'headPulse 1.5s infinite alternate';
        }
    }

    if (isPaused) {
        musicSound.pause();
    } else if (gameActive && !isMuted) {
        musicSound.play();
    }
}

function toggleSound() {
    isMuted = !isMuted;
    soundBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';

    if (isMuted) {
        musicSound.pause();
    } else if (gameActive && !isPaused) {
        musicSound.play();
    }
}

function gameOver() {
    gameActive = false;
    if (!isMuted) {
        gameOverSound.play();
    }
    musicSound.pause();

    // Update final score display
    finalScore.textContent = "Score: " + score;
    highScoreDisplay.textContent = "High Score: " + hiscoreval;

    // Show game over screen
    gameArea.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

function main(ctime) {
    window.requestAnimationFrame(main);

    if (!gameActive || isPaused) return;

    if ((ctime - lastPaintTime) / 1000 < 1 / speed) {
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(sarr) {
    // Check if snake collides with itself
    for (let i = 1; i < sarr.length; i++) {
        if (sarr[i].x === sarr[0].x && sarr[i].y === sarr[0].y) {
            return true;
        }
    }
    // Check if snake collides with the wall
    if (sarr[0].x >= 20 || sarr[0].x <= 0 || sarr[0].y >= 20 || sarr[0].y <= 0) {
        return true;
    }
    return false;
}

function createSpecialFood() {
    if (specialFood) return;

    // 20% chance to create special food when score is at least 5
    if (score >= 5 && Math.random() < 0.2) {
        let a = 2;
        let b = 16;
        specialFood = {
            x: Math.round(a + (b - a) * Math.random()),
            y: Math.round(a + (b - a) * Math.random()),
            points: Math.floor(Math.random() * 3) + 3 // 3-5 points
        };

        // Special food disappears after 5 seconds
        specialFoodTimer = setTimeout(() => {
            specialFood = null;
        }, 5000);
    }
}

function gameEngine() {
    // Check if the snake collided
    if (isCollide(snakeArr)) {
        gameOver();
        return;
    }

    // If snake eats regular food
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {
        if (!isMuted) {
            foodSound.play();
        }
        score += 1;
        updateScore();

        // Grow the snake
        snakeArr.unshift({x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y});

        // Generate new food
        let a = 2;
        let b = 16;
        food = {x: Math.round(a + (b - a) * Math.random()), y: Math.round(a + (b - a) * Math.random())};

        // Possibly create special food
        createSpecialFood();
    }

    // If snake eats special food
    if (specialFood && snakeArr[0].y === specialFood.y && snakeArr[0].x === specialFood.x) {
        if (!isMuted) {
            foodSound.play();
        }
        score += specialFood.points;
        updateScore();

        // Grow the snake
        snakeArr.unshift({x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y});

        // Remove special food
        clearTimeout(specialFoodTimer);
        specialFood = null;
    }

    // Move the snake if there's direction input
    if (inputDir.x !== 0 || inputDir.y !== 0) {
        for (let i = snakeArr.length - 2; i >= 0; i--) {
            snakeArr[i + 1] = {...snakeArr[i]};
        }

        snakeArr[0].x += inputDir.x;
        snakeArr[0].y += inputDir.y;
    }

    // Display the snake and food
    board.innerHTML = "";

    // Render snake
    snakeArr.forEach((e, index) => {
        let snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;

        if (index === 0) {
            // This is the head
            snakeElement.classList.add('head');

            // Create eyes for the snake head
            const leftEye = document.createElement('div');
            leftEye.classList.add('snake-eye', 'snake-eye-left');

            const rightEye = document.createElement('div');
            rightEye.classList.add('snake-eye', 'snake-eye-right');

            // Create pupils for the eyes
            const leftPupil = document.createElement('div');
            leftPupil.classList.add('snake-pupil');
            leftEye.appendChild(leftPupil);

            const rightPupil = document.createElement('div');
            rightPupil.classList.add('snake-pupil');
            rightEye.appendChild(rightPupil);

            // Add eyes to the head
            snakeElement.appendChild(leftEye);
            snakeElement.appendChild(rightEye);

            // Update eye positions based on direction
            updateSnakeHeadAppearance(snakeElement, inputDir.x, inputDir.y);

            // Add subtle animation for the head (unless paused)
            if (!isPaused) {
                // Pulse effect for the head
                snakeElement.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8), 0 0 20px rgba(46, 204, 113, 0.5)';
                snakeElement.style.animation = 'headPulse 1.5s infinite alternate';
            } else {
                snakeElement.style.filter = 'grayscale(50%) brightness(70%)';
            }

            // Add a slight scale effect for the head
            snakeElement.style.scale = '1.05';
        } else {
            // This is a body segment
            snakeElement.classList.add('snake');

            // Add animation to body segments
            if (!isPaused) {
                // Add a slight animation delay based on position
                // This creates a wave-like effect through the snake body
                const animationDelay = (index % 5) * 0.2;
                snakeElement.style.animation = `bodyPulse 2s infinite alternate`;
                snakeElement.style.animationDelay = `${animationDelay}s`;
            }
        }

        board.appendChild(snakeElement);
    });

    // Render regular food
    let foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    board.appendChild(foodElement);

    // Render special food if exists
    if (specialFood) {
        let specialFoodElement = document.createElement('div');
        specialFoodElement.style.gridRowStart = specialFood.y;
        specialFoodElement.style.gridColumnStart = specialFood.x;
        specialFoodElement.classList.add('special-food');
        specialFoodElement.style.background = '#c1666b'; // A contrasting reddish color
        specialFoodElement.style.borderRadius = '0';
        specialFoodElement.style.border = '2px solid #5bc0be';
        specialFoodElement.style.boxShadow = '0 0 8px rgba(91, 192, 190, 0.7)';
        specialFoodElement.style.animation = 'pulse 0.8s infinite alternate';
        specialFoodElement.style.width = '70%';
        specialFoodElement.style.height = '70%';
        specialFoodElement.style.margin = '15%';
        specialFoodElement.style.imageRendering = 'pixelated';

        // Add point value display
        const pointsDisplay = document.createElement('div');
        pointsDisplay.textContent = '+' + specialFood.points;
        pointsDisplay.style.position = 'absolute';
        pointsDisplay.style.top = '-20px';
        pointsDisplay.style.left = '50%';
        pointsDisplay.style.transform = 'translateX(-50%)';
        pointsDisplay.style.color = '#5bc0be';
        pointsDisplay.style.fontSize = '0.7rem';
        pointsDisplay.style.fontFamily = 'var(--main-font)';
        pointsDisplay.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
        specialFoodElement.appendChild(pointsDisplay);

        board.appendChild(specialFoodElement);
    }
}

function updateScore() {
    if (score > hiscoreval) {
        hiscoreval = score;
        localStorage.setItem("hicore", JSON.stringify(hiscoreval));
        hiscoreBox.innerHTML = "High Score: " + hiscoreval;
    }
    scoreBox.innerHTML = "Score: " + score;
}

// Add a style for animations
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

@keyframes headPulse {
    0% {
        box-shadow: 0 0 0 rgba(58, 80, 107, 0);
    }
    50% {
        box-shadow: 0 0 5px rgba(91, 192, 190, 0.5);
    }
    100% {
        box-shadow: 0 0 0 rgba(58, 80, 107, 0);
    }
}

@keyframes bodyPulse {
    0% {
        filter: grayscale(100%) brightness(1) contrast(1);
        transform: scale(1);
    }
    50% {
        filter: grayscale(100%) brightness(1.1) contrast(1.1);
        transform: scale(1.02);
    }
    100% {
        filter: grayscale(100%) brightness(1) contrast(1);
        transform: scale(1);
    }
}

@keyframes blink {
    0% { opacity: 1; }
    10% { opacity: 1; }
    15% { opacity: 0; }
    20% { opacity: 1; }
    100% { opacity: 1; }
}

.snake-pupil {
    animation: blink 3s infinite;
}
`;
document.head.appendChild(style);
