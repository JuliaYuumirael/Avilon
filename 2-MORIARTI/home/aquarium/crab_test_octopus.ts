/**
 * 🦀 Тестовый Краб
 *
 * Использует базовый класс Осьминога и создает тестовую структуру
 * для проверки рекурсивной архитектуры
 */

import { Octopus } from './octopus_base';

export class CrabTestOctopus {
    private mainOctopus: Octopus;

    constructor() {
        this.mainOctopus = this.createTestEcosystem();
    }

    /**
     * Создать тестовую экосистему осьминогов
     */
    private createTestEcosystem(): Octopus {
        // Главный осьминог-координатор
        const mainOctopus = new Octopus({
            logo: `
🌊 ====== ТЕСТОВЫЙ АКВАРИУМ ====== 🌊
    🐙    🦑    🐙    🦑    🐙
  =====================================`,
            greeting: "Добро пожаловать в тестовую экосистему! Выберите действие:",
        });

        // Щупальце 1: Простой исполнитель
        const simpleExecutor = new Octopus({
            greeting: "Простое действие",
            action: () => {
                console.log("🦾 Выполняю простое действие!");
                console.log("✅ Простое действие завершено!");
            }
        });

        // Щупальце 2: Асинхронный исполнитель
        const asyncExecutor = new Octopus({
            greeting: "Асинхронное действие",
            action: async () => {
                console.log("🦾 Начинаю асинхронное действие...");
                await this.delay(1000);
                console.log("⏳ Обрабатываю данные...");
                await this.delay(1000);
                console.log("✅ Асинхронное действие завершено!");
            }
        });

        // Щупальце 3: Вложенный координатор
        const nestedCoordinator = new Octopus({
            greeting: "Вложенное меню",
        });

        // Подщупальца для вложенного координатора
        const subAction1 = new Octopus({
            greeting: "Подействие А",
            action: () => {
                console.log("🔀 Выполняю подействие А!");
                console.log("🎯 Результат: Данные типа А обработаны");
            }
        });

        const subAction2 = new Octopus({
            greeting: "Подействие Б",
            action: () => {
                console.log("🔀 Выполняю подействие Б!");
                console.log("🎯 Результат: Данные типа Б обработаны");
            }
        });

        // Еще более глубокая вложенность
        const deepCoordinator = new Octopus({
            greeting: "Глубокое меню"
        });

        const deepAction = new Octopus({
            greeting: "Очень глубокое действие",
            action: () => {
                console.log("🏊‍♂️ Погружаюсь на глубину...");
                console.log("🐙 На дне океана нашел сокровище!");
                console.log("💎 Сокровище: Рекурсия работает!");
            }
        });

        deepCoordinator.addTentacle(deepAction);

        // Собираем вложенную структуру
        nestedCoordinator.addTentacle(subAction1);
        nestedCoordinator.addTentacle(subAction2);
        nestedCoordinator.addTentacle(deepCoordinator);

        // Щупальце 4: Информационное
        const infoExecutor = new Octopus({
            greeting: "Показать структуру",
            action: () => {
                console.log("\n🗂️ Структура экосистемы:");
                this.mainOctopus.printStructure();
                console.log("\n📊 Детальная информация:");
                console.log(JSON.stringify(this.mainOctopus.getStructureInfo(), null, 2));
            }
        });

        // Собираем главную структуру
        mainOctopus.addTentacle(simpleExecutor);
        mainOctopus.addTentacle(asyncExecutor);
        mainOctopus.addTentacle(nestedCoordinator);
        mainOctopus.addTentacle(infoExecutor);

        return mainOctopus;
    }

    /**
     * Утилита для задержки (для асинхронных тестов)
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Запустить базовый тест (без CLI ввода)
     */
    async runBasicTest(): Promise<void> {
        console.log("🧪 === БАЗОВЫЙ ТЕСТ СТРУКТУРЫ === 🧪\n");

        await this.mainOctopus.run();

        console.log("\n📋 Тестируем отдельные щупальца:\n");

        // Тест простого действия
        console.log("1️⃣ Тест простого действия:");
        const tentacle1 = this.mainOctopus.getTentacle(0);
        if (tentacle1) await tentacle1.run();

        console.log("\n2️⃣ Тест асинхронного действия:");
        const tentacle2 = this.mainOctopus.getTentacle(1);
        if (tentacle2) await tentacle2.run();

        console.log("\n3️⃣ Тест вложенного меню:");
        const tentacle3 = this.mainOctopus.getTentacle(2);
        if (tentacle3) {
            await tentacle3.run();

            console.log("\n   3️⃣.1️⃣ Тест подействия А:");
            const subTentacle1 = tentacle3.getTentacle(0);
            if (subTentacle1) await subTentacle1.run();

            console.log("\n   3️⃣.2️⃣ Тест глубокой вложенности:");
            const deepTentacle = tentacle3.getTentacle(2);
            if (deepTentacle) {
                await deepTentacle.run();
                const veryDeep = deepTentacle.getTentacle(0);
                if (veryDeep) await veryDeep.run();
            }
        }

        console.log("\n4️⃣ Тест информационного действия:");
        const tentacle4 = this.mainOctopus.getTentacle(3);
        if (tentacle4) await tentacle4.run();

        console.log("\n✅ === БАЗОВЫЙ ТЕСТ ЗАВЕРШЕН === ✅");
    }

    /**
     * Тест динамического добавления щупалец
     */
    testDynamicTentacles(): void {
        console.log("\n🔧 === ТЕСТ ДИНАМИЧЕСКИХ ЩУПАЛЕЦ === 🔧\n");

        const dynamicOctopus = new Octopus({
            greeting: "Динамический осьминог"
        });

        console.log("📊 Исходная структура:");
        dynamicOctopus.printStructure();

        // Добавляем щупальца динамически
        dynamicOctopus.addTentacle(new Octopus({
            greeting: "Динамически добавленное щупальце 1",
            action: () => console.log("🚀 Действие 1 выполнено!")
        }));

        dynamicOctopus.addTentacle(new Octopus({
            greeting: "Динамически добавленное щупальце 2",
            action: () => console.log("🚀 Действие 2 выполнено!")
        }));

        console.log("\n📊 Структура после добавления:");
        dynamicOctopus.printStructure();

        // Удаляем щупальце
        console.log("\n🗑️ Удаляем первое щупальце...");
        dynamicOctopus.removeTentacle(0);

        console.log("\n📊 Структура после удаления:");
        dynamicOctopus.printStructure();

        console.log("\n✅ === ТЕСТ ДИНАМИЧЕСКИХ ЩУПАЛЕЦ ЗАВЕРШЕН === ✅");
    }

    /**
     * Получить главного осьминога для внешнего использования
     */
    getMainOctopus(): Octopus {
        return this.mainOctopus;
    }
}

// Пример использования
if (require.main === module) {
    async function runTests() {
        const crabTest = new CrabTestOctopus();

        await crabTest.runBasicTest();
        crabTest.testDynamicTentacles();
    }

    runTests().catch(console.error);
}1