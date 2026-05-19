const APP_VERSION = "4.43";

const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. RESTORE MOTIVATIONAL FOOTER ---
    const footerNote = document.querySelector('.footer-note');
    if (footerNote) {
        footerNote.innerHTML = `Target: 81% (0.81) | You can do it!!! | v${APP_VERSION}`;
    }

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

    // --- 3. UI TOGGLE & CALC LOGIC ---
    let isCAMode = false;
    const btnARA = document.getElementById('btnARA');
    const btnCA = document.getElementById('btnCA');
    const araWrapper = document.getElementById('araInputsWrapper');
    const caWrapper = document.getElementById('caInputsWrapper');
    const cheatsheet = document.getElementById('cheatsheetContainer');

    btnARA.onclick = () => {
        isCAMode = false;
        btnARA.classList.add('active');
        btnCA.classList.remove('active');
        araWrapper.style.display = 'block';
        caWrapper.style.display = 'none';
        cheatsheet.style.display = actionSelect.value === 'GOAL' ? 'none' : 'block';
    };

    btnCA.onclick = () => {
        isCAMode = true;
        btnCA.classList.add('active');
        btnARA.classList.remove('active');
        araWrapper.style.display = 'none';
        caWrapper.style.display = 'block';
        cheatsheet.style.display = 'none';
    };

    const actionSelect = document.getElementById('actionSelect');
    actionSelect.onchange = () => {
        const isGoal = actionSelect.value === 'GOAL';
        document.getElementById('goalInputsWrapper').style.display = isGoal ? 'block' : 'none';
        document.getElementById('progressInputsWrapper').style.display = isGoal ? 'none' : 'block';
        if(!isCAMode) cheatsheet.style.display = isGoal ? 'none' : 'block';
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
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr);
        if (error) return;

        const araStats = {};
        const caStats = {};
        const logs = [];

        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];

            if (log.agent_name.includes('CA_LOG')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                caStats[name].hours += parseFloat(parts[2]);
                caStats[name].tags += parseInt(parts[3]);
                caStats[name].mbbt += parseInt(parts[4]);
                
                logs.push({ agent: name, wo: 'CA Data', tag: `H:${parts[2]} T:${parts[3]} M:${parts[4]}`, min: '-', time: log.created_at });
            } else {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0 };
                if(log.agent_name.includes('GOAL')) araStats[name].g += log.target_minutes;
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

        const list = document.getElementById('agentList');
        list.innerHTML = '';
        
        const allAgents = [...new Set([...Object.keys(araStats), ...Object.keys(caStats)])].sort();

        allAgents.forEach(agent => {
            const li = document.createElement('li');
            li.className = 'agent-item';
            
            let innerHTML = `<strong style="font-size: 16px; display:block; margin-bottom:10px; color:var(--accent);">${agent}</strong>`;

            // ARA Dashboard Bars
            if (araStats[agent]) {
                const { g, p } = araStats[agent];
                const per = g > 0 ? Math.round((p/g)*100) : 0;
                innerHTML += `
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
            }

            // CA Dashboard Bars
            if (caStats[agent]) {
                const { hours, tags, mbbt } = caStats[agent];
                const tagsTarget = Math.round(hours * 1.5);
                const tagsPer = tagsTarget > 0 ? Math.round((tags / tagsTarget) * 100) : 0;
                const mbbtPer = Math.round((mbbt / 1) * 100);

                innerHTML += `
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
                            <span style="font-size: 13px; font-weight: bold;">${mbbt} / 1</span>
                        </div>
                        <div style="background:#444; height:6px; border-radius:3px; overflow:hidden;">
                            <div style="background:var(--accent); width:${Math.min(mbbtPer, 100)}%; height:100%; transition: width 0.4s ease;"></div>
                        </div>
                    </div>
                `;
            }

            li.innerHTML = innerHTML;
            list.appendChild(li);
        });

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
        if (!document.getElementById('agentSelect').value || !document.getElementById('robotCheck').checked) return alert("Missing info!");
        
        let dbName = "";
        let mins = 0;

        if (isCAMode) {
            const hours = parseFloat(document.getElementById('caHoursInput').value);
            const tags = parseInt(document.getElementById('caTagsInput').value);
            const mbbt = parseInt(document.getElementById('caMbbtInput').value);

            if(isNaN(hours) || isNaN(tags) || isNaN(mbbt)) return alert("Please fill all CA fields with numbers!");
            
            dbName = `${document.getElementById('agentSelect').value}|CA_LOG|${hours}|${tags}|${mbbt}`;
        } else {
            dbName = `${document.getElementById('agentSelect').value}|${actionSelect.value}`;
            if (actionSelect.value === 'GOAL') {
                mins = Math.round((parseFloat(document.getElementById('hoursInput').value) * 60) * 0.81);
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
            
            if (isCAMode) {
                showToast("CA Stats Logged Successfully!");
            } else {
                showToast(actionSelect.value === 'GOAL' ? "Target Hours Set!" : "Minutes Logged Successfully!");
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

    document.getElementById('adminOverrideBtn').onclick = async () => {
        const agent = document.getElementById('adminAgentSelect').value;
        const action = document.getElementById('adminActionSelect').value;
        const mins = parseInt(document.getElementById('adminValueInput').value);
        
        if(isNaN(mins)) return alert("Please enter valid minutes.");

        const currentWeekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const dbName = `${agent}|${action}|ADMIN_OVERRIDE`;
        
        const { error } = await _supabase.from('utilization_logs').insert([{ 
            agent_name: dbName, 
            target_minutes: mins, 
            week_of: currentWeekStr
        }]);
        
        if(!error) { 
            showToast("Force Update Successful!"); 
            document.getElementById('adminValueInput').value = '';
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
