class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, groundY, textureKey, displayHeight) {
        super(scene, x, groundY, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Movimiento horizontal, profundidad del suelo y salto se calculan por separado.
        this.speed = 220;
        this.verticalSpeed = 180;
        this.jumpSpeed = 520;
        this.jumpGravity = 1400;
        this.groundY = groundY;
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.isShooting = false;
        this.isThrowingGrenade = false;
        this.hasFiredCurrentShot = false;
        this.hasThrownCurrentGrenade = false;

        // El origen inferior mantiene los pies alineados con el piso del nivel.
        this.setOrigin(0.5, 1);
        this.body.allowGravity = false;
        this.setCollideWorldBounds(true);
        this.resizeToHeight(displayHeight);

        this.on('animationcomplete-player-shoot', () => {
            this.isShooting = false;
            this.hasFiredCurrentShot = false;
            this.setTexture('player-idle');
        });
        this.on('animationupdate', (animation, frame) => {
            const isSecondShootFrame = animation.key === 'player-shoot' && frame.textureFrame === 1;
            const isSecondGrenadeFrame = animation.key === 'player-grenade'
                && frame.textureFrame === 1;

            if (isSecondShootFrame && !this.hasFiredCurrentShot) {
                this.hasFiredCurrentShot = true;
                this.scene.fireBullet(this);
            }

            if (isSecondGrenadeFrame && !this.hasThrownCurrentGrenade) {
                this.hasThrownCurrentGrenade = true;
                this.scene.launchGrenade(this);
            }
        });
        this.on('animationcomplete-player-grenade', () => {
            this.isThrowingGrenade = false;
            this.hasThrownCurrentGrenade = false;
            this.setTexture('player-idle');
        });
    }

    resizeToHeight(displayHeight) {
        const aspectRatio = this.width / this.height;

        this.setDisplaySize(displayHeight * aspectRatio, displayHeight);
        this.configureBody();
    }

    configureBody() {
        // Hitbox mas angosta que el sprite para evitar choques con transparencia lateral.
        this.body.setSize(this.width * 0.45, this.height * 0.9);
        this.body.setOffset(this.width * 0.27, this.height * 0.1);
    }

    updateMovement(cursors, keys, voiceInput, controlMode, movementBounds, delta) {
        // Esta funcion concentra entrada, movimiento y acciones para que la escena
        // solo coordine sistemas externos, como audio y enemigos.
        const deltaSeconds = delta / 1000;
        const usesKeyboard = controlMode === 'keyboard';
        const usesVoice = controlMode === 'voice';
        const isMovingLeft = (usesKeyboard && (cursors.left.isDown || keys.left.isDown))
            || (usesVoice && voiceInput.left);
        const isMovingRight = (usesKeyboard && (cursors.right.isDown || keys.right.isDown))
            || (usesVoice && voiceInput.right);
        const isMovingUp = (usesKeyboard && cursors.up.isDown) || (usesVoice && voiceInput.up);
        const isMovingDown = (usesKeyboard && cursors.down.isDown) || (usesVoice && voiceInput.down);
        const isMoving = isMovingLeft || isMovingRight || isMovingUp || isMovingDown;
        const wantsJump = (usesKeyboard && Phaser.Input.Keyboard.JustDown(keys.jump))
            || (usesVoice && voiceInput.jump);
        const wantsShoot = (usesKeyboard && Phaser.Input.Keyboard.JustDown(keys.shoot))
            || (usesVoice && voiceInput.shoot);
        const wantsGrenade = (usesKeyboard && Phaser.Input.Keyboard.JustDown(keys.grenade))
            || (usesVoice && voiceInput.grenade);

        voiceInput.jump = false;
        voiceInput.shoot = false;
        voiceInput.grenade = false;

        if (isMovingLeft) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if (isMovingRight) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        if (isMovingUp) {
            this.groundY -= this.verticalSpeed * deltaSeconds;
        } else if (isMovingDown) {
            this.groundY += this.verticalSpeed * deltaSeconds;
        }

        if (wantsShoot) {
            this.shoot();
        }
        if (wantsGrenade) {
            this.throwGrenade();
        }

        this.updateAnimation(isMovingLeft, isMovingRight, isMovingUp, isMovingDown);
        this.keepGroundInsideMovementArea(movementBounds);
        this.updateJump(wantsJump, deltaSeconds);
        this.y = this.groundY - this.jumpOffset;

        // La escena usa este resultado para reproducir pasos solo sobre el suelo.
        return isMoving && !this.isJumping;
    }

    updateJump(wantsJump, deltaSeconds) {
        // El salto es un desplazamiento visual sobre groundY, sin abandonar el carril.
        if (wantsJump && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpSpeed;
        }

        if (!this.isJumping) {
            this.jumpOffset = 0;
            return;
        }

        this.jumpOffset += this.jumpVelocity * deltaSeconds;
        this.jumpVelocity -= this.jumpGravity * deltaSeconds;

        if (this.jumpOffset <= 0) {
            this.jumpOffset = 0;
            this.jumpVelocity = 0;
            this.isJumping = false;
        }
    }

    keepGroundInsideMovementArea(movementBounds) {
        this.groundY = Phaser.Math.Clamp(this.groundY, movementBounds.top, movementBounds.bottom);
    }

    stopMovement() {
        // Al pausar se fuerza un estado estable y sin animaciones activas.
        this.setVelocity(0, 0);
        this.anims.stop();
        this.isShooting = false;
        this.isThrowingGrenade = false;
        this.hasThrownCurrentGrenade = false;
        this.setTexture('player-idle');
    }

    shoot() {
        if (this.isThrowingGrenade) {
            return;
        }

        this.isShooting = true;
        this.hasFiredCurrentShot = false;
        this.anims.play('player-shoot', true);
    }

    throwGrenade() {
        // No se interrumpen acciones ofensivas y la municion se refleja en el HUD.
        if (this.isShooting || this.isThrowingGrenade || this.scene.grenades <= 0) {
            return;
        }

        this.isThrowingGrenade = true;
        this.hasThrownCurrentGrenade = false;
        this.scene.setGrenades(this.scene.grenades - 1);
        this.anims.play('player-grenade', true);
    }

    updateAnimation(isMovingLeft, isMovingRight, isMovingUp, isMovingDown) {
        if (this.isShooting || this.isThrowingGrenade) {
            return;
        }

        if (isMovingUp) {
            this.anims.play('player-walk-up', true);
            return;
        }

        if (isMovingDown) {
            this.anims.play('player-walk-down', true);
            return;
        }

        if (isMovingLeft || isMovingRight) {
            this.anims.play('player-walk', true);
            return;
        }

        this.anims.stop();
        this.setTexture('player-idle');
    }

    setGroundPosition(x, groundY) {
        this.groundY = groundY;
        this.setPosition(x, this.groundY - this.jumpOffset);
    }
}

window.Player = Player;
