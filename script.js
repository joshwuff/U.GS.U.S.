const APP_VERSION = "5.11";

const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    // Global variable to hold current stats for override checks
    let currentPrecinctStats = { ara: {}, ca: {} };

    // --- 0. DYNAMIC MOTIVATIONAL FOOTER ---
    function updateFooter(isCA) {
        const footerNote = document.querySelector('.footer-note');
        if (footerNote) {
            if (isCA) {
                footerNote.innerHTML = `Target: 1.5 Tags/hr & 1 MBBT/day | You can do it!!! | v${APP_VERSION}`;
            } else {
                footerNote.innerHTML = `Target: 81% (0.81) | You can do it!!! | v${APP_VERSION}`;
            }
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
                
                currentWeekRow.onclick = () => {
                    selectedWeek = getStartOfWeek(refDate);
                    updateWeekUI();
                    document.getElementById('calendarModal').style.display = 'none';
                };
                
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

    // --- 2.5 LIVE UPDATING CLOCK INJECTION ---
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

    // --- 3. UI TOGGLE, DYNAMIC DROPDOWNS & CALC LOGIC ---
    let isCAMode = false;
    const btnARA = document.getElementById('btnARA');
    const btnCA = document.getElementById('btnCA');
    const araWrapper = document.getElementById('araInputsWrapper');
    const caWrapper = document.getElementById('caInputsWrapper');
    const cheatsheet = document.getElementById('cheatsheetContainer');
    const agentSelect = document.getElementById('agentSelect');
    const adminAgentSelect = document.getElementById('adminAgentSelect');
    
    // Team Arrays
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
        
        if (action === 'ARA_OVERRIDE') {
            team = araTeam;
        } else if (action === 'CA_OVERRIDE') {
            team = caTeam;
        } else if (action === 'REMOVE_AGENT') {
            team = [...new Set([...araTeam, ...caTeam])].sort();
        }

        team.forEach(agent => {
            const opt = document.createElement('option');
            opt.value = agent;
            opt.textContent = agent;
            adminAgentSelect.appendChild(opt);
        });
    }

    btnARA.onclick = () => {
        isCAMode = false;
        btnARA.classList.add('active');
        btnCA.classList.remove('active');
        araWrapper.style.display = 'block';
        caWrapper.style.display = 'none';
        cheatsheet.style.display = document.getElementById('actionSelect').value === 'GOAL' ? 'none' : 'block';
        populateDropdown();
        updateFooter(false);
        updateWeekUI(); 
    };

    btnCA.onclick = () => {
        isCAMode = true;
        btnCA.classList.add('active');
        btnARA.classList.remove('active');
        araWrapper.style.display = 'none';
        caWrapper.style.display = 'block';
        cheatsheet.style.display = 'none';
        populateDropdown();
        updateFooter(true);
        updateWeekUI(); 
    };
    
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
    const caGoalInputsWrapper = document.getElementById('caGoalInputsWrapper');
    const caProgressInputsWrapper = document.getElementById('caProgressInputsWrapper');
    caActionSelect.onchange = () => {
        const isGoal = caActionSelect.value === 'CA_GOAL';
        caGoalInputsWrapper.style.display = isGoal ? 'block' : 'none';
        caProgressInputsWrapper.style.display = isGoal ? 'none' : 'block';
    };

    const serviceSelects = document.querySelectorAll('.service-select');
    function updateCalc() {
        let total = 0;
        const tags = [];
        serviceSelects.forEach(s => {
            total += parseInt(s.value);
            const tag = s.options[s.selectedIndex].dataset.tag;
            if (tag !== "NONE") tags.push(tag);
            Array.from(s.options).forEach(opt => {
                if(opt.dataset.tag !== "NONE") {
                    opt.disabled = tags.includes(opt.dataset.tag) && s.options[s.selectedIndex].dataset.tag !== opt.dataset.tag;
                }
            });
        });
        document.getElementById('calculatedTotalDisplay').textContent = `Calculated Minutes: ${total}`;
    }
    serviceSelects.forEach(s => s.onchange = updateCalc);

    // --- 4. DATA SYNC & DASHBOARD ---
    async function updateWeekUI() {
        const weekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        document.getElementById('weekLabel').textContent = "Week of " + weekStr;
        
        const isCurrent = weekStr === getStartOfWeek(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('submitBtn').disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";
        
        fetchDashboardData(weekStr);
    }

    async function fetchDashboardData(weekStr) {
        // Enforcing Chronological Order so the LATEST goal submitted replaces the old one
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr).order('created_at', { ascending: true });
        if (error) return;

        const araStats = {};
        const caStats = {};
        const logs = [];

        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];

            if (log.agent_name.includes('CA_OVERRIDE')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                const h = parts[2], t = parts[3], m = parts[4];
                if (h !== "") caStats[name].hours = parseFloat(h);
                if (t !== "") caStats[name].tags = parseInt(t);
                if (m !== "") caStats[name].mbbt = parseInt(m);
                logs.push({ agent: name, wo: 'CA Override', tag: `H:${h||'-'} T:${t||'-'} M:${m||'-'}`, min: '-', time: log.created_at });
                
            } else if (log.agent_name.includes('ARA_OVERRIDE')) {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                const t = parts[2], p = parts[3];
                if (t !== "") araStats[name].g = parseFloat(t); // Overwrites
                if (p !== "") araStats[name].p = parseFloat(p); // Overwrites
                logs.push({ agent: name, wo: 'ARA Override', tag: `T:${t||'-'} P:${p||'-'}`, min: '-', time: log.created_at });

            } else if (log.agent_name.includes('CA_GOAL')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].hours = parseFloat(parts[2]); // Overwrites instead of adding
                logs.push({ agent: name, wo: 'CA Goal', tag: `Hours: ${parts[2]}`, min: '-', time: log.created_at });
            
            } else if (log.agent_name.includes('CA_PROGRESS')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                const t = parseInt(parts[2]);
                const m = parseInt(parts[3]);
                
                if (!isNaN(t)) caStats[name].tags += t;
                if (!isNaN(m)) caStats[name].mbbt += m;

                let tagStr = [];
                if (!isNaN(t) && t > 0) tagStr.push(`Tags: ${t}`);
                if (!isNaN(m) && m > 0) tagStr.push(`MBBT: ${m}`);
                if (tagStr.length === 0) tagStr.push("Tags: 0 | MBBT: 0"); 
                
                logs.push({ agent: name, wo: 'CA Progress', tag: tagStr.join(' | '), min: '-', time: log.created_at });
                
            } else if (log.agent_name.includes('CA_LOG')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].hours += parseFloat(parts[2]);
                caStats[name].tags += parseInt(parts[3]);
                caStats[name].mbbt += parseInt(parts[4]);
                logs.push({ agent: name, wo: 'CA Data (Legacy)', tag: `H:${parts[2]} T:${parts[3]} M:${parts[4]}`, min: '-', time: log.created_at });
            } else {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                if(log.agent_name.includes('GOAL')) araStats[name].g = log.target_minutes; // Overwrites instead of adding
                if(log.agent_name.includes('PROGRESS')) {
                    araStats[name].p += log.target_minutes;
                    logs.push({ agent: name, wo: parts[2] || '??', tag: parts[3] || '??', min: log.target_minutes, time: log.created_at });
                }
                
                if(log.agent_name.includes('ADMIN_OVERRIDE')) {
                    const action = parts[1];
                    if (action === 'GOAL') araStats[name].g = log.target_minutes;
                    if (action === 'PROGRESS') araStats[name].p = log.target_minutes;
                }
            }
        });

        // Store stats globally to check before Overwrites
        currentPrecinctStats = { ara: araStats, ca: caStats };

        const list = document.getElementById('agentList');
        list.innerHTML = '';
        
        if (!isCAMode) {
            const araAgents = Object.keys(araStats).filter(a => araStats[a].g > 0 || araStats[a].p > 0).sort();
            
            if (araAgents.length === 0) {
                list.innerHTML = '<li class="agent-item" style="text-align:center; color:var(--label);">No active ARA data for this week.</li>';
            } else {
                araAgents.forEach(agent => {
                    const { g, p } = araStats[agent];
                    const per = g > 0 ? Math.round((p/g)*100) : 0;
                    const li = document.createElement('li');
                    li.className = 'agent-item';
                    li.innerHTML = `
                        <strong style="font-size: 16px; display:block; margin-bottom:10px; color:var(--accent);">${agent}</strong>
                        <div style="margin-bottom: 12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items: center;">
                                <span style="font-size: 13px; color: var(--label);">ARA Utilization</span>
                                <span style="font-size: 13px; font-weight: bold;">${p} / ${g}m (${per}%)</span>
                            </div>
                            <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;">
                                <div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%; transition: width 0.4s ease;"></div>
                            </div>
                        </div>
                    `;
                    list.appendChild(li);
                });
            }
        } else {
            const caAgents = Object.keys(caStats).filter(a => caStats[a].hours > 0 || caStats[a].tags > 0 || caStats[a].mbbt > 0).sort();
            
            if (caAgents.length === 0) {
                list.innerHTML = '<li class="agent-item" style="text-align:center; color:var(--label);">No active CA data for this week.</li>';
            } else {
                caAgents.forEach(agent => {
                    const { hours, tags, mbbt } = caStats[agent];
                    
                    const tagsTarget = Math.round(hours * 1.5);
                    const tagsPer = tagsTarget > 0 ? Math.round((tags / tagsTarget) * 100) : 0;
                    
                    let mbbtTarget = Math.floor(hours / 8);
                    if (hours > 0 && mbbtTarget === 0) mbbtTarget = 1; 
                    const mbbtPer = mbbtTarget > 0 ? Math.round((mbbt / mbbtTarget) * 100) : 0;

                    const li = document.createElement('li');
                    li.className = 'agent-item';
                    li.innerHTML = `
                        <strong style="font-size: 16px; display:block; margin-bottom:10px; color:var(--accent);">${agent}</strong>
                        <div style="margin-bottom: 10px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items: center;">
                                <span style="font-size: 13px; color: var(--label);">CA Tags (1.50/hr)</span>
                                <span style="font-size: 13px; font-weight: bold;">${tags} / ${tagsTarget}</span>
                            </div>
                            <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;">
                                <div style="background:var(--accent); width:${Math.min(tagsPer, 100)}%; height:100%; transition: width 0.4s ease;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items: center;">
                                <span style="font-size: 13px; color: var(--label);">MBBT Memberships</span>
                                <span style="font-size: 13px; font-weight: bold;">${mbbt} / ${mbbtTarget}</span>
                            </div>
                            <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;">
                                <div style="background:var(--accent); width:${Math.min(mbbtPer, 100)}%; height:100%; transition: width 0.4s ease;"></div>
                            </div>
                        </div>
                    `;
                    list.appendChild(li);
                });
            }
        }

        const audit = document.getElementById('auditLogBody');
        audit.innerHTML = '';
        logs.sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0)).forEach(l => {
            let timeFormatted = "--";
            if (l.time) {
                const dateObj = new Date(l.time);
                if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 2020) {
                    timeFormatted = dateObj.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'}) + " " + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
                }
            }
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${timeFormatted}</td></tr>`;
        });
    }

    document.getElementById('submitBtn').onclick = async () => {
        const agent = document.getElementById('agentSelect').value;
        if (!agent || !document.getElementById('robotCheck').checked) return alert("Missing info!");
        
        let dbName = "";
        let mins = 0;

        if (isCAMode) {
            if (caActionSelect.value === 'CA_GOAL') {
                const newHours = parseFloat(document.getElementById('caHoursInput').value);
                if(isNaN(newHours)) return alert("Please enter valid hours.");
                
                // Smart Verification Pop-up
                const oldHours = currentPrecinctStats?.ca[agent]?.hours || 0;
                if (oldHours > 0 && oldHours !== newHours) {
                    if (!confirm(`Are you sure you want to override your target from ${oldHours} hours to ${newHours} hours?`)) return;
                }
                
                dbName = `${agent}|CA_GOAL|${newHours}`;
            } else {
                const tagsStr = document.getElementById('caTagsInput').value.trim();
                const mbbtStr = document.getElementById('caMbbtInput').value.trim();
                
                if (tagsStr === "" && mbbtStr === "") return alert("Please enter a value for either Tags or Memberships.");
                
                const tags = tagsStr !== "" ? parseInt(tagsStr) : 0;
                const mbbt = mbbtStr !== "" ? parseInt(mbbtStr) : 0;
                
                if ((tagsStr !== "" && isNaN(tags)) || (mbbtStr !== "" && isNaN(mbbt))) {
                    return alert("Please ensure the fields you entered contain valid numbers.");
                }

                dbName = `${agent}|CA_PROGRESS|${tags}|${mbbt}`;
            }
        } else {
            if (actionSelect.value === 'GOAL') {
                const newHoursInput = parseFloat(document.getElementById('hoursInput').value);
                if(isNaN(newHoursInput)) return alert("Please enter valid hours.");
                
                // Smart Verification Pop-up
                const oldMins = currentPrecinctStats?.ara[agent]?.g || 0;
                const oldHours = oldMins > 0 ? parseFloat((oldMins / 0.81 / 60).toFixed(2)) : 0;
                if (oldHours > 0 && oldHours !== newHoursInput) {
                    if (!confirm(`Are you sure you want to override your target from ${oldHours} hours to ${newHoursInput} hours?`)) return;
                }

                mins = Math.round((newHoursInput * 60) * 0.81);
                dbName = `${agent}|GOAL`;
            } else {
                const tags = [];
                serviceSelects.forEach(s => { 
                    mins += parseInt(s.value); 
                    const tag = s.options[s.selectedIndex].dataset.tag;
                    if(tag !== "NONE") tags.push(tag);
                });
                dbName += `|WO:${document.getElementById('woInput').value}|${tags.join('+')}`;
            }
        }

        const currentWeekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const { error } = await _supabase.from('utilization_logs').insert([{ 
            agent_name: dbName, 
            target_minutes: mins, 
            week_of: currentWeekStr
        }]);
        
        if (!error) { 
            updateWeekUI(); 
            document.getElementById('robotCheck').checked = false;
            
            if (isCAMode && caActionSelect.value === 'CA_PROGRESS') {
                document.getElementById('caTagsInput').value = '';
                document.getElementById('caMbbtInput').value = '';
            }

            if (isCAMode) {
                showToast(caActionSelect.value === 'CA_GOAL' ? "CA Hours Logged!" : "CA Stats Logged!");
            } else {
                showToast(actionSelect.value === 'GOAL' ? "Target Hours Set!" : "Minutes Logged!");
            }
        }
    };

    // --- 5. ADMIN LOGIC (5-Click Easter Egg) ---
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
    
    document.getElementById('authSubmitBtn').onclick = async () => {
        const { data } = await _supabase.from('precinct_secrets').select('*').eq('key_value', document.getElementById('secretCodeInput').value);
        if(data?.length) { 
            document.getElementById('passwordModal').style.display='none'; 
            document.getElementById('adminPanel').style.display='block'; 
            document.getElementById('secretCodeInput').value = ''; 
        } else {
            alert("Access Denied.");
        }
    };
    document.getElementById('authCancelBtn').onclick = () => {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('secretCodeInput').value = '';
    };
    
    document.getElementById('closeAdminBtn').onclick = () => document.getElementById('adminPanel').style.display = 'none';

    const adminActionSelect = document.getElementById('adminActionSelect');
    const adminAraInputs = document.getElementById('adminAraInputs');
    const adminCaInputs = document.getElementById('adminCaInputs');
    const adminOverrideBtn = document.getElementById('adminOverrideBtn');

    adminActionSelect.onchange = (e) => {
        const val = e.target.value;
        adminAraInputs.style.display = val === 'ARA_OVERRIDE' ? 'flex' : 'none';
        adminCaInputs.style.display = val === 'CA_OVERRIDE' ? 'flex' : 'none';
        
        if (val === 'REMOVE_AGENT') {
            adminOverrideBtn.textContent = 'Remove Agent Data';
            adminOverrideBtn.style.background = '#d32f2f'; 
        } else {
            adminOverrideBtn.textContent = 'Force Update';
            adminOverrideBtn.style.background = 'var(--accent)';
        }

        populateAdminDropdown(val);
    };

    document.getElementById('adminOverrideBtn').onclick = async () => {
        const agent = document.getElementById('adminAgentSelect').value;
        if (!agent) return alert("Please select an agent first.");

        const action = adminActionSelect.value;
        const currentWeekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        if (action === 'REMOVE_AGENT') {
            if(!confirm(`WARNING: Are you sure you want to permanently delete ALL data for ${agent} for the week of ${currentWeekStr}?`)) return;
            
            const { error } = await _supabase.from('utilization_logs')
                .delete()
                .eq('week_of', currentWeekStr)
                .like('agent_name', `${agent}|%`); 
                
            if(!error) { 
                showToast(`${agent} removed from week!`); 
                updateWeekUI(); 
            }
            return; 
        }

        let dbName = "";
        let mins = 0;

        if (action === 'CA_OVERRIDE') {
            const hoursStr = document.getElementById('adminCaHours').value.trim();
            const tagsStr = document.getElementById('adminCaTags').value.trim();
            const mbbtStr = document.getElementById('adminCaMbbt').value.trim();
            
            if(hoursStr === "" && tagsStr === "" && mbbtStr === "") return alert("Please enter at least one value to update.");
            
            const hours = hoursStr !== "" ? parseFloat(hoursStr) : "";
            const tags = tagsStr !== "" ? parseInt(tagsStr) : "";
            const mbbt = mbbtStr !== "" ? parseInt(mbbtStr) : "";
            
            if((hoursStr !== "" && isNaN(hours)) || (tagsStr !== "" && isNaN(tags)) || (mbbtStr !== "" && isNaN(mbbt))) {
                return alert("Please ensure the fields you entered contain valid numbers.");
            }

            // Smart Verification Pop-up for Admin CA Target
            if (hoursStr !== "") {
                const oldHours = currentPrecinctStats?.ca[agent]?.hours || 0;
                if (oldHours > 0 && oldHours !== hours) {
                    if (!confirm(`Are you sure you want to override the target from ${oldHours} hours to ${hours} hours?`)) return;
                }
            }

            dbName = `${agent}|CA_OVERRIDE|${hours}|${tags}|${mbbt}`;
            
        } else if (action === 'ARA_OVERRIDE') {
            const targetStr = document.getElementById('adminAraTarget').value.trim();
            const progressStr = document.getElementById('adminAraProgress').value.trim();
            
            if(targetStr === "" && progressStr === "") return alert("Please enter at least one value to update.");
            
            const target = targetStr !== "" ? parseInt(targetStr) : "";
            const progress = progressStr !== "" ? parseInt(progressStr) : "";
            
            if((targetStr !== "" && isNaN(target)) || (progressStr !== "" && isNaN(progress))) {
                return alert("Please ensure the fields you entered contain valid numbers.");
            }

            // Smart Verification Pop-up for Admin ARA Target
            if (targetStr !== "") {
                const oldMins = currentPrecinctStats?.ara[agent]?.g || 0;
                if (oldMins > 0 && oldMins !== target) {
                    if (!confirm(`Are you sure you want to override the target from ${oldMins} mins to ${target} mins?`)) return;
                }
            }

            dbName = `${agent}|ARA_OVERRIDE|${target}|${progress}`;
        }
        
        const { error } = await _supabase.from('utilization_logs').insert([{ 
            agent_name: dbName, 
            target_minutes: mins, 
            week_of: currentWeekStr
        }]);
        
        if(!error) { 
            showToast("Force Update Successful!"); 
            document.getElementById('adminAraTarget').value = '';
            document.getElementById('adminAraProgress').value = '';
            document.getElementById('adminCaHours').value = '';
            document.getElementById('adminCaTags').value = '';
            document.getElementById('adminCaMbbt').value = '';
            updateWeekUI(); 
        }
    };

    document.getElementById('resetDataBtn').onclick = async () => {
        const currentWeekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if(!confirm(`CRITICAL WARNING: Are you sure you want to completely wipe all data for the week of ${currentWeekStr}? This cannot be undone.`)) return;
        
        const { error } = await _supabase.from('utilization_logs').delete().eq('week_of', currentWeekStr);
        if(!error) { 
            alert("Week wiped successfully."); 
            updateWeekUI(); 
        }
    };

    // Initialize App
    updateWeekUI();
});
