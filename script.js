// Inside DOMContentLoaded:
const toggleBtn = document.createElement('button');
toggleBtn.innerHTML = '🌙';
toggleBtn.style.cssText = 'position:fixed; top:10px; right:10px; width:40px; background:none; z-index:100';
document.body.appendChild(toggleBtn);

const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
toggleBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';

toggleBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    // Sync the cookie for the login page
    document.cookie = "theme=" + newTheme + "; path=/; max-age=31536000";
    toggleBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
});
