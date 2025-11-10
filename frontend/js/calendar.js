/**
 * Calendar rendering and interaction
 */

if (typeof globalThis.API_BASE === 'undefined') {
    globalThis.API_BASE = 'https://rotdust-calendar.asuka-shikinami.club';
}

let shifts = [];
let currentUser = null;
const currentDate = new Date(); // Initialize to current date

// Load current user
async function loadCurrentUser() {
    try {
        const response = await fetch(`${globalThis.API_BASE}/api/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            // Update UI
            const usernameEl = document.getElementById('username');
            if (usernameEl && currentUser) {
                usernameEl.textContent = currentUser.username;
            }
            
            return currentUser;
        } else {
            globalThis.location.href = '/login.html';
            return null;
        }
    } catch (error) {
        console.error('Error loading user:', error);
        globalThis.location.href = '/login.html';
        return null;
    }
}

// Load shifts for current month
async function loadShifts() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Calculate start and end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    shifts = await getShifts(startDateStr, endDateStr);
    renderCalendar();
}

// Render calendar
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearEl = document.getElementById('current-month-year');
    
    if (!grid) return;
    
    // Update month/year display
    if (monthYearEl) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    
    // Clear grid
    grid.innerHTML = '';
    
    // Get first day of month and number of days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateStr;
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // Shifts for this day
        const dayShifts = shifts.filter(shift => {
            const shiftDate = new Date(shift.start_time);
            return shiftDate.getFullYear() === year &&
                   shiftDate.getMonth() === month &&
                   shiftDate.getDate() === day;
        });
        
        // Display shifts
        dayShifts.forEach(shift => {
            const shiftEl = document.createElement('div');
            shiftEl.className = 'shift-item';
            shiftEl.textContent = formatDateTime(shift.start_time, getCurrentTimezone()).split(',')[1] + ' - ' + 
                                 (shift.user?.username || 'Unknown');
            shiftEl.title = `${formatDateTime(shift.start_time, getCurrentTimezone())} - ${formatDateTime(shift.end_time, getCurrentTimezone())}\n${shift.description || ''}`;
            
            // Make clickable to edit
            shiftEl.addEventListener('click', (e) => {
                e.stopPropagation();
                openShiftModal(dateStr, shift);
            });
            
            dayCell.appendChild(shiftEl);
        });
        grid.appendChild(dayCell);
    }
}

// Navigate to previous month
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadShifts();
}

// Navigate to next month
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadShifts();
}

// Refresh calendar (public function)
async function refreshCalendar() {
    await loadShifts();
}

// Initialize calendar
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const user = await loadCurrentUser();
    if (!user) {
        return;
    }
    
    // Load initial data
    await loadShifts();
    
    // Make functions globally available
    globalThis.refreshCalendar = refreshCalendar;
    globalThis.previousMonth = previousMonth;
    globalThis.nextMonth = nextMonth;
});

