/**
 * 🪰 Fly - Главный класс мухи-трансформатора
 */

import { Brain } from './fly_brain';
import { EyeFactory } from './fly_eyes';
import { LegFactory } from './fly_legs'; // Предполагается, что этот файл существует и экспортирует LegFactory
import {
    TreeNode,
    TreeFormat,
    TransformConfig,
    TransformResult, // Убедитесь, что TransformResult экспортируется из fly_interfaces
    TreeStats
} from './fly_interfaces';

export class Fly {
    private brain: Brain;

    constructor() {
        this.brain = new Brain();
    }

    transform<TConfig extends TransformConfig = TransformConfig>(
        input: string,
        fromFormat: TreeFormat,
        toFormat: TreeFormat,
        config?: TConfig
    ): TransformResult { // Убедитесь, что TransformResult используется здесь
        try {
            const eye = EyeFactory.create(fromFormat);
            const cleanInput = eye.clean(input);

            let abstractTree = this.brain.parseToAbstract(cleanInput, fromFormat);

            // === ИЗМЕНЕНИЕ ЗДЕСЬ ===
            // Автоматически удаляем buggybug.md после парсинга ASCII
            if (fromFormat === 'ascii') {
                abstractTree = this.brain.removeBuggybugNodes(abstractTree);
            }
            // =======================

            // Проверяем, что LegFactory.create вернул что-то и есть метод generate
            const leg = LegFactory.create(toFormat);
            if (!leg || typeof leg.generate !== 'function') {
                throw new Error(`Leg for format "${toFormat}" could not be created or has no generate method.`);
            }
            const generationResult = leg.generate(abstractTree, config);

            // Leg.generate должен возвращать объект, совместимый с TransformResult,
            // или мы должны обернуть его результат.
            // Если leg.generate уже возвращает TransformResult:
            if (typeof generationResult === 'object' && 'success' in generationResult) {
                return generationResult as TransformResult;
            } else {
                // Если leg.generate возвращает только данные (например, строку или объект)
                return {
                    success: true,
                    data: generationResult
                    // metadata можно добавить здесь, если leg его не предоставляет
                };
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: message
            };
        }
    }

    table(asciiTree: string, outputPath: string, options: {
        createReadme?: boolean;
        createGitignore?: boolean;
        createStubs?: boolean;
        overwrite?: boolean;
    } = {}): TransformResult<string[]> { // Уточнил тип для data
        return this.transform(asciiTree, 'ascii', 'filesystem', {
            outputPath,
            ...options
        }) as TransformResult<string[]>; // Приведение типа, если transform возвращает общий TransformResult
    }

    untable(inputPath: string, options: {
        maxDepth?: number;
        showFiles?: boolean;
        excludeDirs?: string[];
    } = {}): TransformResult<string> { // Уточнил тип для data
        return this.transform(inputPath, 'filesystem', 'ascii', options) as TransformResult<string>;
    }

    asciiToMarkdown(asciiTree: string, options: {
        maxHeaderLevel?: number;
        includeFileContent?: boolean;
    } = {}): TransformResult<string> {
        return this.transform(asciiTree, 'ascii', 'markdown', options) as TransformResult<string>;
    }

    asciiToJson(asciiTree: string): TransformResult<object> { // data может быть object
        return this.transform(asciiTree, 'ascii', 'json') as TransformResult<object>;
    }

    asciiToSvg(asciiTree: string): TransformResult<string> {
        return this.transform(asciiTree, 'ascii', 'svg') as TransformResult<string>;
    }

    markdownToAscii(markdownTree: string, options: {
        maxDepth?: number;
        showFiles?: boolean;
    } = {}): TransformResult<string> {
        return this.transform(markdownTree, 'markdown', 'ascii', options) as TransformResult<string>;
    }

    jsonToAscii(jsonTree: string, options: {
        maxDepth?: number;
        showFiles?: boolean;
    } = {}): TransformResult<string> {
        return this.transform(jsonTree, 'json', 'ascii', options) as TransformResult<string>;
    }


    getTreeStats(input: string, format: TreeFormat): TreeStats | null {
        try {
            const eye = EyeFactory.create(format);
            const cleanInput = eye.clean(input);
            const abstractTree = this.brain.parseToAbstract(cleanInput, format);
            // Удаляем buggybug перед подсчетом статистики, если это был ASCII
            // Это опционально, зависит от того, хотите ли вы их учитывать
            // if (format === 'ascii') {
            //    const cleanedTreeForStats = this.brain.removeBuggybugNodes(abstractTree);
            //    return this.brain.getTreeStats(cleanedTreeForStats);
            // }
            return this.brain.getTreeStats(abstractTree);
        } catch (error) {
            console.error(`Error in getTreeStats: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    validateInput(input: string, format: TreeFormat): { valid: boolean; error?: string } {
        try {
            const eye = EyeFactory.create(format);
            eye.clean(input); // Просто пытаемся очистить, если нет ошибок - валидно
            // Для более строгой валидации можно попытаться и распарсить
            // this.brain.parseToAbstract(cleanedInput, format);
            return { valid: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { valid: false, error: message };
        }
    }

    getAvailableFormats(): {
        input: string[];
        output: string[];
    } {
        return {
            input: EyeFactory.getAvailableFormats(),
            output: LegFactory.getAvailableFormats() // Предполагаем, что LegFactory имеет этот метод
        };
    }

    debugShowAbstractTree(input: string, format: TreeFormat): void {
        try {
            const eye = EyeFactory.create(format);
            const cleanInput = eye.clean(input);
            let abstractTree = this.brain.parseToAbstract(cleanInput, format);

            console.log('🪰 Abstract Tree (before buggybug removal, if applicable):');
            this.brain.debugPrintTree(abstractTree);


            if (format === 'ascii') {
                const treeWithoutBugs = this.brain.removeBuggybugNodes([...abstractTree]); // Создаем копию для удаления
                console.log('\n🪰 Abstract Tree (after buggybug removal for ASCII):');
                this.brain.debugPrintTree(treeWithoutBugs);
                const statsAfterRemoval = this.brain.getTreeStats(treeWithoutBugs);
                console.log('📊 Tree Stats (after buggybug removal for ASCII):', statsAfterRemoval);
                return;
            }

            const stats = this.brain.getTreeStats(abstractTree);
            console.log('📊 Tree Stats:', stats);

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('❌ Debug error:', message);
        }
    }
    batchTransform(operations: Array<{
        input: string;
        fromFormat: TreeFormat;
        toFormat: TreeFormat;
        config?: TransformConfig;
    }>): TransformResult[] {
        return operations.map(op =>
            this.transform(op.input, op.fromFormat, op.toFormat, op.config)
        );
    }

    chainTransform(
        input: string,
        chain: Array<{ format: TreeFormat; config?: TransformConfig }>
    ): TransformResult {
        if (!chain || chain.length === 0) {
            return { success: false, error: "Transformation chain is empty." };
        }

        let currentData = input;
        // Первый формат в цепочке - это fromFormat для первой трансформации.
        // Но transform ожидает fromFormat как отдельный аргумент.
        // Предположим, что первый элемент цепочки определяет начальный формат входных данных.
        // Это не совсем логично, так как `input` уже имеет некий `fromFormat`.
        // Пересмотрим: `chain` должен описывать ПОСЛЕДОВАТЕЛЬНОСТЬ ЦЕЛЕВЫХ форматов.
        // Начальный формат `fromFormat` должен передаваться отдельно.

        // Пример: transform(input, initialFromFormat, chain[0].format, chain[0].config)
        //         then result.data, chain[0].format, chain[1].format, chain[1].config

        // Для простоты, предположим, что `input` уже в формате, который является `fromFormat`
        // для первого шага трансформации, указанного в `chain[0]`.
        // Это неявное предположение. Лучше бы `chain` был вида:
        // [{ from: 'ascii', to: 'json'}, {from: 'json', to: 'markdown'}]
        // Или, если `chain` это просто последовательность `toFormat`:
        // chainTransform(input: string, initialFromFormat: TreeFormat, chain: Array<{ targetFormat: TreeFormat; config?: TransformConfig }>)

        // Текущая реализация chainTransform в вашем коде имеет эту неясность.
        // Я оставлю ее как есть, но отмечу этот момент.
        // `currentFormat` должен быть форматом `currentData`.
        // Если `chain[0].format` это *целевой* формат первой трансформации, то нам нужен *исходный* формат `input`.
        // Допустим, `chain[0].format` это формат, *в который* нужно преобразовать `input`.
        // Тогда нам нужен `initialFromFormat`.

        // Давайте предположим, что `chain[0].format` это *исходный* формат `input`,
        // а `chain[1].format` это *целевой* формат первой трансформации.
        if (chain.length < 2) {
            return { success: false, error: "Transformation chain must have at least two steps (from -> to)." };
        }

        currentData = input;
        let currentFormat = chain[0].format; // Формат текущих данных currentData

        for (let i = 1; i < chain.length; i++) {
            const targetFormat = chain[i].format;
            const config = chain[i].config;

            const result = this.transform(currentData, currentFormat, targetFormat, config);

            if (!result.success) {
                return result; // Прерываем цепочку при ошибке
            }

            // Данные для следующего шага. Преобразуем в строку, если это объект (например, после JSON).
            currentData = (typeof result.data === 'object' && result.data !== null) ? JSON.stringify(result.data) : String(result.data);
            currentFormat = targetFormat; // Обновляем формат текущих данных
        }

        // Возвращаем результат последней трансформации
        return {
            success: true,
            data: currentData, // currentData уже будет в последнем targetFormat (в виде строки или JSON-строки)
            metadata: { transformChainApplied: chain.map(c => c.format) }
        };
    }
}
