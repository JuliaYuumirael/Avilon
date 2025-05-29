// 🐱 Cat Interaction Controller - Управляющий взаимодействием с пользователем
// Отвечает за обработку мыши, касаний и клавиатуры

class InteractionController {
    constructor() {
        this.canvas = null;
        this.camera = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isInitialized = false;
        this.config = null;

        // Состояние взаимодействия
        this.isMouseDown = false;
        this.isDragging = false;
        this.lastMousePosition = { x: 0, y: 0 };
        this.mouseWorldPosition = new THREE.Vector3();

        // Touch support
        this.isTouchDevice = this.detectTouchDevice();
        this.touches = new Map();

        // Throttling для производительности
        this.lastInteractionTime = 0;
        this.interactionThrottle = 16; // ~60fps

        console.log('🐱 Interaction Controller готов к работе!');
    }

    // Инициализация контроллера взаимодействия
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Ждем инициализации других контроллеров
            while (!window.ThreeController?.isInitialized || !window.PhysicsController?.isInitialized) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.config = window.ThreeController.config;
            this.canvas = document.getElementById('three-canvas');
            this.camera = window.ThreeController.getCamera();

            this.setupEventListeners();
            this.setupKeyboardControls();

            this.isInitialized = true;
            console.log('🖱️ Система взаимодействия инициализирована!');

        } catch (error) {
            console.error('💥 Ошибка инициализации взаимодействия:', error);
            throw error;
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
        this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));

        // Touch events для мобильных устройств
        if (this.isTouchDevice) {
            this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
            this.canvas.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Window events
        window.addEventListener('blur', () => this.onWindowBlur());
        window.addEventListener('focus', () => this.onWindowFocus());

        console.log('🎮 Обработчики событий настроены');
    }

    // Обработка движения мыши
    onMouseMove(event) {
        if (!this.config.interaction.mouseInfluence) return;

        const currentTime = performance.now();
        if (currentTime - this.lastInteractionTime < this.interactionThrottle) {
            return; // Throttling для производительности
        }
        this.lastInteractionTime = currentTime;

        // Обновляем позицию мыши в нормализованных координатах
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Переводим в мировые координаты
        this.updateMouseWorldPosition();

        // Отправляем позицию в физический контроллер
        window.PhysicsController.updateMousePosition(
            this.mouseWorldPosition.x,
            this.mouseWorldPosition.y,
            this.mouseWorldPosition.z
        );

        // Обновляем курсор в зависимости от того, над чем мы
        this.updateCursor();

        this.lastMousePosition = { x: event.clientX, y: event.clientY };
    }

    // Обновление мировой позиции мыши
    updateMouseWorldPosition() {
        // Создаем плоскость на уровне пола
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Создаем луч от камеры через позицию мыши
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Находим пересечение с плоскостью пола
        const intersection = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, intersection);

        if (intersection) {
            this.mouseWorldPosition.copy(intersection);
        }
    }

    // Обработка нажатия мыши
    onMouseDown(event) {
        this.isMouseDown = true;

        // Проверяем, кликнули ли мы по крысе
        this.checkRatClick();

        // Можно добавить специальные эффекты при клике
        this.createClickEffect();
    }

    // Обработка отпускания мыши
    onMouseUp(event) {
        this.isMouseDown = false;
        this.isDragging = false;
    }

    // Обработка выхода мыши за пределы canvas
    onMouseLeave(event) {
        this.isMouseDown = false;
        this.isDragging = false;

        // Убираем влияние мыши на крыс
        window.PhysicsController.updateMousePosition(1000, 0, 1000); // Далеко за пределами
    }

    // Обработка колесика мыши (зум камеры)
    onMouseWheel(event) {
        if (!this.config.interaction.cameraControls) return;

        event.preventDefault();

        const zoomSpeed = 0.1;
        const direction = event.deltaY > 0 ? 1 : -1;

        // Двигаем камеру ближе/дальше
        const camera = this.camera;
        const moveDistance = direction * zoomSpeed;

        camera.position.x += camera.position.x * moveDistance * 0.1;
        camera.position.y += camera.position.y * moveDistance * 0.1;
        camera.position.z += camera.position.z * moveDistance * 0.1;

        // Ограничиваем зум
        const distance = camera.position.length();
        if (distance < 3) {
            camera.position.normalize().multiplyScalar(3);
        } else if (distance > 20) {
            camera.position.normalize().multiplyScalar(20);
        }

        camera.lookAt(0, 0, 0);
    }

    // Touch события для мобильных устройств
    onTouchStart(event) {
        event.preventDefault();

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startTime: Date.now()
            });
        }

        // Если один палец - эмулируем мышь
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.emulateMouseEvent('mousemove', touch);
            this.emulateMouseEvent('mousedown', touch);
        }
    }

    onTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.emulateMouseEvent('mousemove', touch);
        }

        // Обновляем позиции касаний
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (this.touches.has(touch.identifier)) {
                const stored = this.touches.get(touch.identifier);
                stored.x = touch.clientX;
                stored.y = touch.clientY;
            }
        }
    }

    onTouchEnd(event) {
        event.preventDefault();

        if (event.touches.length === 0) {
            this.emulateMouseEvent('mouseup', event.changedTouches[0]);
            this.emulateMouseEvent('mouseleave', event.changedTouches[0]);
        }

        // Удаляем завершенные касания
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
        }
    }

    onTouchCancel(event) {
        this.onTouchEnd(event);
    }

    // Эмуляция событий мыши для touch устройств
    emulateMouseEvent(type, touch) {
        const mouseEvent = new MouseEvent(type, {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            cancelable: true
        });

        this.canvas.dispatchEvent(mouseEvent);
    }

    // Обработка клавиатуры
    onKeyDown(event) {
        if (!this.config.interaction.keyboardControls) return;

        switch(event.code) {
            case 'Space':
                event.preventDefault();
                window.ThreeController.togglePause();
                break;

            case 'KeyR':
                event.preventDefault();
                window.PhysicsController.resetRats();
                break;

            case 'Escape':
                event.preventDefault();
                this.showInstructions();
                break;

            case 'KeyH':
                event.preventDefault();
                this.toggleInstructions();
                break;

            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
                event.preventDefault();
                const ratCount = parseInt(event.code.slice(-1));
                window.ThreeController.setRatCount(ratCount);
                break;

            case 'KeyP':
                event.preventDefault();
                this.togglePerformanceMode();
                break;

            case 'KeyQ':
                event.preventDefault();
                this.quickEscape();
                break;
        }
    }

    onKeyUp(event) {
        // Обработка отпускания клавиш если нужно
    }

    // Проверка клика по крысе
    checkRatClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const rats = window.ThreeController.getRats();
        const meshes = rats.map(rat => rat.mesh);

        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const clickedRat = rats.find(rat => rat.mesh === clickedMesh);

            if (clickedRat) {
                this.onRatClicked(clickedRat);
            }
        }
    }

    // Обработка клика по крысе
    onRatClicked(rat) {
        console.log(`🐭 Кликнули по крысе ${rat.id}!`);

        // Создаем эффект испуга
        rat.fear = 1.0;

        // Добавляем импульс "толчка"
        if (rat.physicsBody) {
            const pushDirection = new THREE.Vector3()
                .subVectors(rat.mesh.position, this.mouseWorldPosition)
                .normalize()
                .multiplyScalar(5);

            rat.physicsBody.applyImpulse(
                new CANNON.Vec3(pushDirection.x, 1, pushDirection.z),
                rat.physicsBody.position
            );
        }

        // Визуальный эффект
        this.createRatClickEffect(rat);
    }

    // Создание эффекта клика
    createClickEffect() {
        // Простой эффект ряби в месте клика
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(79, 172, 254, 0.8);
            border-radius: 50%;
            pointer-events: none;
            left: ${this.lastMousePosition.x - 10}px;
            top: ${this.lastMousePosition.y - 10}px;
            animation: ripple 0.6s ease-out forwards;
            z-index: 1000;
        `;

        // Добавляем CSS анимацию если её нет
        if (!document.getElementById('ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(ripple);

        // Удаляем элемент после анимации
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // Создание эффекта клика по крысе
    createRatClickEffect(rat) {
        // Временно меняем цвет крысы
        const originalColor = rat.mesh.material.color.clone();
        rat.mesh.material.color.setHex(0xffff00); // Желтый

        setTimeout(() => {
            rat.mesh.material.color.copy(originalColor);
        }, 200);

        console.log(`✨ Эффект клика по крысе ${rat.id}`);
    }

    // Обновление курсора
    updateCursor() {
        if (!this.canvas) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const rats = window.ThreeController.getRats();
        const meshes = rats.map(rat => rat.mesh);

        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    // Настройка клавиатурных управлений
    setupKeyboardControls() {
        if (!this.config.interaction.keyboardControls) return;

        // Показываем подсказки по клавишам
        console.log(`
🎮 Клавиатурные управления:
  Пробел - пауза/воспроизведение
  R - сброс крыс
  1-7 - изменить количество крыс
  H - показать/скрыть инструкции
  P - переключить режим производительности
  Q - быстрый выход
  ESC - показать инструкции
        `);
    }

    // Переключение режима производительности
    togglePerformanceMode() {
        const modes = ['high', 'medium', 'low', 'potato'];
        const currentMode = this.performanceMode || 'high';
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        this.performanceMode = nextMode;
        window.PhysicsController.setPerformanceMode(nextMode);

        // Показываем уведомление
        this.showNotification(`Режим производительности: ${nextMode}`);

        console.log(`🎛️ Режим производительности: ${nextMode}`);
    }

    // Быстрый выход
    quickEscape() {
        if (confirm('🏃‍♂️ Вернуться на этаж гостиных?')) {
            window.location.href = '../dog_living_room.html';
        }
    }

    // Показ/скрытие инструкций
    toggleInstructions() {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.style.display =
                instructions.style.display === 'none' ? 'block' : 'none';
        }
    }

    showInstructions() {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }

    // Показ уведомлений
    showNotification(message, duration = 2000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(79, 172, 254, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        // Добавляем CSS анимацию
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    // Обработка потери фокуса окна
    onWindowBlur() {
        // Автоматически ставим на паузу при потере фокуса
        if (!window.ThreeController?.isPaused) {
            window.ThreeController.togglePause();
            this.showNotification('Игра поставлена на паузу');
        }
    }

    onWindowFocus() {
        // Можно автоматически снимать с паузы при возврате фокуса
        // Но пока оставим решение пользователю
    }

    // Детекция touch устройств
    detectTouchDevice() {
        return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
    }

    // Получение статистики взаимодействия
    getInteractionStats() {
        return {
            isTouchDevice: this.isTouchDevice,
            activeTouches: this.touches.size,
            mousePosition: this.mouse,
            mouseWorldPosition: this.mouseWorldPosition,
            isMouseDown: this.isMouseDown,
            lastInteractionTime: this.lastInteractionTime
        };
    }

    // Экстренная остановка всех взаимодействий
    emergencyStop() {
        // Удаляем все обработчики событий
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'none';
        }

        // Очищаем состояние
        this.isMouseDown = false;
        this.isDragging = false;
        this.touches.clear();

        this.showNotification('🚨 Взаимодействие отключено!', 3000);
        console.log('🚨 Система взаимодействия экстренно остановлена!');
    }

    // Восстановление после экстренной остановки
    restore() {
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'auto';
        }

        this.showNotification('✅ Взаимодействие восстановлено!');
        console.log('✅ Система взаимодействия восстановлена!');
    }

    // Настройка чувствительности
    setSensitivity(level) {
        switch(level) {
            case 'low':
                this.interactionThrottle = 32; // ~30fps
                break;
            case 'medium':
                this.interactionThrottle = 16; // ~60fps
                break;
            case 'high':
                this.interactionThrottle = 8;  // ~120fps
                break;
        }

        console.log(`🎯 Чувствительность установлена: ${level}`);
    }
}

// Создаем глобальный экземпляр
window.InteractionController = new InteractionController();