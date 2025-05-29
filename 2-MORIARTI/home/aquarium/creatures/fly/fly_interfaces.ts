/**
 * 🪰 Базовые интерфейсы для архитектуры Мухи
 *
 * Определяют контракты между Eye, Brain и Legs
 */

/**
 * Абстрактная модель узла дерева
 */
export interface TreeNode {
    name: string;
    type: 'file' | 'directory';
    children: TreeNode[];
    path: string[];
    metadata?: Record<string, any>;
}

/**
 * Поддерживаемые форматы деревьев
 */
export type TreeFormat = 'ascii' | 'filesystem' | 'markdown' | 'json' | 'svg';

/**
 * Конфигурация для различных операций
 */
export interface TransformConfig {
    [key: string]: any;
}

/**
 * Конфигурация для создания файловой системы
 */
export interface FileSystemConfig extends TransformConfig {
    outputPath: string;
    createReadme?: boolean;
    createGitignore?: boolean;
    createStubs?: boolean;
    overwrite?: boolean;
}

/**
 * Конфигурация для ASCII генерации
 */
export interface AsciiConfig extends TransformConfig {
    maxDepth?: number;
    showFiles?: boolean;
    excludeDirs?: string[];
}

/**
 * Конфигурация для Markdown генерации
 */
export interface MarkdownConfig extends TransformConfig {
    maxHeaderLevel?: number;
    includeFileContent?: boolean;
}

/**
 * Интерфейс Eye - препроцессор входных данных
 */
export interface Eye {
    /**
     * Очищает и подготавливает входные данные
     * @param rawInput - Сырые входные данные
     * @returns Очищенные данные готовые для парсинга
     */
    clean(rawInput: string): string;
}

/**
 * Интерфейс Leg - генератор выходных данных
 */
export interface Leg<TConfig extends TransformConfig = TransformConfig> {
    /**
     * Генерирует выходные данные из абстрактной модели дерева
     * @param nodes - Абстрактная модель дерева
     * @param config - Конфигурация генерации
     * @returns Результат генерации
     */
    generate(nodes: TreeNode[], config?: TConfig): any;
}

/**
 * Результат трансформации
 */
export interface TransformResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Статистика обработки дерева
 */
export interface TreeStats {
    totalNodes: number;
    filesCount: number;
    directoriesCount: number;
    maxDepth: number;
    averageDepth: number;
}
