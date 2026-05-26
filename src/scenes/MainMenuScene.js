class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');

        this.menuItems = [
            {
                title: 'CAMPAÑA',
                subtitle: 'LIBERA LOS CAMPOS',
                icon: 'campaign',
                action: () => this.scene.start('CampaignMapScene'),
            },
            {
                title: 'DESAFÍOS',
                subtitle: 'PON A PRUEBA TUS HABILIDADES',
                icon: 'challenges',
            },
            {
                title: 'CONFIGURACIÓN',
                subtitle: 'AJUSTES DEL JUEGO',
                icon: 'options',
                action: () => this.openOptionsScene(),
            },
        ];

        this.hoveredMenuButton = null;
        this.menuButtonWidth = 390;
        this.menuButtonHeight = 66;
        this.menuButtonSpacing = 98;
        this.isTransitioning = false;
        this.microphoneRequestInProgress = false;
        this.voiceController = null;
    }

    preload() {
        this.load.image('main-menu-background', window.GameAssets.backgrounds.mainMenu);
        this.load.audio('background-music', window.GameAssets.audio.backgroundMusic);
    }

    create() {
        // El menu se compone de capas independientes para poder animarlas al navegar.
        this.isTransitioning = false;
        this.hoveredMenuButton = null;
        this.game.canvas.style.cursor = 'default';

        this.createBackground();
        this.createOverlay();
        this.createHeader();
        this.createMenu();
        this.createMicrophoneControl();
        this.createMenuPointerHandlers();
        this.createVoiceNavigation();
        this.startBackgroundMusic();

        if (this.isVoiceControlSelected()) {
            this.requestMicrophonePermission();
        }

        this.scale.on('resize', this.resizeMenu, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyMenuPointerHandlers, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyMenuResizeHandler, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyVoiceNavigation, this);
    }

    createMicrophoneControl() {
        const { x, y } = this.getMicrophoneControlPosition();

        this.microphoneButton = this.add.container(x, y);
        this.microphoneButton.setDepth(30);
        this.microphoneButton.setSize(50, 50);
        this.microphoneButton.setInteractive({ useHandCursor: true });
        this.microphoneButton.on('pointerdown', () => {
            if (this.isVoiceControlSelected()) {
                this.requestMicrophonePermission();
            }
        });
        this.microphoneBackground = this.add.graphics();
        this.microphoneIcon = this.add.graphics();
        this.microphoneButton.add([this.microphoneBackground, this.microphoneIcon]);

        this.microphoneStatus = this.add.text(x + 38, y, '', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#cfc7b3',
        }).setOrigin(0, 0.5).setDepth(30);
        if (this.isVoiceControlSelected()) {
            this.setMicrophoneState('requesting', 'SOLICITANDO PERMISO DE MICROFONO...');
        } else {
            this.setMicrophoneState('keyboard', 'MICROFONO DESACTIVADO');
        }
    }

    requestMicrophonePermission() {
        if (this.microphoneRequestInProgress) {
            return;
        }

        if (!this.isVoiceControlSelected()) {
            this.setMicrophoneState('keyboard', 'MICROFONO DESACTIVADO');
            return;
        }

        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            this.registry.set('voicePermissionGranted', false);
            this.setMicrophoneState('blocked', 'MICROFONO REQUIERE HTTPS O LOCALHOST');
            return;
        }

        this.microphoneRequestInProgress = true;
        this.setMicrophoneState('requesting', 'SOLICITANDO PERMISO DE MICROFONO...');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop());
                this.registry.set('voicePermissionGranted', true);

                if (this.sys.settings.active) {
                    this.setMicrophoneState('enabled', 'MICROFONO ACTIVADO');
                    this.voiceController.start();
                }
            })
            .catch(() => {
                this.registry.set('voicePermissionGranted', false);

                if (this.sys.settings.active) {
                    this.setMicrophoneState('blocked', 'MICROFONO BLOQUEADO - CLIC PARA REINTENTAR');
                }
            })
            .finally(() => {
                this.microphoneRequestInProgress = false;
            });
    }

    setMicrophoneState(state, label) {
        this.microphoneState = state;

        if (this.microphoneStatus) {
            this.microphoneStatus.setText(label);
        }

        if (!this.microphoneBackground || !this.microphoneIcon) {
            return;
        }

        const accent = state === 'enabled'
            ? 0xd6b450
            : state === 'blocked'
                ? 0xb94439
                : state === 'keyboard'
                    ? 0x8d8a78
                    : 0xe8e4d8;

        this.microphoneBackground.clear();
        this.microphoneBackground.fillStyle(0x141713, 0.62);
        this.microphoneBackground.lineStyle(2, accent, 0.8);
        this.microphoneBackground.fillRoundedRect(-25, -25, 50, 50, 8);
        this.microphoneBackground.strokeRoundedRect(-25, -25, 50, 50, 8);

        this.microphoneIcon.clear();
        this.microphoneIcon.fillStyle(accent, 0.94);
        this.microphoneIcon.fillRoundedRect(-6, -14, 12, 22, 6);
        this.microphoneIcon.lineStyle(3, accent, 0.94);
        this.microphoneIcon.beginPath();
        this.microphoneIcon.arc(0, -2, 13, 0, Math.PI, false);
        this.microphoneIcon.strokePath();
        this.microphoneIcon.lineBetween(0, 11, 0, 18);
        this.microphoneIcon.lineBetween(-9, 18, 9, 18);
    }

    createVoiceNavigation() {
        this.voiceController = new window.InterfaceVoiceController(
            this,
            (command) => this.handleVoiceNavigationCommand(command),
        );

        if (this.isVoiceControlSelected() && this.registry.get('voicePermissionGranted')) {
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
        if (this.isTransitioning) {
            return;
        }

        if (/\b(campana|campania|jugar|iniciar)\b/.test(command)) {
            this.menuItems[0].action();
            return;
        }

        if (/\b(configuracion|ajustes|opciones)\b/.test(command)) {
            this.menuItems[2].action();
            return;
        }

        if (/\b(desafios|desafio)\b/.test(command)) {
            this.setHoveredMenuButton(this.menuButtons[1]);
        }
    }

    getMicrophoneControlPosition() {
        return {
            x: 82,
            y: this.scale.height - 48,
        };
    }

    isVoiceControlSelected() {
        const storedMode = window.localStorage.getItem('controlMode');
        const registryMode = this.registry.get('controlMode');
        const controlMode = storedMode === 'keyboard' || storedMode === 'voice'
            ? storedMode
            : registryMode === 'keyboard' || registryMode === 'voice'
                ? registryMode
                : 'voice';

        this.registry.set('controlMode', controlMode);
        return controlMode === 'voice';
    }

    createBackground() {
        this.background = this.add.image(0, 0, 'main-menu-background').setOrigin(0.5);
        this.scaleBackground();
    }

    startBackgroundMusic() {
        // Una sola instancia global mantiene la musica continua entre pantallas.
        let music = this.sound.get('background-music');
        const musicVolume = this.getSavedVolume('musicVolume', 80);

        this.registry.set('musicVolume', musicVolume);

        if (!music) {
            music = this.sound.add('background-music', {
                loop: true,
                volume: musicVolume / 100,
            });
        }

        music.setVolume(musicVolume / 100);
        window.GameAudio = window.GameAudio || {};
        window.GameAudio.backgroundMusic = music;

        if (!music.isPlaying) {
            music.play();
            this.input.once('pointerdown', () => {
                if (!music.isPlaying) {
                    music.play();
                }
            });
        }
    }

    getSavedVolume(key, defaultValue) {
        const savedVolume = window.localStorage.getItem(key);
        const parsedVolume = Number(savedVolume);

        if (savedVolume !== null && Number.isFinite(parsedVolume)) {
            return Phaser.Math.Clamp(parsedVolume, 0, 100);
        }

        return defaultValue;
    }

    createOverlay() {
        this.leftShade = this.add.rectangle(0, 0, 520, this.scale.height, 0x050505, 0.46);
        this.leftShade.setOrigin(0, 0);

        this.vignette = this.add.graphics();
        this.drawVignette();
    }

    createHeader() {
        this.header = this.add.container(56, 40);

        const title = this.add.text(0, 54, 'LIBERACIÓN', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '66px',
            color: '#e8e4d8',
        });
        title.setStroke('#000000', 5);
        title.setShadow(2, 3, '#000000', 3);

        const year = this.add.text(198, 122, '1945', {
            fontFamily: 'Courier New',
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#d8d0bf',
        });
        year.setOrigin(0.5, 0);
        year.setStroke('#000000', 4);

        const tagline = this.add.text(0, 170, 'LIBERA LA HUMANIDAD.\nRECUERDA LA HISTORIA.', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#cfc7b3',
            lineSpacing: 8,
        });
        tagline.setStroke('#000000', 3);

        this.header.add([title, year, tagline]);
    }

    createMenu() {
        this.menuContainer = this.add.container(56, 310);
        this.menuButtons = [];

        this.menuItems.forEach((item, index) => {
            const button = this.createMenuButton(0, index * this.menuButtonSpacing, item, index === 0);
            this.menuContainer.add(button);
            this.menuButtons.push(button);
        });

        this.setHoveredMenuButton(this.menuButtons[0]);
    }

    createMenuButton(x, y, item, isSelected) {
        const button = this.add.container(x, y);
        const width = this.menuButtonWidth;
        const height = this.menuButtonHeight;
        const accentWidth = 5;

        const background = this.add.rectangle(0, 0, width, height, 0x141713, 0.48);
        background.setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.22);

        const accent = this.add.rectangle(0, 0, accentWidth, height, 0x8d8a78, 0.72);
        accent.setOrigin(0, 0);

        const icon = this.createMenuIcon(42, 33, item.icon, isSelected);

        const title = this.add.text(82, 15, item.title, {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '22px',
            color: '#bdb6a5',
        });
        title.setStroke('#000000', 3);

        const subtitle = this.add.text(82, 41, item.subtitle, {
            fontFamily: 'Courier New',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#8f8b7e',
        });
        subtitle.setStroke('#000000', 2);

        button.menuVisuals = {
            background,
            accent,
            icon,
            title,
            subtitle,
            isSelected,
        };
        button.menuItem = item;

        button.add([background, accent, icon, title, subtitle]);
        this.setMenuButtonState(button, isSelected);

        return button;
    }

    createMenuPointerHandlers() {
        // Se calcula el hover manualmente porque cada boton es un contenedor visual.
        this.handleMenuPointerMove = (pointer) => {
            const hoveredButton = this.getMenuButtonAtPointer(pointer);

            if (hoveredButton && hoveredButton !== this.hoveredMenuButton) {
                this.setHoveredMenuButton(hoveredButton);
            }

            this.game.canvas.style.cursor = hoveredButton ? 'pointer' : 'default';
        };

        this.handleMenuPointerDown = (pointer) => {
            const hoveredButton = this.getMenuButtonAtPointer(pointer);

            if (!this.isTransitioning && hoveredButton && hoveredButton.menuItem.action) {
                hoveredButton.menuItem.action();
            }
        };

        this.input.on('pointermove', this.handleMenuPointerMove);
        this.input.on('pointerdown', this.handleMenuPointerDown);
    }

    destroyMenuPointerHandlers() {
        this.input.off('pointermove', this.handleMenuPointerMove);
        this.input.off('pointerdown', this.handleMenuPointerDown);
        this.game.canvas.style.cursor = 'default';
    }

    destroyMenuResizeHandler() {
        this.scale.off('resize', this.resizeMenu, this);
    }

    getMenuButtonAtPointer(pointer) {
        if (this.isTransitioning) {
            return null;
        }

        const localX = pointer.x - this.menuContainer.x;
        const localY = pointer.y - this.menuContainer.y;

        return this.menuButtons.find((button) => (
            localX >= button.x
            && localX <= button.x + this.menuButtonWidth
            && localY >= button.y
            && localY <= button.y + this.menuButtonHeight
        )) || null;
    }

    openOptionsScene() {
        // Bloquea entradas repetidas durante la transicion de salida.
        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;
        this.destroyMenuPointerHandlers();

        const fade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050505, 0);
        fade.setOrigin(0, 0);
        fade.setDepth(40);

        this.tweens.add({
            targets: [this.header, this.menuContainer],
            x: -460,
            alpha: 0,
            duration: 520,
            ease: 'Cubic.easeInOut',
        });

        this.tweens.add({
            targets: this.leftShade,
            x: -520,
            duration: 520,
            ease: 'Cubic.easeInOut',
        });

        this.tweens.add({
            targets: fade,
            alpha: 0.46,
            duration: 520,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.scene.start('OptionsScene');
            },
        });
    }

    setHoveredMenuButton(activeButton) {
        this.hoveredMenuButton = activeButton;

        this.menuButtons.forEach((button) => {
            this.setMenuButtonState(button, button === activeButton);
        });
    }

    setMenuButtonState(button, isActive) {
        const { background, accent, icon, title, subtitle } = button.menuVisuals;
        const highlighted = isActive;

        background.setFillStyle(highlighted ? 0x76683f : 0x141713, highlighted ? 0.62 : 0.48);
        background.setStrokeStyle(2, 0xd8d0bf, highlighted ? 0.56 : 0.22);
        accent.setFillStyle(highlighted ? 0xd6b450 : 0x8d8a78, highlighted ? 0.96 : 0.72);
        title.setColor(highlighted ? '#fff4d8' : '#bdb6a5');
        subtitle.setColor(highlighted ? '#efe3bf' : '#8f8b7e');
        this.tintMenuIcon(icon, highlighted);
    }

    createMenuIcon(x, y, type, isActive) {
        const icon = this.add.graphics();
        icon.setPosition(x, y);
        icon.menuIconType = type;
        this.tintMenuIcon(icon, isActive);

        return icon;
    }

    tintMenuIcon(icon, isActive) {
        const lineColor = isActive ? 0xf1ead8 : 0xb7b09e;
        const shadowColor = 0x000000;

        icon.clear();
        icon.lineStyle(5, shadowColor, 0.45);
        this.drawMenuIconShape(icon, icon.menuIconType);
        icon.lineStyle(3, lineColor, 0.92);
        this.drawMenuIconShape(icon, icon.menuIconType);
        icon.fillStyle(lineColor, 0.18);
        this.fillMenuIconShape(icon, icon.menuIconType);
    }

    drawMenuIconShape(icon, type) {
        if (type === 'campaign') {
            this.drawStarIcon(icon, 0, 0, 16, 7);
            return;
        }

        if (type === 'challenges') {
            this.drawMedalIcon(icon);
            return;
        }

        this.drawGearIcon(icon);
    }

    fillMenuIconShape(icon, type) {
        if (type === 'campaign') {
            this.fillStarIcon(icon, 0, 0, 16, 7);
            return;
        }

        if (type === 'challenges') {
            icon.fillCircle(0, -5, 11);
            return;
        }

        icon.fillCircle(0, 0, 11);
    }

    drawStarIcon(icon, x, y, outerRadius, innerRadius) {
        const points = [];

        for (let point = 0; point < 10; point += 1) {
            const radius = point % 2 === 0 ? outerRadius : innerRadius;
            const angle = -Math.PI / 2 + point * Math.PI / 5;

            points.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
            });
        }

        icon.beginPath();
        icon.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => icon.lineTo(point.x, point.y));
        icon.closePath();
        icon.strokePath();
    }

    fillStarIcon(icon, x, y, outerRadius, innerRadius) {
        const points = [];

        for (let point = 0; point < 10; point += 1) {
            const radius = point % 2 === 0 ? outerRadius : innerRadius;
            const angle = -Math.PI / 2 + point * Math.PI / 5;

            points.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
            });
        }

        icon.fillPoints(points, true);
    }

    drawMedalIcon(icon) {
        icon.strokeCircle(0, -5, 11);
        icon.beginPath();
        icon.moveTo(-5, 6);
        icon.lineTo(-11, 19);
        icon.lineTo(-3, 16);
        icon.lineTo(0, 23);
        icon.lineTo(4, 16);
        icon.lineTo(11, 19);
        icon.lineTo(5, 6);
        icon.strokePath();
        this.drawStarIcon(icon, 0, -5, 7, 3);
    }

    drawGearIcon(icon) {
        const outerRadius = 16;
        const innerRadius = 12;

        icon.beginPath();
        for (let tooth = 0; tooth < 16; tooth += 1) {
            const radius = tooth % 2 === 0 ? outerRadius : innerRadius;
            const angle = tooth * Math.PI / 8;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (tooth === 0) {
                icon.moveTo(x, y);
            } else {
                icon.lineTo(x, y);
            }
        }
        icon.closePath();
        icon.strokePath();
        icon.strokeCircle(0, 0, 5);
    }

    scaleBackground() {
        const scale = Math.max(
            this.scale.width / this.background.width,
            this.scale.height / this.background.height,
        );

        this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
        this.background.setScale(scale);
    }

    drawVignette() {
        this.vignette.clear();
        this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.06, 0.18, 0.6);
        this.vignette.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    resizeMenu() {
        this.scaleBackground();
        this.leftShade.setSize(520, this.scale.height);
        this.drawVignette();

        if (this.microphoneButton) {
            const { x, y } = this.getMicrophoneControlPosition();

            this.microphoneButton.setPosition(x, y);
            this.microphoneStatus.setPosition(x + 38, y);
        }
    }
}

window.MainMenuScene = MainMenuScene;
