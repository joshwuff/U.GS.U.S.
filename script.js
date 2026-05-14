document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Logic
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.innerHTML = '🌙';
    document.body.appendChild(toggleBtn);

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        document.cookie = `theme=${theme}; path=/; max-age=31536000`;
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // ... Rest of your existing script.js code ...
