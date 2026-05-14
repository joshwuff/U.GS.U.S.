const APP_VERSION = "29";

const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME LOGIC ---
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

    // --- 2. ELEMENTS ---
    const agentSelect = document.getElementById('agentSelect');
    const actionSelect = document.getElementById('actionSelect');
    const submitBtn = document.getElementById('submitBtn');
    const hoursInput = document.getElementById('hoursInput');
    const woInput = document.getElementById('woInput');
    const robotCheck = document.getElementById('robotCheck');
    const weekLabel = document.getElementById('weekLabel');
    const calendarModal = document.getElementById('calendarModal');
    const calendarGrid = document.getElementById('calendarGrid');
    const calMonthYear = document.getElementById('calMonthYear');

    // --- 3. CALENDAR LOGIC ---
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

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentCalViewDate.getFullYear();
        const month = currentCalViewDate.getMonth();
        calMonthYear.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty spaces for first week
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            calendarGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;
            div.addEventListener('click', () => {
                const clicked = new Date(year, month, day);
                selectedMonday = getMonday(clicked);
                updateWeekUI();
                calendarModal.style.display = 'none';
            });
            calendarGrid.appendChild(div);
        }
    }

    document.getElementById('calendarBtn').addEventListener('click', () => {
        renderCalendar();
        calendarModal.style.display = 'flex';
    });
    document.getElementById('calPrevMonth').addEventListener('click', () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('calNextMonth').addEventListener('click', () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('calCancelBtn').addEventListener('click', () => calendarModal.style.display = 'none');

    // --- 4. WEEK UI & DASHBOARD ---
    function updateWeekUI() {
        const weekStr = selectedMonday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        weekLabel.textContent = weekStr;
        
        const isCurrent = weekStr === getMonday(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        submitBtn.disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";

        fetchDashboardData(weekStr);
    }

    async function fetchDashboardData(week) {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', week);
        if (error) return;

        const stats = {};
        data.forEach(log => {
            const name = log.agent_name.split('|')[0];
            const type = log.agent_name.includes('PROGRESS') ? 'p' : 'g';
            if(!stats[name]) stats[name] = { g: 0, p: 0 };
            stats[name][type] += log.target_minutes;
        });

        const list = document.getElementById('agentList');
        list.innerHTML = '';
        Object.keys(stats).sort().forEach(agent => {
            const { g, p } = stats[agent];
            const per = g > 0 ? Math.round((p/g)*100) : 0;
            const li = document.createElement('li');
            li.className = 'agent-item';
            li.innerHTML = `<strong>${agent}</strong>: ${p}/${g}m (${per}%) <div style="background:#444; height:6px; border-radius:3px; margin-top:5px;"><div style="background:var(--accent); width:${Math.min(per, 100)}%; height:100%;"></div></div>`;
            list.appendChild(li);
        });
    }

    // --- 5. LOGIC & EVENTS ---
    actionSelect.addEventListener('change', () => {
        const isGoal = actionSelect.value === 'GOAL';
        document.getElementById('goalInputsWrapper').style.display = isGoal ? 'block' : 'none';
        document.getElementById('progressInputsWrapper').style.display = isGoal ? 'none' : 'block';
        document.getElementById('cheatsheetContainer').style.display = isGoal ? 'none' : 'block';
    });

    submitBtn.addEventListener('click', async () => {
        if (!agentSelect.value || !robotCheck.checked) return alert("Select agent and check robot box!");
        
        let mins = 0;
        let dbName = `${agentSelect.value}|${actionSelect.value}`;

        if (actionSelect.value === 'GOAL') {
            mins = Math.round((parseFloat(hoursInput.value) * 60) * 0.81);
        } else {
            document.querySelectorAll('.service-select').forEach(s => mins += parseInt(s.value));
            dbName += `|WO:${woInput.value}`;
        }

        submitBtn.textContent = "Syncing...";
        const { error } = await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: weekLabel.textContent }]);
        
        if (!error) {
            alert("Logged!");
            hoursInput.value = ''; woInput.value = ''; robotCheck.checked = false;
            fetchDashboardData(weekLabel.textContent);
        }
        submitBtn.textContent = "Submit Data";
    });

    // Start App
    updateWeekUI();
});
