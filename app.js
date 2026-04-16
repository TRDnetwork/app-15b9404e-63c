import { setupRealtime, teardownRealtime } from './realtime.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Global state
let supabase = null;
let currentUser = null;
let tasks = [];
let currentFilter = 'all';
let currentPriorityFilter = 'all';

// DOM Elements
let appElement, loadingElement, errorBanner;

// Initialize the application
async function init() {
    try {
        appElement = document.getElementById('app');
        loadingElement = document.getElementById('loading');
        errorBanner = document.getElementById('credentials-error');
        
        // Check for Supabase credentials
        if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
            errorBanner.classList.add('show');
            return;
        }
        
        // Initialize Supabase client
        supabase = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON_KEY__);
        
        // Try to get current session (wrapped in try/catch for sandbox)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user || null;
        } catch (authError) {
            console.warn('Auth session check failed:', authError);
            currentUser = null;
        }
        
        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    currentUser = user;
                } catch (error) {
                    currentUser = session?.user || null;
                }
                await renderApp();
                await setupRealtime(supabase, handleRealtimeUpdate);
                await loadTasks();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                tasks = [];
                teardownRealtime();
                await renderApp();
            }
        });
        
        // Initial render
        await renderApp();
        
        // If user is logged in, load tasks and setup realtime
        if (currentUser) {
            await setupRealtime(supabase, handleRealtimeUpdate);
            await loadTasks();
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application');
    } finally {
        // Always hide loading and show app
        loadingElement.style.display = 'none';
        appElement.classList.add('loaded');
    }
}

// Render the appropriate UI based on auth state
async function renderApp() {
    if (!currentUser) {
        renderAuthGate();
    } else {
        renderDashboard();
    }
}

// Render authentication gate
function renderAuthGate() {
    appElement.innerHTML = `
        <div class="container">
            <div class="auth-gate">
                <h2>TASKFLOW PRO</h2>
                <div class="form-group">
                    <label for="email">EMAIL</label>
                    <input type="email" id="email" class="form-control" placeholder="user@domain.com">
                </div>
                <div class="form-group">
                    <label for="password">PASSWORD</label>
                    <input type="password" id="password" class="form-control" placeholder="••••••••">
                </div>
                <div id="auth-error" class="error-message" style="display: none;"></div>
                <div class="btn-group">
                    <button class="btn btn-primary" id="sign-up-btn">SIGN UP</button>
                    <button class="btn btn-secondary" id="sign-in-btn">SIGN IN</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('sign-up-btn').addEventListener('click', handleSignUp);
    document.getElementById('sign-in-btn').addEventListener('click', handleSignIn);
    
    // Allow form submission with Enter key
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    const handleEnter = (e) => {
        if (e.key === 'Enter') handleSignIn();
    };
    
    emailInput.addEventListener('keypress', handleEnter);
    passwordInput.addEventListener('keypress', handleEnter);
}

// Handle user sign up
async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('auth-error');
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (error) throw error;
        
        showAuthError('Check your email for confirmation link!', false);
    } catch (error) {
        showAuthError(error.message);
    }
}

// Handle user sign in
async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('auth-error');
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) throw error;
        
        // Auth state change will trigger re-render
    } catch (error) {
        showAuthError(error.message);
    }
}

// Show authentication error
function showAuthError(message, isError = true) {
    const errorElement = document.getElementById('auth-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.color = isError ? '#ff2a6d' : '#00f3ff';
}

// Render the main dashboard
function renderDashboard() {
    appElement.innerHTML = `
        <div class="container">
            <header class="header">
                <h1>TASKFLOW PRO</h1>
                <div class="auth-section">
                    <div class="user-info">USER: ${currentUser.email}</div>
                    <button class="sign-out-btn" id="sign-out-btn">SIGN OUT</button>
                </div>
            </header>
            
            <div class="dashboard">
                <div class="command-bar">
                    <h3>COMMAND INTERFACE</h3>
                    
                    <div class="add-task-form">
                        <input type="text" id="task-title" class="form-control" placeholder="Enter new task...">
                        <select id="task-priority" class="priority-select">
                            <option value="high">HIGH</option>
                            <option value="medium" selected>MEDIUM</option>
                            <option value="low">LOW</option>
                        </select>
                        <button class="btn btn-primary" id="add-task-btn">ADD TASK</button>
                    </div>
                    
                    <div id="task-error" class="error-message" style="display: none;"></div>
                    
                    <div class="filters">
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.9rem; color: #8a8ab5; margin-bottom: 10px; width: 100%;">STATUS FILTER:</h4>
                        <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">ALL</button>
                        <button class="filter-btn ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">ACTIVE</button>
                        <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">COMPLETED</button>
                        
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.9rem; color: #8a8ab5; margin: 15px 0 10px; width: 100%;">PRIORITY FILTER:</h4>
                        <button class="filter-btn ${currentPriorityFilter === 'all' ? 'active' : ''}" data-priority="all">ALL</button>
                        <button class="filter-btn ${currentPriorityFilter === 'high' ? 'active' : ''}" data-priority="high">HIGH</button>
                        <button class="filter-btn ${currentPriorityFilter === 'medium' ? 'active' : ''}" data-priority="medium">MEDIUM</button>
                        <button class="filter-btn ${currentPriorityFilter === 'low' ? 'active' : ''}" data-priority="low">LOW</button>
                    </div>
                </div>
                
                <div class="task-grid" id="task-grid">
                    <!-- Tasks will be rendered here -->
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('sign-out-btn').addEventListener('click', handleSignOut);
    document.getElementById('add-task-btn').addEventListener('click', handleAddTask);
    
    // Allow Enter key to add task
    document.getElementById('task-title').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    document.querySelectorAll('.filter-btn[data-priority]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPriorityFilter = btn.dataset.priority;
            renderTasks();
        });
    });
    
    // Initial task render
    renderTasks();
}

// Handle sign out
async function handleSignOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        showError('Failed to sign out: ' + error.message);
    }
}

// Load tasks from Supabase
async function loadTasks() {
    try {
        const { data, error } = await supabase
            .from('app_e590_tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        tasks = data || [];
        renderTasks();
    } catch (error) {
        showError('Failed to load tasks: ' + error.message);
    }
}

// Render tasks based on current filters
function renderTasks() {
    const taskGrid = document.getElementById('task-grid');
    
    if (!taskGrid) return;
    
    // Update active filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`)?.classList.add('active');
    document.querySelector(`.filter-btn[data-priority="${currentPriorityFilter}"]`)?.classList.add('active');
    
    // Filter tasks
    let filteredTasks = [...tasks];
    
    // Apply status filter
    if (currentFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.is_completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.is_completed);
    }
    
    // Apply priority filter
    if (currentPriorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === currentPriorityFilter);
    }
    
    // Render tasks or empty state
    if (filteredTasks.length === 0) {
        taskGrid.innerHTML = `
            <div class="empty-state">
                <h3>NO TASKS FOUND</h3>
                <p>${tasks.length === 0 ? 'Add your first task to get started!' : 'No tasks match the current filters'}</p>
            </div>
        `;
        return;
    }
    
    taskGrid.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.is_completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <span class="priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
            </div>
            <div class="task-meta">
                <div class="task-date">${formatDate(task.created_at)}</div>
                <div class="task-actions">
                    <button class="action-btn complete-btn" data-id="${task.id}">
                        ${task.is_completed ? 'UNDO' : 'COMPLETE'}
                    </button>
                    <button class="action-btn delete-btn" data-id="${task.id}">DELETE</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to task actions
    taskGrid.addEventListener('click', handleTaskAction);
}

// Handle task actions (complete/delete)
async function handleTaskAction(e) {
    const taskId = e.target.dataset.id;
    if (!taskId) return;
    
    if (e.target.classList.contains('complete-btn')) {
        await toggleTaskComplete(taskId);
    } else if (e.target.classList.contains('delete-btn')) {
        await deleteTask(taskId);
    }
}

// Add a new task
async function handleAddTask() {
    const titleInput = document.getElementById('task-title');
    const prioritySelect = document.getElementById('task-priority');
    
    const title = titleInput.value.trim();
    const priority = prioritySelect.value;
    
    if (!title) {
        showTaskError('Please enter a task title');
        return;
    }
    
    try {
        // Get current user ID
        let userId;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        } catch (error) {
            showTaskError('Failed to get user information');
            return;
        }
        
        if (!userId) {
            showTaskError('User not authenticated');
            return;
        }
        
        const { error } = await supabase
            .from('app_e590_tasks')
            .insert({
                title,
                priority,
                user_id: userId,
                is_completed: false
            });
        
        if (error) throw error;
        
        // Clear input
        titleInput.value = '';
        titleInput.focus();
        
        // Hide any error
        hideTaskError();
        
        // Task will be added via realtime subscription
    } catch (error) {
        showTaskError('Failed to add task: ' + error.message);
    }
}

// Toggle task completion status
async function toggleTaskComplete(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const { error } = await supabase
            .from('app_e590_tasks')
            .update({ is_completed: !task.is_completed })
            .eq('id', taskId);
        
        if (error) throw error;
        
        // Update will happen via realtime subscription
    } catch (error) {
        showError('Failed to update task: ' + error.message);
    }
}

// Delete a task
async function deleteTask(taskId) {
    try {
        // Add deleting animation
        const taskCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
        if (taskCard) {
            taskCard.classList.add('deleting');
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const { error } = await supabase
            .from('app_e590_tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        // Deletion will be handled via realtime subscription
    } catch (error) {
        showError('Failed to delete task: ' + error.message);
    }
}

// Handle realtime updates
function handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            tasks.unshift(newRecord);
            break;
        case 'UPDATE':
            const index = tasks.findIndex(t => t.id === newRecord.id);
            if (index !== -1) {
                tasks[index] = newRecord;
            }
            break;
        case 'DELETE':
            tasks = tasks.filter(t => t.id !== oldRecord.id);
            break;
    }
    
    renderTasks();
}

// Show task-specific error
function showTaskError(message) {
    const errorElement = document.getElementById('task-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideTaskError() {
    const errorElement = document.getElementById('task-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Show general error
function showError(message) {
    console.error(message);
    // Could implement a toast notification here
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}