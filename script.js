const APP_VERSION = "28";

// Initialize Supabase
const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE LOGIC ---
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.innerHTML = '🌙';
    document.body.appendChild(toggleBtn);

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // This cookie tells the Cloudflare Bouncer which theme to show on the login page
        document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Strict`;
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- 2. ELEMENT SELECTORS ---
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) versionDisplay.textContent = APP_VERSION;

    const submitBtn = document.getElementById('submitBtn');
    const agentSelect = document.getElementById('agentSelect');
    const actionSelect = document.getElementById('actionSelect');
    const robotCheck = document.getElementById('robotCheck');
    const resultOutput = document.getElementById('resultOutput');
    const lockWarning = document.getElementById('lockWarning');
    const agentListElement = document.getElementById('agentList');
    const goalInputsWrapper = document.getElementById('goalInputsWrapper');
    const progressInputsWrapper = document.getElementById('progressInputsWrapper');
    const cheatsheetContainer = document.getElementById('cheatsheetContainer');
    const hoursInput = document.getElementById('hoursInput');
    const woInput = document.getElementById('woInput');
    const serviceSelects = document.querySelectorAll('.service-select');
    
    // Week Controls
    const weekLabel = document.getElementById('weekLabel');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const currentWeekBtn = document.getElementById('currentWeekBtn');

    // Admin Elements
    const secretLogo = document.getElementById('secretLogo');
    const passwordModal = document.getElementById('passwordModal');
    const secretCodeInput = document.getElementById('secretCodeInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authCancelBtn = document.getElementById('authCancelBtn');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');

    // --- 3. DATE & WEEK LOGIC ---
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0,0,0,0);
        return monday;
    }

    function formatDateString(dateObj) {
        return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const actualCurrentMonday = getMonday(new Date());
    const actualCurrentWeekString = formatDateString(actualCurrentMonday);
    let selectedMonday = new Date(actualCurrentMonday);
    let selectedWeekString = actualCurrentWeekString;

    function updateWeekUI() {
        selectedWeekString = formatDateString(selectedMonday);
        if (weekLabel) weekLabel.textContent = selectedWeekString;

        const isCurrentWeek = selectedWeekString === actualCurrentWeekString;
        
        // Lock inputs if looking at the past/future
        submitBtn.disabled = !isCurrentWeek;
        hoursInput.disabled = !isCurrentWeek;
        woInput.disabled = !isCurrentWeek;
        serviceSelects.forEach(s => s.disabled = !isCurrentWeek);
        robotCheck.disabled = !isCurrentWeek;
        lockWarning.style.display = isCurrentWeek ? "none" : "block";

        fetchDashboardData();
    }

    prevWeekBtn?.addEventListener('click', () => { selectedMonday.setDate(selectedMonday.getDate() - 7); updateWeekUI(); });
    nextWeekBtn?.addEventListener('click', () => { selectedMonday.setDate(selectedMonday.getDate() + 7); updateWeekUI(); });
    currentWeekBtn?.addEventListener('click', () => { selectedMonday = new Date(actualCurrentMonday); updateWeekUI(); });

    // --- 4. CALCULATION & DROPDOWN LOGIC ---
    function updateDropdownOptions() {
        const selectedTags = Array.from(serviceSelects)
            .map(s => s.options[s.selectedIndex].text)
            .filter(t => !t.includes('--'));

        serviceSelects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value === "0") return;
                option.disabled = selectedTags.includes(option.text) && select.options[select.selectedIndex].text !== option.text;
                option.style.opacity = option.disabled ? "0.3" : "1";
            });
        });
    }

    serviceSelects.forEach(s => s.addEventListener('change', updateDropdownOptions));

    // --- 5. MAIN APP TOGGLE ---
    actionSelect?.addEventListener('change', () => {
        const isGoal = actionSelect.value === 'GOAL';
        goalInputsWrapper.style.display = isGoal ? 'block' : 'none';
        progressInputsWrapper.style.display = isGoal ? 'none' : 'block';
        cheatsheetContainer.style.display = isGoal ? 'none' : 'block';
    });

    // --- 6. DATABASE SYNC ---
    async function fetchDashboardData() {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', selectedWeekString);
        if (error) {
            agentListElement.innerHTML = '<li>Error loading data.</li>';
            return;
        }

        const stats = {};
        data.forEach(log => {
            const name = log.agent_name.split('|')[0];
            const type = log.agent_name.includes('|PROGRESS') ? 'progress' : 'goal';
            if (!stats[name]) stats[name] = { goal: 0, progress: 0 };
            stats[name][type] += log.target_minutes;
        });

        renderDashboard(stats);
    }

    function renderDashboard(stats) {
        agentListElement.innerHTML = '';
        Object.keys(stats).sort().forEach(agent => {
            const { goal, progress } = stats[agent];
            const percent = goal > 0 ? Math.round((progress / goal) * 100) : 0;
            const li = document.createElement('li');
            li.className = 'agent-item';
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>${agent}</strong>
                    <span>${progress} / ${goal}m (${percent}%)</span>
                </div>
                <div style="background:#444; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:#f57c00; width:${Math.min(percent, 100)}%; height:100%;"></div>
                </div>
            `;
            agentListElement.appendChild(li);
        });
    }

    async function submitData() {
        if (!agentSelect.value || !robotCheck.checked) {
            resultOutput.textContent = "Select Agent & Check Robot box.";
            return;
        }

        let mins = 0;
        let dbName = `${agentSelect.value}|${actionSelect.value}`;

        if (actionSelect.value === 'GOAL') {
            mins = Math.round((parseFloat(hoursInput.value) * 60) * 0.81);
        } else {
            if (woInput.value.length !== 4) return alert("Need last 4 of WO");
            serviceSelects.forEach(s => mins += parseInt(s.value));
            dbName += `|WO:${woInput.value}`;
        }

        submitBtn.disabled = true;
        const { error } = await _supabase.from('utilization_logs').insert([
            { agent_name: dbName, target_minutes: mins, week_of: actualCurrentWeekString }
        ]);

        if (!error) {
            resultOutput.textContent = "Success!";
            fetchDashboardData();
            // Reset form
            hoursInput.value = ''; woInput.value = ''; robotCheck.checked = false;
        }
        submitBtn.disabled = false;
    }

    submitBtn?.addEventListener('click', submitData);

    // --- 7. ADMIN EASTER EGG ---
    let clicks = 0;
    secretLogo?.addEventListener('click', () => {
        clicks++;
        if (clicks >= 5) {
            passwordModal.style.display = 'flex';
            clicks = 0;
        }
    });

    authSubmitBtn?.addEventListener('click', async () => {
        const { data } = await _supabase.from('precinct_secrets').select('*').eq('key_value', secretCodeInput.value);
        if (data?.length > 0) {
            passwordModal.style.display = 'none';
            adminPanel.style.display = 'block';
        } else {
            alert("Denied.");
        }
    });

    authCancelBtn?.addEventListener('click', () => passwordModal.style.display = 'none');
    closeAdminBtn?.addEventListener('click', () => adminPanel.style.display = 'none');

    // Startup
    updateWeekUI();
});
