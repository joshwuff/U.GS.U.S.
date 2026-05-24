const APP_VERSION = "6.1";
const _supabase = supabase.createClient('https://yxeozqztofvpyadxveyr.supabase.co', 'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b');
const incompatibilities = {
    'GSIR': ['GSOSR', 'GSWUR'],
    'GSOSR': ['GSIR', 'GSWUR'],
    'GSDI': ['GSWUR'],
    'GSOI/GSPW': ['GSSW'],
    'GSSW': ['GSOI/GSPW'],
    'GSWUR': ['GSIR', 'GSOSR', 'GSDI']
};

document.addEventListener('DOMContentLoaded', () => {
    let currentPrecinctStats = { ara: {}, ca: {} };
    window.precinctLogs = []; 
    let isCAMode = false;

    function updateFooter(isCA) {
        const footerNote = document.querySelector('.footer-note');
        if (footerNote) footerNote.innerHTML = isCA ? `Target: 1.5 Tags/hr & 1 MBBT/day | v${APP_VERSION}` : `Target: 81% | v${APP_VERSION}`;
    }

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
    toggleBtn.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

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
        const year = currentCalViewDate.getFullYear(), month = currentCalViewDate.getMonth();
        document.getElementById('calMonthYear').textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
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

    const araTeam = ["Alejandro", "Alvan", "Arturo", "Diana", "G", "James", "Josh", "Justin", "Kurt", "Marrion", "Rob"];
    const caTeam = ["Adrian", "Aidan", "Alejandro", "Anna", "Arturo", "Cole", "Georgie", "Juwan", "Paolo"];

    function populateDropdown() {
        agentSelect.innerHTML = '<option value="" disabled selected>-- Choose Agent --</option>';
        (isCAMode ? caTeam : araTeam).forEach(agent => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = agent;
            agentSelect.appendChild(opt);
        });
    }

    btnARA.onclick = () => { isCAMode = false; btnARA.classList.add('active'); btnCA.classList.remove('active'); araWrapper.style.display = 'block'; caWrapper.style.display = 'none'; cheatsheet.style.display = document.getElementById('actionSelect').value === 'GOAL' ? 'none' : 'block'; populateDropdown(); updateFooter(false); updateWeekUI(); };
    btnCA.onclick = () => { isCAMode = true; btnCA.classList.add('active'); btnARA.classList.remove('active'); araWrapper.style.display = 'none'; caWrapper.style.display = 'block'; cheatsheet.style.display = 'none'; populateDropdown(); updateFooter(true); updateWeekUI(); };
    
    populateDropdown();
    const serviceSelects = document.querySelectorAll('.service-select');
    function updateCalc() {
        let total = 0, selectedTags = [];
        serviceSelects.forEach(s => {
            total += parseInt(s.value);
            const tag = s.options[s.selectedIndex].dataset.tag;
            if (tag !== "NONE") selectedTags.push(tag);
        });
        serviceSelects.forEach(dropdown => {
            const currentSelection = dropdown.options[dropdown.selectedIndex].dataset.tag;
            Array.from(dropdown.options).forEach(opt => {
                const targetTag = opt.dataset.tag;
                if (targetTag === "NONE") return;
                let isConflicting = false;
                selectedTags.forEach(activeTag => {
                    if (activeTag !== currentSelection && incompatibilities[activeTag]?.includes(targetTag)) isConflicting = true;
                });
                opt.disabled = (selectedTags.includes(targetTag) && currentSelection !== targetTag) || isConflicting;
            });
        });
        document.getElementById('calculatedTotalDisplay').textContent = `Calculated Minutes: ${total}`;
    }
    serviceSelects.forEach(s => s.onchange = updateCalc);

    async function updateWeekUI() {
        const weekStr = selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('weekLabel').textContent = "Week of " + weekStr;
        const isCurrent = weekStr === getStartOfWeek(new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('submitBtn').disabled = !isCurrent;
        document.getElementById('lockWarning').style.display = isCurrent ? "none" : "block";
        const { data } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr).order('created_at', { ascending: true });
        // ... (Logic for refreshing UI data from the DB) ...
        renderAuditLog(); 
    }
    
    // Remaining logic for event listeners and dashboard rendering would follow here...
});
