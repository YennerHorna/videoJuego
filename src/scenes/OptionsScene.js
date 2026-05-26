class OptionsScene extends Phaser.Scene {
    constructor() {
        super('OptionsScene');

        this.optionRows = [
            { label: 'MÚSICA', value: 80, key: 'music', registryKey: 'musicVolume' },
            { label: 'EFECTOS', value: 70, key: 'effects', registryKey: 'effectsVolume' },
        ];

        this.panelWidth = 520;
        this.panelHeight = 520;
        this.backButtonBounds = null;
        this.controlModeBounds = [];
        this.activeSlider = null;
        this.sliders = [];
        this.voiceController = null;
    }

    preload() {
        if (!this.textures.exists('main-menu-background')) {
            this.load.image('main-menu-background', window.GameAssets.backgrounds.mainMenu);
        }
    }

    create() {
        // La pantalla lee primero la configuracion persistida antes de pintar sliders.
        this.sliders = [];
        this.activeSlider = null;
        this.backButtonBounds = null;
        this.controlModeBounds = [];

        this.syncOptionValuesFromRegistry();
        this.syncControlModeFromStorage();
        this.createBackground();
        this.createPanel();
        this.createPointerHandlers();
        this.createVoiceNavigation();

        this.scale.on('resize', this.resizeOptions, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyPointerHandlers, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyResizeHandler, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyVoiceNavigation, this);
    }

    createBackground() {
        this.background = this.add.image(0, 0, 'main-menu-background').setOrigin(0.5);
        this.scaleBackground();

        this.dimmer = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050505, 0.68);
        this.dimmer.setOrigin(0, 0);
    }

    syncOptionValuesFromRegistry() {
        // localStorage conserva preferencias entre sesiones; registry las comparte
        // con las escenas activas durante esta ejecucion.
        this.optionRows.forEach((option) => {
            const savedVolume = this.getSavedVolume(option.registryKey, option.value);

            option.value = savedVolume;
            this.registry.set(option.registryKey, savedVolume);
        });
    }

    getSavedVolume(key, defaultValue) {
        const savedVolume = window.localStorage.getItem(key);
        const parsedVolume = Number(savedVolume);

        if (savedVolume !== null && Number.isFinite(parsedVolume)) {
            return Phaser.Math.Clamp(parsedVolume, 0, 100);
        }

        const registryVolume = this.registry.get(key);

        if (typeof registryVolume === 'number' && Number.isFinite(registryVolume)) {
            return Phaser.Math.Clamp(registryVolume, 0, 100);
        }

        return defaultValue;
    }

    syncControlModeFromStorage() {
        const storedMode = window.localStorage.getItem('controlMode');
        const registryMode = this.registry.get('controlMode');
        const controlMode = storedMode === 'keyboard' || storedMode === 'voice'
            ? storedMode
            : registryMode === 'keyboard' || registryMode === 'voice'
                ? registryMode
                : 'voice';

        this.controlMode = controlMode;
        this.registry.set('controlMode', controlMode);
        window.localStorage.setItem('controlMode', controlMode);
    }

    createPanel() {
        const panelPosition = this.getCenteredPanelPosition();

        this.panel = this.add.container(panelPosition.x, panelPosition.y);
        this.panel.setAlpha(0);
        this.panel.setY(panelPosition.y + 34);

        const background = this.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x11130f, 0.82);
        background.setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.28);

        const accent = this.add.rectangle(0, 0, 6, this.panelHeight, 0xd6b450, 0.95);
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

        this.panel.add([background, accent, title, subtitle]);

        this.optionRows.forEach((option, index) => {
            this.panel.add(this.createSliderRow(42, 148 + index * 92, option));
        });

        this.panel.add(this.createControlModeRow(42, 332));
        this.backButton = this.createBackButton(42, 426);
        this.panel.add(this.backButton);

        this.tweens.add({
            targets: this.panel,
            y: panelPosition.y,
            alpha: 1,
            duration: 520,
            ease: 'Cubic.easeOut',
        });
    }

    createSliderRow(x, y, option) {
        const row = this.add.container(x, y);
        const rowWidth = 430;
        const rowHeight = 66;
        const background = this.add.rectangle(0, 0, rowWidth, rowHeight, 0x171a14, 0.62);
        background.setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.2);

        const label = this.add.text(24, rowHeight / 2, option.label, {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '22px',
            color: '#d8d0bf',
        });
        label.setOrigin(0, 0.5);
        label.setStroke('#000000', 3);

        const value = this.add.text(362, rowHeight / 2, `${option.value}%`, {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#efe3bf',
        });
        value.setOrigin(0.5);
        value.setStroke('#000000', 2);

        const slider = this.createSlider(178, rowHeight / 2, 154, option.value, value, option.key);
        const minusButton = this.createSliderStepButton(130, rowHeight / 2, '-');
        const plusButton = this.createSliderStepButton(396, rowHeight / 2, '+');

        row.add([background, label, value, minusButton, ...slider.parts, plusButton]);
        this.sliders.push({
            key: option.key,
            registryKey: option.registryKey,
            row,
            value,
            rowX: x,
            rowY: y,
            rowWidth,
            rowHeight,
            trackX: x + slider.trackX,
            trackY: y + slider.trackY,
            localTrackX: slider.trackX,
            width: slider.width,
            fill: slider.fill,
            handle: slider.handle,
            minusButton,
            plusButton,
        });

        return row;
    }

    createSlider(x, y, width, percent, valueText, key) {
        const track = this.add.rectangle(x, y, width, 8, 0x090a08, 0.85);
        track.setOrigin(0, 0.5);
        track.setStrokeStyle(2, 0xd8d0bf, 0.24);

        const fill = this.add.rectangle(x, y, width * (percent / 100), 8, 0xd6b450, 0.9);
        fill.setOrigin(0, 0.5);

        const handle = this.add.rectangle(x + width * (percent / 100), y, 14, 24, 0xe8e4d8, 0.95);
        handle.setOrigin(0.5);
        handle.setStrokeStyle(2, 0x000000, 0.55);

        return {
            key,
            width,
            trackX: x,
            trackY: y,
            fill,
            handle,
            valueText,
            parts: [track, fill, handle],
        };
    }

    createSliderStepButton(x, y, text) {
        const button = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, 24, 24, 0x76683f, 0.55);
        background.setOrigin(0.5);
        background.setStrokeStyle(2, 0xd8d0bf, 0.35);

        const label = this.add.text(0, -1, text, {
            fontFamily: 'Courier New',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff4d8',
        });
        label.setOrigin(0.5);
        label.setStroke('#000000', 2);

        button.add([background, label]);

        return button;
    }

    createControlModeRow(x, y) {
        const row = this.add.container(x, y);
        const rowWidth = 430;
        const rowHeight = 66;
        const background = this.add.rectangle(0, 0, rowWidth, rowHeight, 0x171a14, 0.62).setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.2);
        const label = this.add.text(20, rowHeight / 2, 'CONTROL', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '20px',
            color: '#d8d0bf',
        }).setOrigin(0, 0.5);
        label.setStroke('#000000', 3);

        this.keyboardModeButton = this.createControlModeButton(142, 13, 126, 'TECLADO', 'keyboard');
        this.voiceModeButton = this.createControlModeButton(282, 13, 126, 'VOZ', 'voice');
        this.controlModeBounds = [
            { x: x + 142, y: y + 13, width: 126, height: 40, mode: 'keyboard' },
            { x: x + 282, y: y + 13, width: 126, height: 40, mode: 'voice' },
        ];
        row.add([background, label, this.keyboardModeButton, this.voiceModeButton]);
        this.refreshControlModeButtons();

        return row;
    }

    createControlModeButton(x, y, width, label, mode) {
        const button = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, width, 40, 0x141713, 0.48).setOrigin(0, 0);
        const text = this.add.text(width / 2, 20, label, {
            fontFamily: 'Courier New',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#d8d0bf',
        }).setOrigin(0.5);
        text.setStroke('#000000', 2);
        button.mode = mode;
        button.background = background;
        button.label = text;
        button.add([background, text]);

        return button;
    }

    refreshControlModeButtons() {
        [this.keyboardModeButton, this.voiceModeButton].forEach((button) => {
            if (!button) {
                return;
            }

            const isActive = button.mode === this.controlMode;
            button.background.setFillStyle(isActive ? 0x76683f : 0x141713, isActive ? 0.9 : 0.48);
            button.background.setStrokeStyle(2, isActive ? 0xd6b450 : 0xd8d0bf, isActive ? 0.9 : 0.25);
            button.label.setColor(isActive ? '#fff4d8' : '#bdb6a5');
        });
    }

    setControlMode(mode) {
        this.controlMode = mode;
        this.registry.set('controlMode', mode);
        window.localStorage.setItem('controlMode', mode);
        this.refreshControlModeButtons();

        if (!this.voiceController) {
            return;
        }

        if (mode === 'voice') {
            this.voiceController.start();
        } else {
            this.voiceController.stop();
        }
    }

    createBackButton(x, y) {
        const button = this.add.container(x, y);
        const width = 220;
        const height = 50;
        const background = this.add.rectangle(0, 0, width, height, 0x76683f, 0.62);
        background.setOrigin(0, 0);
        background.setStrokeStyle(2, 0xd8d0bf, 0.5);

        const label = this.add.text(28, 13, 'VOLVER', {
            fontFamily: 'Impact, Arial Black, Arial',
            fontSize: '22px',
            color: '#fff4d8',
        });
        label.setStroke('#000000', 3);

        button.add([background, label]);
        button.buttonBackground = background;
        this.backButtonBounds = {
            x,
            y,
            width,
            height,
        };

        return button;
    }

    createPointerHandlers() {
        // El arrastre global permite continuar moviendo el slider aunque el puntero
        // salga brevemente de la pista durante el gesto.
        this.handleOptionsPointerMove = (pointer) => {
            const isOverBackButton = this.isPointerOverBackButton(pointer);
            const hoveredSlider = this.getSliderAtPointer(pointer);
            const hoveredControlMode = this.getControlModeAtPointer(pointer);

            if (this.activeSlider) {
                this.updateSliderFromPointer(this.activeSlider, pointer);
            }

            this.game.canvas.style.cursor = isOverBackButton || hoveredSlider || hoveredControlMode
                ? 'pointer'
                : 'default';
            this.backButton.buttonBackground.setFillStyle(
                isOverBackButton ? 0x8a7748 : 0x76683f,
                isOverBackButton ? 0.74 : 0.62,
            );
        };

        this.handleOptionsPointerDown = (pointer) => {
            const slider = this.getSliderAtPointer(pointer);
            const controlMode = this.getControlModeAtPointer(pointer);

            if (slider) {
                this.activeSlider = slider;
                this.updateSliderFromPointer(slider, pointer, this.getSliderStepDirection(slider, pointer));
                return;
            }

            if (controlMode) {
                this.setControlMode(controlMode);
                return;
            }

            if (this.isPointerOverBackButton(pointer)) {
                this.returnToMainMenu();
            }
        };

        this.handleOptionsPointerUp = () => {
            this.activeSlider = null;
        };

        this.input.on('pointermove', this.handleOptionsPointerMove);
        this.input.on('pointerdown', this.handleOptionsPointerDown);
        this.input.on('pointerup', this.handleOptionsPointerUp);
    }

    destroyPointerHandlers() {
        this.input.off('pointermove', this.handleOptionsPointerMove);
        this.input.off('pointerdown', this.handleOptionsPointerDown);
        this.input.off('pointerup', this.handleOptionsPointerUp);
        this.game.canvas.style.cursor = 'default';
    }

    destroyResizeHandler() {
        this.scale.off('resize', this.resizeOptions, this);
    }

    createVoiceNavigation() {
        this.voiceController = new window.InterfaceVoiceController(
            this,
            (command) => this.handleVoiceNavigationCommand(command),
        );

        if (this.controlMode === 'voice') {
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
            this.returnToMainMenu();
            return;
        }

        if (/\b(teclado)\b/.test(command)) {
            this.setControlMode('keyboard');
            return;
        }

        if (/\b(voz|microfono)\b/.test(command)) {
            this.setControlMode('voice');
            return;
        }

        const slider = command.includes('musica')
            ? this.sliders.find((option) => option.key === 'music')
            : command.includes('efectos')
                ? this.sliders.find((option) => option.key === 'effects')
                : null;

        if (!slider) {
            return;
        }

        const percentMatch = command.match(/\b(\d{1,3})\b/);

        if (percentMatch) {
            this.setSliderPercent(slider, Number.parseInt(percentMatch[1], 10));
            return;
        }

        const currentPercent = Number.parseInt(slider.value.text, 10) || 0;

        if (/\b(sube|subir|aumenta|aumentar|mas)\b/.test(command)) {
            this.setSliderPercent(slider, currentPercent + 10);
        } else if (/\b(baja|bajar|reduce|reducir|menos)\b/.test(command)) {
            this.setSliderPercent(slider, currentPercent - 10);
        } else if (/\b(silencio|silenciar|mute)\b/.test(command)) {
            this.setSliderPercent(slider, 0);
        } else if (/\b(maximo|maxima)\b/.test(command)) {
            this.setSliderPercent(slider, 100);
        }
    }

    getSliderAtPointer(pointer) {
        const { localX, localY } = this.getPanelPointerPosition(pointer);

        return this.sliders.find((slider) => {
            const trackX = slider.trackX;
            const trackY = slider.trackY;
            const isOverTrack = localX >= trackX - 16
                && localX <= trackX + slider.width + 16
                && localY >= trackY - 24
                && localY <= trackY + 24;
            const isOverMinus = Math.abs(localX - (slider.rowX + slider.minusButton.x)) <= 16
                && Math.abs(localY - (slider.rowY + slider.minusButton.y)) <= 16;
            const isOverPlus = Math.abs(localX - (slider.rowX + slider.plusButton.x)) <= 16
                && Math.abs(localY - (slider.rowY + slider.plusButton.y)) <= 16;

            return isOverTrack || isOverMinus || isOverPlus;
        }) || null;
    }

    getControlModeAtPointer(pointer) {
        const { localX, localY } = this.getPanelPointerPosition(pointer);
        const option = this.controlModeBounds.find((bounds) => (
            localX >= bounds.x
            && localX <= bounds.x + bounds.width
            && localY >= bounds.y
            && localY <= bounds.y + bounds.height
        ));

        return option ? option.mode : null;
    }

    updateSliderFromPointer(slider, pointer) {
        const stepDirection = arguments.length > 2 ? arguments[2] : 0;

        if (stepDirection !== 0) {
            const currentPercent = Number.parseInt(slider.value.text, 10) || 0;
            this.setSliderPercent(slider, currentPercent + stepDirection * 10);
            return;
        }

        const { localX } = this.getPanelPointerPosition(pointer);
        const relativeX = Phaser.Math.Clamp(localX - slider.trackX, 0, slider.width);
        const percent = Math.round((relativeX / slider.width) * 100);

        this.setSliderPercent(slider, percent);
    }

    setSliderPercent(slider, percent) {
        // Cada cambio actualiza interfaz, persistencia y el audio que ya esta sonando.
        const clampedPercent = Phaser.Math.Clamp(percent, 0, 100);
        const relativeX = slider.width * (clampedPercent / 100);

        slider.fill.setSize(Math.max(relativeX, 1), 8);
        slider.handle.setX(slider.localTrackX + relativeX);
        slider.value.setText(`${clampedPercent}%`);
        this.registry.set(slider.registryKey, clampedPercent);
        window.localStorage.setItem(slider.registryKey, String(clampedPercent));

        if (slider.key === 'music') {
            this.applyMusicVolume(clampedPercent);
        }

        if (slider.key === 'effects') {
            this.applyEffectsVolume(clampedPercent);
        }
    }

    getSliderStepDirection(slider, pointer) {
        const { localX, localY } = this.getPanelPointerPosition(pointer);
        const minusX = slider.rowX + slider.minusButton.x;
        const minusY = slider.rowY + slider.minusButton.y;
        const plusX = slider.rowX + slider.plusButton.x;
        const plusY = slider.rowY + slider.plusButton.y;

        if (Math.abs(localX - minusX) <= 16 && Math.abs(localY - minusY) <= 16) {
            return -1;
        }

        if (Math.abs(localX - plusX) <= 16 && Math.abs(localY - plusY) <= 16) {
            return 1;
        }

        return 0;
    }

    getPanelPointerPosition(pointer) {
        return {
            localX: pointer.position.x - this.panel.x,
            localY: pointer.position.y - this.panel.y,
        };
    }

    applyMusicVolume(percent) {
        const volume = percent / 100;
        const currentMusic = window.GameAudio && window.GameAudio.backgroundMusic;

        if (currentMusic) {
            currentMusic.setVolume(volume);
        }

        if (typeof this.sound.getAll === 'function') {
            this.sound.getAll('background-music').forEach((music) => {
                music.setVolume(volume);
            });
        }
    }

    applyEffectsVolume(percent) {
        // Los efectos activos, como los pasos del nivel, responden inmediatamente.
        const volume = percent / 100;
        const footstepsVolume = Math.min(1, volume * 1.5);
        const footsteps = window.GameAudio && window.GameAudio.playerFootsteps;
        const playerShot = window.GameAudio && window.GameAudio.playerShot;

        if (footsteps) {
            footsteps.setVolume(footstepsVolume);
        }

        if (playerShot) {
            playerShot.setVolume(volume);
        }

        if (typeof this.sound.getAll === 'function') {
            this.sound.getAll('player-footsteps').forEach((sound) => {
                sound.setVolume(footstepsVolume);
            });
            this.sound.getAll('player-shot').forEach((sound) => {
                sound.setVolume(volume);
            });
        }
    }

    isPointerOverBackButton(pointer) {
        if (!this.backButtonBounds) {
            return false;
        }

        const localX = pointer.x - this.panel.x;
        const localY = pointer.y - this.panel.y;
        const bounds = this.backButtonBounds;

        return localX >= bounds.x
            && localX <= bounds.x + bounds.width
            && localY >= bounds.y
            && localY <= bounds.y + bounds.height;
    }

    returnToMainMenu() {
        // La configuracion independiente siempre vuelve a la pantalla principal.
        this.destroyPointerHandlers();
        this.tweens.add({
            targets: this.panel,
            y: this.panel.y + 34,
            alpha: 0,
            duration: 360,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.scene.start('MainMenuScene');
            },
        });
    }

    resizeOptions() {
        this.scaleBackground();
        this.dimmer.setSize(this.scale.width, this.scale.height);
        this.panel.setPosition(this.getCenteredPanelPosition().x, this.getCenteredPanelPosition().y);
    }

    getCenteredPanelPosition() {
        return {
            x: (this.scale.width - this.panelWidth) / 2,
            y: (this.scale.height - this.panelHeight) / 2,
        };
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

window.OptionsScene = OptionsScene;
