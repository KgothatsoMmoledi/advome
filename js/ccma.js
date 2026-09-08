<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Advome CCMA — Build your case and complete your dispute referral with AI assistance.">
  <title>CCMA Case Builder | Advome</title>
  <link rel="stylesheet" href="css/shared.css">
  <style>
    /* Internal wizard steps */
    .wizard-step { display: none; }
    .wizard-step.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .sub-progress { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .sub-progress .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); }
    .sub-progress .dot.active { background: var(--primary); box-shadow: 0 0 0 4px rgba(26,54,93,0.2); }
    .sub-progress .dot.done { background: var(--success); }

    .law-list { list-style: none; padding: 0; margin: 0.5rem 0; }
    .law-list li {
      padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;
      margin-bottom: 0.5rem; cursor: pointer; display: flex; align-items: flex-start; gap: 0.5rem;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .law-list li:hover { background: var(--bg-page); }
    .law-list li.selected { border-color: var(--primary-light); background: rgba(44,82,130,0.04); font-weight: 600; }
    .law-list li input[type=checkbox] { margin-top: 3px; }
    .law-list li .law-text { flex: 1; }

    .draft-box {
      background: #fff; border: 1px solid var(--border); border-radius: 8px;
      padding: 1.5rem; font-family: Georgia, serif; line-height: 1.6; white-space: pre-wrap;
    }
    .story-prompt {
      background: var(--bg-page); border: 1px solid var(--border); border-radius: 8px;
      padding: 1rem; margin-bottom: 1rem;
    }
    .story-prompt h3 { margin-top: 0; }
    .compensation-box {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 1rem 0;
    }
    .compensation-amount { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; }
    .strength-meter { height: 12px; border-radius: 6px; background: var(--border); overflow: hidden; margin: 0.5rem 0; }
    .strength-fill { height: 100%; border-radius: 6px; transition: width 0.3s; }
  </style>
</head>
<body>

  <header class="adv-header">
    <a href="index.html" class="adv-header__logo">Ad<span>vome</span></a>
    <nav class="adv-header__nav">
      <a href="ccma.html" class="active">CCMA</a>
      <a href="#">Labour Court</a>
      <a href="#">Civil</a>
      <a href="#">Contracts</a>
      <a href="#">Wills</a>
    </nav>
    <div class="adv-header__user">
      <div class="adv-header__avatar">U</div>
      <span>My Cases</span>
    </div>
    <button class="adv-header__menu-toggle" aria-label="Toggle menu">☰</button>
  </header>

  <!-- MAIN PROGRESS BAR (shared.js) -->
  <div class="adv-progress" data-workflow="ccma" data-current-step="ccma"></div>

  <section class="adv-hero">
    <div class="adv-hero__content">
      <h1>Build Your CCMA Case</h1>
      <p>Tell us what happened — we'll help you identify the laws and prepare a clear argument</p>
    </div>
    <div class="adv-hero__badge adv-hero__badge--online">AI‑powered</div>
  </section>

  <main class="adv-container">
    <div class="adv-workspace">

      <!-- SUB-PROGRESS (internal wizard) -->
      <div class="sub-progress" id="subProgress">
        <span class="dot active" data-step="1"></span>
        <span class="dot" data-step="2"></span>
        <span class="dot" data-step="3"></span>
        <span class="dot" data-step="4"></span>
      </div>

      <!-- STEP 1: TELL YOUR STORY -->
      <div class="adv-card wizard-step active" id="step1">
        <div class="adv-card__header">
          <h2 class="adv-card__title">1. Tell Us What Happened</h2>
          <p class="adv-card__subtitle">Explain your situation in your own words — as much detail as possible helps us identify the right laws</p>
        </div>
        <div class="story-prompt">
          <h3>What should you include?</h3>
          <ul style="margin:0.5rem 0 0 1.25rem;">
            <li>Were you dismissed, or did you resign because conditions became unbearable?</li>
            <li>What reason did your employer give for the dismissal?</li>
            <li>Did you receive warnings or a hearing before the decision?</li>
            <li>Were you given written reasons for the dismissal?</li>
            <li>How long did you work there?</li>
            <li>What evidence do you have (emails, messages, payslips, witness names)?</li>
          </ul>
        </div>
        <div class="adv-form-group">
          <label for="userStory">Your story</label>
          <textarea id="userStory" class="adv-textarea" rows="8" placeholder="I was dismissed on 15 June 2026. My employer said it was for poor performance, but I had never received a warning. I was given no hearing. I believe the real reason was that I had joined a union two months earlier. I have emails showing my union membership and payslips for the last year..."></textarea>
          <div class="adv-form-hint">The more detail you provide, the more accurate the AI's analysis will be.</div>
        </div>
        <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:1rem;">
          <input type="checkbox" id="ackStep1">
          <span style="font-size:0.9rem;">I understand this is not legal advice and I am responsible for my own case.</span>
        </label>
        <button class="adv-btn adv-btn--primary" id="btnNext1">Analyse My Case →</button>
      </div>

      <!-- STEP 2: AI LAW IDENTIFICATION -->
      <div class="adv-card wizard-step" id="step2">
        <div class="adv-card__header">
          <h2 class="adv-card__title">2. Laws That May Apply</h2>
          <p class="adv-card__subtitle">Based on your story, here are possible substantive and procedural breaches</p>
        </div>
        <div id="lawsLoading" style="display:none; color:var(--text-muted);">Generating legal analysis…</div>
        <div id="lawsContainer" style="display:none;">
          <h3>Substantive Breaches (the reason for dismissal/resignation)</h3>
          <ul class="law-list" id="substantiveLaws"></ul>
          <h3 class="adv-mt-2">Procedural Breaches (how the process was handled)</h3>
          <ul class="law-list" id="proceduralLaws"></ul>
          <div id="noLawsFound" style="display:none; color:var(--text-muted);">No specific laws were identified. You can proceed with your own explanation.</div>
        </div>
        <label style="display:flex;align-items:flex-start;gap:8px;margin-top:1rem;">
          <input type="checkbox" id="ackStep2">
          <span style="font-size:0.9rem;">I have reviewed the laws and selected those I believe apply to my case.</span>
        </label>
        <div class="adv-flex adv-justify-between">
          <button class="adv-btn adv-btn--ghost" id="btnBack2">← Back to Story</button>
          <button class="adv-btn adv-btn--primary" id="btnNext2">Continue to Explain →</button>
        </div>
      </div>

      <!-- STEP 3: USER EXPLANATION -->
      <div class="adv-card wizard-step" id="step3">
        <div class="adv-card__header">
          <h2 class="adv-card__title">3. Explain Why These Laws Were Broken</h2>
          <p class="adv-card__subtitle">For each law you selected, explain in your own words why you believe it was contravened</p>
        </div>
        <div class="adv-form-group">
          <label for="substantiveExplanation">Why were the <strong>substantive</strong> laws broken?</label>
          <textarea id="substantiveExplanation" class="adv-textarea" rows="5" placeholder="Example: The reason for dismissal was not fair. I was dismissed for 'poor performance' but I had received no warnings, and my last performance review was positive. The real reason was my union membership..."></textarea>
        </div>
        <div class="adv-form-group">
          <label for="proceduralExplanation">Why were the <strong>procedural</strong> laws broken?</label>
          <textarea id="proceduralExplanation" class="adv-textarea" rows="5" placeholder="Example: I was never given notice of a disciplinary hearing. I was not given a chance to respond to the allegations. I was not allowed to bring a representative. The dismissal was given to me verbally without written reasons..."></textarea>
        </div>
        <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:1rem;">
          <input type="checkbox" id="ackStep3">
          <span style="font-size:0.9rem;">The AI will combine my explanations with the selected laws. It will not add new legal arguments.</span>
        </label>
        <div class="adv-flex adv-justify-between">
          <button class="adv-btn adv-btn--ghost" id="btnBack3">← Back to Laws</button>
          <button class="adv-btn adv-btn--primary" id="btnNext3">Generate Draft →</button>
        </div>
      </div>

      <!-- STEP 4: FINAL DRAFT -->
      <div class="adv-card wizard-step" id="step4">
        <div class="adv-card__header">
          <h2 class="adv-card__title">4. Your Final Draft</h2>
          <p class="adv-card__subtitle">Your complete case argument, ready for the CCMA</p>
        </div>
        <div id="draftLoading" style="display:none; color:var(--text-muted);">Generating draft…</div>
        <div class="draft-box" id="draftPreview"></div>
        <div class="adv-form-group adv-mt-2">
          <label for="editInstructions">Request changes (optional)</label>
          <textarea id="editInstructions" class="adv-textarea" rows="2" placeholder="e.g., 'remove the part about discrimination' or 'add more detail to procedural fairness'"></textarea>
          <button class="adv-btn adv-btn--secondary adv-mt-1" id="btnEditDraft">Apply Changes</button>
        </div>
        <label style="display:flex;align-items:flex-start;gap:8px;margin-top:1rem;">
          <input type="checkbox" id="ackStep4">
          <span style="font-size:0.9rem;">I am satisfied with this draft and ready to finalise.</span>
        </label>
        <div class="adv-flex adv-justify-between">
          <button class="adv-btn adv-btn--ghost" id="btnBack4">← Back to Explanations</button>
          <button class="adv-btn adv-btn--accent" id="btnFinalise">Finalise Referral</button>
        </div>
      </div>

    </div>

    <!-- Sidebar -->
    <aside class="adv-sidebar">
      <div class="adv-sidebar__widget">
        <h3 class="adv-sidebar__widget-title">📋 Case Snapshot</h3>
        <div id="sidebarSnapshot"><p class="text-muted">Start telling your story.</p></div>
      </div>
      <div class="adv-sidebar__widget">
        <h3 class="adv-sidebar__widget-title">💰 Compensation Estimate</h3>
        <div class="compensation-box">
          <div class="compensation-amount" id="compensationAmount">R 0</div>
          <div style="opacity:0.8; font-size:0.85rem;">Estimated maximum</div>
        </div>
        <div class="strength-meter">
          <div class="strength-fill" id="strengthFill" style="width:0%; background:var(--danger);"></div>
        </div>
        <div class="text-muted" id="strengthText">0% – add evidence to improve</div>
      </div>
      <div class="adv-sidebar__widget adv-chat" data-chat-id="ccma_case">
        <h3 class="adv-sidebar__widget-title">🤖 AI Assistant</h3>
        <div class="adv-chat__messages">
          <div class="chat-message assistant">I can explain legal terms and help you understand the suggested laws.</div>
        </div>
        <div class="adv-chat__input-group">
          <input type="text" class="adv-chat__input" placeholder="Ask...">
          <button class="adv-chat__send">Send</button>
        </div>
      </div>
    </aside>
  </main>

  <div class="adv-bottom-zone">
    <div style="max-width:1200px;margin:0 auto;padding:0.5rem 1.5rem;display:flex;justify-content:flex-end;">
      <div class="adv-savings adv-savings--small">Saved <span class="adv-savings__amount">R0</span></div>
    </div>
    <div class="adv-compliance">
      <strong>Legal information only — not legal advice.</strong> Advome provides procedural assistance. <a href="#">Terms</a> · <a href="#">Privacy</a>
    </div>
    <nav class="adv-nav-footer">
      <a href="index.html" class="adv-nav-footer__prev">← Home</a>
      <a href="conciliation.html" class="adv-nav-footer__next">Conciliation →</a>
    </nav>
  </div>

  <footer class="adv-footer">
    <p><a href="#">Home</a> <a href="#">CCMA</a> <a href="#">Divorce</a> <a href="#">Estates</a></p>
    <p style="font-size:0.75rem;opacity:0.7;">© 2026 Advome</p>
  </footer>

  <script src="js/shared.js"></script>
  <script src="js/matter-manager.js"></script>
  <script>
    // ======================
    // CASE BUILDER CONTROL
    // ======================
    const panels = ['step1','step2','step3','step4'];
    let currentPanel = 1;
    let selectedSubstantiveLaws = [];
    let selectedProceduralLaws = [];

    // Get or create matter
    let matter = AdvomeMatter.current();
    if (!matter || matter.type !== 'ccma') {
      matter = AdvomeMatter.create('ccma');
    }
    if (!matter.caseBuilder) {
      matter.caseBuilder = {
        userStory: '',
        selectedSubstantiveLaws: [],
        selectedProceduralLaws: [],
        substantiveExplanation: '',
        proceduralExplanation: '',
        draft: '',
        finalDraft: ''
      };
      AdvomeMatter.save(matter);
    }

    // Also maintain old Case object for compensation/strength
    const Case = {
      salary: 0,
      dismissalType: '',
      dismissalDate: '',
      evidence: [],
      witnesses: [],
      compensation: 0,
      strength: 0
    };

    function showPanel(num) {
      panels.forEach(p => document.getElementById(p).classList.remove('active'));
      document.getElementById('step'+num).classList.add('active');
      currentPanel = num;
      updateSubProgress();
      updateSidebar();
    }

    function updateSubProgress() {
      document.querySelectorAll('#subProgress .dot').forEach((dot, idx) => {
        dot.classList.remove('active','done');
        if (idx+1 < currentPanel) dot.classList.add('done');
        else if (idx+1 === currentPanel) dot.classList.add('active');
      });
    }

    // ========== PANEL 1 → PANEL 2 (AI analysis) ==========
    document.getElementById('btnNext1').addEventListener('click', async () => {
      if (!document.getElementById('ackStep1').checked) {
        alert('Please acknowledge the disclaimer.');
        return;
      }
      const story = document.getElementById('userStory').value.trim();
      if (story.length < 50) {
        alert('Please provide more detail about what happened (at least 50 characters).');
        return;
      }
      matter.caseBuilder.userStory = story;
      AdvomeMatter.save(matter);

      showPanel(2);
      document.getElementById('lawsLoading').style.display = 'block';
      document.getElementById('lawsContainer').style.display = 'none';

      try {
        const res = await fetch('/api/case-law', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'analyze', userText: story })
        });
        const data = await res.json();
        const result = data.result;

        const subs = [];
        const procs = [];
        const lines = result.split('\n').filter(l => l.trim());
        let section = null;
        lines.forEach(line => {
          const lower = line.toLowerCase();
          if (lower.includes('substantive') && lower.includes('breach')) {
            section = 'sub';
            return;
          }
          if (lower.includes('procedural') && lower.includes('breach')) {
            section = 'proc';
            return;
          }
          if (section === 'sub') subs.push(line);
          else if (section === 'proc') procs.push(line);
        });

        if (subs.length === 0 && procs.length === 0) {
          document.getElementById('noLawsFound').style.display = 'block';
        } else {
          document.getElementById('noLawsFound').style.display = 'none';
          renderLawList('substantiveLaws', subs.length ? subs : ['Section 188(1)(a) – Dismissal for a reason related to conduct or capacity']);
          renderLawList('proceduralLaws', procs.length ? procs : ['Section 188(1)(b) – Dismissal without fair procedure']);
        }
        document.getElementById('lawsLoading').style.display = 'none';
        document.getElementById('lawsContainer').style.display = 'block';
      } catch (err) {
        document.getElementById('lawsLoading').style.display = 'none';
        alert('Error connecting to AI. Please try again.');
        showPanel(1);
      }
    });

    function renderLawList(listId, laws) {
      const ul = document.getElementById(listId);
      ul.innerHTML = '';
      laws.forEach(law => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox" value="${law}"><span class="law-text">${law}</span>`;
        li.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const cb = li.querySelector('input');
            cb.checked = !cb.checked;
          }
          li.classList.toggle('selected', li.querySelector('input').checked);
        });
        ul.appendChild(li);
      });
    }

    document.getElementById('btnBack2').addEventListener('click', () => showPanel(1));

    document.getElementById('btnNext2').addEventListener('click', () => {
      if (!document.getElementById('ackStep2').checked) {
        alert('Please confirm you have reviewed the laws.');
        return;
      }
      selectedSubstantiveLaws = Array.from(document.querySelectorAll('#substantiveLaws input:checked')).map(cb => cb.value);
      selectedProceduralLaws = Array.from(document.querySelectorAll('#proceduralLaws input:checked')).map(cb => cb.value);
      if (selectedSubstantiveLaws.length === 0 && selectedProceduralLaws.length === 0) {
        alert('Please select at least one law.');
        return;
      }
      matter.caseBuilder.selectedSubstantiveLaws = selectedSubstantiveLaws;
      matter.caseBuilder.selectedProceduralLaws = selectedProceduralLaws;
      AdvomeMatter.save(matter);
      showPanel(3);
    });

    document.getElementById('btnBack3').addEventListener('click', () => showPanel(2));

    document.getElementById('btnNext3').addEventListener('click', () => {
      if (!document.getElementById('ackStep3').checked) {
        alert('Please acknowledge the disclaimer.');
        return;
      }
      const subs = document.getElementById('substantiveExplanation').value.trim();
      const procs = document.getElementById('proceduralExplanation').value.trim();
      if (!subs || !procs) {
        alert('Please explain both substantive and procedural breaches.');
        return;
      }
      matter.caseBuilder.substantiveExplanation = subs;
      matter.caseBuilder.proceduralExplanation = procs;
      AdvomeMatter.save(matter);
      showPanel(4);
      generateDraft();
    });

    // ========== DRAFT GENERATION ==========
    function generateDraft() {
      document.getElementById('draftLoading').style.display = 'block';
      document.getElementById('draftPreview').innerHTML = '';
      const cb = matter.caseBuilder;
      const prompt = `Create a CCMA referral argument with two sections:\n\nSUBSTANTIVE FAIRNESS\nUser's explanation: ${cb.substantiveExplanation}\nSelected substantive laws: ${cb.selectedSubstantiveLaws.join(', ')}\n\nPROCEDURAL FAIRNESS\nUser's explanation: ${cb.proceduralExplanation}\nSelected procedural laws: ${cb.selectedProceduralLaws.join(', ')}\n\nFormat clearly with headings. Do not add new laws or advice.`;

      fetch('/api/case-law', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'polish', userText: prompt })
      })
      .then(res => res.json())
      .then(data => {
        matter.caseBuilder.draft = data.result;
        AdvomeMatter.save(matter);
        document.getElementById('draftPreview').textContent = data.result;
        document.getElementById('draftLoading').style.display = 'none';
      })
      .catch(() => {
        const fallback = `SUBSTANTIVE FAIRNESS\n${cb.substantiveExplanation}\n\nSelected laws: ${cb.selectedSubstantiveLaws.join(', ')}\n\nPROCEDURAL FAIRNESS\n${cb.proceduralExplanation}\n\nSelected laws: ${cb.selectedProceduralLaws.join(', ')}`;
        matter.caseBuilder.draft = fallback;
        document.getElementById('draftPreview').textContent = fallback;
        document.getElementById('draftLoading').style.display = 'none';
      });
    }

    document.getElementById('btnEditDraft').addEventListener('click', () => {
      const instructions = document.getElementById('editInstructions').value.trim();
      if (!instructions) return;
      const current = matter.caseBuilder.draft;
      const prompt = `Revise this draft according to: "${instructions}".\nDraft:\n${current}`;
      fetch('/api/case-law', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'polish', userText: prompt })
      })
      .then(res => res.json())
      .then(data => {
        matter.caseBuilder.draft = data.result;
        AdvomeMatter.save(matter);
        document.getElementById('draftPreview').textContent = data.result;
      })
      .catch(() => alert('Error editing draft.'));
    });

    document.getElementById('btnBack4').addEventListener('click', () => showPanel(3));

    document.getElementById('btnFinalise').addEventListener('click', () => {
      if (!document.getElementById('ackStep4').checked) {
        alert('Please confirm you are satisfied with the draft.');
        return;
      }
      matter.caseBuilder.finalDraft = matter.caseBuilder.draft;
      AdvomeMatter.save(matter);
      alert('Your referral draft is ready! You can now proceed to the next step.');
      window.location.href = 'conciliation.html';
    });

    // ========== SIDEBAR ==========
    function updateSidebar() {
      const cb = matter.caseBuilder;
      document.getElementById('sidebarSnapshot').innerHTML = `
        <p><strong>Story:</strong> ${cb.userStory ? '✓ captured' : '...'}</p>
        <p><strong>Substantive laws:</strong> ${cb.selectedSubstantiveLaws?.length || 0} selected</p>
        <p><strong>Procedural laws:</strong> ${cb.selectedProceduralLaws?.length || 0} selected</p>
        <p><strong>Draft:</strong> ${cb.draft ? '✓ generated' : '...'}</p>
      `;
    }

    // ========== COMPENSATION & STRENGTH (from original ccma.js) ==========
    function calculateCompensation() {
      let months = 0;
      switch(Case.dismissalType) {
        case 'misconduct': months = 6; break;
        case 'incapacity': months = 8; break;
        case 'retrenchment': months = 12; break;
        case 'constructive': months = 12; break;
        case 'automatic': months = 24; break;
        default: months = 0;
      }
      Case.compensation = Case.salary * months;
      document.getElementById('compensationAmount').textContent = 'R ' + Case.compensation.toLocaleString();
    }

    function calculateStrength() {
      let score = 0;
      if (Case.evidence.length > 0) score += 20;
      if (Case.evidence.length >= 3) score += 20;
      if (Case.witnesses.length > 0) score += 20;
      if (Case.salary > 0) score += 10;
      if (Case.dismissalType !== '') score += 15;
      if (Case.dismissalDate !== '') score += 15;
      Case.strength = score;
      const fill = document.getElementById('strengthFill');
      fill.style.width = score + '%';
      fill.style.background = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
      document.getElementById('strengthText').textContent = score + '% – ' + (score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Needs evidence');
    }

    // ========== INIT ==========
    updateSubProgress();
    updateSidebar();
    calculateCompensation();
    calculateStrength();
  </script>
</body>
</html>
