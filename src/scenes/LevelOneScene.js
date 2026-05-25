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
            enemyStartXRatio: 0.80,
            enemyHeightRatio: 0.22,
            enemyMinimumSpeed: 48,
            enemyMaximumSpeed: 92,
        };

        this.uiLayout = {
            pauseButtonMargin: 24,
            pauseButtonSize: 48,
            pauseBarWidth: 5,
            pauseBarHeight: 24,
            pauseBarGap: 12,
            hudMargin: 26,
            objectivePanelWidth: 188,
            objectivePanelHeight: 108,
            healthPanelWidth: 248,
            healthPanelHeight: 96,
            healthBarWidth: 208,
            healthBarHeight: 18,
            grenadePanelWidth: 190,
            grenadePanelHeight: 62,
            scorePanelWidth: 194,
            scorePanelHeight: 82,
            hudPanelGap: 14,
        };

        this.objectivesCompleted = 0;
        this.totalObjectives = 3;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.grenades = 3;
        this.score = 0;
        this.isPauseMenuOpen = false;
        this.isControlsGuideHiding = false;
    }

    init(data = {}) {
        const selectedCamp = data.selectedCamp || this.registry.get('selectedCamp');
        const requiredKeys = selectedCamp && selectedCamp.requiredKeys;

        this.objectivesCompleted = 0;
        this.totalObjectives = Number.isFinite(requiredKeys) ? requiredKeys : 3;
    }

    preload() {
        // Carga los recursos necesarios antes de crear objetos en pantalla.
        if (!this.textures.exists('level-one-background')) {
            this.load.image('level-one-background', window.GameAssets.backgrounds.levelOne);
        }
        this.load.image('player-idle', window.GameAssets.sprites.playerIdle);
        this.load.image('enemy-idle', window.GameAssets.sprites.enemyIdle);
        this.load.spritesheet('enemy-walk', window.GameAssets.sprites.enemyWalk, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('enemy-walk-down', window.GameAssets.sprites.enemyWalkDown, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('enemy-walk-up', window.GameAssets.sprites.enemyWalkUp, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('player-walk', window.GameAssets.sprites.playerWalk, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('player-walk-up', window.GameAssets.sprites.playerWalkUp, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('player-walk-down', window.GameAssets.sprites.playerWalkDown, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('player-shoot', window.GameAssets.sprites.playerShoot, {
            frameWidth: 384,
            frameHeight: 512,
        });
        this.load.spritesheet('player-grenade', window.GameAssets.sprites.playerGrenade, {
            frameWidth: 384,
            frameHeight: 512,
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
        this.createEnemy();
        this.setupCamera();
        this.createLevelHud();
        this.createPauseButton();
        this.createControlsGuideHud();
        this.createControls();

        // Phaser emite este evento cuando cambia el tamano del contenedor o la ventana.
        this.scale.on('resize', this.resizeLevel, this);
    }

    update(time, delta) {
        if (this.isPauseMenuOpen) {
            this.player.stopMovement();
            this.enemy.anims.pause();
            return;
        }

        if (this.hasPlayerInputStarted()) {
            this.hideControlsGuide();
        }

        this.player.updateMovement(this.cursors, this.keys, this.getMovementBounds(), delta);
        this.updateEnemy(delta);
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

    createEnemy() {
        const { width, height } = this.getWorldSize();
        const groundY = height * this.levelLayout.movementBottomRatio;
        const enemyX = width * this.levelLayout.enemyStartXRatio;
        const enemyHeight = height * this.levelLayout.enemyHeightRatio;

        this.enemy = this.add.sprite(enemyX, groundY, 'enemy-idle').setOrigin(0.5, 1);
        this.enemy.setDisplaySize(enemyHeight * (this.enemy.width / this.enemy.height), enemyHeight);
        this.enemyDirection = new Phaser.Math.Vector2(0, 0);
        this.enemyDirectionTime = 0;
        this.enemySpeed = 0;
        this.chooseEnemyDirection();
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
                end: 5,
            }),
            frameRate: 7,
            repeat: -1,
        });

        this.anims.create({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy-walk', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.anims.create({
            key: 'enemy-walk-down',
            frames: this.anims.generateFrameNumbers('enemy-walk-down', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.anims.create({
            key: 'enemy-walk-up',
            frames: this.anims.generateFrameNumbers('enemy-walk-up', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.anims.create({
            key: 'player-walk-up',
            frames: this.anims.generateFrameNumbers('player-walk-up', {
                start: 0,
                end: 3,
            }),
            frameRate: 4,
            repeat: -1,
        });

        this.anims.create({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player-walk-down', {
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

        this.anims.create({
            key: 'player-grenade',
            frames: this.anims.generateFrameNumbers('player-grenade', {
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

    updateEnemy(delta) {
        const { width } = this.getWorldSize();
        const movementBounds = this.getMovementBounds();
        const deltaSeconds = delta / 1000;
        const halfWidth = this.enemy.displayWidth / 2;
        const previousX = this.enemy.x;
        const previousY = this.enemy.y;

        if (this.enemy.anims.isPaused) {
            this.enemy.anims.resume();
        }

        this.enemyDirectionTime -= delta;
        if (this.enemyDirectionTime <= 0) {
            this.chooseEnemyDirection();
        }

        this.enemy.x += this.enemyDirection.x * this.enemySpeed * deltaSeconds;
        this.enemy.y += this.enemyDirection.y * this.enemySpeed * deltaSeconds;
        this.enemy.x = Phaser.Math.Clamp(this.enemy.x, halfWidth, width - halfWidth);
        this.enemy.y = Phaser.Math.Clamp(this.enemy.y, movementBounds.top, movementBounds.bottom);

        if (
            (this.enemy.x === previousX && this.enemyDirection.x !== 0)
            || (this.enemy.y === previousY && this.enemyDirection.y !== 0)
        ) {
            this.chooseEnemyDirection();
        }
    }

    chooseEnemyDirection() {
        const directions = [
            { x: -1, y: 0, animation: 'enemy-walk', flipX: true },
            { x: 1, y: 0, animation: 'enemy-walk', flipX: false },
            { x: 0, y: -1, animation: 'enemy-walk-up', flipX: false },
            { x: 0, y: 1, animation: 'enemy-walk-down', flipX: false },
            { x: -0.7, y: -0.7, animation: 'enemy-walk-up', flipX: true },
            { x: 0.7, y: -0.7, animation: 'enemy-walk-up', flipX: false },
            { x: -0.7, y: 0.7, animation: 'enemy-walk-down', flipX: true },
            { x: 0.7, y: 0.7, animation: 'enemy-walk-down', flipX: false },
            { x: 0, y: 0, animation: null, flipX: false },
        ];
        const direction = Phaser.Utils.Array.GetRandom(directions);

        this.enemyDirection.set(direction.x, direction.y);
        this.enemyDirectionTime = Phaser.Math.Between(700, 2100);
        this.enemySpeed = Phaser.Math.Between(
            this.levelLayout.enemyMinimumSpeed,
            this.levelLayout.enemyMaximumSpeed,
        );

        if (!direction.animation) {
            this.stopEnemy();
            return;
        }

        this.enemy.setFlipX(direction.flipX);
        this.enemy.play(direction.animation, true);
    }

    stopEnemy() {
        this.enemy.anims.stop();
        this.enemy.setTexture('enemy-idle');
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shoot: Phaser.Input.Keyboard.KeyCodes.X,
            grenade: Phaser.Input.Keyboard.KeyCodes.Z,
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
            || this.keys.shoot.isDown
            || this.keys.grenade.isDown;
    }

    resizeLevel() {
        this.resizeWorldBounds();
        this.resizeCamera();
        this.scaleBackground();
        this.resizeMovementArea();
        this.resizePlayer();
        this.resizeEnemy();
        this.resizeLevelHud();
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

    resizeEnemy() {
        const { width, height } = this.getWorldSize();
        const movementBounds = this.getMovementBounds();
        const enemyHeight = height * this.levelLayout.enemyHeightRatio;

        this.enemy.setDisplaySize(enemyHeight * (this.enemy.width / this.enemy.height), enemyHeight);
        this.enemy.setPosition(
            Phaser.Math.Clamp(this.enemy.x, this.enemy.displayWidth / 2, width - this.enemy.displayWidth / 2),
            Phaser.Math.Clamp(this.enemy.y, movementBounds.top, movementBounds.bottom),
        );
    }

    createPauseButton() {
        const {
            hudMargin,
            objectivePanelHeight,
            pauseButtonSize,
        } = this.uiLayout;
        const buttonX = this.scale.width - hudMargin - pauseButtonSize / 2;
        const buttonY = hudMargin + objectivePanelHeight / 2;

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
        const {
            hudMargin,
            objectivePanelHeight,
            pauseButtonSize,
        } = this.uiLayout;
        const buttonX = this.scale.width - hudMargin - pauseButtonSize / 2;
        const buttonY = hudMargin + objectivePanelHeight / 2;

        this.pauseButton.setPosition(buttonX, buttonY);
        this.resizePauseMenu();
    }

    createLevelHud() {
        this.objectiveHud = this.add.container(0, 0);
        this.objectiveHud.setScrollFactor(0);
        this.objectiveHud.setDepth(100);

        this.objectivePanel = this.add.graphics();
        this.objectiveTitle = this.add.text(this.uiLayout.objectivePanelWidth / 2, 17, 'OBJETIVOS', {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ddd3c3',
        }).setOrigin(0.5, 0);
        this.objectiveTitle.setShadow(0, 2, '#000000', 3);
        this.objectiveCount = this.add.text(this.uiLayout.objectivePanelWidth / 2, 49, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '42px',
            fontStyle: 'bold',
            color: '#d8a545',
        }).setOrigin(0.5, 0);
        this.objectiveCount.setShadow(0, 2, '#000000', 4);
        this.objectiveHud.add([this.objectivePanel, this.objectiveTitle, this.objectiveCount]);

        this.healthHud = this.add.container(0, 0);
        this.healthHud.setScrollFactor(0);
        this.healthHud.setDepth(100);

        this.healthPanel = this.add.graphics();
        this.healthTitle = this.add.text(20, 14, 'VIDA', {
            fontFamily: 'Georgia, serif',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#ddd3c3',
        });
        this.healthTitle.setShadow(0, 2, '#000000', 3);
        this.healthValue = this.add.text(this.uiLayout.healthPanelWidth - 20, 17, '', {
            fontFamily: 'Arial',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#e9ddcb',
        }).setOrigin(1, 0);
        this.healthBar = this.add.graphics();
        this.healthHud.add([this.healthPanel, this.healthTitle, this.healthValue, this.healthBar]);

        this.grenadeHud = this.add.container(0, 0);
        this.grenadeHud.setScrollFactor(0);
        this.grenadeHud.setDepth(100);

        this.grenadePanel = this.add.graphics();
        this.grenadeIcon = this.add.graphics();
        this.grenadeTitle = this.add.text(50, 31, 'GRANADAS', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ddd3c3',
        }).setOrigin(0, 0.5);
        this.grenadeTitle.setShadow(0, 2, '#000000', 3);
        this.grenadeCount = this.add.text(this.uiLayout.grenadePanelWidth - 18, 31, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#d8a545',
        }).setOrigin(1, 0.5);
        this.grenadeCount.setShadow(0, 2, '#000000', 4);
        this.grenadeHud.add([
            this.grenadePanel,
            this.grenadeIcon,
            this.grenadeTitle,
            this.grenadeCount,
        ]);

        this.scoreHud = this.add.container(0, 0);
        this.scoreHud.setScrollFactor(0);
        this.scoreHud.setDepth(100);

        this.scorePanel = this.add.graphics();
        this.scoreTitle = this.add.text(this.uiLayout.scorePanelWidth / 2, 12, 'SCORE', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ddd3c3',
        }).setOrigin(0.5, 0);
        this.scoreTitle.setShadow(0, 2, '#000000', 3);
        this.scoreValue = this.add.text(this.uiLayout.scorePanelWidth / 2, 38, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '29px',
            fontStyle: 'bold',
            color: '#d8a545',
        }).setOrigin(0.5, 0);
        this.scoreValue.setShadow(0, 2, '#000000', 4);
        this.scoreHud.add([this.scorePanel, this.scoreTitle, this.scoreValue]);

        this.drawHudPanels();
        this.drawGrenadeIcon();
        this.setObjectiveProgress(this.objectivesCompleted, this.totalObjectives);
        this.setHealth(this.currentHealth, this.maxHealth);
        this.setGrenades(this.grenades);
        this.setScore(this.score);
        this.resizeLevelHud();
    }

    drawHudPanels() {
        const {
            objectivePanelWidth,
            objectivePanelHeight,
            healthPanelWidth,
            healthPanelHeight,
            grenadePanelWidth,
            grenadePanelHeight,
            scorePanelWidth,
            scorePanelHeight,
        } = this.uiLayout;

        this.drawHudPanel(this.objectivePanel, objectivePanelWidth, objectivePanelHeight);
        this.drawHudPanel(this.healthPanel, healthPanelWidth, healthPanelHeight);
        this.drawHudPanel(this.grenadePanel, grenadePanelWidth, grenadePanelHeight);
        this.drawHudPanel(this.scorePanel, scorePanelWidth, scorePanelHeight);
    }

    drawHudPanel(graphics, width, height) {
        graphics.clear();
        graphics.fillStyle(0x211b14, 0.86);
        graphics.lineStyle(2, 0xb18443, 0.9);
        graphics.fillRect(0, 0, width, height);
        graphics.strokeRect(0, 0, width, height);
        graphics.lineStyle(1, 0xe2b75e, 0.26);
        graphics.strokeRect(5, 5, width - 10, height - 10);
    }

    drawGrenadeIcon() {
        this.grenadeIcon.clear();
        this.grenadeIcon.fillStyle(0xbaa170, 1);
        this.grenadeIcon.fillRect(28, 16, 8, 5);
        this.grenadeIcon.fillRect(32, 13, 7, 3);
        this.grenadeIcon.lineStyle(2, 0xd8a545, 0.95);
        this.grenadeIcon.beginPath();
        this.grenadeIcon.moveTo(35, 14);
        this.grenadeIcon.lineTo(42, 10);
        this.grenadeIcon.strokePath();
        this.grenadeIcon.fillStyle(0x4c5a39, 1);
        this.grenadeIcon.fillRoundedRect(19, 21, 25, 27, 10);
        this.grenadeIcon.lineStyle(2, 0xb18443, 0.95);
        this.grenadeIcon.strokeRoundedRect(19, 21, 25, 27, 10);
        this.grenadeIcon.lineStyle(1, 0x8c7444, 0.8);
        this.grenadeIcon.lineBetween(25, 23, 25, 46);
        this.grenadeIcon.lineBetween(37, 23, 37, 46);
    }

    setObjectiveProgress(completed, total = this.totalObjectives) {
        this.objectivesCompleted = Phaser.Math.Clamp(completed, 0, total);
        this.totalObjectives = total;

        if (this.objectiveCount) {
            this.objectiveCount.setText(`${this.objectivesCompleted}/${this.totalObjectives}`);
        }
    }

    setHealth(health, maxHealth = this.maxHealth) {
        this.maxHealth = Math.max(1, maxHealth);
        this.currentHealth = Phaser.Math.Clamp(health, 0, this.maxHealth);

        if (!this.healthBar) {
            return;
        }

        const { healthBarWidth, healthBarHeight } = this.uiLayout;
        const fillWidth = healthBarWidth * (this.currentHealth / this.maxHealth);

        this.healthValue.setText(`${this.currentHealth}/${this.maxHealth}`);
        this.healthBar.clear();
        this.healthBar.fillStyle(0x100d0c, 0.88);
        this.healthBar.fillRoundedRect(20, 55, healthBarWidth, healthBarHeight, 4);
        this.healthBar.lineStyle(2, 0xb18443, 0.85);
        this.healthBar.strokeRoundedRect(20, 55, healthBarWidth, healthBarHeight, 4);
        this.healthBar.fillStyle(0x982923, 1);
        this.healthBar.fillRoundedRect(22, 57, Math.max(0, fillWidth - 4), healthBarHeight - 4, 2);
        this.healthBar.fillStyle(0xe25437, 0.72);
        this.healthBar.fillRect(23, 58, Math.max(0, fillWidth - 6), 4);
    }

    setGrenades(grenades) {
        this.grenades = Math.max(0, grenades);

        if (this.grenadeCount) {
            this.grenadeCount.setText(`${this.grenades}`);
        }
    }

    setScore(score) {
        this.score = Math.max(0, score);

        if (this.scoreValue) {
            this.scoreValue.setText(`${this.score}`.padStart(6, '0'));
        }
    }

    resizeLevelHud() {
        const {
            hudMargin,
            objectivePanelWidth,
            healthPanelHeight,
            pauseButtonSize,
            hudPanelGap,
        } = this.uiLayout;

        this.healthHud.setPosition(hudMargin, hudMargin);
        this.grenadeHud.setPosition(hudMargin, hudMargin + healthPanelHeight + hudPanelGap);
        this.scoreHud.setPosition((this.scale.width - this.uiLayout.scorePanelWidth) / 2, hudMargin);
        this.objectiveHud.setPosition(
            this.scale.width - hudMargin - pauseButtonSize - hudPanelGap - objectivePanelWidth,
            hudMargin,
        );
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

        const { x, y } = this.getControlsGuidePosition();

        this.controlsGuide = this.createControlsGuide(x, y);
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
            this.addControlKey(null, 29, 204, 'Z'),
            this.addControlLabel(132, 218, 'para lanzar granada', labelStyle),
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

        const { x, y } = this.getControlsGuidePosition();

        this.controlsGuide.setPosition(x, y);
    }

    getControlsGuidePosition() {
        return {
            x: this.uiLayout.hudMargin + 12,
            y: this.uiLayout.hudMargin + this.uiLayout.healthPanelHeight
                + this.uiLayout.hudPanelGap + this.uiLayout.grenadePanelHeight + 28,
        };
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
