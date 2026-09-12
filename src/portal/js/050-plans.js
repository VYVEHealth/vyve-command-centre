  function W9_QTYPE(t){ return t === 'longtext' ? 'textarea' : (t || 'text'); }
  function W9_CHOICE(t){ t = W9_QTYPE(t); return t === 'select' || t === 'multiselect'; }
  var QTYPES = [['text','Short answer'],['textarea','Long answer'],['number','Number'],['scale','1\u201310 scale'],['stars','1\u20135 stars'],['select','Multiple choice'],['multiselect','Multi-select'],['yesno','Yes / No'],['photo','Photo upload'],['video','Video upload']];
  var CHECKIN_DEFAULTS = [{label:'Tell us about your week',type:'textarea'},{label:'Did you stick to your plan?',type:'yesno'},{label:'How do you feel overall?',type:'scale'},{label:'Current photos (front, back, side)',type:'photo'},{label:'Anything else for your coach?',type:'textarea'}];
  function rowBtn(label, cls){ return '<button class="btn ' + (cls||'') + '" type="button" style="font-size:11.5px;padding:5px 10px;">' + label + '</button>'; }
  async function plLoad(){
    var el = $c('pl-list');
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    try {
      if (IS_FORM(plKind)) plItems = await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
      else plItems = await rest('/coach_templates?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
    } catch(e){ plItems = []; }
    if (!plItems.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing here yet</h3><p>Create your first ' + KIND_LABEL[plKind] + ' and it becomes assignable to clients.</p></div>'; return; }
    el.innerHTML = plItems.map(function(it){
      var name = it.title || it.name;
      var sub = IS_FORM(plKind) ? ((it.questions||[]).length + ' questions') : summarise(it.payload||{});
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);">' +
        '<div style="flex:1;"><div style="font-weight:600;">' + esc(name) + '</div><div style="font-size:12px;color:var(--text-muted);">' + esc(sub) + '</div></div>' +
        '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
        '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button></div>';
    }).join('');
    el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(plItems.find(function(x){ return x.id === b.dataset.plEdit; })); }); });
    el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
  }
  function summarise(p){
    if (plKind === 'habits') return ((p.habits||[]).length) + ' habits';
    if (plKind === 'workout') return ((p.sessions||[]).length) + ' sessions / week';
    if (plKind === 'workout_day') return ((p.exercises||[]).length) + ' exercises' + (dayHasGroups(p) ? ' \u00b7 supersets' : '');
    if (plKind === 'program') return ((p.weeks||[]).length) + ' weeks \u00b7 ' + progDayCount(p) + ' training days';
    if (plKind === 'nutrition') return (p.calories ? p.calories + ' kcal' : (p.meals || p.pdf_path ? '' : 'targets')) + (p.protein_g ? ' \u00b7 ' + p.protein_g + 'g protein' : '') + (p.meals ? (p.calories ? ' \u00b7 ' : '') + p.meals.length + '-meal plan' : '') + (p.pdf_path ? (p.calories || p.meals ? ' \u00b7 ' : '') + 'PDF attached' : '');
    if (plKind === 'supplements') return ((p.items||[]).length) + ' supplements';
    return '';
  }
  async function plDelete(id){
    if (!confirm('Delete this ' + KIND_LABEL[plKind] + '? Clients it was already applied to are unaffected.')) return;
    var path = IS_FORM(plKind) ? '/coach_forms' : '/coach_templates';
    try { await rest(path + '?id=eq.' + id, { method: 'PATCH', body: { active: false } }); } catch(e){ alert('Delete failed: ' + e.message); }
    await plLoad(); loadLibraries();
  }
  function plOpen(item){
    plEditing = item || null;
    if (w2WizOpen(item)) return; // PM-984: onboarding/checkin/habits use the staged wizard
    if (w4Open(item)) return; // PM-986 Wave 4: nutrition/meal/food/supplements use the Wave 4 editors
    $c('pl-editor').style.display = '';
    $c('pl-editor-title').textContent = (item ? 'Edit ' : 'New ') + KIND_LABEL[plKind];
    $c('plf-name').value = item ? (item.title || item.name) : '';
    $c('pl-msg').textContent = '';
    var b = $c('pl-body');
    if (IS_FORM(plKind)){
      b.innerHTML = '<div id="q-rows"></div><button class="btn" id="q-add" type="button" style="font-size:12px;margin-top:6px;">+ Add question</button>';
      var seedQs = (item && item.questions && item.questions.length) ? item.questions : (plKind === 'checkin' ? CHECKIN_DEFAULTS : [{}]);
      seedQs.forEach(addQRow);
      $c('q-add').addEventListener('click', function(){ addQRow({}); });
    } else if (plKind === 'habits'){
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Mix and match: pick from the VYVE habit library (\u26a1 ones auto-tick from your client\u2019s linked health data \u2014 steps, sleep, workouts) or write your own. Your own habits can auto-track a daily step target too.</p><div id="h-rows"></div><div style="display:flex;gap:8px;margin-top:6px;"><button class="btn" id="h-add" type="button" style="font-size:12px;">+ Write your own</button><button class="btn" id="h-lib" type="button" style="font-size:12px;">+ From VYVE library</button></div><div id="h-libpick" style="display:none;max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-top:8px;padding:6px;"></div>';
      var hs = (item && item.payload && item.payload.habits && item.payload.habits.length) ? item.payload.habits : [{}];
      hs.forEach(addHRow);
      $c('h-add').addEventListener('click', function(){ addHRow({}); });
      $c('h-lib').addEventListener('click', async function(){
        var box = $c('h-libpick');
        if (box.style.display !== 'none'){ box.style.display = 'none'; return; }
        box.style.display = ''; box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">Loading\u2026</p>';
        if (!stockHabits){
          try { stockHabits = await rest('/habit_library?active=eq.true&or=(created_by.is.null,created_by.not.like.coach:*)&order=habit_title.asc&limit=100&select=id,habit_title,habit_description,health_rule') || []; }
          catch(e){ box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">Couldn\u2019t load the library \u2014 try again.</p>'; stockHabits = null; return; }
        }
        box.innerHTML = stockHabits.map(function(sh, i){
          return '<button type="button" class="h-libitem" data-i="' + i + '" style="display:flex;width:100%;text-align:left;gap:8px;align-items:center;background:none;border:none;border-bottom:1px solid var(--border);padding:9px 8px;cursor:pointer;color:var(--text);font-family:inherit;">' +
            '<span style="flex:1;min-width:0;"><span style="font-size:13px;font-weight:600;">' + esc(sh.habit_title) + '</span>' +
            (sh.habit_description ? '<span style="display:block;font-size:11.5px;color:var(--text-muted);">' + esc(sh.habit_description) + '</span>' : '') + '</span>' +
            (sh.health_rule ? '<span style="font-size:10.5px;font-weight:800;color:var(--vyve-gold,#C9A84C);flex:none;">\u26a1 AUTO</span>' : '') + '</button>';
        }).join('');
        box.querySelectorAll('.h-libitem').forEach(function(btn){
          btn.addEventListener('click', function(){
            var sh = stockHabits[parseInt(btn.dataset.i)];
            addHRow({ lib_id: sh.id, title: sh.habit_title, description: sh.habit_description || '', auto: !!sh.health_rule });
            box.style.display = 'none';
          });
        });
      });
    } else if (plKind === 'workout'){
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Build one training week \u2014 it repeats until you change it. Exercise names matching the VYVE library get demo videos automatically in the app.</p><div class="field" style="margin-bottom:10px;"><label>Workout instructions (shown to the client)</label><textarea id="w-instructions" rows="2" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;">' + esc((item && item.payload && item.payload.instructions) || '') + '</textarea></div><div id="w-sessions"></div><button class="btn" id="w-add-session" type="button" style="font-size:12px;margin-top:6px;">+ Add session</button><datalist id="ex-names">' + exerciseNames.map(function(n){ return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>';
      var ss = (item && item.payload && item.payload.sessions && item.payload.sessions.length) ? item.payload.sessions : [{ name: 'Session 1', exercises: [{}] }];
      ss.forEach(addWSession);
      $c('w-add-session').addEventListener('click', function(){ addWSession({ name: 'Session ' + ($c('w-sessions').children.length + 1), exercises: [{}] }); });
    } else if (plKind === 'workout_day'){
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">A reusable training day. Drop it into any programme \u2014 each programme keeps its own copy, so editing here never changes what\u2019s already assigned. Give exercises the same letter to make a superset or circuit.</p><div id="dt-editor"></div>' + cexDatalist();
      renderDayEditor($c('dt-editor'), (item && item.payload) || { exercises: [{}] });
    } else if (plKind === 'program'){
      progState = deepCopy((item && item.payload) || { instructions: '', weeks: [emptyWeek()] });
      if (!progState.weeks || !progState.weeks.length) progState.weeks = [emptyWeek()];
      progWeekIdx = 0; progEditingDay = null;
      b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Assemble day templates into weeks. Every week is its own copy \u2014 vary and progress each one. Empty slots are rest days.</p>' +
        '<div class="field" style="margin-bottom:10px;"><label>Programme notes (shown to the client)</label><textarea id="pg-instructions" rows="2" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;">' + esc(progState.instructions || '') + '</textarea></div>' +
        '<div id="pg-tabs" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"></div>' +
        '<div id="pg-quick" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 12px;margin-top:10px;"><span style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin-right:2px;">Progress this week</span>' + rowBtn('+1 set on all','pg-addset') + rowBtn('\u22121 RIR on all','pg-subrir') + '</div>' +
        '<div id="pg-slots" class="pg-slots"></div>' +
        '<div id="pg-dayedit" style="display:none;border:1px solid var(--vyve-teal);border-radius:12px;padding:14px;margin-top:12px;"></div>' + cexDatalist();
      loadDayTplChoices().then(renderProg);
      $c('pg-quick').querySelector('.pg-addset').addEventListener('click', function(){ progQuick('set'); });
      $c('pg-quick').querySelector('.pg-subrir').addEventListener('click', function(){ progQuick('rir'); });
    } else if (plKind === 'nutrition'){
      var p = (item && item.payload) || {};
      plPdf = p.pdf_path ? { path: p.pdf_path, name: p.pdf_name || 'plan.pdf' } : null;
      b.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
          '<button class="btn nf-mode btn-primary" data-m="targets" type="button" style="font-size:12px;">Targets &amp; TDEE</button>' +
          '<button class="btn nf-mode" data-m="meals" type="button" style="font-size:12px;">Meal plan</button>' +
          '<button class="btn nf-mode" data-m="pdf" type="button" style="font-size:12px;">PDF upload</button></div>' +
        '<div id="nf-sec-targets">' +
        '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">TDEE calculator</div>' +
          '<div class="field-row"><div class="field"><label>Weight (kg)</label><input id="td-w" type="number" min="30" step="0.1"/></div>' +
          '<div class="field"><label>Height (cm)</label><input id="td-h" type="number" min="120"/></div>' +
          '<div class="field"><label>Age</label><input id="td-a" type="number" min="16" max="90"/></div></div>' +
          '<div class="field-row"><div class="field"><label>Sex</label><select id="td-s"><option value="m">Male</option><option value="f">Female</option></select></div>' +
          '<div class="field"><label>Activity</label><select id="td-act"><option value="1.2">Sedentary</option><option value="1.375">Lightly active</option><option value="1.55" selected>Moderately active</option><option value="1.725">Very active</option><option value="1.9">Extremely active</option></select></div>' +
          '<div class="field"><label>Goal</label><select id="td-g"><option value="-15">Fat loss (\u221215%)</option><option value="-10">Gentle cut (\u221210%)</option><option value="0" selected>Maintenance</option><option value="10">Lean gain (+10%)</option></select></div></div>' +
          '<div style="display:flex;gap:12px;align-items:center;margin-top:4px;"><button class="btn" id="td-calc" type="button" style="font-size:12px;">Calculate &amp; fill targets</button>' +
          '<span id="td-out" style="font-size:12.5px;color:var(--text-muted);"></span></div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Mifflin-St Jeor \u00b7 protein defaults to 2g/kg, fat to 25% of calories, carbs take the rest \u2014 amend anything below before saving.</div></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Daily calories (kcal)</label><input id="nf-cal" type="number" min="0" value="' + (p.calories||'') + '"/></div>' +
        '<div class="field"><label>Protein (g)</label><input id="nf-pro" type="number" min="0" value="' + (p.protein_g||'') + '"/></div></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Fat (g)</label><input id="nf-fat" type="number" min="0" value="' + (p.fat_g||'') + '"/></div>' +
        '<div class="field"><label>Carbs (g)</label><input id="nf-carb" type="number" min="0" value="' + (p.carbs_g||'') + '"/></div></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Water (litres/day)</label><input id="nf-water" type="number" min="0" step="0.1" value="' + (p.hydration_l||'') + '"/></div>' +
        '<div class="field"></div></div>' +
        '<div class="field"><label>Guidance notes for the client</label><textarea id="nf-notes" rows="4" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;">' + esc(p.notes||'') + '</textarea></div>' +
        '</div>' +
        '<div id="nf-sec-meals" style="display:none;">' +
          '<div id="nm-meals"></div><button class="btn" id="nm-add" type="button" style="font-size:12px;">+ Add meal</button>' +
          '<span id="nm-totals" style="font-size:12px;color:var(--text-muted);margin-left:12px;"></span></div>' +
        '<div id="nf-sec-pdf" style="display:none;">' +
          '<div style="border:1.5px dashed var(--border);border-radius:12px;padding:22px;text-align:center;">' +
          '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Upload your plan as a PDF</div>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Up to 10MB \u2014 your client sees it in their app exactly as you made it.</div>' +
          '<input id="nf-pdf" type="file" accept="application/pdf" style="font-size:12px;"/></div>' +
          '<div id="nf-pdf-status" style="font-size:12px;color:var(--text-muted);margin-top:8px;">' + (plPdf ? esc(plPdf.name) + ' \u00b7 attached' : 'No PDF attached.') + '</div></div>';
      b.querySelectorAll('.nf-mode').forEach(function(btn){
        btn.addEventListener('click', function(){
          b.querySelectorAll('.nf-mode').forEach(function(x){ x.classList.toggle('btn-primary', x === btn); });
          ['targets','meals','pdf'].forEach(function(m){ $c('nf-sec-' + m).style.display = (m === btn.dataset.m) ? '' : 'none'; });
        });
      });
      $c('td-calc').addEventListener('click', function(){
        var w = parseFloat($c('td-w').value), ht = parseFloat($c('td-h').value), age = parseFloat($c('td-a').value);
        if (!w || !ht || !age){ $c('td-out').textContent = 'Fill weight, height and age first.'; return; }
        var bmr = 10 * w + 6.25 * ht - 5 * age + ($c('td-s').value === 'm' ? 5 : -161);
        var tdee = Math.round(bmr * parseFloat($c('td-act').value));
        var adj = parseFloat($c('td-g').value) / 100;
        var kcal = Math.round(tdee * (1 + adj));
        var pro = Math.round(w * 2);
        var fat = Math.round(kcal * 0.25 / 9);
        var carb = Math.max(0, Math.round((kcal - pro * 4 - fat * 9) / 4));
        $c('nf-cal').value = kcal; $c('nf-pro').value = pro; $c('nf-fat').value = fat; $c('nf-carb').value = carb;
        $c('td-out').textContent = 'TDEE ' + tdee.toLocaleString() + ' kcal \u2192 target ' + kcal.toLocaleString() + ' kcal filled below.';
      });
      var meals = (p.meals && p.meals.length) ? p.meals : [];
      meals.forEach(addNMeal);
      $c('nm-add').addEventListener('click', function(){ addNMeal({ name: '', items: [{}] }); });
      $c('nm-meals').addEventListener('input', nmTotals);
      nmTotals();
      $c('nf-pdf').addEventListener('change', async function(){
        var f = this.files && this.files[0];
        if (!f) return;
        var st = $c('nf-pdf-status');
        if (f.type !== 'application/pdf'){ st.textContent = 'PDF files only.'; return; }
        if (f.size > 10 * 1024 * 1024){ st.textContent = 'Too big \u2014 10MB max.'; return; }
        st.textContent = 'Uploading\u2026';
        try {
          var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
          var path = pprefix() + '/' + Date.now() + '-' + safe;
          var up = await sb().storage.from('coach-content').upload(path, f, { contentType: 'application/pdf', upsert: true });
          if (up.error) throw up.error;
          plPdf = { path: path, name: f.name };
          st.textContent = f.name + ' \u00b7 uploaded \u2014 save the plan to attach it.';
        } catch(e){ st.textContent = 'Upload failed: ' + (e.message || e); }
      });
    } else if (plKind === 'supplements'){
      b.innerHTML = '<div id="sp-rows"></div><button class="btn" id="sp-add" type="button" style="font-size:12px;margin-top:6px;">+ Add supplement</button>';
      var sps = (item && item.payload && item.payload.items && item.payload.items.length) ? item.payload.items : [{}];
      sps.forEach(addSPRow);
      $c('sp-add').addEventListener('click', function(){ addSPRow({}); });
    }
  }
  function addQRow(q){
    var d = document.createElement('div');
    d.style.cssText = 'border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;';
    d.innerHTML = '<div class="field-row"><div class="field"><label>Question</label><input class="q-label" type="text" maxlength="200" value="' + esc(q.label||'') + '" placeholder="e.g. What are your top 3 goals?"/></div>' +
      '<div class="field"><label>Answer type</label><select class="q-type">' + QTYPES.map(function(t){ return '<option value="' + t[0] + '"' + (W9_QTYPE(q.type)===t[0]?' selected':'') + '>' + t[1] + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field q-opts" style="display:' + (W9_CHOICE(q.type)?'':'none') + ';"><label>Choices (comma separated)</label><input class="q-options" type="text" value="' + esc((q.options||[]).join(', ')) + '"/>' +
        '<label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:7px;"><input class="q-other" type="checkbox"' + (q.allow_other?' checked':'') + ' style="accent-color:var(--vyve-teal);"/> Allow \u201cOther\u201d, with a box to type in</label></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;"><label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer;"><input class="q-req" type="checkbox"' + (q.required?' checked':'') + ' style="accent-color:var(--vyve-teal);"/> Required</label>' + rowBtn('Remove','q-del') + '</div>';
    d.querySelector('.q-type').addEventListener('change', function(){ d.querySelector('.q-opts').style.display = W9_CHOICE(this.value) ? '' : 'none'; });
    d.querySelector('.q-del').addEventListener('click', function(){ d.remove(); });
    $c('q-rows').appendChild(d);
  }
  var stockHabits = null;
  var plPdf = null; // PM-962: uploaded nutrition PDF {path, name} for the open template
  function addHRow(h){
    var d = document.createElement('div');
    d.style.cssText = 'border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;';
    if (h.lib_id){
      d.dataset.libId = h.lib_id;
      d.dataset.libTitle = h.title || '';
      d.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="flex:1;min-width:0;"><span style="font-size:13.5px;font-weight:600;">' + esc(h.title||'') + '</span>' +
        (h.description ? '<span style="display:block;font-size:11.5px;color:var(--text-muted);">' + esc(h.description) + '</span>' : '') + '</span>' +
        (h.auto ? '<span style="font-size:10.5px;font-weight:800;color:var(--vyve-gold,#C9A84C);flex:none;">\u26a1 AUTO</span>' : '') +
        '<span style="font-size:10.5px;color:var(--text-muted);flex:none;">VYVE library</span>' + rowBtn('Remove','h-del') + '</div>';
    } else {
      var inp = (h.input && typeof h.input === 'object') ? h.input : {};
      var htype = h.steps_target ? 'tick' : (inp.type || 'tick');
      d.innerHTML = '<div class="field-row"><div class="field"><label>Habit</label><input class="h-title" type="text" maxlength="120" value="' + esc(h.title||'') + '" placeholder="e.g. Read 10 pages"/></div>' +
        '<div class="field"><label>Why / how (shown to client)</label><input class="h-desc" type="text" maxlength="240" value="' + esc(h.description||'') + '"/></div></div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:2px;flex-wrap:wrap;">' +
        '<div class="field" style="margin:0;"><label>Client logs it as</label><select class="h-type" style="min-width:130px;">' +
          '<option value="tick"' + (htype==='tick'?' selected':'') + '>Tick (done / not)</option>' +
          '<option value="number"' + (htype==='number'?' selected':'') + '>A number</option>' +
          '<option value="scale"' + (htype==='scale'?' selected':'') + '>Scale 1\u201310</option>' +
          '<option value="text"' + (htype==='text'?' selected':'') + '>Short text</option></select></div>' +
        '<div class="field h-num-cfg" style="margin:0;' + (htype==='number'?'':'display:none;') + '"><label>Unit</label><input class="h-unit" type="text" maxlength="16" value="' + esc(inp.unit||'') + '" placeholder="kg, litres, mins" style="width:110px;"/></div>' +
        '<div class="field h-num-cfg" style="margin:0;' + (htype==='number'?'':'display:none;') + '"><label>Daily target (optional)</label><input class="h-target" type="number" step="any" value="' + (inp.target != null ? inp.target : '') + '" placeholder="\u2014" style="width:110px;"/></div>' +
        '<label class="h-steps-wrap" style="display:' + (htype==='tick'?'flex':'none') + ';align-items:center;gap:7px;font-size:12px;color:var(--text-muted);cursor:pointer;margin:0;"><input type="checkbox" class="h-steps-on"' + (h.steps_target ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);width:15px;height:15px;"/> Auto-track a daily step target</label>' +
        '<input class="h-steps" type="number" min="500" step="500" value="' + (h.steps_target || '') + '" placeholder="10000" style="width:110px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;' + (h.steps_target ? '' : 'display:none;') + '"/>' +
        '<span style="flex:1;"></span>' + rowBtn('Remove','h-del') + '</div>' +
        '<div class="h-hint" style="font-size:11px;color:var(--text-muted);margin-top:5px;' + (htype==='number'?'':'display:none;') + '">With a target, the habit completes itself when the number hits it. Unit \u201ckg\u201d also writes to the client\u2019s weight log.</div>';
      var so = d.querySelector('.h-steps-on'), si = d.querySelector('.h-steps'), ht = d.querySelector('.h-type');
      so.addEventListener('change', function(){ si.style.display = so.checked ? '' : 'none'; if (so.checked && !si.value) si.value = 10000; });
      ht.addEventListener('change', function(){
        var isNum = ht.value === 'number', isTick = ht.value === 'tick';
        d.querySelectorAll('.h-num-cfg').forEach(function(x){ x.style.display = isNum ? '' : 'none'; });
        d.querySelector('.h-hint').style.display = isNum ? '' : 'none';
        d.querySelector('.h-steps-wrap').style.display = isTick ? 'flex' : 'none';
        if (!isTick){ so.checked = false; si.style.display = 'none'; }
      });
    }
    d.querySelector('.h-del').addEventListener('click', function(){ d.remove(); });
    $c('h-rows').appendChild(d);
  }
  function addWSession(sess){
    var d = document.createElement('div');
    d.className = 'w-session';
    d.style.cssText = 'border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;';
    d.innerHTML = '<div class="field" style="margin-bottom:8px;"><label>Session name</label><input class="w-name" type="text" maxlength="80" value="' + esc(sess.name||'') + '" placeholder="e.g. Push A"/></div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Warm up (optional)</div><div class="w-warm-rows"></div><div style="margin-bottom:8px;">' + rowBtn('+ Warm up exercise','w-add-warm') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Workout</div><div class="w-ex-rows"></div><div style="margin-bottom:8px;">' + rowBtn('+ Exercise','w-add-ex') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Cool down (optional)</div><div class="w-cool-rows"></div><div style="display:flex;gap:8px;margin-top:6px;">' + rowBtn('+ Cool down exercise','w-add-cool') + rowBtn('Remove session','w-del') + '</div>';
    var exWrap = d.querySelector('.w-ex-rows'), warmWrap = d.querySelector('.w-warm-rows'), coolWrap = d.querySelector('.w-cool-rows');
    function addEx(ex, wrap){
      wrap = wrap || exWrap;
      var e = document.createElement('div');
      e.style.cssText = 'display:grid;grid-template-columns:2fr 60px 70px 70px 2fr 28px;gap:6px;margin-bottom:6px;align-items:end;';
      e.innerHTML = '<div class="field"><label>Exercise</label><input class="we-name" list="ex-names" type="text" value="' + esc(ex.name||'') + '"/></div>' +
        '<div class="field"><label>Sets</label><input class="we-sets" type="text" value="' + esc(ex.sets||'3') + '"/></div>' +
        '<div class="field"><label>Reps</label><input class="we-reps" type="text" value="' + esc(ex.reps||'8-12') + '"/></div>' +
        '<div class="field"><label>Rest s</label><input class="we-rest" type="number" min="0" value="' + (ex.rest_seconds!=null?ex.rest_seconds:90) + '"/></div>' +
        '<div class="field"><label>Notes</label><input class="we-notes" type="text" value="' + esc(ex.notes||'') + '"/></div>' +
        '<button class="btn we-del" type="button" style="font-size:11px;padding:6px 8px;">&times;</button>';
      e.querySelector('.we-del').addEventListener('click', function(){ e.remove(); });
      wrap.appendChild(e);
    }
    (sess.exercises && sess.exercises.length ? sess.exercises : [{}]).forEach(function(x){ addEx(x, exWrap); });
    (sess.warmup || []).forEach(function(x){ addEx(x, warmWrap); });
    (sess.cooldown || []).forEach(function(x){ addEx(x, coolWrap); });
    d.querySelector('.w-add-ex').addEventListener('click', function(){ addEx({}, exWrap); });
    d.querySelector('.w-add-warm').addEventListener('click', function(){ addEx({ sets:'1', reps:'', rest_seconds:0 }, warmWrap); });
    d.querySelector('.w-add-cool').addEventListener('click', function(){ addEx({ sets:'1', reps:'', rest_seconds:0 }, coolWrap); });
    d.querySelector('.w-del').addEventListener('click', function(){ d.remove(); });
    $c('w-sessions').appendChild(d);
  }
  function addNMeal(meal){
    var d = document.createElement('div');
    d.className = 'nm-meal';
    d.style.cssText = 'border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;';
    d.innerHTML = '<div style="display:flex;gap:8px;align-items:end;margin-bottom:6px;">' +
      '<div class="field" style="flex:1;margin:0;"><label>Meal</label><input class="nm-name" type="text" maxlength="60" value="' + esc(meal.name||'') + '" placeholder="e.g. Breakfast"/></div>' +
      rowBtn('+ Food','nm-addfood') + rowBtn('Remove meal','nm-del') + '</div><div class="nm-foods"></div>';
    var wrap = d.querySelector('.nm-foods');
    function addFood(it){
      var e = document.createElement('div');
      e.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 80px 80px 28px;gap:6px;margin-bottom:6px;align-items:end;';
      e.innerHTML = '<div class="field"><label>Food</label><input class="nm-food" type="text" maxlength="120" value="' + esc(it.food||'') + '"/></div>' +
        '<div class="field"><label>Amount</label><input class="nm-amt" type="text" maxlength="40" value="' + esc(it.amount||'') + '" placeholder="200g"/></div>' +
        '<div class="field"><label>kcal</label><input class="nm-kcal" type="number" min="0" value="' + (it.kcal!=null?it.kcal:'') + '"/></div>' +
        '<div class="field"><label>Protein g</label><input class="nm-prot" type="number" min="0" value="' + (it.protein_g!=null?it.protein_g:'') + '"/></div>' +
        '<button class="btn nm-delfood" type="button" style="font-size:11px;padding:6px 8px;">&times;</button>';
      e.querySelector('.nm-delfood').addEventListener('click', function(){ e.remove(); nmTotals(); });
      wrap.appendChild(e);
    }
    ((meal.items && meal.items.length) ? meal.items : [{}]).forEach(addFood);
    d.querySelector('.nm-addfood').addEventListener('click', function(){ addFood({}); });
    d.querySelector('.nm-del').addEventListener('click', function(){ d.remove(); nmTotals(); });
    $c('nm-meals').appendChild(d);
  }
  function nmTotals(){
    var el = $c('nm-totals');
    if (!el) return;
    var k = 0, pr = 0;
    document.querySelectorAll('#nm-meals .nm-foods > div').forEach(function(e){
      k += parseFloat(e.querySelector('.nm-kcal').value) || 0;
      pr += parseFloat(e.querySelector('.nm-prot').value) || 0;
    });
    el.textContent = k || pr ? ('Day total: ' + Math.round(k).toLocaleString() + ' kcal \u00b7 ' + Math.round(pr) + 'g protein') : '';
  }
  function addSPRow(sp){
    var d = document.createElement('div');
    d.style.cssText = 'border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;';
    d.innerHTML = '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;" class="sp-grid">' +
      '<div class="field"><label>Supplement</label><input class="sp-name" type="text" value="' + esc(sp.name||'') + '" placeholder="e.g. Creatine"/></div>' +
      '<div class="field"><label>Dosage</label><input class="sp-dose" type="text" value="' + esc(sp.dosage||'') + '" placeholder="5g"/></div>' +
      '<div class="field"><label>Timing</label><input class="sp-time" type="text" value="' + esc(sp.timing||'') + '" placeholder="Morning"/></div>' +
      '<div class="field"><label>Duration</label><input class="sp-dur" type="text" value="' + esc(sp.duration||'') + '" placeholder="8 weeks"/></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
      '<div class="field"><label>Product link (your code/affiliate link, optional)</label><input class="sp-link" type="text" value="' + esc(sp.link||'') + '" placeholder="https://&hellip;"/></div>' +
      '<div class="field"><label>Notes</label><input class="sp-notes" type="text" value="' + esc(sp.notes||'') + '"/></div></div>' +
      '<div style="text-align:right;margin-top:6px;">' + rowBtn('Remove','sp-del') + '</div>';
    d.querySelector('.sp-del').addEventListener('click', function(){ d.remove(); });
    $c('sp-rows').appendChild(d);
  }
  function plCollect(){
    if (IS_FORM(plKind)){
      var qs = [];
      $c('q-rows').querySelectorAll(':scope > div').forEach(function(d, i){
        var label = d.querySelector('.q-label').value.trim();
        if (!label) return;
        var type = d.querySelector('.q-type').value;
        var q = { id: 'q' + (i+1), label: label, type: type };
        if (W9_CHOICE(type)){
          q.options = d.querySelector('.q-options').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean);
          if (d.querySelector('.q-other').checked) q.allow_other = true;
        }
        if (d.querySelector('.q-req').checked) q.required = true;
        qs.push(q);
      });
      return { questions: qs, valid: qs.length > 0, err: 'Add at least one question.' };
    }
    if (plKind === 'habits'){
      var hs = [];
      $c('h-rows').querySelectorAll(':scope > div').forEach(function(d){
        if (d.dataset.libId){ hs.push({ lib_id: d.dataset.libId, title: d.dataset.libTitle }); return; }
        var t = d.querySelector('.h-title').value.trim();
        if (!t) return;
        var row = { title: t, description: d.querySelector('.h-desc').value.trim() };
        var so = d.querySelector('.h-steps-on'), si = d.querySelector('.h-steps');
        if (so && so.checked && parseInt(si.value) > 0) row.steps_target = parseInt(si.value);
        var ht = d.querySelector('.h-type');
        if (ht && ht.value !== 'tick' && !row.steps_target){
          if (ht.value === 'number'){
            var un = (d.querySelector('.h-unit').value || '').trim().toLowerCase();
            var tg = parseFloat(d.querySelector('.h-target').value);
            row.input = { type: 'number', unit: un || null, target: isNaN(tg) ? null : tg, writes: un === 'kg' ? 'weight' : null };
          } else if (ht.value === 'scale') row.input = { type: 'scale', max: 10 };
          else row.input = { type: 'text' };
        }
        hs.push(row);
      });
      return { payload: { habits: hs }, valid: hs.length > 0, err: 'Add at least one habit.' };
    }
    if (plKind === 'workout'){
      var ss = [];
      function grab(d, cls){
        var out = [];
        d.querySelectorAll(cls + ' > div').forEach(function(e){
          var en = e.querySelector('.we-name').value.trim();
          if (en) out.push({ name: en, sets: e.querySelector('.we-sets').value.trim() || '3', reps: e.querySelector('.we-reps').value.trim() || '8-12', rest_seconds: parseInt(e.querySelector('.we-rest').value) || 60, notes: e.querySelector('.we-notes').value.trim() });
        });
        return out;
      }
      document.querySelectorAll('#w-sessions .w-session').forEach(function(d){
        var nm = d.querySelector('.w-name').value.trim() || 'Session';
        var exs = grab(d, '.w-ex-rows'), wu = grab(d, '.w-warm-rows'), cd = grab(d, '.w-cool-rows');
        if (exs.length) ss.push({ name: nm, exercises: exs, warmup: wu, cooldown: cd });
      });
      var instr = ($c('w-instructions') && $c('w-instructions').value.trim()) || '';
      return { payload: { sessions: ss, instructions: instr }, valid: ss.length > 0, err: 'Add at least one session with an exercise.' };
    }
    if (plKind === 'workout_day'){
      var day = collectDay($c('dt-editor'));
      return { payload: day, valid: day.exercises.length > 0, err: 'Add at least one exercise.' };
    }
    if (plKind === 'program'){
      if (progEditingDay) progDayDone();
      progState.instructions = ($c('pg-instructions') && $c('pg-instructions').value.trim()) || '';
      var hasWork = (progState.weeks || []).some(function(w){ return (w.days || []).some(function(d){ return d && (d.exercises || []).length; }); });
      return { payload: progState, valid: hasWork, err: 'Add at least one training day to a week.' };
    }
    if (plKind === 'nutrition'){
      var p = { calories: parseInt($c('nf-cal').value) || null, protein_g: parseInt($c('nf-pro').value) || null, fat_g: parseInt($c('nf-fat').value) || null, carbs_g: parseInt($c('nf-carb').value) || null, hydration_l: parseFloat($c('nf-water').value) || null, notes: $c('nf-notes').value.trim() };
      var mls = [];
      document.querySelectorAll('#nm-meals .nm-meal').forEach(function(d){
        var items = [];
        d.querySelectorAll('.nm-foods > div').forEach(function(e){
          var fd = e.querySelector('.nm-food').value.trim();
          if (!fd) return;
          items.push({ food: fd, amount: e.querySelector('.nm-amt').value.trim(), kcal: parseFloat(e.querySelector('.nm-kcal').value) || null, protein_g: parseFloat(e.querySelector('.nm-prot').value) || null });
        });
        var mn = d.querySelector('.nm-name').value.trim();
        if (items.length) mls.push({ name: mn || 'Meal', items: items });
      });
      if (mls.length) p.meals = mls;
      if (plPdf){ p.pdf_path = plPdf.path; p.pdf_name = plPdf.name; }
      return { payload: p, valid: !!(p.calories || p.protein_g || p.notes || p.meals || p.pdf_path), err: 'Set targets, add a meal, or attach a PDF.' };
    }
    var items = [];
    $c('sp-rows').querySelectorAll(':scope > div').forEach(function(d){
      var n = d.querySelector('.sp-name').value.trim();
      if (n) items.push({ name: n, dosage: d.querySelector('.sp-dose').value.trim(), timing: d.querySelector('.sp-time').value.trim(), duration: d.querySelector('.sp-dur').value.trim(), link: d.querySelector('.sp-link').value.trim(), notes: d.querySelector('.sp-notes').value.trim() });
    });
    return { payload: { items: items }, valid: items.length > 0, err: 'Add at least one supplement.' };
  }
  async function plSave(){
    var name = $c('plf-name').value.trim(), msg = $c('pl-msg');
    if (!name){ msg.textContent = 'Give it a name.'; return; }
    var col = plCollect();
    if (!col.valid){ msg.textContent = col.err; return; }
    var btn = $c('pl-save'); btn.disabled = true; msg.textContent = 'Saving\u2026';
    try {
      if (IS_FORM(plKind)){
        if (plEditing) await rest('/coach_forms?id=eq.' + plEditing.id, { method: 'PATCH', body: { title: name, questions: col.questions, updated_at: new Date().toISOString() } });
        else await rest('/coach_forms', { method: 'POST', body: { partner_id: partnerId, kind: plKind, title: name, questions: col.questions } });
      } else {
        if (plEditing) await rest('/coach_templates?id=eq.' + plEditing.id, { method: 'PATCH', body: { name: name, payload: col.payload, updated_at: new Date().toISOString() } });
        else await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: plKind, name: name, payload: col.payload } });
      }
      msg.textContent = 'Saved.';
      $c('pl-editor').style.display = 'none';
      await plLoad(); loadLibraries();
    } catch(e){ msg.textContent = 'Save failed: ' + (e.message.indexOf('409') >= 0 ? 'you already have a ' + KIND_LABEL[plKind] + ' with that name.' : e.message); }
    btn.disabled = false;
  }
