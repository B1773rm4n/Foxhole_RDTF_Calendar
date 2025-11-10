/**
 * Timezone handling on client
 */

let currentTimezone = 'UTC';
let allTimezones = [];
let filteredTimezones = [];
let highlightedIndex = -1;

/**
 * Get all available timezones
 */
function getAllTimezones() {
    try {
        // Use Intl.supportedValuesOf if available (modern browsers)
        if (typeof Intl.supportedValuesOf === 'function') {
            return Intl.supportedValuesOf('timeZone');
        }
        
        // Fallback: Generate common timezones manually
        // This is a comprehensive list of IANA timezones
        const fallbackTimezones = [
            'UTC',
            'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
            'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
            'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
            'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
            'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
            'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
            'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
            'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
            'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
            'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
            'Africa/Tunis', 'Africa/Windhoek',
            'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
            'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
            'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
            'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
            'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
            'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
            'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
            'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
            'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
            'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
            'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
            'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
            'America/Glace_Bay', 'America/Godthab', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada',
            'America/Guadeloupe', 'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax',
            'America/Havana', 'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox',
            'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Tell_City',
            'America/Indiana/Vevay', 'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Inuvik',
            'America/Iqaluit', 'America/Jamaica', 'America/Juneau', 'America/Kentucky/Louisville',
            'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz', 'America/Lima', 'America/Los_Angeles',
            'America/Lower_Princes', 'America/Maceio', 'America/Managua', 'America/Manaus', 'America/Marigot',
            'America/Martinique', 'America/Matamoros', 'America/Mazatlan', 'America/Menominee', 'America/Merida',
            'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon', 'America/Moncton', 'America/Monterrey',
            'America/Montevideo', 'America/Montserrat', 'America/Nassau', 'America/New_York', 'America/Nipigon',
            'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah', 'America/North_Dakota/Center',
            'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga', 'America/Panama', 'America/Pangnirtung',
            'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince', 'America/Port_of_Spain', 'America/Porto_Velho',
            'America/Puerto_Rico', 'America/Punta_Arenas', 'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife',
            'America/Regina', 'America/Resolute', 'America/Rio_Branco', 'America/Santarem', 'America/Santiago',
            'America/Santo_Domingo', 'America/Sao_Paulo', 'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy',
            'America/St_Johns', 'America/St_Kitts', 'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent',
            'America/Swift_Current', 'America/Tegucigalpa', 'America/Thule', 'America/Thunder_Bay', 'America/Tijuana',
            'America/Toronto', 'America/Tortola', 'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg',
            'America/Yakutat', 'America/Yellowknife',
            'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/DumontDUrville', 'Antarctica/Macquarie',
            'Antarctica/Mawson', 'Antarctica/McMurdo', 'Antarctica/Palmer', 'Antarctica/Rothera', 'Antarctica/Syowa',
            'Antarctica/Troll', 'Antarctica/Vostok',
            'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe', 'Asia/Ashgabat',
            'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut',
            'Asia/Bishkek', 'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus', 'Asia/Dhaka',
            'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta', 'Asia/Gaza', 'Asia/Hebron', 'Asia/Ho_Chi_Minh',
            'Asia/Hong_Kong', 'Asia/Hovd', 'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul',
            'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga', 'Asia/Kolkata', 'Asia/Krasnoyarsk',
            'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau', 'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila',
            'Asia/Muscat', 'Asia/Nicosia', 'Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh',
            'Asia/Pontianak', 'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin',
            'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent',
            'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar', 'Asia/Urumqi',
            'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yangon', 'Asia/Yekaterinburg',
            'Asia/Yerevan',
            'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
            'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena', 'Atlantic/Stanley',
            'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie', 'Australia/Darwin',
            'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe', 'Australia/Melbourne',
            'Australia/Perth', 'Australia/Sydney',
            'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade', 'Europe/Berlin',
            'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest', 'Europe/Busingen', 'Europe/Chisinau',
            'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar', 'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man',
            'Europe/Istanbul', 'Europe/Jersey', 'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon',
            'Europe/Ljubljana', 'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
            'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica', 'Europe/Prague',
            'Europe/Riga', 'Europe/Rome', 'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Saratov',
            'Europe/Simferopol', 'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane',
            'Europe/Ulyanovsk', 'Europe/Uzhgorod', 'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius',
            'Europe/Volgograd', 'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',
            'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro', 'Indian/Kerguelen',
            'Indian/Mahe', 'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte', 'Indian/Reunion',
            'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham', 'Pacific/Chuuk', 'Pacific/Easter',
            'Pacific/Efate', 'Pacific/Enderbury', 'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti', 'Pacific/Galapagos',
            'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu', 'Pacific/Kiritimati', 'Pacific/Kosrae',
            'Pacific/Kwajalein', 'Pacific/Majuro', 'Pacific/Marquesas', 'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue',
            'Pacific/Norfolk', 'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Palau', 'Pacific/Pitcairn', 'Pacific/Pohnpei',
            'Pacific/Port_Moresby', 'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
            'Pacific/Wake', 'Pacific/Wallis'
        ];
        return fallbackTimezones;
    } catch (error) {
        console.error('Error getting timezones:', error);
        return ['UTC'];
    }
}

/**
 * Get timezone offset string (e.g., "+02:00", "-05:00")
 */
function getTimezoneOffset(timezone) {
    try {
        // Use a specific UTC time to calculate offset
        // This avoids issues with DST changes during the day
        const testDate = new Date('2024-01-15T12:00:00Z'); // Noon UTC on a fixed date
        
        // Format in UTC
        const utcFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        // Format in target timezone
        const tzFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const utcParts = utcFormatter.formatToParts(testDate);
        const tzParts = tzFormatter.formatToParts(testDate);
        
        const utcHour = parseInt(utcParts.find(p => p.type === 'hour')?.value || '0', 10);
        const utcMinute = parseInt(utcParts.find(p => p.type === 'minute')?.value || '0', 10);
        const tzHour = parseInt(tzParts.find(p => p.type === 'hour')?.value || '0', 10);
        const tzMinute = parseInt(tzParts.find(p => p.type === 'minute')?.value || '0', 10);
        
        // Calculate the difference in minutes
        const utcMinutes = utcHour * 60 + utcMinute;
        const tzMinutes = tzHour * 60 + tzMinute;
        let diffMinutes = tzMinutes - utcMinutes;
        
        // Normalize to -12 to +14 hour range
        if (diffMinutes > 12 * 60) {
            diffMinutes -= 24 * 60;
        } else if (diffMinutes < -12 * 60) {
            diffMinutes += 24 * 60;
        }
        
        const sign = diffMinutes >= 0 ? '+' : '-';
        const hours = Math.abs(Math.floor(diffMinutes / 60));
        const minutes = Math.abs(diffMinutes % 60);
        
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error getting timezone offset:', error);
        return '+00:00';
    }
}

/**
 * Format timezone name for display
 */
function formatTimezoneName(timezone) {
    return timezone.replace(/_/g, ' ');
}

/**
 * Format timezone name with offset for display
 */
function formatTimezoneNameWithOffset(timezone) {
    const name = formatTimezoneName(timezone);
    const offset = getTimezoneOffset(timezone);
    return `${name} (${offset})`;
}

/**
 * Get user's detected timezone from browser
 */
function getUserTimezone() {
    try {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return options.timeZone || 'UTC';
    } catch (error) {
        console.error('Error detecting timezone:', error);
        return 'UTC';
    }
}

/**
 * Filter timezones based on search query
 */
function filterTimezones(query) {
    if (!query) {
        return allTimezones;
    }
    
    const lowerQuery = query.toLowerCase();
    return allTimezones.filter(tz => {
        const formatted = formatTimezoneName(tz).toLowerCase();
        const offset = getTimezoneOffset(tz).toLowerCase();
        return formatted.includes(lowerQuery) || tz.toLowerCase().includes(lowerQuery) || offset.includes(lowerQuery);
    });
}

/**
 * Render timezone list
 */
function renderTimezoneList(timezones) {
    const list = document.getElementById('timezone-list');
    if (!list) return;
    
    list.innerHTML = '';
    highlightedIndex = -1;
    
    timezones.forEach((tz, index) => {
        const item = document.createElement('div');
        item.className = 'timezone-item';
        if (tz === currentTimezone) {
            item.classList.add('selected');
        }
        item.textContent = formatTimezoneNameWithOffset(tz);
        item.dataset.timezone = tz;
        
        item.addEventListener('click', () => {
            selectTimezone(tz);
        });
        
        item.addEventListener('mouseenter', () => {
            highlightedIndex = index;
            updateHighlight();
        });
        
        list.appendChild(item);
    });
}

/**
 * Update highlighted item
 */
function updateHighlight() {
    const items = document.querySelectorAll('.timezone-item');
    items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex);
    });
}

/**
 * Select a timezone
 */
function selectTimezone(timezone) {
    currentTimezone = timezone;
    localStorage.setItem('timezone', timezone);
    
    // Update display
    const displayText = document.getElementById('timezone-display-text');
    if (displayText) {
        displayText.textContent = formatTimezoneNameWithOffset(timezone);
    }
    
    // Close dropdown
    closeDropdown();
    
    // Trigger calendar refresh
    if (window.refreshCalendar) {
        window.refreshCalendar();
    }
}

/**
 * Open dropdown
 */
function openDropdown() {
    const dropdown = document.getElementById('timezone-dropdown');
    const display = document.getElementById('timezone-select-display');
    const search = document.getElementById('timezone-search');
    
    if (!dropdown || !display) return;
    
    dropdown.style.display = 'flex';
    display.classList.add('open');
    
    // Reset search and show all timezones
    if (search) {
        search.value = '';
        search.focus();
    }
    
    filteredTimezones = allTimezones;
    renderTimezoneList(filteredTimezones);
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick, true);
    }, 0);
}

/**
 * Close dropdown
 */
function closeDropdown() {
    const dropdown = document.getElementById('timezone-dropdown');
    const display = document.getElementById('timezone-select-display');
    const search = document.getElementById('timezone-search');
    
    if (!dropdown || !display) return;
    
    dropdown.style.display = 'none';
    display.classList.remove('open');
    
    if (search) {
        search.value = '';
    }
    
    document.removeEventListener('click', handleOutsideClick, true);
}

/**
 * Handle clicks outside the dropdown
 */
function handleOutsideClick(event) {
    const wrapper = document.querySelector('.timezone-select-wrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        closeDropdown();
    }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboard(event) {
    const items = document.querySelectorAll('.timezone-item');
    if (items.length === 0) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % items.length;
            updateHighlight();
            items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            break;
        case 'ArrowUp':
            event.preventDefault();
            highlightedIndex = highlightedIndex <= 0 ? items.length - 1 : highlightedIndex - 1;
            updateHighlight();
            items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            break;
        case 'Enter':
            event.preventDefault();
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                const timezone = items[highlightedIndex].dataset.timezone;
                if (timezone) {
                    selectTimezone(timezone);
                }
            }
            break;
        case 'Escape':
            event.preventDefault();
            closeDropdown();
            break;
    }
}

/**
 * Initialize timezone selector
 */
function initTimezoneSelector() {
    // Get all timezones
    allTimezones = getAllTimezones();
    
    // Get user's detected timezone
    const detectedTimezone = getUserTimezone();
    
    // Get saved timezone or use detected timezone
    const savedTimezone = localStorage.getItem('timezone');
    const initialTimezone = savedTimezone || detectedTimezone;
    
    // Validate timezone exists in our list
    const validTimezone = allTimezones.includes(initialTimezone) ? initialTimezone : 'UTC';
    currentTimezone = validTimezone;
    
    // Update display
    const displayText = document.getElementById('timezone-display-text');
    if (displayText) {
        displayText.textContent = formatTimezoneNameWithOffset(currentTimezone);
    }
    
    // Setup display click handler
    const display = document.getElementById('timezone-select-display');
    if (display) {
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('timezone-dropdown');
            if (dropdown && dropdown.style.display === 'none') {
                openDropdown();
            } else {
                closeDropdown();
            }
        });
    }
    
    // Setup search handler
    const search = document.getElementById('timezone-search');
    if (search) {
        search.addEventListener('input', (e) => {
            const query = e.target.value;
            filteredTimezones = filterTimezones(query);
            renderTimezoneList(filteredTimezones);
            highlightedIndex = -1;
        });
        
        search.addEventListener('keydown', handleKeyboard);
    }
    
    // Initial render
    filteredTimezones = allTimezones;
    renderTimezoneList(filteredTimezones);
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
