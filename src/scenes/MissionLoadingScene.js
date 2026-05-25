class MissionLoadingScene extends Phaser.Scene {
    constructor() {
        super('MissionLoadingScene');

        this.selectedCamp = null;
        this.loadingProgress = 0;
    }

    init(data = {}) {
        this.selectedCamp = data.selectedCamp || this.registry.get('selectedCamp');
        this.loadingProgress = 0;
    }

    preload() {
        if (!this.textures.exists('level-one-background')) {
            this.load.image('level-one-background', window.GameAssets.backgrounds.levelOne);
        }
    }

    create() {
        this.background = this.add.image(0, 0, 'level-one-background').setOrigin(0.5);
        this.dimmer = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050403, 0.69).setOrigin(0);

        this.createLoadingContent();
        this.scaleBackground();
        this.animateLoading();

        this.scale.on('resize', this.resizeLoading, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.resizeLoading, this);
        });
    }

    createLoadingContent() {
        const { x, y, width } = this.getContentLayout();
        const camp = this.selectedCamp || {
            name: 'MISION',
            location: 'ALEMANIA',
            requiredKeys: 3,
        };

        this.content = this.add.container(x, y);

        const pretitle = this.add.text(0, 0, 'ENCRIPTANDO POSICION', {
            fontFamily: 'Courier New',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.019, 20, 26)}px`,
            fontStyle: 'bold',
            color: '#d6b450',
        });
        pretitle.setStroke('#090806', 3);

        const title = this.add.text(0, 47, `MISION ${String(camp.number || 1).padStart(2, '0')} - ${camp.name}`, {
            fontFamily: 'Courier New',
            fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.03, 30, 44)}px`,
            fontStyle: 'bold',
            color: '#f0ebde',
        });
        title.setStroke('#050505', 4);

        const details = this.add.text(
            0,
            94,
            `${camp.location.toUpperCase()}  |  OBJETIVO: ${camp.requiredKeys} LLAVES`,
            {
                fontFamily: 'Courier New',
                fontSize: `${Phaser.Math.Clamp(this.scale.width * 0.012, 13, 17)}px`,
                fontStyle: 'bold',
                color: '#ac9361',
            },
        );
        details.setStroke('#050505', 2);

        this.barX = 0;
        this.barY = 146;
        this.barWidth = width;
        this.barHeight = 12;
        this.loadingBar = this.add.graphics();
        this.loadingText = this.add.text(0, 170, 'CARGANDO ...', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ac9361',
        });
        this.percentage = this.add.text(width + 18, this.barY + this.barHeight / 2, '0%', {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d6b450',
        }).setOrigin(0, 0.5);

        this.content.add([pretitle, title, details, this.loadingBar, this.loadingText, this.percentage]);
        this.drawProgressBar(0);
    }

    animateLoading() {
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 1900,
            ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                this.loadingProgress = Math.round(tween.getValue());
                this.drawProgressBar(this.loadingProgress);
            },
            onComplete: () => {
                this.time.delayedCall(230, () => {
                    this.scene.start('LevelOneScene', { selectedCamp: this.selectedCamp });
                });
            },
        });
    }

    drawProgressBar(progress) {
        const filledWidth = this.barWidth * (progress / 100);

        this.loadingBar.clear();
        this.loadingBar.fillStyle(0x0e0b08, 0.88);
        this.loadingBar.lineStyle(2, 0xd6b450, 0.82);
        this.loadingBar.fillRect(this.barX, this.barY, this.barWidth, this.barHeight);
        this.loadingBar.strokeRect(this.barX, this.barY, this.barWidth, this.barHeight);
        this.loadingBar.fillStyle(0xd6b450, 0.94);
        this.loadingBar.fillRect(this.barX + 2, this.barY + 2, Math.max(0, filledWidth - 4), this.barHeight - 4);
        this.percentage.setText(`${progress}%`);
    }

    getContentLayout() {
        return {
            x: this.scale.width * 0.25,
            y: this.scale.height * 0.41,
            width: Phaser.Math.Clamp(this.scale.width * 0.48, 440, 700),
        };
    }

    resizeLoading() {
        this.dimmer.setSize(this.scale.width, this.scale.height);
        this.scaleBackground();

        const layout = this.getContentLayout();
        this.content.setPosition(layout.x, layout.y);
        this.barWidth = layout.width;
        this.percentage.setX(layout.width + 18);
        this.drawProgressBar(this.loadingProgress);
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

window.MissionLoadingScene = MissionLoadingScene;
