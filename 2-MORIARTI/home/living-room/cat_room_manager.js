// 🐱 Cat Room Manager - Управляющий этажом гостиных
// Координирует все комнаты, создает эффекты и управляет навигацией

class RoomManager {
    constructor() {
        this.config = null;
        this.starsContainer = null;
        this.isInitialized = false;

        console.log('🐱 Cat Room Manager проснулся!');
    }

    // Инициализация этажа
    async initialize() {
        if (this.isInitialized) return;

        try {
            await this.loadRoomConfigs();
            this.createStars();
            this.setupRoomCards();
            this.setupNavigation();
            this.isInitialized = true;

            console.log('🏠 Этаж гостиных полностью загружен!');
        } catch (error) {
            console.error('💥 Ошибка инициализации этажа:', error);
        }
    }

    // Загрузка конфигурации комнат
    async loadRoomConfigs() {
        try {
            const response = await fetch('meow_room_configs.json');
            this.config = await response.json();
            console.log('📋 Конфигурация комнат загружена');

            // Обновляем заголовки страницы
            this.updateFloorInfo();
        } catch (error) {
            console.error('❌ Не удалось загрузить конфигурацию:', error);
            // Используем fallback конфигурацию
            this.config = this.getFallbackConfig();
        }
    }

    // Обновление информации об этаже
    updateFloorInfo() {
        if (!this.config?.floorInfo) return;

        const titleElement = document.querySelector('.floor-title');
        const subtitleElement = document.querySelector('.floor-subtitle');
        const descriptionElement = document.querySelector('.floor-description');

        if (titleElement) titleElement.textContent = this.config.floorInfo.title;
        if (subtitleElement) subtitleElement.textContent = this.config.floorInfo.subtitle;
        if (descriptionElement) descriptionElement.textContent = this.config.floorInfo.description;
    }

    // Создание звездного фона
    createStars() {
        this.starsContainer = document.getElementById('stars');
        if (!this.starsContainer) return;

        const starCount = this.config?.settings?.starCount || 15;

        // Очищаем существующие звезды
        this.starsContainer.innerHTML = '';

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';

            // Случайные параметры
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';

            this.starsContainer.appendChild(star);
        }

        console.log(`✨ Создано ${starCount} звезд`);
    }

    // Настройка карточек комнат
    setupRoomCards() {
        const roomCards = document.querySelectorAll('.room-card');

        roomCards.forEach((card, index) => {
            const roomId = card.dataset.room;
            if (roomId && this.config?.rooms?.[roomId]) {
                this.populateRoomCard(card, this.config.rooms[roomId]);
            }

            // Добавляем обработчик клика
            card.addEventListener('click', () => this.enterRoom(roomId));

            // Добавляем hover эффекты
            this.setupCardHoverEffects(card);
        });
    }

    // Заполнение карточки комнаты данными
    populateRoomCard(card, roomData) {
        const iconElement = card.querySelector('.room-icon');
        const nameElement = card.querySelector('.room-name');
        const techElement = card.querySelector('.room-tech');
        const descriptionElement = card.querySelector('.room-description');
        const statusElement = card.querySelector('.room-status');

        if (iconElement) iconElement.textContent = roomData.icon;
        if (nameElement) nameElement.textContent = roomData.name;
        if (techElement) techElement.textContent = roomData.techDisplay;
        if (descriptionElement) descriptionElement.textContent = roomData.description;

        if (statusElement) {
            statusElement.className = `room-status status-${roomData.status}`;
            statusElement.textContent = roomData.status === 'ready' ? 'Готово!' : 'Coming Soon';
        }
    }

    // Настройка hover эффектов для карточек
    setupCardHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            console.log(`🖱️ Наведение на ${card.dataset.room}`);
        });

        card.addEventListener('mouseleave', () => {
            // Можно добавить эффекты при уходе курсора
        });
    }

    // Вход в комнату
    enterRoom(roomId) {
        if (!roomId) return;

        console.log(`🚪 Попытка входа в комнату: ${roomId}`);

        const roomData = this.config?.rooms?.[roomId];
        if (!roomData) {
            console.error(`❌ Комната ${roomId} не найдена в конфигурации`);
            return;
        }

        // Проверяем статус комнаты
        if (roomData.status === 'ready') {
            this.navigateToRoom(roomId);
        } else {
            this.showComingSoonNotification(roomId, roomData);
        }
    }

    // Переход в готовую комнату
    navigateToRoom(roomId) {
        const url = `${roomId}/dog_${roomId}.html`;
        console.log(`🚶 Переход в комнату: ${url}`);
        window.location.href = url;
    }

    // Уведомление о разработке
    showComingSoonNotification(roomId, roomData) {
        const notification = document.createElement('div');
        notification.className = 'coming-soon-notification';

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${roomData.icon}</div>
                <h2>🚧 Комната в разработке</h2>
                <p>Крысы и коты еще обустраивают <strong>${roomData.name}</strong>!</p>
                <p class="tech-info">Технологии: ${roomData.techDisplay}</p>
                <p class="difficulty">Сложность: ${this.getDifficultyLabel(roomData.difficulty)}</p>
                <button class="close-notification">Понятно</button>
            </div>
        `;

        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            border: 2px solid #667eea;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;

        const closeButton = notification.querySelector('.close-notification');
        closeButton.style.cssText = `
            margin-top: 20px;
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            background: #667eea;
            color: white;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        `;

        closeButton.addEventListener('click', () => {
            document.body.removeChild(notification);
        });

        // Закрытие по клику на фон
        notification.addEventListener('click', (e) => {
            if (e.target === notification) {
                document.body.removeChild(notification);
            }
        });

        document.body.appendChild(notification);
        console.log(`💬 Показано уведомление для ${roomId}`);
    }

    // Получение подписи сложности
    getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': '🟢 Начинающий',
            'intermediate': '🟡 Средний',
            'advanced': '🟠 Продвинутый',
            'expert': '🔴 Эксперт'
        };
        return labels[difficulty] || difficulty;
    }

    // Настройка навигации
    setupNavigation() {
        // Обработка кнопки "Домой"
        const homeButton = document.querySelector('.back-button');
        if (homeButton) {
            homeButton.addEventListener('click', (e) => {
                console.log('🏠 Возвращение домой');
            });
        }

        // Можно добавить клавиатурную навигацию
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Закрыть уведомления
                const notifications = document.querySelectorAll('.coming-soon-notification');
                notifications.forEach(n => n.remove());
            }
        });
    }

    // Fallback конфигурация на случай ошибки загрузки
    getFallbackConfig() {
        return {
            floorInfo: {
                title: "🛋️ Этаж Чудес",
                subtitle: "Комнаты загружаются...",
                description: "Пожалуйста, подождите."
            },
            rooms: {},
            settings: {
                starCount: 10,
                enableAnimations: true
            }
        };
    }

    // Метод для получения информации о комнате
    getRoomInfo(roomId) {
        return this.config?.rooms?.[roomId] || null;
    }

    // Метод для обновления статуса комнаты
    updateRoomStatus(roomId, newStatus) {
        if (this.config?.rooms?.[roomId]) {
            this.config.rooms[roomId].status = newStatus;
            // Обновляем карточку
            const card = document.querySelector(`[data-room="${roomId}"]`);
            if (card) {
                this.populateRoomCard(card, this.config.rooms[roomId]);
            }
        }
    }

    // Метод для включения/выключения анимаций
    toggleAnimations(enabled) {
        if (this.config?.settings) {
            this.config.settings.enableAnimations = enabled;
        }

        document.body.classList.toggle('animations-disabled', !enabled);
        console.log(`🎬 Анимации ${enabled ? 'включены' : 'отключены'}`);
    }
}

// Создаем глобальный экземпляр менеджера
window.RoomManager = new RoomManager();

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.RoomManager.initialize();
});