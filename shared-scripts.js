/**
 * ADVOME SHARED SCRIPTS
 * Version: 1.0.0
 * Date: 2026-06-14
 * 
 * Provides: localStorage helpers, progress tracking, checklist state,
 * chat widget, deadline calculator, navigation, toast notifications,
 * modal system, and document detection simulation.
 */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const CONFIG = {
    STORAGE_PREFIX: 'advome_',
    CHECKLIST_PREFIX: 'advome_checklist_',
    FORM_PREFIX: 'advome_form_',
    PROGRESS_KEY: 'advome_progress',
    CHAT_HISTORY_KEY: 'advome_chat_history',
    DEBUG: false
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  const utils = {
    log: (...args) => CONFIG.DEBUG && console.log('[Advome]', ...args),

    debounce: (fn, delay = 300) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(null, args), delay);
      };
    },

    formatDate: (date) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-ZA', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
    },

    formatCurrency: (amount) => {
      return 'R' + amount.toLocaleString('en-ZA');
    },

    daysBetween: (date1, date2) => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diff = d2 - d1;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },

    addDays: (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },

    escapeHtml: (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  // ==========================================
  // LOCALSTORAGE HELPERS
  // ==========================================
  const storage = {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        utils.log('Storage get error:', e);
        return defaultValue;
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        utils.log('Storage set error:', e);
        return false;
      }
    },

    remove: (key) => {
      localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
    },

    clear: () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CONFIG.STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    }
  };

  // ==========================================
  // CHECKLIST STATE MANAGEMENT
  // ==========================================
  const checklistManager = {
    init() {
      const checklists = document.querySelectorAll('.adv-checklist[data-checklist-id]');
      checklists.forEach(list => this.initChecklist(list));
      utils.log('Checklists initialized:', checklists.length);
    },

    initChecklist(list) {
      const listId = list.dataset.checklistId;
      const savedState = storage.get(CONFIG.CHECKLIST_PREFIX + listId, {});

      const items = list.querySelectorAll('.adv-checklist__item');
      items.forEach((item, index) => {
        const itemId = item.dataset.itemId || `item_${index}`;
        item.dataset.itemId = itemId;

        // Restore state
        if (savedState[itemId]) {
          item.classList.add('adv-checklist__item--checked');
          const checkbox = item.querySelector('.adv-checklist__checkbox');
          if (checkbox) checkbox.innerHTML = this.getCheckIcon();
        }

        // Add click handler
        item.addEventListener('click', (e) => {
          if (e.target.closest('a, button, input')) return;
          this.toggleItem(item, listId, itemId);
        });
      });

      this.updateProgress(list);
    },

    toggleItem(item, listId, itemId) {
      const isChecked = item.classList.toggle('adv-checklist__item--checked');
      const checkbox = item.querySelector('.adv-checklist__checkbox');

      if (checkbox) {
        checkbox.innerHTML = isChecked ? this.getCheckIcon() : '';
      }

      // Save state
      const savedState = storage.get(CONFIG.CHECKLIST_PREFIX + listId, {});
      savedState[itemId] = isChecked;
      storage.set(CONFIG.CHECKLIST_PREFIX + listId, savedState);

      this.updateProgress(item.closest('.adv-checklist'));

      // Dispatch custom event
      item.dispatchEvent(new CustomEvent('checklistToggle', { 
        detail: { listId, itemId, checked: isChecked } 
      }));

      if (isChecked) {
        toast.show('Item saved OK', 'success');
      }
    },

    getCheckIcon() {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    },

    updateProgress(list) {
      const items = list.querySelectorAll('.adv-checklist__item');
      const checked = list.querySelectorAll('.adv-checklist__item--checked');
      const progress = list.closest('.adv-card')?.querySelector('.adv-checklist__progress');

      if (progress) {
        const pct = Math.round((checked.length / items.length) * 100);
        progress.textContent = `${checked.length}/${items.length} (${pct}%)`;
      }
    },

    reset(listId) {
      storage.remove(CONFIG.CHECKLIST_PREFIX + listId);
      const list = document.querySelector(`[data-checklist-id="${listId}"]`);
      if (list) this.initChecklist(list);
    }
  };

  // ==========================================
  // FORM STATE MANAGEMENT
  // ==========================================
  const formManager = {
    init() {
      const forms = document.querySelectorAll('form[data-form-id]');
      forms.forEach(form => this.initForm(form));
      utils.log('Forms initialized:', forms.length);
    },

    initForm(form) {
      const formId = form.dataset.formId;
      const savedData = storage.get(CONFIG.FORM_PREFIX + formId, {});

      // Restore saved values
      Object.entries(savedData).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) {
          if (field.type === 'checkbox') {
            field.checked = value;
          } else if (field.type === 'radio') {
            const radio = form.querySelector(`[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
          } else {
            field.value = value;
          }
        }
      });

      // Auto-save on change
      const saveHandler = utils.debounce((e) => {
        const field = e.target;
        const savedData = storage.get(CONFIG.FORM_PREFIX + formId, {});

        if (field.type === 'checkbox') {
          savedData[field.name] = field.checked;
        } else if (field.type === 'radio') {
          if (field.checked) savedData[field.name] = field.value;
        } else {
          savedData[field.name] = field.value;
        }

        storage.set(CONFIG.FORM_PREFIX + formId, savedData);
        utils.log('Form auto-saved:', formId, field.name);
      }, 500);

      form.addEventListener('input', saveHandler);
      form.addEventListener('change', saveHandler);
    },

    getData(formId) {
      return storage.get(CONFIG.FORM_PREFIX + formId, {});
    },

    clear(formId) {
      storage.remove(CONFIG.FORM_PREFIX + formId);
    }
  };

  // ==========================================
  // PROGRESS TRACKER
  // ==========================================
  const progressTracker = {
    WORKFLOWS: {
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
        { id: 'answering', name: 'Answering', path: 'answering.html' },
        { id: 'replying', name: 'Replying', path: 'replying.html' },
        { id: 'pagination', name: 'Pagination', path: 'pagination.html' },
        { id: 'heads', name: 'Heads', path: 'heads.html' },
        { id: 'setdown', name: 'Set Down', path: 'setdown-request.html' },
        { id: 'enrolment', name: 'Enrolment', path: 'enrolment.html' },
        { id: 'hearing', name: 'Hearing', path: 'hearing.html' },
        { id: 'judgment', name: 'Judgment', path: 'judgment.html' },
        { id: 'finalisation', name: 'Finalisation', path: 'finalisation.html' }
      ]
    },

    init() {
      const progressBar = document.querySelector('.adv-progress');
      if (!progressBar) return;

      const workflow = progressBar.dataset.workflow || 'ccma';
      const currentStep = progressBar.dataset.currentStep;
      const steps = this.WORKFLOWS[workflow] || this.WORKFLOWS.ccma;

      this.render(progressBar, steps, currentStep);
      this.updateState(currentStep);
    },

    render(container, steps, currentId) {
      const track = document.createElement('div');
      track.className = 'adv-progress__track';

      const currentIndex = steps.findIndex(s => s.id === currentId);
      if (currentIndex === -1) return;

      // Sliding window: show current + 2 before + 2 after = 5 steps max
      const windowSize = 2; // steps on each side of current
      let startIndex = Math.max(0, currentIndex - windowSize);
      let endIndex = Math.min(steps.length - 1, currentIndex + windowSize);

      // Adjust window to always show 5 steps when possible
      if (endIndex - startIndex < windowSize * 2) {
        if (startIndex === 0) {
          endIndex = Math.min(steps.length - 1, windowSize * 2);
        } else if (endIndex === steps.length - 1) {
          startIndex = Math.max(0, steps.length - 1 - windowSize * 2);
        }
      }

      // Add left arrow if there are hidden steps before
      if (startIndex > 0) {
        const leftArrow = document.createElement('div');
        leftArrow.className = 'adv-progress__nav-arrow';
        leftArrow.innerHTML = '‹';
        leftArrow.title = 'Previous steps';
        leftArrow.style.cssText = 'cursor:pointer; color:var(--primary-light); font-size:1.2rem; padding:0 0.5rem; user-select:none; flex-shrink:0;';
        leftArrow.addEventListener('click', () => {
          // Navigate to the step just before the window
          const prevStep = steps[startIndex - 1];
          if (prevStep) window.location.href = prevStep.path;
        });
        track.appendChild(leftArrow);
      }

      let currentReached = false;

      for (let i = startIndex; i <= endIndex; i++) {
        const step = steps[i];
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        if (isActive) currentReached = true;

        const stepEl = document.createElement('div');
        stepEl.className = 'adv-progress__step';

        const pill = document.createElement('a');
        pill.href = step.path;
        pill.className = 'adv-progress__pill adv-progress__pill--' + (isCompleted ? 'completed' : isActive ? 'active' : 'pending');
        pill.innerHTML = '<span class="step-num">' + (isCompleted ? 'OK' : i + 1) + '</span><span class="step-name">' + step.name + '</span>';

        // Prevent default link behavior and navigate in same tab
        pill.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = step.path;
        });

        stepEl.appendChild(pill);
        track.appendChild(stepEl);

        // Add connector if not last in window AND not last overall
        if (i < endIndex) {
          const connector = document.createElement('div');
          connector.className = 'adv-progress__connector ' + (isCompleted ? 'adv-progress__connector--completed' : '');
          track.appendChild(connector);
        }
      }

      // Add right arrow if there are hidden steps after
      if (endIndex < steps.length - 1) {
        const rightArrow = document.createElement('div');
        rightArrow.className = 'adv-progress__nav-arrow';
        rightArrow.innerHTML = '›';
        rightArrow.title = 'Next steps';
        rightArrow.style.cssText = 'cursor:pointer; color:var(--primary-light); font-size:1.2rem; padding:0 0.5rem; user-select:none; flex-shrink:0;';
        rightArrow.addEventListener('click', () => {
          // Navigate to the step just after the window
          const nextStep = steps[endIndex + 1];
          if (nextStep) window.location.href = nextStep.path;
        });
        track.appendChild(rightArrow);
      }

      container.innerHTML = '';
      container.appendChild(track);
    },

    updateState(stepId) {
      const state = storage.get(CONFIG.PROGRESS_KEY, {});
      state[stepId] = { visited: true, timestamp: new Date().toISOString() };
      storage.set(CONFIG.PROGRESS_KEY, state);
    },

    getState() {
      return storage.get(CONFIG.PROGRESS_KEY, {});
    },

    isCompleted(stepId) {
      return !!this.getState()[stepId]?.visited;
    }
  };

  // ==========================================
  // DEADLINE CALCULATOR
  // ==========================================
  const deadlineCalculator = {
    init() {
      const calculators = document.querySelectorAll('.adv-deadline-calculator');
      calculators.forEach(calc => this.initCalculator(calc));
    },

    initCalculator(container) {
      const input = container.querySelector('.adv-deadline__input');
      const daysInput = container.querySelector('.adv-deadline__days');
      const display = container.querySelector('.adv-deadline__display');

      if (!input || !display) return;

      const calculate = () => {
        const startDate = input.value ? new Date(input.value) : null;
        const days = parseInt(daysInput?.value || 30, 10);

        if (!startDate || isNaN(startDate)) {
          display.innerHTML = '<span class="adv-deadline__label">Select a date to calculate deadline</span>';
          return;
        }

        const deadline = utils.addDays(startDate, days);
        const today = new Date();
        const daysRemaining = utils.daysBetween(today, deadline);

        let statusClass = 'adv-deadline__safe';
        let statusText = `${daysRemaining} days remaining`;

        if (daysRemaining < 0) {
          statusClass = 'adv-deadline__urgent';
          statusText = `${Math.abs(daysRemaining)} days OVERDUE`;
        } else if (daysRemaining <= 7) {
          statusClass = 'adv-deadline__urgent';
          statusText = `URGENT: ${daysRemaining} days left`;
        } else if (daysRemaining <= 14) {
          statusText = `${daysRemaining} days left - Act soon`;
        }

        display.innerHTML = `
          <div class="adv-deadline__label">Deadline: ${days} days from ${utils.formatDate(startDate)}</div>
          <div class="adv-deadline__date">${utils.formatDate(deadline)}</div>
          <span class="${statusClass}">${statusText}</span>
        `;

        // Save to storage
        const formId = container.closest('form')?.dataset.formId;
        if (formId) {
          const saved = storage.get(CONFIG.FORM_PREFIX + formId, {});
          saved[input.name] = input.value;
          storage.set(CONFIG.FORM_PREFIX + formId, saved);
        }
      };

      input.addEventListener('change', calculate);
      if (daysInput) daysInput.addEventListener('change', calculate);

      // Calculate on init if value exists
      if (input.value) calculate();
    },

    calculateFromDate(startDate, days = 30) {
      const deadline = utils.addDays(startDate, days);
      const today = new Date();
      const remaining = utils.daysBetween(today, deadline);
      return { deadline, remaining, isOverdue: remaining < 0 };
    }
  };

  // ==========================================
  // CHAT WIDGET
  // ==========================================
  const chatWidget = {
    init() {
      const widgets = document.querySelectorAll('.adv-chat[data-chat-id]');
      widgets.forEach(widget => this.initWidget(widget));
    },

    initWidget(widget) {
      const chatId = widget.dataset.chatId;
      const messages = widget.querySelector('.adv-chat__messages');
      const input = widget.querySelector('.adv-chat__input');
      const sendBtn = widget.querySelector('.adv-chat__send');

      // Load history
      const history = storage.get(CONFIG.CHAT_HISTORY_KEY + '_' + chatId, []);
      history.forEach(msg => this.appendMessage(messages, msg.text, msg.isUser));

      const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        this.appendMessage(messages, text, true);
        this.saveMessage(chatId, text, true);
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
          const response = this.generateResponse(text);
          this.appendMessage(messages, response, false);
          this.saveMessage(chatId, response, false);
        }, 800);
      };

      sendBtn?.addEventListener('click', sendMessage);
      input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    },

    appendMessage(container, text, isUser) {
      const msg = document.createElement('div');
      msg.style.cssText = `
        margin-bottom: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        max-width: 85%;
        font-size: 0.85rem;
        line-height: 1.4;
        ${isUser 
          ? 'background: #1a365d; color: white; margin-left: auto;' 
          : 'background: white; color: #4a5568; border: 1px solid #e2e8f0;'}
      `;
      msg.textContent = text;
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    },

    saveMessage(chatId, text, isUser) {
      const key = CONFIG.CHAT_HISTORY_KEY + '_' + chatId;
      const history = storage.get(key, []);
      history.push({ text, isUser, timestamp: new Date().toISOString() });
      // Keep last 50 messages
      if (history.length > 50) history.shift();
      storage.set(key, history);
    },

    generateResponse(input) {
      const lower = input.toLowerCase();

      if (lower.includes('deadline') || lower.includes('time') || lower.includes('days')) {
        return "CCMA referral must be filed within 30 days of dismissal (LRA s191). For Labour Court review, you have 6 weeks from the date the award was served on you (LRA s145). Late referrals require condonation - difficult to obtain.";
      }
      if (lower.includes('cost') || lower.includes('fee') || lower.includes('money') || lower.includes('price')) {
        return "CCMA conciliation is free (LRA s135). Arbitration has a small fee based on your earnings. Labour Court filing fees start at R0 for disputes under R50,000. Attorney fees for CCMA matters range from R5,000 to R50,000+ depending on complexity.";
      }
      if (lower.includes('document') || lower.includes('evidence') || lower.includes('proof')) {
        return "For arbitration, you need: your referral form, employment contract (or proof of verbal agreement), payslips, disciplinary records, and witness statements. No written contract? Verbal agreements are valid - use payslips, bank statements, WhatsApp messages, or colleague testimony.";
      }
      if (lower.includes('contract') || lower.includes('verbal') || lower.includes('written') || lower.includes('no contract')) {
        return "Verbal employment agreements are valid and enforceable under South African common law and the LRA (s197). You may be able to prove employment with: payslips, bank deposit records, attendance registers, UIF records, colleague testimony, WhatsApp work messages, or email correspondence. The CCMA and Labour Court accept this evidence.";
      }
      if (lower.includes('constructive') || lower.includes('forced') || lower.includes('resign') || lower.includes('unbearable')) {
        return "Constructive dismissal (LRA s186(e)) occurs when an employee resigns because working conditions became intolerable. The same 30-day deadline applies and rights as someone directly dismissed. Examples: harassment, unsafe conditions, demotion without consent, or hostile environment. The burden is on you to prove the employer made continued employment impossible.";
      }
      if (lower.includes('what') && lower.includes('ccma')) {
        return "The CCMA (Commission for Conciliation, Mediation and Arbitration) is a South African dispute resolution body established under the Labour Relations Act 66 of 1995. It handles unfair dismissal, unfair labour practice, wage disputes, and discrimination matters.";
      }
      if (lower.includes('settlement') || lower.includes('conciliation')) {
        return "At conciliation (LRA s135), a commissioner helps you and your employer reach a settlement. You are not obliged to agree to unfair offers. The agreement is binding once signed (LRA s138). Recording is permitted under RICA when you are a participant. If no settlement, the matter proceeds to arbitration (LRA s136).";
      }
      if (lower.includes('dismissal') || lower.includes('fired') || lower.includes('terminated')) {
        return "Unfair dismissal (LRA s188) requires both a fair reason (substantive fairness) and fair procedure (procedural fairness). The employer must prove both. If they cannot, the dismissal is unfair. Compensation is capped at 12 months (ordinary) or 24 months (automatically unfair, LRA s187).";
      }
      if (lower.includes('review') || lower.includes('appeal') || lower.includes('challenge')) {
        return "To challenge a CCMA award, you must apply for review in the Labour Court within 6 weeks (LRA s145). Limited grounds: arbitrator exceeded powers, misconduct, gross irregularity, or improper evidence handling. Labour Court is compulsory online via Court Online. You may need the arbitration record - we can help you request it.";
      }
      if (lower.includes('precedent') || lower.includes('case law') || lower.includes('cases')) {
        return "Key CCMA/Labour Court precedents: NUMSA v. Bader Bop [2003] (review grounds); Steenkamp v. Edcon [2006] (arbitrator misconduct); Goldfields Mining v. CCMA [2007] (irregular procedure); SA Rugby v. CCMA [2006] (evidence errors); President of RSA v. SARFU [1999] (bias). This platform may assist you with find relevant cases for your specific situation.";
      }
      if (lower.includes('discrimination') || lower.includes('harassment') || lower.includes('race') || lower.includes('gender') || lower.includes('pregnancy')) {
        return "Discrimination is prohibited under the Employment Equity Act 55 of 1998. Automatically unfair dismissal includes dismissal for pregnancy, union activity, whistleblowing, or protected disclosure (LRA s187). These carry up to 24 months' compensation. You may be able to refer directly to the CCMA or Labour Court.";
      }
      if (lower.includes('uif') || lower.includes('unemployment') || lower.includes('benefits')) {
        return "If you were dismissed, apply for UIF benefits at your nearest Department of Labour office or online. You may need: ID, UI-19 form from employer (or proof of dismissal), and bank details. You have 12 months to claim. UIF and CCMA are separate processes - you can claim UIF even while disputing dismissal.";
      }
      return "This platform may assist with CCMA procedures, LRA sections, deadlines, document preparation, review grounds, case law, and general labour law guidance. What specific aspect would you like to know about?";
    }
  };

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  const toast = {
    container: null,

    init() {
      if (this.container) return;
      this.container = document.createElement('div');
      this.container.className = 'adv-toast-container';
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
      this.init();

      const toast = document.createElement('div');
      toast.className = `adv-toast adv-toast--${type}`;
      toast.innerHTML = `
        <span>${utils.escapeHtml(message)}</span>
      `;

      this.container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ==========================================
  // MODAL SYSTEM
  // ==========================================
  const modal = {
    open(content, options = {}) {
      const overlay = document.createElement('div');
      overlay.className = 'adv-modal-overlay';
      overlay.innerHTML = `
        <div class="adv-modal">
          <div class="adv-modal__header">
            <h3>${options.title || 'Modal'}</h3>
            <button class="adv-modal__close">&times;</button>
          </div>
          <div class="adv-modal__body">${content}</div>
          ${options.footer ? `<div class="adv-modal__footer">${options.footer}</div>` : ''}
        </div>
      `;

      document.body.appendChild(overlay);

      // Trigger animation
      requestAnimationFrame(() => {
        overlay.classList.add('adv-modal-overlay--open');
      });

      // Close handlers
      const close = () => {
        overlay.classList.remove('adv-modal-overlay--open');
        setTimeout(() => overlay.remove(), 300);
      };

      overlay.querySelector('.adv-modal__close').addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });

      return { close, overlay };
    }
  };

  // ==========================================
  // DOCUMENT DETECTION SIMULATION
  // ==========================================
  const documentDetector = {
    init() {
      const uploaders = document.querySelectorAll('.adv-upload[data-detect]');
      uploaders.forEach(uploader => this.initUploader(uploader));
    },

    initUploader(uploader) {
      const input = uploader.querySelector('input[type="file"]') || document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      uploader.appendChild(input);

      uploader.addEventListener('click', () => input.click());

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simulate detection
        uploader.innerHTML = `
          <div class="adv-upload__text">Analyzing: ${file.name}...</div>
          <div class="adv-upload__hint">Detecting document type</div>
        `;

        setTimeout(() => {
          const detected = this.detectType(file.name);
          uploader.innerHTML = `
            <div class="adv-upload__text" style="color: var(--success);">OK Detected: ${detected.type}</div>
            <div class="adv-upload__hint">Stage: ${detected.stage} | Confidence: ${detected.confidence}%</div>
          `;
          uploader.style.borderColor = 'var(--success)';
          uploader.style.background = 'rgba(56,161,105,0.05)';

          toast.show(`Document detected: ${detected.type}`, 'success');
        }, 1500);
      });
    },

    detectType(filename) {
      const lower = filename.toLowerCase();

      if (lower.includes('referral') || lower.includes('7.11') || lower.includes('lra')) {
        return { type: 'LRA 7.11 Referral Form', stage: 'Referral', confidence: 95 };
      }
      if (lower.includes('settlement') || lower.includes('agreement')) {
        return { type: 'Settlement Agreement', stage: 'Conciliation', confidence: 90 };
      }
      if (lower.includes('award') || lower.includes('arbitrator')) {
        return { type: 'Arbitration Award', stage: 'Award', confidence: 88 };
      }
      if (lower.includes('notice') || lower.includes('dismissal')) {
        return { type: 'Dismissal Notice', stage: 'Referral', confidence: 85 };
      }
      if (lower.includes('contract') || lower.includes('employment')) {
        return { type: 'Employment Contract', stage: 'Arbitration', confidence: 92 };
      }
      if (lower.includes('payslip') || lower.includes('salary')) {
        return { type: 'Payslip / Salary Record', stage: 'Arbitration', confidence: 90 };
      }

      return { type: 'Unknown Document', stage: 'Unknown', confidence: 45 };
    }
  };

  // ==========================================
  // NAVIGATION STATE
  // ==========================================
  const navigation = {
    init() {
      // Highlight current page in nav
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.adv-header__nav a').forEach(link => {
        if (link.getAttribute('href')?.includes(currentPath)) {
          link.style.color = 'white';
          link.style.fontWeight = '700';
        }
      });

      // Handle nav footer buttons
      document.querySelectorAll('.adv-nav-footer__prev a, .adv-nav-footer__next a').forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('#')) {
            // Save current page state before navigating
            progressTracker.updateState(document.querySelector('.adv-progress')?.dataset.currentStep);
          }
        });
      });
    }
  };

  // ==========================================
  // ACCORDION SYSTEM
  // ==========================================
  const accordion = {
    init() {
      document.querySelectorAll('.adv-accordion__header').forEach(header => {
        header.addEventListener('click', () => {
          const accordion = header.closest('.adv-accordion');
          const isOpen = accordion.classList.contains('adv-accordion--open');

          // Close all in same group
          const group = accordion.dataset.group;
          if (group) {
            document.querySelectorAll(`.adv-accordion[data-group="${group}"]`).forEach(a => {
              a.classList.remove('adv-accordion--open');
            });
          }

          // Toggle current
          accordion.classList.toggle('adv-accordion--open', !isOpen);
        });
      });
    }
  };

  // ==========================================
  // SAVINGS CALCULATOR
  // ==========================================
  const savingsCalculator = {
    RATES: {
      attorney_hourly: 2500,
      attorney_daily: 15000,
      consultation: 3000,
      drafting: 5000,
      appearance: 8000
    },

    calculate(stepsCompleted = []) {
      let total = 0;

      if (stepsCompleted.includes('referral')) total += this.RATES.drafting;
      if (stepsCompleted.includes('conciliation')) total += this.RATES.consultation + this.RATES.appearance;
      if (stepsCompleted.includes('arbitration')) total += this.RATES.drafting + this.RATES.appearance * 2;
      if (stepsCompleted.includes('review')) total += this.RATES.drafting + this.RATES.appearance * 3;

      return total;
    },

    updateDisplay() {
      const state = progressTracker.getState();
      const completed = Object.keys(state).filter(k => state[k].visited);
      const saved = this.calculate(completed);

      document.querySelectorAll('.adv-savings__amount').forEach(el => {
        el.textContent = utils.formatCurrency(saved);
      });
    }
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    utils.log('Initializing Advome shared scripts...');

    progressTracker.init();
    checklistManager.init();
    formManager.init();
    deadlineCalculator.init();
    chatWidget.init();
    documentDetector.init();
    navigation.init();
    accordion.init();
    savingsCalculator.updateDisplay();

    // Set default date inputs to today
    document.querySelectorAll('input[type="date"]').forEach(input => {
      if (!input.value) {
        input.valueAsDate = new Date();
      }
    });

    utils.log('Initialization complete');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API globally
  window.Advome = {
    utils,
    storage,
    checklist: checklistManager,
    form: formManager,
    progress: progressTracker,
    deadline: deadlineCalculator,
    chat: chatWidget,
    toast,
    modal,
    savings: savingsCalculator,
    documentDetector,
    CONFIG
  };

})();
