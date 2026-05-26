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
            bulletSpawnHeightRatio: 0.65,
            grenadeSpawnHeightRatio: 0.58,
            grenadeFuseMilliseconds: 900,
            explosionRadiusRatio: 0.20,
            enemyHeightRatio: 0.22,
            enemySightRange: 520,
            enemyShootRange: 250,
            enemyBulletRange: 280,
            enemyChaseSpeed: 115,
            enemyPatrolSpeed: 42,
            enemyPatrolMinMilliseconds: 850,
            enemyPatrolMaxMilliseconds: 1800,
            initialEnemyCount: 3,
            maximumEnemyCount: 4,
            enemyRespawnMilliseconds: 2200,
            enemySpawnRightMinRatio: 0.55,
            enemySpawnLeftMaxRatio: 0.38,
            enemyTwoSidedSpawnPlayerRatio: 0.45,
            enemyInitialSpawnMinDistance: 300,
            enemySpawnSafetyDistance: 85,
            enemySpawnMinSeparation: 145,
            enemyMovementMinSeparation: 92,
            enemyPlayerMinSeparation: 86,
            enemySpawnMaximumAttempts: 18,
            grenadeDropChance: 0.20,
            enemiesPerKeyDrop: 5,
            bulletHitScore: 10,
            enemyDefeatScore: 100,
            voiceMovementMilliseconds: 180,
            voiceInterimDelayMilliseconds: 180,
            voiceActionIntervalMilliseconds: 650,
            voiceJumpIntervalMilliseconds: 800,
            maximumVoiceCommandCount: 10,
            voiceCollectionAxisTolerance: 5,
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
            voiceButtonSize: 48,
        };

        this.objectivesCompleted = 0;
        this.totalObjectives = 3;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.grenades = 3;
        this.score = 0;
        this.defeatedEnemyCount = 0;
        this.isPauseMenuOpen = false;
        this.isControlsGuideHiding = false;
        this.enemyHitsToDefeat = 2;
        this.hasDefeatedFirstEnemy = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.voiceInput = null;
        this.voiceRecognition = null;
        this.isVoiceRecognitionEnabled = false;
        this.isVoiceListening = false;
        this.voiceMovementTimer = null;
        this.voiceSequenceTimers = [];
        this.voiceCollectionTarget = null;
        this.pendingVoiceResultTimers = new Map();
        this.processedVoiceResultIndexes = new Set();
        this.controlMode = 'voice';
    }

    init(data = {}) {
        // Cada entrada al nivel reinicia el estado usando los datos de la mision elegida.
        this.selectedCamp = data.selectedCamp || this.registry.get('selectedCamp');
        const requiredKeys = this.selectedCamp && this.selectedCamp.requiredKeys;

        this.objectivesCompleted = 0;
        this.totalObjectives = Number.isFinite(requiredKeys) ? requiredKeys : 3;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.grenades = 3;
        this.score = 0;
        this.defeatedEnemyCount = 0;
        this.isPauseMenuOpen = false;
        this.isControlsGuideHiding = false;
        this.hasDefeatedFirstEnemy = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.gameOverMenu = null;
        this.gameOverButtons = null;
        this.victoryMenu = null;
        this.victoryButtons = null;
        this.pauseMenu = null;
        this.voiceInput = null;
        this.voiceRecognition = null;
        this.isVoiceRecognitionEnabled = false;
        this.isVoiceListening = false;
        this.voiceMovementTimer = null;
        this.voiceSequenceTimers = [];
        this.voiceCollectionTarget = null;
        this.pendingVoiceResultTimers = new Map();
        this.processedVoiceResultIndexes = new Set();
        this.controlMode = this.getControlMode();
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
        this.load.spritesheet('enemy-dmg', window.GameAssets.sprites.enemyDamage, {
            frameWidth: 256,
            frameHeight: 512,
        });
        this.load.spritesheet('enemy-shoot', window.GameAssets.sprites.enemyShoot, {
            frameWidth: 384,
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
        this.load.image('bullet', window.GameAssets.items.bullet);
        this.load.image('grenade', window.GameAssets.items.grenade);
        this.load.image('explosion', window.GameAssets.items.explosion);
        this.load.image('key', window.GameAssets.items.key);
        this.load.audio('player-footsteps', window.GameAssets.audio.playerFootsteps);
        this.load.audio('player-shot', window.GameAssets.audio.playerShot);
        this.load.audio('grenade-explosion', window.GameAssets.audio.grenadeExplosion);
    }

    create() {
        // Se guarda la referencia para poder reajustar el fondo cuando cambie el tamano.
        this.background = this.add.image(0, 0, 'level-one-background').setOrigin(0.5);
        this.resizeWorldBounds();
        this.scaleBackground();

        // Construye mundo, actores e interfaz antes de habilitar la entrada del jugador.
        this.createMovementArea();
        this.createAnimations();
        this.createPlayer();
        this.createBullets();
        this.createGrenadeProjectiles();
        this.createEnemy();
        this.setupCamera();
        this.createLevelHud();
        this.createPauseButton();
        this.createControlsGuideHud();
        this.createControls();
        this.createVoiceControls();

        // Phaser emite este evento cuando cambia el tamano del contenedor o la ventana.
        this.scale.on('resize', this.resizeLevel, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.resizeLevel, this);
            this.destroyPauseSettingsPointerHandlers();
            this.destroyGameOverPointerHandlers();
            this.destroyVictoryPointerHandlers();
            this.destroyPlayerFootsteps();
            this.destroyVoiceControls();
            this.game.canvas.style.cursor = 'default';
        });
    }

    update(time, delta) {
        if (this.isGameOver || this.isLevelComplete) {
            this.stopPlayerFootsteps();
            return;
        }

        // La pausa congela la simulacion y el audio, conservando la imagen de la partida.
        if (this.isPauseMenuOpen) {
            this.player.stopMovement();
            this.stopPlayerFootsteps();
            this.enemies.children.each((enemy) => {
                if (enemy.active) {
                    enemy.anims.pause();
                }
            });
            return;
        }

        if (this.hasPlayerInputStarted()) {
            this.hideControlsGuide();
        }

        this.updateVoiceCollectionMovement();
        // El jugador comunica si camina para sincronizar el efecto de pasos.
        const isPlayerWalking = this.player.updateMovement(
            this.cursors,
            this.keys,
            this.voiceInput,
            this.controlMode,
            this.getMovementBounds(),
            delta,
        );
        this.updatePlayerFootsteps(isPlayerWalking);
        this.updateEnemy(delta);
        this.clearOffscreenBullets();
        this.clearOffscreenEnemyBullets();
        this.updateGrenadeProjectiles(delta);
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
        const effectsVolume = this.getPauseSettingValue('effectsVolume', 70);

        this.player = new window.Player(this, playerX, groundY, 'player-idle', playerHeight);
        // Los pasos son un efecto del nivel y arrancan con el volumen persistido.
        this.registry.set('effectsVolume', effectsVolume);
        this.playerFootsteps = this.sound.add('player-footsteps', {
            loop: true,
            volume: Math.min(1, (effectsVolume / 100) * 3),
        });
        this.playerShot = this.sound.add('player-shot', {
            volume: effectsVolume / 100,
        });
        this.grenadeExplosion = this.sound.add('grenade-explosion', {
            volume: Math.min(1, (effectsVolume / 100) * 1.6),
        });
        window.GameAudio = window.GameAudio || {};
        window.GameAudio.playerFootsteps = this.playerFootsteps;
        window.GameAudio.playerShot = this.playerShot;
        window.GameAudio.grenadeExplosion = this.grenadeExplosion;
    }

    createBullets() {
        this.bullets = this.physics.add.group({
            allowGravity: false,
        });
        this.enemyBullets = this.physics.add.group({
            allowGravity: false,
        });
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            this.handleEnemyBulletHitPlayer,
            null,
            this,
        );
    }

    fireBullet(player) {
        const direction = player.flipX ? -1 : 1;
        const muzzleX = player.x + direction * player.displayWidth * 0.48;
        const muzzleY = player.y - player.displayHeight * this.levelLayout.bulletSpawnHeightRatio;
        const bullet = this.bullets.create(muzzleX, muzzleY, 'bullet');

        bullet.setDepth(player.depth + 1);
        bullet.setFlipX(direction < 0);
        bullet.body.allowGravity = false;
        bullet.setVelocityX(direction * 650);
        this.playerShot.play();
    }

    clearOffscreenBullets() {
        const worldBounds = this.physics.world.bounds;

        this.bullets.children.each((bullet) => {
            if (
                bullet.active
                && (bullet.x < worldBounds.left - bullet.displayWidth
                    || bullet.x > worldBounds.right + bullet.displayWidth)
            ) {
                bullet.destroy();
            }
        });
    }

    fireEnemyBullet(enemy) {
        if (!enemy.active || enemy.isDead || !this.canEnemyShootPlayer(enemy)) {
            return;
        }

        const direction = this.player.x < enemy.x ? -1 : 1;
        const muzzleX = enemy.x + direction * enemy.displayWidth * 0.48;
        const muzzleY = enemy.y - enemy.displayHeight * this.levelLayout.bulletSpawnHeightRatio;
        const targetY = this.player.y - this.player.displayHeight * this.levelLayout.bulletSpawnHeightRatio;
        const velocity = new Phaser.Math.Vector2(
            this.player.x - muzzleX,
            targetY - muzzleY,
        ).normalize().scale(520);
        const bullet = this.enemyBullets.create(muzzleX, muzzleY, 'bullet');

        bullet.setDepth(enemy.depth + 1);
        bullet.setRotation(Math.atan2(velocity.y, velocity.x));
        bullet.body.allowGravity = false;
        bullet.setVelocity(velocity.x, velocity.y);
        bullet.startX = muzzleX;
        bullet.startY = muzzleY;
    }

    clearOffscreenEnemyBullets() {
        const worldBounds = this.physics.world.bounds;

        this.enemyBullets.children.each((bullet) => {
            if (
                bullet.active
                && (
                    bullet.x < worldBounds.left - bullet.displayWidth
                    || bullet.x > worldBounds.right + bullet.displayWidth
                    || bullet.y < worldBounds.top - bullet.displayHeight
                    || bullet.y > worldBounds.bottom + bullet.displayHeight
                    || Phaser.Math.Distance.Between(
                        bullet.startX,
                        bullet.startY,
                        bullet.x,
                        bullet.y,
                    ) >= this.levelLayout.enemyBulletRange
                )
            ) {
                bullet.destroy();
            }
        });
    }

    handleEnemyBulletHitPlayer(firstObject, secondObject) {
        const bullet = this.enemyBullets.contains(firstObject) ? firstObject : secondObject;

        if (!this.enemyBullets.contains(bullet)) {
            return;
        }

        bullet.disableBody(true, true);
        this.setHealth(this.currentHealth - 10);
    }

    createGrenadeProjectiles() {
        this.grenadeProjectiles = this.physics.add.group();
    }

    launchGrenade(player) {
        const direction = player.flipX ? -1 : 1;
        const grenadeX = player.x + direction * player.displayWidth * 0.32;
        const grenadeY = player.y - player.displayHeight * this.levelLayout.grenadeSpawnHeightRatio;
        const grenade = this.grenadeProjectiles.create(grenadeX, grenadeY, 'grenade');

        grenade.setDepth(player.depth + 1);
        grenade.setFlipX(direction < 0);
        grenade.setDisplaySize(44, 44);
        grenade.setVelocity(direction * 750, -410);
        grenade.setAngularVelocity(direction * 500);
        grenade.setDragX(250);
        grenade.hasHitFloor = false;
        grenade.fuseRemaining = null;
        // El jugador tiene origen inferior; player.y coincide con sus pies visibles al lanzar.
        grenade.landingY = player.y;
    }

    handleGrenadeHitFloor(grenade) {
        if (grenade.hasHitFloor) {
            return;
        }

        grenade.hasHitFloor = true;
        grenade.fuseRemaining = this.levelLayout.grenadeFuseMilliseconds;
        grenade.body.allowGravity = false;
        grenade.setVelocityY(0);
        grenade.setVelocityX(grenade.body.velocity.x * 0.48);
        grenade.setAngularVelocity(grenade.flipX ? -270 : 270);
    }

    updateGrenadeProjectiles(delta) {
        const worldBounds = this.physics.world.bounds;

        this.grenadeProjectiles.children.each((grenade) => {
            if (
                grenade.active
                && !grenade.hasHitFloor
                && grenade.body.velocity.y >= 0
                && grenade.y + grenade.displayHeight / 2 >= grenade.landingY
            ) {
                grenade.setY(grenade.landingY - grenade.displayHeight / 2);
                this.handleGrenadeHitFloor(grenade);
            }

            if (grenade.active && grenade.fuseRemaining !== null) {
                grenade.fuseRemaining -= delta;

                if (grenade.fuseRemaining <= 0) {
                    this.detonateGrenade(grenade);
                    return;
                }
            }

            if (
                grenade.active
                && (
                    grenade.x < worldBounds.left - grenade.displayWidth
                    || grenade.x > worldBounds.right + grenade.displayWidth
                    || grenade.y > worldBounds.bottom + grenade.displayHeight
                )
            ) {
                grenade.destroy();
            }
        });
    }

    detonateGrenade(grenade, impactEnemy = null) {
        const explosionX = impactEnemy && impactEnemy.active ? impactEnemy.x : grenade.x;
        const explosionY = impactEnemy && impactEnemy.active ? impactEnemy.y : grenade.landingY;
        const explosionSize = Phaser.Math.Clamp(this.scale.height * 0.33, 215, 350);
        const explosionRadius = Phaser.Math.Clamp(
            this.scale.height * this.levelLayout.explosionRadiusRatio,
            130,
            220,
        );

        grenade.disableBody(true, true);
        this.grenadeExplosion.play();

        const explosion = this.add.image(explosionX, explosionY, 'explosion').setOrigin(0.5, 1);
        explosion.setDepth(this.player.depth + 2);
        explosion.setDisplaySize(explosionSize * 0.7, explosionSize * 0.7);
        explosion.setAlpha(0.95);
        this.tweens.add({
            targets: explosion,
            displayWidth: explosionSize,
            displayHeight: explosionSize,
            alpha: 0,
            duration: 5000,
            ease: 'Quad.easeOut',
            onComplete: () => explosion.destroy(),
        });

        this.enemies.children.each((enemy) => {
            if (
                enemy.active
                && Phaser.Math.Distance.Between(explosionX, explosionY, enemy.x, enemy.y)
                    <= explosionRadius
            ) {
                this.defeatEnemy(enemy);
            }
        });
    }

    updatePlayerFootsteps(isPlayerWalking) {
        // Una sola instancia en bucle evita crear audio nuevo en cada frame.
        if (!this.playerFootsteps) {
            return;
        }

        if (isPlayerWalking) {
            if (!this.playerFootsteps.isPlaying) {
                this.playerFootsteps.play();
            }
            return;
        }

        this.stopPlayerFootsteps();
    }

    stopPlayerFootsteps() {
        if (this.playerFootsteps && this.playerFootsteps.isPlaying) {
            this.playerFootsteps.stop();
        }
    }

    destroyPlayerFootsteps() {
        // Libera el sonido y su referencia compartida al abandonar el nivel.
        if (!this.playerFootsteps) {
            return;
        }

        if (window.GameAudio && window.GameAudio.playerFootsteps === this.playerFootsteps) {
            window.GameAudio.playerFootsteps = null;
        }

        this.playerFootsteps.destroy();
        this.playerFootsteps = null;

        if (window.GameAudio && window.GameAudio.playerShot === this.playerShot) {
            window.GameAudio.playerShot = null;
        }

        if (this.playerShot) {
            this.playerShot.destroy();
            this.playerShot = null;
        }

        if (window.GameAudio && window.GameAudio.grenadeExplosion === this.grenadeExplosion) {
            window.GameAudio.grenadeExplosion = null;
        }

        if (this.grenadeExplosion) {
            this.grenadeExplosion.destroy();
            this.grenadeExplosion = null;
        }
    }

    createEnemy() {
        this.enemies = this.physics.add.group({ allowGravity: false });
        this.grenadeDrops = this.physics.add.group({ allowGravity: false });
        this.keyDrops = this.physics.add.group({ allowGravity: false });
        this.enemyRespawnTime = this.levelLayout.enemyRespawnMilliseconds;
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHitEnemy, null, this);
        this.physics.add.overlap(
            this.grenadeProjectiles,
            this.enemies,
            this.handleGrenadeHitEnemy,
            null,
            this,
        );
        this.physics.add.overlap(this.player, this.grenadeDrops, this.collectGrenadeDrop, null, this);
        this.physics.add.overlap(this.player, this.keyDrops, this.collectKeyDrop, null, this);

        for (let index = 0; index < this.levelLayout.initialEnemyCount; index += 1) {
            this.spawnEnemy(true);
        }
    }

    spawnEnemy(isInitialSpawn = false) {
        const { width, height } = this.getWorldSize();
        const movementBounds = this.getMovementBounds();
        const enemyHeight = height * this.levelLayout.enemyHeightRatio;
        const enemyHalfWidth = enemyHeight * 0.25;
        const rightMinX = Math.max(
            enemyHalfWidth,
            width * this.levelLayout.enemySpawnRightMinRatio,
        );
        const maxX = width - enemyHalfWidth;
        const leftMaxX = Math.min(
            maxX,
            width * this.levelLayout.enemySpawnLeftMaxRatio,
        );
        const canSpawnOnBothSides = !isInitialSpawn
            && this.player.x >= width * this.levelLayout.enemyTwoSidedSpawnPlayerRatio;
        const minimumPlayerDistance = isInitialSpawn
            ? this.levelLayout.enemyInitialSpawnMinDistance
            : this.levelLayout.enemySpawnSafetyDistance;
        let enemyX;
        let enemyY;

        for (let attempt = 0; attempt < this.levelLayout.enemySpawnMaximumAttempts; attempt += 1) {
            const spawnOnLeft = canSpawnOnBothSides && Phaser.Math.Between(0, 1) === 0;
            const candidateX = spawnOnLeft
                ? Phaser.Math.Between(Math.ceil(enemyHalfWidth), Math.floor(leftMaxX))
                : Phaser.Math.Between(Math.ceil(rightMinX), Math.floor(maxX));
            const candidateY = Phaser.Math.Between(
                Math.ceil(movementBounds.top),
                Math.floor(movementBounds.bottom),
            );
            const farEnoughFromPlayer = Phaser.Math.Distance.Between(
                candidateX,
                candidateY,
                this.player.x,
                this.player.y,
            ) >= minimumPlayerDistance;
            const separatedFromEnemies = this.enemies.getChildren().every((otherEnemy) => (
                !otherEnemy.active
                || Phaser.Math.Distance.Between(
                    candidateX,
                    candidateY,
                    otherEnemy.x,
                    otherEnemy.y,
                ) >= this.levelLayout.enemySpawnMinSeparation
            ));

            if (farEnoughFromPlayer && separatedFromEnemies) {
                enemyX = candidateX;
                enemyY = candidateY;
                break;
            }
        }

        if (enemyX === undefined || enemyY === undefined) {
            return null;
        }

        enemyX = Phaser.Math.Clamp(enemyX, enemyHalfWidth, maxX);
        const enemy = this.enemies.create(enemyX, enemyY, 'enemy-idle').setOrigin(0.5, 1);

        enemy.body.allowGravity = false;
        enemy.body.setImmovable(true);
        enemy.setDisplaySize(enemyHeight * (enemy.width / enemy.height), enemyHeight);
        enemy.direction = new Phaser.Math.Vector2(0, 0);
        enemy.hitsReceived = 0;
        enemy.isDead = false;
        enemy.isTakingDamage = false;
        enemy.isShooting = false;
        enemy.hasFiredCurrentShot = false;
        enemy.shootTime = Phaser.Math.Between(1500, 2800);
        enemy.patrolDirection = new Phaser.Math.Vector2(0, 0);
        enemy.patrolTime = 0;
        this.chooseEnemyPatrolDirection(enemy);
        enemy.on('animationupdate', (animation, frame) => {
            const isFireFrame = animation.key === 'enemy-shoot' && frame.textureFrame === 1;

            if (isFireFrame && !enemy.hasFiredCurrentShot) {
                enemy.hasFiredCurrentShot = true;
                this.fireEnemyBullet(enemy);
            }
        });
        enemy.on('animationcomplete', (animation) => {
            if (animation.key === 'enemy-shoot') {
                enemy.isShooting = false;
                enemy.hasFiredCurrentShot = false;
                return;
            }

            if (animation.key !== 'enemy-dmg') {
                return;
            }

            enemy.isTakingDamage = false;
        });

        return enemy;
    }

    setupCamera() {
        const { width, height } = this.getWorldSize();

        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    createAnimations() {
        // El administrador de animaciones es global: se reutilizan al volver al nivel.
        this.createAnimationIfMissing({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player-walk', {
                start: 0,
                end: 5,
            }),
            frameRate: 7,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy-walk', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'enemy-walk-down',
            frames: this.anims.generateFrameNumbers('enemy-walk-down', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'enemy-walk-up',
            frames: this.anims.generateFrameNumbers('enemy-walk-up', {
                start: 0,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'enemy-dmg',
            frames: this.anims.generateFrameNumbers('enemy-dmg', {
                start: 0,
                end: 1,
            }),
            frameRate: 4,
            repeat: 0,
        });

        this.createAnimationIfMissing({
            key: 'enemy-shoot',
            frames: this.anims.generateFrameNumbers('enemy-shoot', {
                start: 0,
                end: 2,
            }),
            frameRate: 5,
            repeat: 0,
        });

        this.createAnimationIfMissing({
            key: 'player-walk-up',
            frames: this.anims.generateFrameNumbers('player-walk-up', {
                start: 0,
                end: 3,
            }),
            frameRate: 4,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player-walk-down', {
                start: 0,
                end: 3,
            }),
            frameRate: 4,
            repeat: -1,
        });

        this.createAnimationIfMissing({
            key: 'player-shoot',
            frames: this.anims.generateFrameNumbers('player-shoot', {
                start: 0,
                end: 2,
            }),
            frameRate: 5,
            repeat: 0,
        });

        this.createAnimationIfMissing({
            key: 'player-grenade',
            frames: this.anims.generateFrameNumbers('player-grenade', {
                start: 0,
                end: 2,
            }),
            frameRate: 5,
            repeat: 0,
        });
    }

    createAnimationIfMissing(config) {
        if (!this.anims.exists(config.key)) {
            this.anims.create(config);
        }
    }

    getMovementBounds() {
        const { height } = this.getWorldSize();

        return {
            top: height * this.levelLayout.movementTopRatio,
            bottom: height * this.levelLayout.movementBottomRatio,
        };
    }

    updateEnemy(delta) {
        if (!this.hasDefeatedFirstEnemy) {
            this.enemies.children.each((enemy) => {
                if (enemy.active) {
                    this.updateSingleEnemy(enemy, delta);
                }
            });
            return;
        }

        this.enemyRespawnTime -= delta;
        if (
            this.enemies.countActive(true) < this.levelLayout.maximumEnemyCount
            && this.enemyRespawnTime <= 0
        ) {
            const enemy = this.spawnEnemy();
            this.enemyRespawnTime = enemy
                ? this.levelLayout.enemyRespawnMilliseconds
                : 500;
        }

        this.enemies.children.each((enemy) => {
            if (enemy.active) {
                this.updateSingleEnemy(enemy, delta);
            }
        });
    }

    updateSingleEnemy(enemy, delta) {
        if (enemy.anims.isPaused) {
            enemy.anims.resume();
        }

        if (enemy.isTakingDamage) {
            return;
        }

        const { width } = this.getWorldSize();
        const movementBounds = this.getMovementBounds();
        const deltaSeconds = delta / 1000;

        if (enemy.isShooting) {
            if (this.canEnemyShootPlayer(enemy)) {
                return;
            }

            // No completa el gesto de disparo si el jugador ya salio del rango permitido.
            enemy.isShooting = false;
            enemy.hasFiredCurrentShot = false;
            enemy.anims.stop();
            enemy.shootTime = Phaser.Math.Between(900, 1500);
        }

        enemy.shootTime -= delta;
        if (this.canEnemyShootPlayer(enemy)) {
            if (enemy.shootTime <= 0) {
                this.startEnemyShoot(enemy);
                return;
            }

            this.stopEnemy(enemy);
            return;
        }

        if (this.canEnemySeePlayer(enemy)) {
            this.chasePlayer(enemy, deltaSeconds, width, movementBounds);
        } else {
            this.patrolEnemy(enemy, delta, deltaSeconds, width, movementBounds);
        }

        if (enemy.shootTime <= 0) {
            enemy.shootTime = Phaser.Math.Between(900, 1500);
        }
    }

    chasePlayer(enemy, deltaSeconds, width, movementBounds) {
        const toPlayer = new Phaser.Math.Vector2(
            this.player.x - enemy.x,
            this.player.y - enemy.y,
        );

        if (toPlayer.lengthSq() === 0) {
            return;
        }

        const direction = toPlayer.normalize();
        const halfWidth = enemy.displayWidth / 2;
        const nextX = Phaser.Math.Clamp(
            enemy.x + direction.x * this.levelLayout.enemyChaseSpeed * deltaSeconds,
            halfWidth,
            width - halfWidth,
        );
        const nextY = Phaser.Math.Clamp(
            enemy.y + direction.y * this.levelLayout.enemyChaseSpeed * deltaSeconds,
            movementBounds.top,
            movementBounds.bottom,
        );
        let hasMoved = false;

        enemy.direction.set(direction.x, direction.y);
        if (this.canEnemyOccupyPosition(enemy, nextX, nextY)) {
            enemy.setPosition(nextX, nextY);
            hasMoved = true;
        } else if (this.canEnemyOccupyPosition(enemy, nextX, enemy.y)) {
            enemy.setX(nextX);
            hasMoved = true;
        } else if (this.canEnemyOccupyPosition(enemy, enemy.x, nextY)) {
            enemy.setY(nextY);
            hasMoved = true;
        }

        if (!hasMoved) {
            this.stopEnemy(enemy);
            return;
        }

        this.playEnemyMovementAnimation(enemy, direction);
    }

    patrolEnemy(enemy, delta, deltaSeconds, width, movementBounds) {
        enemy.patrolTime -= delta;
        if (enemy.patrolTime <= 0) {
            this.chooseEnemyPatrolDirection(enemy);
        }

        const direction = enemy.patrolDirection;
        const halfWidth = enemy.displayWidth / 2;
        const nextX = Phaser.Math.Clamp(
            enemy.x + direction.x * this.levelLayout.enemyPatrolSpeed * deltaSeconds,
            halfWidth,
            width - halfWidth,
        );
        const nextY = Phaser.Math.Clamp(
            enemy.y + direction.y * this.levelLayout.enemyPatrolSpeed * deltaSeconds,
            movementBounds.top,
            movementBounds.bottom,
        );

        if (!this.canEnemyOccupyPosition(enemy, nextX, nextY)) {
            this.chooseEnemyPatrolDirection(enemy);
            this.stopEnemy(enemy);
            return;
        }

        enemy.direction.copy(direction);
        enemy.setPosition(nextX, nextY);
        this.playEnemyMovementAnimation(enemy, direction);
    }

    chooseEnemyPatrolDirection(enemy) {
        const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
            [-1, -0.45],
            [1, -0.45],
            [-1, 0.45],
            [1, 0.45],
        ];
        const direction = directions[Phaser.Math.Between(0, directions.length - 1)];

        enemy.patrolDirection.set(direction[0], direction[1]).normalize();
        enemy.patrolTime = Phaser.Math.Between(
            this.levelLayout.enemyPatrolMinMilliseconds,
            this.levelLayout.enemyPatrolMaxMilliseconds,
        );
    }

    playEnemyMovementAnimation(enemy, direction) {
        if (Math.abs(direction.x) >= Math.abs(direction.y)) {
            enemy.setFlipX(direction.x < 0);
            enemy.play('enemy-walk', true);
            return;
        }

        enemy.setFlipX(false);
        enemy.play(direction.y < 0 ? 'enemy-walk-up' : 'enemy-walk-down', true);
    }

    canEnemyOccupyPosition(enemy, x, y) {
        const playerGroundY = Number.isFinite(this.player.groundY)
            ? this.player.groundY
            : this.player.y;
        const farEnoughFromPlayer = Phaser.Math.Distance.Between(
            x,
            y,
            this.player.x,
            playerGroundY,
        ) >= this.levelLayout.enemyPlayerMinSeparation;

        return farEnoughFromPlayer && this.enemies.getChildren().every((otherEnemy) => (
            otherEnemy === enemy
            || !otherEnemy.active
            || Phaser.Math.Distance.Between(
                x,
                y,
                otherEnemy.x,
                otherEnemy.y,
            ) >= this.levelLayout.enemyMovementMinSeparation
        ));
    }

    handleBulletHitEnemy(firstObject, secondObject) {
        const bullet = this.bullets.contains(firstObject) ? firstObject : secondObject;
        const enemy = this.enemies.contains(firstObject) ? firstObject : secondObject;

        if (!this.bullets.contains(bullet) || !this.enemies.contains(enemy) || !enemy.active) {
            return;
        }

        // Desactivar es seguro dentro del callback de Arcade; destruir el body
        // mientras el mundo procesa el overlap puede interrumpir el frame.
        // Identificar el proyectil evita ocultar al enemigo si Phaser invierte argumentos.
        bullet.disableBody(true, true);
        this.setScore(this.score + this.levelLayout.bulletHitScore);
        enemy.hitsReceived += 1;

        if (enemy.hitsReceived >= this.enemyHitsToDefeat) {
            this.defeatEnemy(enemy);
            return;
        }

        enemy.isTakingDamage = true;
        enemy.isShooting = false;
        enemy.hasFiredCurrentShot = false;
        enemy.direction.set(0, 0);
        enemy.play('enemy-dmg', true);
    }

    handleGrenadeHitEnemy(firstObject, secondObject) {
        const grenade = this.grenadeProjectiles.contains(firstObject) ? firstObject : secondObject;
        const enemy = this.enemies.contains(firstObject) ? firstObject : secondObject;

        if (
            !this.grenadeProjectiles.contains(grenade)
            || !this.enemies.contains(enemy)
            || !grenade.active
            || !enemy.active
        ) {
            return;
        }

        this.detonateGrenade(grenade, enemy);
    }

    startEnemyShoot(enemy) {
        if (
            enemy.isTakingDamage
            || enemy.isDead
            || enemy.isShooting
            || !this.canEnemyShootPlayer(enemy)
        ) {
            return;
        }

        enemy.isShooting = true;
        enemy.hasFiredCurrentShot = false;
        enemy.shootTime = Phaser.Math.Between(1800, 3200);
        enemy.direction.set(0, 0);
        enemy.setFlipX(this.player.x < enemy.x);
        enemy.play('enemy-shoot', true);
    }

    canEnemyShootPlayer(enemy) {
        const cameraView = this.cameras.main.worldView;
        const enemyIsVisible = Phaser.Geom.Intersects.RectangleToRectangle(
            cameraView,
            enemy.getBounds(),
        );
        const direction = this.player.x < enemy.x ? -1 : 1;
        const muzzleX = enemy.x + direction * enemy.displayWidth * 0.48;
        const muzzleY = enemy.y - enemy.displayHeight * this.levelLayout.bulletSpawnHeightRatio;
        const targetY = this.player.y - this.player.displayHeight
            * this.levelLayout.bulletSpawnHeightRatio;
        const shotDistance = Phaser.Math.Distance.Between(
            muzzleX,
            muzzleY,
            this.player.x,
            targetY,
        );

        return (
            enemyIsVisible
            && this.canEnemySeePlayer(enemy)
            && shotDistance <= this.levelLayout.enemyShootRange
            && shotDistance <= this.levelLayout.enemyBulletRange
        );
    }

    canEnemySeePlayer(enemy) {
        const cameraView = this.cameras.main.worldView;

        return Phaser.Geom.Intersects.RectangleToRectangle(cameraView, enemy.getBounds())
            && Phaser.Geom.Intersects.RectangleToRectangle(cameraView, this.player.getBounds());
    }

    defeatEnemy(enemy) {
        if (!enemy.active || enemy.isDead) {
            return;
        }

        const dropX = enemy.x;
        const dropY = enemy.y;

        enemy.isDead = true;
        enemy.isTakingDamage = false;
        enemy.isShooting = false;
        enemy.hasFiredCurrentShot = false;
        enemy.direction.set(0, 0);
        enemy.disableBody(true, true);
        this.setScore(this.score + this.levelLayout.enemyDefeatScore);
        this.defeatedEnemyCount += 1;
        this.tryDropGrenade(dropX, dropY);
        this.tryDropKey(dropX, dropY);

        if (!this.hasDefeatedFirstEnemy) {
            this.hasDefeatedFirstEnemy = true;
            this.spawnEnemy();
            this.enemyRespawnTime = this.levelLayout.enemyRespawnMilliseconds;
            return;
        }

        this.enemyRespawnTime = Math.min(this.enemyRespawnTime, this.levelLayout.enemyRespawnMilliseconds);
    }

    tryDropGrenade(x, y) {
        if (Math.random() > this.levelLayout.grenadeDropChance) {
            return;
        }

        const drop = this.grenadeDrops.create(x, y, 'grenade');

        drop.body.allowGravity = false;
        drop.setOrigin(0.5, 1);
        drop.setDepth(this.player.depth + 1);
        drop.setDisplaySize(30, 30);
    }

    collectGrenadeDrop(firstObject, secondObject) {
        const drop = this.grenadeDrops.contains(firstObject) ? firstObject : secondObject;

        if (!this.grenadeDrops.contains(drop) || !drop.active) {
            return;
        }

        drop.disableBody(true, true);
        this.setGrenades(this.grenades + 1);
        this.finishVoiceCollection(drop, 'GRANADA RECOGIDA');
    }

    tryDropKey(x, y) {
        if (this.defeatedEnemyCount % this.levelLayout.enemiesPerKeyDrop !== 0) {
            return;
        }

        const drop = this.keyDrops.create(x, y, 'key');

        drop.body.allowGravity = false;
        drop.setOrigin(0.5, 1);
        drop.setDepth(this.player.depth + 1);
        drop.setDisplaySize(34, 34);
    }

    collectKeyDrop(firstObject, secondObject) {
        const drop = this.keyDrops.contains(firstObject) ? firstObject : secondObject;

        if (!this.keyDrops.contains(drop) || !drop.active) {
            return;
        }

        drop.disableBody(true, true);
        this.setObjectiveProgress(this.objectivesCompleted + 1, this.totalObjectives);
        this.finishVoiceCollection(drop, 'LLAVE RECOGIDA');
    }

    stopEnemy(enemy) {
        enemy.direction.set(0, 0);
        enemy.anims.stop();
        enemy.setTexture('enemy-idle');
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

    createVoiceControls() {
        this.voiceInput = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            shoot: false,
            grenade: false,
        };

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const { x, y } = this.getVoiceButtonPosition();

        this.voiceButton = this.add.container(x, y);
        this.voiceButton.setScrollFactor(0);
        this.voiceButton.setDepth(100);
        this.voiceButton.setSize(this.uiLayout.voiceButtonSize, this.uiLayout.voiceButtonSize);
        this.voiceButton.setInteractive({ useHandCursor: true });
        this.voiceButton.on('pointerdown', () => this.toggleVoiceRecognition());
        this.voiceButtonBackground = this.add.graphics();
        this.voiceButtonIcon = this.add.graphics();
        this.voiceButton.add([this.voiceButtonBackground, this.voiceButtonIcon]);

        this.voiceStatus = this.add.text(x + this.uiLayout.voiceButtonSize / 2 + 10, y, '', {
            fontFamily: 'Arial',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#e9ddcb',
            backgroundColor: 'rgba(17, 24, 39, 0.68)',
            padding: {
                x: 8,
                y: 5,
            },
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);

        this.drawVoiceButton();
        if (!SpeechRecognition) {
            this.voiceButton.disableInteractive();
            this.setVoiceStatus(
                this.controlMode === 'voice' ? 'VOZ NO DISPONIBLE' : 'MICROFONO DESACTIVADO',
            );
            this.updateVoiceHudVisibility();
            return;
        }

        this.voiceRecognition = new SpeechRecognition();
        this.voiceRecognition.lang = 'es-ES';
        this.voiceRecognition.continuous = true;
        this.voiceRecognition.interimResults = true;
        this.voiceRecognition.maxAlternatives = 1;
        this.voiceRecognition.onstart = () => {
            this.clearPendingVoiceResultTimers();
            this.processedVoiceResultIndexes.clear();
            this.isVoiceListening = true;
            this.drawVoiceButton();
            this.setVoiceStatus('ESCUCHANDO');
        };
        this.voiceRecognition.onresult = (event) => {
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                this.processVoiceResult(index, event.results[index]);
            }
        };
        this.voiceRecognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                this.isVoiceRecognitionEnabled = false;
                this.setVoiceStatus('MICROFONO BLOQUEADO');
            } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
                this.setVoiceStatus('ERROR DE VOZ');
            }
        };
        this.voiceRecognition.onend = () => {
            this.clearPendingVoiceResultTimers();
            this.isVoiceListening = false;
            this.drawVoiceButton();

            if (!this.isVoiceRecognitionEnabled || !this.sys.settings.active) {
                return;
            }

            try {
                this.voiceRecognition.start();
            } catch (error) {
                this.isVoiceRecognitionEnabled = false;
                this.setVoiceStatus('VOZ APAGADA');
                this.drawVoiceButton();
            }
        };

        if (this.controlMode !== 'voice') {
            this.voiceButton.disableInteractive();
            this.setVoiceStatus('MICROFONO DESACTIVADO');
        } else if (this.registry.get('voicePermissionGranted')) {
            this.toggleVoiceRecognition();
        } else {
            this.setVoiceStatus('MIC: CLIC PARA ACTIVAR');
        }

        this.updateVoiceHudVisibility();
    }

    getControlMode() {
        const storedMode = window.localStorage.getItem('controlMode');

        if (storedMode === 'keyboard' || storedMode === 'voice') {
            return storedMode;
        }

        const registryMode = this.registry.get('controlMode');

        return registryMode === 'keyboard' || registryMode === 'voice' ? registryMode : 'voice';
    }

    toggleVoiceRecognition() {
        if (!this.voiceRecognition || this.controlMode !== 'voice') {
            return;
        }

        if (this.isVoiceRecognitionEnabled) {
            this.stopVoiceRecognition();
            return;
        }

        this.isVoiceRecognitionEnabled = true;
        this.setVoiceStatus('ACTIVANDO MICRO...');
        this.drawVoiceButton();

        try {
            this.voiceRecognition.start();
        } catch (error) {
            this.isVoiceRecognitionEnabled = false;
            this.setVoiceStatus('NO SE PUDO ACTIVAR');
            this.drawVoiceButton();
        }
    }

    stopVoiceRecognition() {
        this.isVoiceRecognitionEnabled = false;
        this.isVoiceListening = false;
        this.clearPendingVoiceResultTimers();
        this.clearVoiceSequence();

        if (this.voiceRecognition) {
            this.voiceRecognition.abort();
        }

        this.drawVoiceButton();
        this.setVoiceStatus('MIC: CLIC PARA ACTIVAR');
    }

    destroyVoiceControls() {
        this.isVoiceRecognitionEnabled = false;
        this.clearPendingVoiceResultTimers();
        this.clearVoiceSequence();

        if (!this.voiceRecognition) {
            return;
        }

        this.voiceRecognition.onstart = null;
        this.voiceRecognition.onresult = null;
        this.voiceRecognition.onerror = null;
        this.voiceRecognition.onend = null;
        this.voiceRecognition.abort();
        this.voiceRecognition = null;
    }

    processVoiceResult(index, result) {
        if (this.processedVoiceResultIndexes.has(index)) {
            return;
        }

        const existingTimer = this.pendingVoiceResultTimers.get(index);

        if (existingTimer) {
            existingTimer.remove();
            this.pendingVoiceResultTimers.delete(index);
        }

        const transcript = result[0].transcript;
        const applyTranscript = () => {
            this.pendingVoiceResultTimers.delete(index);

            if (
                !this.processedVoiceResultIndexes.has(index)
                && this.handleVoiceCommand(transcript)
            ) {
                this.processedVoiceResultIndexes.add(index);
            }
        };

        if (result.isFinal) {
            applyTranscript();
            return;
        }

        this.pendingVoiceResultTimers.set(
            index,
            this.time.delayedCall(this.levelLayout.voiceInterimDelayMilliseconds, applyTranscript),
        );
    }

    clearPendingVoiceResultTimers() {
        if (!this.pendingVoiceResultTimers) {
            return;
        }

        this.pendingVoiceResultTimers.forEach((timer) => timer.remove());
        this.pendingVoiceResultTimers.clear();
    }

    handleVoiceCommand(transcript) {
        const command = transcript.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
        const count = this.getVoiceCommandCount(command);
        const countLabel = count > 1 ? ` x${count}` : '';

        if (!command) {
            return false;
        }

        if (this.handleVoiceInterfaceCommand(command)) {
            return true;
        }

        if (command.includes('reanuda') || command.includes('continua')) {
            if (this.isPauseMenuOpen) {
                this.closePauseMenu();
            }
            this.setVoiceStatus('COMANDO: CONTINUAR');
            return true;
        }

        if (command.includes('pausa') || command.includes('pausar')) {
            this.clearVoiceSequence();
            this.openPauseMenu();
            this.setVoiceStatus('COMANDO: PAUSA');
            return true;
        }

        if (this.isPauseMenuOpen || this.isGameOver || this.isLevelComplete) {
            return false;
        }

        const collectionCommand = this.getVoiceCollectionCommand(command);

        if (collectionCommand) {
            return this.startVoiceCollection(collectionCommand);
        }

        if (/\b(detente|alto|para|parate)\b/.test(command)) {
            this.clearVoiceSequence();
            this.setVoiceStatus('COMANDO: DETENERSE');
            return true;
        }

        const direction = [
            ['avanza', 'right'],
            ['avanzar', 'right'],
            ['adelante', 'right'],
            ['retrocede', 'left'],
            ['atras', 'left'],
            ['izquierda', 'left'],
            ['derecha', 'right'],
            ['arriba', 'up'],
            ['abajo', 'down'],
        ].find(([word]) => command.includes(word));
        const wantsJump = command.includes('salta') || command.includes('saltar');
        const wantsShoot = command.includes('dispara') || command.includes('fuego');
        const wantsGrenade = command.includes('granada') || command.includes('lanza');
        let commandHandled = false;

        if (direction || wantsJump || wantsShoot || wantsGrenade) {
            this.clearVoiceSequence();
        }

        if (direction) {
            this.startVoiceMovement(direction[1], count);
            this.setVoiceStatus(`COMANDO: ${direction[0].toUpperCase()}${countLabel}`);
            commandHandled = true;
        }

        if (wantsJump) {
            this.queueVoiceAction('jump', count, this.levelLayout.voiceJumpIntervalMilliseconds);
            this.setVoiceStatus(`COMANDO: SALTAR${countLabel}`);
            commandHandled = true;
        }

        if (wantsShoot) {
            this.queueVoiceAction('shoot', count, this.levelLayout.voiceActionIntervalMilliseconds);
            this.setVoiceStatus(`COMANDO: DISPARAR${countLabel}`);
            commandHandled = true;
        }

        if (wantsGrenade) {
            this.queueVoiceAction('grenade', count, this.levelLayout.voiceActionIntervalMilliseconds);
            this.setVoiceStatus(`COMANDO: GRANADA${countLabel}`);
            commandHandled = true;
        }

        return commandHandled;
    }

    handleVoiceInterfaceCommand(command) {
        if (this.isGameOver) {
            if (/\b(reintenta|reintentar|reinicia|reiniciar)\b/.test(command)) {
                this.restartLevelFromGameOver();
                return true;
            }

            if (/\b(salir|mapa|volver)\b/.test(command)) {
                this.exitLevelFromGameOver();
                return true;
            }

            return false;
        }

        if (this.isLevelComplete) {
            if (/\b(salir|mapa|volver|continuar)\b/.test(command)) {
                this.returnToMapAfterVictory();
                return true;
            }

            return false;
        }

        if (!this.isPauseMenuOpen) {
            return false;
        }

        const isSettingsOpen = this.pauseSettingsPanel && this.pauseSettingsPanel.visible;

        if (isSettingsOpen && /\b(volver|regresar|atras)\b/.test(command)) {
            this.showPauseMainMenu();
            this.setVoiceStatus('COMANDO: VOLVER');
            return true;
        }

        if (!isSettingsOpen && /\b(ajustes|configuracion|opciones)\b/.test(command)) {
            this.showPauseSettings();
            this.setVoiceStatus('COMANDO: AJUSTES');
            return true;
        }

        if (/\b(salir|mapa)\b/.test(command)) {
            this.scene.start('CampaignMapScene');
            return true;
        }

        if (!isSettingsOpen) {
            return false;
        }

        if (/\b(teclado)\b/.test(command)) {
            this.setLevelControlMode('keyboard');
            return true;
        }

        if (/\b(voz|microfono)\b/.test(command)) {
            this.setLevelControlMode('voice');
            return true;
        }

        const sliderKey = command.includes('musica')
            ? 'music'
            : command.includes('efectos')
                ? 'effects'
                : null;

        if (!sliderKey || !this.pauseSliders || !this.pauseSliders[sliderKey]) {
            return false;
        }

        const slider = this.pauseSliders[sliderKey];
        const percentMatch = command.match(/\b(\d{1,3})\b/);
        const currentPercent = Number.parseInt(slider.valueText.text, 10) || 0;

        if (percentMatch) {
            this.setPauseSettingPercent(slider, Number.parseInt(percentMatch[1], 10));
        } else if (/\b(sube|subir|aumenta|aumentar|mas)\b/.test(command)) {
            this.setPauseSettingPercent(slider, currentPercent + 10);
        } else if (/\b(baja|bajar|reduce|reducir|menos)\b/.test(command)) {
            this.setPauseSettingPercent(slider, currentPercent - 10);
        } else if (/\b(silencio|silenciar|mute)\b/.test(command)) {
            this.setPauseSettingPercent(slider, 0);
        } else if (/\b(maximo|maxima)\b/.test(command)) {
            this.setPauseSettingPercent(slider, 100);
        } else {
            return false;
        }

        this.setVoiceStatus(`COMANDO: ${sliderKey === 'music' ? 'MUSICA' : 'EFECTOS'}`);
        return true;
    }

    getVoiceCollectionCommand(command) {
        const wantsCollect = /\b(recoge|recoger|reoge|reoger|recoje|recojer|toma|tomar|busca|buscar)\b/
            .test(command);

        if (!wantsCollect) {
            return null;
        }

        if (/\b(llave|llaves)\b/.test(command)) {
            return {
                group: this.keyDrops,
                label: 'LLAVE',
            };
        }

        if (/\b(granada|granadas|granda|grandas)\b/.test(command)) {
            return {
                group: this.grenadeDrops,
                label: 'GRANADA',
            };
        }

        return null;
    }

    startVoiceCollection(collectionCommand) {
        const target = this.findClosestVoiceCollectionTarget(collectionCommand.group);

        this.clearVoiceSequence();

        if (!target) {
            this.setVoiceStatus(`NO HAY ${collectionCommand.label}`);
            return true;
        }

        this.voiceCollectionTarget = target;
        this.setVoiceStatus(`RECOGIENDO: ${collectionCommand.label}`);
        return true;
    }

    findClosestVoiceCollectionTarget(group) {
        if (!group) {
            return null;
        }

        const activeDrops = group.getChildren().filter((drop) => drop.active);

        return activeDrops.reduce((closest, drop) => {
            if (!closest) {
                return drop;
            }

            const closestDistance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.groundY,
                closest.x,
                closest.y,
            );
            const dropDistance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.groundY,
                drop.x,
                drop.y,
            );

            return dropDistance < closestDistance ? drop : closest;
        }, null);
    }

    updateVoiceCollectionMovement() {
        if (!this.voiceCollectionTarget || this.controlMode !== 'voice') {
            return;
        }

        if (
            !this.voiceCollectionTarget.active
            || this.isPauseMenuOpen
            || this.isGameOver
            || this.isLevelComplete
        ) {
            this.clearVoiceSequence();
            return;
        }

        const horizontalDistance = this.voiceCollectionTarget.x - this.player.x;
        const verticalDistance = this.voiceCollectionTarget.y - this.player.groundY;
        const tolerance = this.levelLayout.voiceCollectionAxisTolerance;

        this.resetVoiceMovement();
        this.voiceInput.left = horizontalDistance < -tolerance;
        this.voiceInput.right = horizontalDistance > tolerance;
        this.voiceInput.up = verticalDistance < -tolerance;
        this.voiceInput.down = verticalDistance > tolerance;
    }

    finishVoiceCollection(drop, status) {
        if (this.voiceCollectionTarget !== drop) {
            return;
        }

        this.clearVoiceSequence();
        this.setVoiceStatus(status);
    }

    getVoiceCommandCount(command) {
        const numberMatch = command.match(/\b\d+\b/);
        const numberWords = {
            uno: 1,
            una: 1,
            dos: 2,
            tres: 3,
            cuatro: 4,
            cinco: 5,
            seis: 6,
            siete: 7,
            ocho: 8,
            nueve: 9,
            diez: 10,
        };
        const wordMatch = Object.keys(numberWords).find((word) => (
            new RegExp(`\\b${word}\\b`).test(command)
        ));
        const count = numberMatch
            ? Number.parseInt(numberMatch[0], 10)
            : numberWords[wordMatch] || 1;

        return Phaser.Math.Clamp(count, 1, this.levelLayout.maximumVoiceCommandCount);
    }

    startVoiceMovement(direction, count = 1) {
        this.clearVoiceSequence();
        this.voiceInput[direction] = true;
        const duration = this.levelLayout.voiceMovementMilliseconds * count;

        this.voiceMovementTimer = this.time.delayedCall(duration, () => {
            this.voiceMovementTimer = null;
            this.resetVoiceMovement();
        });
    }

    queueVoiceAction(action, count, interval) {
        if (!this.voiceInput) {
            return;
        }

        for (let index = 0; index < count; index += 1) {
            const timer = this.time.delayedCall(index * interval, () => {
                if (!this.isPauseMenuOpen && !this.isGameOver && !this.isLevelComplete) {
                    this.voiceInput[action] = true;
                }
            });

            this.voiceSequenceTimers.push(timer);
        }
    }

    clearVoiceSequence() {
        this.resetVoiceMovement();
        this.voiceSequenceTimers.forEach((timer) => timer.remove());
        this.voiceSequenceTimers = [];
        this.voiceCollectionTarget = null;
    }

    resetVoiceMovement() {
        if (!this.voiceInput) {
            return;
        }

        if (this.voiceMovementTimer) {
            this.voiceMovementTimer.remove();
            this.voiceMovementTimer = null;
        }

        this.voiceInput.left = false;
        this.voiceInput.right = false;
        this.voiceInput.up = false;
        this.voiceInput.down = false;
    }

    setVoiceStatus(status) {
        if (this.voiceStatus) {
            this.voiceStatus.setText(status);
        }
    }

    getVoiceButtonPosition() {
        const {
            hudMargin,
            healthPanelHeight,
            grenadePanelHeight,
            hudPanelGap,
            voiceButtonSize,
        } = this.uiLayout;

        return {
            x: hudMargin + voiceButtonSize / 2,
            y: hudMargin + healthPanelHeight + hudPanelGap + grenadePanelHeight
                + hudPanelGap + voiceButtonSize / 2,
        };
    }

    drawVoiceButton() {
        if (!this.voiceButtonBackground || !this.voiceButtonIcon) {
            return;
        }

        const size = this.uiLayout.voiceButtonSize;
        const accent = this.controlMode === 'keyboard'
            ? 0x8d8a78
            : this.isVoiceRecognitionEnabled
                ? 0xd63d35
                : 0xffffff;

        this.voiceButtonBackground.clear();
        this.voiceButtonBackground.fillStyle(0x111827, 0.68);
        this.voiceButtonBackground.lineStyle(2, accent, this.isVoiceRecognitionEnabled ? 0.9 : 0.32);
        this.voiceButtonBackground.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
        this.voiceButtonBackground.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);

        this.voiceButtonIcon.clear();
        this.voiceButtonIcon.fillStyle(accent, this.isVoiceListening ? 1 : 0.86);
        this.voiceButtonIcon.fillRoundedRect(-6, -13, 12, 21, 6);
        this.voiceButtonIcon.lineStyle(3, accent, 0.9);
        this.voiceButtonIcon.beginPath();
        this.voiceButtonIcon.arc(0, -1, 12, 0, Math.PI, false);
        this.voiceButtonIcon.strokePath();
        this.voiceButtonIcon.lineBetween(0, 11, 0, 17);
        this.voiceButtonIcon.lineBetween(-8, 17, 8, 17);
    }

    updateVoiceHudVisibility() {
        const isVoiceMode = this.controlMode === 'voice';

        if (this.voiceButton) {
            this.voiceButton.setVisible(isVoiceMode);
        }

        if (this.voiceStatus) {
            this.voiceStatus.setVisible(isVoiceMode);
        }
    }

    hasPlayerInputStarted() {
        if (this.controlMode === 'voice') {
            return this.voiceInput && Object.values(this.voiceInput).some(Boolean);
        }

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
        // Mantiene mundo, actores y HUD alineados cuando cambia el tamano de ventana.
        this.resizeWorldBounds();
        this.resizeCamera();
        this.scaleBackground();
        this.resizeMovementArea();
        this.resizePlayer();
        this.resizeEnemy();
        this.resizeLevelHud();
        this.resizePauseButton();
        this.resizeVoiceControls();
        this.resizeControlsGuide();
        this.resizeGameOverMenu();
        this.resizeVictoryMenu();
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

        this.enemies.children.each((enemy) => {
            if (!enemy.active) {
                return;
            }

            enemy.setDisplaySize(enemyHeight * (enemy.width / enemy.height), enemyHeight);
            enemy.setPosition(
                Phaser.Math.Clamp(enemy.x, enemy.displayWidth / 2, width - enemy.displayWidth / 2),
                Phaser.Math.Clamp(enemy.y, movementBounds.top, movementBounds.bottom),
            );
        });
    }

    createPauseButton() {
        // El boton pertenece al HUD: permanece fijo aunque la camara siga al jugador.
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

    resizeVoiceControls() {
        if (!this.voiceButton) {
            return;
        }

        const { x, y } = this.getVoiceButtonPosition();

        this.voiceButton.setPosition(x, y);
        this.voiceStatus.setPosition(x + this.uiLayout.voiceButtonSize / 2 + 10, y);
    }

    createLevelHud() {
        // El HUD queda sobre el escenario y debajo del overlay del menu de pausa.
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

        if (
            this.totalObjectives > 0
            && this.objectivesCompleted >= this.totalObjectives
            && !this.isLevelComplete
        ) {
            this.openVictoryMenu();
        }
    }

    setHealth(health, maxHealth = this.maxHealth) {
        this.maxHealth = Math.max(1, maxHealth);
        this.currentHealth = Phaser.Math.Clamp(health, 0, this.maxHealth);

        if (this.healthBar) {
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

        if (this.currentHealth === 0) {
            this.openGameOverMenu();
        }
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
        // isPauseMenuOpen es leido por update() para detener la partida.
        if (this.isPauseMenuOpen || this.isGameOver || this.isLevelComplete) {
            return;
        }

        this.clearVoiceSequence();
        this.isPauseMenuOpen = true;
        this.physics.world.pause();
        this.pauseButton.disableInteractive();
        this.createPauseMenu();
    }

    closePauseMenu() {
        // Destruye cualquiera de las vistas de pausa y habilita de nuevo el juego.
        this.isPauseMenuOpen = false;
        this.physics.world.resume();
        this.pauseButton.setInteractive({ useHandCursor: true });

        if (this.pauseMenu) {
            this.destroyPauseSettingsPointerHandlers();
            this.pauseMenu.destroy();
            this.pauseMenu = null;
            this.pauseMainContent = null;
            this.pauseSettingsPanel = null;
            this.pauseMainButtons = null;
            this.pauseSettingsInteractive = null;
            this.pauseSliders = null;
            this.activePauseSlider = null;
        }
    }

    createPauseMenu() {
        // Una misma capa alterna entre botones principales y ajustes, sin cambiar escena.
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.pauseMenu = this.add.container(centerX, centerY);
        this.pauseMenu.setScrollFactor(0);
        this.pauseMenu.setDepth(200);

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x030405, 0.76);
        overlay.setOrigin(0.5);

        const title = this.add.text(0, -150, 'OPERACIÓN EN PAUSA', {
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.045, 38, 58)}px`,
            fontStyle: 'bold',
            color: '#efe5d2',
        });
        title.setOrigin(0.5);
        title.setStroke('#090705', 6);
        title.setShadow(2, 3, '#000000', 5);

        const resumeButton = this.createPauseMenuButton(-30, 'CONTINUAR', 'outline', () => {
            this.closePauseMenu();
        });
        const optionsButton = this.createPauseMenuButton(66, 'AJUSTES', 'outline', () => {
            this.showPauseSettings();
        });
        const exitButton = this.createPauseMenuButton(162, 'SALIR', 'danger', () => {
            this.scene.start('CampaignMapScene');
        });

        this.pauseMainContent = this.add.container(0, 0, [
            title,
            resumeButton,
            optionsButton,
            exitButton,
        ]);
        this.pauseMainButtons = [resumeButton, optionsButton, exitButton];
        this.pauseSettingsInteractive = [];
        this.pauseSliders = {};
        this.activePauseSlider = null;
        this.pauseSettingsPanel = this.createPauseSettingsPanel();
        this.pauseSettingsPanel.setVisible(false);
        this.pauseSettingsInteractive.forEach((control) => {
            control.input.enabled = false;
        });
        this.pauseMenu.add([overlay, this.pauseMainContent, this.pauseSettingsPanel]);
        this.createPauseSettingsPointerHandlers();
    }

    openGameOverMenu() {
        if (this.isGameOver) {
            return;
        }

        this.isGameOver = true;
        this.physics.world.pause();
        this.player.stopMovement();
        this.stopPlayerFootsteps();
        this.clearVoiceSequence();

        if (this.pauseButton) {
            this.pauseButton.disableInteractive();
        }

        this.createGameOverMenu();
    }

    createGameOverMenu() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.gameOverMenu = this.add.container(centerX, centerY);
        this.gameOverMenu.setScrollFactor(0);
        this.gameOverMenu.setDepth(300);

        this.gameOverOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x030609, 0.82);
        this.gameOverOverlay.setOrigin(0.5);

        const gameOverTitle = this.add.text(0, -168, 'GAME OVER', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '24px',
            color: '#e51f19',
        }).setOrigin(0.5);
        gameOverTitle.setStroke('#160604', 4);

        const capturedTitle = this.add.text(0, -118, 'CAPTURADO', {
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.055, 42, 62)}px`,
            fontStyle: 'bold',
            color: '#eee6d9',
        }).setOrigin(0.5);
        capturedTitle.setStroke('#080705', 6);
        capturedTitle.setShadow(2, 3, '#000000', 4);

        const subtitle = this.add.text(0, -45, 'TE ENCONTRARON. INTENTALO DE NUEVO', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '24px',
            color: '#eee6d9',
        }).setOrigin(0.5);
        subtitle.setStroke('#090705', 4);

        const retryButton = this.createPauseMenuButton(42, 'REINTENTAR', 'danger', () => {
            this.restartLevelFromGameOver();
        });
        const exitButton = this.createPauseMenuButton(134, 'SALIR', 'outline', () => {
            this.exitLevelFromGameOver();
        });

        retryButton.inputTarget.disableInteractive();
        exitButton.inputTarget.disableInteractive();
        retryButton.gameOverAction = () => this.restartLevelFromGameOver();
        exitButton.gameOverAction = () => this.exitLevelFromGameOver();
        this.gameOverButtons = [retryButton, exitButton];
        this.gameOverMenu.add([
            this.gameOverOverlay,
            gameOverTitle,
            capturedTitle,
            subtitle,
            retryButton,
            exitButton,
        ]);
        this.createGameOverPointerHandlers();
    }

    openVictoryMenu() {
        if (this.isLevelComplete || this.isGameOver) {
            return;
        }

        this.isLevelComplete = true;
        this.physics.world.pause();
        this.player.stopMovement();
        this.stopPlayerFootsteps();
        this.clearVoiceSequence();

        if (this.pauseButton) {
            this.pauseButton.disableInteractive();
        }

        this.createVictoryMenu();
    }

    createVictoryMenu() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const campName = this.selectedCamp && this.selectedCamp.name
            ? this.selectedCamp.name
            : 'MISION COMPLETADA';

        this.victoryMenu = this.add.container(centerX, centerY);
        this.victoryMenu.setScrollFactor(0);
        this.victoryMenu.setDepth(300);

        this.victoryOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x030609, 0.82);
        this.victoryOverlay.setOrigin(0.5);

        const victoryTitle = this.add.text(0, -128, 'VICTORIA', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '24px',
            color: '#d6b450',
        }).setOrigin(0.5);
        victoryTitle.setStroke('#120e05', 4);

        const escapeTitle = this.add.text(0, -76, 'ESCAPE EXITOSO', {
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.05, 40, 60)}px`,
            fontStyle: 'bold',
            color: '#eee6d9',
        }).setOrigin(0.5);
        escapeTitle.setStroke('#080705', 6);
        escapeTitle.setShadow(2, 3, '#000000', 4);

        const subtitle = this.add.text(0, -6, campName, {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '25px',
            color: '#eee6d9',
        }).setOrigin(0.5);
        subtitle.setStroke('#090705', 4);

        const returnButton = this.createPauseMenuButton(82, 'VOLVER AL MAPA', 'gold', () => {
            this.returnToMapAfterVictory();
        });

        returnButton.inputTarget.disableInteractive();
        returnButton.victoryAction = () => this.returnToMapAfterVictory();
        this.victoryButtons = [returnButton];
        this.victoryMenu.add([
            this.victoryOverlay,
            victoryTitle,
            escapeTitle,
            subtitle,
            returnButton,
        ]);
        this.createVictoryPointerHandlers();
    }

    resizeGameOverMenu() {
        if (!this.gameOverMenu) {
            return;
        }

        this.gameOverMenu.setPosition(this.scale.width / 2, this.scale.height / 2);
        this.gameOverOverlay.setSize(this.scale.width, this.scale.height);
    }

    resizeVictoryMenu() {
        if (!this.victoryMenu) {
            return;
        }

        this.victoryMenu.setPosition(this.scale.width / 2, this.scale.height / 2);
        this.victoryOverlay.setSize(this.scale.width, this.scale.height);
    }

    restartLevelFromGameOver() {
        this.destroyGameOverPointerHandlers();
        this.physics.world.resume();
        this.scene.restart({ selectedCamp: this.registry.get('selectedCamp') });
    }

    exitLevelFromGameOver() {
        this.destroyGameOverPointerHandlers();
        this.physics.world.resume();
        this.scene.start('CampaignMapScene');
    }

    createGameOverPointerHandlers() {
        this.handleGameOverPointerDown = (pointer) => {
            if (!this.isGameOver || !this.gameOverMenu) {
                return;
            }

            const localX = pointer.x - this.gameOverMenu.x;
            const localY = pointer.y - this.gameOverMenu.y;
            const button = this.gameOverButtons.find((candidate) => (
                Math.abs(localX - candidate.x) <= candidate.width / 2
                && Math.abs(localY - candidate.y) <= candidate.height / 2
            ));

            if (button) {
                button.gameOverAction();
            }
        };

        this.input.on('pointerdown', this.handleGameOverPointerDown);
    }

    destroyGameOverPointerHandlers() {
        if (!this.handleGameOverPointerDown) {
            return;
        }

        this.input.off('pointerdown', this.handleGameOverPointerDown);
        this.handleGameOverPointerDown = null;
    }

    returnToMapAfterVictory() {
        const completedLevel = this.selectedCamp && Number.isFinite(this.selectedCamp.number)
            ? this.selectedCamp.number
            : 1;
        const storedLevel = Number.parseInt(window.localStorage.getItem('campaignUnlockedLevel'), 10);
        const unlockedLevel = Number.isFinite(storedLevel) ? storedLevel : 1;

        window.localStorage.setItem(
            'campaignUnlockedLevel',
            String(Math.max(unlockedLevel, completedLevel + 1)),
        );
        this.destroyVictoryPointerHandlers();
        this.physics.world.resume();
        this.scene.start('CampaignMapScene');
    }

    createVictoryPointerHandlers() {
        this.handleVictoryPointerDown = (pointer) => {
            if (!this.isLevelComplete || !this.victoryMenu) {
                return;
            }

            const localX = pointer.x - this.victoryMenu.x;
            const localY = pointer.y - this.victoryMenu.y;
            const button = this.victoryButtons.find((candidate) => (
                Math.abs(localX - candidate.x) <= candidate.width / 2
                && Math.abs(localY - candidate.y) <= candidate.height / 2
            ));

            if (button) {
                button.victoryAction();
            }
        };

        this.input.on('pointerdown', this.handleVictoryPointerDown);
    }

    destroyVictoryPointerHandlers() {
        if (!this.handleVictoryPointerDown) {
            return;
        }

        this.input.off('pointerdown', this.handleVictoryPointerDown);
        this.handleVictoryPointerDown = null;
    }

    createPauseMenuButton(y, label, variant, onSelect) {
        const button = this.add.container(0, y);
        const width = 250;
        const height = 68;
        const palette = {
            outline: {
                fill: 0x100d0b,
                hover: 0x2a2217,
                stroke: 0xcaa95d,
                text: '#efe5d2',
                hoverText: '#efe5d2',
            },
            danger: {
                fill: 0x581a17,
                hover: 0x762521,
                stroke: 0xcaa95d,
                text: '#efe5d2',
                hoverText: '#efe5d2',
            },
            gold: {
                fill: 0xb4944f,
                hover: 0xd0ad5a,
                stroke: 0xe1c170,
                text: '#17120b',
                hoverText: '#17120b',
            },
        };
        const colors = palette[variant];
        const defaultFillAlpha = variant === 'danger' || variant === 'gold' ? 0.96 : 0.52;
        const background = this.add.rectangle(0, 0, width, height, colors.fill, defaultFillAlpha);
        background.setStrokeStyle(3, colors.stroke, 0.95);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '25px',
            fontStyle: 'bold',
            color: colors.text,
        }).setOrigin(0.5);
        text.setStroke('#000000', 2);

        button.setSize(width, height);
        background.setInteractive({ useHandCursor: true });
        background.on('pointerover', () => {
            background.setFillStyle(colors.hover, 1);
            text.setColor(colors.hoverText);
        });
        background.on('pointerout', () => {
            background.setFillStyle(colors.fill, defaultFillAlpha);
            text.setColor(colors.text);
        });
        background.on('pointerdown', onSelect);
        button.inputTarget = background;
        button.add([background, text]);

        return button;
    }

    showPauseSettings() {
        // Solo la vista visible conserva entrada activa para evitar clics ocultos.
        this.pauseMainContent.setVisible(false);
        this.pauseSettingsPanel.setVisible(true);
        this.pauseMainButtons.forEach((button) => {
            button.inputTarget.input.enabled = false;
        });
        this.pauseSettingsInteractive.forEach((control) => {
            control.input.enabled = true;
        });
    }

    showPauseMainMenu() {
        this.activePauseSlider = null;
        this.pauseSettingsPanel.setVisible(false);
        this.pauseMainContent.setVisible(true);
        this.pauseSettingsInteractive.forEach((control) => {
            control.input.enabled = false;
        });
        this.pauseMainButtons.forEach((button) => {
            button.inputTarget.input.enabled = true;
        });
    }

    createPauseSettingsPanel() {
        // Version embebida de configuracion para ajustar audio sin salir de la partida.
        const panel = this.add.container(-260, -260);
        const width = 520;
        const height = 520;
        const background = this.add.rectangle(0, 0, width, height, 0x11130f, 0.95);
        background.setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.4);

        const accent = this.add.rectangle(0, 0, 6, height, 0xd6b450, 0.95);
        accent.setOrigin(0, 0);

        const title = this.add.text(42, 38, 'CONFIGURACIÓN', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '46px',
            color: '#fff4d8',
        });
        title.setStroke('#000000', 5);
        title.setShadow(2, 3, '#000000', 3);

        const subtitle = this.add.text(44, 93, 'AJUSTES DEL JUEGO', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#cfc7b3',
        });
        subtitle.setStroke('#000000', 3);

        panel.add([background, accent, title, subtitle]);
        panel.add(this.createPauseSliderRow(42, 148, {
            label: 'MÚSICA',
            key: 'music',
            registryKey: 'musicVolume',
            defaultValue: 80,
        }));
        panel.add(this.createPauseSliderRow(42, 240, {
            label: 'EFECTOS',
            key: 'effects',
            registryKey: 'effectsVolume',
            defaultValue: 70,
        }));
        panel.add(this.createPauseControlModeRow(42, 332));
        panel.add(this.createPauseBackButton(42, 426));

        return panel;
    }

    createPauseSliderRow(x, y, option) {
        // Cada fila almacena lo necesario para representar y actualizar un volumen.
        const row = this.add.container(x, y);
        const rowWidth = 430;
        const rowHeight = 66;
        const value = this.getPauseSettingValue(option.registryKey, option.defaultValue);
        const trackX = 178;
        const trackWidth = 154;
        const relativeValue = trackWidth * (value / 100);
        const background = this.add.rectangle(0, 0, rowWidth, rowHeight, 0x171a14, 0.72).setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.25);

        const label = this.add.text(24, rowHeight / 2, option.label, {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '22px',
            color: '#d8d0bf',
        }).setOrigin(0, 0.5);
        label.setStroke('#000000', 3);

        const valueText = this.add.text(362, rowHeight / 2, `${value}%`, {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#efe3bf',
        }).setOrigin(0.5);
        valueText.setStroke('#000000', 2);

        const track = this.add.rectangle(trackX, rowHeight / 2, trackWidth, 8, 0x090a08, 0.85).setOrigin(0, 0.5);
        track.setStrokeStyle(2, 0xd8d0bf, 0.24);
        const fill = this.add.rectangle(trackX, rowHeight / 2, Math.max(relativeValue, 1), 8, 0xd6b450, 0.9)
            .setOrigin(0, 0.5);
        const handle = this.add.rectangle(trackX + relativeValue, rowHeight / 2, 14, 24, 0xe8e4d8, 0.95)
            .setOrigin(0.5);
        handle.setStrokeStyle(2, 0x000000, 0.55);

        const slider = {
            key: option.key,
            registryKey: option.registryKey,
            trackX,
            width: trackWidth,
            fill,
            handle,
            valueText,
        };
        this.pauseSliders[option.key] = slider;
        const trackInput = this.add.rectangle(trackX, rowHeight / 2, trackWidth, 32, 0x000000, 0)
            .setOrigin(0, 0.5)
            .setInteractive({ useHandCursor: true });
        trackInput.on('pointerdown', (pointer, localX) => {
            this.activePauseSlider = slider;
            this.setPauseSettingPercent(slider, Math.round((localX / trackWidth) * 100));
        });

        const minusButton = this.createPauseStepButton(130, rowHeight / 2, '-', () => {
            this.setPauseSettingPercent(slider, Number.parseInt(valueText.text, 10) - 10);
        });
        const plusButton = this.createPauseStepButton(396, rowHeight / 2, '+', () => {
            this.setPauseSettingPercent(slider, Number.parseInt(valueText.text, 10) + 10);
        });

        this.pauseSettingsInteractive.push(trackInput, minusButton, plusButton);
        row.add([background, label, valueText, minusButton, track, fill, handle, trackInput, plusButton]);
        return row;
    }

    createPauseStepButton(x, y, text, onSelect) {
        const button = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, 24, 24, 0x76683f, 0.55);
        background.setStrokeStyle(2, 0xd8d0bf, 0.35);
        const label = this.add.text(0, -1, text, {
            fontFamily: 'Courier New',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff4d8',
        }).setOrigin(0.5);
        label.setStroke('#000000', 2);

        button.setSize(32, 32);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => {
            background.setFillStyle(0x8a7748, 0.78);
        });
        button.on('pointerout', () => {
            background.setFillStyle(0x76683f, 0.55);
        });
        button.on('pointerdown', onSelect);
        button.add([background, label]);

        return button;
    }

    createPauseControlModeRow(x, y) {
        const row = this.add.container(x, y);
        const rowWidth = 430;
        const rowHeight = 66;
        const background = this.add.rectangle(0, 0, rowWidth, rowHeight, 0x171a14, 0.72).setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.25);
        const label = this.add.text(20, rowHeight / 2, 'CONTROL', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '20px',
            color: '#d8d0bf',
        }).setOrigin(0, 0.5);
        label.setStroke('#000000', 3);

        this.pauseKeyboardModeButton = this.createPauseControlModeButton(142, 13, 126, 'TECLADO', 'keyboard');
        this.pauseVoiceModeButton = this.createPauseControlModeButton(282, 13, 126, 'VOZ', 'voice');
        this.pauseControlModeButtons = [this.pauseKeyboardModeButton, this.pauseVoiceModeButton];
        this.refreshPauseControlModeButtons();
        row.add([background, label, this.pauseKeyboardModeButton, this.pauseVoiceModeButton]);

        return row;
    }

    createPauseControlModeButton(x, y, width, label, mode) {
        const button = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, width, 40, 0x141713, 0.48)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(width / 2, 20, label, {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d8d0bf',
        }).setOrigin(0.5);
        text.setStroke('#000000', 2);
        background.on('pointerdown', () => this.setLevelControlMode(mode));
        button.mode = mode;
        button.background = background;
        button.label = text;
        button.add([background, text]);
        this.pauseSettingsInteractive.push(background);

        return button;
    }

    refreshPauseControlModeButtons() {
        if (!this.pauseControlModeButtons) {
            return;
        }

        this.pauseControlModeButtons.forEach((button) => {
            const isActive = button.mode === this.controlMode;

            button.background.setFillStyle(isActive ? 0x76683f : 0x141713, isActive ? 0.9 : 0.48);
            button.background.setStrokeStyle(2, isActive ? 0xd6b450 : 0xd8d0bf, isActive ? 0.9 : 0.25);
            button.label.setColor(isActive ? '#fff4d8' : '#bdb6a5');
        });
    }

    setLevelControlMode(mode) {
        if (mode !== 'keyboard' && mode !== 'voice') {
            return;
        }

        if (mode === this.controlMode) {
            this.refreshPauseControlModeButtons();
            this.refreshControlsGuideForMode();
            this.updateVoiceHudVisibility();
            return;
        }

        this.controlMode = mode;
        this.registry.set('controlMode', mode);
        window.localStorage.setItem('controlMode', mode);
        this.refreshPauseControlModeButtons();
        this.refreshControlsGuideForMode();
        this.drawVoiceButton();
        this.updateVoiceHudVisibility();

        if (mode === 'keyboard') {
            this.stopVoiceRecognition();
            this.voiceButton.disableInteractive();
            this.setVoiceStatus('MICROFONO DESACTIVADO');
            return;
        }

        if (!this.voiceRecognition) {
            this.setVoiceStatus('VOZ NO DISPONIBLE');
            return;
        }

        this.voiceButton.setInteractive({ useHandCursor: true });
        this.setVoiceStatus('ACTIVANDO MICRO...');
        this.toggleVoiceRecognition();
    }

    createPauseBackButton(x, y) {
        const button = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, 220, 50, 0x76683f, 0.62)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        background.setStrokeStyle(2, 0xd8d0bf, 0.5);
        const label = this.add.text(28, 13, 'VOLVER', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '22px',
            color: '#fff4d8',
        });
        label.setStroke('#000000', 3);

        background.on('pointerover', () => {
            background.setFillStyle(0x8a7748, 0.74);
        });
        background.on('pointerout', () => {
            background.setFillStyle(0x76683f, 0.62);
        });
        background.on('pointerdown', () => this.showPauseMainMenu());
        button.add([background, label]);
        this.pauseSettingsInteractive.push(background);

        return button;
    }

    getPauseSettingValue(key, defaultValue) {
        const storedValue = Number(window.localStorage.getItem(key));
        const registryValue = this.registry.get(key);

        if (Number.isFinite(storedValue) && window.localStorage.getItem(key) !== null) {
            return Phaser.Math.Clamp(storedValue, 0, 100);
        }

        if (Number.isFinite(registryValue)) {
            return Phaser.Math.Clamp(registryValue, 0, 100);
        }

        return defaultValue;
    }

    createPauseSettingsPointerHandlers() {
        // Permite arrastrar el control aun cuando el puntero sale de la pista.
        this.handlePauseSettingsPointerMove = (pointer) => {
            if (!this.activePauseSlider || !this.pauseSettingsPanel.visible) {
                return;
            }

            const panelX = this.pauseMenu.x + this.pauseSettingsPanel.x;
            const trackX = panelX + 42 + this.activePauseSlider.trackX;
            const relativeX = Phaser.Math.Clamp(pointer.x - trackX, 0, this.activePauseSlider.width);
            const percent = Math.round((relativeX / this.activePauseSlider.width) * 100);

            this.setPauseSettingPercent(this.activePauseSlider, percent);
        };
        this.handlePauseSettingsPointerUp = () => {
            this.activePauseSlider = null;
        };

        this.input.on('pointermove', this.handlePauseSettingsPointerMove);
        this.input.on('pointerup', this.handlePauseSettingsPointerUp);
    }

    destroyPauseSettingsPointerHandlers() {
        if (!this.handlePauseSettingsPointerMove) {
            return;
        }

        this.input.off('pointermove', this.handlePauseSettingsPointerMove);
        this.input.off('pointerup', this.handlePauseSettingsPointerUp);
        this.handlePauseSettingsPointerMove = null;
        this.handlePauseSettingsPointerUp = null;
    }

    setPauseSettingPercent(slider, percent) {
        // Persiste el ajuste y lo aplica inmediatamente a los sonidos existentes.
        const clampedPercent = Phaser.Math.Clamp(percent, 0, 100);
        const relativeX = slider.width * (clampedPercent / 100);

        slider.fill.setSize(Math.max(relativeX, 1), 8);
        slider.handle.setX(slider.trackX + relativeX);
        slider.valueText.setText(`${clampedPercent}%`);
        this.registry.set(slider.registryKey, clampedPercent);
        window.localStorage.setItem(slider.registryKey, String(clampedPercent));

        if (slider.key === 'music') {
            const music = window.GameAudio && window.GameAudio.backgroundMusic;

            if (music) {
                music.setVolume(clampedPercent / 100);
            }

            if (typeof this.sound.getAll === 'function') {
                this.sound.getAll('background-music').forEach((sound) => {
                    sound.setVolume(clampedPercent / 100);
                });
            }
        }

        if (slider.key === 'effects' && this.playerFootsteps) {
            this.applyEffectsVolume(clampedPercent);
        }
    }

    applyEffectsVolume(percent) {
        const volume = percent / 100;
        const footstepsVolume = Math.min(1, volume * 1.5);
        const footsteps = window.GameAudio && window.GameAudio.playerFootsteps;
        const playerShot = window.GameAudio && window.GameAudio.playerShot;
        const grenadeExplosion = window.GameAudio && window.GameAudio.grenadeExplosion;

        if (footsteps) {
            footsteps.setVolume(footstepsVolume);
        }

        if (playerShot) {
            playerShot.setVolume(volume);
        }

        if (grenadeExplosion) {
            grenadeExplosion.setVolume(Math.min(1, volume * 1.6));
        }

        if (typeof this.sound.getAll === 'function') {
            this.sound.getAll('player-footsteps').forEach((sound) => {
                sound.setVolume(footstepsVolume);
            });
            this.sound.getAll('player-shot').forEach((sound) => {
                sound.setVolume(volume);
            });
            this.sound.getAll('grenade-explosion').forEach((sound) => {
                sound.setVolume(Math.min(1, volume * 1.6));
            });
        }
    }

    createControlsGuideHud() {
        // La guia de teclas solo se muestra cuando ese modo de control esta activo.
        if (this.controlMode !== 'keyboard') {
            return;
        }

        const { x, y } = this.getControlsGuidePosition();

        this.controlsGuide = this.createControlsGuide(x, y);
        this.controlsGuide.setScrollFactor(0);
        this.controlsGuide.setDepth(100);
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

    refreshControlsGuideForMode() {
        if (this.isControlsGuideHiding) {
            return;
        }

        if (this.controlMode !== 'keyboard') {
            if (this.controlsGuide) {
                this.controlsGuide.destroy();
                this.controlsGuide = null;
            }

            return;
        }

        const { x, y } = this.getControlsGuidePosition();
        const alpha = this.controlsGuide ? this.controlsGuide.alpha : 1;

        if (this.controlsGuide) {
            this.controlsGuide.destroy();
        }

        this.controlsGuide = this.createControlsGuide(x, y);
        this.controlsGuide.setScrollFactor(0);
        this.controlsGuide.setDepth(100);
        this.controlsGuide.setAlpha(alpha);
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
