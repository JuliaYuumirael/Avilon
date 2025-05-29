// 🐆 Jaguar - Дикий кот джунглей, охотник на библиотеки
// Ловит библиотеки и просто сваливает их в джунгли без структуры

const fs = require('fs');
const https = require('https');
const path = require('path');

class JaguarInstaller {
    constructor() {
        this.jungle = 'jungle/';
        this.huntingLog = [];

        console.log('🐆 Ягуар проснулся и готов охотиться в джунглях!');
        this.createJungle();
        this.loadPreyList();
    }

    // Создаем джунгли - одну большую свалку
    createJungle() {
        if (!fs.existsSync(this.jungle)) {
            fs.mkdirSync(this.jungle, { recursive: true });
            console.log('🌿 Ягуар создал джунгли!');
        }
    }

    // Загружаем список добычи из JSON или создаем базовый
    loadPreyList() {
        const preyListPath = path.join(this.jungle, 'meow_prey_list.json');

        if (fs.existsSync(preyListPath)) {
            this.preyList = JSON.parse(fs.readFileSync(preyListPath, 'utf8'));
            console.log(`🎯 Загружен список добычи: ${Object.keys(this.preyList).length} целей`);
        } else {
            // Создаем базовый список добычи
            this.preyList = this.createDefaultPreyList();
            this.savePreyList();
            console.log('📝 Создан новый список добычи');
        }
    }

    // Базовый список добычи для fancy rooms
    createDefaultPreyList() {
        return {
            "three.min.js": {
                name: "Three.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
                description: "3D движок для живых крыс"
            },
            "gsap.min.js": {
                name: "GSAP",
                url: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
                description: "Анимации для морфинга"
            },
            "p5.min.js": {
                name: "p5.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js",
                description: "Creative coding магия"
            },
            "phaser.min.js": {
                name: "Phaser.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js",
                description: "Игровой движок"
            },
            "matter.min.js": {
                name: "Matter.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js",
                description: "Физика жидкости"
            },
            "howler.min.js": {
                name: "Howler.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js",
                description: "Звуки для игр"
            },
            "particles.min.js": {
                name: "Particles.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js",
                description: "Система частиц"
            },
            "cannon.min.js": {
                name: "Cannon.js",
                url: "https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.20.0/cannon.min.js",
                description: "Физический движок"
            }
        };
    }

    // Сохраняем список добычи
    savePreyList() {
        const preyListPath = path.join(this.jungle, 'meow_prey_list.json');
        fs.writeFileSync(preyListPath, JSON.stringify(this.preyList, null, 2));
    }

    // Главная охота - ловит всё из списка
    async huntAll() {
        console.log('🐆 Ягуар начинает большую охоту!');
        console.log(`🎯 Цель: поймать ${Object.keys(this.preyList).length} библиотек`);

        for (const [fileName, preyInfo] of Object.entries(this.preyList)) {
            await this.catchPrey(fileName, preyInfo);
            await this.rest(500); // Пауза между охотами
        }

        this.createHuntingReport();
        console.log('🐆 Большая охота завершена! Ягуар доволен.');
    }

    // Ловит конкретную добычу по имени файла
    async hunt(fileNames) {
        console.log(`🐆 Охочусь на: ${fileNames.join(', ')}`);

        for (const fileName of fileNames) {
            if (this.preyList[fileName]) {
                await this.catchPrey(fileName, this.preyList[fileName]);
                await this.rest(300);
            } else {
                console.log(`❓ Неизвестная добыча: ${fileName}`);
                this.suggestSimilar(fileName);
            }
        }
    }

    // Основной метод ловли
    async catchPrey(fileName, preyInfo) {
        return new Promise((resolve, reject) => {
            console.log(`🐆 Выслеживаю ${preyInfo.name}...`);

            const filePath = path.join(this.jungle, fileName);

            // Если уже поймано - пропускаем
            if (fs.existsSync(filePath)) {
                const fileSize = fs.statSync(filePath).size;
                console.log(`✅ ${preyInfo.name} уже в джунглях (${Math.round(fileSize/1024)}KB)`);
                resolve();
                return;
            }

            const file = fs.createWriteStream(filePath);

            https.get(preyInfo.url, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);

                    file.on('finish', () => {
                        file.close();
                        const fileSize = fs.statSync(filePath).size;

                        console.log(`✅ Поймал ${preyInfo.name}! (${Math.round(fileSize/1024)}KB)`);
                        console.log(`   Бросил в джунгли: ${fileName}`);

                        this.huntingLog.push({
                            fileName: fileName,
                            name: preyInfo.name,
                            description: preyInfo.description,
                            size: fileSize,
                            caughtAt: new Date().toISOString()
                        });

                        resolve();
                    });
                } else {
                    console.log(`❌ ${preyInfo.name} ускользнул! (HTTP ${response.statusCode})`);
                    reject(new Error(`Failed to download ${preyInfo.name}`));
                }
            }).on('error', (err) => {
                console.log(`💥 Ошибка при охоте на ${preyInfo.name}:`, err.message);
                reject(err);
            });
        });
    }

    // Добавляет новую добычу в список
    addPrey(fileName, name, url, description = '') {
        this.preyList[fileName] = {
            name: name,
            url: url,
            description: description
        };

        this.savePreyList();
        console.log(`📝 Добавлена новая добыча: ${name} → ${fileName}`);
    }

    // Показывает что уже поймано
    checkJungle() {
        console.log('🐆 Ягуар осматривает джунгли...\n');

        const jungleFiles = fs.readdirSync(this.jungle).filter(f => f.endsWith('.js'));
        const preyFiles = Object.keys(this.preyList);

        console.log('✅ Уже в джунглях:');
        jungleFiles.forEach(file => {
            if (preyFiles.includes(file)) {
                const size = fs.statSync(path.join(this.jungle, file)).size;
                const preyInfo = this.preyList[file];
                console.log(`   ${file} - ${preyInfo.name} (${Math.round(size/1024)}KB)`);
            } else {
                console.log(`   ${file} - неизвестный файл`);
            }
        });

        console.log('\n❌ Еще не поймано:');
        preyFiles.forEach(file => {
            if (!jungleFiles.includes(file)) {
                console.log(`   ${file} - ${this.preyList[file].name}`);
            }
        });
    }

    // Очищает джунгли от всех .js файлов
    clearJungle() {
        console.log('🐆 Ягуар очищает джунгли от библиотек...');

        const files = fs.readdirSync(this.jungle);
        let cleared = 0;

        files.forEach(file => {
            if (file.endsWith('.js')) {
                fs.unlinkSync(path.join(this.jungle, file));
                cleared++;
            }
        });

        console.log(`🗑️ Очищено ${cleared} библиотек из джунглей`);
    }

    // Предлагает похожие имена
    suggestSimilar(fileName) {
        const available = Object.keys(this.preyList);
        const similar = available.filter(name =>
            name.toLowerCase().includes(fileName.toLowerCase()) ||
            fileName.toLowerCase().includes(name.toLowerCase().split('.')[0])
        );

        if (similar.length > 0) {
            console.log(`💡 Может быть: ${similar.join(', ')}?`);
        }
    }

    // Отдых между охотами
    rest(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Создает отчет об охоте
    createHuntingReport() {
        const report = {
            jaguarTerritory: this.jungle,
            huntingSession: new Date().toISOString(),
            totalCaught: this.huntingLog.length,
            caughtLibraries: this.huntingLog,
            totalSize: this.huntingLog.reduce((sum, entry) => sum + entry.size, 0)
        };

        const reportPath = path.join(this.jungle, 'rawr_hunting_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📊 Отчет об охоте: ${reportPath}`);
        this.printSummary();
    }

    // Красивая сводка
    printSummary() {
        const totalSize = this.huntingLog.reduce((sum, entry) => sum + entry.size, 0);

        console.log('\n🐆 =============== ОТЧЕТ ЯГУАРА ===============');
        console.log(`🎯 Поймано библиотек: ${this.huntingLog.length}`);
        console.log(`📁 Все сброшено в: ${this.jungle}`);
        console.log(`💾 Общий размер: ${Math.round(totalSize/1024)}KB`);

        if (this.huntingLog.length > 0) {
            console.log('\n📚 Пойманные библиотеки:');
            this.huntingLog.forEach(entry => {
                console.log(`   ${entry.fileName} - ${entry.name} (${entry.description})`);
            });
        }

        console.log('\n🐆 Ягуар отдыхает в джунглях...\n');
    }

    // Показывает список доступной добычи
    listPrey() {
        console.log('🎯 Доступная добыча:\n');
        Object.entries(this.preyList).forEach(([fileName, info]) => {
            console.log(`${fileName}`);
            console.log(`   ${info.name} - ${info.description}`);
            console.log(`   ${info.url}\n`);
        });
    }
}

// Экспорт
module.exports = JaguarInstaller;

// CLI
if (require.main === module) {
    const jaguar = new JaguarInstaller();

    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch(command) {
        case 'hunt-all':
            jaguar.huntAll();
            break;

        case 'hunt':
            if (args.length > 0) {
                jaguar.hunt(args);
            } else {
                console.log('🐆 Укажите файлы: node cat_jaguar.js hunt three.min.js gsap.min.js');
            }
            break;

        case 'add':
            if (args.length >= 3) {
                jaguar.addPrey(args[0], args[1], args[2], args[3] || '');
            } else {
                console.log('🐆 Формат: node cat_jaguar.js add filename.js "Name" "url" "description"');
            }
            break;

        case 'list':
            jaguar.listPrey();
            break;

        case 'check':
            jaguar.checkJungle();
            break;

        case 'clear':
            jaguar.clearJungle();
            break;

        default:
            console.log(`
🐆 Команды ягуара:
  hunt-all              - поймать все библиотеки из списка
  hunt [files...]       - поймать конкретные файлы
  add [file] [name] [url] [desc] - добавить новую добычу
  list                  - показать доступную добычу  
  check                 - осмотреть джунгли
  clear                 - очистить джунгли
  
Примеры:
  node cat_jaguar.js hunt-all
  node cat_jaguar.js hunt three.min.js gsap.min.js
  node cat_jaguar.js add lottie.min.js "Lottie" "https://..."
            `);
    }
}