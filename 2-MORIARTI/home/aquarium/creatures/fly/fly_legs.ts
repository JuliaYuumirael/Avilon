/**
 * 🦵 Legs - Генераторы выходных данных
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    TreeNode,
    Leg,
    FileSystemConfig,
    AsciiConfig,
    MarkdownConfig,
    TransformResult
} from './fly_interfaces';

/**
 * FileSystem Leg - создает реальную файловую структуру
 */
export class FileSystemLeg implements Leg<FileSystemConfig> {
    generate(nodes: TreeNode[], config: FileSystemConfig): TransformResult<string[]> {
        const createdPaths: string[] = [];
        try {
            if (!fs.existsSync(config.outputPath)) {
                fs.mkdirSync(config.outputPath, { recursive: true });
            }
            this.createNodesRecursively(nodes, config.outputPath, createdPaths, config.overwrite || false);
            if (config.createReadme) {
                this.createReadme(config.outputPath, nodes); // Передаем исходные nodes для генерации дерева в README
                createdPaths.push(path.join(config.outputPath, 'README.md'));
            }
            if (config.createGitignore) {
                this.createGitignore(config.outputPath);
                createdPaths.push(path.join(config.outputPath, '.gitignore'));
            }
            if (config.createStubs) {
                this.createFileStubs(config.outputPath);
            }
            return {
                success: true,
                data: createdPaths,
                metadata: { totalCreated: createdPaths.length, outputPath: config.outputPath }
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }

    private createNodesRecursively(nodes: TreeNode[], basePath: string, createdPaths: string[], overwrite: boolean): void {
        for (const node of nodes) {
            const fullPath = path.join(basePath, node.name);
            if (node.type === 'directory') {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                    createdPaths.push(fullPath);
                }
                if (node.children && node.children.length > 0) {
                    this.createNodesRecursively(node.children, fullPath, createdPaths, overwrite);
                }
            } else {
                if (!fs.existsSync(fullPath) || overwrite) {
                    const content = node.metadata?.content || ''; // Файлы, созданные parseMarkdown, могут не иметь content в metadata
                    fs.writeFileSync(fullPath, content);
                    createdPaths.push(fullPath);
                }
            }
        }
    }

    // generateTreeString используется для README, его можно оставить как есть или синхронизировать с AsciiLeg
    private generateTreeString(nodes: TreeNode[], depth: number = 0, parentPrefix: string = ""): string {
        let result = '';
        nodes.forEach((node, index) => {
            const isLast = index === nodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const childPrefix = parentPrefix + (isLast ? '    ' : '│   ');
            result += parentPrefix + connector + node.name + (node.type === 'directory' ? '/' : '') + '\n';
            if (node.children && node.children.length > 0) {
                result += this.generateTreeString(node.children, depth + 1, childPrefix);
            }
        });
        return result;
    }

    private createReadme(outputPath: string, nodes: TreeNode[]): void {
        const projectName = path.basename(outputPath);
        // Для README используем AsciiLeg для генерации дерева, если он доступен, или текущий generateTreeString
        // Это обеспечит консистентность с выводом AsciiLeg
        // Пока оставим generateTreeString, но лучше бы это делал AsciiLeg
        const treeString = this.generateTreeString(nodes); // nodes - это корневые узлы абстрактного дерева

        const content = `# ${projectName}\n\n## Структура проекта\n\n\`\`\`\n${treeString}\`\`\`\n`;
        const readmePath = path.join(outputPath, 'README.md');
        if (!fs.existsSync(readmePath) || (fs.statSync(readmePath).size === 0)) { // Перезаписываем, если пустой
            fs.writeFileSync(readmePath, content);
        }
    }

    private createGitignore(outputPath: string): void {
        const content = `node_modules/\n.DS_Store\n*.log\ndist/\nbuild/\n.env\n.vscode/\n.idea/`;
        const gitignorePath = path.join(outputPath, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, content);
        }
    }

    private createFileStubs(outputPath: string): void {
        // Логика заглушек остается прежней
        const templates: Record<string, string> = {
            '.js': '// TODO: Implement JavaScript functionality\n',
            '.ts': '// TODO: Implement TypeScript functionality\n',
            '.html': '<!DOCTYPE html>\n<html>\n<head><title>Page</title></head>\n<body><h1>Hello!</h1></body>\n</html>',
            '.css': '/* Add your styles here */\n',
            '.md': '# New Markdown File\n\n',
            '.json': '{\n  "key": "value"\n}\n'
        };
        this.processDirectoryForStubs(outputPath, templates);
    }

    private processDirectoryForStubs(dirPath: string, templates: Record<string, string>): void {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            if (fs.statSync(itemPath).isDirectory()) {
                this.processDirectoryForStubs(itemPath, templates);
            } else if (fs.statSync(itemPath).size === 0) {
                const ext = path.extname(item);
                if (templates[ext] && item.toLowerCase() !== 'readme.md') {
                    fs.writeFileSync(itemPath, templates[ext]);
                }
            }
        }
    }
}

/**
 * ASCII Leg - генерирует ASCII представление дерева
 */
export class AsciiLeg implements Leg<AsciiConfig> {
    generate(nodes: TreeNode[], config: AsciiConfig = {}): TransformResult<string> {
        try {
            const ascii = this.generateAsciiTree(nodes, config, 0, "");
            return {
                success: true,
                data: ascii,
                metadata: { linesCount: ascii.split('\n').filter(Boolean).length, config }
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }

    private generateAsciiTree(nodes: TreeNode[], config: AsciiConfig, depth: number = 0, parentPrefix: string = ""): string {
        if (config.maxDepth && depth >= config.maxDepth) {
            return '';
        }
        let result = '';
        const filteredNodes = nodes.filter(node => {
            if (config.showFiles === false && node.type === 'file') return false;
            if (config.excludeDirs && node.type === 'directory' && config.excludeDirs.includes(node.name)) return false;
            return true;
        });

        filteredNodes.forEach((node, index) => {
            const isLast = index === filteredNodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const childPrefix = parentPrefix + (isLast ? '    ' : '│   ');
            result += parentPrefix + connector + node.name + (node.type === 'directory' ? '/' : '') + '\n';
            if (node.children && node.children.length > 0) {
                result += this.generateAsciiTree(node.children, config, depth + 1, childPrefix);
            }
        });
        return result;
    }
}

/**
 * Markdown Leg - генерирует Markdown с заголовками
 * ОБНОВЛЕННАЯ ЛОГИКА
 */
export class MarkdownLeg implements Leg<MarkdownConfig> {
    generate(nodes: TreeNode[], config: MarkdownConfig = {}): TransformResult<string> {
        try {
            const markdown = this.generateMarkdownTree(nodes, config, 1); // Начинаем с уровня заголовка 1
            return {
                success: true,
                data: markdown.trim(), // Убираем лишние переносы строк в конце
                metadata: { linesCount: markdown.split('\n').filter(Boolean).length, config }
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }

    private generateMarkdownTree(nodes: TreeNode[], config: MarkdownConfig, currentDepth: number): string {
        let result = '';
        const maxHeaderLevel = config.maxHeaderLevel || 6; // По умолчанию до 6 уровня

        for (const node of nodes) {
            if (node.type === 'directory') {
                const headerLevel = Math.min(currentDepth, maxHeaderLevel);
                result += '#'.repeat(headerLevel) + ' ' + node.name + '\n'; // Один перенос строки после заголовка
                // Добавляем пустую строку после заголовка для лучшей читаемости, если есть дочерние элементы или это не последний узел
                if (node.children && node.children.length > 0) {
                    result += '\n';
                }

                if (node.children && node.children.length > 0) {
                    result += this.generateMarkdownTree(node.children, config, currentDepth + 1);
                }
                // Добавляем пустую строку после блока директории, если это не последний элемент на верхнем уровне
                if (currentDepth === 1 && node !== nodes[nodes.length -1] && node.children.length > 0) {
                    result += '\n';
                }


            } else if (node.type === 'file') {
                // Файлы (которые теперь являются обычными строками текста из Markdown) выводятся как есть
                result += node.name + '\n';
            }
        }
        return result;
    }
}

/**
 * JSON Leg - генерирует JSON представление дерева
 */
export class JsonLeg implements Leg {
    generate(nodes: TreeNode[]): TransformResult<object> {
        try {
            // Для JSON'а корневой элемент может быть массивом, если nodes - это массив корневых узлов,
            // или объектом, если мы представляем дерево как один корневой объект.
            // Текущий nodesToJson создает объект, где ключи - имена узлов.
            // Если nodes - это массив из нескольких корневых элементов, nodesToJson их объединит в один объект.
            // Это может быть не всегда желаемым поведением, если мы хотим представить массив корневых элементов.
            // Пока оставим так, но это место для возможного улучшения.
            const jsonOutput = this.nodesToJson(nodes);
            return {
                success: true,
                data: jsonOutput, // nodesToJson уже возвращает готовый объект/массив
                metadata: { nodeCount: this.countNodes(nodes) }
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }

    private nodesToJson(nodes: TreeNode[]): any {
        // Если на входе массив из одного узла, который является корневой директорией,
        // то лучше вернуть его содержимое как объект, а не сам узел.
        // Это сделает JSON более похожим на структуру папок.
        if (nodes.length === 1 && nodes[0].type === 'directory') {
            const rootNode = nodes[0];
            const childrenObject: any = {};
            if (rootNode.children && rootNode.children.length > 0) {
                rootNode.children.forEach(child => {
                    if (child.type === 'directory') {
                        childrenObject[child.name] = this.nodesToJson([child]); // Рекурсивный вызов для дочерних директорий
                    } else {
                        childrenObject[child.name] = child.metadata?.content === undefined ? null : child.metadata.content;
                    }
                });
            }
            // Возвращаем объект, где ключ - имя корневой папки, а значение - ее содержимое
            const result: any = {};
            result[rootNode.name] = childrenObject;
            return result;

        }

        // Иначе, если это массив файлов или несколько корневых папок, создаем объект из них
        const result: any = {};
        for (const node of nodes) {
            if (node.type === 'directory') {
                result[node.name] = this.nodesToJson(node.children); // Рекурсивный вызов для содержимого
            } else {
                // Для файлов, если parseMarkdown не кладет контент в metadata,
                // то имя файла и есть его "содержимое" с точки зрения Markdown-парсера.
                // JsonLeg может решить представлять это как { "filename.txt": null } или что-то иное.
                // Если Brain.parseMarkdown сохраняет оригинальную строку в node.name для файлов,
                // то здесь мы можем либо просто использовать null, либо node.name как значение.
                // Учитывая, что parseMarkdown теперь кладет всю строку в node.name,
                // и не использует metadata.content для этого, здесь можно оставить null
                // или решить, что значением будет само имя файла (что странно для JSON).
                // Оставим null, если нет metadata.content.
                result[node.name] = node.metadata?.content === undefined ? null : node.metadata.content;
            }
        }
        return result;
    }

    private countNodes(nodes: TreeNode[]): number { // Вспомогательная функция
        let count = 0;
        for (const node of nodes) {
            count++;
            if (node.children) {
                count += this.countNodes(node.children);
            }
        }
        return count;
    }
}

/**
 * SVG Leg - генерирует SVG диаграмму дерева
 */
export class SvgLeg implements Leg {
    generate(nodes: TreeNode[], config?: { showFiles?: boolean, maxDepth?: number }): TransformResult<string> {
        try {
            const svg = this.generateSvgTree(nodes, config);
            return {
                success: true,
                data: svg,
                metadata: { format: 'svg', nodeCount: this.countNodes(nodes) }
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }

    private generateSvgTree(nodes: TreeNode[], config?: { showFiles?: boolean, maxDepth?: number }, depth: number = 0): string {
        // Фильтрация для SVG на основе config
        const CfgShowFiles = config?.showFiles === undefined ? true : config.showFiles;
        const CfgMaxDepth = config?.maxDepth === undefined ? Infinity : config.maxDepth;

        if (depth >= CfgMaxDepth) return "";

        const filteredNodes = nodes.filter(node => {
            if (!CfgShowFiles && node.type === 'file') return false;
            return true;
        });


        const nodeHeight = 30;
        const nodeWidth = 120;
        const verticalSpacing = 10;
        const horizontalSpacing = 50;
        const padding = 20;

        let elements = '';
        let currentY = padding;
        let maxWidth = 0;

        const processNode = (node: TreeNode, x: number, y: number, currentDepth: number): { height: number, svgElements: string, childrenMaxWidth: number } => {
            if (currentDepth >= CfgMaxDepth) return { height: 0, svgElements: "", childrenMaxWidth: x + nodeWidth };

            const nodeIsFile = node.type === 'file';
            if (!CfgShowFiles && nodeIsFile) return { height: 0, svgElements: "", childrenMaxWidth: x };


            const rectClass = nodeIsFile ? 'file-node' : 'dir-node';
            const icon = nodeIsFile ? '📄' : '📁';
            const textName = node.name.length > 12 ? node.name.substring(0, 10) + '..' : node.name;

            let nodeSvg = `<g transform="translate(${x}, ${y})">`;
            nodeSvg += `<rect width="${nodeWidth}" height="${nodeHeight}" rx="5" class="${rectClass}"/>`;
            nodeSvg += `<text x="5" y="${nodeHeight / 2}" dy="0.35em" class="node-text" fill="white">${icon} ${textName}</text>`;
            nodeSvg += `</g>`;

            let childrenHeight = 0;
            let childrenSvg = "";
            let childrenMaxWidth = x + nodeWidth;

            if (node.children && node.children.length > 0) {
                let childYoffset = nodeHeight + verticalSpacing;
                node.children.filter(child => CfgShowFiles || child.type === 'directory').forEach(child => {
                    if (currentDepth + 1 < CfgMaxDepth) {
                        const childResult = processNode(child, x + horizontalSpacing, y + childYoffset, currentDepth + 1);
                        if (childResult.svgElements) {
                            // Рисуем линию от родителя к ребенку
                            childrenSvg += `<line x1="${x + nodeWidth / 2}" y1="${y + nodeHeight}" x2="${x + horizontalSpacing + nodeWidth / 2}" y2="${y + childYoffset + nodeHeight / 2}" class="connection"/>`;
                            childrenSvg += childResult.svgElements;
                            childYoffset += childResult.height + verticalSpacing;
                            childrenHeight += childResult.height + verticalSpacing;
                            childrenMaxWidth = Math.max(childrenMaxWidth, childResult.childrenMaxWidth);
                        }
                    }
                });
                if (childrenHeight > 0) childrenHeight -= verticalSpacing; // Убираем последний отступ
            }

            return {
                height: nodeHeight + (childrenHeight > 0 ? verticalSpacing + childrenHeight : 0),
                svgElements: nodeSvg + childrenSvg,
                childrenMaxWidth
            };
        };

        let totalHeight = 0;
        let prevNodeEndY = 0;

        filteredNodes.forEach(node => {
            const result = processNode(node, padding, totalHeight + padding, 0);
            elements += result.svgElements;
            totalHeight += result.height + verticalSpacing;
            maxWidth = Math.max(maxWidth, result.childrenMaxWidth);
        });
        if (totalHeight > 0) totalHeight -= verticalSpacing; // Убираем последний отступ


        const finalWidth = maxWidth + padding;
        const finalHeight = totalHeight + padding;

        let svg = `<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">`;
        svg += '<style>.dir-node { fill: #4A90E2; stroke: #357ABD; } .file-node { fill: #7ED321; stroke: #68B319; } .node-text { font-family: Inter, sans-serif; font-size: 11px; } .connection { stroke: #999; stroke-width: 1; }</style>';
        svg += elements;
        svg += '</svg>';
        return svg;
    }

    // calculatePositions и старый countNodes больше не нужны, если SvgLeg генерирует все сам
}

/**
 * Фабрика Legs
 */
export class LegFactory {
    static create(format: string): Leg {
        switch (format.toLowerCase()) {
            case 'filesystem':
            case 'fs':
                return new FileSystemLeg();
            case 'ascii':
                return new AsciiLeg();
            case 'markdown':
            case 'md':
                return new MarkdownLeg();
            case 'json':
                return new JsonLeg();
            case 'svg':
                return new SvgLeg();
            default:
                throw new Error(`Unknown leg format: ${format}`);
        }
    }

    static getAvailableFormats(): string[] {
        return ['filesystem', 'fs', 'ascii', 'markdown', 'md', 'json', 'svg'];
    }
}
