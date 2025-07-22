document.addEventListener("DOMContentLoaded",()=>{function r(t){return document.querySelector(t)}let E=r("#status"),m=r("#bindingsList"),c=r("#voiceList"),v=r("#all-stats-btn"),g=r("#session-stats-btn"),p=r("#statsBody"),M=r("#search"),b=r("#bindingForm"),f=b?.querySelector('[name="name"]'),h=b?.querySelector('[name="steamId"]'),L=b?.querySelector('[name="discordId"]'),C=r("#end-round-button"),k=r("#modal-confirm"),H=r("#modal-cancel"),w=r("#modal-overlay"),I=w?.querySelector("p"),u="all",y=(t,e={})=>fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),D=(t)=>`
        <div class="flex items-center bg-slate-800 px-4 py-3 rounded-xl shadow-md hover:bg-slate-700 transition-all group gap-4" data-steam-id="${t.steamId}">
            <img src="${t.avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full ring-2 ring-white/10 group-hover:ring-blue-400/30 flex-shrink-0" />
                <div class="flex flex-col flex-1 min-w-0">
                    <span class="font-bold text-white text-base truncate">${t.name}</span>
                    <div class="flex gap-4 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                        <span>
                            <span class="text-slate-500">Steam:</span>
                            <a href="https://steamcommunity.com/profiles/${t.steamId}" target="_blank" class="text-blue-400 underline hover:text-blue-300 break-all">${t.steamId}</a>
                        </span>
                        <span>
                            <span class="text-slate-500">Discord:</span>
                            <a href="https://discordlookup.com/user/${t.discordId}" target="_blank" class="text-blue-400 underline hover:text-blue-300 break-all">${t.discordId}</a>
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
    `,j=(t)=>`
        <div class="flex items-center justify-between ${t.muted?"bg-red-800":"bg-green-800"} p-3 rounded-xl shadow-md" data-discord-id="${t.discordId}">
            <div class="flex items-center gap-3">
                <img src="${t.avatarUrl}" class="w-10 h-10 rounded-full ring-2 ring-white/20" alt="Avatar von ${t.name}" />
                <span>${t.name}</span>
            </div>
            <button data-action="toggle-mute" class="text-white hover:text-white/80" title="${t.muted?"Entmuten":"Muten"}">
                <i data-lucide="${t.muted?"mic":"mic-off"}" class="w-5 h-5"></i>
            </button>
        </div>
    `;async function $(){if(!m||!M)return;let t='<p class="text-red-400">Bindings konnten nicht geladen werden.</p>';try{let e=await fetch("/api/bindings");if(!e.ok){console.error("Fehler beim Laden der Bindings:",e.statusText),m.innerHTML=t;return}let s=await e.json(),a=M.value.toLowerCase();if(a)s=s.filter((i)=>i.name.toLowerCase().includes(a)||i.steamId.includes(a)||i.discordId.includes(a));s.sort((i,o)=>i.name.localeCompare(o.name)),m.innerHTML=s.map(D).join(""),lucide.createIcons()}catch(e){console.error(e),m.innerHTML=t}}async function B(){if(!c)return;let t=`
                <div class="bg-slate-800 rounded-xl p-4 text-center flex items-center justify-center gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                    <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                </div>
            `;try{let e=await fetch("/api/voice");if(!e.ok){console.error("Fehler beim Laden der Voice-Liste:",e.statusText),c.innerHTML=t;return}let s=await e.json();if(!s.length)c.innerHTML=`
                    <div class="bg-slate-800 rounded-xl p-4 text-center flex items-center justify-center gap-2">
                        <i data-lucide="mic-off" class="w-5 h-5 opacity-70"></i>
                        <span class="text-white text-base">Noch ist niemand im Discord.</span>
                    </div>
                `;else c.innerHTML=s.map(j).join("")}catch(e){console.error(e),c.innerHTML=t}lucide.createIcons()}async function x(){if(!p)return;let t=`
                <tr>
                    <td colspan="12" class="text-red-400 p-4 ">
                        <div class="text-center flex items-center justify-center gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 opacity-80"></i>
                            <span class="text-red-400 text-base">Voice-Liste konnte nicht geladen werden.</span>
                        </div>
                    </td>
                </tr>
            `;try{let s=await fetch(u==="all"?"/api/stats":"/api/stats/session");if(!s.ok){console.error("Fehler beim Laden der Statistiken:",s.statusText),p.innerHTML=t;return}let a=await s.json();if(!a.length){p.innerHTML=`
                    <tr>
                        <td colspan="12" class="text-center p-4">
                            Noch keine Statistiken vorhanden.
                        </td>
                    </tr>`;return}a.sort((n,l)=>l.winrate-n.winrate||l.kdRatio-n.kdRatio);let o=Object.fromEntries(["kills","deaths","damage","wins","losses","traitorRounds"].map((n)=>[n,Math.max(...a.map((l)=>l[n]),1)])),T=["bg-yellow-500/10","bg-slate-500/10","bg-orange-700/10"];p.innerHTML=a.map((n,l)=>{let F=T[l]||"hover:bg-slate-700/50",A=n.kills+n.teamKills,q=n.damage+n.teamDamage;return`
                    <tr class="border-t border-slate-700 transition-colors duration-200 ${F}">
                        <td class="p-3 font-bold text-center text-lg">${l+1}</td>
                        <td class="p-3 font-medium max-w-[160px] truncate" title="${n.name||"Unbekannter Spieler"}">${n.name||"Unbekannter Spieler"}</td>
                        <td class="p-3">${d(n.kills,o.kills,"green")}</td>
                        <td class="p-3">${d(n.teamKills,A,"red")}</td>
                        <td class="p-3">${d(n.deaths,o.deaths,"red")}</td>
                        <td class="p-3 text-center font-bold font-mono">${Number(n.kdRatio).toFixed(2)}</td>
                        <td class="p-3">${d(n.wins,o.wins,"green")}</td>
                        <td class="p-3">${d(n.losses,o.losses,"red")}</td>
                        <td class="p-3">${d(n.damage,o.damage,"green",0)}</td>
                        <td class="p-3">${d(n.teamDamage,q,"red",0)}</td>
                        <td class="p-3">${d(n.traitorRounds,o.traitorRounds,"sky",1)}</td>
                        <td class="p-3">${d(n.winrate,100,"blue",1,"%")}</td>
                    </tr>
                `}).join(""),setTimeout(()=>{requestAnimationFrame(()=>{document.querySelectorAll(".stat-bar").forEach((n)=>{n.style.width=n.dataset.targetWidth+"%"})})},30)}catch(e){console.error("Fehler beim Laden der Statistiken:",e),p.innerHTML=t}lucide.createIcons()}function R(t,e){return e>0?t/e*100:0}function d(t,e,s,a=0,i=""){let o={green:["bg-green-500/10","bg-green-500/40"],red:["bg-red-500/10","bg-red-500/40"],blue:["bg-blue-500/10","bg-blue-500/40"],sky:["bg-sky-500/10","bg-sky-500/40"]},[T,n]=o[s]||o.green;return`
            <div class="relative w-full h-6 ${T} rounded overflow-hidden">
                <div class="stat-bar absolute top-0 left-0 h-full ${n} transition-all duration-700" data-target-width="${R(t,e)}" style="width:0"></div>
                <span class="absolute top-0 left-2 h-full flex items-center z-10 font-mono">
                    ${Number(t).toFixed(a)}${i}
                </span>
            </div>
        `}function P(t="Soll der Eintrag wirklich gelöscht werden?"){return new Promise((e)=>{if(!w||!I||!k||!H)return e(!1);I.textContent=t,w.classList.remove("hidden");let s=()=>{i(),e(!0)},a=()=>{i(),e(!1)},i=()=>{w.classList.add("hidden"),k.removeEventListener("click",s),H.removeEventListener("click",a)};k.addEventListener("click",s),H.addEventListener("click",a)})}v?.addEventListener("click",()=>{if(u==="all")return;u="all",S(v,g),x()}),g?.addEventListener("click",()=>{if(u==="session")return;u="session",S(g,v),x()});function S(t,e){t.classList.add("bg-blue-600","font-bold","shadow"),t.classList.remove("bg-slate-800"),e?.classList.remove("bg-blue-600","font-bold","shadow"),e?.classList.add("bg-slate-800")}b?.addEventListener("submit",async(t)=>{if(t.preventDefault(),!f||!h||!L)return;await y("/api/bindings",{name:f.value,steamId:h.value,discordId:L.value}),b.reset(),$()}),m?.addEventListener("click",async(t)=>{let s=t.target.closest("button");if(!s)return;let a=s.closest("[data-steam-id]");if(!a)return;let i=a.dataset.steamId,o=s.dataset.action;if(!i)return;if(o==="delete"){if(await P())await fetch("/api/bindings/"+i,{method:"DELETE"}),a.remove()}else if(o==="edit"){let n=await(await fetch("/api/bindings/"+i)).json();if(f&&h&&L)f.value=n.name,h.value=n.steamId,L.value=n.discordId,f.focus()}}),c?.addEventListener("click",async(t)=>{let s=t.target.closest('button[data-action="toggle-mute"]');if(!s)return;let a=s.closest("[data-discord-id]");if(!a)return;let i=a.dataset.discordId,o=a.classList.contains("bg-red-800");await y(`/api/${o?"unmute":"mute"}/${i}`)}),C?.addEventListener("click",()=>{y("/api/unmuteAll")}),M?.addEventListener("input",$);function U(){let t=new WebSocket(`ws://${window.location.host}`);t.addEventListener("open",()=>console.log("WebSocket verbunden")),t.addEventListener("message",async(e)=>{try{let s=JSON.parse(e.data);if(s.type==="statsUpdate")x();else if(s.type==="voiceUpdate")B()}catch(s){}})}async function V(){let e=new URLSearchParams(window.location.search).get("stats");if(g&&e==="session")u="session",S(g,v);if(U(),E)try{let a=await(await fetch("/api/status")).json();E.textContent=`\uD83D\uDFE2 Verbunden als: ${a.tag}`}catch{E.textContent="\uD83D\uDD34 Keine Verbindung zum Bot"}$(),B(),x(),lucide.createIcons()}V()});
