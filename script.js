const APP_VERSION = "4.27";

const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co',
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

document.addEventListener('DOMContentLoaded', () => {
    
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) versionDisplay.textContent = APP_VERSION;

    // App Elements
    const submitBtn = document.getElementById('submitBtn');
    const agentSelect = document.getElementById('agentSelect');
    const actionSelect = document.getElementById('actionSelect');
    const robotCheck = document.getElementById('robotCheck');
    const resultOutput = document.getElementById('resultOutput');
    const lockWarning = document.getElementById('lockWarning');
    const agentListElement = document.getElementById('agentList');
    
    // Toggle Wrappers
    const goalInputsWrapper = document.getElementById('goalInputsWrapper');
    const progressInputsWrapper = document.getElementById('progressInputsWrapper');
    const cheatsheetContainer = document.getElementById('cheatsheetContainer');
    
    // Goal Inputs
    const hoursInput = document.getElementById('hoursInput');
    
    // Progress Inputs (WO Calc)
    const woInput = document.getElementById('woInput');
    const serviceSelects = document.querySelectorAll('.service-select');
    const calculatedTotalDisplay = document.getElementById('calculatedTotalDisplay');
    let currentCalculatedMinutes = 0;
    
    // Week Controls
    const weekLabel = document.getElementById('weekLabel');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const calendarBtn = document.getElementById('calendarBtn');
    const currentWeekBtn = document.getElementById('currentWeekBtn');
    
    // Custom Calendar Elements
    const calendarModal = document.getElementById('calendarModal');
    const calMonthYear = document.getElementById('calMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const calPrevMonth = document.getElementById('calPrevMonth');
    const calNextMonth = document.getElementById('calNextMonth');
    const calCancelBtn = document.getElementById('calCancelBtn');

    // Admin Elements
    const secretLogo = document.getElementById('secretLogo');
    const passwordModal = document.getElementById('passwordModal');
    const secretCodeInput = document.getElementById('secretCodeInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authCancelBtn = document.getElementById('authCancelBtn');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const adminAgentSelect = document.getElementById('adminAgentSelect');
    const adminActionSelect = document.getElementById('adminActionSelect');
    const adminValueInput = document.getElementById('adminValueInput');
    const adminOverrideBtn = document.getElementById('adminOverrideBtn');
    const adminFeedback = document.getElementById('adminFeedback');
    const auditLogBody = document.getElementById('auditLogBody');

    // --- DATE LOGIC ---
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0,0,0,0);
        return monday;
    }

    function formatDateString(dateObj) {
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }

    const actualCurrentMonday = getMonday(new Date());
    const actualCurrentWeekString = formatDateString(actualCurrentMonday);
    let selectedMonday = new Date(actualCurrentMonday);
    let selectedWeekString = actualCurrentWeekString;
    let currentCalViewDate = new Date(selectedMonday);

    function updateWeekUI() {
        if (!weekLabel) return;
        selectedWeekString = formatDateString(selectedMonday);
        weekLabel.textContent = `${selectedWeekString}`;

        if (selectedWeekString !== actualCurrentWeekString) {
            if(submitBtn) submitBtn.disabled = true;
            if(hoursInput) hoursInput.disabled = true;
            if(woInput) woInput.disabled = true;
            serviceSelects.forEach(s => s.disabled = true);
            if(robotCheck) robotCheck.disabled = true;
            if(lockWarning) lockWarning.style.display = "block";
        } else {
            if(submitBtn) submitBtn.disabled = false;
            if(hoursInput) hoursInput.disabled = false;
            if(woInput) woInput.disabled = false;
            serviceSelects.forEach(s => s.disabled = false);
            if(robotCheck) robotCheck.disabled = false;
            if(lockWarning) lockWarning.style.display = "none";
        }
        
        // Immediately fetch data, no login to wait for!
        fetchDashboardData();
    }

    if(prevWeekBtn) prevWeekBtn.addEventListener('click', () => { selectedMonday.setDate(selectedMonday.getDate() - 7); updateWeekUI(); });
    if(nextWeekBtn) nextWeekBtn.addEventListener('click', () => { selectedMonday.setDate(selectedMonday.getDate() + 7); updateWeekUI(); });
    if(currentWeekBtn) currentWeekBtn.addEventListener('click', () => { selectedMonday = new Date(actualCurrentMonday); updateWeekUI(); });

    // --- SERVICE CALCULATOR LOGIC & DYNAMIC DROPDOWNS ---
    function updateDropdownOptions() {
        const selectedTags = Array.from(serviceSelects)
            .map(select => select.options[select.selectedIndex].dataset.tag)
            .filter(tag => tag !== "NONE");

        serviceSelects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.dataset.tag === "NONE") return; 
                if (selectedTags.includes(option.dataset.tag) && select.options[select.selectedIndex].dataset.tag !== option.dataset.tag) {
                    option.disabled = true;
                    option.style.display = 'none'; 
                } else {
                    option.disabled = false;
                    option.style.display = 'block';
                }
            });
        });
    }

    function updateCalculatedMinutes() {
        currentCalculatedMinutes = 0;
        serviceSelects.forEach(select => {
            currentCalculatedMinutes += parseInt(select.value);
        });
        if(calculatedTotalDisplay) calculatedTotalDisplay.textContent = `Calculated Minutes: ${currentCalculatedMinutes}`;
        updateDropdownOptions();
    }
    
    serviceSelects.forEach(select => select.addEventListener('change', updateCalculatedMinutes));

    // --- CUSTOM CALENDAR LOGIC ---
    function renderCalendar() {
        const year = currentCalViewDate.getFullYear();
        const month = currentCalViewDate.getMonth();
        calMonthYear.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        calendarGrid.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        let currentDay = 1;
        let nextMonthDay = 1;
        
        for (let i = 0; i < 6; i++) {
            const weekRow = document.createElement('div');
            weekRow.className = 'calendar-week';
            let rowMondayYear, rowMondayMonth, rowMondayDate;
            
            for (let j = 0; j < 7; j++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                let cellDate;
                
                if (i === 0 && j < firstDay) {
                    dayCell.textContent = daysInPrevMonth - firstDay + j + 1;
                    dayCell.classList.add('muted');
                    cellDate = new Date(year, month - 1, dayCell.textContent);
                } else if (currentDay > daysInMonth) {
                    dayCell.textContent = nextMonthDay++;
                    dayCell.classList.add('muted');
                    cellDate = new Date(year, month + 1, dayCell.textContent);
                } else {
                    dayCell.textContent = currentDay++;
                    cellDate = new Date(year, month, dayCell.textContent);
                }
                
                if (j === 1) { 
                    rowMondayYear = cellDate.getFullYear();
                    rowMondayMonth = cellDate.getMonth();
                    rowMondayDate = cellDate.getDate();
                }
                weekRow.appendChild(dayCell);
            }
            
            weekRow.dataset.y = rowMondayYear;
            weekRow.dataset.m = rowMondayMonth;
            weekRow.dataset.d = rowMondayDate;
            
            weekRow.addEventListener('click', function() {
                selectedMonday = new Date(parseInt(this.dataset.y), parseInt(this.dataset.m), parseInt(this.dataset.d));
                updateWeekUI();
                calendarModal.style.display = 'none';
            });
            
            calendarGrid.appendChild(weekRow);
            if (currentDay > daysInMonth && i >= 4) break;
        }
    }

    if(calendarBtn) calendarBtn.addEventListener('click', () => { currentCalViewDate = new Date(selectedMonday); renderCalendar(); calendarModal.style.display = 'flex'; });
    if(calPrevMonth) calPrevMonth.addEventListener('click', () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() - 1); renderCalendar(); });
    if(calNextMonth) calNextMonth.addEventListener('click', () => { currentCalViewDate.setMonth(currentCalViewDate.getMonth() + 1); renderCalendar(); });
    if(calCancelBtn) calCancelBtn.addEventListener('click', () => { calendarModal.style.display = 'none'; });

    // --- INPUT SANITIZERS ---
    function restrictToWholeNumbers(e) { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
    
    function restrictToDecimals(e) {
        let val = e.target.value.replace(/[^0-9.]/g, '');
        let parts = val.split('.');
        if (parts.length > 2) {
            val = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = val;
    }

    if(hoursInput) hoursInput.addEventListener('input', restrictToDecimals);
    if(woInput) woInput.addEventListener('input', restrictToWholeNumbers);
    if(adminValueInput) adminValueInput.addEventListener('input', restrictToWholeNumbers);

    // --- EASTER EGG (ADMIN OVERRIDE) ---
    let logoClickCount = 0;
    let logoClickTimer;
    if(secretLogo) {
        secretLogo.addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount === 5) {
                logoClickCount = 0; 
                passwordModal.style.display = "flex";
                secretCodeInput.focus();
            }
        });
    }

    async function checkPassword() {
        const guess = secretCodeInput.value;
        if (!guess) return;

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = "Verifying...";

        // Still check the Admin Password against Supabase so no one accidentally wipes data!
        const { data, error } = await _supabase
            .from('precinct_secrets')
            .select('*')
            .eq('key_name', 'admin_panel')
            .eq('key_value', guess);

        if (data && data.length > 0) {
            passwordModal.style.display = "none";
            secretCodeInput.value = "";
            adminPanel.style.display = "block";
            window.scrollTo(0, document.body.scrollHeight);
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Access System";
        } else {
            alert("Access Denied.");
            secretCodeInput.value = "";
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Access System";
        }
    }

    if(authSubmitBtn) authSubmitBtn.addEventListener('click', checkPassword);
    if(secretCodeInput) secretCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !authSubmitBtn.disabled) checkPassword(); });
    if(authCancelBtn) authCancelBtn.addEventListener('click', () => { passwordModal.style.display = "none"; secretCodeInput.value = ""; });
    if(closeAdminBtn) closeAdminBtn.addEventListener('click', () => { adminPanel.style.display = "none"; });

    // --- MAIN UI TOGGLE ---
    if(actionSelect) {
        actionSelect.addEventListener('change', () => {
            if (actionSelect.value === 'GOAL') {
                goalInputsWrapper.style.display = 'block';
                progressInputsWrapper.style.display = 'none';
                cheatsheetContainer.style.display = 'none';
            } else {
                goalInputsWrapper.style.display = 'none';
                progressInputsWrapper.style.display = 'block';
                cheatsheetContainer.style.display = 'block';
            }
        });
    }

    // --- SUPABASE LOGIC ---
    async function fetchDashboardData() {
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', selectedWeekString);
        if (error) {
            agentListElement.innerHTML = '<li class="agent-item" style="color:#d32f2f; text-align:center;">Error loading database.</li>';
            return;
        }

        const precinctData = {};
        const auditLogs = []; 

        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const realName = parts[0];
            const logType = parts[1] || 'GOAL';

            if (!precinctData[realName]) precinctData[realName] = { goal: 0, progress: 0 };
            
            if (logType === 'GOAL') {
                precinctData[realName].goal += log.target_minutes;
            } else if (logType === 'PROGRESS') {
                precinctData[realName].progress += log.target_minutes;
                
                const wo = parts[2] ? parts[2].replace('WO:', '') : 'Manual';
                const tags = parts[3] ? parts[3].replace(/\+/g, ', ') : 'Overwrite';
                
                auditLogs.push({
                    agent: realName,
                    wo: wo,
                    tags: tags,
                    mins: log.target_minutes,
                    timestamp: log.created_at
                });
            }
        });

        renderDashboard(precinctData);
        renderAuditLog(auditLogs);
    }

    function renderDashboard(data) {
        agentListElement.innerHTML = ''; 
        const sortedAgents = Object.keys(data).sort();
        if (sortedAgents.length === 0) {
            agentListElement.innerHTML = '<li class="agent-item" style="color:#999; text-align:center;">No data logged this week.</li>';
            return;
        }

        sortedAgents.forEach(agent => {
            const goal = data[agent].goal;
            const progress = data[agent].progress;
            let percent = goal > 0 ? Math.round((progress / goal) * 100) : 0;
            let barWidth = Math.min(percent, 100);

            const li = document.createElement('li');
            li.className = 'agent-item';
            li.innerHTML = `
                <div class="agent-header">
                    <span class="agent-name">${agent}</span>
                    <span class="agent-stats">${progress} / ${goal} min (${percent}%)</span>
                </div>
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${barWidth}%;"></div></div>
            `;
            agentListElement.appendChild(li);
        });
    }

    function renderAuditLog(logs) {
        if(!auditLogBody) return;
        auditLogBody.innerHTML = '';
        
        if (logs.length === 0) {
            auditLogBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #999;">No work orders logged this week.</td></tr>`;
            return;
        }
        
        logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        
        logs.forEach(log => {
            let timeStr = "N/A";
            if (log.timestamp) {
                const dateObj = new Date(log.timestamp);
                if (!isNaN(dateObj)) {
                    timeStr = dateObj.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: '2-digit' 
                    });
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${log.agent}</strong></td>
                <td>${log.wo}</td>
                <td>${log.tags}</td>
                <td><strong>${log.mins}</strong></td>
                <td style="color: #666; font-size: 11px;">${timeStr}</td>
            `;
            auditLogBody.appendChild(tr);
        });
    }

    async function submitData() {
        const selectedAgent = agentSelect.value;
        const action = actionSelect.value;

        if (!selectedAgent || !robotCheck.checked) {
            resultOutput.textContent = "Please select an agent and verify reCAPTCHA.";
            resultOutput.style.color = "#d32f2f";
            return;
        }

        let finalMinutes = 0;
        let dbAgentName = "";

        if (action === 'GOAL') {
            if (hoursInput.value === "") {
                resultOutput.textContent = "Please enter scheduled hours."; resultOutput.style.color = "#d32f2f"; return;
            }
            finalMinutes = Math.round((parseFloat(hoursInput.value) * 60) * 0.81);
            dbAgentName = `${selectedAgent}|GOAL`;
        } else {
            if (woInput.value.length !== 4) {
                resultOutput.textContent = "Please enter the last 4 digits of the Work Order."; resultOutput.style.color = "#d32f2f"; return;
            }
            if (currentCalculatedMinutes === 0) {
                resultOutput.textContent = "Please select at least one completed service."; resultOutput.style.color = "#d32f2f"; return;
            }
            
            let selectedTags = [];
            let hasDuplicates = false;
            
            serviceSelects.forEach(s => {
                if (s.value !== "0") {
                    const tag = s.options[s.selectedIndex].dataset.tag;
                    if (selectedTags.includes(tag)) {
                        hasDuplicates = true;
                    }
                    selectedTags.push(tag);
                }
            });

            if (hasDuplicates) {
                resultOutput.textContent = "Error: You cannot log the same service tag more than once per Work Order.";
                resultOutput.style.color = "#d32f2f";
                return; 
            }

            finalMinutes = currentCalculatedMinutes;
            dbAgentName = `${selectedAgent}|PROGRESS|WO:${woInput.value}|${selectedTags.join('+')}`;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        const { error } = await _supabase.from('utilization_logs').insert([
            { 
                agent_name: dbAgentName, 
                target_minutes: finalMinutes, 
                week_of: actualCurrentWeekString,
                created_at: new Date().toISOString()
            }
        ]);

        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Data";

        if (error) {
            resultOutput.style.color = "#d32f2f"; resultOutput.textContent = "Failed to sync to cloud."; return;
        }

        resultOutput.style.color = "#4CAF50"; 
        resultOutput.textContent = `Success! Logged ${finalMinutes} minutes for ${selectedAgent}.`;
        
        robotCheck.checked = false;
        hoursInput.value = '';
        woInput.value = '';
        serviceSelects.forEach(s => s.value = "0");
        updateCalculatedMinutes();
        
        fetchDashboardData();
    }

    async function forceUpdateAgent() {
        const targetAgent = adminAgentSelect.value;
        const targetAction = adminActionSelect.value;
        const exactMinutes = adminValueInput.value;

        if (exactMinutes === "" || isNaN(exactMinutes)) {
            adminFeedback.textContent = "Please enter valid total minutes."; return;
        }

        const dbAgentName = `${targetAgent}|${targetAction}`;
        adminOverrideBtn.textContent = "Updating...";
        adminOverrideBtn.disabled = true;

        await _supabase.from('utilization_logs').delete()
            .eq('week_of', selectedWeekString)
            .like('agent_name', `${targetAgent}|${targetAction}%`);

        const { error } = await _supabase.from('utilization_logs').insert([
            { 
                agent_name: dbAgentName, 
                target_minutes: parseInt(exactMinutes), 
                week_of: selectedWeekString,
                created_at: new Date().toISOString()
            }
        ]);

        adminOverrideBtn.textContent = "Force Update Agent";
        adminOverrideBtn.disabled = false;

        if (error) {
            adminFeedback.textContent = "Error updating database.";
        } else {
            adminFeedback.style.color = "#4CAF50";
            adminFeedback.textContent = `Successfully updated ${targetAgent} for ${selectedWeekString}.`;
            adminValueInput.value = '';
            fetchDashboardData();
            setTimeout(() => { adminFeedback.textContent = ""; adminFeedback.style.color = "#d32f2f"; }, 4000);
        }
    }

    async function manualReset() {
        if(confirm(`Are you sure you want to clear ALL cloud data for the week of ${selectedWeekString}?`)) {
            if(confirm("FINAL WARNING: Wiping the database now.")) {
                const { error } = await _supabase.from('utilization_logs').delete().eq('week_of', selectedWeekString);
                if (!error) fetchDashboardData();
            }
        }
    }

    if(submitBtn) submitBtn.addEventListener('click', submitData);
    if(hoursInput) hoursInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !submitBtn.disabled) submitData(); });
    if(woInput) woInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !submitBtn.disabled) submitData(); });
    
    if(adminOverrideBtn) adminOverrideBtn.addEventListener('click', forceUpdateAgent);
    if(resetDataBtn) resetDataBtn.addEventListener('click', manualReset);

    updateDropdownOptions();
    
    // Automatically load the week UI and fetch the data on startup!
    updateWeekUI(); 
});
