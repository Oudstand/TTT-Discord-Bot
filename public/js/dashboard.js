document.addEventListener('DOMContentLoaded', () => {
    // --- Element-Caching ---
    const $ = selector => document.querySelector(selector);

    const statusEl = $('#status');
    const bindingsListEl = $('#bindingsList');
    const voiceListEl = $('#voiceList');
    const statsBodyEl = $('#statsBody');
    const searchInput = $('#search');
    const bindingForm = $('#bindingForm');
    const nameInput = bindingForm.querySelector('[name="name"]');
    const steamIdInput = bindingForm.querySelector('[name="steamId"]');
    const discordIdInput = bindingForm.querySelector('[name="discordId"]');
    const endRoundBtn = $('button[onclick="endRound()"]');
    const confirmBtn = $('#modal-confirm');
    const cancelBtn = $('#modal-cancel');
    const overlay = $('#modal-overlay');

    let currentEditSteamId = null;

    // --- API Helper ---
    const apiCall = (endpoint, body = {}) => fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });

    // --- HTML Factories ---
    const createBindingRowHTML = binding => `
        <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl shadow-md" data-steam-id="${binding.steamId}">
            <span>
                ${binding.name} –
                Steam: <a href="https://steamcommunity.com/profiles/${binding.steamId}" target="_blank" class="text-blue-400 underline">${binding.steamId}</a> –
                Discord: <a href="https://discordlookup.com/user/${binding.discordId}" target="_blank" class="text-blue-400 underline">${binding.discordId}</a>
            </span>
            <div class="flex gap-2">
                <button data-action="edit" class="text-blue-400 hover:text-blue-200" title="Bearbeiten">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button data-action="delete" class="text-red-400 hover:text-red-200" title="Löschen">
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
            voiceListEl.innerHTML = voiceUsers.map(createVoiceUserHTML).join('');
            lucide.createIcons();
        } catch (err) {
            console.error(err);
            voiceListEl.innerHTML = `<p class="text-red-400">Voice-Liste konnte nicht geladen werden.</p>`;
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const stats = await res.json();

            if (!stats.length) {
                statsBodyEl.innerHTML = '<tr><td colspan="12" class="text-center p-4">Noch keine Statistiken vorhanden.</td></tr>';
                return;
            }

            stats.sort((a, b) => (b.winrate - a.winrate) || (b.kdRatio - a.kdRatio));
            const maxKills = Math.max(...stats.map(p => p.kills), 1);
            const maxDeaths = Math.max(...stats.map(p => p.deaths), 1);
            const maxDamage = Math.max(...stats.map(p => p.damage), 1);
            const rankClasses = ['bg-yellow-500/10', 'bg-slate-500/10', 'bg-orange-700/10'];

            statsBodyEl.innerHTML = stats.map((player, idx) => {
                const rankClass = rankClasses[idx] || 'hover:bg-slate-700/50';
                const totalKills = player.kills + player.teamKills;
                const killPercent = maxKills ? (player.kills / maxKills) * 100 : 0;
                const teamKillPercent = totalKills ? (player.teamKills / totalKills) * 100 : 0;
                const deathPercent = maxDeaths ? (player.deaths / maxDeaths) * 100 : 0;
                const damagePercent = maxDamage ? (player.damage / maxDamage) * 100 : 0;
                const totalDamage = player.damage + player.teamDamage;
                const teamDamagePercent = totalDamage ? (player.teamDamage / totalDamage) * 100 : 0;

                return `
                    <tr class="border-t border-slate-700 transition-colors duration-200 ${rankClass}">
                        <td class="p-3 font-bold text-center text-lg">${idx + 1}</td>
                        <td class="p-3 font-medium">${player.name || 'Unbekannter Spieler'}</td>
                        <td class="p-3"><div class="relative w-full h-6 bg-green-500/10 rounded overflow-hidden"><div class="absolute top-0 left-0 h-full bg-green-500/40" style="width: ${killPercent}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${player.kills}</span></div></td>
                        <td class="p-3"><div class="relative w-full h-6 bg-red-500/10 rounded overflow-hidden"><div class="absolute top-0 left-0 h-full bg-red-500/40" style="width: ${teamKillPercent}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${player.teamKills}</span></div></td>
                        <td class="p-3"><div class="relative w-full h-6 bg-red-500/10 rounded overflow-hidden"><div class="absolute top-0 left-0 h-full bg-red-500/40" style="width: ${deathPercent}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${player.deaths}</span></div></td>
                        <td class="p-3 text-center font-bold font-mono">${Number(player.kdRatio).toFixed(2)}</td>
                        <td class="p-3 text-center font-mono">${player.wins}</td>
                        <td class="p-3 text-center font-mono">${player.losses}</td>
                        <td class="p-3"><div class="relative w-full h-6 bg-green-500/10 rounded overflow-hidden"><div class="absolute top-0 left-0 h-full bg-green-500/40" style="width: ${damagePercent}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${Number(player.damage).toFixed(0)}</span></div></td>
                        <td class="p-3"><div class="relative w-full h-6 bg-red-500/10 rounded overflow-hidden"><div class="absolute top-0 left-0 h-full bg-red-500/40" style="width: ${teamDamagePercent}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${Number(player.teamDamage).toFixed(0)}</span></div ></td>
                        <td class="p-3 text-center font-mono">${player.traitorRounds}</td>
                        <td class="p-3"><div class="relative w-full h-6 bg-blue-500/10 rounded overflow-hidden" title="${Number(player.winrate).toFixed(1)}%"><div class="absolute top-0 left-0 h-full bg-blue-500/40" style="width: ${player.winrate}%"></div><span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">${Number(player.winrate).toFixed(1)}%</span></div></td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        } catch (err) {
            console.error('Fehler beim Laden der Statistiken:', err);
            statsBodyEl.innerHTML = '<tr><td colspan="8" class="text-red-400 text-center p-4">Statistiken konnten nicht geladen werden.</td></tr>';
        }
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

    bindingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await apiCall('/api/bindings', {
            name: nameInput.value,
            steamId: steamIdInput.value,
            discordId: discordIdInput.value,
        });
        bindingForm.reset();
        currentEditSteamId = null;
        loadBindings();
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
        await apiCall(
                `/api/${isMuted ? 'unmute' : 'mute'}/${discordId}`);
                loadVoiceList();
                });

            endRoundBtn.addEventListener('click', () => {
                apiCall('/api/unmuteAll').then(loadVoiceList);
            });

            searchInput.addEventListener('input', loadBindings);

            // --- Initialisierung ---
            async function initialize() {
                try {
                    const res = await fetch('/api/status');
                    const data = await res.json();
                    statusEl.textContent = `🟢 Verbunden als: ${data.tag}`;
                } catch {
                    statusEl.textContent = '🔴 Keine Verbindung zum Bot';
                }
                loadBindings();
                loadVoiceList();
                loadStats();
                setInterval(loadVoiceList, 10000);
                setInterval(loadStats, 10000);
                lucide.createIcons();
            }

            initialize();
        }
    )
        ;
