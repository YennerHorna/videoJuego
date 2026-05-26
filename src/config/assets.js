// Catalogo central de assets: las escenas consumen estas rutas sin conocer
// la estructura fisica de carpetas del proyecto.
window.GameAssets = {
    backgrounds: {
        mainMenu: 'assets/backgrounds/fondo_menu_inicio.jpg',
        levelOne: 'assets/backgrounds/fondo_nivel1.jpg',
        germanyMap: 'assets/backgrounds/germany_map.png',
    },
    sprites: {
        playerIdle: 'assets/sprite/player/player_idle.png',
        playerWalk: 'assets/sprite/player/player_walk.png',
        playerWalkUp: 'assets/sprite/player/player_walk_up.png',
        playerWalkDown: 'assets/sprite/player/player_walk_down.png',
        playerShoot: 'assets/sprite/player/player_shoot.png',
        playerGrenade: 'assets/sprite/player/player_granade.png',
        enemyIdle: 'assets/sprite/enemies/enemy_idle.png',
        enemyWalk: 'assets/sprite/enemies/enemy_walk.png',
        enemyWalkDown: 'assets/sprite/enemies/enemy_walk_down.png',
        enemyWalkUp: 'assets/sprite/enemies/enemy_walk_up.png',
        enemyDamage: 'assets/sprite/enemies/enemy_dmg.png',
        enemyShoot: 'assets/sprite/enemies/enemy_shoot.png',
    },
    items: {
        bullet: 'assets/items/bullet.png',
        grenade: 'assets/items/granade.png',
        explosion: 'assets/items/explosion_animation.png',
        key: 'assets/items/key.png',
    },
    audio: {
        backgroundMusic: 'assets/audio/music/background.mp3',
        playerFootsteps: 'assets/audio/sound/player_footsteps.mp3',
        playerShot: 'assets/audio/sound/shot.mp3',
        grenadeExplosion: 'assets/audio/sound/burst.mp3',
    },
};
