/**
 * 🦑 SquidInteractive - Интерактивный кальмар для мухи
 *
 * ИСПРАВЛЕННАЯ версия с правильным readline
 * Использует ОДИН глобальный интерфейс без конфликтов
 */

import * as readline from 'readline';
import { Octopus } from './octopus_base';
import { Fly } from './creatures/fly/fly_base';
import { TreeFormat } from './creatures/fly/fly_interfaces';
import * as fs from 'fs'; // Добавил импорт fs для saveToFile

// === ПЕРЕМЕЩЕННЫЕ ИМПОРТЫ ===
import { Brain } from './creatures/fly/fly_brain';
import { EyeFactory } from './creatures/fly/fly_eyes';
import { LegFactory } from './creatures/fly/fly_legs';
// ============================

export class SquidInteractive {
    private fly: Fly;
    private rl: readline.Interface;
    private currentOctopus: Octopus;
    private navigationStack: Octopus[] = [];
    private isRunning: boolean = false;

    constructor() {
        this.fly = new Fly();

        // ОДИН readline интерфейс для всего
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.currentOctopus = this.createFlyOctopus();
        this.navigationStack = [this.currentOctopus];
    }

    /**
     * Создать интерактивного осьминога с мухой
     */
    private createFlyOctopus(): Octopus {
        const mainOctopus = new Octopus({
            logo: `
🦑 ═══════════════════════════════════════════ 🦑
    ИНТЕРАКТИВНЫЙ КАЛЬМАР С МУХОЙ
🦑 ═══════════════════════════════════════════ 🦑`,
            greeting: "🦑 Интерактивный режим - выберите операцию:"
        });

        // Основные операции мухи
        mainOctopus.addTentacle(this.createTableTentacle());
        mainOctopus.addTentacle(this.createUntableTentacle());
        mainOctopus.addTentacle(this.createTransformTentacle());
        mainOctopus.addTentacle(this.createUtilitiesTentacle());

        return mainOctopus;
    }

    /**
     * ASCII → Файловая структура
     */
    private createTableTentacle(): Octopus {
        return new Octopus({
            greeting: "📁 ASCII → Файловая структура (table)",
            action: async () => {
                console.log("📁 Создание файловой структуры из ASCII дерева\n");

                try {
                    // Получаем ASCII дерево
                    const asciiInput = await this.askMultilineInput("Введите ASCII дерево (завершите пустой строкой):");
                    if (!asciiInput.trim()) {
                        console.log("❌ ASCII дерево не может быть пустым");
                        return;
                    }

                    // Получаем путь назначения
                    const outputPath = await this.askInput("Путь для создания структуры [./output]:");
                    const finalOutputPath = outputPath.trim() || './output';

                    // Дополнительные опции
                    console.log("\n🔧 Дополнительные опции:");
                    const createReadme = await this.askYesNo("Создать README.md?", true);
                    const createGitignore = await this.askYesNo("Создать .gitignore?", true);
                    const createStubs = await this.askYesNo("Заполнить пустые файлы заглушками?", false);
                    const overwrite = await this.askYesNo("Перезаписать существующие файлы?", false);

                    console.log("\n🔄 Обработка...");

                    // Вызываем муху
                    const result = this.fly.table(asciiInput, finalOutputPath, {
                        createReadme,
                        createGitignore,
                        createStubs,
                        overwrite
                    });

                    // Показываем результат
                    this.showResult(result, "Файловая структура");

                } catch (error) {
                    console.log(`❌ Произошла ошибка: ${error.message}`);
                }
            }
        });
    }

    /**
     * Вспомогательный метод для запроса пути и опций сканирования ФС
     */
    private async askUntableOptions(): Promise<{ finalPath: string, options: { maxDepth?: number, showFiles: boolean, excludeDirs: string[] } }> {
        const inputPath = await this.askInput("Введите путь к директории или файлу для сканирования [./]:");
        const finalPath = inputPath.trim() || './';

        console.log("\n🔧 Опции сканирования:");
        const maxDepthInput = await this.askInput("Максимальная глубина сканирования (0 = без ограничений) [0]:");
        const maxDepth = parseInt(maxDepthInput.trim());

        const showFiles = await this.askYesNo("Показывать файлы в результатах сканирования?", true);

        const excludeInput = await this.askInput("Исключить директории/файлы (через запятую, например: node_modules,.git) [node_modules,.git]:");
        const excludeDirs = excludeInput.trim()
            ? excludeInput.split(',').map(d => d.trim())
            : ['node_modules', '.git'];

        return {
            finalPath,
            options: {
                maxDepth: isNaN(maxDepth) || maxDepth <= 0 ? undefined : maxDepth, // Если не число или 0, то undefined
                showFiles,
                excludeDirs
            }
        };
    }

    /**
     * Файловая система → различные форматы
     */

    private createUntableTentacle(): Octopus {
        const untableMenu = new Octopus({
            greeting: "🌳 Файловая система → различные форматы"
        });

        // FS → ASCII
        untableMenu.addTentacle(new Octopus({
            greeting: "Файловая система → ASCII дерево",
            action: async () => {
                console.log("🌳 Сканирование файловой структуры в ASCII\n");
                try {
                    const { finalPath, options } = await this.askUntableOptions();
                    console.log("\n🔄 Сканирование...");
                    const result = this.fly.untable(finalPath, options);

                    if (result.success && typeof result.data === 'string') {
                        console.log("✅ Сканирование завершено!\n");
                        console.log("📊 ASCII-структура директории:");
                        console.log(result.data);
                        const save = await this.askYesNo("\nСохранить в файл?", false);
                        if (save) {
                            const fileName = await this.askInput("Имя файла [tree.txt]:");
                            await this.saveToFile(result.data, fileName.trim() || 'tree.txt');
                        }
                    } else {
                        console.log(`❌ Ошибка: ${result.error || 'Некорректный формат данных'}`);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.log(`❌ Произошла ошибка: ${message}`);
                }
            }
        }));

        // FS → JSON
        untableMenu.addTentacle(new Octopus({
            greeting: "Файловая система → JSON",
            action: async () => {
                console.log("📄 Сканирование файловой структуры в JSON\n");
                try {
                    const { finalPath, options } = await this.askUntableOptions();
                    console.log("\n🔄 Сканирование и преобразование в JSON...");

                    // Шаг 1: FS -> Абстрактное дерево (через Brain)
                    // Мы не можем напрямую использовать fly.untable, так как он возвращает ASCII.
                    // Нам нужно получить абстрактное дерево из файловой системы.
                    const eye = EyeFactory.create('filesystem');
                    const cleanPath = eye.clean(finalPath); // Eye для filesystem просто очищает путь
                    const brain = new Brain(); // Нужен экземпляр Brain
                    const abstractTree = brain.parseToAbstract(cleanPath, 'filesystem');

                    // Шаг 2: Абстрактное дерево -> JSON (через JsonLeg)
                    const jsonLeg = LegFactory.create('json');
                    const jsonResult = jsonLeg.generate(abstractTree, options); // Передаем опции, если JsonLeg их использует

                    // JsonLeg.generate возвращает TransformResult, поэтому проверяем его
                    if (jsonResult.success) {
                        console.log("✅ Преобразование завершено!\n");
                        console.log("📄 Структура в JSON:");
                        console.log(JSON.stringify(jsonResult.data, null, 2));
                        const save = await this.askYesNo("\nСохранить в файл?", false);
                        if (save) {
                            await this.saveToFile(JSON.stringify(jsonResult.data, null, 2), "structure.json");
                        }
                    } else {
                        console.log(`❌ Ошибка преобразования в JSON: ${jsonResult.error}`);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.log(`❌ Произошла ошибка: ${message}`);
                }
            }
        }));

        // FS → Markdown
        untableMenu.addTentacle(new Octopus({
            greeting: "Файловая система → Markdown",
            action: async () => {
                console.log("📄 Сканирование файловой структуры в Markdown\n");
                try {
                    const { finalPath, options } = await this.askUntableOptions();
                    console.log("\n🔄 Сканирование и преобразование в Markdown...");

                    const eye = EyeFactory.create('filesystem');
                    const cleanPath = eye.clean(finalPath);
                    const brain = new Brain();
                    const abstractTree = brain.parseToAbstract(cleanPath, 'filesystem');

                    const mdLeg = LegFactory.create('markdown');
                    const mdResult = mdLeg.generate(abstractTree, { ...options, includeFileContent: false }); // Пример опции для MarkdownLeg

                    if (mdResult.success && typeof mdResult.data === 'string') {
                        console.log("✅ Преобразование завершено!\n");
                        console.log("📄 Структура в Markdown:");
                        console.log("```markdown");
                        console.log(mdResult.data);
                        console.log("```");
                        const save = await this.askYesNo("\nСохранить в файл?", false);
                        if (save) {
                            await this.saveToFile(mdResult.data, "structure.md");
                        }
                    } else {
                        console.log(`❌ Ошибка преобразования в Markdown: ${mdResult.error || 'Некорректный формат данных'}`);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.log(`❌ Произошла ошибка: ${message}`);
                }
            }
        }));

        // FS → SVG диаграмма
        untableMenu.addTentacle(new Octopus({
            greeting: "Файловая система → SVG диаграмма",
            action: async () => {
                console.log("🎨 Создание SVG диаграммы файловой структуры\n");
                try {
                    const { finalPath, options } = await this.askUntableOptions();
                    console.log("\n🔄 Сканирование и создание диаграммы...");

                    const eye = EyeFactory.create('filesystem');
                    const cleanPath = eye.clean(finalPath);
                    const brain = new Brain();
                    const abstractTree = brain.parseToAbstract(cleanPath, 'filesystem');

                    const svgLeg = LegFactory.create('svg');
                    const svgResult = svgLeg.generate(abstractTree, options); // Передаем опции, если SvgLeg их использует

                    if (svgResult.success && typeof svgResult.data === 'string') {
                        console.log("✅ SVG диаграмма создана!");
                        const fileName = await this.askInput("Имя файла [structure.svg]:");
                        await this.saveToFile(svgResult.data, fileName.trim() || 'structure.svg');
                        console.log("💡 Откройте файл в браузере для просмотра!");
                    } else {
                        console.log(`❌ Ошибка создания SVG: ${svgResult.error || 'Некорректный формат данных'}`);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.log(`❌ Произошла ошибка: ${message}`);
                }
            }
        }));

        return untableMenu;
    }

    /**
     * Различные трансформации
     */
    private createTransformTentacle(): Octopus {
        const transformMenu = new Octopus({
            greeting: "🔄 Трансформации форматов"
        });

        // ASCII → Markdown
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → Markdown",
            action: async () => {
                console.log("📄 Преобразование ASCII в Markdown\n");

                try {
                    const input = await this.askMultilineInput("Введите ASCII дерево:");
                    if (!input.trim()) return;

                    const maxHeaderLevel = await this.askNumber("Максимальный уровень заголовков [6]:", 6);
                    const includeFileContent = await this.askYesNo("Включать содержимое файлов?", false);

                    console.log("\n🔄 Преобразование...");

                    const result = this.fly.asciiToMarkdown(input, { maxHeaderLevel, includeFileContent });

                    if (result.success) {
                        console.log("✅ Преобразование завершено!\n");
                        console.log("📄 Результат в Markdown:");
                        console.log("```");
                        console.log(result.data);
                        console.log("```");

                        const save = await this.askYesNo("\nСохранить в файл?", false);
                        if (save) {
                            await this.saveToFile(result.data, "tree.md");
                        }
                    } else {
                        console.log(`❌ Ошибка: ${result.error}`);
                    }
                } catch (error) {
                    console.log(`❌ Произошла ошибка: ${error.message}`);
                }
            }
        }));

        // ASCII → JSON
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → JSON",
            action: async () => {
                console.log("📄 Преобразование ASCII в JSON\n");

                try {
                    const input = await this.askMultilineInput("Введите ASCII дерево:");
                    if (!input.trim()) return;

                    console.log("\n🔄 Преобразование...");

                    const result = this.fly.asciiToJson(input);

                    if (result.success) {
                        console.log("✅ Преобразование завершено!\n");
                        console.log("📄 Результат в JSON:");
                        console.log(JSON.stringify(result.data, null, 2));

                        const save = await this.askYesNo("\nСохранить в файл?", false);
                        if (save) {
                            await this.saveToFile(JSON.stringify(result.data, null, 2), "tree.json");
                        }
                    } else {
                        console.log(`❌ Ошибка: ${result.error}`);
                    }
                } catch (error) {
                    console.log(`❌ Произошла ошибка: ${error.message}`);
                }
            }
        }));

        // ASCII → SVG
        transformMenu.addTentacle(new Octopus({
            greeting: "ASCII → SVG диаграмма",
            action: async () => {
                console.log("🎨 Создание SVG диаграммы из ASCII\n");

                try {
                    const input = await this.askMultilineInput("Введите ASCII дерево:");
                    if (!input.trim()) return;

                    console.log("\n🔄 Создание диаграммы...");

                    const result = this.fly.asciiToSvg(input);

                    if (result.success) {
                        console.log("✅ SVG диаграмма создана!");

                        const fileName = await this.askInput("Имя файла [tree.svg]:");
                        const finalFileName = fileName.trim() || 'tree.svg';

                        await this.saveToFile(result.data, finalFileName);
                        console.log("💡 Откройте файл в браузере для просмотра!");
                    } else {
                        console.log(`❌ Ошибка: ${result.error}`);
                    }
                } catch (error) {
                    console.log(`❌ Произошла ошибка: ${error.message}`);
                }
            }
        }));

        return transformMenu;
    }

    /**
     * Утилиты и информация
     */
    private createUtilitiesTentacle(): Octopus {
        const utilitiesMenu = new Octopus({
            greeting: "🛠️ Утилиты и информация"
        });

        // Статистика дерева
        utilitiesMenu.addTentacle(new Octopus({
            greeting: "📊 Статистика дерева",
            action: async () => {
                console.log("📊 Анализ статистики дерева\n");

                try {
                    const formats = this.fly.getAvailableFormats().input;
                    console.log("📥 Доступные форматы:", formats.join(', '));

                    const formatInput = await this.askInput("Формат данных [ascii]:");
                    const format = (formatInput.trim() || 'ascii') as TreeFormat;

                    const input = await this.askMultilineInput("Введите данные для анализа:");
                    if (!input.trim()) return;

                    console.log("\n🔄 Анализ...");

                    const stats = this.fly.getTreeStats(input, format);

                    if (stats) {
                        console.log("✅ Статистика дерева:");
                        console.log(`📁 Всего узлов: ${stats.totalNodes}`);
                        console.log(`📄 Файлов: ${stats.filesCount}`);
                        console.log(`📂 Папок: ${stats.directoriesCount}`);
                        console.log(`📏 Максимальная глубина: ${stats.maxDepth}`);
                        console.log(`📐 Средняя глубина: ${stats.averageDepth.toFixed(2)}`);

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
                } catch (error) {
                    console.log(`❌ Произошла ошибка: ${error.message}`);
                }
            }
        }));

        // Информация о мухе
        utilitiesMenu.addTentacle(new Octopus({
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

        return utilitiesMenu;
    }

    /**
     * ИСПРАВЛЕННЫЕ методы ввода - используют ОДИН rl интерфейс
     */
    private askInput(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question + ' ', (answer: string) => {
                resolve(answer);
            });
        });
    }

    private askMultilineInput(question: string): Promise<string> {
        return new Promise((resolve) => {
            console.log(question);
            console.log("(Введите данные построчно, завершите пустой строкой)");

            const lines: string[] = [];

            const handleLine = (line: string) => {
                if (line.trim() === '') {
                    this.rl.removeListener('line', handleLine);
                    resolve(lines.join('\n'));
                } else {
                    lines.push(line);
                }
            };

            this.rl.on('line', handleLine);
        });
    }

    private askYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
        return new Promise((resolve) => {
            const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
            this.rl.question(`${question} ${defaultText} `, (answer: string) => {
                const trimmed = answer.trim().toLowerCase();
                if (trimmed === '') {
                    resolve(defaultValue);
                } else {
                    resolve(trimmed === 'y' || trimmed === 'yes');
                }
            });
        });
    }

    private askNumber(question: string, defaultValue: number): Promise<number> {
        return new Promise((resolve) => {
            this.rl.question(`${question} `, (answer: string) => {
                const parsed = parseInt(answer.trim());
                resolve(isNaN(parsed) ? defaultValue : parsed);
            });
        });
    }

    /**
     * Сохранение в файл
     */
    private async saveToFile(content: string, fileName: string): Promise<void> {
        try {
            const fs = require('fs');
            fs.writeFileSync(fileName, content);
            console.log(`💾 Сохранено в файл: ${fileName}`);
        } catch (error) {
            console.log(`❌ Ошибка сохранения: ${error.message}`);
        }
    }

    /**
     * Показать результат операции
     */
    private showResult(result: any, operationName: string): void {
        if (result.success) {
            console.log(`✅ ${operationName} создана успешно!`);
            if (result.metadata?.outputPath) {
                console.log(`📂 Местоположение: ${result.metadata.outputPath}`);
            }
            if (result.metadata?.totalCreated) {
                console.log(`📊 Создано элементов: ${result.metadata.totalCreated}`);
            }

            if (result.data && Array.isArray(result.data)) {
                console.log("\n📋 Созданные элементы:");
                result.data.slice(0, 10).forEach(path => console.log(`  • ${path}`));
                if (result.data.length > 10) {
                    console.log(`  ... и еще ${result.data.length - 10} элементов`);
                }
            }
        } else {
            console.log(`❌ Ошибка при создании ${operationName.toLowerCase()}:`);
            console.log(`   ${result.error}`);
        }
    }

    /**
     * Запуск интерактивного CLI (упрощенная версия)
     */
    async start(): Promise<void> {
        this.isRunning = true;
        console.clear();

        console.log("🦑 === ИНТЕРАКТИВНЫЙ КАЛЬМАР ЗАПУЩЕН === 🦑\n");

        // Показываем главное меню
        this.currentOctopus.showLogo();
        this.currentOctopus.showGreeting();
        console.log("");
        this.currentOctopus.showTentacleMenu();

        await this.handleMainMenu();
    }

    /**
     * Обработка главного меню
     */
    private async handleMainMenu(): Promise<void> {
        try {
            console.log("\n🧭 Навигация: 'q' - выход, 'h' - помощь");
            const choice = await this.askInput("Выберите пункт меню:");

            if (choice.toLowerCase() === 'q') {
                await this.quit();
                return;
            }

            if (choice.toLowerCase() === 'h') {
                this.showHelp();
                await this.handleMainMenu();
                return;
            }

            const tentacleIndex = parseInt(choice) - 1;
            const selectedTentacle = this.currentOctopus.getTentacle(tentacleIndex);

            if (selectedTentacle) {
                await this.executeTentacle(selectedTentacle);
                await this.handleMainMenu();
            } else {
                console.log("❌ Неверный выбор");
                await this.handleMainMenu();
            }
        } catch (error) {
            console.log(`❌ Ошибка: ${error.message}`);
            await this.handleMainMenu();
        }
    }

    /**
     * Выполнить щупальце
     */
    private async executeTentacle(tentacle: Octopus): Promise<void> {
        console.clear();

        if (tentacle.isExecutor()) {
            await tentacle.execute();
            console.log("\n" + "=".repeat(50));
            await this.askInput("Нажмите Enter для продолжения...");
        } else if (tentacle.isCoordinator()) {
            // Подменю
            tentacle.showGreeting();
            console.log("");
            tentacle.showTentacleMenu();

            const choice = await this.askInput("\nВыберите пункт подменю (или 'b' для возврата):");

            if (choice.toLowerCase() !== 'b') {
                const subIndex = parseInt(choice) - 1;
                const subTentacle = tentacle.getTentacle(subIndex);

                if (subTentacle) {
                    await this.executeTentacle(subTentacle);
                } else {
                    console.log("❌ Неверный выбор");
                    await this.askInput("Нажмите Enter для продолжения...");
                }
            }
        }
    }

    /**
     * Показать справку
     */
    private showHelp(): void {
        console.log("\n🆘 === СПРАВКА === 🆘");
        console.log("🦑 Интерактивный кальмар для работы с мухой-трансформатором");
        console.log("");
        console.log("📋 Команды:");
        console.log("  1-9 - выбор пункта меню");
        console.log("  'q' - выход из программы");
        console.log("  'h' - показать справку");
        console.log("  'b' - возврат в подменю");
        console.log("");
        console.log("🪰 Возможности мухи:");
        console.log("  • Создание файловых структур из ASCII");
        console.log("  • Преобразование в различные форматы");
        console.log("  • Анализ и статистика");
        console.log("  • SVG диаграммы");
    }

    /**
     * Завершение работы
     */
    private async quit(): Promise<void> {
        console.log("\n🦑 Спасибо за использование интерактивного кальмара!");
        console.log("🪰 Все мухи возвращаются в аквариум...");
        console.log("👋 До свидания!");

        this.rl.close();
        process.exit(0);
    }
}

// Запуск интерактивного режима
if (require.main === module) {
    async function runInteractive() {
        const squid = new SquidInteractive();
        await squid.start();
    }

    runInteractive().catch(console.error);
}