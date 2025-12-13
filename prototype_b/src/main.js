import { Game } from './Game.js';

window.addEventListener('error', (e) => {
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.top = '0';
    errorMsg.style.left = '0';
    errorMsg.style.width = '100%';
    errorMsg.style.background = 'rgba(255, 0, 0, 0.8)';
    errorMsg.style.color = 'white';
    errorMsg.style.padding = '10px';
    errorMsg.style.zIndex = '9999';
    errorMsg.innerText = 'ERROR: ' + e.message;
    document.body.appendChild(errorMsg);
});

window.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new Game();
        game.start();
    } catch (e) {
        console.error(e);
        // Error will be caught by window handler likely, or we trigger it manually
        const event = new ErrorEvent('error', { message: e.message });
        window.dispatchEvent(event);
    }
});
