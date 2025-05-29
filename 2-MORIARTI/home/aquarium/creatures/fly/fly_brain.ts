/**
 * 🧠 Brain - Универсальный мозг мухи
 */
import * as fs from 'fs'; // Импортируем fs и path для parseFileSystem
import *as path from 'path';
import { TreeNode, TreeFormat, TreeStats } from './fly_interfaces';

export class Brain {
    parseToAbstract(cleanInput: string, format: TreeFormat): TreeNode[] {
        let nodes: TreeNode[];
        switch (format) {
            case 'ascii':
                nodes = this.parseAscii(cleanInput);
                break;
            case 'markdown':
                nodes = this.parseMarkdown(cleanInput); // <--- Сюда будем вносить изменения
                break;
            case 'json':
                nodes = this.parseJson(cleanInput);
                break;
            case 'filesystem':
                nodes = this.parseFileSystem(cleanInput);
                break;
            case 'svg':
                throw new Error('SVG parsing not implemented in Brain yet');
            default:
                const exhaustiveCheck: never = format; // Для проверки полноты switch
                throw new Error(`Unsupported format in Brain: ${exhaustiveCheck}`);
        }
        return nodes;
    }

    private getAsciiLineLevelAndName(line: string): { level: number, name: string, rawName: string } {
        let level = -1;
        let name = line.trim();
        let rawName = name;
        const lineMatch = line.match(/^([│\s]*)(├──|└──)\s*(.*)$/);

        if (lineMatch) {
            const prefix = lineMatch[1];
            const connector = lineMatch[2];
            rawName = lineMatch[3].trim();
            level = (prefix.match(/│/g) || []).length + Math.floor((prefix.match(/ {4}/g) || []).length);
            if (prefix.length === 0 && (connector === '├──' || connector === '└──')) {
                level = 0;
            }
            name = rawName.endsWith('/') ? rawName.slice(0, -1) : rawName;
        } else {
            if (line.trim()) {
                level = -1;
                rawName = line.trim();
                name = rawName.endsWith('/') ? rawName.slice(0, -1) : rawName;
            } else {
                name = "";
                rawName = "";
            }
        }
        return { level, name, rawName };
    }

    private parseAscii(asciiTree: string): TreeNode[] {
        const lines = asciiTree.split('\n').filter(line => line.trim() !== '');
        const root: TreeNode = { name: 'root', type: 'directory', children: [], path: [] };
        const stack: Array<{ node: TreeNode, level: number }> = [{ node: root, level: -2 }];

        for (const line of lines) {
            const { level, name, rawName } = this.getAsciiLineLevelAndName(line);
            if (!name) continue;
            const nodeType = (name === "buggybug.md") ? 'file' :
                (rawName.endsWith('/') || (!name.includes('.') && name !== "")) ? 'directory' : 'file';
            const node: TreeNode = { name: name, type: nodeType, children: [], path: [] };
            while (stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            stack[stack.length - 1].node.children.push(node);
            if (node.type === 'directory') {
                stack.push({ node, level });
            }
        }
        this.setNodePaths(root.children, []);
        return root.children;
    }

    /**
     * НОВЫЙ "ОБРАЗ МЫШЛЕНИЯ" ДЛЯ MARKDOWN (Метод Архитектора Лилии)
     */
    private parseMarkdown(markdown: string): TreeNode[] {
        const lines = markdown.split('\n');
        const root: TreeNode = { name: 'markdown_root', type: 'directory', children: [], path: [] };

        // "Стопка блокнотов" (стек) для отслеживания текущей "комнаты-заголовка"
        // Каждый элемент стека: [узел_комнаты, уровень_этой_комнаты]
        const stack: Array<{ node: TreeNode, level: number }> = [{ node: root, level: 0 }]; // Уровень 0 для корневого узла

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) { // Пропускаем пустые строки
                continue;
            }

            const headerMatch = trimmedLine.match(/^(#+)\s+(.*)$/);

            if (headerMatch) {
                // Это Заголовок ("Комната")
                const level = headerMatch[1].length; // Количество '#' определяет уровень
                const name = headerMatch[2].trim();

                if (!name) continue; // Пропускаем заголовки без имени

                const newDirectoryNode: TreeNode = {
                    name: name,
                    type: 'directory',
                    children: [],
                    path: [] // Пути будут установлены позже
                };

                // Убираем из стека "блокноты" комнат, которые выше или на том же уровне
                while (stack[stack.length - 1].level >= level) {
                    stack.pop();
                }

                // Добавляем новую "комнату" к текущей "родительской комнате"
                stack[stack.length - 1].node.children.push(newDirectoryNode);
                // Кладем "блокнот" новой "комнаты" наверх стопки
                stack.push({ node: newDirectoryNode, level: level });

            } else {
                // Это НЕ Заголовок, значит, по правилу "не заголовок = файл", это "Вещичка-Файл"
                const newFileNode: TreeNode = {
                    name: trimmedLine, // Имя файла - это вся непустая строка
                    type: 'file',
                    children: [], // У файлов нет детей
                    path: []      // Пути будут установлены позже
                };

                // Добавляем "вещичку-файл" в текущую "комнату-заголовок" (на вершине стека)
                stack[stack.length - 1].node.children.push(newFileNode);
            }
        }

        this.setNodePaths(root.children, []); // Устанавливаем пути для всех узлов
        return root.children;
    }

    private parseJson(jsonString: string): TreeNode[] {
        try {
            const data = JSON.parse(jsonString);
            const rootNodes = this.convertJsonToNodes(data, "json_root");
            const nodesArray = Array.isArray(rootNodes) ? rootNodes : (rootNodes ? [rootNodes] : []);
            this.setNodePaths(nodesArray, []);
            return nodesArray;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Invalid JSON: ${error.message}`);
            throw new Error('Invalid JSON: An unknown error occurred');
        }
    }

    private convertJsonToNodes(value: any, keyName: string): TreeNode[] | TreeNode {
        if (Array.isArray(value)) {
            const children = value.flatMap((item, index) => {
                const childNodes = this.convertJsonToNodes(item, `${index}`); // Используем индекс как имя
                return Array.isArray(childNodes) ? childNodes : [childNodes];
            });
            return { name: keyName, type: 'directory', children, path: [] };
        } else if (typeof value === 'object' && value !== null) {
            const children = Object.entries(value).flatMap(([k, v]) => {
                const childNodes = this.convertJsonToNodes(v, k);
                return Array.isArray(childNodes) ? childNodes : [childNodes];
            });
            return { name: keyName, type: 'directory', children, path: [] };
        } else {
            return { name: keyName, type: 'file', children: [], path: [], metadata: { content: String(value) } };
        }
    }

    private parseFileSystem(inputPath: string): TreeNode[] {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Path does not exist: ${inputPath}`);
        }
        const filterList: string[] = ['.git', 'node_modules', '.DS_Store', 'dist', 'build', '.idea', '.vscode'];
        const scanDirectory = (dirPath: string): TreeNode[] => {
            const items = fs.readdirSync(dirPath);
            const nodes: TreeNode[] = [];
            for (const item of items) {
                if (filterList.includes(item)) continue;
                const fullPath = path.join(dirPath, item);
                let stats;
                try {
                    stats = fs.lstatSync(fullPath);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.warn(`Could not access ${fullPath}. Skipping. Error: ${message}`);
                    continue;
                }
                if (stats.isSymbolicLink()) {
                    console.warn(`Symbolic link ${fullPath} skipped.`);
                    continue;
                }
                const node: TreeNode = {
                    name: item,
                    type: stats.isDirectory() ? 'directory' : 'file',
                    children: [],
                    path: [],
                    metadata: { size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime }
                };
                if (stats.isDirectory()) {
                    node.children = scanDirectory(fullPath);
                }
                nodes.push(node);
            }
            return nodes;
        };
        const initialStats = fs.statSync(inputPath);
        let rootNodes: TreeNode[];
        if (initialStats.isDirectory()) {
            rootNodes = [{
                name: path.basename(inputPath),
                type: 'directory',
                children: scanDirectory(inputPath),
                path: [],
                metadata: { size: initialStats.size, createdAt: initialStats.birthtime, modifiedAt: initialStats.mtime }
            }];
        } else {
            rootNodes = [{
                name: path.basename(inputPath),
                type: 'file',
                children: [],
                path: [],
                metadata: { size: initialStats.size, createdAt: initialStats.birthtime, modifiedAt: initialStats.mtime }
            }];
        }
        this.setNodePaths(rootNodes, []);
        return rootNodes;
    }

    private setNodePaths(nodes: TreeNode[], parentPath: string[]): void {
        for (const node of nodes) {
            node.path = [...parentPath, node.name];
            if (node.children && node.children.length > 0) {
                this.setNodePaths(node.children, node.path);
            }
        }
    }

    getTreeStats(nodes: TreeNode[]): TreeStats {
        let totalNodes = 0, filesCount = 0, directoriesCount = 0, maxDepth = 0, totalDepthSum = 0;
        const traverse = (nodeList: TreeNode[], depth: number = 1): void => {
            for (const node of nodeList) {
                totalNodes++; totalDepthSum += depth; maxDepth = Math.max(maxDepth, depth);
                if (node.type === 'file') filesCount++; else directoriesCount++;
                if (node.children && node.children.length > 0) traverse(node.children, depth + 1);
            }
        };
        if (nodes && nodes.length > 0) traverse(nodes);
        return { totalNodes, filesCount, directoriesCount, maxDepth, averageDepth: totalNodes > 0 ? parseFloat((totalDepthSum / totalNodes).toFixed(2)) : 0 };
    }

    debugPrintTree(nodes: TreeNode[], depth: number = 0): void {
        for (const node of nodes) {
            const indent = '  '.repeat(depth);
            const icon = node.type === 'directory' ? '📁' : '📄';
            const pathString = node.path ? node.path.join('/') : 'N/A';
            console.log(`${indent}${icon} ${node.name} (Path: ${pathString})`);
            if (node.children && node.children.length > 0) this.debugPrintTree(node.children, depth + 1);
        }
    }

    public removeBuggybugNodes(nodes: TreeNode[]): TreeNode[] {
        const filterNodesRecursively = (nodeList: TreeNode[]): TreeNode[] => {
            const result: TreeNode[] = [];
            for (const node of nodeList) {
                if (node.name === "buggybug.md" && node.type === "file") continue;
                if (node.type === "directory" && node.children && node.children.length > 0) {
                    node.children = filterNodesRecursively(node.children);
                }
                result.push(node);
            }
            return result;
        };
        return filterNodesRecursively(nodes);
    }
}
