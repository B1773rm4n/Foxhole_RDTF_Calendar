/**
 * Timezone handling on client
 */

let currentTimezone = 'UTC';

// Common timezones list
const COMMON_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
];

// Initialize timezone selector
function initTimezoneSelector() {
    const select = document.getElementById('timezone-select');
    if (!select) return;
    
    // Get user's timezone preference (stored in localStorage or from user profile)
    const savedTimezone = localStorage.getItem('timezone') || 'UTC';
    currentTimezone = savedTimezone;
    
    // Populate selector
    COMMON_TIMEZONES.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz.replace('_', ' ');
        if (tz === savedTimezone) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Handle timezone change
    select.addEventListener('change', (e) => {
        currentTimezone = e.target.value;
        localStorage.setItem('timezone', currentTimezone);
        
        // Trigger calendar refresh
        if (window.refreshCalendar) {
            window.refreshCalendar();
        }
    });
}

// Convert UTC datetime string to timezone for input fields
// Note: datetime-local inputs work in browser's local timezone, so we convert UTC to the selected timezone
function convertToLocalInput(utcDateTime, timezone) {
    if (!utcDateTime) return '';
    
    const date = new Date(utcDateTime);
    
    // Format the date in the target timezone using formatToParts for reliable parsing
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Convert datetime-local string (in browser's timezone) to UTC, treating it as if it were in the selected timezone
function convertToUTC(localDateTime, timezone) {
    if (!localDateTime) return null;
    
    // Parse the datetime string
    const [datePart, timePart] = localDateTime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create a date string representing the time in the target timezone
    // We need to find what UTC time would produce this time in the target timezone
    // Use iterative approach similar to backend
    let guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Iterate to find correct UTC time
    for (let i = 0; i < 3; i++) {
        const parts = formatter.formatToParts(guess);
        const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
        const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
        const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
        const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        
        if (tzYear === year && tzMonth === month && tzDay === day && 
            tzHour === hours && tzMinute === minutes) {
            return guess.toISOString();
        }
        
        const diffHours = hours - tzHour;
        const diffMinutes = minutes - tzMinute;
        const totalDiffMs = (diffHours * 3600 + diffMinutes * 60) * 1000;
        
        guess = new Date(guess.getTime() - totalDiffMs);
    }
    
    return guess.toISOString();
}

// Format datetime for display
function formatDateTime(dateTime, timezone) {
    if (!dateTime) return '';
    
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

// Get current timezone
function getCurrentTimezone() {
    return currentTimezone;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTimezoneSelector();
});

