  /* ================================================================
     PM-984 WAVE 2 — staged form wizards w/ stock question banks (#39/40),
     habits wizard w/ daily-note toggle (#43), default toggle on the form
     list rows (#38 completion), T&C full-template creator (#44).
     plLoad below SHADOWS the PM-954e original (same-scope redeclaration,
     the Wave-1 pattern — edit this version, not the original). The wizard
     intercepts plOpen for onboarding/checkin/habits via the w2WizOpen hook
     just after `plEditing = item || null;`; every other kind still uses
     the legacy single-page editor. Anchor future patches on Wave-2-unique
     lines, never on shared declaration openings (§23 note, PM-983c).
     ================================================================ */
  var W2_KINDS = { onboarding: 1, checkin: 1, habits: 1 };
  var W2_ONB_BANK = [
    { label: 'Current weight (kg)', type: 'number' },
    { label: 'Waist measurement (cm)', type: 'number' },
    { label: 'Height (cm)', type: 'number' },
    { label: 'Age', type: 'number' },
    { label: 'Describe your current diet in as much detail as you can', type: 'textarea' },
    { label: 'Any food allergies or intolerances?', type: 'textarea' },
    { label: 'What supplements do you currently take?', type: 'textarea' },
    { label: 'How many years have you been training?', type: 'number' },
    { label: 'What does your current training week look like?', type: 'textarea' },
    { label: 'Describe your goal physique or goal outcome', type: 'textarea' },
    { label: 'Any medical issues or injuries I should know about?', type: 'textarea', required: true },
    { label: 'Anything else you want me to know?', type: 'textarea' },
    { label: 'Current photos (front, back, side)', type: 'photo' }
  ];
  var W2_CI_BANK = [
    { label: 'How did your diet go last week?', type: 'textarea' },
    { label: 'Did you stick to your plan?', type: 'yesno' },
    { label: 'How do you feel overall this week?', type: 'scale' },
    { label: 'Progress photo \u2014 front', type: 'photo' },
    { label: 'Progress photo \u2014 back', type: 'photo' },
    { label: 'Progress photo \u2014 side', type: 'photo' },
    { label: 'Anything else for your coach?', type: 'textarea' }
  ];
  var W2_CI_PROGRESS = [
    { label: 'Weight (kg)', type: 'number' },
    { label: 'Waist (cm)', type: 'number' },
    { label: 'Hips (cm)', type: 'number' },
    { label: 'Chest (cm)', type: 'number' },
    { label: 'Arms (cm)', type: 'number' },
    { label: 'Thighs (cm)', type: 'number' },
    { label: 'Average sleep (hours per night)', type: 'number' },
    { label: 'Water (litres per day)', type: 'number' },
    { label: 'Energy levels this week', type: 'scale' },
    { label: 'Stress levels this week', type: 'scale' }
  ];
  var W2_HABIT_BANK = [
    { title: 'Drink 2L of water', description: 'Spread it across the day \u2014 a glass with every meal is an easy start.' },
    { title: 'Walk 10,000 steps', description: 'Counts automatically when your health data is linked.', steps_target: 10000 },
    { title: 'Meditate for 10 minutes', description: 'Any guided session counts \u2014 consistency beats duration.' },
    { title: 'Get 10 minutes of sunshine', description: 'Ideally in the first half of the day.' }
  ];
  var W2_STEPS_FORM = ['Set up', 'Your own questions', 'Order & publish'];
  var W2_STEPS_HAB = ['Set up', 'Your own habits', 'Options & publish'];
  var wizS = null;

  function w2Bank(){ return plKind === 'onboarding' ? W2_ONB_BANK : plKind === 'checkin' ? W2_CI_BANK : []; }
  function w2Steps(){ return plKind === 'habits' ? W2_STEPS_HAB : W2_STEPS_FORM; }

  function w2WizOpen(item){
    if (!W2_KINDS[plKind]) return false;
    // Clear any legacy-editor remnants so #q-rows / #h-rows inside the wizard
    // body are the only instances $c() can find (duplicate-id trap).
    $c('pl-body').innerHTML = '';
    $c('pl-editor').style.display = 'none';
    wizS = {
      step: 1,
      title: item ? (item.title || item.name || '') : '',
      items: [],
      allowNote: !!(item && item.payload && item.payload.allow_note),
      makeDefault: !!(item && item.is_default),
      wasDefault: !!(item && item.is_default)
    };
    if (plKind === 'habits'){
      var hs = (item && item.payload && item.payload.habits) || [];
      if (item){
        hs.forEach(function(h){
          var bi = -1;
          W2_HABIT_BANK.forEach(function(b, i){ if (bi < 0 && b.title === h.title && !h.lib_id && !h.input) bi = i; });
          if (bi >= 0) wizS.items.push({ src: 'bank', bi: bi, title: h.title, description: h.description || W2_HABIT_BANK[bi].description || '', steps_target: h.steps_target || W2_HABIT_BANK[bi].steps_target });
          else wizS.items.push({ src: 'own', title: h.title, description: h.description || '', steps_target: h.steps_target, lib_id: h.lib_id, input: h.input });
        });
      } else {
        W2_HABIT_BANK.forEach(function(b, i){ wizS.items.push({ src: 'bank', bi: i, title: b.title, description: b.description || '', steps_target: b.steps_target }); });
      }
    } else {
      var bank = w2Bank();
      if (item){
        (item.questions || []).forEach(function(q){
          var bi = -1, pi = -1;
          bank.forEach(function(b, i){ if (bi < 0 && b.label === q.label) bi = i; });
          if (plKind === 'checkin') W2_CI_PROGRESS.forEach(function(b, i){ if (pi < 0 && b.label === q.label) pi = i; });
          if (bi >= 0) wizS.items.push({ src: 'bank', bi: bi, label: q.label, type: q.type || bank[bi].type, required: !!q.required, options: q.options });
          else if (pi >= 0) wizS.items.push({ src: 'prog', pi: pi, label: q.label, type: q.type || W2_CI_PROGRESS[pi].type, required: !!q.required, section: 'progress' });
          else wizS.items.push({ src: 'own', label: q.label, type: q.type || 'text', required: !!q.required, options: q.options, section: q.section });
        });
      } else {
        bank.forEach(function(b, i){ wizS.items.push({ src: 'bank', bi: i, label: b.label, type: b.type, required: !!b.required }); });
      }
    }
    $c('wiz-title').textContent = (item ? 'Edit ' : 'New ') + KIND_LABEL[plKind];
    $c('wiz-msg').textContent = '';
    $c('wiz-editor').style.display = '';
    w2Render();
    try { $c('wiz-editor').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_){}
    return true;
  }

  function w2HasBank(src, idx){
    return wizS.items.some(function(it){ return it.src === src && (src === 'bank' ? it.bi === idx : it.pi === idx); });
  }
  function w2Chips(){
    $c('wiz-chips').innerHTML = w2Steps().map(function(s, i){
      var n = i + 1, on = n === wizS.step, done = n < wizS.step;
      return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:' + (on ? '800' : '600') + ';color:' + (on ? 'var(--teal-lt,var(--vyve-teal))' : done ? 'var(--text)' : 'var(--text-muted)') + ';border:1px solid ' + (on ? 'var(--vyve-teal)' : 'var(--border)') + ';border-radius:999px;padding:5px 12px;">' +
        '<span style="width:16px;height:16px;border-radius:50%;background:' + (done ? 'var(--vyve-teal)' : 'transparent') + ';border:1px solid ' + (on || done ? 'var(--vyve-teal)' : 'var(--border)') + ';color:' + (done ? '#fff' : 'inherit') + ';font-size:10px;display:inline-flex;align-items:center;justify-content:center;">' + (done ? '\u2713' : n) + '</span>' + s + '</span>';
    }).join('');
  }

  function w2BankRow(kind, idx, item, checked){
    var name = plKind === 'habits' ? item.title : item.label;
    var sub = plKind === 'habits' ? (item.description || '') : ('Answer type: ' + (QTYPES.filter(function(t){ return t[0] === item.type; })[0] || ['', item.type])[1]);
    return '<label style="display:flex;gap:10px;align-items:flex-start;padding:9px 4px;border-bottom:1px solid var(--border);cursor:pointer;">' +
      '<input type="checkbox" class="w2-bank" data-src="' + kind + '" data-i="' + idx + '"' + (checked ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);margin-top:2px;"/>' +
      '<span style="flex:1;min-width:0;"><span style="display:block;font-size:13px;font-weight:600;">' + esc(name) + '</span>' +
      (sub ? '<span style="display:block;font-size:11.5px;color:var(--text-muted);">' + esc(sub) + '</span>' : '') + '</span>' +
      (item.steps_target ? '<span style="font-size:10.5px;font-weight:800;color:var(--vyve-gold,#C9A84C);flex:none;">\u26a1 AUTO</span>' : '') + '</label>';
  }

  function w2RenderStep1(){
    var b = $c('wiz-body');
    var bank = plKind === 'habits' ? W2_HABIT_BANK : w2Bank();
    var intro = plKind === 'habits'
      ? 'Name the plan, then tick the starter habits you want in it. You add your own on the next step.'
      : 'Name the form, then tick the stock questions you want to include. You add your own on the next step.';
    var html = '<div class="field" style="margin-bottom:12px;"><label>Name</label><input id="wizf-name" type="text" maxlength="120" value="' + esc(wizS.title) + '" placeholder="e.g. ' + (plKind === 'onboarding' ? 'New Client Questionnaire' : plKind === 'checkin' ? 'Weekly Check-In' : 'Daily Foundations') + '"/></div>' +
      '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px;">' + intro + '</p>' +
      '<div style="display:flex;gap:8px;margin-bottom:4px;"><button class="btn" id="w2-all" type="button" style="font-size:11.5px;">Add all</button><button class="btn" id="w2-none" type="button" style="font-size:11.5px;">Clear all</button></div>' +
      '<div id="w2-bankrows">' + bank.map(function(it, i){ return w2BankRow('bank', i, it, w2HasBank('bank', i)); }).join('') + '</div>';
    if (plKind === 'checkin'){
      var progOn = W2_CI_PROGRESS.filter(function(_, i){ return w2HasBank('prog', i); }).length;
      html += '<details id="w2-prog" style="margin-top:14px;border:1px solid var(--border);border-radius:10px;padding:10px 12px;"' + (progOn ? ' open' : '') + '>' +
        '<summary style="cursor:pointer;font-size:13px;font-weight:700;">Progress tracking questions <span style="font-weight:600;color:var(--text-muted);">\u2014 numbers your client fills in each week (weight, measurements, sleep\u2026)</span></summary>' +
        '<div style="display:flex;gap:8px;margin:8px 0 2px;"><button class="btn" id="w2-pall" type="button" style="font-size:11.5px;">Add all</button><button class="btn" id="w2-pnone" type="button" style="font-size:11.5px;">Clear all</button></div>' +
        W2_CI_PROGRESS.map(function(it, i){ return w2BankRow('prog', i, it, w2HasBank('prog', i)); }).join('') + '</details>';
    }
    b.innerHTML = html;
    function setAll(src, on){
      b.querySelectorAll('.w2-bank[data-src="' + src + '"]').forEach(function(cb){ cb.checked = on; });
    }
    var ba = $c('w2-all'), bn = $c('w2-none');
    if (ba) ba.addEventListener('click', function(){ setAll('bank', true); });
    if (bn) bn.addEventListener('click', function(){ setAll('bank', false); });
    var pa = $c('w2-pall'), pn = $c('w2-pnone');
    if (pa) pa.addEventListener('click', function(){ setAll('prog', true); });
    if (pn) pn.addEventListener('click', function(){ setAll('prog', false); });
  }
  function w2CollectStep1(){
    wizS.title = ($c('wizf-name') && $c('wizf-name').value.trim()) || wizS.title;
    var banks = { bank: plKind === 'habits' ? W2_HABIT_BANK : w2Bank(), prog: W2_CI_PROGRESS };
    document.querySelectorAll('#wiz-body .w2-bank').forEach(function(cb){
      var src = cb.dataset.src, i = parseInt(cb.dataset.i), on = cb.checked, has = w2HasBank(src, i);
      if (on && !has){
        var it = banks[src][i];
        if (plKind === 'habits') wizS.items.push({ src: 'bank', bi: i, title: it.title, description: it.description || '', steps_target: it.steps_target });
        else if (src === 'prog') wizS.items.push({ src: 'prog', pi: i, label: it.label, type: it.type, required: false, section: 'progress' });
        else wizS.items.push({ src: 'bank', bi: i, label: it.label, type: it.type, required: !!it.required });
      } else if (!on && has){
        wizS.items = wizS.items.filter(function(it){ return !(it.src === src && (src === 'bank' ? it.bi === i : it.pi === i)); });
      }
    });
  }

  function w2RenderStep2(){
    var b = $c('wiz-body');
    var own = wizS.items.filter(function(it){ return it.src === 'own'; });
    if (plKind === 'habits'){
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Write your own habits or pull them from the VYVE library (\u26a1 ones auto-tick from your client\u2019s linked health data).</p>' +
        '<div id="h-rows"></div>' +
        '<div style="display:flex;gap:8px;margin-top:6px;"><button class="btn" id="w2h-add" type="button" style="font-size:12px;">+ Write your own</button><button class="btn" id="w2h-lib" type="button" style="font-size:12px;">+ From VYVE library</button></div>' +
        '<div id="w2h-libpick" style="display:none;max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-top:8px;padding:6px;"></div>';
      own.forEach(function(h){ addHRow(h); });
      $c('w2h-add').addEventListener('click', function(){ addHRow({}); });
      $c('w2h-lib').addEventListener('click', async function(){
        var box = $c('w2h-libpick');
        if (box.style.display !== 'none'){ box.style.display = 'none'; return; }
        box.style.display = ''; box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">Loading\u2026</p>';
        if (!stockHabits){
          try { stockHabits = await rest('/habit_library?active=eq.true&or=(created_by.is.null,created_by.not.like.coach:*)&order=habit_title.asc&limit=100&select=id,habit_title,habit_description,health_rule') || []; }
          catch(e){ box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">Couldn\u2019t load the library \u2014 try again.</p>'; stockHabits = null; return; }
        }
        box.innerHTML = stockHabits.map(function(sh, i){
          return '<button type="button" class="w2h-libitem" data-i="' + i + '" style="display:flex;width:100%;text-align:left;gap:8px;align-items:center;background:none;border:none;border-bottom:1px solid var(--border);padding:9px 8px;cursor:pointer;color:var(--text);font-family:inherit;">' +
            '<span style="flex:1;min-width:0;"><span style="font-size:13px;font-weight:600;">' + esc(sh.habit_title) + '</span>' +
            (sh.habit_description ? '<span style="display:block;font-size:11.5px;color:var(--text-muted);">' + esc(sh.habit_description) + '</span>' : '') + '</span>' +
            (sh.health_rule ? '<span style="font-size:10.5px;font-weight:800;color:var(--vyve-gold,#C9A84C);flex:none;">\u26a1 AUTO</span>' : '') + '</button>';
        }).join('');
        box.querySelectorAll('.w2h-libitem').forEach(function(btn){
          btn.addEventListener('click', function(){
            var sh = stockHabits[parseInt(btn.dataset.i)];
            addHRow({ lib_id: sh.id, title: sh.habit_title, description: sh.habit_description || '', auto: !!sh.health_rule });
            box.style.display = 'none';
          });
        });
      });
    } else {
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Anything the stock bank doesn\u2019t cover \u2014 add as many of your own questions as you like, or skip straight to the next step.</p>' +
        '<div id="q-rows"></div>' +
        '<button class="btn" id="w2q-add" type="button" style="font-size:12px;margin-top:6px;">+ Add question</button>';
      own.forEach(function(q){ addQRow(q); });
      $c('w2q-add').addEventListener('click', function(){ addQRow({}); });
    }
  }
  function w2CollectStep2(){
    var keep = wizS.items.filter(function(it){ return it.src !== 'own'; });
    var col = plCollect(); // reads #q-rows / #h-rows — the wizard body owns the only instance
    var own = [];
    if (plKind === 'habits'){
      ((col.payload && col.payload.habits) || []).forEach(function(h){ h.src = 'own'; own.push(h); });
    } else {
      (col.questions || []).forEach(function(q){ own.push({ src: 'own', label: q.label, type: q.type, required: !!q.required, options: q.options }); });
    }
    wizS.items = keep.concat(own);
  }

  function w2RenderStep3(){
    var b = $c('wiz-body');
    var isHab = plKind === 'habits';
    var head = isHab
      ? '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Set the order your client sees, then choose the plan options and publish.</p>'
      : '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Set the order your client sees, fine-tune answer types, then publish.</p>';
    var rows = wizS.items.map(function(it, i){
      var name = isHab ? it.title : it.label;
      var secBadge = it.section === 'progress' ? '<span style="font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--teal-lt,var(--vyve-teal));border:1px solid var(--vyve-teal);border-radius:6px;padding:1px 6px;flex:none;">PROGRESS</span>' : '';
      var mid;
      if (isHab){
        mid = '<span style="font-size:11.5px;color:var(--text-muted);flex:none;">' + (it.lib_id ? 'VYVE library' : it.steps_target ? '\u26a1 ' + it.steps_target.toLocaleString() + ' steps' : it.input ? ({ number: 'Number', scale: '1\u201310 scale', text: 'Text' }[it.input.type] || 'Typed') : 'Tick') + '</span>';
      } else {
        mid = '<select class="w2p-type" data-i="' + i + '" style="font-size:11.5px;padding:4px 6px;border:1px solid var(--border);border-radius:7px;background:var(--surface-2);color:var(--text);flex:none;">' +
          QTYPES.map(function(t){ return '<option value="' + t[0] + '"' + (it.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' +
          '<label style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px;cursor:pointer;flex:none;"><input type="checkbox" class="w2p-req" data-i="' + i + '"' + (it.required ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);"/>Req</label>';
      }
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid var(--border);">' +
        '<span style="display:flex;flex-direction:column;gap:2px;flex:none;">' +
        '<button class="btn w2p-up" data-i="' + i + '" type="button" style="font-size:10px;padding:1px 7px;line-height:1.4;"' + (i === 0 ? ' disabled' : '') + '>\u25b2</button>' +
        '<button class="btn w2p-dn" data-i="' + i + '" type="button" style="font-size:10px;padding:1px 7px;line-height:1.4;"' + (i === wizS.items.length - 1 ? ' disabled' : '') + '>\u25bc</button></span>' +
        '<span style="flex:1;min-width:0;font-size:13px;font-weight:600;">' + esc(name) + '</span>' + secBadge + mid +
        '<button class="btn w2p-del" data-i="' + i + '" type="button" style="font-size:11px;padding:4px 8px;">\u00d7</button></div>';
    }).join('');
    var foot = '';
    if (isHab){
      foot = '<label style="display:flex;gap:10px;align-items:flex-start;border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:14px;cursor:pointer;">' +
        '<input type="checkbox" id="w2-note"' + (wizS.allowNote ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);margin-top:2px;"/>' +
        '<span><span style="display:block;font-size:13px;font-weight:700;">Clients can add a daily note</span>' +
        '<span style="display:block;font-size:11.5px;color:var(--text-muted);">A short \u201cnote for your coach\u201d box on each logged habit \u2014 the notes show up in your Daily check-ins grid.</span></span></label>';
    } else if (plKind === 'onboarding' || plKind === 'checkin'){
      foot = '<label style="display:flex;gap:10px;align-items:flex-start;border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:14px;cursor:pointer;">' +
        '<input type="checkbox" id="w2-def"' + (wizS.makeDefault ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);margin-top:2px;"/>' +
        '<span><span style="display:block;font-size:13px;font-weight:700;">Make this my default ' + KIND_LABEL[plKind] + '</span>' +
        '<span style="display:block;font-size:11.5px;color:var(--text-muted);">Preselected automatically when you add a new client.</span></span></label>';
    }
    b.innerHTML = head + '<div id="w2p-rows">' + rows + '</div>' + foot;
    function move(i, d){
      var j = i + d;
      if (j < 0 || j >= wizS.items.length) return;
      var t = wizS.items[i]; wizS.items[i] = wizS.items[j]; wizS.items[j] = t;
      w2RenderStep3();
    }
    b.querySelectorAll('.w2p-up').forEach(function(x){ x.addEventListener('click', function(){ move(parseInt(x.dataset.i), -1); }); });
    b.querySelectorAll('.w2p-dn').forEach(function(x){ x.addEventListener('click', function(){ move(parseInt(x.dataset.i), 1); }); });
    b.querySelectorAll('.w2p-del').forEach(function(x){ x.addEventListener('click', function(){ wizS.items.splice(parseInt(x.dataset.i), 1); w2RenderStep3(); }); });
    b.querySelectorAll('.w2p-type').forEach(function(x){ x.addEventListener('change', function(){ wizS.items[parseInt(x.dataset.i)].type = x.value; }); });
    b.querySelectorAll('.w2p-req').forEach(function(x){ x.addEventListener('change', function(){ wizS.items[parseInt(x.dataset.i)].required = x.checked; }); });
    var wn = $c('w2-note');
    if (wn) wn.addEventListener('change', function(){ wizS.allowNote = wn.checked; });
    var wd = $c('w2-def');
    if (wd) wd.addEventListener('change', function(){ wizS.makeDefault = wd.checked; });
  }

  function w2Render(){
    w2Chips();
    $c('wiz-msg').textContent = '';
    $c('wiz-back').style.display = wizS.step === 1 ? 'none' : '';
    $c('wiz-next').style.display = wizS.step === 3 ? 'none' : '';
    $c('wiz-save').style.display = wizS.step === 3 ? '' : 'none';
    if (wizS.step === 1) w2RenderStep1();
    else if (wizS.step === 2) w2RenderStep2();
    else w2RenderStep3();
  }
  function w2Collect(){
    if (wizS.step === 1) w2CollectStep1();
    else if (wizS.step === 2) w2CollectStep2();
  }
  $c('wiz-cancel').addEventListener('click', function(){
    $c('wiz-editor').style.display = 'none'; $c('wiz-body').innerHTML = ''; wizS = null;
  });
  $c('wiz-back').addEventListener('click', function(){ if (!wizS) return; w2Collect(); wizS.step--; w2Render(); });
  $c('wiz-next').addEventListener('click', function(){
    if (!wizS) return;
    w2Collect();
    if (wizS.step === 1 && !wizS.title){ $c('wiz-msg').textContent = 'Give it a name first.'; return; }
    wizS.step++; w2Render();
  });
  $c('wiz-save').addEventListener('click', w2Save);

  async function w2Save(){
    if (!wizS) return;
    var btn = $c('wiz-save'), msg = $c('wiz-msg');
    var name = wizS.title.trim();
    if (!name){ msg.textContent = 'Give it a name (step 1).'; return; }
    if (!wizS.items.length){ msg.textContent = plKind === 'habits' ? 'Add at least one habit.' : 'Include at least one question.'; return; }
    btn.disabled = true; msg.textContent = 'Publishing\u2026';
    try {
      if (plKind === 'habits'){
        var payload = { habits: wizS.items.map(function(h){
          var o = { title: h.title };
          if (h.lib_id) o.lib_id = h.lib_id;
          if (h.description) o.description = h.description;
          if (h.steps_target) o.steps_target = h.steps_target;
          if (h.input) o.input = h.input;
          return o;
        }), allow_note: !!wizS.allowNote };
        if (plEditing) await rest('/coach_templates?id=eq.' + plEditing.id, { method: 'PATCH', body: { name: name, payload: payload, updated_at: new Date().toISOString() } });
        else await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: 'habits', name: name, payload: payload } });
      } else {
        var qs = wizS.items.map(function(q, i){
          var o = { id: 'q' + (i + 1), label: q.label, type: q.type || 'text' };
          if (q.required) o.required = true;
          if (q.type === 'select' && q.options && q.options.length) o.options = q.options;
          if (q.section) o.section = q.section;
          return o;
        });
        var fid = plEditing && plEditing.id;
        if (plEditing) await rest('/coach_forms?id=eq.' + fid, { method: 'PATCH', body: { title: name, questions: qs, updated_at: new Date().toISOString() } });
        else {
          await rest('/coach_forms', { method: 'POST', body: { partner_id: partnerId, kind: plKind, title: name, questions: qs } });
          var got = await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&title=eq.' + encodeURIComponent(name) + '&active=eq.true&order=created_at.desc&limit=1&select=id');
          fid = got && got[0] && got[0].id;
        }
        if (fid){
          if (wizS.makeDefault) await w2SetDefault(fid);
          else if (wizS.wasDefault && !wizS.makeDefault) await rest('/coach_forms?id=eq.' + fid, { method: 'PATCH', body: { is_default: false } });
        }
      }
      $c('wiz-editor').style.display = 'none'; $c('wiz-body').innerHTML = ''; wizS = null;
      await plLoad(); loadLibraries();
    } catch(e){
      msg.textContent = String(e.message).indexOf('409') >= 0 ? 'You already have one with that name.' : ('Save failed: ' + e.message);
      btn.disabled = false;
      return;
    }
    btn.disabled = false;
  }
  async function w2SetDefault(id){
    // One default per coach per kind among active (partial unique index) —
    // clear the incumbent first, then set. Sequential on purpose.
    await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&is_default=eq.true&id=neq.' + id, { method: 'PATCH', body: { is_default: false } });
    await rest('/coach_forms?id=eq.' + id, { method: 'PATCH', body: { is_default: true } });
  }

  /* ── plLoad v3 (shadows PM-954e): list rows gain the DEFAULT pill /
        Set-default action for onboarding+checkin, and a daily-notes tag
        on habits plans. ── */
  async function plLoad(){
    var el = $c('pl-list');
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    try {
      if (IS_FORM(plKind)) plItems = await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
      else plItems = await rest('/coach_templates?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
    } catch(e){ plItems = []; }
    if (!plItems.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing here yet</h3><p>Create your first ' + KIND_LABEL[plKind] + ' and it becomes assignable to clients.</p></div>'; return; }
    var defable = plKind === 'onboarding' || plKind === 'checkin';
    el.innerHTML = plItems.map(function(it){
      var name = it.title || it.name;
      var sub = IS_FORM(plKind) ? ((it.questions||[]).length + ' questions') : summarise(it.payload||{});
      if (plKind === 'habits' && it.payload && it.payload.allow_note) sub += ' \u00b7 daily notes on';
      var defBit = '';
      if (defable){
        defBit = it.is_default
          ? '<span style="font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--vyve-gold,#C9A84C);border:1px solid var(--vyve-gold,#C9A84C);border-radius:6px;padding:3px 8px;flex:none;">DEFAULT</span>'
          : '<button class="btn" data-pl-def="' + it.id + '" style="font-size:11px;padding:5px 9px;">Set default</button>';
      }
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);">' +
        '<div style="flex:1;min-width:0;"><div style="font-weight:600;">' + esc(name) + '</div><div style="font-size:12px;color:var(--text-muted);">' + esc(sub) + '</div></div>' + defBit +
        '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
        '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button></div>';
    }).join('');
    el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(plItems.find(function(x){ return x.id === b.dataset.plEdit; })); }); });
    el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
    el.querySelectorAll('[data-pl-def]').forEach(function(b){ b.addEventListener('click', async function(){
      b.disabled = true;
      try { await w2SetDefault(b.dataset.plDef); } catch(e){ alert('Couldn\u2019t set default: ' + e.message); }
      plLoad(); loadLibraries();
    }); });
  }

  /* ── T&C full-template creator (#44). Placeholder boilerplate — Lewis
        wording pass is non-gating. Payment section deliberately states VYVE
        never processes coaching payments. ── */
  var W2_TC_TEMPLATE = [
    '## Coaching Terms & Conditions',
    '',
    '**1. Introduction.** These terms set out the coaching relationship between you (the client) and [Your Business Name] (the coach). They cover the coaching service only \u2014 your VYVE Health app membership has its own separate terms.',
    '',
    '**2. Acceptance.** By accepting these terms in the VYVE Health app you agree to everything set out below. If anything is unclear, ask before accepting.',
    '',
    '**3. The service.** [Your Business Name] provides personalised training programmes, daily habit plans, nutrition guidance, supplement recommendations and regular check-in reviews, delivered through the VYVE Health app.',
    '',
    '**4. Your responsibilities.** Complete your check-ins honestly and on time, follow the programme as prescribed, and tell your coach straight away about any injury, illness or medication change. Coaching only works with accurate information.',
    '',
    '**5. Payment & fees.** Coaching fees, the payment schedule and any cancellation charges are agreed and paid directly between you and [Your Business Name], outside the VYVE Health app. VYVE Health never handles, processes or refunds coaching payments. Your VYVE app subscription is separate and billed independently by VYVE Health.',
    '',
    '**6. Confidentiality.** Everything you share for coaching \u2014 check-ins, photos, messages and measurements \u2014 is used only to deliver your coaching and is never shared with third parties without your consent, except where the law requires it.',
    '',
    '**7. Liability & health disclaimer.** [Your Business Name] is not a medical professional and nothing provided is medical advice. Consult your GP before starting if you have any condition affecting exercise or diet. You take part in training at your own risk; nothing in these terms limits any liability that cannot be limited by law.',
    '',
    '**8. Intellectual property.** Programmes, plans and materials created for you remain the intellectual property of [Your Business Name]. They are for your personal use only and may not be shared, resold or republished.',
    '',
    '**9. Ending coaching.** Either of us can end the coaching arrangement with 7 days\u2019 written notice. Any refund of pre-paid coaching fees is a matter between you and [Your Business Name]. Your VYVE membership and your data in the app are unaffected.',
    '',
    '**10. Governing law.** These terms are governed by the law of England and Wales, and any dispute will be dealt with by the courts of England and Wales.'
  ].join('\n');
  $c('ct-boiler').addEventListener('click', async function(){
    if ($c('ct-editor').value.trim() && !confirm('Replace what\u2019s in the editor with the full template?')) return;
    var nm = '[Your Business Name]';
    try {
      var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=name&limit=1');
      if (p && p[0] && p[0].name) nm = p[0].name;
    } catch(_){}
    $c('ct-editor').value = W2_TC_TEMPLATE.split('[Your Business Name]').join(nm);
    $c('ct-msg').textContent = nm === '[Your Business Name]'
      ? 'Template loaded \u2014 replace [Your Business Name] throughout, review each section, then publish.'
      : 'Template loaded with your name filled in \u2014 review each section (especially Payment & fees), then publish.';
  });
  /* ============================ end PM-984 Wave 2 ============================ */

