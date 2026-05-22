class LevelOneScene extends Phaser.Scene {
    constructor() {
        super('LevelOneScene');

        // Valores del nivel expresados como proporcion de pantalla para soportar resize.
        this.levelLayout = {
            backgroundOverscanRatio: 1.12,
            movementTopRatio: 0.78,
            movementBottomRatio: 0.90,
            playerStartXRatio: 0.10,
            playerHeightRatio: 0.20,
        };

        this.uiLayout = {
            pauseButtonMargin: 24,
            pauseButtonSize: 48,
            pauseBarWidth: 5,
            pauseBarHeight: 24,
            pauseBarGap: 12,
        };

        this.isPauseMenuOpen = false;
        this.isControlsGuideHiding = false;
    }

    preload() {
        // Carga los recursos necesarios antes de crear objetos en pantalla.
        this.load.image('level-one-background', window.GameAssets.backgrounds.levelOne);
        this.load.image('player-idle', window.GameAssets.sprites.playerIdle);
        this.load.spritesheet('player-walk', window.GameAssets.sprites.playerWalk, {
            frameWidth: 479,
            frameHeight: 500,
        });
        this.load.spritesheet('player-walk-up', window.GameAssets.sprites.playerWalkUp, {
            frameWidth: 251,
            frameHeight: 500,
        });
        this.load.spritesheet('player-move-down', window.GameAssets.sprites.playerMoveDown, {
            frameWidth: 254,
            frameHeight: 500,
        });
        this.load.spritesheet('player-shoot', window.GameAssets.sprites.playerShoot, {
            frameWidth: 278,
            frameHeight: 500,
        });
    }

    create() {
        // Se guarda la referencia para poder reajustar el fondo cuando cambie el tamano.
        this.background = this.add.image(0, 0, 'level-one-background').setOrigin(0.5);
        this.resizeWorldBounds();
        this.scaleBackground();

        this.createMovementArea();
        this.createAnimations();
        this.createPlayer();
        this.setupCamera();
        this.createPauseButton();
        this.createControlsGuideHud();
        this.createControls();

        // Phaser emite este evento cuando cambia el tamano del contenedor o la ventana.
        this.scale.on('resize', this.resizeLevel, this);
    }

    update(time, delta) {
        if (this.isPauseMenuOpen) {
            this.player.stopMovement();
            return;
        }

        if (this.hasPlayerInputStarted()) {
            this.hideControlsGuide();
        }

        this.player.updateMovement(this.cursors, this.keys, this.getMovementBounds(), delta);
    }

    scaleBackground() {
        const { width, height } = this.getWorldSize();
        const scale = this.getBackgroundScale();

        this.background.setPosition(width / 2, height / 2);
        this.background.setScale(scale);
    }

    createMovementArea() {
        const { width, height } = this.getWorldSize();
        const areaTop = height * this.levelLayout.movementTopRatio;
        const areaBottom = height * this.levelLayout.movementBottomRatio;
        const areaHeight = areaBottom - areaTop;

        // Area invisible del suelo por donde el jugador puede caminar en profundidad.
        this.movementArea = this.add.zone(width / 2, areaTop + areaHeight / 2, width, areaHeight);
    }

    createPlayer() {
        const { height } = this.getWorldSize();
        const groundY = height * this.levelLayout.movementBottomRatio;
        const playerX = this.scale.width * this.levelLayout.playerStartXRatio;
        const playerHeight = this.scale.height * this.levelLayout.playerHeightRatio;

        this.player = new window.Player(this, playerX, groundY, 'player-idle', playerHeight);
    }

    setupCamera() {
        const { width, height } = this.getWorldSize();

        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    createAnimations() {
        this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player-walk', {
                start: 0,
                end: 3,
            }),
            frameRate: 6,
            repeat: -1,
        });

        this.anims.create({
            key: 'player-walk-up',
            frames: this.anims.generateFrameNumbers('player-walk-up', {
                start: 0,
                end: 3,
            }),
            frameRate: 6,
            repeat: -1,
        });

        this.anims.create({
            key: 'player-move-down',
            frames: this.anims.generateFrameNumbers('player-move-down', {
                start: 0,
                end: 3,
            }),
            frameRate: 4,
            repeat: -1,
        });

        this.anims.create({
            key: 'player-shoot',
            frames: this.anims.generateFrameNumbers('player-shoot', {
                start: 0,
                end: 2,
            }),
            frameRate: 5,
            repeat: 0,
        });
    }

    getMovementBounds() {
        const { height } = this.getWorldSize();

        return {
            top: height * this.levelLayout.movementTopRatio,
            bottom: height * this.levelLayout.movementBottomRatio,
        };
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shoot: Phaser.Input.Keyboard.KeyCodes.X,
        });
    }

    hasPlayerInputStarted() {
        return this.cursors.left.isDown
            || this.cursors.right.isDown
            || this.cursors.up.isDown
            || this.cursors.down.isDown
            || this.keys.left.isDown
            || this.keys.right.isDown
            || this.keys.jump.isDown
            || this.keys.shoot.isDown;
    }

    resizeLevel() {
        this.resizeWorldBounds();
        this.resizeCamera();
        this.scaleBackground();
        this.resizeMovementArea();
        this.resizePlayer();
        this.resizePauseButton();
        this.resizeControlsGuide();
    }

    resizeWorldBounds() {
        const { width, height } = this.getWorldSize();

        // Los limites del mundo fisico deben coincidir con el area completa del escenario.
        this.physics.world.setBounds(0, 0, width, height);
    }

    resizeCamera() {
        const { width, height } = this.getWorldSize();

        this.cameras.main.setBounds(0, 0, width, height);
    }

    resizeMovementArea() {
        const { width, height } = this.getWorldSize();
        const areaTop = height * this.levelLayout.movementTopRatio;
        const areaBottom = height * this.levelLayout.movementBottomRatio;
        const areaHeight = areaBottom - areaTop;

        this.movementArea.setSize(width, areaHeight);
        this.movementArea.setPosition(width / 2, areaTop + areaHeight / 2);
    }

    resizePlayer() {
        const { height } = this.getWorldSize();
        const groundY = height * this.levelLayout.movementBottomRatio;
        const playerHeight = height * this.levelLayout.playerHeightRatio;

        this.player.setGroundPosition(this.player.x, groundY);
        this.player.resizeToHeight(playerHeight);
    }

    createPauseButton() {
        const { pauseButtonMargin, pauseButtonSize } = this.uiLayout;
        const buttonX = this.scale.width - pauseButtonMargin - pauseButtonSize / 2;
        const buttonY = pauseButtonMargin + pauseButtonSize / 2;

        this.pauseButton = this.add.container(buttonX, buttonY);
        this.pauseButton.setScrollFactor(0);
        this.pauseButton.setDepth(100);
        this.pauseButton.setSize(pauseButtonSize, pauseButtonSize);
        this.pauseButton.setInteractive({ useHandCursor: true });
        this.pauseButton.on('pointerdown', () => {
            this.openPauseMenu();
        });

        this.pauseButtonBackground = this.add.graphics();
        this.drawPauseButtonBackground();

        this.pauseButtonIcon = this.add.graphics();
        this.drawPauseIcon();

        this.pauseButton.add([this.pauseButtonBackground, this.pauseButtonIcon]);
    }

    drawPauseButtonBackground() {
        this.pauseButtonBackground.clear();
        this.pauseButtonBackground.fillStyle(0x111827, 0.68);
        this.pauseButtonBackground.lineStyle(2, 0xffffff, 0.32);
        this.pauseButtonBackground.fillRoundedRect(
            -this.uiLayout.pauseButtonSize / 2,
            -this.uiLayout.pauseButtonSize / 2,
            this.uiLayout.pauseButtonSize,
            this.uiLayout.pauseButtonSize,
            6,
        );
        this.pauseButtonBackground.strokeRoundedRect(
            -this.uiLayout.pauseButtonSize / 2,
            -this.uiLayout.pauseButtonSize / 2,
            this.uiLayout.pauseButtonSize,
            this.uiLayout.pauseButtonSize,
            6,
        );
    }

    drawPauseIcon() {
        const { pauseBarWidth, pauseBarHeight, pauseBarGap } = this.uiLayout;
        const leftBarX = -(pauseBarGap / 2) - pauseBarWidth;
        const rightBarX = pauseBarGap / 2;
        const barY = -pauseBarHeight / 2;

        this.pauseButtonIcon.clear();
        this.pauseButtonIcon.fillStyle(0xffffff, 0.9);
        this.pauseButtonIcon.fillRoundedRect(leftBarX, barY, pauseBarWidth, pauseBarHeight, 2);
        this.pauseButtonIcon.fillRoundedRect(rightBarX, barY, pauseBarWidth, pauseBarHeight, 2);
    }

    resizePauseButton() {
        const { pauseButtonMargin, pauseButtonSize } = this.uiLayout;
        const buttonX = this.scale.width - pauseButtonMargin - pauseButtonSize / 2;
        const buttonY = pauseButtonMargin + pauseButtonSize / 2;

        this.pauseButton.setPosition(buttonX, buttonY);
        this.resizePauseMenu();
    }

    openPauseMenu() {
        if (this.isPauseMenuOpen) {
            return;
        }

        this.isPauseMenuOpen = true;
        this.pauseButton.disableInteractive();
        this.createPauseMenu();
    }

    closePauseMenu() {
        this.isPauseMenuOpen = false;
        this.pauseButton.setInteractive({ useHandCursor: true });

        if (this.pauseMenu) {
            this.pauseMenu.destroy();
            this.pauseMenu = null;
        }
    }

    createPauseMenu() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const panelWidth = Math.min(360, this.scale.width - 48);
        const panelHeight = 220;

        this.pauseMenu = this.add.container(centerX, centerY);
        this.pauseMenu.setScrollFactor(0);
        this.pauseMenu.setDepth(200);

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.48);
        overlay.setOrigin(0.5);

        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x111827, 0.92);
        panel.setStrokeStyle(2, 0xffffff, 0.22);

        const title = this.add.text(0, -66, 'Pausa', {
            fontFamily: 'Arial',
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#ffffff',
        });
        title.setOrigin(0.5);
        title.setStroke('#000000', 5);

        const resumeButton = this.add.rectangle(0, 32, 190, 48, 0xffffff, 0.12);
        resumeButton.setStrokeStyle(2, 0xffffff, 0.38);
        resumeButton.setInteractive({ useHandCursor: true });
        resumeButton.on('pointerdown', () => {
            this.closePauseMenu();
        });

        const resumeText = this.add.text(0, 32, 'Continuar', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
        });
        resumeText.setOrigin(0.5);

        this.pauseMenu.add([overlay, panel, title, resumeButton, resumeText]);
    }

    createControlsGuideHud() {
        if (this.registry.get('levelOneControlsGuideSeen')) {
            return;
        }

        this.controlsGuide = this.createControlsGuide(76, 96);
        this.controlsGuide.setScrollFactor(0);
        this.controlsGuide.setDepth(1000);
        this.controlsGuide.setAlpha(0);
        this.isControlsGuideHiding = false;

        this.tweens.add({
            targets: this.controlsGuide,
            alpha: 1,
            duration: 250,
            ease: 'Quad.easeOut',
        });
    }

    createControlsGuide(x, y) {
        const guide = this.add.container(x, y);
        const title = this.add.text(0, 0, 'Controles', {
            fontFamily: 'Arial',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#ffffff',
        });
        title.setOrigin(0, 0);
        title.setStroke('#000000', 5);
        title.setShadow(0, 3, '#000000', 5);

        const labelStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#f2f5ff',
        };

        const arrowKeys = this.add.container(0, 44);
        this.addControlKey(arrowKeys, 39, 0, '\u2191');
        this.addControlKey(arrowKeys, 0, 30, '\u2190');
        this.addControlKey(arrowKeys, 39, 30, '\u2193');
        this.addControlKey(arrowKeys, 78, 30, '\u2192');

        guide.add([
            title,
            arrowKeys,
            this.addControlLabel(132, 88, 'para moverse', labelStyle),
            this.addControlKey(null, 0, 124, 'Espacio', 92),
            this.addControlLabel(132, 138, 'para saltar', labelStyle),
            this.addControlKey(null, 29, 164, 'X'),
            this.addControlLabel(132, 178, 'para disparar', labelStyle),
        ]);

        return guide;
    }

    hideControlsGuide() {
        if (!this.controlsGuide || this.isControlsGuideHiding) {
            return;
        }

        this.isControlsGuideHiding = true;
        this.registry.set('levelOneControlsGuideSeen', true);

        this.tweens.add({
            targets: this.controlsGuide,
            alpha: 0,
            duration: 180,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.controlsGuide.destroy();
                this.controlsGuide = null;
                this.isControlsGuideHiding = false;
            },
        });
    }

    resizeControlsGuide() {
        if (!this.controlsGuide) {
            return;
        }

        this.controlsGuide.setPosition(76, 96);
    }

    addControlKey(parent, x, y, text, width = 34, height = 28) {
        const key = this.add.container(x, y);
        const background = this.add.graphics();
        background.fillStyle(0x121820, 0.76);
        background.lineStyle(2, 0xffffff, 0.58);
        background.fillRoundedRect(0, 0, width, height, 6);
        background.strokeRoundedRect(0, 0, width, height, 6);

        const label = this.add.text(width / 2, height / 2, text, {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
        });
        label.setOrigin(0.5);
        label.setStroke('#000000', 3);

        key.add([background, label]);
        if (parent) {
            parent.add(key);
        }

        return key;
    }

    addControlLabel(x, y, text, textStyle) {
        const label = this.add.text(x, y, text, textStyle);

        label.setOrigin(0, 0.5);
        label.setStroke('#000000', 5);
        label.setShadow(0, 2, '#000000', 4);

        return label;
    }

    resizePauseMenu() {
        if (!this.pauseMenu) {
            return;
        }

        this.pauseMenu.setPosition(this.scale.width / 2, this.scale.height / 2);

        const overlay = this.pauseMenu.list[0];
        overlay.setSize(this.scale.width, this.scale.height);
    }

    getWorldSize() {
        const backgroundScale = this.getBackgroundScale();
        const backgroundWidth = this.background.width * backgroundScale;

        return {
            width: Math.max(this.scale.width, backgroundWidth),
            height: this.scale.height,
        };
    }

    getBackgroundScale() {
        // El overscan deja fondo extra a los lados para que la camara pueda moverse.
        const scaleX = this.scale.width / this.background.width;
        const scaleY = this.scale.height / this.background.height;

        return Math.max(scaleX, scaleY) * this.levelLayout.backgroundOverscanRatio;
    }
}

window.LevelOneScene = LevelOneScene;
