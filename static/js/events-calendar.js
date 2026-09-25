// EUC Young Adults - Interactive Events Calendar & RSVP Engine
(function() {
    'use strict';

    // State
    let events = Array.isArray(window.EVENTS_DATA) ? [...window.EVENTS_DATA] : [];
    let currentCategory = 'all';
    let searchQuery = '';
    let selectedDate = null; // YYYY-MM-DD or null
    let viewMode = 'calendar'; // 'calendar' or 'list'
    
    // Calendar Month Navigation State
    // Default to the month of the first upcoming event or current date
    const initialDate = events.length > 0 && events[0].date ? new Date(events[0].date + 'T00:00:00') : new Date();
    let currentMonth = initialDate.getMonth();
    let currentYear = initialDate.getFullYear();

    // Local Storage Key for user's RSVPs
    const RSVP_STORAGE_KEY = 'euc_ya_user_rsvps';
    
    function getUserRsvps() {
        try {
            return JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveUserRsvp(eventId, details) {
        const rsvps = getUserRsvps();
        rsvps[eventId] = details;
        localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(rsvps));
        if (details.email) localStorage.setItem('euc_user_email', details.email);
        if (details.name) localStorage.setItem('euc_user_name', details.name);
        if (details.phone) localStorage.setItem('euc_user_phone', details.phone);
    }

    function removeUserRsvp(eventId) {
        const rsvps = getUserRsvps();
        delete rsvps[eventId];
        localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(rsvps));
    }

    // Category styling & labels
    const CATEGORIES = {
        all: { label: 'All Gatherings', bg: 'bg-zinc-900 text-white', dot: 'bg-zinc-400' },
        gathering: { label: 'Tuesday Gathering', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40', dot: 'bg-purple-500' },
        prayer: { label: 'Worship & Prayer', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40', dot: 'bg-blue-500' },
        fellowship: { label: 'Tribal Fellowship', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40', dot: 'bg-amber-500' },
        service: { label: 'City Outreach', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40', dot: 'bg-emerald-500' },
        retreat: { label: 'Retreat & Vision', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40', dot: 'bg-rose-500' },
    };

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // DOM Elements
    const calendarSection = document.getElementById('calendar-section');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarDaysGrid = document.getElementById('calendar-days-grid');
    const calPrevBtn = document.getElementById('cal-prev-btn');
    const calNextBtn = document.getElementById('cal-next-btn');
    const calTodayBtn = document.getElementById('cal-today-btn');
    const dateFilterBanner = document.getElementById('date-filter-banner');
    const filterDateText = document.getElementById('filter-date-text');
    const clearDateFilterBtn = document.getElementById('clear-date-filter');
    const eventsListGrid = document.getElementById('events-list-grid');
    const emptyState = document.getElementById('empty-state');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const searchInput = document.getElementById('search-input');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const eventsCountBadge = document.getElementById('events-count-badge');
    const toggleCalendarBtn = document.getElementById('toggle-calendar-view');
    const toggleCardsBtn = document.getElementById('toggle-cards-view');

    // RSVP Modal Elements
    const rsvpModal = document.getElementById('rsvp-modal');
    const closeRsvpModalBtn = document.getElementById('close-rsvp-modal');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpFormContainer = document.getElementById('rsvp-form-container');
    const rsvpSuccessContainer = document.getElementById('rsvp-success-container');
    const rsvpErrorMsg = document.getElementById('rsvp-error-msg');
    const successDoneBtn = document.getElementById('success-done-btn');
    const btnAddGcal = document.getElementById('btn-add-gcal');
    const btnDownloadIcs = document.getElementById('btn-download-ics');

    // Cancel RSVP Modal Elements
    const cancelRsvpModal = document.getElementById('cancel-rsvp-modal');
    const closeCancelModalBtn = document.getElementById('close-cancel-modal');
    const cancelRsvpForm = document.getElementById('cancel-rsvp-form');
    const cancelErrorMsg = document.getElementById('cancel-error-msg');

    let activeModalEvent = null;

    // Helper: format date string "YYYY-MM-DD" into readable format
    function formatDateParts(dateStr) {
        if (!dateStr) return { month: 'TBD', day: '--', weekday: '', full: '' };
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return {
            month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
            day: d.getDate(),
            weekday: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
            full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        };
    }

    // Helper: generate Google Calendar URL
    function generateGoogleCalendarUrl(event) {
        if (!event) return '#';
        const title = encodeURIComponent(event.title || 'EUC Young Adults Gathering');
        const details = encodeURIComponent((event.description || '') + '\n\nMore info: https://eucya.org/events');
        const location = encodeURIComponent(event.location || 'Silver Spring, MD');
        
        // Parse date and time to ISO
        const dateClean = (event.date || '').replace(/-/g, '');
        // Default start 19:00 (7 PM), end 21:00 (9 PM)
        let startTime = '190000';
        let endTime = '210000';
        if (event.time && event.time.includes('AM')) {
            startTime = '100000';
            endTime = '130000';
        }
        const datesParam = `${dateClean}T${startTime}/${dateClean}T${endTime}`;

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
    }

    // Helper: generate and trigger .ics file download
    function downloadIcsFile(event) {
        if (!event) return;
        const dateClean = (event.date || '').replace(/-/g, '');
        const startTime = event.time && event.time.includes('AM') ? '100000' : '190000';
        const endTime = event.time && event.time.includes('AM') ? '130000' : '210000';
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//EUC Young Adults//Community Events Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:event-${event.id}-${Date.now()}@eucya.org`,
            `DTSTAMP:${now}`,
            `DTSTART:${dateClean}T${startTime}`,
            `DTEND:${dateClean}T${endTime}`,
            `SUMMARY:${(event.title || '').replace(/[,;]/g, ' ')}`,
            `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
            `LOCATION:${(event.location || '').replace(/[,;]/g, ' ')}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${(event.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Filter Events based on active filters
    function getFilteredEvents() {
        return events.filter(evt => {
            // Category filter
            if (currentCategory !== 'all' && evt.category !== currentCategory) {
                return false;
            }
            // Date filter
            if (selectedDate && evt.date !== selectedDate) {
                return false;
            }
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = (evt.title || '').toLowerCase().includes(q);
                const descMatch = (evt.description || '').toLowerCase().includes(q);
                const locMatch = (evt.location || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !locMatch) return false;
            }
            return true;
        });
    }

    // Render Month Calendar Grid
    function renderCalendar() {
        if (!calendarMonthYear || !calendarDaysGrid) return;

        calendarMonthYear.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        const today = new Date();
        const isCurrentMonthToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
        const todayDateNum = today.getDate();

        calendarDaysGrid.innerHTML = '';

        // Previous Month overflow days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const cell = document.createElement('div');
            cell.className = 'min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl bg-zinc-50/50 dark:bg-studio-950/30 text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none';
            cell.innerHTML = `<span>${dayNum}</span>`;
            calendarDaysGrid.appendChild(cell);
        }

        // Current Month days
        for (let day = 1; day <= daysInMonth; day++) {
            const mStr = String(currentMonth + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateKey = `${currentYear}-${mStr}-${dStr}`;

            const dayEvents = events.filter(e => {
                if (e.date !== dateKey) return false;
                if (currentCategory !== 'all' && e.category !== currentCategory) return false;
                return true;
            });

            const isToday = isCurrentMonthToday && day === todayDateNum;
            const isSelected = selectedDate === dateKey;
            const hasEvents = dayEvents.length > 0;

            const cell = document.createElement('div');
            cell.className = `min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl transition-all relative flex flex-col justify-between ${
                isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-sm'
                    : hasEvents
                    ? 'bg-white dark:bg-studio-800/90 border border-zinc-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer shadow-xs'
                    : 'bg-zinc-50 dark:bg-studio-900/40 border border-transparent'
            }`;

            // Day Number Header
            let dayHeaderHtml = `
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold ${
                        isToday 
                            ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center -ml-0.5' 
                            : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                    }">${day}</span>
                    ${dayEvents.length > 1 ? `<span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-studio-700 text-zinc-500">${dayEvents.length}</span>` : ''}
                </div>
            `;

            // Events indicators inside cell
            let eventsIndicatorHtml = '';
            if (hasEvents) {
                eventsIndicatorHtml = `
                    <div class="mt-1 space-y-1 overflow-hidden">
                        ${dayEvents.slice(0, 2).map(e => {
                            const cat = CATEGORIES[e.category] || CATEGORIES.gathering;
                            return `
                                <div class="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold truncate ${cat.badge || 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'}">
                                    ${e.title}
                                </div>
                            `;
                        }).join('')}
                        ${dayEvents.length > 2 ? `<div class="text-[9px] text-zinc-400 font-bold pl-1">+${dayEvents.length - 2} more</div>` : ''}
                    </div>
                `;
            }

            cell.innerHTML = dayHeaderHtml + eventsIndicatorHtml;

            if (hasEvents) {
                cell.addEventListener('click', () => {
                    if (selectedDate === dateKey) {
                        selectedDate = null;
                    } else {
                        selectedDate = dateKey;
                    }
                    updateDateFilterBanner();
                    renderCalendar();
                    renderEventCards();
                });
            }

            calendarDaysGrid.appendChild(cell);
        }

        // Next Month overflow days to complete 35 or 42 grid cells
        const totalRendered = firstDayOfMonth + daysInMonth;
        const totalCells = totalRendered > 35 ? 42 : 35;
        const nextDays = totalCells - totalRendered;
        for (let j = 1; j <= nextDays; j++) {
            const cell = document.createElement('div');
            cell.className = 'min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl bg-zinc-50/50 dark:bg-studio-950/30 text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none';
            cell.innerHTML = `<span>${j}</span>`;
            calendarDaysGrid.appendChild(cell);
        }
    }

    // Update the banner that appears when a user clicks a day on the calendar
    function updateDateFilterBanner() {
        if (!dateFilterBanner || !filterDateText) return;
        if (selectedDate) {
            const parts = formatDateParts(selectedDate);
            filterDateText.textContent = `${parts.weekday}, ${parts.month} ${parts.day}`;
            dateFilterBanner.classList.remove('hidden');
        } else {
            dateFilterBanner.classList.add('hidden');
        }
    }

    // Render Agenda / Event Cards
    function renderEventCards() {
        if (!eventsListGrid) return;
        const filtered = getFilteredEvents();
        const userRsvps = getUserRsvps();

        if (eventsCountBadge) {
            eventsCountBadge.textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'}`;
        }

        if (filtered.length === 0) {
            eventsListGrid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        eventsListGrid.innerHTML = filtered.map(evt => {
            const dateParts = formatDateParts(evt.date);
            const cat = CATEGORIES[evt.category] || CATEGORIES.gathering;
            const isUserRsvpd = !!userRsvps[evt.id];
            const myRsvp = userRsvps[evt.id] || null;

            // Capacity logic
            const totalRsvp = evt.rsvp_count || 0;
            const capacity = evt.capacity || null;
            const isFull = capacity ? totalRsvp >= capacity : false;
            const spotsLeft = capacity ? Math.max(0, capacity - totalRsvp) : null;
            const percentFilled = capacity ? Math.min(100, Math.round((totalRsvp / capacity) * 100)) : null;

            return `
                <article class="relative flex flex-col bg-white dark:bg-studio-900 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    
                    <!-- Card Top Accent & Category -->
                    <div class="p-6 pb-4 flex items-start justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <!-- Large Date Badge -->
                            <div class="w-14 h-16 rounded-2xl bg-zinc-100 dark:bg-studio-800 border border-zinc-200/80 dark:border-white/5 flex flex-col items-center justify-center shrink-0 text-center shadow-xs">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 leading-none mb-0.5">${dateParts.month}</span>
                                <span class="text-2xl font-black text-zinc-900 dark:text-white leading-none">${dateParts.day}</span>
                                <span class="text-[9px] font-semibold text-zinc-400 leading-none mt-0.5">${dateParts.weekday}</span>
                            </div>

                            <div>
                                <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1.5 border ${cat.badge || 'bg-blue-100 text-blue-800 border-blue-200'}">
                                    ${cat.label || evt.category}
                                </span>
                                <h3 class="text-lg font-black text-zinc-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    ${evt.title}
                                </h3>
                            </div>
                        </div>

                        ${evt.is_featured ? `
                            <span class="shrink-0 p-1.5 rounded-xl bg-amber-500/10 text-amber-500" title="Featured Gathering">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            </span>
                        ` : ''}
                    </div>

                    <!-- Date, Time, Location -->
                    <div class="px-6 py-2 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>${evt.time}</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <a href="https://maps.google.com/?q=${encodeURIComponent(evt.location)}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 dark:hover:text-blue-400 underline decoration-zinc-300 dark:decoration-zinc-700 transition-colors">
                                ${evt.location}
                            </a>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="px-6 py-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 flex-1 leading-relaxed">
                        ${evt.description}
                    </div>

                    <!-- Capacity / RSVP Progress Bar -->
                    <div class="px-6 py-2">
                        <div class="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            <span class="flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}"></span>
                                <strong>${totalRsvp}</strong> attending
                            </span>
                            ${capacity ? `
                                <span>${isFull ? '<strong class="text-red-500">Event Full</strong>' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}</span>
                            ` : `
                                <span class="text-zinc-400">Open Community</span>
                            `}
                        </div>
                        ${capacity ? `
                            <div class="w-full h-1.5 bg-zinc-100 dark:bg-studio-800 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}" style="width: ${percentFilled}%"></div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Card Actions -->
                    <div class="p-6 pt-3 mt-auto border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-3">
                        ${isUserRsvpd ? `
                            <div class="flex items-center gap-2">
                                <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                                    RSVP'd ${myRsvp && myRsvp.guests_count ? `(+${myRsvp.guests_count})` : ''}
                                </span>
                                <button type="button" data-action="cancel-rsvp" data-event-id="${evt.id}" class="text-[11px] text-zinc-400 hover:text-red-500 underline transition-colors">
                                    Cancel
                                </button>
                            </div>
                        ` : isFull ? `
                            <span class="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-studio-800 text-zinc-400 text-xs font-bold cursor-not-allowed">
                                Registration Closed
                            </span>
                        ` : `
                            <button type="button" data-action="open-rsvp" data-event-id="${evt.id}" class="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 touch-manipulation">
                                <span>RSVP Now</span>
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        `}

                        <!-- Add to Calendar Link / Action -->
                        <div class="relative group/cal">
                            <button type="button" title="Add to Calendar" class="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-studio-800 text-zinc-600 dark:text-zinc-400 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </button>
                            <div class="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-studio-850 rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 p-1.5 hidden group-hover/cal:block z-20">
                                <a href="${generateGoogleCalendarUrl(evt)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                                    Google Calendar
                                </a>
                                <button type="button" data-action="download-ics" data-event-id="${evt.id}" class="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                                    Apple / iCal (.ics)
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Attach event listeners for dynamically created buttons
        eventsListGrid.querySelectorAll('[data-action="open-rsvp"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-event-id'), 10);
                openRsvpModal(id);
            });
        });

        eventsListGrid.querySelectorAll('[data-action="cancel-rsvp"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-event-id'), 10);
                openCancelModal(id);
            });
        });

        eventsListGrid.querySelectorAll('[data-action="download-ics"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-event-id'), 10);
                const evt = events.find(e => e.id === id);
                if (evt) downloadIcsFile(evt);
            });
        });
    }

    // Modal Control: Open RSVP
    function openRsvpModal(eventId) {
        const evt = events.find(e => e.id === eventId);
        if (!evt) return;

        activeModalEvent = evt;
        document.getElementById('rsvp-event-id').value = evt.id;
        document.getElementById('modal-event-title').textContent = evt.title;
        
        const cat = CATEGORIES[evt.category] || CATEGORIES.gathering;
        const catBadge = document.getElementById('modal-category-badge');
        catBadge.textContent = cat.label || evt.category;
        catBadge.className = `inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${cat.badge || 'bg-blue-100 text-blue-800'}`;

        const parts = formatDateParts(evt.date);
        document.querySelector('#modal-event-date span').textContent = `${parts.weekday}, ${parts.month} ${parts.day}`;
        document.querySelector('#modal-event-time span').textContent = evt.time;
        document.querySelector('#modal-event-location span').textContent = evt.location;

        // Pre-fill user data if stored
        document.getElementById('rsvp-name').value = localStorage.getItem('euc_user_name') || '';
        document.getElementById('rsvp-email').value = localStorage.getItem('euc_user_email') || '';
        document.getElementById('rsvp-phone').value = localStorage.getItem('euc_user_phone') || '';
        document.getElementById('rsvp-guests').value = '0';
        document.getElementById('rsvp-notes').value = '';

        if (rsvpErrorMsg) {
            rsvpErrorMsg.classList.add('hidden');
            rsvpErrorMsg.textContent = '';
        }

        rsvpFormContainer.classList.remove('hidden');
        rsvpSuccessContainer.classList.add('hidden');
        rsvpModal.classList.remove('hidden');
    }

    function closeRsvpModal() {
        rsvpModal.classList.add('hidden');
        activeModalEvent = null;
    }

    // Modal Control: Open Cancel RSVP
    function openCancelModal(eventId) {
        const evt = events.find(e => e.id === eventId);
        if (!evt) return;

        document.getElementById('cancel-event-id').value = evt.id;
        const userRsvps = getUserRsvps();
        const myRsvp = userRsvps[eventId];
        document.getElementById('cancel-email').value = (myRsvp && myRsvp.email) || localStorage.getItem('euc_user_email') || '';
        
        if (cancelErrorMsg) {
            cancelErrorMsg.classList.add('hidden');
            cancelErrorMsg.textContent = '';
        }

        cancelRsvpModal.classList.remove('hidden');
    }

    function closeCancelModal() {
        cancelRsvpModal.classList.add('hidden');
    }

    // Handle RSVP Form Submit
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventId = parseInt(document.getElementById('rsvp-event-id').value, 10);
            const name = document.getElementById('rsvp-name').value.trim();
            const email = document.getElementById('rsvp-email').value.trim();
            const phone = document.getElementById('rsvp-phone').value.trim();
            const guestsCount = parseInt(document.getElementById('rsvp-guests').value, 10) || 0;
            const notes = document.getElementById('rsvp-notes').value.trim();

            const submitBtn = document.getElementById('submit-rsvp-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Confirming...
            `;

            try {
                const res = await fetch(`/api/events/${eventId}/rsvp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, guests_count: guestsCount, notes })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to submit RSVP.');
                }

                // Save to localStorage
                saveUserRsvp(eventId, { name, email, phone, guests_count: guestsCount });

                // Update local events array
                if (data.event) {
                    const idx = events.findIndex(e => e.id === eventId);
                    if (idx >= 0) events[idx] = data.event;
                }

                // Update quick stats
                const totalRsvpsCount = events.reduce((acc, e) => acc + (e.rsvp_count || 0), 0);
                const statRsvps = document.getElementById('stat-total-rsvps');
                if (statRsvps) statRsvps.textContent = totalRsvpsCount;

                // Transition to success screen inside modal
                if (activeModalEvent) {
                    document.getElementById('success-event-title').textContent = activeModalEvent.title;
                    const parts = formatDateParts(activeModalEvent.date);
                    document.getElementById('success-event-datetime').textContent = `${parts.full} • ${activeModalEvent.time}`;
                    document.getElementById('success-event-location').textContent = activeModalEvent.location;

                    // Setup Calendar Buttons
                    btnAddGcal.href = generateGoogleCalendarUrl(activeModalEvent);
                    btnDownloadIcs.onclick = () => downloadIcsFile(activeModalEvent);
                }

                rsvpFormContainer.classList.add('hidden');
                rsvpSuccessContainer.classList.remove('hidden');

                // Re-render views
                renderCalendar();
                renderEventCards();

            } catch (err) {
                if (rsvpErrorMsg) {
                    rsvpErrorMsg.textContent = err.message || 'An error occurred. Please try again.';
                    rsvpErrorMsg.classList.remove('hidden');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span>Confirm RSVP</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                `;
            }
        });
    }

    // Handle Cancel RSVP Form Submit
    if (cancelRsvpForm) {
        cancelRsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventId = parseInt(document.getElementById('cancel-event-id').value, 10);
            const email = document.getElementById('cancel-email').value.trim();

            const submitBtn = document.getElementById('submit-cancel-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cancelling...';

            try {
                const res = await fetch(`/api/events/${eventId}/cancel-rsvp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to cancel RSVP.');
                }

                removeUserRsvp(eventId);

                // Update local events array
                if (data.event) {
                    const idx = events.findIndex(e => e.id === eventId);
                    if (idx >= 0) events[idx] = data.event;
                }

                closeCancelModal();
                renderCalendar();
                renderEventCards();

            } catch (err) {
                if (cancelErrorMsg) {
                    cancelErrorMsg.textContent = err.message || 'Error cancelling RSVP.';
                    cancelErrorMsg.classList.remove('hidden');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm Cancellation';
            }
        });
    }

    // Event Listeners for UI Controls
    if (closeRsvpModalBtn) closeRsvpModalBtn.addEventListener('click', closeRsvpModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeRsvpModal);
    if (successDoneBtn) successDoneBtn.addEventListener('click', closeRsvpModal);
    if (closeCancelModalBtn) closeCancelModalBtn.addEventListener('click', closeCancelModal);

    // Close on background click
    if (rsvpModal) {
        rsvpModal.addEventListener('click', (e) => {
            if (e.target === rsvpModal) closeRsvpModal();
        });
    }
    if (cancelRsvpModal) {
        cancelRsvpModal.addEventListener('click', (e) => {
            if (e.target === cancelRsvpModal) closeCancelModal();
        });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRsvpModal();
            closeCancelModal();
        }
    });

    // Calendar Month Navigation
    if (calPrevBtn) {
        calPrevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (calNextBtn) {
        calNextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    if (calTodayBtn) {
        calTodayBtn.addEventListener('click', () => {
            const today = new Date();
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            renderCalendar();
        });
    }

    // Clear Date Filter
    if (clearDateFilterBtn) {
        clearDateFilterBtn.addEventListener('click', () => {
            selectedDate = null;
            updateDateFilterBanner();
            renderCalendar();
            renderEventCards();
        });
    }

    // Category Filter Buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.className = 'category-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-studio-800';
            });
            btn.className = 'category-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm';
            currentCategory = btn.getAttribute('data-category');
            renderCalendar();
            renderEventCards();
        });
    });

    // Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderEventCards();
        });
    }

    // Reset All Filters Button
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            currentCategory = 'all';
            searchQuery = '';
            selectedDate = null;
            if (searchInput) searchInput.value = '';
            categoryBtns.forEach(b => {
                if (b.getAttribute('data-category') === 'all') {
                    b.className = 'category-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm';
                } else {
                    b.className = 'category-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-studio-800';
                }
            });
            updateDateFilterBanner();
            renderCalendar();
            renderEventCards();
        });
    }

    // View Mode Toggle (Calendar vs List Only)
    if (toggleCalendarBtn && toggleCardsBtn && calendarSection) {
        toggleCalendarBtn.addEventListener('click', () => {
            calendarSection.classList.remove('hidden');
            toggleCalendarBtn.className = 'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-studio-700 text-zinc-900 dark:text-white shadow-xs';
            toggleCardsBtn.className = 'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white';
        });

        toggleCardsBtn.addEventListener('click', () => {
            calendarSection.classList.add('hidden');
            toggleCardsBtn.className = 'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-studio-700 text-zinc-900 dark:text-white shadow-xs';
            toggleCalendarBtn.className = 'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white';
        });
    }

    // Initial render
    renderCalendar();
    renderEventCards();

})();
