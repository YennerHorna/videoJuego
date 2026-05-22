class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, groundY, textureKey, displayHeight) {
        super(scene, x, groundY, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 220;
        this.verticalSpeed = 180;
        this.jumpSpeed = 520;
        this.jumpGravity = 1400;
        this.groundY = groundY;
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.isShooting = false;

        // El origen inferior mantiene los pies alineados con el piso del nivel.
        this.setOrigin(0.5, 1);
        this.body.allowGravity = false;
        this.setCollideWorldBounds(true);
        this.resizeToHeight(displayHeight);

        this.on('animationcomplete-player-shoot', () => {
            this.isShooting = false;
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

    updateMovement(cursors, keys, movementBounds, delta) {
        const deltaSeconds = delta / 1000;
        const isMovingLeft = cursors.left.isDown || keys.left.isDown;
        const isMovingRight = cursors.right.isDown || keys.right.isDown;
        const isMovingUp = cursors.up.isDown;
        const isMovingDown = cursors.down.isDown;
        const wantsJump = Phaser.Input.Keyboard.JustDown(keys.jump);
        const wantsShoot = Phaser.Input.Keyboard.JustDown(keys.shoot);

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

        this.updateAnimation(isMovingLeft, isMovingRight, isMovingUp, isMovingDown);
        this.keepGroundInsideMovementArea(movementBounds);
        this.updateJump(wantsJump, deltaSeconds);
        this.y = this.groundY - this.jumpOffset;
    }

    updateJump(wantsJump, deltaSeconds) {
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
        this.setVelocity(0, 0);
        this.anims.stop();
        this.setTexture('player-idle');
    }

    shoot() {
        this.isShooting = true;
        this.anims.play('player-shoot', true);
    }

    updateAnimation(isMovingLeft, isMovingRight, isMovingUp, isMovingDown) {
        if (this.isShooting) {
            return;
        }

        if (isMovingUp) {
            this.anims.play('player-walk-up', true);
            return;
        }

        if (isMovingDown) {
            this.anims.play('player-move-down', true);
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
