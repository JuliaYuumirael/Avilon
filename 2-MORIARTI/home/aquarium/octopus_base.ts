/**
 * 🐙 Базовый рекурсивный класс Осьминога
 *
 * Философия: Каждый осьминог может быть координатором (имеет щупальца)
 * или исполнителем (имеет функцию). Щупальца - это тоже осьминоги.
 *
 * Структура: logo + greeting + tentacles + function
 */

export interface OctopusConfig {
    logo?: string | null;
    greeting?: string | null;
    tentacles?: Octopus[];
    action?: (() => Promise<void>) | (() => void) | null;
}

export class Octopus {
    public logo: string | null;
    public greeting: string | null;
    public tentacles: Octopus[];
    public action: (() => Promise<void>) | (() => void) | null;

    constructor(config: OctopusConfig = {}) {
        this.logo = config.logo || null;
        this.greeting = config.greeting || null;
        this.tentacles = config.tentacles || [];
        this.action = config.action || null;
    }

    /**
     * Добавить новое щупальце (которое само является осьминогом)
     */
    addTentacle(tentacle: Octopus): void {
        this.tentacles.push(tentacle);
    }

    /**
     * Удалить щупальце по индексу
     */
    removeTentacle(index: number): boolean {
        if (index >= 0 && index < this.tentacles.length) {
            this.tentacles.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Проверить, является ли это координатором (есть щупальца)
     */
    isCoordinator(): boolean {
        return this.tentacles.length > 0;
    }

    /**
     * Проверить, является ли это исполнителем (есть функция)
     */
    isExecutor(): boolean {
        return this.action !== null;
    }

    /**
     * Показать логотип, если есть
     */
    showLogo(): void {
        if (this.logo) {
            console.log(this.logo);
        }
    }

    /**
     * Показать приветствие, если есть
     */
    showGreeting(): void {
        if (this.greeting) {
            console.log(this.greeting);
        }
    }

    /**
     * Показать меню щупалец (для координаторов)
     */
    showTentacleMenu(): void {
        if (this.isCoordinator()) {
            this.tentacles.forEach((tentacle, index) => {
                const displayText = tentacle.greeting || `Щупальце ${index + 1}`;
                console.log(`${index + 1}. ${displayText}`);
            });
        }
    }

    /**
     * Получить щупальце по индексу
     */
    getTentacle(index: number): Octopus | null {
        if (index >= 0 && index < this.tentacles.length) {
            return this.tentacles[index];
        }
        return null;
    }

    /**
     * Выполнить действие (для исполнителей)
     */
    async execute(): Promise<void> {
        if (this.isExecutor() && this.action) {
            await this.action();
        }
    }

    /**
     * Запустить интерактивное CLI меню (базовая версия)
     */
    async run(): Promise<void> {
        this.showLogo();
        this.showGreeting();

        if (this.isExecutor()) {
            // Это исполнитель - выполняем действие
            await this.execute();
        } else if (this.isCoordinator()) {
            // Это координатор - показываем меню
            this.showTentacleMenu();
            console.log("\n(Базовый класс не обрабатывает ввод - это делает реализация)");
        } else {
            console.log("🤔 Этот осьминог пока не знает, что делать...");
        }
    }

    /**
     * Получить информацию о структуре (для отладки)
     */
    getStructureInfo(): object {
        return {
            hasLogo: this.logo !== null,
            hasGreeting: this.greeting !== null,
            tentaclesCount: this.tentacles.length,
            hasAction: this.action !== null,
            type: this.isCoordinator() ? 'coordinator' :
                this.isExecutor() ? 'executor' : 'empty',
            tentacles: this.tentacles.map((t, i) => ({
                index: i,
                info: t.getStructureInfo()
            }))
        };
    }

    /**
     * Красивый вывод структуры дерева
     */
    printStructure(depth: number = 0, prefix: string = ""): void {
        const indent = "  ".repeat(depth);
        const type = this.isCoordinator() ? "🐙" :
            this.isExecutor() ? "🦾" : "❓";

        const name = this.greeting || "Безымянный осьминог";
        console.log(`${indent}${prefix}${type} ${name}`);

        this.tentacles.forEach((tentacle, index) => {
            const isLast = index === this.tentacles.length - 1;
            const newPrefix = isLast ? "└── " : "├── ";
            tentacle.printStructure(depth + 1, newPrefix);
        });
    }
}