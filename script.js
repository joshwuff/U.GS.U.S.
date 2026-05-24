const APP_VERSION = "5.15";

const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    let currentPrecinctStats = { ara: {}, ca: {} };
    window.precinctLogs = []; 

    // --- 0. DYNAMIC MOTIVATIONAL FOOTER ---
    function updateFooter(isCA) {
        const footerNote = document.querySelector('.footer-note');
        if (footerNote) {
            footerNote.innerHTML = isCA ? `Target: 1.5 Tags/hr & 1 MBBT/day | You can do it!!! | v${APP_VERSION}` : `Target: 81% (0.81) | You can do it!!! | v${APP_VERSION}`;
        }
    }
    updateFooter(false);

    // --- 1. THEME ENGINE ---
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.innerHTML = '🌙';
    document.body.appendChild(toggleBtn);
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    };
    applyTheme(localStorage.getItem('theme') || 'dark');
    toggleBtn.onclick = () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
    };

    // --- 2. ADMIN LOGIC (5-Click Easter Egg) ---
    let logoClicks = 0;
    let logoTimer;
    document.getElementById('secretLogo').onclick = () => {
        logoClicks++;
        clearTimeout(logoTimer);
        logoTimer = setTimeout(() => logoClicks = 0, 2000); 
        if (logoClicks >= 5) {
            document.getElementById('passwordModal').style.display = 'flex';
            logoClicks = 0; 
        }
    };
    
    // --- 3. HELPER FUNCTIONS ---
    function renderDashboard(araStats, caStats, isCAMode) {
        const list = document.getElementById('agentList');
        list.innerHTML = '';
        if (!isCAMode) {
            Object.keys(araStats).filter(a => araStats[a].g > 0 || araStats[a].p > 0).sort().forEach(agent => {
                const { g, p } = araStats[agent];
                const per = g > 0 ? Math.round((p/g)*100) : 0;
                list.innerHTML += `<li class="agent-item"><strong style="color:var(--accent);">${agent}</strong><div style="display:flex; justify-content:space-between; margin:4px 0;"><span style="font-size: 13px;">ARA Utilization</span><span style="font-weight: bold;">${p} / ${g}m (${per}%)</span></div><div style="background:#444; height:6px; border-radius:3px;"><div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%;"></div></div></li>`;
            });
        } else {
            Object.keys(caStats).filter(a => caStats[a].hours > 0 || caStats[a].tags > 0 || caStats[a].mbbt > 0).sort().forEach(agent => {
                const { hours, tags, mbbt } = caStats[agent];
                const tagsTarget = Math.round(hours * 1.5);
                const mbbtTarget = Math.max(1, Math.floor(hours / 8));
                list.innerHTML += `<li class="agent-item"><strong style="color:var(--accent);">${agent}</strong><div style="margin:4px 0;"><div style="display:flex; justify-content:space-between;"><span style="font-size: 13px;">CA Tags</span><span>${tags} / ${tagsTarget}</span></div><div style="background:#444; height:6px; border-radius:3px;"><div style="background:var(--accent); width:${Math.min(Math.round((tags/tagsTarget)*100), 100)}%; height:100%;"></div></div></div></li>`;
            });
        }
    }

    function renderAuditLog() {
        const audit = document.getElementById('auditLogBody');
        const filterVal = document.getElementById('adminAuditFilter').value;
        audit.innerHTML = '';
        window.precinctLogs.filter(l => filterVal === 'ALL' || l.type === filterVal).sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(l => {
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${new Date(l.time).toLocaleTimeString()}</td></tr>`;
        });
    }

    // --- 4. DATA SYNC ---
    async function fetchDashboardData(weekStr) {
        const { data } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr).order('created_at', { ascending: true });
        const araStats = {}, caStats = {}, logs = [];
        data?.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];
            if (log.agent_name.includes('CA_OVERRIDE')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name] = { hours: parseFloat(parts[2]), tags: parseInt(parts[3]), mbbt: parseInt(parts[4]) };
                logs.push({ agent: name, wo: 'CA Override', tag: `H:${parts[2]} T:${parts[3]} M:${parts[4]}`, time: log.created_at, type: 'OVERRIDE' });
            } else if (log.agent_name.includes('CA_GOAL')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].hours = parseFloat(parts[2]);
                logs.push({ agent: name, wo: 'CA Goal', tag: `Hours: ${parts[2]}`, time: log.created_at, type: 'GOAL' });
            } else if (log.agent_name.includes('CA_PROGRESS')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].tags += parseInt(parts[2]); caStats[name].mbbt += parseInt(parts[3]);
                logs.push({ agent: name, wo: 'CA Progress', tag: `Tags: ${parts[2]}`, time: log.created_at, type: 'PROGRESS' });
            } else {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                if(log.agent_name.includes('GOAL')) { araStats[name].g = log.target_minutes; logs.push({ agent: name, wo: 'ARA Goal', tag: `Target: ${log.target_minutes}m`, time: log.created_at, type: 'GOAL' }); }
                if(log.agent_name.includes('PROGRESS')) { araStats[name].p += log.target_minutes; logs.push({ agent: name, wo: parts[2], tag: parts[3], time: log.created_at, type: 'PROGRESS' }); }
            }
        });
        currentPrecinctStats = { ara: araStats, ca: caStats };
        window.precinctLogs = logs;
        renderDashboard(araStats, caStats, document.getElementById('btnCA').classList.contains('active'));
        renderAuditLog();
    }

    // --- (Keep your remaining UI, Submit, and Admin logic here) ---
    // Make sure your populateDropdown, admin event listeners, and submitBtn logic follow here.
    
    updateWeekUI();
});
