class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.leftScoreEl = document.getElementById('leftScore');
        this.rightScoreEl = document.getElementById('rightScore');
        this.gameOverEl = document.getElementById('gameOver');
        this.winnerEl = document.getElementById('winner');
        this.gameContainer = document.querySelector('.game-container');
        
        this.gameState = 'menu'; // menu, playing, gameOver
        this.keys = {};
        
        // Game objects
        this.ball = {
            x: 400,
            y: 200,
            dx: 5,
            dy: 3,
            radius: 8,
            speed: 5
        };
        
        this.leftPaddle = {
            x: 20,
            y: 150,
            width: 15,
            height: 100,
            speed: 6
        };
        
        this.rightPaddle = {
            x: 765,
            y: 150,
            width: 15,
            height: 100,
            speed: 6
        };
        
        this.score = {
            left: 0,
            right: 0,
            maxScore: 5
        };
        
        this.initEventListeners();
        this.createSounds();
    }
    
    createSounds() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.sounds = {
            paddle: () => this.playTone(200, 0.1),
            wall: () => this.playTone(150, 0.1),
            score: () => this.playTone(100, 0.3)
        };
    }
    
    playTone(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameContainer.classList.add('game-active');
        this.resetBall();
        this.gameLoop();
    }
    
    restartGame() {
        this.score.left = 0;
        this.score.right = 0;
        this.updateScore();
        this.gameOverEl.classList.add('hidden');
        this.startGame();
    }
    
    resetBall() {
        this.ball.x = 400;
        this.ball.y = 200;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = (Math.random() - 0.5) * this.ball.speed;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Move paddles
        if (this.keys['a'] && this.leftPaddle.y > 0) {
            this.leftPaddle.y -= this.leftPaddle.speed;
        }
        if (this.keys['z'] && this.leftPaddle.y < this.canvas.height - this.leftPaddle.height) {
            this.leftPaddle.y += this.leftPaddle.speed;
        }
        
        if (this.keys['arrowup'] && this.rightPaddle.y > 0) {
            this.rightPaddle.y -= this.rightPaddle.speed;
        }
        if (this.keys['arrowdown'] && this.rightPaddle.y < this.canvas.height - this.rightPaddle.height) {
            this.rightPaddle.y += this.rightPaddle.speed;
        }
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Ball collision with top/bottom walls
        if (this.ball.y <= this.ball.radius || this.ball.y >= this.canvas.height - this.ball.radius) {
            this.ball.dy = -this.ball.dy;
            this.sounds.wall();
        }
        
        // Ball collision with paddles
        if (this.checkPaddleCollision(this.leftPaddle) || this.checkPaddleCollision(this.rightPaddle)) {
            this.ball.dx = -this.ball.dx;
            // Add some randomness to the angle
            this.ball.dy += (Math.random() - 0.5) * 2;
            this.sounds.paddle();
        }
        
        // Ball out of bounds (scoring)
        if (this.ball.x < 0) {
            this.score.right++;
            this.sounds.score();
            this.updateScore();
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score.left++;
            this.sounds.score();
            this.updateScore();
            this.resetBall();
        }
        
        // Check for game over
        if (this.score.left >= this.score.maxScore || this.score.right >= this.score.maxScore) {
            this.endGame();
        }
    }
    
    checkPaddleCollision(paddle) {
        return this.ball.x - this.ball.radius < paddle.x + paddle.width &&
               this.ball.x + this.ball.radius > paddle.x &&
               this.ball.y - this.ball.radius < paddle.y + paddle.height &&
               this.ball.y + this.ball.radius > paddle.y;
    }
    
    updateScore() {
        this.leftScoreEl.textContent = this.score.left;
        this.rightScoreEl.textContent = this.score.right;
    }
    
    endGame() {
        this.gameState = 'gameOver';
        const winner = this.score.left >= this.score.maxScore ? 'Left Player' : 'Right Player';
        this.winnerEl.textContent = `${winner} Wins!`;
        this.gameOverEl.classList.remove('hidden');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
        this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});