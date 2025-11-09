/**
 * Shift management logic
 */

// Detect if we're running on frontend dev server (port 3000) and set API base accordingly
const API_BASE = window.location.port === '3000' ? 'http://localhost:8000' : '';
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
        const [year, month, day] = date.split('-');
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
    const deleteBtn = document.getElementById('delete-shift-btn');
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
            
            // Refresh calendar
            if (window.refreshCalendar) {
                window.refreshCalendar();
            }
        } catch (error) {
            alert('Error saving shift: ' + error.message);
        }
    });
    
    // Handle delete
    deleteBtn.addEventListener('click', async () => {
        const shiftId = document.getElementById('shift-id').value;
        if (!shiftId) return;
        
        if (confirm('Are you sure you want to delete this shift?')) {
            try {
                await deleteShift(parseInt(shiftId));
                closeShiftModal();
                
                // Refresh calendar
                if (window.refreshCalendar) {
                    window.refreshCalendar();
                }
            } catch (error) {
                alert('Error deleting shift: ' + error.message);
            }
        }
    });
    
    // Close modal on X click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeShiftModal);
    }
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('shift-modal');
        if (e.target === modal) {
            closeShiftModal();
        }
    });
});

// Make functions globally available
window.openShiftModal = openShiftModal;
window.closeShiftModal = closeShiftModal;

