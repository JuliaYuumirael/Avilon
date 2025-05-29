// ===== CAT CANVAS CONTROLLER =====
// Interactive Magic Room Controller

// Check if p5.js is loaded
if (typeof p5 === 'undefined') {
    console.error('🚨 p5.js not loaded! Check the script path.');
    alert('p5.js library not found. Please check the file path to p5.min.js');
} else {
    console.log('✅ p5.js loaded successfully');
}

class InteractiveMagicController {
    constructor() {
        this.canvas = null;
        this.rippleCanvas = null;
        this.currentBrush = 'pencil';
        this.currentColor = '#4a4a4a';
        this.brushSize = 15;
        this.isDrawing = false;
        this.lastMousePos = { x: 0, y: 0 };

        // Drawing settings
        this.settings = {
            glow: true,
            particleTrail: false,
            autoAnimate: true
        };

        // Creature storage
        this.creatures = [];
        this.activeAnimations = [];

        this.init();
    }

    init() {
        console.log('🎨 Initializing Interactive Magic Controller...');

        this.setupCanvas();
        this.setupEventListeners();
        this.setupTools();
        this.startMagicEffects();

        console.log('🪄 Interactive Magic Room ready!');
    }

    setupCanvas() {
        const container = document.querySelector('.canvas-container');

        // Main drawing canvas
        this.canvas = document.getElementById('main-canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');

        // Ripple effects canvas
        this.rippleCanvas = document.getElementById('ripple-canvas');
        this.rippleCanvas.width = window.innerWidth;
        this.rippleCanvas.height = window.innerHeight;
        this.rippleCtx = this.rippleCanvas.getContext('2d');

        console.log('🖼️ Canvas initialized:', this.canvas.width + 'x' + this.canvas.height);
    }

    setupEventListeners() {
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Mouse movement for ripples
        this.canvas.addEventListener('mousemove', (e) => this.createRipple(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
        this.canvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupTools() {
        // Brush selection
        document.querySelectorAll('.brush-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentBrush = btn.getAttribute('data-brush');
                this.updateCursor();
                console.log('🖌️ Brush changed to:', this.currentBrush);
            });
        });

        // Color selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = swatch.getAttribute('data-color');
                console.log('🎨 Color changed to:', this.currentColor);
            });
        });

        // Brush size
        const sizeSlider = document.getElementById('brush-size');
        const sizeDisplay = document.getElementById('size-display');
        sizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            sizeDisplay.textContent = this.brushSize + 'px';
        });

        // Effect toggles
        document.getElementById('glow-effect').addEventListener('change', (e) => {
            this.settings.glow = e.target.checked;
        });

        document.getElementById('particle-trail').addEventListener('change', (e) => {
            this.settings.particleTrail = e.target.checked;
        });

        document.getElementById('auto-animate').addEventListener('change', (e) => {
            this.settings.autoAnimate = e.target.checked;
        });

        // Action buttons
        document.getElementById('clear-canvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('save-creation').addEventListener('click', () => this.saveCreation());
        document.getElementById('animate-all').addEventListener('click', () => this.animateAllCreatures());
    }

    updateCursor() {
        const room = document.getElementById('interactive-room');
        room.className = 'room-container';

        switch(this.currentBrush) {
            case 'magic':
                room.classList.add('magic-mode');
                break;
            case 'tail':
                this.canvas.style.cursor = 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z\' fill=\'%234a4a4a\'/></svg>") 12 12, crosshair';
                break;
            default:
                this.canvas.style.cursor = 'crosshair';
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastMousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Create magic particle at start
        this.createMagicParticle(this.lastMousePos.x, this.lastMousePos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.drawLine(this.lastMousePos, currentPos);
        this.lastMousePos = currentPos;

        // Create particle trail if enabled
        if (this.settings.particleTrail) {
            this.createMagicParticle(currentPos.x, currentPos.y);
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;

            // Auto-animate if enabled
            if (this.settings.autoAnimate) {
                setTimeout(() => this.animateLastStroke(), 500);
            }
        }
    }

    drawLine(from, to) {
        this.ctx.save();

        // Set brush properties based on type
        this.setBrushStyle();

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();

        // Add special effects based on brush type
        this.addBrushEffects(to);

        this.ctx.restore();
    }

    setBrushStyle() {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Add glow effect if enabled
        if (this.settings.glow) {
            this.ctx.shadowColor = this.currentColor;
            this.ctx.shadowBlur = this.brushSize * 0.5;
        }

        // Brush-specific styles
        switch(this.currentBrush) {
            case 'magic':
                this.ctx.globalCompositeOperation = 'screen';
                this.ctx.shadowBlur = this.brushSize * 1.5;
                break;
            case 'sparkle':
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.shadowBlur = this.brushSize * 2;
                break;
            case 'tail':
                this.ctx.lineWidth = this.brushSize * 0.7;
                this.ctx.globalAlpha = 0.8;
                break;
            default:
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.globalAlpha = 1;
        }
    }

    addBrushEffects(pos) {
        switch(this.currentBrush) {
            case 'magic':
                this.createSparkleEffect(pos.x, pos.y);
                break;
            case 'sparkle':
                this.createMultipleSparkles(pos.x, pos.y);
                break;
            case 'tail':
                this.createTailParticles(pos.x, pos.y);
                break;
        }
    }

    createSparkleEffect(x, y) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'particle';
                sparkle.style.left = (x + (Math.random() - 0.5) * 20) + 'px';
                sparkle.style.top = (y + (Math.random() - 0.5) * 20) + 'px';
                sparkle.style.background = this.currentColor;

                document.getElementById('particles').appendChild(sparkle);

                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    createMultipleSparkles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.createSparkleEffect(
                x + (Math.random() - 0.5) * this.brushSize * 2,
                y + (Math.random() - 0.5) * this.brushSize * 2
            );
        }
    }

    createTailParticles(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = '#666';
        particle.style.width = '2px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';

        document.getElementById('particles').appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 2000);
    }

    createRipple(e) {
        // Only create ripples occasionally to avoid performance issues
        if (Math.random() < 0.05) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.left = (x - 5) + 'px';
            ripple.style.top = (y - 5) + 'px';

            document.getElementById('ripple-container').appendChild(ripple);

            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 800);
        }
    }

    createMagicParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = this.currentColor;

        document.getElementById('particles').appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }

    animateLastStroke() {
        // Create a glowing animation effect for the last drawn stroke
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Simple animation: make the last stroke pulse
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.globalAlpha = 0.3;
            this.ctx.putImageData(imageData, 0, 0);
            this.ctx.restore();

            pulseCount++;
            if (pulseCount > 3) {
                clearInterval(pulseInterval);
            }
        }, 200);

        console.log('✨ Animating last stroke');
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.rippleCtx.clearRect(0, 0, this.rippleCanvas.width, this.rippleCanvas.height);

        // Clear particles
        document.getElementById('particles').innerHTML = '';
        document.getElementById('ripple-container').innerHTML = '';

        this.creatures = [];
        console.log('🗑️ Canvas cleared');
    }

    saveCreation() {
        const imageData = this.canvas.toDataURL('image/png');
        const creatureName = `Creature_${Date.now()}`;

        const creature = {
            name: creatureName,
            imageData: imageData,
            timestamp: new Date(),
            brushUsed: this.currentBrush,
            colorUsed: this.currentColor
        };

        this.creatures.push(creature);
        this.addToGallery(creature);

        console.log('💾 Creation saved:', creatureName);
    }

    addToGallery(creature) {
        const gallery = document.getElementById('creature-gallery');
        const template = gallery.querySelector('.template-item');
        const item = template.cloneNode(true);

        item.classList.remove('template-item');
        item.querySelector('.creature-name').textContent = creature.name;

        // Create preview image
        const preview = item.querySelector('.creature-preview');
        const img = document.createElement('img');
        img.src = creature.imageData;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        preview.appendChild(img);

        // Setup buttons
        item.querySelector('.spawn-btn').addEventListener('click', () => {
            this.spawnCreature(creature);
        });

        item.querySelector('.clone-btn').addEventListener('click', () => {
            this.cloneCreature(creature);
        });

        gallery.appendChild(item);
    }

    spawnCreature(creature) {
        // Display the creature with animation
        const img = new Image();
        img.onload = () => {
            this.ctx.save();
            this.ctx.globalAlpha = 0;

            // Fade in animation
            let alpha = 0;
            const fadeIn = setInterval(() => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = alpha;
                this.ctx.drawImage(img, 0, 0);

                alpha += 0.1;
                if (alpha >= 1) {
                    clearInterval(fadeIn);
                    this.ctx.restore();
                }
            }, 50);
        };
        img.src = creature.imageData;

        console.log('👁️ Spawning creature:', creature.name);
    }

    cloneCreature(creature) {
        // Create a copy of the creature with slight variations
        const newCreature = {
            ...creature,
            name: `${creature.name}_Clone_${Date.now()}`,
            timestamp: new Date()
        };

        this.creatures.push(newCreature);
        this.addToGallery(newCreature);

        console.log('📋 Creature cloned:', newCreature.name);
    }

    animateAllCreatures() {
        // Create a magical animation showing all creatures
        this.creatures.forEach((creature, index) => {
            setTimeout(() => {
                this.spawnCreature(creature);

                // Add sparkle effects around the creature
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        this.createSparkleEffect(
                            Math.random() * this.canvas.width,
                            Math.random() * this.canvas.height
                        );
                    }, i * 100);
                }
            }, index * 1000);
        });

        console.log('🎬 Animating all creatures');
    }

    startMagicEffects() {
        // Ambient magical particles
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.createMagicParticle(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height
                );
            }
        }, 2000);

        console.log('🌟 Magic effects started');
    }

    handleTouch(e, type) {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        const mouseEvent = new MouseEvent(
            type === 'start' ? 'mousedown' : type === 'move' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );

        this.canvas.dispatchEvent(mouseEvent);
    }

    resizeCanvas() {
        // Save current drawing
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Resize canvases
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.rippleCanvas.width = window.innerWidth;
        this.rippleCanvas.height = window.innerHeight;

        // Restore drawing
        this.ctx.putImageData(imageData, 0, 0);

        console.log('📐 Canvas resized to:', this.canvas.width + 'x' + this.canvas.height);
    }

    // Cleanup method
    destroy() {
        // Clear intervals and remove event listeners
        this.clearCanvas();
        console.log('🗑️ Interactive Magic Controller destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.magicRoom = new InteractiveMagicController();

    // Cleanup before leaving
    window.addEventListener('beforeunload', () => {
        if (window.magicRoom) {
            window.magicRoom.destroy();
        }
    });
});

// Easter eggs and special commands
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && window.magicRoom) {
        switch(e.key) {
            case 'C': // Clear canvas
                window.magicRoom.clearCanvas();
                break;
            case 'S': // Save creation
                window.magicRoom.saveCreation();
                break;
            case 'A': // Animate all
                window.magicRoom.animateAllCreatures();
                break;
            case 'M': // Magic mode
                document.querySelector('[data-brush="magic"]').click();
                break;
        }
    }
});

console.log('🎨 CAT Canvas Controller loaded - Type Ctrl+Shift+C to clear, Ctrl+Shift+S to save, Ctrl+Shift+A to animate all!');