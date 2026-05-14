const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
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

    // --- 2. DATE & CALENDAR LOGIC ---
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(date.setDate(diff));
        mon.setHours(0,0,0,0);
        return mon;
    }

    let selectedMonday = getMonday(new Date());
    let currentCalViewDate = new Date(selectedMonday);

    // FIX: Dashboard Navigation Buttons
    document.getElementById('prevWeekBtn').onclick = () => { selectedMonday.setDate(selectedMonday.getDate() - 7); updateWeekUI(); };
    document.getElementById('nextWeekBtn').onclick = () => { selectedMonday.setDate(selectedMonday.getDate() + 7); updateWeekUI(); };
    document.getElementById('currentWeekBtn').onclick = () => { selectedMonday = getMonday(new Date()); updateWeekUI(); };

    // FIX: Row-Selecting Calendar Logic
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        grid.className = 'calendar-body'; // Use the new row-based layout

        const year = currentCalViewDate.getFullYear();
        const month = currentCalViewDate.getMonth();
        document.getElementById('calMonthYear').textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let currentDay = 1;
        let currentWeekRow = document.createElement('div');
        currentWeekRow.className = 'calendar-row';

        // Add empty spaces for the first week
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

            // If the row is full (Saturday) OR it's the last day of the month
            if (currentWeekRow.children.length === 7 || currentDay === daysInMonth) {
                
                // Fill any remaining empty slots at the end of the month
                while (currentWeekRow.children.length < 7) {
                    const empty = document.createElement('div');
                    empty.className = 'calendar-day empty';
                    currentWeekRow.appendChild(empty);
                }
                
                // Capture the date for this specific row
                const refDate = new Date(year, month, currentDay - 1); 
                
                // Make the ENTIRE ROW clickable
                currentWeekRow.onclick = () => {
                    selectedMonday = getMonday(refDate);
                    updateWeekUI();
                    document.getElementById('calendarModal').style.display = 'none';
                };
                
                grid.appendChild(currentWeekRow);
                
                // Start a new row
                currentWeekRow = document.createElement('div');
                currentWeekRow.className = 'calendar-row';
            }
            currentDay++;
        }
    }

    document.getElementById('calendarBtn').onclick = () => { currentCalViewDate = new Date(selectedMonday); renderCalendar(); document.getElementById('calendarModal').style.display = 'flex'; };
    document.getElementById('calPrevMonth').onclick = () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() - 1); renderCalendar(); };
    document.getElementById('calNextMonth').onclick = () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() + 1); renderCalendar(); };
    document.getElementById('calCancelBtn').onclick = () => document.getElementById('calendarModal').style.display = 'none';

    // --- 3. UI TOGGLE & CALC LOGIC ---
    const actionSelect = document.getElementById('actionSelect');
    actionSelect.onchange = () => {
        const isGoal = actionSelect.value === 'GOAL';
        document.getElementById('goalInputsWrapper').style.display = isGoal ? 'block' : 'none';
        document.getElementById('progressInputsWrapper').style.display = isGoal ? 'none' : 'block';
        document.getElementById('cheatsheetContainer').style.display = isGoal ? 'none' : 'block';
    };

    const serviceSelects = document.querySelectorAll('.service-select');
    function updateCalc() {
        let total = 0;
        const tags = [];
        serviceSelects.forEach(s => {
            total += parseInt(s.value);
            const tag = s.options[s.selectedIndex].dataset.tag;
            if (tag !== "NONE") tags.push(tag);
            // Disable used tags
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
        const weekStr = selectedMonday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('weekLabel').textContent = weekStr;
        const isCurrent = weekStr === getMonday(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('submitBtn').disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";
        fetchDashboardData(weekStr);
    }

    async function fetchDashboardData(week) {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', week);
        if (error) return;

        const stats = {};
        const logs = [];
        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];
            if(!stats[name]) stats[name] = { g: 0, p: 0 };
            if(log.agent_name.includes('GOAL')) stats[name].g += log.target_minutes;
            if(log.agent_name.includes('PROGRESS')) {
                stats[name].p += log.target_minutes;
                logs.push({ agent: name, wo: parts[2] || '??', tag: parts[3] || '??', min: log.target_minutes, time: log.created_at });
            }
            if(log.agent_name.includes('ADMIN_OVERRIDE')) {
                const action = parts[1];
                if (action === 'GOAL') stats[name].g = log.target_minutes;
                if (action === 'PROGRESS') stats[name].p = log.target_minutes;
            }
        });

        const list = document.getElementById('agentList');
        list.innerHTML = '';
        Object.keys(stats).sort().forEach(agent => {
            const { g, p } = stats[agent];
            const per = g > 0 ? Math.round((p/g)*100) : 0;
            const li = document.createElement('li');
            li.className = 'agent-item';
            li.innerHTML = `<strong>${agent}</strong>: ${p}/${g}m (${per}%) <div style="background:#444; height:8px; border-radius:4px; margin-top:5px;"><div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%;"></div></div>`;
            list.appendChild(li);
        });

        const audit = document.getElementById('auditLogBody');
        audit.innerHTML = '';
        logs.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(l => {
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${new Date(l.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td></tr>`;
        });
    }

    document.getElementById('submitBtn').onclick = async () => {
        if (!document.getElementById('agentSelect').value || !document.getElementById('robotCheck').checked) return alert("Missing info!");
        
        let mins = 0;
        let dbName = `${document.getElementById('agentSelect').value}|${actionSelect.value}`;

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

        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: document.getElementById('weekLabel').textContent }]);
        if (!error) { updateWeekUI(); document.getElementById('robotCheck').checked = false; }
    };

    // --- 5. ADMIN ---
    document.getElementById('secretLogo').onclick = () => document.getElementById('passwordModal').style.display = 'flex';
    
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

        const dbName = `${agent}|${action}|ADMIN_OVERRIDE`;
        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: document.getElementById('weekLabel').textContent }]);
        
        if(!error) { 
            alert("Force Update Successful!"); 
            document.getElementById('adminValueInput').value = '';
            updateWeekUI(); 
        }
    };

    document.getElementById('resetDataBtn').onclick = async () => {
        const week = document.getElementById('weekLabel').textContent;
        if(!confirm(`CRITICAL WARNING: Are you sure you want to completely wipe all data for the week of ${week}? This cannot be undone.`)) return;
        
        const { error } = await _supabase.from('utilization_logs').delete().eq('week_of', week);
        if(!error) { 
            alert("Week wiped successfully."); 
            updateWeekUI(); 
        }
    };

    // Initialize App
    updateWeekUI();
});
