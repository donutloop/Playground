document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('game-grid');
    let cards = [];
    let selectedIndex = 0;

    // Gamepad state
    let lastButtonState = {};
    let lastAxisState = {};
    const DEBOUNCE_MS = 150;
    let lastInputTime = 0;

    // Games Data
    const games = [
        {
            "id": "neon_drifter",
            "name": "Neon Drifter",
            "path": "games/neon_drifter/index.html",
            "description": "High-octane cyber-ninja action.",
            "thumbnail": "games/neon_drifter/thumbnail.png"
        }
    ];

    renderGames(games);
    initInput();

    function renderGames(games) {
        if (games.length === 0) {
            grid.innerHTML = '<div class="loading-state">No games found.</div>';
            return;
        }

        grid.innerHTML = ''; // Clear loading state

        games.forEach((game, index) => {
            const card = document.createElement('a');
            card.className = 'game-card';
            card.href = game.path;
            card.dataset.index = index;

            // Thumbnail handling
            let thumbnailHtml = `<div class="placeholder-img">🎮</div>`;
            if (game.thumbnail) {
                thumbnailHtml = `<img src="${game.thumbnail}" alt="${game.name} thumbnail">`;
            }

            card.innerHTML = `
                <div class="card-thumbnail">
                    ${thumbnailHtml}
                </div>
                <div class="card-content">
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-desc">${game.description || 'No description available.'}</p>
                </div>
            `;

            // Allow mouse hover to update selection
            card.addEventListener('mouseenter', () => {
                selectCard(index);
            });

            grid.appendChild(card);
        });

        cards = document.querySelectorAll('.game-card');
        selectCard(0); // Select first by default
    }

    function selectCard(index) {
        if (!cards.length) return;

        // Wrap around
        if (index < 0) index = cards.length - 1;
        if (index >= cards.length) index = 0;

        // Visual Update
        cards.forEach(c => c.classList.remove('selected'));
        cards[index].classList.add('selected');

        // Scroll into view if needed
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });

        selectedIndex = index;
    }

    function initInput() {
        // Keyboard Listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                selectCard(selectedIndex + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                selectCard(selectedIndex - 1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                launchGame();
            }
        });

        // Start Gamepad Loop
        requestAnimationFrame(gamepadLoop);
    }

    function launchGame() {
        if (cards[selectedIndex]) {
            window.location.href = cards[selectedIndex].href;
        }
    }

    function gamepadLoop() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0]; // Support first player

        if (gp) {
            const now = Date.now();
            if (now - lastInputTime > DEBOUNCE_MS) {

                // Stick / D-Pad
                const axisX = gp.axes[0];
                const axisY = gp.axes[1];

                if (axisX > 0.5 || axisY > 0.5) { // Right / Down
                    selectCard(selectedIndex + 1);
                    lastInputTime = now;
                }
                else if (axisX < -0.5 || axisY < -0.5) { // Left / Up
                    selectCard(selectedIndex - 1);
                    lastInputTime = now;
                }

                // Buttons (Cross/A = 0)
                if (gp.buttons[0].pressed) {
                    launchGame();
                    lastInputTime = now + 500; // Longer debounce for launch
                }
            }
        }

        requestAnimationFrame(gamepadLoop);
    }
});
