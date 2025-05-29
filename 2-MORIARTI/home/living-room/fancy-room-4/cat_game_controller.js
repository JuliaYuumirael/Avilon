// ===== CAT GAME CONTROLLER =====
// RCD Game Room Controller - Simplified Version (No Phaser)

console.log('🎮 Starting RCD Game Controller (Simplified)...');

class RCDGameController {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isPaused = false;
        this.soundEnabled = true;
        this.autoFeedEnabled = false;
        this.animationId = null;

        // Performance settings
        this.performanceLevel = 'medium';
        this.fps = 60;
        this.lastFrameTime = Date.now();

        // Game state
        this.gameState = {
            score: 0,
            level: 1,
            ratCount: 5,
            happiness: 85,
            energy: 70,
            foodInventory: {
                red: 3, blue: 5, green: 2,
                bounce: 2, spin: 4, glow: 1,
                shadow: 3, blur: 2, scale: 4
            }
        };

        // Achievements
        this.achievements = {
            'first-feed': false,
            'colorful-colony': false,
            'animation-master': false,
            'happy-colony': false
        };

        // Rats array
        this.rats = [];
        this.selectedFood = null;

        this.init();
    }

    init() {
        console.log('🎮 Initializing RCD Game Controller...');

        try {
            this.setupCanvas();
            this.setupEventListeners();
            this.createRats();
            this.startGameLoop();
            this.updateUI();

            console.log('🐀 RCD Game Room ready!');
        } catch (error) {
            console.error('🚨 Error initializing game:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Could not get canvas context');
        }

        // Set canvas size
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        console.log('🖼️ Canvas initialized:', this.canvas.width + 'x' + this.canvas.height);
    }

    setupEventListeners() {
        console.log('🎮 Setting up event listeners...');

        // Performance controls
        const qualitySelect = document.getElementById('quality-select');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                this.adjustPerformance(e.target.value);
            });
        }

        // Food selection
        document.querySelectorAll('.food-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectFood(item);
            });
        });

        // Feed button
        const feedButton = document.getElementById('feed-rats');
        if (feedButton) {
            feedButton.addEventListener('click', () => {
                this.feedRats();
            });
        }

        // Game controls
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        const resetBtn = document.getElementById('reset-game');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }

        const soundBtn = document.getElementById('toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
        }

        const autoBtn = document.getElementById('auto-feed');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => this.toggleAutoFeed());
        }

        // Canvas clicks
        this.canvas.addEventListener('click', (e) => {
            this.onCanvasClick(e);
        });

        console.log('✅ Event listeners set up');
    }

    createRats() {
        this.rats = [];

        for (let i = 0; i < this.gameState.ratCount; i++) {
            const rat = {
                id: i,
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: Math.random() * (this.canvas.height - 60) + 30,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 20,
                color: '#4a4a4a',
                happiness: 50 + Math.random() * 30,
                energy: 50 + Math.random() * 50,
                effects: [],
                lastFed: Date.now(),
                animationOffset: Math.random() * Math.PI * 2
            };

            this.rats.push(rat);
        }

        console.log('🐀 Created', this.rats.length, 'rats');
    }

    startGameLoop() {
        const gameLoop = () => {
            if (!this.isPaused) {
                this.update();
                this.render();
            }
            this.animationId = requestAnimationFrame(gameLoop);
        };

        gameLoop();
        console.log('🔄 Game loop started');
    }

    update() {
        // Update FPS
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.fps = Math.round(1000 / deltaTime);
        this.lastFrameTime = currentTime;

        // Update FPS display
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = this.fps;
        }

        // Update rats
        this.rats.forEach(rat => {
            this.updateRat(rat);
        });

        // Update game stats every second
        if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - deltaTime) / 1000)) {
            this.updateGameStats();
        }
    }

    updateRat(rat) {
        // Move rat
        rat.x += rat.vx;
        rat.y += rat.vy;

        // Bounce off walls
        if (rat.x <= rat.size || rat.x >= this.canvas.width - rat.size) {
            rat.vx *= -1;
            rat.x = Math.max(rat.size, Math.min(this.canvas.width - rat.size, rat.x));
        }
        if (rat.y <= rat.size || rat.y >= this.canvas.height - rat.size) {
            rat.vy *= -1;
            rat.y = Math.max(rat.size, Math.min(this.canvas.height - rat.size, rat.y));
        }

        // Random direction changes
        if (Math.random() < 0.002) {
            rat.vx += (Math.random() - 0.5) * 0.5;
            rat.vy += (Math.random() - 0.5) * 0.5;

            // Limit speed
            const maxSpeed = 3;
            const speed = Math.sqrt(rat.vx * rat.vx + rat.vy * rat.vy);
            if (speed > maxSpeed) {
                rat.vx = (rat.vx / speed) * maxSpeed;
                rat.vy = (rat.vy / speed) * maxSpeed;
            }
        }

        // Apply effects
        if (rat.effects.includes('bounce')) {
            rat.animationOffset += 0.1;
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw rats
        this.rats.forEach(rat => {
            this.drawRat(rat);
        });
    }

    drawRat(rat) {
        this.ctx.save();

        // Calculate position (with bounce effect if applicable)
        let x = rat.x;
        let y = rat.y;

        if (rat.effects.includes('bounce')) {
            y += Math.sin(rat.animationOffset) * 5;
        }

        // Scale effect
        let scale = 1;
        if (rat.effects.includes('scale')) {
            scale = 1.2;
        }

        // Glow effect
        if (rat.effects.includes('glow')) {
            this.ctx.shadowColor = rat.color;
            this.ctx.shadowBlur = 10;
        }

        // Draw rat body (circle)
        this.ctx.fillStyle = rat.color;
        this.ctx.globalAlpha = 0.5 + (rat.happiness / 100) * 0.5;

        this.ctx.beginPath();
        this.ctx.arc(x, y, rat.size * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw rat head (smaller circle)
        this.ctx.beginPath();
        this.ctx.arc(x - rat.size * 0.6 * scale, y - rat.size * 0.3 * scale, rat.size * 0.6 * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x - rat.size * 0.8 * scale, y - rat.size * 0.4 * scale, 2 * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw tail
        this.ctx.strokeStyle = rat.color;
        this.ctx.lineWidth = 3 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(x + rat.size * scale, y);
        this.ctx.quadraticCurveTo(
            x + rat.size * 1.5 * scale,
            y - rat.size * 0.5 * scale,
            x + rat.size * 2 * scale,
            y
        );
        this.ctx.stroke();

        this.ctx.restore();
    }

    updateGameStats() {
        let totalHappiness = 0;
        let totalEnergy = 0;

        this.rats.forEach(rat => {
            // Decay happiness and energy over time
            rat.happiness = Math.max(0, rat.happiness - 0.1);
            rat.energy = Math.max(0, rat.energy - 0.05);

            totalHappiness += rat.happiness;
            totalEnergy += rat.energy;
        });

        // Update global stats
        this.gameState.happiness = Math.round(totalHappiness / this.rats.length);
        this.gameState.energy = Math.round(totalEnergy / this.rats.length);

        this.updateUI();
    }

    onCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if clicked on a rat
        this.rats.forEach(rat => {
            const distance = Math.sqrt((clickX - rat.x) ** 2 + (clickY - rat.y) ** 2);
            if (distance < rat.size) {
                this.onRatClick(rat);
            }
        });
    }

    onRatClick(rat) {
        // Increase happiness
        rat.happiness = Math.min(100, rat.happiness + 5);

        // Visual feedback - temporary size increase
        const originalSize = rat.size;
        rat.size = originalSize * 1.3;
        setTimeout(() => {
            rat.size = originalSize;
        }, 200);

        this.playSound('click');
        console.log('🐀 Rat clicked, happiness:', rat.happiness);
    }

    selectFood(foodElement) {
        // Clear previous selection
        document.querySelectorAll('.food-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select new food
        foodElement.classList.add('selected');

        const foodType = foodElement.getAttribute('data-food');
        const foodValue = foodElement.getAttribute('data-value');
        this.selectedFood = { type: foodType, value: foodValue };

        const selectedFoodElement = document.getElementById('selected-food');
        if (selectedFoodElement) {
            selectedFoodElement.textContent = `${foodValue} (${foodType})`;
        }

        const feedButton = document.getElementById('feed-rats');
        if (feedButton) {
            feedButton.disabled = false;
        }

        console.log('🍽️ Selected food:', this.selectedFood);
    }

    feedRats() {
        if (!this.selectedFood) return;

        const { type, value } = this.selectedFood;

        // Check inventory
        if (this.gameState.foodInventory[value] <= 0) {
            alert('Not enough of this food type!');
            return;
        }

        // Reduce inventory
        this.gameState.foodInventory[value]--;

        // Apply effect to random rats
        const numRatsToFeed = Math.min(3, this.rats.length);
        const ratsToFeed = this.rats.slice().sort(() => Math.random() - 0.5).slice(0, numRatsToFeed);

        ratsToFeed.forEach(rat => {
            this.applyFoodEffect(rat, type, value);
        });

        // Update score
        this.gameState.score += 10;

        // Check achievements
        this.checkAchievements();

        this.updateUI();
        this.playSound('feed');

        console.log('🍽️ Fed rats with', value, type);
    }

    applyFoodEffect(rat, type, value) {
        switch (type) {
            case 'color':
                const colorMap = {
                    red: '#ff6b6b',
                    blue: '#4ecdc4',
                    green: '#96ceb4'
                };
                rat.color = colorMap[value] || '#4a4a4a';
                break;
            case 'animation':
                if (!rat.effects.includes(value)) {
                    rat.effects.push(value);
                }
                break;
            case 'effect':
                if (!rat.effects.includes(value)) {
                    rat.effects.push(value);
                }
                break;
        }

        // Increase happiness and energy
        rat.happiness = Math.min(100, rat.happiness + 20);
        rat.energy = Math.min(100, rat.energy + 15);
        rat.lastFed = Date.now();
    }

    checkAchievements() {
        // First feeding
        if (!this.achievements['first-feed'] && this.gameState.score > 0) {
            this.unlockAchievement('first-feed');
        }

        // Other achievements...
        console.log('🏆 Checking achievements...');
    }

    unlockAchievement(achievementId) {
        this.achievements[achievementId] = true;

        const element = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (element) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        }

        this.gameState.score += 50;
        this.playSound('achievement');

        console.log('🏆 Achievement unlocked:', achievementId);
    }

    adjustPerformance(level) {
        this.performanceLevel = level;
        console.log('⚡ Performance adjusted to:', level);
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }

        console.log('⏸️ Game', this.isPaused ? 'paused' : 'resumed');
    }

    resetGame() {
        // Reset everything
        this.gameState.score = 0;
        this.gameState.level = 1;
        this.gameState.foodInventory = {
            red: 3, blue: 5, green: 2,
            bounce: 2, spin: 4, glow: 1,
            shadow: 3, blur: 2, scale: 4
        };

        this.createRats();
        this.updateUI();

        console.log('🔄 Game reset');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('toggle-sound');
        if (btn) {
            btn.textContent = this.soundEnabled ? '🔊 Sound' : '🔇 Muted';
        }
    }

    toggleAutoFeed() {
        this.autoFeedEnabled = !this.autoFeedEnabled;
        const btn = document.getElementById('auto-feed');
        if (btn) {
            btn.textContent = this.autoFeedEnabled ? '🤖 Auto: ON' : '🤖 Auto Feed';
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        // Simple Web Audio API beep
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = { feed: 440, click: 880, achievement: 660 };
            oscillator.frequency.value = frequencies[type] || 440;

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Sound failed, but that's ok
        }
    }

    updateUI() {
        // Update all UI elements
        const elements = {
            'game-score': this.gameState.score,
            'game-level': this.gameState.level,
            'rat-count': this.gameState.ratCount,
            'happiness': this.gameState.happiness + '%',
            'energy': this.gameState.energy + '%'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });

        // Update food inventory
        Object.keys(this.gameState.foodInventory).forEach(food => {
            const element = document.getElementById(`food-${food}`);
            if (element) {
                element.textContent = this.gameState.foodInventory[food];
            }
        });
    }

    showError(message) {
        const canvas = this.canvas || document.getElementById('game-canvas');
        if (canvas) {
            const container = canvas.parentElement;
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; text-align: center;">
                    <div>
                        <h3>🚨 Game Error</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()">🔄 Reload Page</button>
                    </div>
                </div>
            `;
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        console.log('🗑️ Game destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.gameRoom = new RCDGameController();
        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('🚨 Failed to initialize game:', error);
    }
});

console.log('🎮 CAT Game Controller loaded (Simplified version)');.happiness = Math.round(totalHappiness / this.rats.length);
this.gameState.energy = Math.round(totalEnergy / this.rats.length);

this.updateUI();
}

selectFood(foodElement) {
    // Clear previous selection
    document.querySelectorAll('.food-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Select new food
    foodElement.classList.add('selected');

    const foodType = foodElement.getAttribute('data-food');
    const foodValue = foodElement.getAttribute('data-value');
    this.selectedFood = { type: foodType, value: foodValue };

    document.getElementById('selected-food').textContent =
        `${foodValue} (${foodType})`;
    document.getElementById('feed-rats').disabled = false;

    console.log('🍽️ Selected food:', this.selectedFood);
}

feedRats() {
    if (!this.selectedFood) return;

    const { type, value } = this.selectedFood;
    const countId = `food-${value}`;
    const currentCount = parseInt(document.getElementById(countId).textContent);

    if (currentCount <= 0) {
        alert('Not enough of this food type!');
        return;
    }

    // Reduce inventory
    this.gameState.foodInventory[value]--;
    document.getElementById(countId).textContent = this.gameState.foodInventory[value];

    // Apply effect to random rats
    const numRatsToFeed = Math.min(3, this.rats.length);
    const ratsToFeed = Phaser.Utils.Array.Shuffle([...this.rats]).slice(0, numRatsToFeed);

    ratsToFeed.forEach(rat => {
        this.applyFoodEffect(rat, type, value);
    });

    // Update score
    this.gameState.score += 10;

    // Check achievements
    this.checkAchievements();

    this.updateUI();
    this.playSound('feed');

    console.log('🍽️ Fed rats with', value, type);
}

applyFoodEffect(rat, type, value) {
    switch (type) {
        case 'color':
            this.applyColorEffect(rat, value);
            break;
        case 'animation':
            this.applyAnimationEffect(rat, value);
            break;
        case 'effect':
            this.applyVisualEffect(rat, value);
            break;
    }

    // Increase rat happiness and energy
    rat.happiness = Math.min(100, rat.happiness + 20);
    rat.energy = Math.min(100, rat.energy + 15);
    rat.lastFed = Date.now();

    // Add effect to rat's effect list
    if (!rat.effects.includes(value)) {
        rat.effects.push(value);
    }
}

applyColorEffect(rat, color) {
    const colorMap = {
        red: 0xff6b6b,
        blue: 0x4ecdc4,
        green: 0x96ceb4
    };

    rat.setTint(colorMap[color] || 0xffffff);
}

applyAnimationEffect(rat, animation) {
    switch (animation) {
        case 'bounce':
            this.tweens.add({
                targets: rat,
                y: rat.y - 20,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            break;
        case 'spin':
            this.tweens.add({
                targets: rat,
                rotation: rat.rotation + Math.PI * 2,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
            break;
        case 'glow':
            this.tweens.add({
                targets: rat,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            break;
    }
}

applyVisualEffect(rat, effect) {
    switch (effect) {
        case 'scale':
            rat.setScale(1.2);
            break;
        case 'shadow':
            // Simple shadow effect (visual only)
            rat.setTint(0x888888);
            break;
        case 'blur':
            // Placeholder for blur effect
            rat.setAlpha(0.8);
            break;
    }
}

onRatClick(rat) {
    // Rat interaction - increase happiness
    rat.happiness = Math.min(100, rat.happiness + 5);

    // Visual feedback
    this.tweens.add({
        targets: rat,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut'
    });

    this.playSound('click');
    console.log('🐀 Rat clicked, happiness:', rat.happiness);
}

autoFeed() {
    // Automatically feed rats with available food
    const availableFood = Object.keys(this.gameState.foodInventory)
        .filter(food => this.gameState.foodInventory[food] > 0);

    if (availableFood.length > 0) {
        const randomFood = availableFood[Math.floor(Math.random() * availableFood.length)];

        // Simulate food selection and feeding
        const foodElement = document.querySelector(`[data-value="${randomFood}"]`);
        if (foodElement) {
            this.selectFood(foodElement);
            setTimeout(() => this.feedRats(), 500);
        }
    }
}

checkAchievements() {
    // First feeding
    if (!this.achievements['first-feed'] && this.gameState.score > 0) {
        this.unlockAchievement('first-feed');
    }

    // Colorful colony
    const usedColors = this.rats.filter(rat =>
        rat.effects.some(effect => ['red', 'blue', 'green'].includes(effect))
    );
    if (!this.achievements['colorful-colony'] && usedColors.length >= 3) {
        this.unlockAchievement('colorful-colony');
    }

    // Animation master
    const animatedRats = this.rats.filter(rat =>
        rat.effects.some(effect => ['bounce', 'spin', 'glow'].includes(effect))
    );
    if (!this.achievements['animation-master'] && animatedRats.length >= 5) {
        this.unlockAchievement('animation-master');
    }

    // Happy colony
    if (!this.achievements['happy-colony'] && this.gameState.happiness >= 100) {
        this.unlockAchievement('happy-colony');
    }
}

unlockAchievement(achievementId) {
    this.achievements[achievementId] = true;

    const element = document.querySelector(`[data-achievement="${achievementId}"]`);
    if (element) {
        element.classList.remove('locked');
        element.classList.add('unlocked');
    }

    this.gameState.score += 50;
    this.playSound('achievement');

    console.log('🏆 Achievement unlocked:', achievementId);
}

adjustPerformance(level) {
    this.performanceLevel = level;

    const body = document.body;
    body.classList.remove('performance-low', 'performance-medium', 'performance-high');
    body.classList.add(`performance-${level}`);

    // Adjust rat count based on performance
    const targetRatCount = {
        low: 3,
        medium: 5,
        high: 8
    }[level];

    if (this.rats.length !== targetRatCount) {
        this.adjustRatCount(targetRatCount);
    }

    console.log('⚡ Performance adjusted to:', level);
}

adjustRatCount(targetCount) {
    while (this.rats.length > targetCount) {
        const rat = this.rats.pop();
        rat.destroy();
    }

    while (this.rats.length < targetCount) {
        // Add new rat logic here if needed
        this.gameState.ratCount = this.rats.length;
    }

    this.updateUI();
}

togglePause() {
    this.isPaused = !this.isPaused;

    if (this.game && this.game.scene.scenes[0]) {
        if (this.isPaused) {
            this.game.scene.pause();
            document.getElementById('pause-game').textContent = '▶️ Resume';
        } else {
            this.game.scene.resume();
            document.getElementById('pause-game').textContent = '⏸️ Pause';
        }
    }
}

resetGame() {
    // Reset game state
    this.gameState = {
        score: 0,
        level: 1,
        ratCount: 5,
        happiness: 85,
        energy: 70,
        foodInventory: {
            red: 3, blue: 5, green: 2,
            bounce: 2, spin: 4, glow: 1,
            shadow: 3, blur: 2, scale: 4
        }
    };

    // Reset achievements
    Object.keys(this.achievements).forEach(key => {
        this.achievements[key] = false;
        const element = document.querySelector(`[data-achievement="${key}"]`);
        if (element) {
            element.classList.remove('unlocked');
            element.classList.add('locked');
        }
    });

    // Restart game
    if (this.game) {
        this.game.destroy(true);
        this.initializePhaser();
    }

    this.updateUI();
    console.log('🔄 Game reset');
}

toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('toggle-sound');
    btn.textContent = this.soundEnabled ? '🔊 Sound' : '🔇 Muted';
    btn.classList.toggle('active');
}

toggleAutoFeed() {
    this.autoFeedEnabled = !this.autoFeedEnabled;
    const btn = document.getElementById('auto-feed');
    btn.textContent = this.autoFeedEnabled ? '🤖 Auto: ON' : '🤖 Auto Feed';
    btn.classList.toggle('active');
}

playSound(type) {
    if (!this.soundEnabled || typeof Howl === 'undefined') return;

    // Simple beep sounds (placeholder)
    const frequencies = {
        feed: 440,
        click: 880,
        achievement: 660
    };

    // Web Audio API fallback for simple sounds
    if (window.AudioContext || window.webkitAudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequencies[type] || 440;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

updateUI() {
    // Update score and level
    document.getElementById('game-score').textContent = this.gameState.score;
    document.getElementById('game-level').textContent = this.gameState.level;

    // Update colony stats
    document.getElementById('rat-count').textContent = this.gameState.ratCount;
    document.getElementById('happiness').textContent = this.gameState.happiness + '%';
    document.getElementById('energy').textContent = this.gameState.energy + '%';

    // Update food inventory
    Object.keys(this.gameState.foodInventory).forEach(food => {
        const element = document.getElementById(`food-${food}`);
        if (element) {
            element.textContent = this.gameState.foodInventory[food];

            // Disable food items that are out of stock
            const foodItem = element.closest('.food-item');
            if (foodItem) {
                if (this.gameState.foodInventory[food] <= 0) {
                    foodItem.classList.add('disabled');
                } else {
                    foodItem.classList.remove('disabled');
                }
            }
        }
    });

    // Update level based on score
    const newLevel = Math.floor(this.gameState.score / 100) + 1;
    if (newLevel > this.gameState.level) {
        this.gameState.level = newLevel;
        this.playSound('achievement');
        console.log('📊 Level up!', this.gameState.level);
    }
}

// Cleanup method
destroy() {
    if (this.game) {
        this.game.destroy(true);
    }
    console.log('🗑️ RCD Game Controller destroyed');
}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameRoom = new RCDGameController();

    // Cleanup before leaving
    window.addEventListener('beforeunload', () => {
        if (window.gameRoom) {
            window.gameRoom.destroy();
        }
    });
});

// Easter eggs
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && window.gameRoom) {
        switch(e.key) {
            case 'P': // Pause
                window.gameRoom.togglePause();
                break;
            case 'R': // Reset
                window.gameRoom.resetGame();
                break;
            case 'F': // Auto feed
                window.gameRoom.toggleAutoFeed();
                break;
            case 'G': // Give food
                Object.keys(window.gameRoom.gameState.foodInventory).forEach(food => {
                    window.gameRoom.gameState.foodInventory[food] += 5;
                });
                window.gameRoom.updateUI();
                break;
        }
    }
});

console.log('🎮 CAT Game Controller loaded - Type Ctrl+Shift+P to pause, Ctrl+Shift+R to reset, Ctrl+Shift+G for free food!');