/**
 * 👁️ Eyes - Препроцессоры входных данных
 *
 * Ответственность: очистка и подготовка сырых данных для мозга
 * Каждый Eye знает, как обработать свой формат данных
 */

import { Eye } from './fly_interfaces';

/**
 * ASCII Eye - очищает ASCII деревья от комментариев и мусора.
 * Добавляет buggybug.md в пустые директории.
 */
export class AsciiEye implements Eye {
    clean(rawInput: string): string {
        const initialLines = rawInput.split('\n');
        const tempCleanedLines: string[] = [];

        // Шаг 1: Начальная очистка (комментарии, пробелы справа, пустые строки)
        for (let line of initialLines) {
            const commentIndex = line.indexOf('#');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex);
            }
            line = line.trimRight(); // Убираем пробелы только справа
            if (line.trim().length > 0) { // Пропускаем строки, которые стали пустыми ПОСЛЕ trim()
                tempCleanedLines.push(line);
            }
        }

        const finalCleanedLines: string[] = [];
        // Шаг 2: Добавление buggybug.md в пустые директории
        for (let i = 0; i < tempCleanedLines.length; i++) {
            const currentLine = tempCleanedLines[i];
            finalCleanedLines.push(currentLine); // Добавляем текущую строку

            const currentConnectorIndex = this.getAsciiConnectorIndex(currentLine);

            // Извлекаем имя элемента
            let rawName = "";
            if (currentConnectorIndex !== -1) { // Если есть коннектор (├ или └)
                const nameMatch = currentLine.substring(currentConnectorIndex).match(/[├└]──\s*(.*)/);
                rawName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : "";
            } else if (this.isRootLevelItem(currentLine)) { // Если это корневой элемент без префикса
                rawName = currentLine.trim();
            }

            // Определяем, является ли строка потенциальной директорией
            const isPotentiallyDirectory = rawName !== "" &&
                (rawName.endsWith('/') || !rawName.includes('.')) &&
                rawName !== "buggybug.md";

            if (isPotentiallyDirectory) {
                const nextLine = (i + 1 < tempCleanedLines.length) ? tempCleanedLines[i + 1] : null;
                const nextConnectorIndex = nextLine ? this.getAsciiConnectorIndex(nextLine) : -2;

                let isDirEmpty = false;
                if (!nextLine) {
                    isDirEmpty = true;
                } else {
                    if (currentConnectorIndex !== -1) {
                        if (nextConnectorIndex <= currentConnectorIndex || nextConnectorIndex === -1) {
                            isDirEmpty = true;
                        }
                    } else {
                        if (nextConnectorIndex === -1 || !nextLine) {
                            isDirEmpty = true;
                        }
                    }
                }

                if (isDirEmpty) {
                    let buggybugLine = "";
                    if (currentConnectorIndex !== -1) {
                        const visualPrefixMatch = currentLine.match(/^([│\s]*)([├└])──.*$/);
                        if (visualPrefixMatch) {
                            const parentPrefix = visualPrefixMatch[1];
                            const parentConnector = visualPrefixMatch[2];
                            const childContinuation = parentConnector === '├' ? '│   ' : '    ';
                            buggybugLine = `${parentPrefix}${childContinuation}└── buggybug.md`;
                        } else {
                            buggybugLine = `${"    ".repeat(Math.max(0, (currentLine.length - currentLine.trimLeft().length) / 4))}└── buggybug.md`;
                        }
                    } else {
                        buggybugLine = `└── buggybug.md`;
                    }
                    finalCleanedLines.push(buggybugLine);
                }
            }
        }
        return finalCleanedLines.join('\n');
    }

    private isRootLevelItem(line: string): boolean {
        const trimmedLine = line.trimLeft();
        return trimmedLine === line && this.getAsciiConnectorIndex(line) === -1;
    }

    private getAsciiConnectorIndex(line: string): number {
        return line.search(/[├└]/);
    }
}

/**
 * Markdown Eye - очищает Markdown от лишнего форматирования
 */
export class MarkdownEye implements Eye {
    clean(rawInput: string): string {
        const lines = rawInput.split('\n');
        const cleanedLines: string[] = [];

        for (let line of lines) {
            // Удаляем HTML комментарии
            line = line.trim();
            // Пропускаем пустые строки
            if (line.length > 0) {
                cleanedLines.push(line);
            }
        }
        return cleanedLines.join('\n');
    }
}

/**
 * JSON Eye - валидирует и форматирует JSON
 */
export class JsonEye implements Eye {
    clean(rawInput: string): string {
        try {
            const parsed = JSON.parse(rawInput);
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Invalid JSON input: ${error.message}`);
            }
            throw new Error('Invalid JSON input: An unknown error occurred.');
        }
    }
}

/**
 * FileSystem Eye - подготавливает пути файловой системы
 */
export class FileSystemEye implements Eye {
    clean(rawInput: string): string {
        let path = rawInput.trim();
        if ((path.startsWith('"') && path.endsWith('"')) ||
            (path.startsWith("'") && path.endsWith("'"))) {
            path = path.slice(1, -1);
        }
        path = path.replace(/\\/g, '/');
        return path;
    }
}

/**
 * Universal Eye - пытается определить формат автоматически
 */
export class UniversalEye implements Eye {
    private asciiEye = new AsciiEye();
    private markdownEye = new MarkdownEye();
    private jsonEye = new JsonEye();
    private filesystemEye = new FileSystemEye();

    clean(rawInput: string): string {
        const trimmed = rawInput.trim();

        if (this.looksLikeJson(trimmed)) {
            return this.jsonEye.clean(rawInput);
        } else if (this.looksLikeMarkdown(trimmed)) {
            return this.markdownEye.clean(rawInput);
        } else if (this.looksLikeFilePath(trimmed)) {
            return this.filesystemEye.clean(rawInput);
        } else {
            return this.asciiEye.clean(rawInput);
        }
    }

    private looksLikeJson(input: string): boolean {
        return (input.startsWith('{') && input.endsWith('}')) ||
            (input.startsWith('[') && input.endsWith(']'));
    }

    private looksLikeMarkdown(input: string): boolean {
        const lines = input.split('\n');
        return lines.some(line => line.match(/^#+\s+/) || line.match(/^[\s]*[-*+]\s+/));
    }

    private looksLikeFilePath(input: string): boolean {
        const hasTreeChars = input.split('\n').some(line => line.trim().match(/^(?:[│├└]──)/));
        return input.length < 500 &&
            !input.includes('\n') &&
            (input.includes('/') || input.includes('\\')) &&
            !hasTreeChars;
    }
}

/**
 * Фабрика Eyes
 */
export class EyeFactory {
    static create(format: string): Eye {
        switch (format.toLowerCase()) {
            case 'ascii':
                return new AsciiEye();
            case 'markdown':
            case 'md':
                return new MarkdownEye();
            case 'json':
                return new JsonEye();
            case 'filesystem':
            case 'fs':
                return new FileSystemEye();
            case 'auto':
            case 'universal':
                return new UniversalEye();
            default:
                const validFormatsFromTreeFormat: Array<string> = ['ascii', 'filesystem', 'markdown', 'json', 'svg'];
                if (validFormatsFromTreeFormat.includes(format.toLowerCase())) {
                    console.warn(`Format "${format}" recognized but using UniversalEye as fallback.`);
                    return new UniversalEye();
                }
                throw new Error(`Unknown eye format: ${format}`);
        }
    }

    static getAvailableFormats(): string[] {
        return ['ascii', 'markdown', 'md', 'json', 'filesystem', 'fs', 'auto', 'universal'];
    }
}
