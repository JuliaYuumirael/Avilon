// 🐱 Cat Three Controller - Управляющий 3D сценой
// Отвечает за создание и управление Three.js сценой

class ThreeController {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.rats = [];
        this.config = null;
        this.isInitialized = false;
        this.isPaused = false;
        this.animationId = null;

        // Performance monitoring
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.fpsHistory = [];

        console.log('🐱 Three Controller готов к работе!');
    }

    // Инициализация 3D сцены
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Загружаем конфигурацию
            await this.loadConfig();

            // Создаем основные компоненты
            this.createScene();
            this.createCamera();
            this.createRenderer();
            this.createLights();
            this.createEnvironment();

            // Создаем крыс
            await this.createRats();

            // Запускаем рендер
            this.startRenderLoop();

            // Настраиваем контролы
            this.setupControls();

            this.isInitialized = true;
            this.hideLoadingOverlay();

            console.log('🎬 Three.js сцена инициализирована!');

        } catch (error) {
            console.error('💥 Ошибка инициализации Three.js:', error);
            this.showError(error.message);
            throw error;
        }
    }

    // Загрузка конфигурации
    async loadConfig() {
        try {
            const response = await fetch('meow_room_1_config.json');
            this.config = await response.json();
            console.log('📋 Конфигурация загружена');
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить конфиг, используем стандартный');
            this.config = this.getDefaultConfig();
        }
    }

    // Создание сцены
    createScene() {
        this.scene = new THREE.Scene();
        const bgColor = this.config.scene.backgroundColor || '#1a1a2e';
        this.scene.background = new THREE.Color(bgColor);
        this.scene.fog = new THREE.Fog(bgColor, 5, 15);

        console.log('🌍 Сцена создана');
    }

    // Создание камеры
    createCamera() {
        const canvas = document.getElementById('three-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        const camPos = this.config.scene.cameraPosition;
        this.camera.position.set(camPos.x, camPos.y, camPos.z);
        this.camera.lookAt(0, 0, 0);

        console.log('📷 Камера настроена');
    }

    // Создание рендерера
    createRenderer() {
        const canvas = document.getElementById('three-canvas');

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !this.isMobileDevice(), // Отключаем антиалиасинг на мобилках
            powerPreference: "default" // Экономим энергию
        });

        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничиваем pixel ratio

        // Отключаем тени для производительности
        this.renderer.shadowMap.enabled = this.config.performance.enableShadows;
        if (this.renderer.shadowMap.enabled) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        console.log('🖥️ Рендерер создан');
    }

    // Создание освещения
    createLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            0xffffff,
            this.config.scene.ambientLightIntensity
        );
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(
            0xffffff,
            this.config.scene.directionalLightIntensity
        );
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = this.config.performance.enableShadows;

        if (directionalLight.castShadow) {
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
        }

        this.scene.add(directionalLight);

        // Сохраняем ссылки для управления
        this.ambientLight = ambientLight;
        this.directionalLight = directionalLight;

        console.log('💡 Освещение настроено');
    }

    // Создание окружения (пол, стены)
    createEnvironment() {
        const floorSize = this.config.scene.floorSize;
        const wallHeight = this.config.scene.wallHeight;

        // Пол
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = this.config.performance.enableShadows;
        this.scene.add(floor);

        // Невидимые стены для физики (создадим позже в физическом контроллере)
        this.floorSize = floorSize;
        this.wallHeight = wallHeight;

        console.log('🏗️ Окружение создано');
    }

    // Создание крыс
    async createRats() {
        const ratCount = this.config.rats.defaultCount;
        const ratSize = this.config.rats.size;
        const colors = this.config.rats.colors;

        this.rats = [];

        for (let i = 0; i < ratCount; i++) {
            const rat = this.createSingleRat(i, ratSize, colors);
            this.rats.push(rat);
            this.scene.add(rat.mesh);
        }

        console.log(`🐭 Создано ${ratCount} крыс`);
    }

    // Создание одной крысы
    createSingleRat(id, size, colors) {
        // Простая геометрия - куб с небольшими модификациями
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);

        // Материал с случайным цветом
        const color = colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Случайная начальная позиция
        const maxPos = this.floorSize / 2 - 1;
        mesh.position.set(
            (Math.random() - 0.5) * maxPos,
            size.height / 2,
            (Math.random() - 0.5) * maxPos
        );

        mesh.castShadow = this.config.performance.enableShadows;

        // Создаем объект крысы с дополнительными свойствами
        const rat = {
            id: id,
            mesh: mesh,
            velocity: new THREE.Vector3(),
            targetPosition: new THREE.Vector3(),
            fear: 0, // Уровень страха
            curiosity: Math.random() * this.config.rats.behavior.curiosity,
            speed: this.config.rats.speed.min + Math.random() *
                (this.config.rats.speed.max - this.config.rats.speed.min),
            originalColor: color,
            isAlive: true
        };

        return rat;
    }

    // Запуск цикла рендеринга
    startRenderLoop() {
        const animate = (currentTime) => {
            if (this.isPaused) {
                this.animationId = requestAnimationFrame(animate);
                return;
            }

            // Подсчет FPS
            this.updateFPS(currentTime);

            // Проверка производительности
            if (this.config.performance.autoQualityAdjust) {
                this.checkPerformance();
            }

            // Обновление крыс (логика движения будет в физическом контроллере)
            this.updateRats();

            // Рендер
            this.renderer.render(this.scene, this.camera);

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
        console.log('🎬 Цикл рендеринга запущен');
    }

    // Обновление крыс
    updateRats() {
        this.rats.forEach(rat => {
            if (!rat.isAlive) return;

            // Простая анимация покачивания
            rat.mesh.rotation.y += 0.01;

            // Легкое покачивание вверх-вниз
            const time = Date.now() * 0.001;
            rat.mesh.position.y = rat.mesh.geometry.parameters.height / 2 +
                Math.sin(time * 2 + rat.id) * 0.05;
        });
    }

    // Подсчет FPS
    updateFPS(currentTime) {
        this.frameCount++;

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.fpsHistory.push(this.fps);

            // Оставляем только последние 10 значений
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }

            // Обновляем UI
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = this.fps;

                // Цвет в зависимости от FPS
                if (this.fps >= 50) {
                    fpsElement.style.color = '#51cf66';
                } else if (this.fps >= 30) {
                    fpsElement.style.color = '#ffd43b';
                } else {
                    fpsElement.style.color = '#ff6b6b';
                }
            }

            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    // Проверка производительности
    checkPerformance() {
        if (this.fpsHistory.length < 5) return;

        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        const warningElement = document.getElementById('performance-warning');

        if (avgFPS < 30) {
            if (warningElement) {
                warningElement.style.display = 'block';
            }

            // Автоматическое снижение качества
            this.optimizePerformance();
        } else {
            if (warningElement) {
                warningElement.style.display = 'none';
            }
        }
    }

    // Оптимизация производительности
    optimizePerformance() {
        console.log('⚡ Оптимизируем производительность...');

        // Уменьшаем количество крыс
        if (this.rats.length > 2) {
            const ratToRemove = this.rats.pop();
            this.scene.remove(ratToRemove.mesh);
            this.updateRatCount();
        }

        // Снижаем pixel ratio
        this.renderer.setPixelRatio(1);
    }

    // Настройка контролов
    setupControls() {
        // Контрол количества крыс
        const ratCountSlider = document.getElementById('rat-count');
        const ratCountValue = document.getElementById('rat-count-value');

        if (ratCountSlider && ratCountValue) {
            ratCountSlider.value = this.rats.length;
            ratCountValue.textContent = this.rats.length;

            ratCountSlider.addEventListener('input', (e) => {
                const newCount = parseInt(e.target.value);
                this.setRatCount(newCount);
                ratCountValue.textContent = newCount;
            });
        }

        // Контрол скорости
        const speedSlider = document.getElementById('rat-speed');
        const speedValue = document.getElementById('rat-speed-value');

        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const newSpeed = parseFloat(e.target.value);
                this.setRatSpeed(newSpeed);
                speedValue.textContent = newSpeed.toFixed(1);
            });
        }

        // Контрол цвета фона
        const bgColorPicker = document.getElementById('background-color');
        if (bgColorPicker) {
            bgColorPicker.addEventListener('input', (e) => {
                this.setBackgroundColor(e.target.value);
            });
        }

        // Контрол освещения
        const lightSlider = document.getElementById('light-intensity');
        const lightValue = document.getElementById('light-value');

        if (lightSlider && lightValue) {
            lightSlider.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                this.setLightIntensity(intensity);
                lightValue.textContent = intensity.toFixed(1);
            });
        }

        // Кнопки управления
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.togglePause());
        }

        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.reset());
        }

        const emergencyButton = document.getElementById('emergency-stop');
        if (emergencyButton) {
            emergencyButton.addEventListener('click', () => this.emergencyStop());
        }

        // Обработка изменения размера окна
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('🎮 Контролы настроены');
    }

    // Методы управления
    setRatCount(count) {
        const currentCount = this.rats.length;

        if (count > currentCount) {
            // Добавляем крыс
            for (let i = currentCount; i < count; i++) {
                const rat = this.createSingleRat(i, this.config.rats.size, this.config.rats.colors);
                this.rats.push(rat);
                this.scene.add(rat.mesh);
            }
        } else if (count < currentCount) {
            // Удаляем крыс
            for (let i = currentCount; i > count; i--) {
                const rat = this.rats.pop();
                this.scene.remove(rat.mesh);
            }
        }

        this.updateRatCount();
    }

    setRatSpeed(speed) {
        this.rats.forEach(rat => {
            rat.speed = speed;
        });
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
        this.scene.fog.color = new THREE.Color(color);
    }

    setLightIntensity(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = intensity;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const button = document.getElementById('pause-button');
        if (button) {
            button.textContent = this.isPaused ? '▶️ Играть' : '⏸️ Пауза';
        }
    }

    reset() {
        // Сброс позиций крыс
        this.rats.forEach(rat => {
            const maxPos = this.floorSize / 2 - 1;
            rat.mesh.position.set(
                (Math.random() - 0.5) * maxPos,
                rat.mesh.geometry.parameters.height / 2,
                (Math.random() - 0.5) * maxPos
            );
            rat.velocity.set(0, 0, 0);
            rat.fear = 0;
        });
    }

    emergencyStop() {
        console.log('🚨 АВАРИЙНАЯ ОСТАНОВКА!');
        this.isPaused = true;

        // Останавливаем анимацию
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Показываем сообщение
        alert('🚨 Анимация остановлена для сохранения производительности!');
    }

    updateRatCount() {
        const element = document.getElementById('active-rats');
        if (element) {
            element.textContent = this.rats.length;
        }
    }

    onWindowResize() {
        const canvas = document.getElementById('three-canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Утилиты
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        const overlay = document.getElementById('error-overlay');
        const messageElement = document.querySelector('.error-message');

        if (overlay && messageElement) {
            messageElement.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    getDefaultConfig() {
        return {
            performance: {
                maxRats: 5,
                enableShadows: false,
                autoQualityAdjust: true
            },
            rats: {
                defaultCount: 3,
                size: { width: 0.3, height: 0.3, depth: 0.3 },
                colors: ['#8B4513', '#A0522D', '#CD853F'],
                speed: { min: 0.5, max: 2.0 },
                behavior: { curiosity: 0.3, fearRadius: 2.0 }
            },
            scene: {
                backgroundColor: '#1a1a2e',
                ambientLightIntensity: 0.4,
                directionalLightIntensity: 0.8,
                cameraPosition: { x: 0, y: 5, z: 10 },
                floorSize: 10,
                wallHeight: 3
            }
        };
    }

    // Публичные методы для других контроллеров
    getRats() {
        return this.rats;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }
}

// Создаем глобальный экземпляр
window.ThreeController = new ThreeController();