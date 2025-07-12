document.addEventListener('DOMContentLoaded', () => {
    // --- Element-Caching ---
    const $ = selector => document.querySelector(selector);

    const statusEl = $('#status');
    const bindingsListEl = $('#bindingsList');
    const voiceListEl = $('#voiceList');
    const allStatsBtn = $('#all-stats-btn');
    const sessionStatsBtn = $('#session-stats-btn');
    const statsBodyEl = $('#statsBody');
    const searchInput = $('#search');
    const bindingForm = $('#bindingForm');
    const nameInput = bindingForm.querySelector('[name="name"]');
    const steamIdInput = bindingForm.querySelector('[name="steamId"]');
    const discordIdInput = bindingForm.querySelector('[name="discordId"]');
    const endRoundBtn = $('#end-round-button');
    const confirmBtn = $('#modal-confirm');
    const cancelBtn = $('#modal-cancel');
    const overlay = $('#modal-overlay');

    let currentEditSteamId = null;
    let statsType = 'all';

    // --- API Helper ---
    const apiCall = (endpoint, body = {}) => fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });

    // --- HTML Factories ---
    const createBindingRowHTML = binding => `
        <div class="flex items-center bg-slate-800 px-4 py-3 rounded-xl shadow-md hover:bg-slate-700 transition-all group gap-4" data-steam-id="${binding.steamId}">
            <img src="${binding.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="Avatar" class="w-8 h-8 rounded-full ring-2 ring-white/10 group-hover:ring-blue-400/30 flex-shrink-0" />
                <div class="flex flex-col flex-1 min-w-0">
                    <span class="font-bold text-white text-base truncate">${binding.name}</span>
                    <div class="flex gap-4 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                        <span>
                            <span class="text-slate-500">Steam:</span>
                            <a href="https://steamcommunity.com/profiles/${binding.steamId}" target="_blank" class="text-blue-400 underline hover:text-blue-300 break-all">${binding.steamId}</a>
                        </span>
                        <span>
                            <span class="text-slate-500">Discord:</span>
                            <a href="https://discordlookup.com/user/${binding.discordId}" target="_blank" class="text-blue-400 underline hover:text-blue-300 break-all">${binding.discordId}</a>
                        </span>
                  </div>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                    <button data-action="edit" class="rounded-full bg-slate-700 p-2 text-blue-400 hover:bg-blue-600 hover:text-white transition" title="Bearbeiten">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="delete" class="rounded-full bg-slate-700 p-2 text-red-400 hover:bg-red-600 hover:text-white transition" title="Löschen">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
        </div>
    `;

    const createVoiceUserHTML = user => `
        <div class="flex items-center justify-between ${user.muted ? 'bg-red-800' : 'bg-green-800'} p-3 rounded-xl shadow-md" data-discord-id="${user.discordId}">
            <div class="flex items-center gap-3">
                <img src="${user.avatarUrl}" class="w-10 h-10 rounded-full ring-2 ring-white/20" alt="Avatar von ${user.name}" />
                <span>${user.name}</span>
            </div>
            <button data-action="toggle-mute" class="text-white hover:text-white/80" title="${user.muted ? 'Entmuten' : 'Muten'}">
                <i data-lucide="${user.muted ? 'mic' : 'mic-off'}" class="w-5 h-5"></i>
            </button>
        </div>
    `;

    // --- Load Functions ---
    async function loadBindings() {
        try {
            const res = await fetch('/api/bindings');
            if (!res.ok) throw new Error('Bindings konnten nicht geladen werden');
            let bindings = await res.json();
            const searchTerm = searchInput.value.toLowerCase();

            if (searchTerm) {
                bindings = bindings.filter(b =>
                    b.name.toLowerCase().includes(searchTerm) ||
                    b.steamId.includes(searchTerm) ||
                    b.discordId.includes(searchTerm)
                );
            }
            bindings.sort((a, b) => a.name.localeCompare(b.name));
            bindingsListEl.innerHTML = bindings.map(createBindingRowHTML).join('');
            lucide.createIcons();
        } catch (err) {
            console.error(err);
            bindingsListEl.innerHTML = `<p class="text-red-400">Bindings konnten nicht geladen werden.</p>`;
        }
    }

    async function loadVoiceList() {
        try {
            const res = await fetch('/api/voice');
            if (!res.ok) throw new Error('Voice-Liste konnte nicht geladen werden');

            const voiceUsers = await res.json();
            if (!voiceUsers.length) {
                voiceListEl.innerHTML = `
                    <div class="bg-slate-800 rounded-xl p-4 text-center flex items-center justify-center gap-2">
                        <i data-lucide="mic-off" class="w-5 h-5 opacity-70"></i>
                        <span class="text-white text-base">Noch ist niemand im Discord.</span>
                    </div>
                `;
            } else {
                voiceListEl.innerHTML = voiceUsers.map(createVoiceUserHTML).join('');
            }
        } catch (err) {
            console.error(err);
            voiceListEl.innerHTML = `
                <div class="bg-slate-800 rounded-xl p-4 text-center flex items-center justify-center gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                    <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                </div>
            `;
        }

        lucide.createIcons();
    }

    async function loadStats() {
        try {
            const endpoint = statsType === 'all' ? '/api/stats' : '/api/stats/session';
            const res = await fetch(endpoint);
            const stats = await res.json();

            if (!stats.length) {
                statsBodyEl.innerHTML = `
                    <tr>
                        <td colspan="12" class="text-center p-4">
                            Noch keine Statistiken vorhanden.
                        </td>
                    </tr>`;
                return;
            }

            stats.sort((a, b) => (b.winrate - a.winrate) || (b.kdRatio - a.kdRatio));

            const keys = ['kills', 'deaths', 'damage', 'wins', 'losses', 'traitorRounds'];
            const maxValues = Object.fromEntries(
                keys.map(key => [key, Math.max(...stats.map(p => p[key]), 1)])
            );

            const rankClasses = ['bg-yellow-500/10', 'bg-slate-500/10', 'bg-orange-700/10'];

            statsBodyEl.innerHTML = stats.map((player, idx) => {
                const rankClass = rankClasses[idx] || 'hover:bg-slate-700/50';
                const totalKills = player.kills + player.teamKills;
                const totalDamage = player.damage + player.teamDamage;

                return `
                    <tr class="border-t border-slate-700 transition-colors duration-200 ${rankClass}">
                        <td class="p-3 font-bold text-center text-lg">${idx + 1}</td>
                        <td class="p-3 font-medium">${player.name || 'Unbekannter Spieler'}</td>
                        <td class="p-3">${bar(player.kills, maxValues.kills, 'green')}</td>
                        <td class="p-3">${bar(player.teamKills, totalKills, 'red')}</td>
                        <td class="p-3">${bar(player.deaths, maxValues.deaths, 'red')}</td>
                        <td class="p-3 text-center font-bold font-mono">${Number(player.kdRatio).toFixed(2)}</td>
                        <td class="p-3">${bar(player.wins, maxValues.wins, 'green')}</td>
                        <td class="p-3">${bar(player.losses, maxValues.losses, 'red')}</td>
                        <td class="p-3">${bar(player.damage, maxValues.damage, 'green', 0)}</td>
                        <td class="p-3">${bar(player.teamDamage, totalDamage, 'red', 0)}</td>
                        <td class="p-3">${bar(player.traitorRounds, maxValues.traitorRounds, 'sky', 1)}</td>
                        <td class="p-3">${bar(player.winrate, 100, 'blue', 1, '%')}</td>
                    </tr>
                `;
            }).join('');

            setTimeout(() => {
                requestAnimationFrame(() => {
                    document.querySelectorAll('.stat-bar').forEach(bar => {
                        bar.style.width = bar.dataset.targetWidth + '%';
                    });
                });
            }, 30);
        } catch (err) {
            console.error('Fehler beim Laden der Statistiken:', err);
            statsBodyEl.innerHTML = `
                <tr>
                    <td colspan="12" class="text-red-400 p-4 ">
                        <div class="text-center flex items-center justify-center gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                            <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        lucide.createIcons();
    }

    function percent(value, max) {
        return max ? (value / max) * 100 : 0;
    }

    function bar(value, max, color, digits = 0, suffix = '') {
        const colors = {
            green: ['bg-green-500/10', 'bg-green-500/40'],
            red: ['bg-red-500/10', 'bg-red-500/40'],
            blue: ['bg-blue-500/10', 'bg-blue-500/40'],
            sky: ['bg-sky-500/10', 'bg-sky-500/40']
        };
        const [bg, fg] = colors[color] || colors.green;

        return `
            <div class="relative w-full h-6 ${bg} rounded overflow-hidden">
                <div class="stat-bar absolute top-0 left-0 h-full ${fg} transition-all duration-700" data-target-width="${percent(value, max)}" style="width:0"></div>
                <span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">
                    ${Number(value).toFixed(digits)}${suffix}
                </span>
            </div>
        `;
    }

    // --- Confirm Dialog ---

    function showConfirmDialog(text = "Soll der Eintrag wirklich gelöscht werden?") {
        return new Promise(resolve => {
            overlay.querySelector('p').textContent = text;
            overlay.classList.remove('hidden');

            const onConfirm = () => {
                overlay.classList.add('hidden');
                cleanup();
                resolve(true);
            };
            const onCancel = () => {
                overlay.classList.add('hidden');
                cleanup();
                resolve(false);
            };

            function cleanup() {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            }

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    }


    // --- Event Handlers ---
    allStatsBtn.addEventListener('click', () => {
        if (statsType === 'all') return;
        statsType = 'all';

        toggleActiveSessionButton(allStatsBtn, sessionStatsBtn);

        void loadStats();
    });

    sessionStatsBtn.addEventListener('click', () => {
        if (statsType === 'session') return;
        statsType = 'session';

        toggleActiveSessionButton(sessionStatsBtn, allStatsBtn);

        void loadStats();
    });

    function toggleActiveSessionButton(activeButton, inactiveButton) {
        activeButton.classList.add('bg-blue-600', 'font-bold', 'shadow');
        activeButton.classList.remove('bg-slate-800');

        inactiveButton.classList.remove('bg-blue-600', 'font-bold', 'shadow');
        inactiveButton.classList.add('bg-slate-800');
    }

    bindingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await apiCall('/api/bindings', {
            name: nameInput.value,
            steamId: steamIdInput.value,
            discordId: discordIdInput.value,
        });
        bindingForm.reset();
        currentEditSteamId = null;
        void loadBindings();
    });

    bindingsListEl.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const row = button.closest('[data-steam-id]');
        const steamId = row.dataset.steamId;
        const action = button.dataset.action;

        if (action === 'delete') {
            if (await showConfirmDialog()) {
                await fetch('/api/bindings/' + steamId, {method: 'DELETE'});
                row.remove();
            }
        } else if (action === 'edit') {
            const res = await fetch('/api/bindings/' + steamId);
            const data = await res.json();
            nameInput.value = data.name;
            steamIdInput.value = data.steamId;
            discordIdInput.value = data.discordId;
            currentEditSteamId = data.steamId;
            nameInput.focus();
        }
    });

    voiceListEl.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-action="toggle-mute"]');
        if (!button) return;

        const row = button.closest('[data-discord-id]');
        const discordId = row.dataset.discordId;
        const isMuted = row.classList.contains('bg-red-800');
        await apiCall(`/api/${isMuted ? 'unmute' : 'mute'}/${discordId}`);
    });

    endRoundBtn.addEventListener('click', () => {
        void apiCall('/api/unmuteAll');
    });

    searchInput.addEventListener('input', loadBindings);

    function createWebSocket() {
        const ws = new WebSocket('ws://localhost:3000');
        ws.addEventListener('open', async () => {
            console.log('WebSocket verbunden');
        });

        ws.addEventListener('message', async event => {
            let msg;
            try {
                msg = JSON.parse(event.data);
            } catch (err) {
                return;
            }
            if (msg.type === 'statsUpdate') {
                void loadStats();
            } else if (msg.type === 'voiceUpdate') {
                void loadVoiceList();
            }
        });
    }

    // --- Initialisierung ---
    async function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const statsTypeParam = urlParams.get('stats');
        if (statsTypeParam === 'session') {
            statsType = 'session';
            toggleActiveSessionButton(sessionStatsBtn, allStatsBtn);
        }

        createWebSocket();

        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            statusEl.textContent = `🟢 Verbunden als: ${data.tag}`;
        } catch {
            statusEl.textContent = '🔴 Keine Verbindung zum Bot';
        }
        void loadBindings();
        void loadVoiceList();
        void loadStats();
        lucide.createIcons();
    }

    void initialize();
});
