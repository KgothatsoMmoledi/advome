/* ========================================
   ADVOME SHARED SCRIPTS
   Version: 1.0.0
   ======================================== */

(function() {
  'use strict';

  // ---------- CONFIG ----------
  const CONFIG = {
    STORAGE_PREFIX: 'advome_',
    PROGRESS_KEY: 'advome_progress',
    DEBUG: false
  };

  // ---------- WORKFLOW DEFINITIONS ----------
  const WORKFLOWS = {
    ccma: [
      { id: 'ccma', name: 'CCMA Home', path: 'ccma.html' },
      { id: 'referral', name: 'File Dispute', path: 'referral.html' },
      { id: 'conciliation', name: 'Conciliation', path: 'conciliation.html' },
      { id: 'arbitration', name: 'Arbitration', path: 'arbitration.html' },
      { id: 'award', name: 'Award', path: 'award.html' },
      { id: 'review', name: 'Review', path: 'ccma-review.html' },
      { id: 'motion', name: 'Motion', path: 'motion.html' },
      { id: 'court-online', name: 'Court Online', path: 'court-online.html' },
      { id: 'issue-case', name: 'Issue Case', path: 'issue-case.html' },
      { id: 'service', name: 'Service', path: 'service.html' },
      { id: 'opposition', name: 'Opposition', path: 'opposition.html' },
      { id: 'record', name: 'Record', path: 'record.html' },
      { id: 'supplementary', name: 'Supplementary', path: 'supplementary.html' },
      { id: 'oppose-check', name: 'Oppose Check', path: 'oppose-check.html' },
      { id: 'replying', name: 'Replying', path: 'replying.html' },
      { id: 'pagination', name: 'Pagination', path: 'pagination.html' },
      { id: 'setdown', name: 'Set Down', path: 'setdown.html' },
      { id: 'heads', name: 'Heads', path: 'heads.html' },
      { id: 'enrolment', name: 'Enrolment', path: 'enrolment.html' },
      { id: 'hearing', name: 'Hearing', path: 'hearing.html' },
      { id: 'judgment', name: 'Judgment', path: 'judgment.html' },
      { id: 'finalisation', name: 'Finalisation', path: 'finalisation.html' }
    ]
  };

  // ---------- UTILITIES ----------
  function log(...args) {
    if (CONFIG.DEBUG) console.log('[Advome]', ...args);
  }

  function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  }

  function getFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setToStorage(key, value) {
    try {
      localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {}
  }

  // ---------- PROGRESS TRACKER ----------
  function initProgress() {
    const progressBar = document.querySelector('.adv-progress');
    if (!progressBar) return;

    const workflow = progressBar.dataset.workflow || 'ccma';
    const steps = WORKFLOWS[workflow] || WORKFLOWS.ccma;
    const currentStep = progressBar.dataset.currentStep || getCurrentPage();

    let currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex === -1) {
      currentIndex = steps.findIndex(s => s.path === currentStep);
    }
    if (currentIndex === -1) currentIndex = 0;

    renderProgress(progressBar, steps, currentIndex);
  }

  function renderProgress(container, steps, currentIndex) {
    const track = document.createElement('div');
    track.className = 'adv-progress__track';

    steps.forEach((step, i) => {
      const isCompleted = i < currentIndex;
      const isActive = i === currentIndex;

      const pill = document.createElement('a');
      pill.href = step.path;
      pill.className = 'adv-progress__pill';
      if (isCompleted) pill.classList.add('adv-progress__pill--completed');
      else if (isActive) pill.classList.add('adv-progress__pill--active');
      else pill.classList.add('adv-progress__pill--pending');

      pill.innerHTML = `<span class="step-num">${isCompleted ? 'OK' : i + 1}</span><span class="step-name">${step.name}</span>`;
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = step.path;
      });

      track.appendChild(pill);

      if (i < steps.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'adv-progress__connector';
        if (isCompleted) connector.classList.add('adv-progress__connector--completed');
        track.appendChild(connector);
      }
    });

    container.innerHTML = '';
    container.appendChild(track);
  }

  // ---------- CHECKLIST ----------
  function initChecklists() {
    document.querySelectorAll('.adv-checklist').forEach(list => {
      const listId = list.dataset.checklistId || 'default';
      const saved = getFromStorage('checklist_' + listId, {});

      list.querySelectorAll('.adv-checklist__item').forEach(item => {
        const itemId = item.dataset.itemId || Math.random().toString(36).substr(2, 9);
        item.dataset.itemId = itemId;

        if (saved[itemId]) {
          item.classList.add('adv-checklist__item--checked');
        }

        item.addEventListener('click', () => {
          item.classList.toggle('adv-checklist__item--checked');
          saved[itemId] = item.classList.contains('adv-checklist__item--checked');
          setToStorage('checklist_' + listId, saved);
        });
      });
    });
  }

  // ---------- TOAST ----------
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.adv-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'adv-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `adv-toast adv-toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ---------- ACCORDION ----------
  function initAccordions() {
    document.querySelectorAll('.adv-accordion__header').forEach(header => {
      header.addEventListener('click', () => {
        const accordion = header.closest('.adv-accordion');
        const isOpen = accordion.classList.contains('adv-accordion--open');
        document.querySelectorAll('.adv-accordion--open').forEach(a => a.classList.remove('adv-accordion--open'));
        if (!isOpen) accordion.classList.add('adv-accordion--open');
      });
    });
  }

  // ---------- CHAT WIDGET ----------
  function initChatWidgets() {
    document.querySelectorAll('.adv-chat').forEach(widget => {
      const input = widget.querySelector('.adv-chat__input');
      const sendBtn = widget.querySelector('.adv-chat__send');
      const messages = widget.querySelector('.adv-chat__messages');
      if (!input || !sendBtn || !messages) return;

      function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.textContent = text;
        messages.appendChild(userMsg);
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
          const aiMsg = document.createElement('div');
          aiMsg.className = 'chat-message assistant';
          aiMsg.textContent = 'I can help with CCMA procedures, deadlines, and document preparation. What specific aspect would you like to know?';
          messages.appendChild(aiMsg);
          messages.scrollTop = messages.scrollHeight;
        }, 600);

        messages.scrollTop = messages.scrollHeight;
      }

      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    });
  }

  // ---------- DEADLINE CALCULATOR ----------
  function initDeadlineCalculators() {
    document.querySelectorAll('.adv-deadline-calculator').forEach(calc => {
      const input = calc.querySelector('.adv-deadline__input');
      const display = calc.querySelector('.adv-deadline__display');
      if (!input || !display) return;

      function calculate() {
        if (!input.value) {
          display.innerHTML = '<span class="adv-deadline__label">Select a date</span>';
          return;
        }
        const start = new Date(input.value);
        const deadline = new Date(start);
        deadline.setDate(deadline.getDate() + 30);
        const today = new Date();
        const remaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const opts = { day: 'numeric', month: 'long', year: 'numeric' };
        display.innerHTML = `
          <div class="adv-deadline__label">Deadline</div>
          <div class="adv-deadline__date">${deadline.toLocaleDateString('en-ZA', opts)}</div>
          <span style="color:${remaining < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">
            ${remaining < 0 ? Math.abs(remaining) + ' days overdue' : remaining + ' days remaining'}
          </span>
        `;
      }

      input.addEventListener('change', calculate);
    });
  }

  // ---------- FORM AUTOSAVE ----------
  function initAutosave() {
    document.querySelectorAll('.adv-input, .adv-textarea, .adv-select').forEach(input => {
      if (!input.id) return;
      const page = getCurrentPage().replace('.html', '');
      const key = 'form_' + page + '_' + input.id;
      const saved = getFromStorage(key);
      if (saved && input.type !== 'file') input.value = saved;
      input.addEventListener('input', () => setToStorage(key, input.value));
    });
  }

  // ---------- INIT ----------
  function init() {
    initProgress();
    initChecklists();
    initAccordions();
    initChatWidgets();
    initDeadlineCalculators();
    initAutosave();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally
  window.Advome = {
    showToast,
    getFromStorage,
    setToStorage,
    WORKFLOWS
  };

})();
