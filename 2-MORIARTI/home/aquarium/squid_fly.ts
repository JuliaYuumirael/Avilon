/**
 * 🦑 SquidFly - Кальмар для управления мухой
 *
 * Исправленная версия БЕЗ readline конфликтов
 * Использует простые аргументы командной строки вместо интерактивного ввода
 */

import { Octopus } from './octopus_base';
import { Fly } from './creatures/fly/fly_base';

export class SquidFly {
    private fly: Fly;

    constructor() {
        this.fly = new Fly();
    }

    /**
     * Создать главное щупальце мухи
     */
    createFlyTentacle(): Octopus {
        const mainTentacle = new Octopus({
            logo: `
🪰 ═══════════════════════════════════════════ 🪰
    ████╗ ██╗██╗   ██╗██╗   ██╗
    ██╔══╝██║██╔══╝ ██║╚██╗ ██╔╝
    ████║ ██║████║  ██║ ╚████╔╝ 
    ██╔══╝██║██╔══╝ ██║  ╚██╔╝  
    ██║   ██║██████╗██║   ██║   
    ╚═╝   ╚═╝╚══════╝╚═╝   ╚═╝   
🪰 ═══════════════════════════════════════════ 🪰`,
            greeting: "🪰 Муха-трансформатор деревьев - выберите операцию:"
        });

        // Основные операции
        mainTentacle.addTentacle(this.createTableDemo());
        mainTentacle.addTentacle(this.createUntableDemo());
        mainTentacle.addTentacle(this.createTransformDemo());
        mainTentacle.addTentacle(this.createStatsDemo());

        return mainTentacle;
    }

    /**
     * Демо: ASCII → Файловая структура (table)
     */
    private createTableDemo(): Octopus {
        return new Octopus({
            greeting: "📁 Демо: ASCII → Файловая структура (table)",
            action: async () => {
                console.log("🪰 Демонстрация создания файловой структуры из ASCII дерева\n");

                // Демо данные
                const demoAscii = `demo-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Header.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── tests/
│   └── app.test.ts
├── package.json
└── README.md`;

                console.log("📋 Демо ASCII дерево:");
                console.log(demoAscii);

                console.log("\n🔄 Создаю структуру в папке './demo-output'...");

                // Вызываем чистую логику мухи
                const result = this.fly.table(demoAscii, './demo-output', {
                    createReadme: true,
                    createGitignore: true,
                    createStubs: true,
                    overwrite: true
                });

                // Показываем результат
                if (result.success) {
                    console.log("✅ Демо структура создана успешно!");
                    console.log(`📂 Местоположение: ./demo-output`);
                    console.log(`📊 Создано элементов: ${result.metadata?.totalCreated || 0}`);

                    if (result.data && Array.isArray(result.data)) {
                        console.log("\n📋 Созданные элементы:");
                        result.data.forEach(path => console.log(`  • ${path}`));
                    }

                    console.log("\n💡 Проверьте папку demo-output в файловом менеджере!");
                } else {
                    console.log("❌ Ошибка при создании демо структуры:");
                    console.log(`   ${result.error}`);
                }
            }
        });
    }

    /**
     * Демо: Файловая система → ASCII (untable)
     */
    private createUntableDemo(): Octopus {
        return new Octopus({
            greeting: "🌳 Демо: Сканирование текущей папки → ASCII",
            action: async () => {
                console.log("🪰 Демонстрация сканирования папки в ASCII дерево\n");

                console.log("🔄 Сканирую текущую папку '.' (с ограничениями)...");

                // Вызываем чистую логику мухи
                const result = this.fly.untable('.', {
                    showFiles: true,
                    maxDepth: 3,
                    excludeDirs: ['node_modules', '.git', '.idea', 'dist', 'build']
                });

                // Показываем результат
                if (result.success) {
                    console.log("✅ Сканирование завершено!\n");
                    console.log("📋 ASCII структура (первые 50 строк):");

                    const lines = result.data.split('\n');
                    const displayLines = lines.slice(0, 50);
                    console.log(displayLines.join('\n'));

                    if (lines.length > 50) {
                        console.log(`\n... и еще ${lines.length - 50} строк`);
                    }

                    console.log("\n💡 Полную структуру можно сохранить в файл!");
                } else {
                    console.log("❌ Ошибка сканирования:");
                    console.log(`   ${result.error}`);
                }
            }
        });
    }

    /**
     * Демо: Трансформации
     */
    private createTransformDemo(): Octopus {
        const transformMenu = new Octopus({
            greeting: "🔄 Демо: Различные трансформации"
        });

        // ASCII → Markdown
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → Markdown",
            action: async () => {
                console.log("🪰 Демо: Преобразование ASCII в Markdown\n");

                const demoAscii = `project/
├── docs/
│   ├── guide.md
│   └── api.md
├── src/
│   ├── main.ts
│   └── utils.ts
└── package.json`;

                console.log("📋 Исходное ASCII дерево:");
                console.log(demoAscii);

                const result = this.fly.asciiToMarkdown(demoAscii, {
                    maxHeaderLevel: 4,
                    includeFileContent: false
                });

                if (result.success) {
                    console.log("\n✅ Преобразование завершено!");
                    console.log("\n📄 Результат в Markdown:");
                    console.log("```");
                    console.log(result.data);
                    console.log("```");
                } else {
                    console.log(`❌ Ошибка: ${result.error}`);
                }
            }
        }));

        // ASCII → JSON
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → JSON",
            action: async () => {
                console.log("🪰 Демо: Преобразование ASCII в JSON\n");

                const demoAscii = `api/
├── routes/
│   ├── users.js
│   └── posts.js
├── middleware/
│   └── auth.js
└── server.js`;

                console.log("📋 Исходное ASCII дерево:");
                console.log(demoAscii);

                const result = this.fly.asciiToJson(demoAscii);

                if (result.success) {
                    console.log("\n✅ Преобразование завершено!");
                    console.log("\n📄 Результат в JSON:");
                    console.log(JSON.stringify(result.data, null, 2));
                } else {
                    console.log(`❌ Ошибка: ${result.error}`);
                }
            }
        }));

        // ASCII → SVG
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → SVG диаграмма",
            action: async () => {
                console.log("🪰 Демо: Создание SVG диаграммы\n");

                const demoAscii = `website/
├── public/
│   ├── images/
│   └── styles/
├── src/
│   ├── pages/
│   └── components/
└── config.json`;

                console.log("📋 Исходное ASCII дерево:");
                console.log(demoAscii);

                const result = this.fly.asciiToSvg(demoAscii);

                if (result.success) {
                    console.log("\n✅ SVG диаграмма создана!");
                    console.log("💾 Сохраняю в файл demo-tree.svg...");

                    try {
                        const fs = require('fs');
                        fs.writeFileSync('demo-tree.svg', result.data);
                        console.log("✅ SVG сохранен: demo-tree.svg");
                        console.log("💡 Откройте файл в браузере для просмотра диаграммы!");
                    } catch (error) {
                        console.log(`❌ Ошибка сохранения: ${error.message}`);
                        console.log("\n📄 SVG код (первые 300 символов):");
                        console.log(result.data.substring(0, 300) + "...");
                    }
                } else {
                    console.log(`❌ Ошибка: ${result.error}`);
                }
            }
        }));

        return transformMenu;
    }

    /**
     * Демо: Статистика и информация
     */
    private createStatsDemo(): Octopus {
        const statsMenu = new Octopus({
            greeting: "📊 Демо: Статистика и информация"
        });

        // Статистика дерева
        statsMenu.addTentacle(new Octopus({
            greeting: "📊 Анализ статистики дерева",
            action: async () => {
                console.log("📊 Демо: Анализ статистики дерева\n");

                const demoAscii = `large-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── About.tsx
│   │   └── utils/
│   │       └── helpers.ts
│   ├── public/
│   │   └── index.html
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── api.js
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   └── server.js
├── docs/
│   ├── README.md
│   └── CHANGELOG.md
└── docker-compose.yml`;

                console.log("📋 Анализируемое дерево:");
                console.log(demoAscii);

                const stats = this.fly.getTreeStats(demoAscii, 'ascii');

                if (stats) {
                    console.log("\n✅ Статистика дерева:");
                    console.log(`📁 Всего узлов: ${stats.totalNodes}`);
                    console.log(`📄 Файлов: ${stats.filesCount}`);
                    console.log(`📂 Папок: ${stats.directoriesCount}`);
                    console.log(`📏 Максимальная глубина: ${stats.maxDepth}`);
                    console.log(`📐 Средняя глубина: ${stats.averageDepth.toFixed(2)}`);

                    // Дополнительные метрики
                    const ratio = stats.filesCount / stats.directoriesCount;
                    console.log(`⚖️ Соотношение файлы/папки: ${ratio.toFixed(1)}`);

                    if (stats.maxDepth > 5) {
                        console.log("⚠️ Глубокая вложенность - возможно стоит пересмотреть структуру");
                    } else {
                        console.log("✅ Оптимальная глубина структуры");
                    }
                } else {
                    console.log("❌ Не удалось проанализировать данные");
                }
            }
        }));

        // Информация о мухе
        statsMenu.addTentacle(new Octopus({
            greeting: "ℹ️ О мухе-трансформаторе",
            action: async () => {
                console.log("ℹ️ Информация о мухе-трансформаторе\n");

                const formats = this.fly.getAvailableFormats();

                console.log("🪰 Муха-трансформатор v1.0");
                console.log("🌟 Создана в рамках RCD Garden проекта");
                console.log("");
                console.log("📥 Поддерживаемые входные форматы:");
                formats.input.forEach(format => console.log(`  • ${format}`));
                console.log("");
                console.log("📤 Поддерживаемые выходные форматы:");
                formats.output.forEach(format => console.log(`  • ${format}`));
                console.log("");
                console.log("🏗️ Архитектура:");
                console.log("  👁️ Eyes - препроцессоры данных");
                console.log("  🧠 Brain - универсальный парсер");
                console.log("  🦵 Legs - генераторы форматов");
                console.log("  🪰 Fly - координатор трансформаций");
                console.log("");
                console.log("💫 Философия: Один мозг - множество форматов");
                console.log("🌊 Часть экосистемы RCD Garden");
            }
        }));

        return statsMenu;
    }

    /**
     * Статический метод для легкой интеграции
     */
    static createFlyTentacle(): Octopus {
        const squidFly = new SquidFly();
        return squidFly.createFlyTentacle();
    }
}

/**
 * Простая функция для добавления мухи в любой осьминог
 */
export function addFlyToOctopus(octopus: Octopus): void {
    octopus.addTentacle(SquidFly.createFlyTentacle());
}

// Пример использования для тестирования
if (require.main === module) {
    async function runFlyDemo() {
        console.log("🪰 Запуск демо мухи...\n");

        // Создаем тестовый осьминог с мухой
        const testOctopus = new Octopus({
            greeting: "🌊 Аквариум с мухой - демо режим"
        });

        addFlyToOctopus(testOctopus);

        console.log("🎯 Автоматически запускаю все демо...\n");

        // Получаем муху
        const flyTentacle = testOctopus.getTentacle(0); // Муха - первое щупальце

        if (flyTentacle) {
            console.log("🪰 === ДЕМОНСТРАЦИЯ ВСЕХ ВОЗМОЖНОСТЕЙ МУХИ === 🪰\n");

            // Показываем логотип мухи
            flyTentacle.showLogo();
            flyTentacle.showGreeting();
            console.log("");
            flyTentacle.showTentacleMenu();

            console.log("\n🔄 Запускаю все демо автоматически...\n");

            // Выполняем все демо по очереди
            for (let i = 0; i < flyTentacle.tentacles.length; i++) {
                const demo = flyTentacle.tentacles[i];

                console.log(`\n${"=".repeat(60)}`);
                console.log(`🧪 ДЕМО ${i + 1}: ${demo.greeting}`);
                console.log(`${"=".repeat(60)}`);

                if (demo.isExecutor()) {
                    await demo.execute();
                } else if (demo.isCoordinator()) {
                    console.log("📂 Это меню с подопциями, выполняю все:");

                    for (let j = 0; j < demo.tentacles.length; j++) {
                        const subDemo = demo.tentacles[j];
                        console.log(`\n  🔸 Подменю ${j + 1}: ${subDemo.greeting}`);
                        if (subDemo.isExecutor()) {
                            await subDemo.execute();
                        }
                    }
                }

                // Пауза между демо
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`\n${"=".repeat(60)}`);
            console.log("🎉 ВСЕ ДЕМО МУХИ ЗАВЕРШЕНЫ УСПЕШНО! 🎉");
            console.log("🪰 Муха показала все свои возможности!");
            console.log(`${"=".repeat(60)}`);
        } else {
            console.log("❌ Не удалось найти муху в аквариуме");
        }
    }

    runFlyDemo().catch(console.error);
}