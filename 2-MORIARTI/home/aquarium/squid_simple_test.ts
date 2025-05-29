/**
 * 🦑 Простой тестовый кальмар БЕЗ readline
 *
 * Проверяем, работает ли базовая логика без проблем ввода
 */

import { Octopus } from './octopus_base';

export class SimpleSquidTest {
    private currentOctopus: Octopus;

    constructor() {
        this.currentOctopus = this.createTestOctopus();
    }

    /**
     * Создаем простого тестового осьминога
     */
    private createTestOctopus(): Octopus {
        const mainOctopus = new Octopus({
            logo: `
🦑 ═══════════════════════════════════════════ 🦑
    ПРОСТОЙ ТЕСТ БЕЗ READLINE
🦑 ═══════════════════════════════════════════ 🦑`,
            greeting: "🦑 Простой кальмар - выберите тест:"
        });

        // Простое действие 1
        mainOctopus.addTentacle(new Octopus({
            greeting: "Тест 1: Простое сообщение",
            action: () => {
                console.log("✅ Тест 1 выполнен!");
                console.log("🎯 Это простое действие без ввода");
                console.log("💚 Если вы это видите - базовая логика работает!");
            }
        }));

        // Простое действие 2
        mainOctopus.addTentacle(new Octopus({
            greeting: "Тест 2: Счетчик",
            action: () => {
                console.log("✅ Тест 2 выполнен!");
                for (let i = 1; i <= 5; i++) {
                    console.log(`📊 Счетчик: ${i}`);
                }
                console.log("💚 Счетчик завершен!");
            }
        }));

        // Асинхронное действие
        mainOctopus.addTentacle(new Octopus({
            greeting: "Тест 3: Асинхронная операция",
            action: async () => {
                console.log("✅ Тест 3 выполнен!");
                console.log("⏳ Начинаю асинхронную операцию...");

                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log("🔄 Половина выполнена...");

                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log("💚 Асинхронная операция завершена!");
            }
        }));

        // Вложенное меню
        const nestedMenu = new Octopus({
            greeting: "Тест 4: Вложенное меню"
        });

        nestedMenu.addTentacle(new Octopus({
            greeting: "Подтест A",
            action: () => {
                console.log("✅ Подтест A выполнен!");
                console.log("🐙 Рекурсивная структура работает!");
            }
        }));

        nestedMenu.addTentacle(new Octopus({
            greeting: "Подтест B",
            action: () => {
                console.log("✅ Подтест B выполнен!");
                console.log("🌊 Глубокая навигация работает!");
            }
        }));

        mainOctopus.addTentacle(nestedMenu);

        // Информационное действие
        mainOctopus.addTentacle(new Octopus({
            greeting: "Тест 5: Показать структуру",
            action: () => {
                console.log("✅ Тест 5 выполнен!");
                console.log("🗂️ Структура тестового осьминога:");
                this.currentOctopus.printStructure();
            }
        }));

        return mainOctopus;
    }

    /**
     * Запуск простого неинтерактивного теста
     */
    async runAllTests(): Promise<void> {
        console.clear();

        console.log("🦑 === АВТОМАТИЧЕСКИЙ ТЕСТ ВСЕХ ДЕЙСТВИЙ === 🦑\n");

        // Показываем структуру
        this.currentOctopus.showLogo();
        this.currentOctopus.showGreeting();
        console.log("\n📋 Доступные тесты:");
        this.currentOctopus.showTentacleMenu();

        console.log("\n🔄 Запускаю все тесты автоматически...\n");

        // Выполняем все тесты по очереди
        for (let i = 0; i < this.currentOctopus.tentacles.length; i++) {
            const tentacle = this.currentOctopus.tentacles[i];

            console.log(`\n${"=".repeat(50)}`);
            console.log(`🧪 Выполняю тест ${i + 1}: ${tentacle.greeting}`);
            console.log(`${"=".repeat(50)}`);

            if (tentacle.isExecutor()) {
                await tentacle.execute();
            } else if (tentacle.isCoordinator()) {
                console.log("📂 Это меню, выполняю подтесты:");

                for (let j = 0; j < tentacle.tentacles.length; j++) {
                    const subTentacle = tentacle.tentacles[j];
                    console.log(`\n  🔸 Подтест ${j + 1}: ${subTentacle.greeting}`);
                    if (subTentacle.isExecutor()) {
                        await subTentacle.execute();
                    }
                }
            }

            // Небольшая пауза между тестами
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n${"=".repeat(50)}`);
        console.log("🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ УСПЕШНО! 🎉");
        console.log("💚 Базовая архитектура работает отлично!");
        console.log(`${"=".repeat(50)}`);
    }

    /**
     * Получить осьминога для использования в других тестах
     */
    getOctopus(): Octopus {
        return this.currentOctopus;
    }
}

// Автозапуск при прямом вызове
if (require.main === module) {
    async function runSimpleTest() {
        console.log("🚀 Запуск простого теста...\n");

        const simpleTest = new SimpleSquidTest();
        await simpleTest.runAllTests();

        console.log("\n👋 Тест завершен!");
    }

    runSimpleTest().catch(console.error);
}