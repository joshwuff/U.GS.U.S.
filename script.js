const APP_VERSION = "4.34";

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

    // --- 2. DATE & CALENDAR LOGIC (SUNDAY START) ---
    function getStartOfWeek(d) {
        const date = new Date(d);
        const day = date.getDay(); // 0 is Sunday, 1 is Monday...
        const diff = date.getDate() - day; // Shifts to Sunday
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
        // 1. Keep the standard string for database querying
        const weekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        // 2. Build the pretty display string with "th", "st", "nd", "rd"
        const dayName = selectedWeek.toLocaleDateString('en-US', { weekday: 'long' });
        const monthName = selectedWeek.toLocaleDateString('en-US', { month: 'long' });
        const d = selectedWeek.getDate();
        const year = selectedWeek.getFullYear();
        
        // Quick math to figure out the right suffix
        const ordinal = (d > 3 && d < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][d % 10];
        
        // 3. Apply the pretty string to the UI
        document.getElementById('weekLabel').textContent = `${dayName}, ${monthName} ${d}${ordinal}, ${year}`;
        
        const isCurrent = weekStr === getStartOfWeek(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('submitBtn').disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";
        
        fetchDashboardData(weekStr);
    }

    async function fetchDashboardData(weekStr) {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr);
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
            
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items: center;">
                    <strong style="font-size: 15px;">${agent}</strong>
                    <span style="color: var(--label); font-weight: bold; font-size: 14px;">${p} / ${g}m (${per}%)</span>
                </div>
                <div style="background:#444; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%; transition: width 0.4s ease;"></div>
                </div>
            `;
            list.appendChild(li);
        });

        const audit = document.getElementById('auditLogBody');
        audit.innerHTML = '';
        logs.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(l => {
            const dateObj = new Date(l.time);
            const timeFormatted = dateObj.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'}) + " " + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${timeFormatted}</td></tr>`;
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

        const currentWeekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: currentWeekStr }]);
        if (!error) { updateWeekUI(); document.getElementById('robotCheck').checked = false; }
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
        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: currentWeekStr }]);
        
        if(!error) { 
            alert("Force Update Successful!"); 
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
