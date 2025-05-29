// 🐱 Cat Physics Controller - Управляющий физикой крыс (Matter.js версия)
// Отвечает за Matter.js физический мир и поведение крыс

class PhysicsController {
    constructor() {
        this.engine = null;
        this.world = null;
        this.ratBodies = [];
        this.walls = [];
        this.isInitialized = false;
        this.config = null;
        this.mousePosition = new THREE.Vector3(0, 0, 0);
        this.mouseInfluence = 2.0;

        // Оптимизация производительности
        this.physicsEnabled = true;
        this.timeStep = 1/60;
        this.lastTime = 0;

        console.log('🐱 Physics Controller (Matter.js) готов к работе!');
    }

    // Инициализация физического мира
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Ждем инициализации Three.js контроллера
            while (!window.ThreeController?.isInitialized) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.config = window.ThreeController.config;

            this.createPhysicsWorld();
            this.createWalls();
            this.createRatBodies();
            this.startPhysicsLoop();

            this.isInitialized = true;
            console.log('⚡ Физический мир (Matter.js) создан!');

        } catch (error) {
            console.error('💥 Ошибка инициализации физики:', error);
            throw error;
        }
    }

    // Создание физического мира
    createPhysicsWorld() {
        // Создаем движок Matter.js
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Настройки для оптимизации
        this.engine.world.gravity.y = 0.98; // Немного меньше гравитации
        this.engine.enableSleeping = true; // Позволяем телам "засыпать"

        // Оптимизация для Mac - уменьшаем количество итераций
        this.engine.positionIterations = 3; // Было бы 6 по умолчанию
        this.engine.velocityIterations = 2; // Было бы 4 по умолчанию

        console.log('🌍 Физический мир (Matter.js) настроен');
    }

    // Создание невидимых стен
    createWalls() {
        const floorSize = this.config.scene.floorSize;
        const wallHeight = this.config.scene.wallHeight;
        const wallThickness = 0.5;

        // Пол
        const floor = Matter.Bodies.rectangle(
            0, wallHeight/2,
            floorSize, wallThickness,
            { isStatic: true, label: 'floor' }
        );

        // Стены
        const walls = [
            // Правая стена
            Matter.Bodies.rectangle(
                floorSize/2, 0,
                wallThickness, wallHeight,
                { isStatic: true, label: 'wall-right' }
            ),
            // Левая стена
            Matter.Bodies.rectangle(
                -floorSize/2, 0,
                wallThickness, wallHeight,
                { isStatic: true, label: 'wall-left' }
            ),
            // Задняя стена
            Matter.Bodies.rectangle(
                0, -floorSize/2,
                floorSize, wallThickness,
                { isStatic: true, label: 'wall-back' }
            ),
            // Передняя стена
            Matter.Bodies.rectangle(
                0, floorSize/2,
                floorSize, wallThickness,
                { isStatic: true, label: 'wall-front' }
            )
        ];

        this.walls = [floor, ...walls];
        Matter.World.add(this.world, this.walls);

        console.log('🧱 Невидимые стены созданы (Matter.js)');
    }

    // Создание физических тел для крыс
    createRatBodies() {
        const rats = window.ThreeController.getRats();
        const ratSize = this.config.rats.size;

        this.ratBodies = [];

        rats.forEach((rat, index) => {
            // Создаем физическое тело в Matter.js
            const body = Matter.Bodies.rectangle(
                rat.mesh.position.x,
                rat.mesh.position.z, // Y в Three.js = Z в Matter (2D)
                ratSize.width,
                ratSize.depth,
                {
                    density: 0.001, // Легкие крысы
                    frictionAir: 0.1, // Сопротивление воздуха
                    friction: 0.8,
                    restitution: 0.3, // Упругость
                    label: `rat-${index}`
                }
            );

            Matter.World.add(this.world, body);
            this.ratBodies.push(body);

            // Связываем физическое тело с крысой
            rat.physicsBody = body;
        });

        console.log(`🐭 Создано ${this.ratBodies.length} физических тел для крыс (Matter.js)`);
    }

    // Запуск физического цикла
    startPhysicsLoop() {
        const physicsStep = () => {
            if (!this.physicsEnabled || window.ThreeController?.isPaused) {
                requestAnimationFrame(physicsStep);
                return;
            }

            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Обновляем поведение крыс перед физическим шагом
            this.updateRatBehavior();

            // Выполняем физический шаг Matter.js
            Matter.Engine.update(this.engine, Math.min(deltaTime, 16.67)); // Максимум 60fps

            // Синхронизируем физические тела с Three.js мешами
            this.syncPhysicsToMeshes();

            requestAnimationFrame(physicsStep);
        };

        requestAnimationFrame(physicsStep);
        console.log('⚡ Физический цикл (Matter.js) запущен');
    }

    // Обновление поведения крыс
    updateRatBehavior() {
        const rats = window.ThreeController.getRats();
        const fearRadius = this.config.rats.behavior.fearRadius;
        const wanderStrength = this.config.rats.behavior.wanderStrength;

        rats.forEach((rat, index) => {
            if (!rat.physicsBody || !rat.isAlive) return;

            const body = rat.physicsBody;
            const position = body.position;

            // Вычисляем расстояние до курсора (используем X и Y Matter.js)
            const distanceToMouse = Math.sqrt(
                Math.pow(this.mousePosition.x - position.x, 2) +
                Math.pow(this.mousePosition.z - position.y, 2) // Z в Three = Y в Matter
            );

            let forceX = 0;
            let forceY = 0;

            // Реакция на курсор (страх)
            if (distanceToMouse < fearRadius) {
                const fearIntensity = 1 - (distanceToMouse / fearRadius);
                rat.fear = Math.min(rat.fear + fearIntensity * 0.1, 1);

                // Направление убегания от курсора
                const escapeDirection = {
                    x: position.x - this.mousePosition.x,
                    y: position.y - this.mousePosition.z
                };

                // Нормализуем направление
                const distance = Math.sqrt(escapeDirection.x ** 2 + escapeDirection.y ** 2);
                if (distance > 0) {
                    escapeDirection.x /= distance;
                    escapeDirection.y /= distance;
                }

                // Применяем силу страха
                const fearForce = rat.speed * rat.fear * this.config.rats.speed.panicMultiplier * 0.001;
                forceX += escapeDirection.x * fearForce;
                forceY += escapeDirection.y * fearForce;

            } else {
                // Уменьшаем страх когда курсор далеко
                rat.fear = Math.max(rat.fear - 0.02, 0);
            }

            // Случайное блуждание (когда не боится)
            if (rat.fear < 0.1) {
                const wanderX = (Math.random() - 0.5) * wanderStrength * 0.001;
                const wanderY = (Math.random() - 0.5) * wanderStrength * 0.001;

                forceX += wanderX * rat.speed;
                forceY += wanderY * rat.speed;
            }

            // Возврат к центру если слишком далеко
            if (this.config.rats.behavior.returnToCenter) {
                const distanceFromCenter = Math.sqrt(position.x ** 2 + position.y ** 2);
                const maxDistance = this.config.scene.floorSize / 2 - 1;

                if (distanceFromCenter > maxDistance) {
                    const returnForce = 0.0005;
                    forceX -= position.x * returnForce;
                    forceY -= position.y * returnForce;
                }
            }

            // Применяем силы к физическому телу
            if (Math.abs(forceX) > 0.00001 || Math.abs(forceY) > 0.00001) {
                Matter.Body.applyForce(body, position, { x: forceX, y: forceY });
            }

            // Ограничиваем скорость
            const maxSpeed = rat.fear > 0.5 ?
                this.config.rats.speed.max * this.config.rats.speed.panicMultiplier :
                this.config.rats.speed.max;

            const velocity = body.velocity;
            const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                Matter.Body.setVelocity(body, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }

            // Обновляем цвет в зависимости от страха
            this.updateRatAppearance(rat);
        });
    }

    // Обновление внешнего вида крысы в зависимости от состояния
    updateRatAppearance(rat) {
        if (!rat.mesh || !rat.mesh.material) return;

        const fearLevel = rat.fear;
        const originalColor = new THREE.Color(rat.originalColor);

        if (fearLevel > 0.1) {
            // Делаем крысу краснее при страхе
            const redTint = new THREE.Color(1, 0.5, 0.5);
            const mixedColor = originalColor.clone().lerp(redTint, fearLevel * 0.5);
            rat.mesh.material.color = mixedColor;

            // Увеличиваем размер при панике
            const scale = 1 + fearLevel * 0.2;
            rat.mesh.scale.set(scale, scale, scale);
        } else {
            // Возвращаем к нормальному виду
            rat.mesh.material.color = originalColor;
            rat.mesh.scale.set(1, 1, 1);
        }
    }

    // Синхронизация физических тел с мешами Three.js
    syncPhysicsToMeshes() {
        const rats = window.ThreeController.getRats();

        rats.forEach((rat) => {
            if (!rat.physicsBody || !rat.mesh) return;

            // Копируем позицию (Matter.js 2D → Three.js 3D)
            rat.mesh.position.x = rat.physicsBody.position.x;
            rat.mesh.position.z = rat.physicsBody.position.y; // Y в Matter = Z в Three
            // Y остается постоянным (высота крысы над полом)

            // Поворот по углу тела
            rat.mesh.rotation.y = rat.physicsBody.angle;
        });
    }

    // Обновление позиции мыши для физики
    updateMousePosition(x, y, z) {
        this.mousePosition.set(x, y, z);
    }

    // Добавление новой крысы в физический мир
    addRatBody(rat) {
        const ratSize = this.config.rats.size;

        const body = Matter.Bodies.rectangle(
            rat.mesh.position.x,
            rat.mesh.position.z,
            ratSize.width,
            ratSize.depth,
            {
                density: 0.001,
                frictionAir: 0.1,
                friction: 0.8,
                restitution: 0.3,
                label: `rat-${this.ratBodies.length}`
            }
        );

        Matter.World.add(this.world, body);
        this.ratBodies.push(body);
        rat.physicsBody = body;

        console.log('🐭 Добавлено новое физическое тело для крысы (Matter.js)');
    }

    // Удаление крысы из физического мира
    removeRatBody(rat) {
        if (!rat.physicsBody) return;

        Matter.World.remove(this.world, rat.physicsBody);

        const index = this.ratBodies.indexOf(rat.physicsBody);
        if (index > -1) {
            this.ratBodies.splice(index, 1);
        }

        rat.physicsBody = null;

        console.log('🗑️ Физическое тело крысы удалено (Matter.js)');
    }

    // Сброс всех крыс к начальным позициям
    resetRats() {
        const rats = window.ThreeController.getRats();
        const floorSize = this.config.scene.floorSize;
        const maxPos = floorSize / 2 - 1;

        rats.forEach((rat) => {
            if (!rat.physicsBody) return;

            // Случайная позиция
            const x = (Math.random() - 0.5) * maxPos;
            const y = (Math.random() - 0.5) * maxPos;

            Matter.Body.setPosition(rat.physicsBody, { x, y });
            Matter.Body.setVelocity(rat.physicsBody, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(rat.physicsBody, 0);

            rat.fear = 0;
        });

        console.log('🔄 Крысы возвращены к начальным позициям (Matter.js)');
    }

    // Включение/выключение физики для производительности
    togglePhysics(enabled) {
        this.physicsEnabled = enabled;
        console.log(`⚡ Физика ${enabled ? 'включена' : 'отключена'} (Matter.js)`);
    }

    // Настройка параметров производительности
    setPerformanceMode(mode) {
        switch(mode) {
            case 'high':
                this.engine.positionIterations = 6;
                this.engine.velocityIterations = 4;
                break;
            case 'medium':
                this.engine.positionIterations = 4;
                this.engine.velocityIterations = 3;
                break;
            case 'low':
                this.engine.positionIterations = 3;
                this.engine.velocityIterations = 2;
                break;
            case 'potato': // Для Mac в критическом состоянии
                this.engine.positionIterations = 2;
                this.engine.velocityIterations = 1;
                break;
        }

        console.log(`🎛️ Режим производительности (Matter.js): ${mode}`);
    }

    // Экстренная остановка физики
    emergencyStop() {
        this.physicsEnabled = false;

        // Останавливаем всех крыс
        this.ratBodies.forEach(body => {
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
        });

        console.log('🚨 Физика (Matter.js) экстренно остановлена!');
    }

    // Получение статистики физики
    getPhysicsStats() {
        return {
            bodiesCount: this.world.bodies.length,
            pairsCount: this.engine.pairs?.list?.length || 0,
            isEnabled: this.physicsEnabled,
            engineType: 'Matter.js',
            positionIterations: this.engine.positionIterations,
            velocityIterations: this.engine.velocityIterations
        };
    }
}

// Создаем глобальный экземпляр
window.PhysicsController = new PhysicsController();