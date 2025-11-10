/**
 * Shift management logic
 */

// Ensure globalThis.API_BASE is available (fallback to production URL if not set)
// Check if globalThis.API_BASE is already set globally first
if (typeof globalThis.API_BASE === 'undefined') {
    globalThis.API_BASE = 'https://rotdust-calendar.asuka-shikinami.club';
}
const API_BASE = globalThis.API_BASE;

let currentUserId = null;

// Load current user
async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUserId = data.user?.id || null;
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Error loading user:', error);
        return null;
    }
}

// Get shifts for a date range
async function getShifts(startDate, endDate) {
    try {
        const timezone = getCurrentTimezone();
        const params = new URLSearchParams({
            start: startDate,
            end: endDate,
            timezone: timezone
        });
        
        const response = await fetch(`${API_BASE}/api/shifts?${params}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Error fetching shifts:', error);
        return [];
    }
}

// Create shift
async function createShift(shiftData) {
    try {
        const timezone = getCurrentTimezone();
        const response = await fetch(`${API_BASE}/api/shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                ...shiftData,
                timezone: timezone
            })
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create shift');
        }
    } catch (error) {
        console.error('Error creating shift:', error);
        throw error;
    }
}

// Update shift
async function updateShift(shiftId, shiftData) {
    try {
        const timezone = getCurrentTimezone();
        const response = await fetch(`${API_BASE}/api/shifts/${shiftId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                ...shiftData,
                timezone: timezone
            })
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update shift');
        }
    } catch (error) {
        console.error('Error updating shift:', error);
        throw error;
    }
}

// Delete shift
async function deleteShift(shiftId) {
    try {
        const response = await fetch(`${API_BASE}/api/shifts/${shiftId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            return true;
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete shift');
        }
    } catch (error) {
        console.error('Error deleting shift:', error);
        throw error;
    }
}

// Open shift modal for creating/editing
function openShiftModal(date, shift = null) {
    const modal = document.getElementById('shift-modal');
    const form = document.getElementById('shift-form');
    const title = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-shift-btn');
    
    if (shift) {
        // Edit mode
        title.textContent = 'Edit Shift';
        document.getElementById('shift-id').value = shift.id;
        document.getElementById('shift-start-time').value = convertToLocalInput(shift.start_time, getCurrentTimezone());
        document.getElementById('shift-end-time').value = convertToLocalInput(shift.end_time, getCurrentTimezone());
        document.getElementById('shift-description').value = shift.description || '';
        document.getElementById('shift-date').value = date;
        
        // Show delete button if user owns the shift
        if (shift.user_id === currentUserId) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }
    } else {
        // Create mode
        title.textContent = 'Create Shift';
        form.reset();
        document.getElementById('shift-id').value = '';
        document.getElementById('shift-date').value = date;
        
        // Set default times for the selected date
        document.getElementById('shift-start-time').value = `${date}T09:00`;
        document.getElementById('shift-end-time').value = `${date}T17:00`;
        
        deleteBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

// Close shift modal
function closeShiftModal() {
    const modal = document.getElementById('shift-modal');
    modal.style.display = 'none';
}

// Initialize shift form
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    
    const form = document.getElementById('shift-form');
    const closeBtn = document.querySelector('.close');
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const shiftId = document.getElementById('shift-id').value;
        const startTime = document.getElementById('shift-start-time').value;
        const endTime = document.getElementById('shift-end-time').value;
        const description = document.getElementById('shift-description').value;
        
        try {
            const shiftData = {
                start_time: convertToUTC(startTime, getCurrentTimezone()),
                end_time: convertToUTC(endTime, getCurrentTimezone()),
                description: description || null
            };
            
            if (shiftId) {
                await updateShift(parseInt(shiftId), shiftData);
            } else {
                await createShift(shiftData);
            }
            
            closeShiftModal();
            
            // Refresh calendar and weekly overview
            if (globalThis.refreshCalendar) {
                globalThis.refreshCalendar();
            }
            if (globalThis.refreshOverview) {
                globalThis.refreshOverview();
            }
        } catch (error) {
            alert('Error saving shift: ' + error.message);
        }
    });
    
    // Delete handler will be called via onclick
    
    // Close modal on X click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeShiftModal);
    }
    
    // Close modal on outside click
    globalThis.addEventListener('click', (e) => {
        const modal = document.getElementById('shift-modal');
        if (e.target === modal) {
            closeShiftModal();
        }
    });
});

// Availability Modal Functions
let availabilityCalendarDate = new Date();

// Generate time options for select dropdowns
function generateTimeOptions() {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            options.push(`<option value="${timeStr}">${timeStr}</option>`);
        }
    }
    return options.join('');
}

// Render calendar in modal
function renderAvailabilityCalendar(containerId, monthYearId) {
    const container = document.getElementById(containerId);
    const monthYearEl = document.getElementById(monthYearId);
    if (!container) return;
    
    const year = availabilityCalendarDate.getFullYear();
    const month = availabilityCalendarDate.getMonth();
    
    // Update month/year display
    if (monthYearEl) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearEl.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day-cell empty';
        container.appendChild(empty);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateStr;
        dayCell.textContent = day;
        
        // Check if selected
        if (selectedDates.has(dateStr)) {
            dayCell.classList.add('selected');
        }
        
        // Click handler
        dayCell.addEventListener('click', () => {
            if (selectedDates.has(dateStr)) {
                selectedDates.delete(dateStr);
                dayCell.classList.remove('selected');
            } else {
                selectedDates.add(dateStr);
                dayCell.classList.add('selected');
            }
        });
        
        container.appendChild(dayCell);
    }
    
    // Navigation buttons are handled via onclick in HTML
}

// Open availability modal
function openAvailabilityModal(date = null) {
    const modal = document.getElementById('availability-modal');
    if (!modal) {
        console.error('Availability modal element not found');
        // Retry after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => openAvailabilityModal(date));
        }
        return;
    }
    
    // Reset form
    const form = document.getElementById('availability-form');
    if (form) form.reset();
    const availabilityId = document.getElementById('availability-id');
    if (availabilityId) availabilityId.value = '';
    selectedDates.clear();
    availabilityCalendarDate = date ? new Date(date + 'T00:00:00') : new Date();
    
    // Set default date if provided
    if (date) {
        selectedDates.add(date);
    }
    
    // Populate time selects
    const timeStart = document.getElementById('time-start');
    const timeEnd = document.getElementById('time-end');
    if (timeStart && timeEnd) {
        timeStart.innerHTML = generateTimeOptions();
        timeEnd.innerHTML = generateTimeOptions();
        timeStart.value = '09:00';
        timeEnd.value = '17:00';
    }
    
    // Render calendars
    renderAvailabilityCalendar('calendar-days', 'calendar-month-year', 'calendar-prev', 'calendar-next');
    renderAvailabilityCalendar('calendar-days-only', 'calendar-month-year-only', 'calendar-prev-only', 'calendar-next-only');
    
    // Reset tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        const datesTimesTab = document.querySelector('[data-tab="dates-times"]');
        if (datesTimesTab) {
            datesTimesTab.classList.add('active');
        }
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const datesTimesContent = document.getElementById('dates-times-content');
        if (datesTimesContent) {
            datesTimesContent.classList.add('active');
        }
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Close availability modal
function closeAvailabilityModal() {
    const modal = document.getElementById('availability-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize availability modal
document.addEventListener('DOMContentLoaded', () => {
    const availabilityForm = document.getElementById('availability-form');
    const closeBtn = document.querySelector('#availability-modal .close');
    
    // Tab switching is handled via onclick in HTML
    
    // Advanced options toggle is handled via onclick in HTML
    
    // Form submission
    if (availabilityForm) {
        availabilityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('availability-name').value;
            const activeTab = document.querySelector('.tab-button.active').dataset.tab;
            const timeStart = document.getElementById('time-start').value;
            const timeEnd = document.getElementById('time-end').value;
            const description = document.getElementById('availability-description').value;
            
            if (selectedDates.size === 0) {
                alert('Please select at least one date');
                return;
            }
            
            try {
                // Create shifts for each selected date
                const timezone = getCurrentTimezone();
                const promises = [];
                
                for (const dateStr of selectedDates) {
                    let startTime, endTime;
                    
                    if (activeTab === 'dates-times' && timeStart && timeEnd) {
                        // Use selected times
                        startTime = convertToUTC(`${dateStr}T${timeStart}`, timezone);
                        endTime = convertToUTC(`${dateStr}T${timeEnd}`, timezone);
                    } else {
                        // Dates only - use full day (00:00 to 23:59)
                        startTime = convertToUTC(`${dateStr}T00:00`, timezone);
                        endTime = convertToUTC(`${dateStr}T23:59`, timezone);
                    }
                    
                    const shiftData = {
                        start_time: startTime,
                        end_time: endTime,
                        description: description || name || null
                    };
                    
                    promises.push(createShift(shiftData));
                }
                
                await Promise.all(promises);
                closeAvailabilityModal();
                
                // Refresh calendar and weekly overview
                if (globalThis.refreshCalendar) {
                    globalThis.refreshCalendar();
                }
                if (globalThis.refreshWeeklyOverview) {
                    globalThis.refreshWeeklyOverview();
                }
            } catch (error) {
                alert('Error creating availability: ' + error.message);
            }
        });
    }
    
    // Close modal handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAvailabilityModal);
    }
    
    // Close on outside click
    globalThis.addEventListener('click', (e) => {
        const modal = document.getElementById('availability-modal');
        if (e.target === modal) {
            closeAvailabilityModal();
        }
    });
});

// Delete shift handler
async function deleteShiftHandler() {
    const shiftId = document.getElementById('shift-id').value;
    if (!shiftId) return;
    
    if (confirm('Are you sure you want to delete this shift?')) {
        try {
            await deleteShift(parseInt(shiftId));
            closeShiftModal();
            
            // Refresh calendar and weekly overview
            if (globalThis.refreshCalendar) {
                globalThis.refreshCalendar();
            }
            if (globalThis.refreshOverview) {
                globalThis.refreshOverview();
            }
        } catch (error) {
            alert('Error deleting shift: ' + error.message);
        }
    }
}

// Delete availability handler (placeholder - availability deletion not yet implemented)
function deleteAvailability() {
    alert('Delete availability functionality not yet implemented');
}

// Calendar navigation functions
function navigateAvailabilityCalendar(direction) {
    if (direction === 'prev') {
        availabilityCalendarDate.setMonth(availabilityCalendarDate.getMonth() - 1);
    } else {
        availabilityCalendarDate.setMonth(availabilityCalendarDate.getMonth() + 1);
    }
    
    // Update both calendars to keep them in sync
    renderAvailabilityCalendar('calendar-days', 'calendar-month-year', 'calendar-prev', 'calendar-next');
    renderAvailabilityCalendar('calendar-days-only', 'calendar-month-year-only', 'calendar-prev-only', 'calendar-next-only');
}

// Tab switching function
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`${tabName}-content`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// Advanced options toggle
function toggleAdvancedOptions() {
    const advancedContent = document.getElementById('advanced-options');
    const advancedToggle = document.getElementById('advanced-toggle');
    if (advancedContent && advancedToggle) {
        const isVisible = advancedContent.style.display !== 'none';
        advancedContent.style.display = isVisible ? 'none' : 'block';
        advancedToggle.textContent = isVisible ? '▼' : '▲';
    }
}

// Make functions globally available immediately (not waiting for DOMContentLoaded)
globalThis.openShiftModal = openShiftModal;
globalThis.closeShiftModal = closeShiftModal;
globalThis.openAvailabilityModal = openAvailabilityModal;
globalThis.closeAvailabilityModal = closeAvailabilityModal;
globalThis.deleteShiftHandler = deleteShiftHandler;
globalThis.deleteAvailability = deleteAvailability;
globalThis.navigateAvailabilityCalendar = navigateAvailabilityCalendar;
globalThis.toggleAdvancedOptions = toggleAdvancedOptions;
globalThis.switchTab = switchTab;

