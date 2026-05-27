const APP_VERSION = "6.4";

// --- REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS ---
const _supabase = supabase.createClient(
    'https://yxeozqztofvpyadxveyr.supabase.co', 
    'sb_publishable_3WRcMc4zjv-N-9oZry-SbA_MmRRKv1b'
);

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

    // --- HELPER: UI / DOM ---
    const agentSelect = document.getElementById('agentSelect');
    const adminAgentSelect = document.getElementById('adminAgentSelect');

    function updateFooter(isCA) {
        const footer = document.querySelector('.footer-note');
        if (footer) footer.innerHTML = isCA ? `Target: 1.5 Tags/hr & 1 MBBT/day | v${APP_VERSION}` : `Target: 81% (0.81) | v${APP_VERSION}`;
    }

    // --- 1. ADMIN LOGIC (5-Click) ---
    let clicks = 0;
    document.getElementById('secretLogo').onclick = () => {
        clicks++;
        if(clicks >= 5) { document.getElementById('passwordModal').style.display = 'flex'; clicks = 0; }
    };
    
    // --- 2. DATA SYNC & DASHBOARD ---
    async function updateWeekUI() {
        const weekStr = new Date(getStartOfWeek(new Date())).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('weekLabel').textContent = "Week of " + weekStr;
        
        const { data, error } = await _supabase.from('utilization_logs').select('*').eq('week_of', weekStr).order('created_at', { ascending: true });
        if (error) return console.error(error);

        const araStats = {}, caStats = {}, logs = [];
        data.forEach(log => {
            const parts = log.agent_name.split('|');
            const name = parts[0];
            if (log.agent_name.includes('CA_')) {
                if(!caStats[name]) caStats[name] = { hours: 0, tags: 0, mbbt: 0 };
                if (parts[1] === 'CA_OVERRIDE') { caStats[name].hours = parseFloat(parts[2]); caStats[name].tags = parseInt(parts[3]); caStats[name].mbbt = parseInt(parts[4]); }
                else if (parts[1] === 'CA_GOAL') caStats[name].hours = parseFloat(parts[2]);
                else if (parts[1] === 'CA_PROGRESS') { caStats[name].tags += parseInt(parts[2]); caStats[name].mbbt += parseInt(parts[3]); }
            } else {
                if(!araStats[name]) araStats[name] = { g: 0, p: 0, count: 0 };
                if (parts[1] === 'GOAL') araStats[name].g = log.target_minutes;
                else if (parts[1] === 'PROGRESS') {
                    araStats[name].p += log.target_minutes;
                    araStats[name].count += (parts[3] ? parts[3].split('+').length : 0);
                }
            }
            logs.push({ agent: name, wo: parts[2] || 'Override', tag: parts[3] || 'N/A', min: log.target_minutes, time: log.created_at, type: log.agent_name.includes('GOAL') ? 'GOAL' : 'PROGRESS' });
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
            Object.keys(araStats).sort().forEach(agent => {
                const { g, p, count } = araStats[agent];
                const per = g > 0 ? Math.round((p/g)*100) : 0;
                list.innerHTML += `<li class="agent-item"><strong style="color:var(--accent);">${agent}</strong><div style="display:flex; justify-content:space-between;"><span>Util: ${per}%</span><span>Tags: ${count}</span></div></li>`;
            });
        }
    }

    function renderAuditLog() {
        const audit = document.getElementById('auditLogBody');
        audit.innerHTML = '';
        window.precinctLogs.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(l => {
            audit.innerHTML += `<tr><td>${l.agent}</td><td>${l.wo}</td><td>${l.tag}</td><td>${l.min}</td><td>${new Date(l.time).toLocaleTimeString()}</td></tr>`;
        });
    }

    // --- 3. SUBMISSION ---
    document.getElementById('submitBtn').onclick = async () => {
        const agent = document.getElementById('agentSelect').value;
        if (!agent || !document.getElementById('robotCheck').checked) return alert("Select agent and verify.");
        
        let dbName = ""; let mins = 0;
        if (isCAMode) {
            if(document.getElementById('caActionSelect').value === 'CA_GOAL') dbName = `${agent}|CA_GOAL|${document.getElementById('caHoursInput').value}`;
            else dbName = `${agent}|CA_PROGRESS|${document.getElementById('caTagsInput').value || 0}|${document.getElementById('caMbbtInput').value || 0}`;
        } else {
            if(document.getElementById('actionSelect').value === 'GOAL') {
                mins = Math.round((parseFloat(document.getElementById('hoursInput').value) * 60) * 0.81);
                dbName = `${agent}|GOAL`;
            } else {
                let totalMins = 0;
                serviceSelects.forEach(s => totalMins += parseInt(s.value));
                mins = totalMins;
                const tags = [];
                serviceSelects.forEach(s => { const t = s.options[s.selectedIndex].dataset.tag; if(t !== "NONE") tags.push(t); });
                dbName = `${agent}|PROGRESS|WO:${document.getElementById('woInput').value}|${tags.join('+')}`;
                document.getElementById('woInput').value = ''; // Clears WO input
            }
        }
        await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: mins, week_of: new Date(getStartOfWeek(new Date())).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }]);
        updateWeekUI(); showToast("Logged!");
    };

    // --- 4. ADMIN ---
    document.getElementById('adminOverrideBtn').onclick = async () => {
        const agent = adminAgentSelect.value;
        const action = document.getElementById('adminActionSelect').value;
        let dbName = "";
        if (action === 'CA_OVERRIDE') dbName = `${agent}|CA_OVERRIDE|${document.getElementById('adminCaHours').value}|${document.getElementById('adminCaTags').value}|${document.getElementById('adminCaMbbt').value}`;
        else if (action === 'ARA_OVERRIDE') dbName = `${agent}|ARA_OVERRIDE|${document.getElementById('adminAraTarget').value}|${document.getElementById('adminAraProgress').value}`;
        await _supabase.from('utilization_logs').insert([{ agent_name: dbName, target_minutes: 0, week_of: new Date(getStartOfWeek(new Date())).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }]);
        updateWeekUI();
    };

    // Initial load
    updateWeekUI();
    function getStartOfWeek(d) { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day; const start = new Date(date.setDate(diff)); start.setHours(0,0,0,0); return start; }
});
