// ===== CAT GSAP CONTROLLER =====
// Morphing Room Animation Controller

// Check if GSAP is loaded
if (typeof gsap === 'undefined') {
    console.error('🚨 GSAP not loaded! Check the script path.');
    alert('GSAP library not found. Please check the file path to gsap.min.js');
} else {
    console.log('✅ GSAP loaded successfully');
}

class MorphingRoomController {
    constructor() {
        this.room = document.getElementById('morphing-room');
        this.currentTime = 'day';
        this.autoMode = false;
        this.autoInterval = null;
        this.masterTimeline = null;

        if (!this.room) {
            console.error('🚨 Room container not found!');
            return;
        }

        console.log('🏠 Room container found:', this.room);

        this.init();
    }

    init() {
        console.log('🔧 Initializing Morphing Room Controller...');

        this.setupEventListeners();
        this.createMasterTimeline();
        this.initializeRoom();

        console.log('🦀 Cat GSAP Controller initialized - Morphing Room ready!');
    }

    setupEventListeners() {
        console.log('🎮 Setting up event listeners...');

        // Time control buttons
        const timeButtons = document.querySelectorAll('.time-btn');
        console.log('⏰ Found time buttons:', timeButtons.length);

        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = e.target.getAttribute('data-time');
                console.log('🕐 Time button clicked:', time);
                this.changeTime(time);
            });
        });

        // Auto time toggle
        const autoToggle = document.getElementById('auto-time');
        if (autoToggle) {
            autoToggle.addEventListener('change', (e) => {
                console.log('🔄 Auto mode toggled:', e.target.checked);
                this.toggleAutoMode(e.target.checked);
            });
        } else {
            console.warn('⚠️ Auto toggle not found');
        }

        // Furniture interaction
        this.setupFurnitureInteraction();

        // Rat interaction
        this.setupRatInteraction();
    }

    createMasterTimeline() {
        // Create timeline for each time period
        this.timelines = {
            dawn: this.createDawnTimeline(),
            day: this.createDayTimeline(),
            sunset: this.createSunsetTimeline(),
            night: this.createNightTimeline()
        };
    }

    createDawnTimeline() {
        const tl = gsap.timeline({ paused: true });

        return tl
            .to('.room-container', {
                duration: 2,
                ease: "power2.inOut"
            })
            .to('.lamp-light', {
                duration: 1.5,
                scale: 0.7,
                opacity: 0.6,
                ease: "power2.inOut"
            }, 0)
            .to('.furniture', {
                duration: 2,
                y: -10,
                ease: "power2.inOut",
                stagger: 0.2
            }, 0.5)
            .to('.rat', {
                duration: 1,
                scale: 1.1,
                ease: "back.out(1.7)",
                stagger: 0.3
            }, 1);
    }

    createDayTimeline() {
        const tl = gsap.timeline({ paused: true });

        return tl
            .to('.room-container', {
                duration: 2,
                ease: "power2.inOut"
            })
            .to('.lamp-light', {
                duration: 1.5,
                scale: 0.5,
                opacity: 0.3,
                ease: "power2.inOut"
            }, 0)
            .to('.furniture', {
                duration: 2,
                y: 0,
                rotation: 0,
                ease: "power2.inOut",
                stagger: 0.1
            }, 0.3)
            .to('.rat', {
                duration: 1.5,
                scale: 1,
                ease: "elastic.out(1, 0.3)",
                stagger: 0.2
            }, 0.8);
    }

    createSunsetTimeline() {
        const tl = gsap.timeline({ paused: true });

        return tl
            .to('.room-container', {
                duration: 2.5,
                ease: "power2.inOut"
            })
            .to('.lamp-light', {
                duration: 2,
                scale: 1.2,
                opacity: 0.8,
                ease: "power2.inOut"
            }, 0)
            .to('.furniture', {
                duration: 2,
                y: 5,
                rotation: 2,
                ease: "power2.inOut",
                stagger: 0.15
            }, 0.5)
            .to('.rat', {
                duration: 1.2,
                scale: 0.9,
                rotation: 10,
                ease: "power2.inOut",
                stagger: 0.25
            }, 1)
            .to('.wall', {
                duration: 2,
                boxShadow: "inset 0 0 50px rgba(255,100,0,0.3)",
                ease: "power2.inOut"
            }, 0);
    }

    createNightTimeline() {
        const tl = gsap.timeline({ paused: true });

        return tl
            .to('.room-container', {
                duration: 3,
                ease: "power2.inOut"
            })
            .to('.lamp-light', {
                duration: 2.5,
                scale: 1.5,
                opacity: 1,
                ease: "power2.inOut"
            }, 0)
            .to('.furniture', {
                duration: 2.5,
                y: 15,
                rotation: -3,
                ease: "power2.inOut",
                stagger: 0.2
            }, 0.5)
            .to('.rat', {
                duration: 2,
                scale: 1.3,
                rotation: -5,
                ease: "power2.inOut",
                stagger: 0.3
            }, 1)
            .to('.wall', {
                duration: 3,
                boxShadow: "inset 0 0 100px rgba(0,0,100,0.4)",
                ease: "power2.inOut"
            }, 0)
            .to('.rat-body', {
                duration: 1,
                boxShadow: "0 0 15px rgba(255,255,255,0.6)",
                ease: "power2.inOut",
                stagger: 0.4
            }, 2);
    }

    changeTime(time) {
        if (this.currentTime === time) return;

        // Update UI
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-time="${time}"]`).classList.add('active');

        // Apply CSS class for instant color changes
        this.room.className = 'room-container ' + time;

        // Run GSAP animation
        this.timelines[this.currentTime]?.reverse();
        this.timelines[time]?.play();

        this.currentTime = time;

        console.log(`🌅 Time changed to: ${time}`);
    }

    toggleAutoMode(enabled) {
        this.autoMode = enabled;

        if (enabled) {
            this.startAutoMode();
        } else {
            this.stopAutoMode();
        }
    }

    startAutoMode() {
        const timeSequence = ['dawn', 'day', 'sunset', 'night'];
        let currentIndex = timeSequence.indexOf(this.currentTime);

        this.autoInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % timeSequence.length;
            this.changeTime(timeSequence[currentIndex]);
        }, 8000); // Change every 8 seconds

        console.log('⏰ Auto time mode started');
    }

    stopAutoMode() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
        console.log('⏰ Auto time mode stopped');
    }

    setupFurnitureInteraction() {
        document.querySelectorAll('.furniture').forEach(furniture => {
            furniture.addEventListener('mouseenter', () => {
                gsap.to(furniture, {
                    duration: 0.3,
                    scale: 1.05,
                    rotationY: 5,
                    ease: "back.out(1.7)"
                });
            });

            furniture.addEventListener('mouseleave', () => {
                gsap.to(furniture, {
                    duration: 0.3,
                    scale: 1,
                    rotationY: 0,
                    ease: "power2.out"
                });
            });

            furniture.addEventListener('click', () => {
                this.animateFurnitureClick(furniture);
            });
        });
    }

    setupRatInteraction() {
        document.querySelectorAll('.rat').forEach((rat, index) => {
            rat.style.pointerEvents = 'auto';

            rat.addEventListener('click', () => {
                this.animateRatClick(rat, index);
            });

            // Make rats occasionally look at cursor
            document.addEventListener('mousemove', (e) => {
                if (Math.random() < 0.01) { // 1% chance per mouse move
                    this.ratLookAtCursor(rat, e.clientX, e.clientY);
                }
            });
        });
    }

    animateFurnitureClick(furniture) {
        const id = furniture.id;

        // Different animations for different furniture
        switch(id) {
            case 'sofa':
                gsap.timeline()
                    .to(furniture, {
                        duration: 0.1,
                        y: 10,
                        ease: "power2.out"
                    })
                    .to(furniture, {
                        duration: 0.5,
                        y: 0,
                        ease: "bounce.out"
                    });
                break;

            case 'table':
                gsap.to(furniture, {
                    duration: 0.6,
                    rotation: 360,
                    ease: "back.out(1.7)"
                });
                break;

            case 'lamp':
                gsap.timeline()
                    .to('.lamp-light', {
                        duration: 0.1,
                        opacity: 0
                    })
                    .to('.lamp-light', {
                        duration: 0.3,
                        opacity: 1,
                        scale: 1.3,
                        ease: "power2.out"
                    })
                    .to('.lamp-light', {
                        duration: 0.5,
                        scale: 1,
                        ease: "elastic.out(1, 0.3)"
                    });
                break;

            case 'bookshelf':
                gsap.to(furniture, {
                    duration: 0.8,
                    rotationY: 15,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
                break;
        }

        console.log(`🪑 ${id} clicked and animated!`);
    }

    animateRatClick(rat, index) {
        // Rat gets excited and does a little dance
        gsap.timeline()
            .to(rat, {
                duration: 0.2,
                scale: 1.4,
                rotation: 45,
                ease: "back.out(1.7)"
            })
            .to(rat, {
                duration: 0.3,
                scale: 1,
                rotation: 0,
                ease: "elastic.out(1, 0.3)"
            })
            .to(rat, {
                duration: 0.5,
                y: -20,
                ease: "power2.out"
            }, 0.5)
            .to(rat, {
                duration: 0.5,
                y: 0,
                ease: "bounce.out"
            });

        // Add sparkle effect
        this.createSparkleEffect(rat);

        console.log(`🐀 Rat ${index + 1} is happy!`);
    }

    ratLookAtCursor(rat, mouseX, mouseY) {
        const ratRect = rat.getBoundingClientRect();
        const ratX = ratRect.left + ratRect.width / 2;
        const ratY = ratRect.top + ratRect.height / 2;

        const angle = Math.atan2(mouseY - ratY, mouseX - ratX) * 180 / Math.PI;

        gsap.to(rat, {
            duration: 0.5,
            rotation: angle * 0.1, // Subtle rotation toward cursor
            ease: "power2.out"
        });
    }

    createSparkleEffect(element) {
        const rect = element.getBoundingClientRect();
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
        container.style.width = rect.width + 'px';
        container.style.height = rect.height + 'px';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';

        document.body.appendChild(container);

        // Create sparkles
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'absolute';
            sparkle.style.width = '4px';
            sparkle.style.height = '4px';
            sparkle.style.background = '#ffd700';
            sparkle.style.borderRadius = '50%';
            sparkle.style.left = Math.random() * rect.width + 'px';
            sparkle.style.top = Math.random() * rect.height + 'px';

            container.appendChild(sparkle);

            gsap.fromTo(sparkle,
                {
                    scale: 0,
                    opacity: 1
                },
                {
                    duration: 0.8,
                    scale: 1.5,
                    opacity: 0,
                    x: (Math.random() - 0.5) * 50,
                    y: (Math.random() - 0.5) * 50,
                    ease: "power2.out"
                }
            );
        }

        // Clean up after animation
        setTimeout(() => {
            document.body.removeChild(container);
        }, 1000);
    }

    initializeRoom() {
        // Set initial state
        this.changeTime('day');

        // Add subtle breathing animation to the room
        gsap.to('.room-container', {
            duration: 4,
            scale: 1.005,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut"
        });

        // Add floating animation to furniture
        gsap.to('.furniture', {
            duration: 3,
            y: "+=5",
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut",
            stagger: 0.5
        });

        // Add ambient light pulse
        gsap.to('.ambient-light', {
            duration: 5,
            opacity: 0.7,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut"
        });

        console.log('🏠 Room initialized with ambient animations');
    }

    // Special effects methods
    createLightningEffect() {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.background = 'rgba(255,255,255,0.9)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '10000';

        document.body.appendChild(flash);

        gsap.fromTo(flash,
            { opacity: 0 },
            {
                duration: 0.1,
                opacity: 1,
                yoyo: true,
                repeat: 3,
                ease: "power2.inOut",
                onComplete: () => {
                    document.body.removeChild(flash);
                }
            }
        );
    }

    createRainEffect() {
        const rainContainer = document.createElement('div');
        rainContainer.className = 'rain-container';
        rainContainer.style.position = 'fixed';
        rainContainer.style.top = '0';
        rainContainer.style.left = '0';
        rainContainer.style.width = '100vw';
        rainContainer.style.height = '100vh';
        rainContainer.style.pointerEvents = 'none';
        rainContainer.style.zIndex = '5000';

        document.body.appendChild(rainContainer);

        // Create raindrops
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.style.position = 'absolute';
            drop.style.width = '2px';
            drop.style.height = '20px';
            drop.style.background = 'rgba(173,216,230,0.6)';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.top = '-20px';

            rainContainer.appendChild(drop);

            gsap.to(drop, {
                duration: Math.random() * 2 + 1,
                y: window.innerHeight + 20,
                ease: "power1.in",
                delay: Math.random() * 2,
                repeat: -1
            });
        }

        // Remove rain after 10 seconds
        setTimeout(() => {
            gsap.to(rainContainer, {
                duration: 1,
                opacity: 0,
                onComplete: () => {
                    document.body.removeChild(rainContainer);
                }
            });
        }, 10000);
    }

    // Weather effects trigger (can be called externally)
    triggerWeatherEffect(type) {
        switch(type) {
            case 'lightning':
                this.createLightningEffect();
                break;
            case 'rain':
                this.createRainEffect();
                break;
            default:
                console.log('⚡ Unknown weather effect:', type);
        }
    }

    // Room state management
    saveRoomState() {
        const state = {
            currentTime: this.currentTime,
            autoMode: this.autoMode
        };
        localStorage.setItem('morphing-room-state', JSON.stringify(state));
        console.log('💾 Room state saved');
    }

    loadRoomState() {
        const saved = localStorage.getItem('morphing-room-state');
        if (saved) {
            const state = JSON.parse(saved);
            this.changeTime(state.currentTime);
            if (state.autoMode) {
                document.getElementById('auto-time').checked = true;
                this.toggleAutoMode(true);
            }
            console.log('📂 Room state loaded');
        }
    }

    // Cleanup method
    destroy() {
        this.stopAutoMode();
        gsap.killTweensOf('*');
        console.log('🗑️ Morphing Room Controller destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.morphingRoom = new MorphingRoomController();

    // Save state before leaving
    window.addEventListener('beforeunload', () => {
        window.morphingRoom.saveRoomState();
    });

    // Load saved state
    window.morphingRoom.loadRoomState();
});

// Easter eggs and special commands
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
            case 'L': // Lightning
                window.morphingRoom.triggerWeatherEffect('lightning');
                break;
            case 'R': // Rain
                window.morphingRoom.triggerWeatherEffect('rain');
                break;
            case 'D': // Dance party for rats
                document.querySelectorAll('.rat').forEach((rat, index) => {
                    setTimeout(() => {
                        window.morphingRoom.animateRatClick(rat, index);
                    }, index * 200);
                });
                break;
        }
    }
});

console.log('🦀 CAT GSAP Controller loaded - Type Ctrl+Shift+L for lightning, Ctrl+Shift+R for rain, Ctrl+Shift+D for rat dance party!');