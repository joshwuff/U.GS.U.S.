const APP_VERSION = "5.13";

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
        document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Strict`;
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
    });

    // --- TOAST NOTIFICATION LOGIC ---
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    // --- GLOBAL QOL CONTROLS ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            e.preventDefault(); 
            window.location.href = '/logout'; 
        }
    });

    const secretCodeInput = document.getElementById('secretCodeInput');
    if (secretCodeInput) {
        secretCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('authSubmitBtn').click();
            }
        });
    }

    // --- 2. DATE & CALENDAR LOGIC (SUNDAY START) ---
    function getStartOfWeek(d) {
        const date = new Date(d);
        const day = date.getDay(); 
        const diff = date.getDate() - day; 
        const start = new Date(date.setDate(diff));
        start.setHours(0,0,0,0);
        return start;
    }

    let selectedWeek = getStartOfWeek(new Date());
    let currentCalViewDate = new Date(selectedWeek);

    document.getElementById('prevWeekBtn').onclick = () => { selectedWeek.setDate(selectedWeek.getDate() - 7); updateWeekUI(); };
    document.getElementById('nextWeekBtn').onclick = () => { selectedWeek.setDate(selectedWeek.getDate() + 7); updateWeekUI(); };
    document.getElementById('currentWeekBtn').onclick = () => { selectedWeek = getStartOfWeek(new Date()); updateWeekUI(); };

    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        grid.className = 'calendar-body'; 
        const year = currentCalViewDate.getFullYear();
        const month = currentCalViewDate.getMonth();
        document.getElementById('calMonthYear').textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let currentDay = 1;
        let currentWeekRow = document.createElement('div');
        currentWeekRow.className = 'calendar-row';

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            currentWeekRow.appendChild(empty);
        }

        while (currentDay <= daysInMonth) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = currentDay;
            currentWeekRow.appendChild(div);

            if (currentWeekRow.children.length === 7 || currentDay === daysInMonth) {
                while (currentWeekRow.children.length < 7) {
                    const empty = document.createElement('div');
                    empty.className = 'calendar-day empty';
                    currentWeekRow.appendChild(empty);
                }
                const refDate = new Date(year, month, currentDay - 1); 
                currentWeekRow.onclick = () => { selectedWeek = getStartOfWeek(refDate); updateWeekUI(); document.getElementById('calendarModal').style.display = 'none'; };
                grid.appendChild(currentWeekRow);
                currentWeekRow = document.createElement('div');
                currentWeekRow.className = 'calendar-row';
            }
            currentDay++;
        }
    }

    document.getElementById('calendarBtn').onclick = () => { currentCalViewDate = new Date(selectedWeek); renderCalendar(); document.getElementById('calendarModal').style.display = 'flex'; };
    document.getElementById('calPrevMonth').onclick = () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() - 1); renderCalendar(); };
    document.getElementById('calNextMonth').onclick = () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() + 1); renderCalendar(); };
    document.getElementById('calCancelBtn').onclick = () => document.getElementById('calendarModal').style.display = 'none';

    // --- 2.5 LIVE UPDATING CLOCK ---
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
        const liveClockDisplay = document.createElement('div');
        liveClockDisplay.style.cssText = 'font-size: 13px; color: var(--label); margin-top: 12px; font-weight: bold; letter-spacing: 0.5px;';
        dashboardHeader.appendChild(liveClockDisplay);
        function tickClock() {
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            liveClockDisplay.textContent = `${dateString} | ${timeString}`;
        }
        setInterval(tickClock, 1000);
        tickClock(); 
    }

    // --- 3. UI TOGGLE & DATA SYNC ---
    let isCAMode = false;
    const btnARA = document.getElementById('btnARA');
    const btnCA = document.getElementById('btnCA');
    const araWrapper = document.getElementById('araInputsWrapper');
    const caWrapper = document.getElementById('caInputsWrapper');
    const cheatsheet = document.getElementById('cheatsheetContainer');
    const agentSelect = document.getElementById('agentSelect');
    const adminAgentSelect = document.getElementById('adminAgentSelect');
    
    const araTeam = ["Alejandro", "Alvan", "Arturo", "Diana", "G", "James", "Josh", "Justin", "Kurt", "Marrion", "Rob"];
    const caTeam = ["Adrian", "Aidan", "Alejandro", "Anna", "Arturo", "Cole", "Georgie", "Juwan", "Paolo"];

    function populateDropdown() {
        agentSelect.innerHTML = '<option value="" disabled selected>-- Choose Agent --</option>';
        const team = isCAMode ? caTeam : araTeam;
        team.forEach(agent => {
            const opt = document.createElement('option');
            opt.value = agent;
            opt.textContent = agent;
            agentSelect.appendChild(opt);
        });
    }

    function populateAdminDropdown(action) {
        adminAgentSelect.innerHTML = '<option value="" disabled selected>-- Choose Agent --</option>';
        let team = [];
        if (action === 'ARA_OVERRIDE') team = araTeam;
        else if (action === 'CA_OVERRIDE') team = caTeam;
        else team = [...new Set([...araTeam, ...caTeam])].sort();

        team.forEach(agent => {
            const opt = document.createElement('option');
            opt.value = agent;
            opt.textContent = agent;
            adminAgentSelect.appendChild(opt);
        });
    }

    btnARA.onclick = () => { isCAMode = false; btnARA.classList.add('active'); btnCA.classList.remove('active'); araWrapper.style.display = 'block'; caWrapper.style.display = 'none'; cheatsheet.style.display = document.getElementById('actionSelect').value === 'GOAL' ? 'none' : 'block'; populateDropdown(); updateFooter(false); updateWeekUI(); };
    btnCA.onclick = () => { isCAMode = true; btnCA.classList.add('active'); btnARA.classList.remove('active'); araWrapper.style.display = 'none'; caWrapper.style.display = 'block'; cheatsheet.style.display = 'none'; populateDropdown(); updateFooter(true); updateWeekUI(); };
    
    populateDropdown();
    populateAdminDropdown('ARA_OVERRIDE');

    const actionSelect = document.getElementById('actionSelect');
    actionSelect.onchange = () => {
        const isGoal = actionSelect.value === 'GOAL';
        document.getElementById('goalInputsWrapper').style.display = isGoal ? 'block' : 'none';
        document.getElementById('progressInputsWrapper').style.display = isGoal ? 'none' : 'block';
        if(!isCAMode) cheatsheet.style.display = isGoal ? 'none' : 'block';
    };

    const caActionSelect = document.getElementById('caActionSelect');
    caActionSelect.onchange = () => {
        const isGoal = caActionSelect.value === 'CA_GOAL';
        document.getElementById('caGoalInputsWrapper').style.display = isGoal ? 'block' : 'none';
        document.getElementById('caProgressInputsWrapper').style.display = isGoal ? 'none' : 'block';
    };

    const serviceSelects = document.querySelectorAll('.service-select');
    serviceSelects.forEach(s => s.onchange = () => {
        let total = 0;
        serviceSelects.forEach(s => total += parseInt(s.value));
        document.getElementById('calculatedTotalDisplay').textContent = `Calculated Minutes: ${total}`;
    });

    // --- 4. DASHBOARD RENDERER ---
    async function updateWeekUI() {
        const weekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('weekLabel').textContent = "Week of " + weekStr;
        const isCurrent = weekStr === getStartOfWeek(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('submitBtn').disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";
        fetchDashboardData(weekStr);
    }

    async function fetchDashboardData(weekStr) {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr).order('created_at', { ascending: true });
        if (error) return;

        const araStats = {}, caStats = {}, logs = [];

        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];

            if (log.agent_name.includes('CA_OVERRIDE')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                const h = parts[2], t = parts[3], m = parts[4];
                if (h !== "") caStats[name].hours = parseFloat(h);
                if (t !== "") caStats[name].tags = parseInt(t);
                if (m !== "") caStats[name].mbbt = parseInt(m);
                logs.push({ agent: name, wo: 'CA Override', tag: `H:${h||'-'} T:${t||'-'} M:${m||'-'}`, min: '-', time: log.created_at, type: 'OVERRIDE' });
            } else if (log.agent_name.includes('ARA_OVERRIDE')) {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                const t = parts[2], p = parts[3];
                if (t !== "") araStats[name].g = parseFloat(t);
                if (p !== "") araStats[name].p = parseFloat(p);
                logs.push({ agent: name, wo: 'ARA Override', tag: `T:${t||'-'} P:${p||'-'}`, min: '-', time: log.created_at, type: 'OVERRIDE' });
            } else if (log.agent_name.includes('CA_GOAL')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].hours = parseFloat(parts[2]);
                logs.push({ agent: name, wo: 'CA Goal', tag: `Hours: ${parts[2]}`, min: '-', time: log.created_at, type: 'GOAL' });
            } else if (log.agent_name.includes('CA_PROGRESS')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].tags += parseInt(parts[2]);
                caStats[name].mbbt += parseInt(parts[3]);
                logs.push({ agent: name, wo: 'CA Progress', tag: `Tags: ${parts[2]} | MBBT: ${parts[3]}`, min: '-', time: log.created_at, type: 'PROGRESS' });
            } else {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                if(log.agent_name.includes('GOAL')) { araStats[name].g = log.target_minutes; logs.push({ agent: name, wo: 'ARA Goal', tag: `Target: ${log.target_minutes}m`, min: '-', time: log.created_at, type: 'GOAL' }); }
                if(log.agent_name.includes('PROGRESS')) { araStats[name].p += log.target_minutes; logs.push({ agent: name, wo: parts[2] || '??', tag: parts[3] || '??', min: log.target_minutes, time: log.created_at, type: 'PROGRESS' }); }
            }
        });

        currentPrecinctStats = { ara: araStats, ca: caStats };
        window.precinctLogs = logs;
        renderDashboard(araStats, caStats);
        renderAuditLog();
    }

    function renderDashboard(araStats, caStats) {
        const list = document.getElementById('agentList');
        list.innerHTML = '';
        if (!isCAMode) {
            const araAgents = Object.keys(araStats).filter(a => araStats[a].g > 0 || araStats[a].p > 0).sort();
            araAgents.forEach(agent => {
                const { g, p } = araStats[agent];
                const per = g > 0 ? Math.round((p/g)*100) : 0;
                const li = document.createElement('li'); li.className = 'agent-item';
                li.innerHTML = `<strong style="font-size: 16px; display:block; margin-bottom:10px; color:var(--accent);">${agent}</strong>
                    <div style="margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size: 13px;">ARA Utilization</span><span style="font-size: 13px; font-weight: bold;">${p} / ${g}m (${per}%)</span></div>
                        <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;"><div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%;"></div></div>
                    </div>`;
                list.appendChild(li);
            });
        } else {
            const caAgents = Object.keys(caStats).filter(a => caStats[a].hours > 0 || caStats[a].tags > 0 || caStats[a].mbbt > 0).sort();
            caAgents.forEach(agent => {
                const { hours, tags, mbbt } = caStats[agent];
                const tagsTarget = Math.round(hours * 1.5);
                const tagsPer = tagsTarget > 0 ? Math.round((tags / tagsTarget) * 100) : 0;
                let mbbtTarget = Math.floor(hours / 8); if (hours > 0 && mbbtTarget === 0) mbbtTarget = 1; 
                const mbbtPer = mbbtTarget > 0 ? Math.round((mbbt / mbbtTarget) * 100) : 0;
                const li = document.createElement('li'); li.className = 'agent-item';
                li.innerHTML = `<strong style="font-size: 16px; display:block; margin-bottom:10px; color:var(--accent);">${agent}</strong>
                    <div style="margin-bottom: 10px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size: 13px;">CA Tags (1.50/hr)</span><span style="font-size: 13px; font-weight: bold;">${tags} / ${tagsTarget}</span></div>
                        <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;"><div style="background:var(--accent); width:${Math.min(tagsPer, 100)}%; height:100%;"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size: 13px;">MBBT Memberships</span><span style="font-size: 13px; font-weight: bold;">${mbbt} / ${mbbtTarget}</span></div>
                        <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;"><div style="background:var(--accent); width:${Math.min(mbbtPer, 100)}%; height:100%;"></div></div>
                    </div>`;
                list.appendChild(li);
            });
        }
    }

    function renderAuditLog() {
        const audit = document.getElementById('auditLogBody');
        const filterVal = document.getElementById('adminAuditFilter').value;
        audit.innerHTML = '';
        window.precinctLogs.filter(l => filterVal === 'ALL' || l.type === filterVal).sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0)).forEach(l => {
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${new Date(l.time).toLocaleTimeString()}</td></tr>`;
        });
    }

    // --- 5. SUBMIT & ADMIN LOGIC ---
    document.getElementById('submitBtn').onclick = async () => {
        const agent = agentSelect.value;
        if (!agent || !document.getElementById('robotCheck').checked) return alert("Missing info!");
        
        let dbName = "";
        let mins = 0;

        if (isCAMode) {
            if (caActionSelect.value === 'CA_GOAL') {
                const h = parseFloat(document.getElementById('caHoursInput').value);
                if(isNaN(h)) return alert("Invalid hours.");
                if (currentPrecinctStats?.ca[agent]?.hours > 0 && !confirm(`Override target from ${currentPrecinctStats.ca[agent].hours} to ${h} hours?`)) return;
                dbName = `${agent}|CA_GOAL|${h}`;
            } else {
                const t = parseInt(document.getElementById('caTagsInput').value || 0);
                const m = parseInt(document.getElementById('caMbbtInput').value || 0);
                if (t === 0 && m === 0) return alert("Please enter tags or memberships.");
                dbName = `${agent}|CA_PROGRESS|${t}|${m}`;
            }
        } else {
            dbName = `${agent}|${actionSelect.value}`;
            if (actionSelect.value === 'GOAL') {
                const h = parseFloat(document.getElementById('hoursInput').value);
                if(isNaN(h)) return alert("Invalid hours.");
                const oldMins = currentPrecinctStats?.ara[agent]?.g || 0;
                const oldH = oldMins > 0 ? (oldMins / 0.81 / 60) : 0;
                if (oldH > 0 && !confirm(`Override target from ${oldH.toFixed(2)} to ${h} hours?`)) return;
                mins = Math.round((h * 60) * 0.81);
                dbName = `${agent}|GOAL`;
            } else {
                serviceSelects.forEach(s => mins += parseInt(s.value));
                dbName += `|WO:${document.getElementById('woInput').value}|`;
            }
        }

        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }]);
        if (!error) { updateWeekUI(); document.getElementById('robotCheck').checked = false; showToast("Submitted!"); }
    };

    // ... [Admin and Logo click logic remains same] ...
});
