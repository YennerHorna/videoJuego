class CampaignMapScene extends Phaser.Scene {
    constructor() {
        super('CampaignMapScene');

        // Cada campo contiene sus coordenadas en el mapa y la informacion del archivo.
        this.camps = [
            {
                id: 'sachsenhausen',
                number: 1,
                name: 'SACHSENHAUSEN',
                location: 'Oranienburg, cerca de Berlín',
                years: '1936 - 1945',
                requiredKeys: 3,
                x: 0.76,
                y: 0.32,
                description: 'Construido al norte de Berlín, fue un campo central en la administración del sistema concentracionario.',
                fact: 'La cercanía con las oficinas de las Schutzstaffel (SS) reforzó su importancia dentro del aparato represivo.',
            },
            {
                id: 'ravensbruck',
                number: 2,
                name: 'RAVENSBRÜCK',
                location: 'Fürstenberg / Havel',
                years: '1939 - 1945',
                requiredKeys: 6,
                x: 0.68,
                y: 0.20,
                description: 'Fue el mayor campo de concentración destinado principalmente a mujeres en el Reich alemán.',
                fact: 'Prisioneras de numerosos países sufrieron allí detención y trabajo forzado.',
            },
            {
                id: 'neuengamme',
                number: 3,
                name: 'NEUENGAMME',
                location: 'Hamburgo',
                years: '1938 - 1945',
                requiredKeys: 9,
                x: 0.48,
                y: 0.19,
                description: 'Situado cerca de Hamburgo, se convirtió en centro de una extensa red de subcampos.',
                fact: 'El memorial actual documenta el trabajo forzado y las vidas de las personas deportadas.',
            },
            {
                id: 'bergen-belsen',
                number: 4,
                name: 'BERGEN-BELSEN',
                location: 'Bergen / Celle',
                years: '1943 - 1945',
                requiredKeys: 12,
                x: 0.40,
                y: 0.30,
                description: 'El hacinamiento, el hambre y las epidemias causaron decenas de miles de muertes.',
                fact: 'Fue liberado por tropas británicas el 15 de abril de 1945.',
            },
            {
                id: 'buchenwald',
                number: 6,
                name: 'BUCHENWALD',
                location: 'Weimar',
                years: '1937 - 1945',
                requiredKeys: 18,
                x: 0.55,
                y: 0.50,
                description: 'Uno de los mayores campos en suelo alemán, encarceló a personas perseguidas de numerosos países.',
                fact: 'El memorial conserva espacios del campo y testimonios para la educación histórica.',
            },
            {
                id: 'mittelbau-dora',
                number: 5,
                name: 'MITTELBAU-DORA',
                location: 'Nordhausen, Turingia',
                years: '1943 - 1945',
                requiredKeys: 15,
                x: 0.49,
                y: 0.41,
                description: 'Sus prisioneros fueron forzados a trabajar en túneles subterráneos para la producción de armamento.',
                fact: 'El campo se independizó de Buchenwald en 1944; miles murieron por las condiciones de trabajo y cautiverio.',
            },
            {
                id: 'flossenburg',
                number: 7,
                name: 'FLOSSENBÜRG',
                location: 'Baviera',
                years: '1938 - 1945',
                requiredKeys: 21,
                x: 0.66,
                y: 0.64,
                description: 'Sus prisioneros fueron sometidos a trabajo forzado extremo, inicialmente en una cantera.',
                fact: 'Muchos murieron también durante las evacuaciones forzadas del final de la guerra.',
            },
            {
                id: 'dachau',
                number: 8,
                name: 'DACHAU',
                location: 'Cerca de Múnich',
                years: '1933 - 1945',
                requiredKeys: 24,
                x: 0.55,
                y: 0.80,
                description: 'Abierto en marzo de 1933, fue el primer campo de concentración regular del régimen nazi.',
                fact: 'Fue liberado por tropas estadounidenses el 29 de abril de 1945.',
            },
        ];

        this.selectedCampId = 'sachsenhausen';
        this.unlockedLevel = 1;
        this.completedLevels = 0;
        this.markers = [];
        this.voiceController = null;
    }

    preload() {
        if (!this.textures.exists('campaign-germany-map')) {
            this.load.image('campaign-germany-map', window.GameAssets.backgrounds.germanyMap);
        }

        if (!this.textures.exists('main-menu-background')) {
            this.load.image('main-menu-background', window.GameAssets.backgrounds.mainMenu);
        }
    }

    create() {
        this.background = this.add.image(0, 0, 'main-menu-background').setOrigin(0.5);
        this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050505, 0.84).setOrigin(0);

        this.loadProgress();
        this.drawScreen();
        this.scaleBackground();
        this.createVoiceNavigation();

        this.scale.on('resize', this.resizeCampaign, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.resizeCampaign, this);
            this.destroyVoiceNavigation();
            this.game.canvas.style.cursor = 'default';
        });
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
    }

    drawScreen() {
        // Se reconstruye la interfaz completa al redimensionar para conservar el layout.
        if (this.screen) {
            this.screen.destroy(true);
        }

        this.screen = this.add.container(0, 0);
        this.markers = [];

        const layout = this.getLayout();

        this.createHeader(layout);
        this.createMapPanel(layout);
        this.createInfoPanel(layout);
        this.selectCamp(this.selectedCampId);
    }

    loadProgress() {
        // Por ahora el progreso determina que marcadores admiten seleccion.
        const storedLevel = Number.parseInt(window.localStorage.getItem('campaignUnlockedLevel'), 10);

        this.unlockedLevel = Number.isFinite(storedLevel)
            ? Phaser.Math.Clamp(storedLevel, 1, this.camps.length)
            : 1;
        this.completedLevels = this.unlockedLevel - 1;
        this.selectedCampId = this.camps[0].id;
    }

    getLayout() {
        const margin = Phaser.Math.Clamp(this.scale.width * 0.05, 28, 68);
        const headerHeight = 150;
        const gap = Phaser.Math.Clamp(this.scale.width * 0.018, 18, 28);
        const panelY = headerHeight + 36;
        const panelHeight = this.scale.height - panelY - 36;
        const infoWidth = Phaser.Math.Clamp(this.scale.width * 0.29, 300, 392);
        const mapWidth = this.scale.width - margin * 2 - gap - infoWidth;

        return {
            margin,
            panelY,
            panelHeight,
            mapX: margin,
            mapWidth,
            infoX: margin + mapWidth + gap,
            infoWidth,
        };
    }

    createHeader(layout) {
        const back = this.add.text(layout.margin, 34, '<  VOLVER', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#d6b450',
        }).setInteractive({ useHandCursor: true });
        back.setStroke('#000000', 3);
        back.on('pointerdown', () => this.scene.start('MainMenuScene'));

        const title = this.add.text(layout.margin, 67, 'CAMPOS DEL REICH', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.045, 42, 60)}px`,
            color: '#eee8da',
        });
        title.setStroke('#000000', 6);

        const subtitle = this.add.text(
            layout.margin,
            132,
            'SELECCIONA UN CAMPO PARA CONSULTAR EL ARCHIVO E INICIAR LA MISIÓN.',
            {
                fontFamily: 'Courier New',
                fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.012, 12, 16)}px`,
                fontStyle: 'bold',
                color: '#d0c5ad',
            },
        );
        subtitle.setStroke('#000000', 3);

        const progress = this.add.text(
            this.scale.width - layout.margin,
            57,
            `PROGRESO\n${this.completedLevels}/${this.camps.length}`,
            {
            align: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: '25px',
            fontStyle: 'bold',
            color: '#d6b450',
            lineSpacing: 2,
        },
        ).setOrigin(1, 0);
        progress.setStroke('#000000', 4);

        this.screen.add([back, title, subtitle, progress]);
    }

    createMapPanel(layout) {
        const panel = this.add.graphics();
        panel.fillStyle(0x130f0c, 0.9);
        panel.lineStyle(2, 0xb18443, 0.9);
        panel.fillRect(layout.mapX, layout.panelY, layout.mapWidth, layout.panelHeight);
        panel.strokeRect(layout.mapX, layout.panelY, layout.mapWidth, layout.panelHeight);
        panel.lineStyle(1, 0xe2b75e, 0.22);
        panel.strokeRect(layout.mapX + 7, layout.panelY + 7, layout.mapWidth - 14, layout.panelHeight - 14);

        const availableWidth = layout.mapWidth - 80;
        const availableHeight = layout.panelHeight - 38;
        this.mapImage = this.add.image(
            layout.mapX + layout.mapWidth / 2,
            layout.panelY + layout.panelHeight / 2,
            'campaign-germany-map',
        );
        const mapScale = Math.min(availableWidth / this.mapImage.width, availableHeight / this.mapImage.height);
        this.mapImage.setScale(mapScale);

        const renderedMap = {
            x: this.mapImage.x - this.mapImage.displayWidth / 2,
            y: this.mapImage.y - this.mapImage.displayHeight / 2,
            width: this.mapImage.displayWidth,
            height: this.mapImage.displayHeight,
        };

        const mapCaption = this.add.text(layout.mapX + 22, layout.panelY + 16, 'ALEMANIA  |  1933 - 1945', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ac9361',
        });
        mapCaption.setStroke('#000000', 2);

        this.screen.add([panel, this.mapImage, mapCaption]);
        this.drawMissionRoute(renderedMap);
        this.camps.forEach((camp) => this.createMarker(camp, renderedMap));
    }

    getMarkerPosition(camp, mapBounds) {
        return {
            x: mapBounds.x + mapBounds.width * camp.x,
            y: mapBounds.y + mapBounds.height * camp.y,
        };
    }

    drawMissionRoute(mapBounds) {
        // Une las misiones en orden numerico mediante una ruta discontinua decorativa.
        const route = this.add.graphics();
        const orderedCamps = [...this.camps].sort((first, second) => first.number - second.number);

        route.lineStyle(2, 0xa47b3a, 0.34);
        orderedCamps.forEach((camp, index) => {
            if (index === orderedCamps.length - 1) {
                return;
            }

            const start = this.getMarkerPosition(camp, mapBounds);
            const end = this.getMarkerPosition(orderedCamps[index + 1], mapBounds);
            const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
            const dashes = Math.max(2, Math.floor(distance / 18));

            for (let dash = 0; dash < dashes; dash += 2) {
                const from = dash / dashes;
                const to = Math.min((dash + 1) / dashes, 1);
                route.lineBetween(
                    Phaser.Math.Linear(start.x, end.x, from),
                    Phaser.Math.Linear(start.y, end.y, from),
                    Phaser.Math.Linear(start.x, end.x, to),
                    Phaser.Math.Linear(start.y, end.y, to),
                );
            }
        });

        this.screen.add(route);
    }

    createMarker(camp, mapBounds) {
        // Los campos bloqueados se muestran, pero no reciben eventos de entrada.
        const position = this.getMarkerPosition(camp, mapBounds);
        const isLocked = camp.number > this.unlockedLevel;
        const marker = this.add.container(position.x, position.y);
        const glow = this.add.circle(0, 0, 19, 0xd6b450, 0);
        const point = this.add.circle(0, 0, 12, 0x251b12, 1).setStrokeStyle(2, 0xb18443, 1);
        const number = this.add.text(0, 0, `${camp.number}`, {
            fontFamily: 'Courier New',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#d6b450',
        }).setOrigin(0.5);

        marker.add([glow, point, number]);
        marker.setSize(45, 45);
        if (!isLocked) {
            marker.setInteractive({ useHandCursor: true });
            marker.on('pointerdown', () => this.selectCamp(camp.id));
            marker.on('pointerover', () => {
                if (camp.id !== this.selectedCampId) {
                    glow.setFillStyle(0xd6b450, 0.14);
                }
            });
            marker.on('pointerout', () => this.styleMarker(marker, camp.id === this.selectedCampId));
        }
        marker.campId = camp.id;
        marker.isLocked = isLocked;
        marker.visuals = { glow, point, number };
        this.markers.push(marker);
        this.screen.add(marker);
        this.styleMarker(marker, false);
    }

    createInfoPanel(layout) {
        // El panel derecho reutiliza sus textos al cambiar la mision seleccionada.
        const x = layout.infoX;
        const y = layout.panelY;
        const width = layout.infoWidth;
        const height = layout.panelHeight;
        const panel = this.add.graphics();
        panel.fillStyle(0x272116, 0.95);
        panel.lineStyle(2, 0xb18443, 0.88);
        panel.fillRect(x, y, width, height);
        panel.strokeRect(x, y, width, height);
        panel.lineStyle(1, 0xe2b75e, 0.22);
        panel.strokeRect(x + 7, y + 7, width - 14, height - 14);

        const archive = this.add.rectangle(x + 18, y + 18, width - 36, 112, 0x15120e, 0.85)
            .setOrigin(0)
            .setStrokeStyle(1, 0xd6b450, 0.34);
        const archiveLabel = this.add.text(x + 32, y + 32, 'ARCHIVO HISTÓRICO', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#b69a5b',
        });
        this.selectedNumber = this.add.text(x + width - 32, y + 32, '', {
            fontFamily: 'Courier New',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#d6b450',
        }).setOrigin(1, 0);
        this.selectedName = this.add.text(x + 32, y + 61, '', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '30px',
            color: '#eee8da',
        });
        this.selectedName.setStroke('#000000', 3);
        this.selectedPlace = this.add.text(x + 25, y + 146, '', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d6b450',
            wordWrap: { width: width - 50 },
        });
        this.selectedDescription = this.add.text(x + 25, y + 200, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#e0d7c5',
            wordWrap: { width: width - 50 },
            lineSpacing: 5,
        });
        const factLabel = this.add.text(x + 25, y + 320, 'DATO HISTÓRICO', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d6b450',
        });
        this.selectedFact = this.add.text(x + 25, y + 349, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#d0c5ad',
            wordWrap: { width: width - 50 },
            lineSpacing: 4,
        });
        const objectiveLabel = this.add.text(x + 25, y + 430, 'OBJETIVOS', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d6b450',
        });
        this.selectedObjective = this.add.text(x + 25, y + 461, '', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d0c5ad',
            wordWrap: { width: width - 50 },
            lineSpacing: 7,
        });
        const mission = this.add.rectangle(x + 25, y + height - 58, width - 50, 38, 0x806536, 0.8)
            .setOrigin(0)
            .setStrokeStyle(2, 0xe2b75e, 0.7)
            .setInteractive({ useHandCursor: true });
        mission.on('pointerover', () => mission.setFillStyle(0x9d7b3d, 0.92));
        mission.on('pointerout', () => mission.setFillStyle(0x806536, 0.8));
        mission.on('pointerdown', () => this.startSelectedMission());
        const missionText = this.add.text(x + width / 2, y + height - 39, 'INICIAR MISIÓN', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '20px',
            color: '#fff4d8',
        }).setOrigin(0.5);
        missionText.setStroke('#000000', 3);

        this.screen.add([
            panel,
            archive,
            archiveLabel,
            this.selectedNumber,
            this.selectedName,
            this.selectedPlace,
            this.selectedDescription,
            factLabel,
            this.selectedFact,
            objectiveLabel,
            this.selectedObjective,
            mission,
            missionText,
        ]);
    }

    selectCamp(campId) {
        // Una seleccion valida refresca el archivo y los objetivos de la mision.
        const camp = this.camps.find((entry) => entry.id === campId);

        if (!camp || camp.number > this.unlockedLevel) {
            return;
        }

        this.selectedCampId = camp.id;
        this.markers.forEach((marker) => this.styleMarker(marker, marker.campId === camp.id));
        this.selectedNumber.setText(`#${camp.number}`);
        this.selectedName.setText(camp.name);
        this.selectedPlace.setText(`${camp.location.toUpperCase()}\n${camp.years}`);
        this.selectedDescription.setText(camp.description);
        this.selectedFact.setText(camp.fact);
        this.selectedObjective.setText(
            `01   RECOLECTAR LAS LLAVES\n     LLAVES REQUERIDAS: ${String(camp.requiredKeys).padStart(2, '0')}`,
        );
    }

    startSelectedMission() {
        const camp = this.camps.find((entry) => entry.id === this.selectedCampId);

        if (!camp || camp.number > this.unlockedLevel) {
            return;
        }

        this.registry.set('selectedCamp', camp);
        this.registry.set('requiredKeys', camp.requiredKeys);
        this.scene.start('MissionLoadingScene', { selectedCamp: camp });
    }

    createVoiceNavigation() {
        this.voiceController = new window.InterfaceVoiceController(
            this,
            (command) => this.handleVoiceNavigationCommand(command),
        );
        const storedMode = window.localStorage.getItem('controlMode');
        const activeMode = storedMode === 'keyboard' || storedMode === 'voice'
            ? storedMode
            : this.registry.get('controlMode');

        if (activeMode === 'voice') {
            this.voiceController.start();
        }
    }

    destroyVoiceNavigation() {
        if (this.voiceController) {
            this.voiceController.destroy();
            this.voiceController = null;
        }
    }

    handleVoiceNavigationCommand(command) {
        if (/\b(volver|regresar|menu|salir)\b/.test(command)) {
            this.scene.start('MainMenuScene');
            return;
        }

        const numberMatch = command.match(/\b([1-8])\b/);
        const numberWords = {
            uno: 1,
            dos: 2,
            tres: 3,
            cuatro: 4,
            cinco: 5,
            seis: 6,
            siete: 7,
            ocho: 8,
        };
        const wordMatch = Object.keys(numberWords).find((word) => (
            new RegExp(`\\b${word}\\b`).test(command)
        ));
        const requestedNumber = numberMatch
            ? Number.parseInt(numberMatch[1], 10)
            : numberWords[wordMatch];
        const requestedCamp = requestedNumber
            ? this.camps.find((camp) => camp.number === requestedNumber)
            : this.camps.find((camp) => (
                command.includes(camp.id)
                || command.includes(camp.id.replace(/-/g, ' '))
            ));

        if (requestedCamp) {
            this.selectCamp(requestedCamp.id);
        }

        if (/\b(iniciar|jugar|entrar|comenzar)\b/.test(command)) {
            if (!requestedCamp || requestedCamp.id === this.selectedCampId) {
                this.startSelectedMission();
            }
        }
    }

    styleMarker(marker, isSelected) {
        if (marker.isLocked) {
            marker.visuals.glow.setFillStyle(0x000000, 0);
            marker.visuals.point.setFillStyle(0x14110f, 0.88);
            marker.visuals.point.setStrokeStyle(2, 0x696052, 0.72);
            marker.visuals.number.setText('X');
            marker.visuals.number.setColor('#756b5a');
            marker.setScale(0.9);
            marker.setAlpha(0.78);
            return;
        }

        marker.visuals.number.setText(
            `${this.camps.find((camp) => camp.id === marker.campId).number}`,
        );
        marker.visuals.glow.setFillStyle(0xd6b450, isSelected ? 0.2 : 0);
        marker.visuals.point.setFillStyle(isSelected ? 0xd09b31 : 0x251b12, 1);
        marker.visuals.point.setStrokeStyle(2, isSelected ? 0xffdb7c : 0xb18443, 1);
        marker.visuals.number.setColor(isSelected ? '#fff4d8' : '#d6b450');
        marker.setScale(isSelected ? 1.15 : 1);
        marker.setAlpha(1);
    }

    resizeCampaign() {
        this.overlay.setSize(this.scale.width, this.scale.height);
        this.scaleBackground();
        this.drawScreen();
    }

    scaleBackground() {
        const scale = Math.max(
            this.scale.width / this.background.width,
            this.scale.height / this.background.height,
        );

        this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
        this.background.setScale(scale);
    }
}

window.CampaignMapScene = CampaignMapScene;
