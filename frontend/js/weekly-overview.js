/**
 * Overview - Monday to Friday grid view
 */

// Ensure globalThis.API_BASE is available (fallback to production URL if not set)
// Check if globalThis.API_BASE is already set globally first
if (typeof globalThis.API_BASE === 'undefined') {
    globalThis.API_BASE = 'https://rotdust-calendar.asuka-shikinami.club';
}
const API_BASE = globalThis.API_BASE;

let currentWeekStart = getMondayOfCurrentWeek();
let weeklyShifts = [];

// Get Monday of current week
function getMondayOfCurrentWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Format date for display
function formatDateDisplay(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const dayName = dayNames[date.getDay()];
    return `${month} ${day} ${dayName}`;
}

// Get all days Monday-Friday for current week
function getWeekDays() {
    const days = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        days.push(date);
    }
    return days;
}

// Load shifts for current week
async function loadWeeklyShifts() {
    const weekDays = getWeekDays();
    const startDate = new Date(weekDays[0]);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(weekDays[4]);
    endDate.setHours(23, 59, 59, 999);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    try {
        const timezone = getCurrentTimezone();
        const params = new URLSearchParams({
            start: startDateStr,
            end: endDateStr,
            timezone: timezone
        });
        
        const response = await fetch(`${API_BASE}/api/shifts?${params}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            weeklyShifts = await response.json();
            renderWeeklyGrid();
            updateShiftmanagerList();
        } else {
            console.error('Failed to load weekly shifts');
            weeklyShifts = [];
        }
    } catch (error) {
        console.error('Error loading weekly shifts:', error);
        weeklyShifts = [];
    }
}

// Render weekly grid
function renderWeeklyGrid() {
    const grid = document.getElementById('weekly-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const weekDays = getWeekDays();
    const timezone = getCurrentTimezone();
    
    // Update header
    const titleEl = document.getElementById('overview-title');
    const dateRangeEl = document.getElementById('overview-date-range');
    
    if (titleEl) {
        titleEl.textContent = 'Current Week';
    }
    
    if (dateRangeEl && weekDays.length > 0) {
        const start = weekDays[0];
        const end = weekDays[4];
        const startStr = `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getDate()}`;
        const endStr = `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getDate()}`;
        dateRangeEl.textContent = `${startStr} - ${endStr}`;
    }
    
    // Create time column header
    const timeHeader = document.createElement('div');
    timeHeader.className = 'time-header';
    grid.appendChild(timeHeader);
    
    // Create day headers
    weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = formatDateDisplay(day);
        grid.appendChild(dayHeader);
    });
    
    // Add next week button
    const nextWeekBtn = document.createElement('button');
    nextWeekBtn.className = 'week-nav-btn';
    nextWeekBtn.innerHTML = '→';
    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        loadWeeklyShifts();
    });
    grid.appendChild(nextWeekBtn);
    
    // Create time slots (0:00 to 23:00)
    for (let hour = 0; hour < 24; hour++) {
        // Time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour}:00`;
        grid.appendChild(timeLabel);
        
        // Day cells for this hour
        weekDays.forEach((day, dayIndex) => {
            const cell = document.createElement('div');
            cell.className = 'time-cell';
            cell.dataset.date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            cell.dataset.hour = hour;
            
            // Check if this cell has any shifts (check if shift overlaps with this hour)
            const cellShifts = weeklyShifts.filter(shift => {
                const shiftStart = new Date(shift.start_time);
                const shiftEnd = new Date(shift.end_time);
                const cellStart = new Date(day);
                cellStart.setHours(hour, 0, 0, 0);
                const cellEnd = new Date(day);
                cellEnd.setHours(hour + 1, 0, 0, 0);
                
                // Check if shift overlaps with this hour cell
                return shiftStart < cellEnd && shiftEnd > cellStart;
            });
            
            // Add shift blocks
            cellShifts.forEach(shift => {
                const shiftStart = new Date(shift.start_time);
                const shiftEnd = new Date(shift.end_time);
                const shiftStartHour = shiftStart.getHours();
                const shiftStartMin = shiftStart.getMinutes();
                const shiftEndHour = shiftEnd.getHours();
                const shiftEndMin = shiftEnd.getMinutes();
                
                // Calculate position and height for this hour cell
                let topPercent = 0;
                let heightPercent = 100;
                
                if (shiftStartHour === hour) {
                    // Shift starts in this hour
                    topPercent = (shiftStartMin / 60) * 100;
                    if (shiftEndHour === hour) {
                        // Shift ends in same hour
                        heightPercent = ((shiftEndMin - shiftStartMin) / 60) * 100;
                    } else {
                        // Shift continues to next hour(s)
                        heightPercent = ((60 - shiftStartMin) / 60) * 100;
                    }
                } else if (shiftStartHour < hour && shiftEndHour > hour) {
                    // Shift spans this entire hour
                    topPercent = 0;
                    heightPercent = 100;
                } else if (shiftEndHour === hour) {
                    // Shift ends in this hour
                    topPercent = 0;
                    heightPercent = (shiftEndMin / 60) * 100;
                } else {
                    // Should not happen, but skip just in case
                    return;
                }
                
                const shiftBlock = document.createElement('div');
                shiftBlock.className = 'shift-block';
                shiftBlock.style.top = `${topPercent}%`;
                shiftBlock.style.height = `${Math.max(heightPercent, 10)}%`;
                shiftBlock.textContent = shift.user?.username || 'Unknown';
                shiftBlock.title = `${formatDateTime(shift.start_time, timezone)} - ${formatDateTime(shift.end_time, timezone)}`;
                shiftBlock.dataset.shiftId = shift.id;
                
                // Only show text if block is tall enough
                if (heightPercent < 30) {
                    shiftBlock.textContent = '';
                }
                
                cell.appendChild(shiftBlock);
            });
            
            // Make cell clickable
            cell.addEventListener('click', (e) => {
                if (e.target === cell) {
                    const dateStr = cell.dataset.date;
                    if (globalThis.openAvailabilityModal) {
                        globalThis.openAvailabilityModal(dateStr);
                    }
                }
            });
            
            grid.appendChild(cell);
        });
    }
}

// Update Shiftmanager list
function updateShiftmanagerList() {
    const list = document.getElementById('shiftmanager-list');
    if (!list) return;
    
    // Get unique users who have shifts
    const usersWithShifts = new Map();
    
    weeklyShifts.forEach(shift => {
        if (shift.user) {
            const userId = shift.user.id;
            if (!usersWithShifts.has(userId)) {
                usersWithShifts.set(userId, {
                    id: userId,
                    username: shift.user.username,
                    avatar_url: shift.user.avatar_url,
                    shiftCount: 0
                });
            }
            usersWithShifts.get(userId).shiftCount++;
        }
    });
    
    const users = Array.from(usersWithShifts.values());
    
    if (users.length === 0) {
        list.innerHTML = '<p class="empty-message">No responses yet!</p>';
        return;
    }
    
    list.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'shiftmanager-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        if (user.avatar_url) {
            avatar.style.backgroundImage = `url(${user.avatar_url})`;
        } else {
            avatar.textContent = user.username.charAt(0).toUpperCase();
        }
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info-item';
        userInfo.innerHTML = `
            <div class="user-name">${user.username}</div>
            <div class="user-shift-count">${user.shiftCount} availability${user.shiftCount !== 1 ? 'ies' : 'y'}</div>
        `;
        
        userItem.appendChild(avatar);
        userItem.appendChild(userInfo);
        list.appendChild(userItem);
    });
}

// Copy link functionality
function copyLinkToClipboard() {
    const url = globalThis.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-link-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="copy-icon">✓</span> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link. Please copy the URL manually.');
    });
}

// Initialize overview
document.addEventListener('DOMContentLoaded', async () => {
    // Setup buttons
    const addBtn = document.getElementById('add-availability-overview-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (globalThis.openAvailabilityModal) {
                globalThis.openAvailabilityModal();
            }
        });
    }
    
    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyLinkToClipboard);
    }
    
    const editLink = document.getElementById('edit-availability-link');
    if (editLink) {
        editLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (globalThis.openAvailabilityModal) {
                globalThis.openAvailabilityModal();
            }
        });
    }
    
    // Load initial data
    await loadWeeklyShifts();
    
    // Refresh every minute
    setInterval(loadWeeklyShifts, 60000);
    
    // Make refresh function globally available
    globalThis.refreshOverview = loadWeeklyShifts;
});

