/**
 * TaskFlow – Smart To-Do List
 * JavaScript Logic & DOM Handling
 * 
 * Features:
 *  1. Form input validation & error prevention (no empty/space-only tasks)
 *  2. Add, Edit, Delete, Toggle Complete CRUD operations
 *  3. LocalStorage persistence for browser memory
 *  4. HTML5 Drag-and-Drop task reordering
 *  5. Web Notifications & Audio chime for task deadlines
 *  6. Filter tabs (All, Pending, Completed) & Live Search
 *  7. Dynamic task counters & progress percentage meter
 *  8. Clear All with user confirmation modal
 *  9. College Practical Lab Documentation & GitHub Pages guide
 */

// ==========================================================================
// 1. STATE VARIABLES & CONFIGURATION
// ==========================================================================

// Storage key name for LocalStorage
const STORAGE_KEY = 'taskflow_tasks_v1';

// In-memory array of task objects
let tasks = [];

// Current active filter: 'all', 'pending', or 'completed'
let currentFilter = 'all';

// Current search keyword
let searchQuery = '';

// Drag-and-drop tracking variable
let draggedTaskId = null;

// Track which tasks have already triggered an alert to avoid repeated beeps
const notifiedTaskIds = new Set();

// Motivational quotes array for students & productivity
const motivationalQuotes = [
  "“Small daily improvements over time lead to stunning results.”",
  "“Action is the foundational key to all success.”",
  "“Focus on being productive instead of busy.”",
  "“Done is better than perfect. Keep moving forward!”",
  "“Your future is created by what you do today, not tomorrow.”",
  "“Organize your thoughts, plan your tasks, conquer your day.”"
];

// Sample demo tasks for quick college practical demonstration
const sampleTasks = [
  {
    id: 'demo-1',
    text: 'Review Computer Networks OSI & TCP/IP Model',
    completed: false,
    priority: 'high',
    category: 'academic',
    deadline: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16),
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'demo-2',
    text: 'Submit TaskFlow UI practical micro-project report',
    completed: false,
    priority: 'high',
    category: 'project',
    deadline: new Date(Date.now() + 3600000 * 24).toISOString().slice(0, 16),
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: 'demo-3',
    text: 'Practice 5 viva questions on LocalStorage & DOM Events',
    completed: true,
    priority: 'medium',
    category: 'academic',
    deadline: '',
    createdAt: Date.now() - 3600000 * 8
  }
];

// ==========================================================================
// 2. DOM ELEMENT REFERENCES
// ==========================================================================
// Form inputs
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const deadlineInput = document.getElementById('deadlineInput');
const inputErrorMsg = document.getElementById('inputErrorMsg');

// Task List container & Empty state
const taskListContainer = document.getElementById('taskList');
const emptyStateContainer = document.getElementById('emptyState');

// Counters & Progress
const totalCountEl = document.getElementById('totalCount');
const pendingCountEl = document.getElementById('pendingCount');
const completedCountEl = document.getElementById('completedCount');
const progressPercentEl = document.getElementById('progressPercent');
const progressFillEl = document.getElementById('progressFill');

// Filter Tab counts
const filterAllCount = document.getElementById('filterAllCount');
const filterPendingCount = document.getElementById('filterPendingCount');
const filterCompletedCount = document.getElementById('filterCompletedCount');

// Search & Filter controls
const searchInput = document.getElementById('searchInput');
const filterTabBtns = document.querySelectorAll('.tab-btn');
const sortSelect = document.getElementById('sortSelect');

// Buttons & Actions
const clearAllBtn = document.getElementById('clearAllBtn');
const loadSamplesBtn = document.getElementById('loadSamplesBtn');
const enableAlertsBtn = document.getElementById('enableAlertsBtn');
const quoteTextEl = document.getElementById('quoteText');
const refreshQuoteBtn = document.getElementById('refreshQuoteBtn');

// Modals
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const editCategorySelect = document.getElementById('editCategorySelect');
const editDeadlineInput = document.getElementById('editDeadlineInput');
const editErrorMsg = document.getElementById('editErrorMsg');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
let currentlyEditingId = null;

const labModal = document.getElementById('labModal');
const openLabModalBtn = document.getElementById('openLabModalBtn');
const closeLabModalBtn = document.getElementById('closeLabModalBtn');

const deployModal = document.getElementById('deployModal');
const openDeployModalBtn = document.getElementById('openDeployModalBtn');
const closeDeployModalBtn = document.getElementById('closeDeployModalBtn');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// ==========================================================================
// 3. INITIALIZATION & LOCALSTORAGE MANAGEMENT
// ==========================================================================

// Run when the browser loads the page
document.addEventListener('DOMContentLoaded', () => {
  loadTasksFromStorage();
  initMotivationalQuote();
  checkNotificationStatus();
  setupEventListeners();
  renderTasks();
  
  // Periodic deadline checker every 30 seconds
  setInterval(checkDeadlinesAndNotify, 30000);
});

/**
 * Loads tasks from browser's LocalStorage.
 * If no tasks exist, initial empty array is loaded.
 */
function loadTasksFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      tasks = JSON.parse(stored);
      if (!Array.isArray(tasks)) tasks = [];
    } else {
      // First time user: provide sample project tasks for easy testing
      tasks = [...sampleTasks];
      saveTasksToStorage();
    }
  } catch (error) {
    console.error('Error reading from LocalStorage:', error);
    tasks = [];
  }
}

/**
 * Persists the current tasks array to LocalStorage.
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving to LocalStorage:', error);
    showToast('Failed to save to local storage. Storage might be full.', 'danger');
  }
}

// ==========================================================================
// 4. TASK CREATION, VALIDATION & CRUD OPERATIONS
// ==========================================================================

/**
 * Handles adding a new task with strict input validation.
 * Demonstrates input validation required for college micro-projects.
 */
function handleAddTask() {
  const rawText = taskInput.value;
  const trimmedText = rawText.trim();

  // REQUIREMENT 2 & 3: Do not allow empty tasks or tasks containing only spaces.
  if (trimmedText === '') {
    // Show validation error message
    inputErrorMsg.textContent = 'Task description cannot be empty or contain only spaces.';
    inputErrorMsg.classList.add('show');
    
    // Add visual shake animation to input box
    taskInput.classList.add('input-error');
    taskInput.focus();
    
    // Remove shake class after animation completes
    setTimeout(() => {
      taskInput.classList.remove('input-error');
    }, 450);
    return;
  }

  // Hide any existing error message
  inputErrorMsg.classList.remove('show');

  // Create task data object
  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    text: trimmedText,
    completed: false,
    priority: prioritySelect.value || 'medium',
    category: categorySelect.value || 'academic',
    deadline: deadlineInput.value || '',
    createdAt: Date.now()
  };

  // Add to top of list
  tasks.unshift(newTask);

  // Save to browser memory
  saveTasksToStorage();

  // Reset form inputs
  taskInput.value = '';
  deadlineInput.value = '';
  prioritySelect.value = 'medium';
  taskInput.focus();

  // REQUIREMENT 10: Display a success message when a task is added.
  showToast('Task added successfully! ✨', 'success');

  // Re-render UI
  renderTasks();
}

/**
 * Toggles a task between completed and pending.
 * @param {string} taskId 
 */
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  
  if (task.completed) {
    showToast('Great job! Task marked completed! 🎉', 'success');
  } else {
    showToast('Task marked as pending.', 'info');
  }
  
  renderTasks();
}

/**
 * Deletes a single task by ID.
 * @param {string} taskId 
 */
function deleteTask(taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  tasks.splice(taskIndex, 1);
  saveTasksToStorage();
  showToast('Task deleted successfully.', 'info');
  renderTasks();
}

/**
 * Opens the Edit Task modal with populated values.
 * @param {string} taskId 
 */
function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  currentlyEditingId = taskId;
  editTaskInput.value = task.text;
  editPrioritySelect.value = task.priority || 'medium';
  editCategorySelect.value = task.category || 'academic';
  editDeadlineInput.value = task.deadline || '';
  editErrorMsg.classList.remove('show');

  editModal.classList.add('open');
  editTaskInput.focus();
}

/**
 * Saves edited task changes with validation.
 */
function handleSaveEdit() {
  if (!currentlyEditingId) return;

  const trimmedText = editTaskInput.value.trim();
  if (trimmedText === '') {
    editErrorMsg.textContent = 'Task description cannot be empty.';
    editErrorMsg.classList.add('show');
    editTaskInput.classList.add('input-error');
    setTimeout(() => editTaskInput.classList.remove('input-error'), 450);
    return;
  }

  const task = tasks.find(t => t.id === currentlyEditingId);
  if (task) {
    task.text = trimmedText;
    task.priority = editPrioritySelect.value;
    task.category = editCategorySelect.value;
    task.deadline = editDeadlineInput.value;
    
    saveTasksToStorage();
    showToast('Task updated successfully! ✏️', 'success');
    closeEditModal();
    renderTasks();
  }
}

function closeEditModal() {
  editModal.classList.remove('open');
  currentlyEditingId = null;
}

/**
 * Clears all tasks after confirmation.
 */
function clearAllTasks() {
  tasks = [];
  saveTasksToStorage();
  showToast('All tasks have been cleared.', 'info');
  confirmModal.classList.remove('open');
  renderTasks();
}

// ==========================================================================
// 5. RENDERING & UI UPDATING
// ==========================================================================

/**
 * Main render function: filters, sorts, updates counters, and renders task cards.
 */
function renderTasks() {
  // 1. Update status counters
  updateCounters();

  // 2. Filter tasks based on selected tab and search bar
  let filtered = tasks.filter(task => {
    // Status filter
    if (currentFilter === 'pending' && task.completed) return false;
    if (currentFilter === 'completed' && !task.completed) return false;
    
    // Keyword search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const textMatch = task.text.toLowerCase().includes(query);
      const catMatch = task.category.toLowerCase().includes(query);
      return textMatch || catMatch;
    }
    return true;
  });

  // 3. Sort tasks if user picked a sorting option
  const sortMode = sortSelect ? sortSelect.value : 'default';
  if (sortMode === 'deadline') {
    filtered.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  } else if (sortMode === 'priority') {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  } else if (sortMode === 'newest') {
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  // 4. Handle Empty State
  if (filtered.length === 0) {
    taskListContainer.innerHTML = '';
    emptyStateContainer.classList.add('show');
    
    // Provide friendly context-specific message
    const emptyTitleEl = emptyStateContainer.querySelector('.empty-title');
    const emptySubEl = emptyStateContainer.querySelector('.empty-subtitle');
    
    if (tasks.length === 0) {
      emptyTitleEl.textContent = 'No tasks yet!';
      emptySubEl.textContent = 'Your daily schedule is completely clear. Add your first task above or load college demo tasks.';
    } else if (currentFilter === 'pending') {
      emptyTitleEl.textContent = 'All Caught Up! 🎉';
      emptySubEl.textContent = 'You have zero pending tasks. Outstanding work maintaining flow!';
    } else if (currentFilter === 'completed') {
      emptyTitleEl.textContent = 'No completed tasks';
      emptySubEl.textContent = 'Check off tasks as you finish them to track your accomplishments.';
    } else {
      emptyTitleEl.textContent = 'No matching tasks found';
      emptySubEl.textContent = `No task found matching "${searchQuery}". Try another keyword or clear search.`;
    }
    return;
  }

  // Hide empty state if there are tasks to display
  emptyStateContainer.classList.remove('show');
  taskListContainer.innerHTML = '';

  // 5. Create DOM cards for each task
  filtered.forEach((task, index) => {
    const card = createTaskCardElement(task, index);
    taskListContainer.appendChild(card);
  });
}

/**
 * Creates the DOM element for an individual task card.
 * @param {Object} task 
 * @param {number} index 
 * @returns {HTMLElement}
 */
function createTaskCardElement(task, index) {
  const card = document.createElement('div');
  card.className = `task-card ${task.completed ? 'completed-task' : ''}`;
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);
  card.setAttribute('data-index', index.toString());

  // Category labels with friendly emojis
  const categoryLabels = {
    academic: '📚 Academic',
    project: '💻 Project',
    personal: '🌿 Personal',
    urgent: '⚡ Urgent'
  };

  // Format deadline badge and overdue check
  let deadlineHTML = '';
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const isOverdue = !task.completed && deadlineDate.getTime() < Date.now();
    const formattedDate = formatDeadline(task.deadline);
    
    deadlineHTML = `
      <span class="meta-badge deadline-badge ${isOverdue ? 'overdue' : ''}" title="${task.deadline}">
        ⏰ ${isOverdue ? 'Overdue: ' : 'Due: '} ${formattedDate}
      </span>
    `;
  }

  // Priority badge
  const priorityClass = `priority-${task.priority}`;
  const priorityLabel = task.priority.toUpperCase();

  card.innerHTML = `
    <div class="task-left">
      <span class="drag-handle" title="Drag to reorder" aria-label="Drag handle">⋮⋮</span>
      <button type="button" class="custom-checkbox ${task.completed ? 'checked' : ''}" aria-label="Toggle completed status">
        ${task.completed ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-text">${escapeHTML(task.text)}</div>
        <div class="task-meta">
          <span class="meta-badge ${priorityClass}">● ${priorityLabel}</span>
          <span class="meta-badge category-tag">${categoryLabels[task.category] || task.category}</span>
          ${deadlineHTML}
        </div>
      </div>
    </div>
    <div class="task-actions">
      <button type="button" class="action-btn edit-btn" title="Edit Task" aria-label="Edit Task">
        ✏️
      </button>
      <button type="button" class="action-btn delete-btn" title="Delete Task" aria-label="Delete Task">
        🗑️
      </button>
    </div>
  `;

  // Attach event listeners to card interactive elements
  const checkboxBtn = card.querySelector('.custom-checkbox');
  checkboxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  });

  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(task.id);
  });

  const deleteBtn = card.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Smooth fade out before removing
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => deleteTask(task.id), 200);
  });

  // Attach Drag-and-Drop listeners
  attachDragEvents(card, task.id);

  return card;
}

/**
 * Updates all statistic counters and the progress bar.
 */
function updateCounters() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Stats boxes
  totalCountEl.textContent = total;
  pendingCountEl.textContent = pending;
  completedCountEl.textContent = completed;
  progressPercentEl.textContent = `${percentage}%`;

  // Progress fill bar width
  progressFillEl.style.width = `${percentage}%`;

  // Filter tabs count badges
  filterAllCount.textContent = total;
  filterPendingCount.textContent = pending;
  filterCompletedCount.textContent = completed;
}

// ==========================================================================
// 6. DRAG AND DROP SORTING (HTML5 DRAG API)
// ==========================================================================

/**
 * Attaches native HTML5 Drag and Drop event handlers to task cards.
 * Enables users to reorder tasks effortlessly.
 * @param {HTMLElement} card 
 * @param {string} taskId 
 */
function attachDragEvents(card, taskId) {
  card.addEventListener('dragstart', (e) => {
    draggedTaskId = taskId;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    draggedTaskId = null;
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!card.classList.contains('dragging')) {
      card.classList.add('drag-over');
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    
    const targetTaskId = card.getAttribute('data-id');
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    // Find indices
    const fromIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const toIndex = tasks.findIndex(t => t.id === targetTaskId);

    if (fromIndex !== -1 && toIndex !== -1) {
      // Reorder array
      const [movedTask] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, movedTask);

      // Save new order to LocalStorage
      saveTasksToStorage();
      showToast('Task order updated! ↕️', 'info');
      renderTasks();
    }
  });
}

// ==========================================================================
// 7. PUSH NOTIFICATIONS & DEADLINE REMINDERS
// ==========================================================================

/**
 * Checks Notification API support and updates the alert button text.
 */
function checkNotificationStatus() {
  if (!('Notification' in window)) {
    enableAlertsBtn.style.display = 'none';
    return;
  }

  if (Notification.permission === 'granted') {
    enableAlertsBtn.innerHTML = '🔔 Alerts Active';
    enableAlertsBtn.classList.remove('btn-secondary');
    enableAlertsBtn.classList.add('btn-accent');
  } else if (Notification.permission === 'denied') {
    enableAlertsBtn.innerHTML = '🔕 Alerts Blocked';
  } else {
    enableAlertsBtn.innerHTML = '🔔 Enable Alerts';
  }
}

/**
 * Requests browser permission for notifications.
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Your browser does not support Desktop Notifications.', 'warning');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    checkNotificationStatus();

    if (permission === 'granted') {
      showToast('Notifications enabled! You will be alerted for deadlines.', 'success');
      playChimeSound();
      
      // Send a test greeting notification
      new Notification('TaskFlow Active', {
        body: 'Deadline notifications are ready. We will keep you focused and on track!',
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>'
      });
    } else {
      showToast('Notification permission was not granted.', 'warning');
    }
  } catch (error) {
    console.error('Notification request error:', error);
  }
}

/**
 * Synthesizes a pleasant audio chime using the Web Audio API.
 * Does not require external audio assets!
 */
function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // High friendly bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio chime unsupported:', err);
  }
}

/**
 * Periodic deadline inspector: checks tasks and alerts if due or overdue.
 */
function checkDeadlinesAndNotify() {
  const now = Date.now();

  tasks.forEach(task => {
    if (task.completed || !task.deadline) return;

    const deadlineTime = new Date(task.deadline).getTime();
    const diffMinutes = Math.round((deadlineTime - now) / 60000);

    // Alert if deadline is within 15 minutes or overdue up to 1 hour
    if (diffMinutes <= 15 && diffMinutes >= -60 && !notifiedTaskIds.has(task.id)) {
      notifiedTaskIds.add(task.id);
      playChimeSound();

      const alertTitle = diffMinutes < 0 ? '⚠️ Task Deadline Overdue!' : '⏰ Upcoming Task Deadline!';
      const alertBody = diffMinutes < 0 
        ? `"${task.text}" was due ${Math.abs(diffMinutes)} minutes ago!`
        : `"${task.text}" is due in ${diffMinutes} minutes!`;

      // Show Desktop notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alertTitle, {
          body: alertBody,
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>'
        });
      }

      // Also trigger in-app toast
      showToast(`${alertTitle} ${alertBody}`, 'warning');
      
      // Refresh to update overdue visual badge
      renderTasks();
    }
  });
}

// ==========================================================================
// 8. TOAST NOTIFICATIONS & UTILITY HELPERS
// ==========================================================================

/**
 * Displays a non-intrusive toast alert in the bottom corner.
 * @param {string} message 
 * @param {'success'|'info'|'warning'|'danger'} type 
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    danger: '❌'
  };

  toast.innerHTML = `<span>${icons[type] || '•'}</span> <span>${escapeHTML(message)}</span>`;
  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after 3.2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

/**
 * Safe HTML string escaping to prevent XSS.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Formats ISO datetime string to user-friendly format (e.g. "Oct 20, 3:30 PM").
 * @param {string} dateStr 
 * @returns {string}
 */
function formatDeadline(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Displays a random motivational quote.
 */
function initMotivationalQuote() {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  quoteTextEl.textContent = motivationalQuotes[randomIndex];
}

// ==========================================================================
// 9. EVENT LISTENERS SETUP
// ==========================================================================

function setupEventListeners() {
  // Add task on button click
  addTaskBtn.addEventListener('click', handleAddTask);

  // Add task on pressing Enter key inside task input
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  });

  // Clear validation error when user starts typing
  taskInput.addEventListener('input', () => {
    if (inputErrorMsg.classList.contains('show')) {
      inputErrorMsg.classList.remove('show');
    }
  });

  // Filter Tabs
  filterTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Live Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTasks();
  });

  // Sort Selection
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderTasks();
    });
  }

  // Clear All Tasks Modal Trigger
  clearAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) {
      showToast('There are no tasks to clear.', 'info');
      return;
    }
    confirmModal.classList.add('open');
  });

  confirmDeleteBtn.addEventListener('click', clearAllTasks);
  cancelDeleteBtn.addEventListener('click', () => confirmModal.classList.remove('open'));

  // Edit Task Modal Buttons
  saveEditBtn.addEventListener('click', handleSaveEdit);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    }
  });

  // Quick Demo Samples Button
  loadSamplesBtn.addEventListener('click', () => {
    tasks = [...sampleTasks];
    saveTasksToStorage();
    showToast('Loaded college sample tasks! 🚀', 'success');
    renderTasks();
  });

  // Enable Notifications Button
  enableAlertsBtn.addEventListener('click', requestNotificationPermission);

  // Refresh Motivational Quote
  refreshQuoteBtn.addEventListener('click', initMotivationalQuote);

  // Documentation / Lab Manual Modal
  openLabModalBtn.addEventListener('click', () => labModal.classList.add('open'));
  closeLabModalBtn.addEventListener('click', () => labModal.classList.remove('open'));

  // GitHub Pages Deployment Modal
  openDeployModalBtn.addEventListener('click', () => deployModal.classList.add('open'));
  closeDeployModalBtn.addEventListener('click', () => deployModal.classList.remove('open'));

  // Close modals when clicking overlay backdrop
  [confirmModal, editModal, labModal, deployModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Tab switching inside Lab Documentation Modal
  const docTabBtns = document.querySelectorAll('.modal-tab-btn');
  docTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      docTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetSectionId = btn.getAttribute('data-target');
      document.querySelectorAll('.doc-section').forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(targetSectionId);
      if (activeSection) {
        activeSection.classList.add('active');
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [confirmModal, editModal, labModal, deployModal].forEach(modal => modal.classList.remove('open'));
    }
  });
}
