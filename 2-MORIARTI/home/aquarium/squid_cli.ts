/**
 * 🦑 Интерактивный CLI Кальмар
 *
 * Создает интерактивный интерфейс для работы с осьминогами
 * Обрабатывает пользовательский ввод и навигацию по меню
 */

import * as readline from 'readline';
import { Octopus } from './octopus_base';
import { CrabTestOctopus } from './crab_test_octopus';

export class SquidCLI {
    private rl: readline.Interface;
    private currentOctopus: Octopus;
    private navigationStack: Octopus[] = [];
    private isRunning: boolean = false;

    constructor(rootOctopus: Octopus) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.currentOctopus = rootOctopus;
        this.navigationStack = [rootOctopus];
    }

    /**
     * Запустить интерактивный CLI
     */
    async start(): Promise<void> {
        this.isRunning = true;
        console.clear();

        // Красивая анимация загрузки
        await this.showStartupAnimation();

        await this.showCurrentMenu();
    }

    /**
     * Красивая анимация запуска
     */
    private async showStartupAnimation(): Promise<void> {
        const colors = {
            cyan: '\x1b[36m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            red: '\x1b[31m',
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m'
        };

        console.log(colors.cyan + colors.bright + `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🌊  ██████╗  ██████╗██████╗     ██████╗ ██╗     ██╗  🌊   ║
║   🐙   ██╔══██╗██╔════╝██╔══██╗   ██╔════╝██║     ██║   🐙  ║
║  🦑    ██████╔╝██║     ██║  ██║   ██║     ██║     ██║    🦑 ║
║   🐙   ██╔══██╗██║     ██║  ██║   ██║     ██║     ██║   🐙  ║
║    🌊  ██║  ██║╚██████╗██████╔╝   ╚██████╗███████╗██║  🌊   ║
║       ╚═╝  ╚═╝ ╚═════╝╚═════╝     ╚═════╝╚══════╝╚═╝       ║
║                                                              ║
║           ${colors.yellow}🦑 КАЛЬМАР CLI АКТИВИРУЕТСЯ 🦑${colors.cyan}            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
` + colors.reset);

        // Анимация загрузки
        const loadingSteps = [
            "🔄 Инициализация осьминогов...",
            "🌊 Заполнение аквариума...",
            "🐙 Активация щупалец...",
            "✨ Применение морской магии...",
            "🎮 CLI готов к использованию!"
        ];

        for (let i = 0; i < loadingSteps.length; i++) {
            process.stdout.write(colors.dim + "   " + loadingSteps[i] + colors.reset);
            await this.delay(300);

            // Добавляем точки
            for (let j = 0; j < 3; j++) {
                process.stdout.write(colors.green + "." + colors.reset);
                await this.delay(200);
            }

            console.log(colors.green + " ✓" + colors.reset);
        }

        await this.delay(500);
        console.clear();
    }

    /**
     * Показать текущее меню и обработать ввод
     */
    private async showCurrentMenu(): Promise<void> {
        if (!this.isRunning) return;

        // Красивый заголовок с рамкой
        this.drawMenuFrame();

        if (this.currentOctopus.isExecutor()) {
            // Это исполнитель - выполняем действие
            console.log(this.colorize("🦾 Выполняю действие...\n", 'yellow'));
            await this.currentOctopus.execute();

            this.drawSeparator();
            console.log(this.colorize("✨ Действие завершено! ✨", 'green'));
            console.log(this.colorize("Нажмите Enter для продолжения...", 'dim'));

            await this.waitForEnter();
            await this.goBack();

        } else if (this.currentOctopus.isCoordinator()) {
            // Это координатор - показываем красивое меню
            this.showBeautifulMenu();
            await this.handleMenuInput();

        } else {
            // Пустой осьминог
            console.log(this.colorize("🤔 Этот осьминог пока не знает, что делать...", 'yellow'));
            console.log(this.colorize("Нажмите Enter для возврата...", 'dim'));

            await this.waitForEnter();
            await this.goBack();
        }
    }

    /**
     * Красивая рамка для меню
     */
    private drawMenuFrame(): void {
        const width = 70;
        const title = "🐙 RCD AQUARIUM CLI 🐙";
        const padding = Math.max(0, Math.floor((width - title.length) / 2));

        console.log(this.colorize("╔" + "═".repeat(width) + "╗", 'cyan'));
        console.log(this.colorize("║" + " ".repeat(padding) + title + " ".repeat(width - padding - title.length) + "║", 'cyan'));
        console.log(this.colorize("╠" + "═".repeat(width) + "╣", 'cyan'));

        // Показываем логотип если есть
        if (this.currentOctopus.logo) {
            const logoLines = this.currentOctopus.logo.split('\n');
            logoLines.forEach(line => {
                const paddedLine = line.padEnd(width);
                console.log(this.colorize("║", 'cyan') + this.colorize(paddedLine, 'blue') + this.colorize("║", 'cyan'));
            });
            console.log(this.colorize("╠" + "═".repeat(width) + "╣", 'cyan'));
        }

        // Показываем приветствие
        if (this.currentOctopus.greeting) {
            const greetingLine = " " + this.currentOctopus.greeting;
            const paddedGreeting = greetingLine.padEnd(width);
            console.log(this.colorize("║", 'cyan') + this.colorize(paddedGreeting, 'bright') + this.colorize("║", 'cyan'));
            console.log(this.colorize("╠" + "═".repeat(width) + "╣", 'cyan'));
        }

        console.log(this.colorize("╚" + "═".repeat(width) + "╝", 'cyan'));
        console.log("");
    }

    /**
     * Красивое меню со щупальцами
     */
    private showBeautifulMenu(): void {
        console.log(this.colorize("🎯 Доступные действия:", 'magenta'));
        console.log("");

        this.currentOctopus.tentacles.forEach((tentacle, index) => {
            const number = (index + 1).toString().padStart(2, ' ');
            const displayText = tentacle.greeting || `Щупальце ${index + 1}`;
            const icon = tentacle.isExecutor() ? "🦾" : tentacle.isCoordinator() ? "🐙" : "❓";
            const type = tentacle.isExecutor() ? "исполнитель" : tentacle.isCoordinator() ? "меню" : "пустой";

            console.log(
                this.colorize("  ", 'cyan') +
                this.colorize(`[${number}]`, 'yellow') + " " +
                this.colorize(icon, 'none') + " " +
                this.colorize(displayText, 'bright') +
                this.colorize(` (${type})`, 'dim')
            );
        });

        console.log("");
        this.drawSeparator();
        this.showNavigationHints();
    }

    /**
     * Показать подсказки по навигации
     */
    private showNavigationHints(): void {
        console.log(this.colorize("🧭 Навигация:", 'cyan'));

        const hints = [];

        if (this.navigationStack.length > 1) {
            hints.push(this.colorize("'b'", 'yellow') + this.colorize(" или ", 'dim') + this.colorize("'back'", 'yellow') + this.colorize(" - вернуться назад", 'none'));
        }

        hints.push(this.colorize("'h'", 'yellow') + this.colorize(" или ", 'dim') + this.colorize("'help'", 'yellow') + this.colorize(" - показать структуру", 'none'));
        hints.push(this.colorize("'q'", 'yellow') + this.colorize(" или ", 'dim') + this.colorize("'quit'", 'yellow') + this.colorize(" - выйти из программы", 'red'));

        hints.forEach(hint => {
            console.log("  " + hint);
        });

        console.log("");

        // Красивая строка ввода
        const breadcrumb = this.getBreadcrumb();
        console.log(this.colorize("🌊 " + breadcrumb + " ", 'cyan') + this.colorize("→", 'magenta'));
        process.stdout.write(this.colorize("   Ваш выбор: ", 'bright'));
    }

    /**
     * Обработать ввод пользователя в меню
     */
    private async handleMenuInput(): Promise<void> {
        const input = await this.askInput();
        const trimmed = input.trim().toLowerCase();

        // Команды навигации
        if (trimmed === 'q' || trimmed === 'quit') {
            await this.quit();
            return;
        }

        if (trimmed === 'b' || trimmed === 'back') {
            await this.goBack();
            return;
        }

        if (trimmed === 'h' || trimmed === 'help') {
            await this.showHelp();
            return;
        }

        // Попытка парсинга как номер щупальца
        const tentacleIndex = parseInt(trimmed) - 1;

        if (isNaN(tentacleIndex)) {
            console.log(this.colorize("❌ Неверный ввод!", 'red') + this.colorize(" Используйте цифры или команды.", 'dim'));
            await this.waitForEnter();
            console.clear();
            await this.showCurrentMenu();
            return;
        }

        const selectedTentacle = this.currentOctopus.getTentacle(tentacleIndex);

        if (!selectedTentacle) {
            console.log(this.colorize(`❌ Щупальце #${tentacleIndex + 1} не существует.`, 'red'));
            await this.waitForEnter();
            console.clear();
            await this.showCurrentMenu();
            return;
        }

        // Красивая анимация перехода
        console.log(this.colorize(`🌊 Переход к щупальцу #${tentacleIndex + 1}...`, 'cyan'));
        await this.delay(300);

        // Переходим к выбранному щупальцу
        await this.navigateToTentacle(selectedTentacle);
    }

    /**
     * Перейти к выбранному щупальцу
     */
    private async navigateToTentacle(tentacle: Octopus): Promise<void> {
        this.navigationStack.push(tentacle);
        this.currentOctopus = tentacle;

        console.clear();
        await this.showCurrentMenu();
    }

    /**
     * Вернуться назад по навигации
     */
    private async goBack(): Promise<void> {
        if (this.navigationStack.length > 1) {
            this.navigationStack.pop();
            this.currentOctopus = this.navigationStack[this.navigationStack.length - 1];

            console.clear();
            await this.showCurrentMenu();
        } else {
            console.log("🏠 Вы уже в корневом меню.");
            await this.waitForEnter();
            console.clear();
            await this.showCurrentMenu();
        }
    }

    /**
     * Показать справку и структуру
     */
    private async showHelp(): Promise<void> {
        console.clear();

        // Красивый заголовок справки
        console.log(this.colorize(`
╔═══════════════════════════════════════════════════════════╗
║                    🆘 СПРАВОЧНАЯ СИСТЕМА 🆘                ║
╚═══════════════════════════════════════════════════════════╝
`, 'yellow'));

        console.log(this.colorize("🗂️ Полная структура экосистемы:", 'cyan'));
        console.log("");

        const rootOctopus = this.navigationStack[0];
        this.printColorfulStructure(rootOctopus);

        console.log("");
        console.log(this.colorize("📍 Ваше текущее местоположение:", 'magenta'));
        console.log(this.colorize(`   Уровень навигации: ${this.navigationStack.length}`, 'dim'));
        console.log("");

        this.navigationStack.forEach((octopus, index) => {
            const name = octopus.greeting || "Безымянный осьминог";
            const indent = "  ".repeat(index);
            const arrow = index === this.navigationStack.length - 1 ? "👉" : "  ";
            const color = index === this.navigationStack.length - 1 ? 'yellow' : 'dim';
            console.log(indent + this.colorize(arrow + " " + name, color));
        });

        this.drawSeparator();
        console.log(this.colorize("Нажмите Enter для возврата в меню...", 'green'));
        await this.waitForEnter();

        console.clear();
        await this.showCurrentMenu();
    }

    /**
     * Завершить работу CLI
     */
    private async quit(): Promise<void> {
        console.clear();

        // Красивая анимация выхода
        const exitAnimation = [
            "🌊 Осьминоги возвращаются в океан...",
            "🐙 Щупальца складываются...",
            "🦑 Кальмар погружается в глубину...",
            "✨ Морская магия рассеивается...",
        ];

        console.log(this.colorize(`
╔══════════════════════════════════════════════════════════════╗
║               🦑 КАЛЬМАР CLI ЗАВЕРШАЕТ РАБОТУ 🦑              ║
╚══════════════════════════════════════════════════════════════╝
`, 'cyan'));

        for (const message of exitAnimation) {
            console.log(this.colorize("   " + message, 'blue'));
            await this.delay(400);
        }

        console.log(this.colorize(`
   💙 Спасибо за использование RCD Aquarium! 💙
   
   🌊 Все ваши осьминоги в безопасности 🌊
   
   ✨ До встречи в океане кода! ✨
   
`, 'green'));

        this.isRunning = false;
        this.rl.close();
    }

    /**
     * Получить ввод от пользователя
     */
    private askInput(): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question('', (answer) => {
                resolve(answer);
            });
        });
    }

    /**
     * Ждать нажатия Enter
     */
    private waitForEnter(): Promise<void> {
        return new Promise((resolve) => {
            this.rl.question('', () => {
                resolve();
            });
        });
    }

    /**
     * Утилита задержки для анимаций
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Раскрасить текст
     */
    private colorize(text: string, color: string): string {
        const colors: { [key: string]: string } = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };

        if (color === 'none' || !colors[color]) {
            return text;
        }

        return colors[color] + text + colors.reset;
    }

    /**
     * Нарисовать красивый разделитель
     */
    private drawSeparator(): void {
        console.log(this.colorize("─".repeat(70), 'dim'));
    }

    /**
     * Получить хлебные крошки навигации
     */
    private getBreadcrumb(): string {
        const names = this.navigationStack.map(octopus => {
            const name = octopus.greeting || "Безымянный";
            return name.length > 15 ? name.substring(0, 12) + "..." : name;
        });

        return names.join(" → ");
    }

    /**
     * Красивый вывод структуры с цветами
     */
    private printColorfulStructure(octopus: Octopus, depth: number = 0, prefix: string = ""): void {
        const indent = "  ".repeat(depth);
        const icon = octopus.isCoordinator() ? "🐙" :
            octopus.isExecutor() ? "🦾" : "❓";

        const name = octopus.greeting || "Безымянный осьминог";
        const color = octopus.isCoordinator() ? 'cyan' :
            octopus.isExecutor() ? 'green' : 'yellow';

        console.log(indent + this.colorize(prefix + icon + " " + name, color));

        octopus.tentacles.forEach((tentacle, index) => {
            const isLast = index === octopus.tentacles.length - 1;
            const newPrefix = isLast ? "└── " : "├── ";
            this.printColorfulStructure(tentacle, depth + 1, newPrefix);
        });
    }

    /**
     * Создать CLI с тестовой экосистемой от краба
     */
    static createTestCLI(): SquidCLI {
        const crabTest = new CrabTestOctopus();
        const rootOctopus = crabTest.getMainOctopus();

        return new SquidCLI(rootOctopus);
    }

    /**
     * Создать CLI с кастомным осьминогом
     */
    static createCustomCLI(rootOctopus: Octopus): SquidCLI {
        return new SquidCLI(rootOctopus);
    }
}

// Запуск тестового CLI при прямом вызове файла
if (require.main === module) {
    async function runTestCLI() {
        try {
            const squidCLI = SquidCLI.createTestCLI();
            await squidCLI.start();
        } catch (error) {
            console.error('❌ Ошибка в CLI:', error);
            process.exit(1);
        }
    }

    runTestCLI();
}