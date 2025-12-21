document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('game-grid');

    // In a real app served via HTTP, we would fetch this.
    // specificially for file:/// protocol, fetch is blocked by CORS.
    const games = [
        {
            "id": "neon_drifter",
            "name": "Neon Drifter",
            "path": "games/neon_drifter/index.html",
            "description": "High-octane cyber-ninja action.",
            "thumbnail": ""
        }
    ];

    renderGames(games);

    function renderGames(games) {
        if (games.length === 0) {
            grid.innerHTML = '<div class="loading-state">No games found.</div>';
            return;
        }

        grid.innerHTML = ''; // Clear loading state

        games.forEach(game => {
            const card = document.createElement('a');
            card.className = 'game-card';
            card.href = game.path;

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

            grid.appendChild(card);
        });
    }
});
