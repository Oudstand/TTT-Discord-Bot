import {Binding, BindingWithAvatar, MappedStat, Stat, StatsType, VoiceUser} from "../../types";

document.addEventListener('DOMContentLoaded', () => {
    // --- Element-Caching ---
    function $<T extends HTMLElement>(selector: string): T | null {
        return document.querySelector<T>(selector);
    }

    const statusEl = $<HTMLSpanElement>('#status');
    const bindingsListEl = $<HTMLDivElement>('#bindingsList');
    const voiceListEl = $<HTMLDivElement>('#voiceList');
    const allStatsBtn = $<HTMLButtonElement>('#all-stats-btn');
    const sessionStatsBtn = $<HTMLButtonElement>('#session-stats-btn');
    const statsBodyEl = $<HTMLTableSectionElement>('#statsBody');
    const searchInput = $<HTMLInputElement>('#search');
    const bindingForm = $<HTMLFormElement>('#bindingForm');
    const nameInput = bindingForm?.querySelector<HTMLInputElement>('[name="name"]');
    const steamIdInput = bindingForm?.querySelector<HTMLInputElement>('[name="steamId"]');
    const discordIdInput = bindingForm?.querySelector<HTMLInputElement>('[name="discordId"]');
    const endRoundBtn = $<HTMLButtonElement>('#end-round-button');
    const confirmBtn = $<HTMLButtonElement>('#modal-confirm');
    const cancelBtn = $<HTMLButtonElement>('#modal-cancel');
    const overlay = $<HTMLDivElement>('#modal-overlay');
    const overlayText = overlay?.querySelector('p');

    let statsType: StatsType = 'all';

    // --- API Helper ---
    const apiCall = (endpoint: string, body: object = {}) => fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });

    // --- HTML Factories ---
    const createBindingRowHTML = (binding: BindingWithAvatar): string => `
        <div class="flex items-center bg-slate-800 px-4 py-3 rounded-xl shadow-md hover:bg-slate-700 transition-all group gap-4" data-steam-id="${binding.steamId}">
            <img src="${binding.avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full ring-2 ring-white/10 group-hover:ring-blue-400/30 flex-shrink-0" />
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

    const createVoiceUserHTML = (user: VoiceUser): string => `
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
    async function loadBindings(): Promise<void> {
        if (!bindingsListEl || !searchInput) return;
        const errorHtml: string = `<p class="text-red-400">Bindings konnten nicht geladen werden.</p>`;
        try {
            const res: Response = await fetch('/api/bindings');
            if (!res.ok) {
                console.error('Fehler beim Laden der Bindings:', res.statusText);
                bindingsListEl.innerHTML = errorHtml;
                return;
            }

            let bindings: BindingWithAvatar[] = await res.json();
            const searchTerm: string = searchInput.value.toLowerCase();

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
            bindingsListEl.innerHTML = errorHtml;
        }
    }

    async function loadVoiceList(): Promise<void> {
        if (!voiceListEl) return;
        const errorHtml: string = `
                <div class="bg-slate-800 rounded-xl p-4 text-center flex items-center justify-center gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                    <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                </div>
            `;
        try {
            const res: Response = await fetch('/api/voice');
            if (!res.ok) {
                console.error('Fehler beim Laden der Voice-Liste:', res.statusText);
                voiceListEl.innerHTML = errorHtml;
                return;
            }

            const voiceUsers: VoiceUser[] = await res.json();
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
            voiceListEl.innerHTML = errorHtml;
        }

        lucide.createIcons();
    }

    async function loadStats(): Promise<void> {
        if (!statsBodyEl) return;
        const errorHtml: string = `
                <tr>
                    <td colspan="12" class="text-red-400 p-4 ">
                        <div class="text-center flex items-center justify-center gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                            <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                        </div>
                    </td>
                </tr>
            `;
        try {
            const endpoint: string = statsType === 'all' ? '/api/stats' : '/api/stats/session';
            const res: Response = await fetch(endpoint);
            if (!res.ok) {
                console.error('Fehler beim Laden der Statistiken:', res.statusText);
                statsBodyEl.innerHTML = errorHtml;
                return;
            }

            const stats: MappedStat[] = await res.json();
            if (!stats.length) {
                statsBodyEl.innerHTML = `
                    <tr>
                        <td colspan="12" class="text-center p-4">
                            Noch keine Statistiken vorhanden.
                        </td>
                    </tr>`;
                return;
            }

            stats.sort((a: MappedStat, b: MappedStat): number => (b.winrate - a.winrate) || (b.kdRatio - a.kdRatio));

            const keys: (keyof Stat)[] = ['kills', 'deaths', 'damage', 'wins', 'losses', 'traitorRounds'];
            const maxValues: { [key in keyof Stat]?: number } = Object.fromEntries(
                keys.map(key => [key, Math.max(...stats.map(p => p[key] as number), 1)])
            );

            const rankClasses: string[] = ['bg-yellow-500/10', 'bg-slate-500/10', 'bg-orange-700/10'];

            statsBodyEl.innerHTML = stats.map((player, idx) => {
                const rankClass: string = rankClasses[idx] || 'hover:bg-slate-700/50';
                const totalKills: number = player.kills + player.teamKills;
                const totalDamage: number = player.damage + player.teamDamage;

                return `
                    <tr class="border-t border-slate-700 transition-colors duration-200 ${rankClass}">
                        <td class="p-3 font-bold text-center text-lg">${idx + 1}</td>
                        <td class="p-3 font-medium max-w-[160px] truncate" title="${player.name || 'Unbekannter Spieler'}">${player.name || 'Unbekannter Spieler'}</td>
                        <td class="p-3">${bar(player.kills, maxValues.kills!, 'green')}</td>
                        <td class="p-3">${bar(player.teamKills, totalKills, 'red')}</td>
                        <td class="p-3">${bar(player.deaths, maxValues.deaths!, 'red')}</td>
                        <td class="p-3 text-center font-bold font-mono">${Number(player.kdRatio).toFixed(2)}</td>
                        <td class="p-3">${bar(player.wins, maxValues.wins!, 'green')}</td>
                        <td class="p-3">${bar(player.losses, maxValues.losses!, 'red')}</td>
                        <td class="p-3">${bar(player.damage, maxValues.damage!, 'green', 0)}</td>
                        <td class="p-3">${bar(player.teamDamage, totalDamage, 'red', 0)}</td>
                        <td class="p-3">${bar(player.traitorRounds, maxValues.traitorRounds!, 'sky', 1)}</td>
                        <td class="p-3">${bar(player.winrate, 100, 'blue', 1, '%')}</td>
                    </tr>
                `;
            }).join('');

            setTimeout(() => {
                requestAnimationFrame(() => {
                    document.querySelectorAll<HTMLDivElement>('.stat-bar').forEach(bar => {
                        bar.style.width = bar.dataset.targetWidth + '%';
                    });
                });
            }, 30);
        } catch (err) {
            console.error('Fehler beim Laden der Statistiken:', err);
            statsBodyEl.innerHTML = errorHtml;
        }

        lucide.createIcons();
    }

    function percent(value: number, max: number): number {
        return max > 0 ? (value / max) * 100 : 0;
    }

    type BarColor = 'green' | 'red' | 'blue' | 'sky';

    function bar(value: number, max: number, color: BarColor, digits = 0, suffix = ''): string {
        const colors: Record<BarColor, [string, string]> = {
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

    function showConfirmDialog(text = "Soll der Eintrag wirklich gelöscht werden?"): Promise<boolean> {
        return new Promise(resolve => {
            if (!overlay || !overlayText || !confirmBtn || !cancelBtn) return resolve(false);

            overlayText.textContent = text;
            overlay.classList.remove('hidden');

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };
            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                overlay.classList.add('hidden');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    }


    // --- Event Handlers ---
    allStatsBtn?.addEventListener('click', () => {
        if (statsType === 'all') return;
        statsType = 'all';
        toggleActiveSessionButton(allStatsBtn, sessionStatsBtn);
        void loadStats();
    });

    sessionStatsBtn?.addEventListener('click', () => {
        if (statsType === 'session') return;
        statsType = 'session';
        toggleActiveSessionButton(sessionStatsBtn, allStatsBtn);
        void loadStats();
    });

    function toggleActiveSessionButton(activeButton: HTMLButtonElement, inactiveButton: HTMLButtonElement | null): void {
        activeButton.classList.add('bg-blue-600', 'font-bold', 'shadow');
        activeButton.classList.remove('bg-slate-800');

        inactiveButton?.classList.remove('bg-blue-600', 'font-bold', 'shadow');
        inactiveButton?.classList.add('bg-slate-800');
    }

    bindingForm?.addEventListener('submit', async (e: SubmitEvent) => {
        e.preventDefault();
        if (!nameInput || !steamIdInput || !discordIdInput) return;

        await apiCall('/api/bindings', {
            name: nameInput.value,
            steamId: steamIdInput.value,
            discordId: discordIdInput.value,
        });
        bindingForm.reset();
        void loadBindings();
    });

    bindingsListEl?.addEventListener('click', async (e: MouseEvent) => {
        const target: HTMLElement = e.target as HTMLElement;
        const button: HTMLButtonElement | null = target.closest('button');
        if (!button) return;

        const row: HTMLDivElement | null = button.closest<HTMLDivElement>('[data-steam-id]');
        if (!row) return;

        const steamId: string | undefined = row.dataset.steamId;
        const action: string | undefined = button.dataset.action;

        if (!steamId) return;

        if (action === 'delete') {
            if (await showConfirmDialog()) {
                await fetch('/api/bindings/' + steamId, {method: 'DELETE'});
                row.remove();
            }
        } else if (action === 'edit') {
            const res: Response = await fetch('/api/bindings/' + steamId);
            const data: Binding = await res.json();
            if (nameInput && steamIdInput && discordIdInput) {
                nameInput.value = data.name;
                steamIdInput.value = data.steamId;
                discordIdInput.value = data.discordId;
                nameInput.focus();
            }
        }
    });

    voiceListEl?.addEventListener('click', async (e: MouseEvent): Promise<void> => {
        const target: HTMLElement = e.target as HTMLElement;
        const button = target.closest('button[data-action="toggle-mute"]');
        if (!button) return;

        const row: HTMLDivElement | null = button.closest<HTMLDivElement>('[data-discord-id]');
        if (!row) return;

        const discordId: string | undefined = row.dataset.discordId;
        const isMuted: boolean = row.classList.contains('bg-red-800');
        await apiCall(`/api/${isMuted ? 'unmute' : 'mute'}/${discordId}`);
    });

    endRoundBtn?.addEventListener('click', () => {
        void apiCall('/api/unmuteAll');
    });

    searchInput?.addEventListener('input', loadBindings);

    function createWebSocket(): void {
        const ws = new WebSocket(`ws://${window.location.host}`);
        ws.addEventListener('open', () => console.log('WebSocket verbunden'));
        ws.addEventListener('message', async (event: MessageEvent<StatsType>) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'statsUpdate') {
                    void loadStats();
                } else if (msg.type === 'voiceUpdate') {
                    void loadVoiceList();
                }
            } catch (err) {
            }
        });
    }

    // --- Initialisierung ---
    async function initialize(): Promise<void> {
        const urlParams = new URLSearchParams(window.location.search);
        const statsTypeParam = urlParams.get('stats');
        if (sessionStatsBtn && statsTypeParam === 'session') {
            statsType = 'session';
            toggleActiveSessionButton(sessionStatsBtn, allStatsBtn);
        }

        createWebSocket();

        if (statusEl) {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                statusEl.textContent = `🟢 Verbunden als: ${data.tag}`;
            } catch {
                statusEl.textContent = '🔴 Keine Verbindung zum Bot';
            }
        }

        void loadBindings();
        void loadVoiceList();
        void loadStats();
        lucide.createIcons();
    }

    void initialize();
});
