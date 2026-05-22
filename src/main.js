// Configuracion principal del juego. Desde aqui se conectan Phaser, el canvas y las escenas.
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#111827',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 1200,
            },
            debug: false,
        },
    },
    scale: {
        // RESIZE permite que el juego se ajuste al tamano real de la ventana.
        mode: Phaser.Scale.RESIZE,
        parent: 'game-root',
        width: '100%',
        height: '100%',
    },
    scene: [window.MainMenuScene, window.OptionsScene, window.LevelOneScene],
};

// Se expone en window para facilitar depuracion desde la consola del navegador.
window.game = new Phaser.Game(gameConfig);
