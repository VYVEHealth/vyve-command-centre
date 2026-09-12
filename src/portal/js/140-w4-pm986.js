  /* =========================================================================
     PM-986 WAVE 4 — nutrition (gap-map #13-18).
     Ingredient-level meal builder on off-proxy v10 (#14), day tabs folded into
     the plan editor (#16 ruling — meals-vs-days doors both stay open: plans
     carry a canonical days[] with a legacy meals[] mirror of day 1), meals
     library as coach_templates kind='meal' (#16), coach foods page over
     coach_foods (#17, a kindsel lens — zero router changes), shopping list
     (#15), supplements list/document modes (#18), plans-list upgrade (#13).
     Shadowing per the wave pattern: plLoad/plSave/plDelete redeclared below
     (last-wins hoisting); plOpen gains one hook line (w4Open) like PM-984's
     w2WizOpen. Edit THESE versions in future waves, not the ones above.
     ========================================================================= */
  KIND_LABEL.meal = 'meal'; KIND_LABEL.food = 'food';
  SECTION_KINDS.nutrition = ['nutrition','meal','food','supplements'];
  HASH_OK = /^(dashboard|clients|clients_checkins|clients_daily|profile|settings|terms|exercises|notifications|automations|leads|messages|calendar|content|kindsel:(onboarding|checkin|lead|habits|program|workout|workout_day|nutrition|meal|food|supplements))$/;

  var W4_KINDS = { nutrition: 1, meal: 1, food: 1, supplements: 1 };
  var OFFP = SUPA_URL + '/functions/v1/off-proxy';
  var SP_TIMINGS = ['Morning','Day','Evening','Night','Pre-workout','Post-workout','With meals'];

  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.w4-ig{display:grid;grid-template-columns:minmax(120px,2fr) 76px 92px 62px 54px 54px 54px 26px;gap:6px;align-items:center;margin-bottom:6px;}' +
      '@media(max-width:760px){.w4-ig{grid-template-columns:minmax(100px,2fr) 64px 84px 54px 46px 46px 46px 24px;font-size:12px;}}' +
      '.w4-ig input,.w4-ig select{width:100%;padding:7px 8px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;}' +
      '.w4-ig .ro{background:none;border-color:transparent;color:var(--text-muted);text-align:right;padding-right:2px;}' +
      '.w4-ighead{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px;}' +
      '.w4-dd{position:relative;}' +
      '.w4-dd .res{position:absolute;left:0;right:0;top:100%;z-index:60;background:var(--surface);border:1px solid var(--border);border-radius:10px;max-height:280px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.25);}' +
      '.w4-dd .res button{display:flex;width:100%;gap:8px;align-items:center;text-align:left;background:none;border:none;border-bottom:1px solid var(--border);padding:9px 10px;cursor:pointer;color:var(--text);font-family:inherit;font-size:12.5px;}' +
      '.w4-dd .res button:hover{background:var(--surface-2);}' +
      '.w4-daypill{border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.w4-daypill.on{border-color:var(--vyve-teal);color:var(--teal-lt);}' +
      '.w4-mealcard{border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px;}';
    document.head.appendChild(st);
  })();

  function w4n(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function w4r1(v){ return Math.round(v * 10) / 10; }

  /* Normalised food -> new plan item. norm = {k,p,c,f,sg} per-100g truth. */
  function w4NewItem(name, brand, norm){
    var it = { food: name, brand: brand || '', src: 'search', per100: norm,
               qty: norm.sg ? 1 : 100, unit: norm.sg ? 'serving' : 'g',
               grams: 0, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, amount: '' };
    w4Recalc(it);
    return it;
  }
  function w4Recalc(it){
    if (!it.per100) return;
    var g = it.unit === 'serving' ? w4n(it.qty) * (it.per100.sg || 100) : w4n(it.qty);
    it.grams = Math.round(g);
    it.kcal = Math.round(it.per100.k * g / 100);
    it.protein_g = w4r1(it.per100.p * g / 100);
    it.carbs_g = w4r1(it.per100.c * g / 100);
    it.fat_g = w4r1(it.per100.f * g / 100);
    it.amount = it.unit === 'serving'
      ? (w4n(it.qty) + ' serving' + (w4n(it.qty) === 1 ? '' : 's') + (it.grams ? ' (' + it.grams + 'g)' : ''))
      : (it.grams + 'g');
  }
  function w4Tot(items){
    var t = { k: 0, p: 0, c: 0, f: 0 };
    (items || []).forEach(function(i){ t.k += w4n(i.kcal); t.p += w4n(i.protein_g); t.c += w4n(i.carbs_g); t.f += w4n(i.fat_g); });
    return t;
  }
  function w4TotLine(t, pre){
    if (!t.k && !t.p && !t.c && !t.f) return '';
    return (pre || '') + Math.round(t.k).toLocaleString() + ' kcal \u00b7 ' + Math.round(t.p) + 'g P \u00b7 ' + Math.round(t.c) + 'g C \u00b7 ' + Math.round(t.f) + 'g F';
  }
  function w4DayTot(day){
    var t = { k: 0, p: 0, c: 0, f: 0 };
    (day.meals || []).forEach(function(m){ var mt = w4Tot(m.items); t.k += mt.k; t.p += mt.p; t.c += mt.c; t.f += mt.f; });
    return t;
  }

  /* ── food search: coach's own foods + off-proxy v10 (common foods lead) ── */
  var w4MyFoodsCache = null;
  async function w4MyFoods(force){
    if (w4MyFoodsCache && !force) return w4MyFoodsCache;
    try { w4MyFoodsCache = await rest('/coach_foods?' + pscope() + '&active=eq.true&order=food_name.asc&limit=500&select=*') || []; }
    catch(e){ w4MyFoodsCache = []; }
    return w4MyFoodsCache;
  }
  function w4RowNorm(r){ /* per-serving coach/common row -> per-100g norm */
    var g = w4n(r.serving_size_g) || 100, f = 100 / g;
    return { k: w4r1((w4n(r.calories_kcal)) * f), p: w4r1(w4n(r.protein_g) * f), c: w4r1(w4n(r.carbs_g) * f), f: w4r1(w4n(r.fat_g) * f), sg: g };
  }
  async function w4Search(q){
    var out = [];
    var mine = (await w4MyFoods()).filter(function(r){ return r.food_name.toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 6);
    mine.forEach(function(r){ out.push({ name: r.food_name, brand: r.brand || '', tag: 'My foods', norm: w4RowNorm(r) }); });
    try {
      var res = await fetch(OFFP + '?type=search&q=' + encodeURIComponent(q));
      var d = await res.json();
      (d.products || []).forEach(function(p){
        if (!p._norm) return;
        out.push({ name: p.product_name, brand: p.brands || '', tag: p._common ? 'VYVE' : 'Open Food Facts',
                   norm: { k: w4n(p._norm.kcal_100g), p: w4n(p._norm.protein_100g), c: w4n(p._norm.carbs_100g), f: w4n(p._norm.fat_100g), sg: p._norm.serving_g || null } });
      });
    } catch(e){}
    return out.slice(0, 18);
  }
  /* search input + dropdown; onPick(result). */
  function w4SearchBox(ph, onPick){
    var wrap = document.createElement('div');
    wrap.className = 'w4-dd';
    wrap.style.cssText = 'flex:1;min-width:180px;';
    wrap.innerHTML = '<input type="text" maxlength="80" placeholder="' + esc(ph) + '" style="width:100%;padding:8px 11px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;"/><div class="res" style="display:none;"></div>';
    var inp = wrap.querySelector('input'), res = wrap.querySelector('.res'), tId = null, seq = 0;
    inp.addEventListener('input', function(){
      clearTimeout(tId);
      var q = inp.value.trim();
      if (q.length < 2){ res.style.display = 'none'; return; }
      tId = setTimeout(async function(){
        var mySeq = ++seq;
        res.style.display = ''; res.innerHTML = '<div style="padding:9px 10px;font-size:12px;color:var(--text-muted);">Searching\u2026</div>';
        var hits = await w4Search(q);
        if (mySeq !== seq) return;
        if (!hits.length){ res.innerHTML = '<div style="padding:9px 10px;font-size:12px;color:var(--text-muted);">Nothing found \u2014 add it manually.</div>'; return; }
        res.innerHTML = hits.map(function(h, i){
          var per = h.norm.sg ? ('per serving: ' + Math.round(h.norm.k * h.norm.sg / 100) + ' kcal') : ('per 100g: ' + Math.round(h.norm.k) + ' kcal');
          return '<button type="button" data-i="' + i + '"><span style="flex:1;min-width:0;"><span style="font-weight:600;">' + esc(h.name) + '</span>' +
            (h.brand ? '<span style="display:block;font-size:11px;color:var(--text-muted);">' + esc(h.brand) + '</span>' : '') + '</span>' +
            '<span style="font-size:10.5px;color:var(--text-muted);flex:none;text-align:right;">' + esc(h.tag) + '<span style="display:block;">' + per + '</span></span></button>';
        }).join('');
        res.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){ res.style.display = 'none'; inp.value = ''; onPick(hits[parseInt(b.dataset.i)]); });
        });
      }, 350);
    });
    document.addEventListener('click', function(ev){ if (!wrap.contains(ev.target)) res.style.display = 'none'; });
    return wrap;
  }

  /* ── Wave 4 editors: state ── */
  var w4Plan = null, w4DayIdx = 0, w4Pdf = null, w4MealState = null, w4SuppState = null, w4SuppMode = null;

  function w4Open(item){
    if (!W4_KINDS[plKind]) return false;
    plEditing = item || null;
    $c('pl-editor').style.display = '';
    $c('pl-editor-title').textContent = (item ? 'Edit ' : 'New ') + KIND_LABEL[plKind];
    $c('plf-name').value = item ? (item.name || item.food_name || '') : '';
    $c('pl-msg').textContent = '';
    var b = $c('pl-body');
    b.innerHTML = ''; /* duplicate-id rule (PM-984) — legacy remnants would win the $c race */
    if (plKind === 'nutrition') w4NutOpen(b, item);
    else if (plKind === 'meal') w4MealOpen(b, item);
    else if (plKind === 'food') w4FoodOpen(b, item);
    else w4SuppOpen(b, item);
    return true;
  }

  /* ── #14 nutrition plan builder: targets + day-tabbed ingredient meals + pdf ── */
  function w4NutOpen(b, item){
    var p = (item && item.payload) || {};
    w4Pdf = p.pdf_path ? { path: p.pdf_path, name: p.pdf_name || 'plan.pdf' } : null;
    w4DayIdx = 0;
    w4Plan = { days: [] };
    if (p.days && p.days.length) w4Plan.days = deepCopy(p.days);
    else if (p.meals && p.meals.length) w4Plan.days = [{ name: 'Day 1', meals: deepCopy(p.meals) }];
    else w4Plan.days = [{ name: 'Day 1', meals: [] }];
    w4Plan.days.forEach(function(d){ if (!d.meals) d.meals = []; d.meals.forEach(function(m){ if (!m.items) m.items = []; }); });

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
      '<div class="field"><label>Daily calories (kcal)</label><input id="nf-cal" type="number" min="0" value="' + (p.calories || '') + '"/></div>' +
      '<div class="field"><label>Protein (g)</label><input id="nf-pro" type="number" min="0" value="' + (p.protein_g || '') + '"/></div></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Fat (g)</label><input id="nf-fat" type="number" min="0" value="' + (p.fat_g || '') + '"/></div>' +
      '<div class="field"><label>Carbs (g)</label><input id="nf-carb" type="number" min="0" value="' + (p.carbs_g || '') + '"/></div></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Water (litres/day)</label><input id="nf-water" type="number" min="0" step="0.1" value="' + (p.hydration_l || '') + '"/></div>' +
      '<div class="field"></div></div>' +
      '<div class="field"><label>Guidance notes for the client</label><textarea id="nf-notes" rows="4" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;">' + esc(p.notes || '') + '</textarea></div>' +
      '</div>' +
      '<div id="nf-sec-meals" style="display:none;">' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Build meals from real foods \u2014 search the UK food database, your own foods and your saved meals. Calories and macros are worked out per ingredient. Add days for a rotating plan; one day is fine too.</p>' +
        '<div id="w4-days" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;"></div>' +
        '<div id="w4-dayrow" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;"></div>' +
        '<div id="w4-meals"></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px;">' +
          '<button class="btn" id="w4-addmeal" type="button" style="font-size:12px;">+ Add meal</button>' +
          '<button class="btn" id="w4-frommeals" type="button" style="font-size:12px;">+ From my meals</button>' +
          '<span id="w4-daytot" style="font-size:12px;color:var(--text-muted);"></span></div>' +
        '<div id="w4-mealpick" style="display:none;max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-top:8px;padding:6px;"></div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">' +
          '<span id="w4-plansum" style="flex:1;font-size:12px;color:var(--text-muted);"></span>' +
          '<button class="btn" id="w4-shop" type="button" style="font-size:12px;">Shopping list</button></div>' +
      '</div>' +
      '<div id="nf-sec-pdf" style="display:none;">' +
        '<div style="border:1.5px dashed var(--border);border-radius:12px;padding:22px;text-align:center;">' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Upload your plan as a PDF</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Up to 10MB \u2014 your client sees it in their app exactly as you made it.</div>' +
        '<input id="nf-pdf" type="file" accept="application/pdf" style="font-size:12px;"/></div>' +
        '<div id="nf-pdf-status" style="font-size:12px;color:var(--text-muted);margin-top:8px;">' + (w4Pdf ? esc(w4Pdf.name) + ' \u00b7 attached' : 'No PDF attached.') + '</div></div>';

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
        w4Pdf = { path: path, name: f.name };
        st.textContent = f.name + ' \u00b7 uploaded \u2014 save the plan to attach it.';
      } catch(e){ st.textContent = 'Upload failed: ' + (e.message || e); }
    });
    $c('w4-addmeal').addEventListener('click', function(){
      w4Plan.days[w4DayIdx].meals.push({ name: '', note: '', items: [] });
      w4RenderDay();
    });
    $c('w4-frommeals').addEventListener('click', async function(){
      var box = $c('w4-mealpick');
      if (box.style.display !== 'none'){ box.style.display = 'none'; return; }
      box.style.display = ''; box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">Loading\u2026</p>';
      var tpls = [];
      try { tpls = await rest('/coach_templates?' + pscope() + '&kind=eq.meal&active=eq.true&order=name.asc&limit=200&select=id,name,payload') || []; } catch(e){}
      if (!tpls.length){ box.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:6px;">No saved meals yet \u2014 build them under Nutrition \u2192 Meals.</p>'; return; }
      box.innerHTML = tpls.map(function(t, i){
        var tt = w4Tot((t.payload || {}).items);
        return '<button type="button" class="w4-mpick" data-i="' + i + '" style="display:flex;width:100%;text-align:left;gap:8px;align-items:center;background:none;border:none;border-bottom:1px solid var(--border);padding:9px 8px;cursor:pointer;color:var(--text);font-family:inherit;">' +
          '<span style="flex:1;font-size:13px;font-weight:600;">' + esc(t.name) + '</span>' +
          '<span style="font-size:11px;color:var(--text-muted);">' + (((t.payload || {}).items || []).length) + ' foods' + (tt.k ? ' \u00b7 ' + Math.round(tt.k) + ' kcal' : '') + '</span></button>';
      }).join('');
      box.querySelectorAll('.w4-mpick').forEach(function(btn){
        btn.addEventListener('click', function(){
          var t = tpls[parseInt(btn.dataset.i)];
          /* PM-1100 W7: a recipe must arrive in the day WITH its presentation,
             or the member sees a bare ingredient list and the recipe is pointless. */
          w4Plan.days[w4DayIdx].meals.push(deepCopy(
            (typeof w7PlanMealFrom === 'function')
              ? w7PlanMealFrom(t)
              : { name: t.name, note: (t.payload || {}).note || '', items: (t.payload || {}).items || [] }));
          box.style.display = 'none';
          w4RenderDay();
        });
      });
    });
    $c('w4-shop').addEventListener('click', function(){ w4ShopOpen(w4Plan.days, $c('plf-name').value || 'Nutrition plan'); });
    w4RenderDays();
    w4RenderDay();
  }

  /* day pills + per-day controls */
  function w4RenderDays(){
    var el = $c('w4-days');
    if (!el) return;
    el.innerHTML = w4Plan.days.map(function(d, i){
      return '<button type="button" class="w4-daypill' + (i === w4DayIdx ? ' on' : '') + '" data-i="' + i + '">' + esc(d.name || ('Day ' + (i + 1))) + '</button>';
    }).join('') + '<button type="button" class="w4-daypill" id="w4-addday" title="Add a day">+ Day</button>';
    el.querySelectorAll('[data-i]').forEach(function(b){
      b.addEventListener('click', function(){ w4DayIdx = parseInt(b.dataset.i); w4RenderDays(); w4RenderDay(); });
    });
    $c('w4-addday').addEventListener('click', function(){
      w4Plan.days.push({ name: 'Day ' + (w4Plan.days.length + 1), meals: [] });
      w4DayIdx = w4Plan.days.length - 1;
      w4RenderDays(); w4RenderDay();
    });
    var row = $c('w4-dayrow');
    var d = w4Plan.days[w4DayIdx];
    row.innerHTML = '<div class="field" style="margin:0;flex:0 0 180px;"><label>Day name</label><input id="w4-dayname" type="text" maxlength="40" value="' + esc(d.name || '') + '"/></div>' +
      '<button class="btn" id="w4-dupday" type="button" style="font-size:11.5px;">Duplicate day</button>' +
      (w4Plan.days.length > 1 ? '<button class="btn" id="w4-delday" type="button" style="font-size:11.5px;">Remove day</button>' : '');
    $c('w4-dayname').addEventListener('input', function(){
      d.name = this.value;
      var pill = $c('w4-days').querySelector('[data-i="' + w4DayIdx + '"]');
      if (pill) pill.textContent = d.name || ('Day ' + (w4DayIdx + 1));
    });
    $c('w4-dupday').addEventListener('click', function(){
      var copy = deepCopy(d);
      copy.name = (d.name || ('Day ' + (w4DayIdx + 1))) + ' (copy)';
      w4Plan.days.splice(w4DayIdx + 1, 0, copy);
      w4DayIdx = w4DayIdx + 1;
      w4RenderDays(); w4RenderDay();
    });
    var del = $c('w4-delday');
    if (del) del.addEventListener('click', function(){
      if (!confirm('Remove ' + (d.name || 'this day') + ' and its meals?')) return;
      w4Plan.days.splice(w4DayIdx, 1);
      w4DayIdx = Math.max(0, w4DayIdx - 1);
      w4RenderDays(); w4RenderDay();
    });
  }

  /* meal card renderer — shared by the plan builder (into #w4-meals, day scope)
     and the meals-library editor (single meal). */
  function w4MealCard(meal, onChange, onRemove){
    var card = document.createElement('div');
    card.className = 'w4-mealcard';
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;gap:8px;align-items:end;margin-bottom:8px;flex-wrap:wrap;';
    if (onRemove){
      head.innerHTML = '<div class="field" style="flex:1;min-width:140px;margin:0;"><label>Meal</label><input class="w4m-name" type="text" maxlength="60" value="' + esc(meal.name || '') + '" placeholder="e.g. Breakfast"/></div>' +
        '<div class="field" style="flex:2;min-width:160px;margin:0;"><label>Meal note (optional, client sees it)</label><input class="w4m-note" type="text" maxlength="200" value="' + esc(meal.note || '') + '" placeholder="e.g. within 1h of training"/></div>' +
        '<button class="btn w4m-del" type="button" style="font-size:11.5px;">Remove meal</button>';
    } else {
      head.innerHTML = '<div class="field" style="flex:1;min-width:200px;margin:0;"><label>Meal note (optional, client sees it)</label><input class="w4m-note" type="text" maxlength="200" value="' + esc(meal.note || '') + '" placeholder="e.g. within 1h of training"/></div>';
    }
    card.appendChild(head);
    var nameInp = head.querySelector('.w4m-name');
    if (nameInp) nameInp.addEventListener('input', function(){ meal.name = this.value; });
    head.querySelector('.w4m-note').addEventListener('input', function(){ meal.note = this.value; });
    if (onRemove) head.querySelector('.w4m-del').addEventListener('click', onRemove);

    var rows = document.createElement('div');
    card.appendChild(rows);
    var totEl = document.createElement('div');
    totEl.style.cssText = 'font-size:12px;color:var(--text-muted);margin:2px 0 8px;';
    card.appendChild(totEl);

    function paintTot(){ totEl.textContent = w4TotLine(w4Tot(meal.items), 'Meal: '); onChange && onChange(); }
    function paintRows(){
      rows.innerHTML = '';
      if (meal.items.length){
        var hd = document.createElement('div');
        hd.className = 'w4-ig w4-ighead';
        hd.innerHTML = '<span>Food</span><span>Qty</span><span>Unit</span><span style="text-align:right;">kcal</span><span style="text-align:right;">P</span><span style="text-align:right;">C</span><span style="text-align:right;">F</span><span></span>';
        rows.appendChild(hd);
      }
      meal.items.forEach(function(it, idx){
        var r = document.createElement('div');
        r.className = 'w4-ig';
        var linked = !!it.per100;
        r.innerHTML = '<input class="wf" type="text" maxlength="120" value="' + esc(it.food || '') + '"/>' +
          (linked
            ? '<input class="wq" type="number" min="0" step="any" value="' + (it.qty != null ? it.qty : '') + '"/>' +
              '<select class="wu"><option value="g"' + (it.unit === 'g' ? ' selected' : '') + '>grams</option>' + (it.per100.sg ? '<option value="serving"' + (it.unit === 'serving' ? ' selected' : '') + '>serving' + (it.per100.sg ? ' (' + Math.round(it.per100.sg) + 'g)' : '') + '</option>' : '') + '</select>' +
              '<span class="ro wk">' + Math.round(w4n(it.kcal)) + '</span><span class="ro wp">' + w4r1(w4n(it.protein_g)) + '</span><span class="ro wc">' + w4r1(w4n(it.carbs_g)) + '</span><span class="ro wfat">' + w4r1(w4n(it.fat_g)) + '</span>'
            : '<input class="wa" type="text" maxlength="40" value="' + esc(it.amount || '') + '" placeholder="200g" style="grid-column:span 2;"/>' +
              '<input class="wk" type="number" min="0" value="' + (it.kcal != null && it.kcal !== '' ? it.kcal : '') + '"/>' +
              '<input class="wp" type="number" min="0" step="any" value="' + (it.protein_g != null && it.protein_g !== '' ? it.protein_g : '') + '"/>' +
              '<input class="wc" type="number" min="0" step="any" value="' + (it.carbs_g != null && it.carbs_g !== '' ? it.carbs_g : '') + '"/>' +
              '<input class="wfat" type="number" min="0" step="any" value="' + (it.fat_g != null && it.fat_g !== '' ? it.fat_g : '') + '"/>') +
          '<button class="btn wx" type="button" style="font-size:11px;padding:5px 7px;">&times;</button>';
        r.querySelector('.wf').addEventListener('input', function(){ it.food = this.value; });
        if (linked){
          function upd(){
            w4Recalc(it);
            r.querySelector('.wk').textContent = Math.round(w4n(it.kcal));
            r.querySelector('.wp').textContent = w4r1(w4n(it.protein_g));
            r.querySelector('.wc').textContent = w4r1(w4n(it.carbs_g));
            r.querySelector('.wfat').textContent = w4r1(w4n(it.fat_g));
            paintTot();
          }
          r.querySelector('.wq').addEventListener('input', function(){ it.qty = this.value; upd(); });
          r.querySelector('.wu').addEventListener('change', function(){ it.unit = this.value; upd(); });
        } else {
          r.querySelector('.wa').addEventListener('input', function(){ it.amount = this.value; });
          ['wk','wp','wc','wfat'].forEach(function(cls){
            var key = { wk: 'kcal', wp: 'protein_g', wc: 'carbs_g', wfat: 'fat_g' }[cls];
            r.querySelector('.' + cls).addEventListener('input', function(){ it[key] = this.value === '' ? '' : w4n(this.value); paintTot(); });
          });
        }
        r.querySelector('.wx').addEventListener('click', function(){ meal.items.splice(idx, 1); paintRows(); paintTot(); });
        rows.appendChild(r);
      });
    }
    var foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
    foot.appendChild(w4SearchBox('Add food \u2014 search UK foods, VYVE staples & your foods\u2026', function(hit){
      meal.items.push(w4NewItem(hit.name, hit.brand, hit.norm));
      paintRows(); paintTot();
    }));
    var man = document.createElement('button');
    man.type = 'button'; man.className = 'btn'; man.style.fontSize = '11.5px'; man.textContent = '+ Manual';
    man.addEventListener('click', function(){ meal.items.push({ food: '', amount: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '', src: 'manual' }); paintRows(); paintTot(); });
    foot.appendChild(man);
    card.appendChild(foot);
    paintRows(); paintTot();
    return card;
  }

  function w4RenderDay(){
    var host = $c('w4-meals');
    if (!host) return;
    var day = w4Plan.days[w4DayIdx];
    host.innerHTML = '';
    function refreshTots(){
      var dt = w4DayTot(day);
      $c('w4-daytot').textContent = w4TotLine(dt, 'Day: ');
      var days = w4Plan.days.filter(function(d){ return (d.meals || []).some(function(m){ return (m.items || []).length; }); });
      if (days.length > 1){
        var t = { k: 0, p: 0, c: 0, f: 0 };
        days.forEach(function(d){ var x = w4DayTot(d); t.k += x.k; t.p += x.p; t.c += x.c; t.f += x.f; });
        $c('w4-plansum').textContent = w4TotLine({ k: t.k / days.length, p: t.p / days.length, c: t.c / days.length, f: t.f / days.length }, 'Daily average across ' + days.length + ' days: ');
      } else {
        $c('w4-plansum').textContent = '';
      }
    }
    day.meals.forEach(function(m, mi){
      host.appendChild(w4MealCard(m, refreshTots, function(){
        if ((m.items || []).length && !confirm('Remove ' + (m.name || 'this meal') + '?')) return;
        day.meals.splice(mi, 1);
        w4RenderDay();
      }));
    });
    if (!day.meals.length){
      host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);padding:6px 0;">No meals on this day yet \u2014 add one below.</p>';
    }
    refreshTots();
  }

  /* ── #16 meals library editor ── */
  function w4MealOpen(b, item){
    var p = (item && item.payload) || {};
    w4MealState = { note: p.note || '', items: deepCopy(p.items || []) };
    b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">A reusable meal. Drop it into any nutrition plan \u2014 each plan keeps its own copy, so editing here never changes what\u2019s already assigned.</p><div id="w4-mealhost"></div>';
    $c('w4-mealhost').appendChild(w4MealCard(w4MealState, null, null));
  }

  /* ── #17 coach foods editor ── */
  function w4FoodOpen(b, item){
    var f = item || {};
    b.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Your private food library \u2014 these appear at the top of every food search when you build meals. Enter values per serving, or prefill from the UK database and tweak.</p>' +
      '<div id="w4-fpre" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;"></div>' +
      '<div class="field-row"><div class="field"><label>Brand (optional)</label><input id="w4f-brand" type="text" maxlength="80" value="' + esc(f.brand || '') + '"/></div>' +
      '<div class="field"><label>Barcode (optional)</label><input id="w4f-bar" type="text" maxlength="32" value="' + esc(f.barcode || '') + '"/></div></div>' +
      '<div class="field-row"><div class="field"><label>Serving size (g or ml)</label><input id="w4f-sg" type="number" min="1" step="any" value="' + (f.serving_size_g != null ? f.serving_size_g : 100) + '"/></div>' +
      '<div class="field"><label>Serving label</label><input id="w4f-su" type="text" maxlength="24" value="' + esc(f.serving_unit || 'g') + '" placeholder="g, ml, scoop, bar"/></div></div>' +
      '<div class="field-row"><div class="field"><label>Calories per serving (kcal)</label><input id="w4f-k" type="number" min="0" step="any" value="' + (f.calories_kcal != null ? f.calories_kcal : '') + '"/></div>' +
      '<div class="field"><label>Protein (g)</label><input id="w4f-p" type="number" min="0" step="any" value="' + (f.protein_g != null ? f.protein_g : '') + '"/></div></div>' +
      '<div class="field-row"><div class="field"><label>Carbs (g)</label><input id="w4f-c" type="number" min="0" step="any" value="' + (f.carbs_g != null ? f.carbs_g : '') + '"/></div>' +
      '<div class="field"><label>Fat (g)</label><input id="w4f-f" type="number" min="0" step="any" value="' + (f.fat_g != null ? f.fat_g : '') + '"/></div></div>' +
      '<div class="field-row"><div class="field"><label>Fibre (g, optional)</label><input id="w4f-fb" type="number" min="0" step="any" value="' + (f.fibre_g != null ? f.fibre_g : '') + '"/></div><div class="field"></div></div>';
    $c('w4-fpre').appendChild(w4SearchBox('Prefill from a food search\u2026', function(hit){
      var sg = hit.norm.sg || 100;
      $c('plf-name').value = hit.name;
      $c('w4f-brand').value = hit.brand || '';
      $c('w4f-sg').value = Math.round(sg);
      $c('w4f-k').value = Math.round(hit.norm.k * sg / 100);
      $c('w4f-p').value = w4r1(hit.norm.p * sg / 100);
      $c('w4f-c').value = w4r1(hit.norm.c * sg / 100);
      $c('w4f-f').value = w4r1(hit.norm.f * sg / 100);
    }));
  }

  /* ── #18 supplements editor v2: list mode / document mode ── */
  function w4SuppOpen(b, item){
    var p = (item && item.payload) || {};
    w4SuppState = { items: deepCopy(p.items || []) };
    w4SuppDoc = p.doc_path ? { path: p.doc_path, name: p.doc_name || 'plan' } : null;
    w4SuppMode = null;
    if (item) w4SuppMode = (w4SuppState.items.length || !w4SuppDoc) ? 'list' : 'doc';
    if (!w4SuppMode){
      b.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:560px;">' +
        '<button class="btn" id="w4sp-clist" type="button" style="padding:22px 14px;text-align:center;"><span style="display:block;font-size:14px;font-weight:700;margin-bottom:4px;">Build a list</span><span style="display:block;font-size:12px;color:var(--text-muted);">Supplements one by one \u2014 dosage, timing, notes, links</span></button>' +
        '<button class="btn" id="w4sp-cdoc" type="button" style="padding:22px 14px;text-align:center;"><span style="display:block;font-size:14px;font-weight:700;margin-bottom:4px;">Upload a document</span><span style="display:block;font-size:12px;color:var(--text-muted);">Your existing plan as a PDF or Excel file</span></button></div>';
      $c('w4sp-clist').addEventListener('click', function(){ w4SuppMode = 'list'; w4SuppRender(b); });
      $c('w4sp-cdoc').addEventListener('click', function(){ w4SuppMode = 'doc'; w4SuppRender(b); });
      return;
    }
    w4SuppRender(b);
  }
  var w4SuppDoc = null;
  function w4SuppRender(b){
    b.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
      '<button class="btn w4sp-m' + (w4SuppMode === 'list' ? ' btn-primary' : '') + '" data-m="list" type="button" style="font-size:12px;">Supplement list</button>' +
      '<button class="btn w4sp-m' + (w4SuppMode === 'doc' ? ' btn-primary' : '') + '" data-m="doc" type="button" style="font-size:12px;">Document</button></div>' +
      '<div id="w4sp-list" style="' + (w4SuppMode === 'list' ? '' : 'display:none;') + '"><div id="sp-rows2"></div><button class="btn" id="sp-add2" type="button" style="font-size:12px;margin-top:6px;">+ Add supplement</button></div>' +
      '<div id="w4sp-doc" style="' + (w4SuppMode === 'doc' ? '' : 'display:none;') + '">' +
        '<div style="border:1.5px dashed var(--border);border-radius:12px;padding:22px;text-align:center;">' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Upload your supplement plan</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">PDF or Excel, up to 10MB \u2014 your client sees it in their app under Nutrition.</div>' +
        '<input id="w4sp-file" type="file" accept="application/pdf,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="font-size:12px;"/></div>' +
        '<div id="w4sp-fst" style="font-size:12px;color:var(--text-muted);margin-top:8px;">' + (w4SuppDoc ? esc(w4SuppDoc.name) + ' \u00b7 attached' : 'No document attached.') + '</div></div>';
    b.querySelectorAll('.w4sp-m').forEach(function(btn){
      btn.addEventListener('click', function(){
        w4SuppMode = btn.dataset.m;
        b.querySelectorAll('.w4sp-m').forEach(function(x){ x.classList.toggle('btn-primary', x === btn); });
        $c('w4sp-list').style.display = w4SuppMode === 'list' ? '' : 'none';
        $c('w4sp-doc').style.display = w4SuppMode === 'doc' ? '' : 'none';
      });
    });
    function addRow(sp){
      var d = document.createElement('div');
      d.style.cssText = 'border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;';
      var tOpts = SP_TIMINGS.slice();
      if (sp.timing && tOpts.indexOf(sp.timing) < 0) tOpts.unshift(sp.timing);
      d.innerHTML = '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;">' +
        '<div class="field"><label>Supplement</label><input class="sp-name" type="text" value="' + esc(sp.name || '') + '" placeholder="e.g. Creatine"/></div>' +
        '<div class="field"><label>Dosage</label><input class="sp-dose" type="text" value="' + esc(sp.dosage || '') + '" placeholder="5g"/></div>' +
        '<div class="field"><label>Timing</label><select class="sp-time"><option value="">\u2014</option>' + tOpts.map(function(t){ return '<option value="' + esc(t) + '"' + (sp.timing === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Duration</label><input class="sp-dur" type="text" value="' + esc(sp.duration || '') + '" placeholder="8 weeks"/></div></div>' +
        '<div class="field" style="margin-top:8px;"><label>Product link (your code/affiliate link, optional)</label><input class="sp-link" type="text" value="' + esc(sp.link || '') + '" placeholder="https://\u2026"/></div>' +
        '<div class="field"><label>Notes for the client</label><textarea class="sp-notes" rows="2" maxlength="600" style="width:100%;padding:8px 11px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;">' + esc(sp.notes || '') + '</textarea></div>' +
        '<div style="text-align:right;"><button class="btn sp-del2" type="button" style="font-size:11.5px;padding:5px 10px;">Remove</button></div>';
      d.querySelector('.sp-del2').addEventListener('click', function(){ d.remove(); });
      $c('sp-rows2').appendChild(d);
    }
    (w4SuppState.items.length ? w4SuppState.items : [{}]).forEach(addRow);
    $c('sp-add2').addEventListener('click', function(){ addRow({}); });
    $c('w4sp-file').addEventListener('change', async function(){
      var f = this.files && this.files[0];
      if (!f) return;
      var st = $c('w4sp-fst');
      var okTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (okTypes.indexOf(f.type) < 0){ st.textContent = 'PDF or Excel only.'; return; }
      if (f.size > 10 * 1024 * 1024){ st.textContent = 'Too big \u2014 10MB max.'; return; }
      st.textContent = 'Uploading\u2026';
      try {
        var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
        var path = pprefix() + '/' + Date.now() + '-' + safe;
        var up = await sb().storage.from('coach-content').upload(path, f, { contentType: f.type, upsert: true });
        if (up.error) throw up.error;
        w4SuppDoc = { path: path, name: f.name };
        st.textContent = f.name + ' \u00b7 uploaded \u2014 save the plan to attach it.';
      } catch(e){ st.textContent = 'Upload failed: ' + (e.message || e); }
    });
  }

  /* ── shopping list (#15) — aggregate ingredients across days ── */
  var w4ShopEl = null;
  function w4ShopOpen(days, title){
    var agg = {}, order = [];
    (days || []).forEach(function(d){ (d.meals || []).forEach(function(m){ (m.items || []).forEach(function(it){
      var name = String(it.food || '').trim();
      if (!name) return;
      var key = name.toLowerCase();
      if (!agg[key]){ agg[key] = { name: name, grams: 0, n: 0, loose: [] }; order.push(key); }
      agg[key].n += 1;
      var g = w4n(it.grams);
      if (g > 0) agg[key].grams += g;
      else if (it.amount) agg[key].loose.push(String(it.amount));
    }); }); });
    if (!order.length){ alert('No foods in the plan yet.'); return; }
    var lines = order.map(function(k){
      var a = agg[k], qty = '';
      if (a.grams > 0) qty = a.grams >= 1000 ? (Math.round(a.grams / 100) / 10) + 'kg' : Math.round(a.grams) + 'g';
      if (a.loose.length) qty += (qty ? ' + ' : '') + a.loose.join(' + ');
      return { name: a.name, qty: qty, n: a.n };
    });
    if (!w4ShopEl){
      w4ShopEl = document.createElement('div');
      w4ShopEl.className = 'w3-modal';
      w4ShopEl.style.display = 'none';
      w4ShopEl.innerHTML = '<div class="in" style="max-width:520px;"><div class="hd"><strong id="w4sh-title" style="flex:1;font-size:14px;"></strong><button class="btn" id="w4sh-copy" type="button" style="font-size:12px;">Copy list</button><button class="btn" id="w4sh-x" type="button" style="font-size:12px;">Close</button></div><div class="sc" id="w4sh-body" style="padding:14px 18px;"></div></div>';
      document.body.appendChild(w4ShopEl);
      $c('w4sh-x').addEventListener('click', function(){ w4ShopEl.style.display = 'none'; });
      w4ShopEl.addEventListener('click', function(ev){ if (ev.target === w4ShopEl) w4ShopEl.style.display = 'none'; });
    }
    $c('w4sh-title').textContent = 'Shopping list \u2014 ' + title;
    $c('w4sh-body').innerHTML = lines.map(function(l){
      return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;">' +
        '<span style="flex:1;">' + esc(l.name) + '</span>' +
        (l.qty ? '<span style="font-weight:700;">' + esc(l.qty) + '</span>' : '') +
        '<span style="font-size:11px;color:var(--text-muted);flex:none;">\u00d7' + l.n + '</span></div>';
    }).join('') + '<p style="font-size:11px;color:var(--text-muted);margin-top:10px;">Totals cover every day in the plan \u2014 scale for how many days your client shops for.</p>';
    var txt = lines.map(function(l){ return '\u2022 ' + l.name + (l.qty ? ' \u2014 ' + l.qty : ''); }).join('\n');
    var cp = $c('w4sh-copy');
    cp.onclick = async function(){
      try { await navigator.clipboard.writeText('Shopping list \u2014 ' + title + '\n' + txt); cp.textContent = 'Copied \u2713'; setTimeout(function(){ cp.textContent = 'Copy list'; }, 1800); }
      catch(e){ prompt('Copy your list:', txt); }
    };
    w4ShopEl.style.display = 'flex';
  }

  /* ── nutrition plan preview modal (#14 read view) ── */
  var w4PvEl = null;
  function w4PlanDays(p){
    if (p.days && p.days.length) return p.days;
    if (p.meals && p.meals.length) return [{ name: 'Day 1', meals: p.meals }];
    return [];
  }
  function w4PreviewOpen(item){
    var p = item.payload || {};
    var days = w4PlanDays(p);
    if (!w4PvEl){
      w4PvEl = document.createElement('div');
      w4PvEl.className = 'w3-modal';
      w4PvEl.style.display = 'none';
      w4PvEl.innerHTML = '<div class="in" style="max-width:680px;"><div class="hd"><strong id="w4pv-title" style="flex:1;font-size:14px;"></strong><button class="btn" id="w4pv-x" type="button" style="font-size:12px;">Close</button></div><div class="sc" id="w4pv-body" style="padding:14px 18px;"></div></div>';
      document.body.appendChild(w4PvEl);
      $c('w4pv-x').addEventListener('click', function(){ w4PvEl.style.display = 'none'; });
      w4PvEl.addEventListener('click', function(ev){ if (ev.target === w4PvEl) w4PvEl.style.display = 'none'; });
    }
    $c('w4pv-title').textContent = item.name;
    var head = '';
    if (p.calories || p.protein_g) head += '<div style="font-size:12.5px;margin-bottom:10px;"><span class="w3-chip pri">Targets</span> ' + [p.calories ? p.calories + ' kcal' : null, p.protein_g ? p.protein_g + 'g P' : null, p.carbs_g ? p.carbs_g + 'g C' : null, p.fat_g ? p.fat_g + 'g F' : null, p.hydration_l ? p.hydration_l + 'L water' : null].filter(Boolean).join(' \u00b7 ') + '</div>';
    if (p.pdf_path) head += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">PDF attached \u2014 ' + esc(p.pdf_name || 'plan.pdf') + '</div>';
    var body = $c('w4pv-body');
    function paintDay(di){
      var d = days[di] || { meals: [] };
      var dt = w4DayTot(d);
      var html = head;
      if (days.length) html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' + days.map(function(dd, i){ return '<button type="button" class="w4-daypill' + (i === di ? ' on' : '') + '" data-pd="' + i + '">' + esc(dd.name || ('Day ' + (i + 1))) + '</button>'; }).join('') + '</div>';
      html += (d.meals || []).map(function(m){
        var mt = w4Tot(m.items);
        return '<div style="padding:8px 0;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;font-weight:700;font-size:13.5px;"><span>' + esc(m.name || 'Meal') + '</span><span style="color:var(--text-muted);font-weight:400;font-size:12px;">' + esc(w4TotLine(mt, '')) + '</span></div>' +
          (m.note ? '<div style="font-size:12px;color:var(--teal-lt);margin-top:2px;">' + esc(m.note) + '</div>' : '') +
          (m.items || []).map(function(i){
            return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--text-muted);padding-top:3px;"><span>' + esc(i.food || '') + (i.amount ? ', ' + esc(i.amount) : '') + '</span><span style="flex:none;">' + (i.kcal ? Math.round(w4n(i.kcal)) + ' kcal' : '') + (i.protein_g ? ' \u00b7 ' + w4r1(w4n(i.protein_g)) + 'g P' : '') + '</span></div>';
          }).join('') + '</div>';
      }).join('');
      if (dt.k) html += '<div style="font-size:12.5px;font-weight:700;margin-top:10px;">' + esc(w4TotLine(dt, 'Day total: ')) + '</div>';
      if (!days.length) html += '<p style="font-size:12.5px;color:var(--text-muted);">Targets-only plan \u2014 no meals authored.</p>';
      body.innerHTML = html;
      body.querySelectorAll('[data-pd]').forEach(function(bb){ bb.addEventListener('click', function(){ paintDay(parseInt(bb.dataset.pd)); }); });
    }
    paintDay(0);
    w4PvEl.style.display = 'flex';
  }

  /* ── generalised Assign-to modal (slot-aware; w3AssignOpen stays workout-only) ── */
  var w4AsgEl = null;
  function w4AssignOpen(item, slotKey, noun){
    if (!w4AsgEl){
      w4AsgEl = document.createElement('div');
      w4AsgEl.className = 'w3-modal';
      w4AsgEl.style.display = 'none';
      w4AsgEl.innerHTML = '<div class="in" style="max-width:480px;"><div class="hd"><strong id="w4as-title" style="flex:1;font-size:14px;"></strong><button class="btn" id="w4as-x" type="button" style="font-size:12px;">Close</button></div><div class="sc" id="w4as-body"></div></div>';
      document.body.appendChild(w4AsgEl);
      $c('w4as-x').addEventListener('click', function(){ w4AsgEl.style.display = 'none'; });
      w4AsgEl.addEventListener('click', function(ev){ if (ev.target === w4AsgEl) w4AsgEl.style.display = 'none'; });
    }
    $c('w4as-title').textContent = 'Assign \u201c' + item.name + '\u201d';
    $c('w4as-body').innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Loading clients\u2026</p>';
    w4AsgEl.style.display = 'flex';
    w3Clients().then(function(cs){
      if (!cs.length){ $c('w4as-body').innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No clients yet \u2014 add one from the Clients page first.</p>'; return; }
      $c('w4as-body').innerHTML = cs.map(function(c){
        var has = JSON.stringify(c.assignments || {}).indexOf(item.id) >= 0;
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">' +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;">' + esc(((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.member_email) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(c.member_email) + ' \u00b7 ' + esc(c.status || '') + '</div></div>' +
          (has ? '<span style="font-size:11px;color:#3DB89F;font-weight:700;">Assigned \u2713</span>' : '<button class="btn btn-primary" data-w4as="' + esc(c.member_email) + '" style="font-size:11.5px;">Assign</button>') +
          '</div>';
      }).join('') + '<p style="font-size:11px;color:var(--text-muted);margin-top:10px;">Assigning replaces the client\u2019s ' + noun + ' slot and, for active consented clients, pushes straight to their app.</p>';
      $c('w4as-body').querySelectorAll('[data-w4as]').forEach(function(bb){
        bb.addEventListener('click', async function(){
          bb.disabled = true; bb.textContent = 'Assigning\u2026';
          try {
            var asg = {};
            asg[slotKey] = item.id;
            await ef({ action: 'update_assignments', email: bb.dataset.w4as, merge_slots: true, assignments: asg });
            bb.outerHTML = '<span style="font-size:11px;color:#3DB89F;font-weight:700;">Assigned \u2713</span>';
            w3ClientsCache = null;
          } catch(e){ bb.disabled = false; bb.textContent = 'Assign'; alert('Assign failed: ' + e.message); }
        });
      });
    });
  }

  /* ── #13 plans-list upgrade + meal/supplement lists ── */
  function w4PlanMeta(p){
    var bits = [];
    if (p.calories) bits.push(p.calories + ' kcal target');
    if (p.protein_g) bits.push(p.protein_g + 'g P');
    var days = w4PlanDays(p);
    if (days.length){
      var nm = days.reduce(function(a, d){ return a + (d.meals || []).length; }, 0);
      bits.push(days.length + ' day' + (days.length === 1 ? '' : 's') + ' \u00b7 ' + nm + ' meal' + (nm === 1 ? '' : 's'));
      if (!p.calories){
        var fed = days.filter(function(d){ return (d.meals || []).some(function(m){ return (m.items || []).length; }); });
        if (fed.length){
          var t = { k: 0 };
          fed.forEach(function(d){ t.k += w4DayTot(d).k; });
          if (t.k) bits.push('~' + Math.round(t.k / fed.length).toLocaleString() + ' kcal/day');
        }
      }
    }
    if (p.pdf_path) bits.push('PDF attached');
    return bits.join(' \u00b7 ') || 'empty plan';
  }
  function w4PaintList(el){
    var kindNow = plKind;
    var counts = {};
    var slot = plKind === 'nutrition' ? 'nutrition_template_id' : 'supplements_template_id';
    if (plKind !== 'meal'){
      w3Clients().then(function(cs){
        if (plKind !== kindNow) return;
        (cs || []).forEach(function(c){
          var s = JSON.stringify(c.assignments || {});
          plItems.forEach(function(it){ if (s.indexOf(it.id) >= 0) counts[it.id] = (counts[it.id] || 0) + 1; });
        });
        paint();
      });
    }
    function meta(it){
      var p = it.payload || {};
      if (kindNow === 'nutrition') return w4PlanMeta(p);
      if (kindNow === 'meal'){
        var t = w4Tot(p.items);
        var chip = (typeof w7MealChip === 'function') ? w7MealChip(p) : '';   /* PM-1098 W7 */
        return chip + ((p.items || []).length) + ' foods' + (t.k ? ' \u00b7 ' + Math.round(t.k) + ' kcal \u00b7 ' + Math.round(t.p) + 'g P' : '');
      }
      var n = (p.items || []).length;
      return (n ? n + ' supplement' + (n === 1 ? '' : 's') : '') + (p.doc_path ? (n ? ' \u00b7 ' : '') + 'document plan' : '') || 'empty';
    }
    /* PM-1115 W7: Meals paint as a photo grid, not a text row. Same data-*
       hooks as the list, so every existing handler below still binds. */
    /* PM-1118 W7: click a recipe card to read it — photo, allergens, times,
       per-serving macros, a servings scaler and the method. Self-contained
       overlay so it does not depend on any of the four modal helpers. */
    function w7RecipeView(it){
      if (!it) return;
      var p = it.payload || {};
      var base = Math.max(1, parseInt(p.servings, 10) || 1);
      var items = p.items || [];
      var method = Array.isArray(p.method) ? p.method : [];
      var alg = Array.isArray(p.allergens) ? p.allergens : [];
      var img = w7PhotoUrl(p.image_path);
      var old = document.getElementById('w7-rv'); if (old) old.remove();
      var ov = document.createElement('div');
      ov.id = 'w7-rv';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:34px 16px;';
      function macros(n){
        var t = w4Tot(items);
        return { k: Math.round(t.k / base * n), p: Math.round(t.p / base * n),
                 c: Math.round(t.c / base * n), fa: Math.round(t.f / base * n) };
      }
      function ingList(n){
        var f = n / base;
        return items.map(function(i){
          var q = Math.round((parseFloat(i.qty) || 0) * f);
          return '<li style="padding:5px 0;border-bottom:1px solid var(--border);font-size:13px;">' +
            '<span style="color:var(--text-muted);">' + q + 'g</span> ' + esc(i.food || '') + '</li>';
        }).join('');
      }
      function body(n){
        var m = macros(n);
        return '<div style="padding:18px 20px 22px;">' +
          '<h2 style="margin:0 0 12px;font-size:21px;">' + esc(it.name) + '</h2>' +
          (alg.length ? '<div style="background:rgba(224,155,61,.12);border:1px solid rgba(224,155,61,.35);border-radius:9px;padding:8px 11px;font-size:12.5px;margin-bottom:14px;">Contains ' + esc(alg.join(', ')) + '</div>' : '') +
          '<div style="display:flex;gap:26px;font-size:12.5px;color:var(--text-muted);margin-bottom:14px;">' +
            '<div><b style="color:var(--text);">' + ((+p.prep_mins||0)+(+p.cook_mins||0)) + ' min</b><br>Total</div>' +
            '<div><b style="color:var(--text);">' + (+p.prep_mins||0) + ' min</b><br>Prep</div>' +
            '<div><b style="color:var(--text);">' + (+p.cook_mins||0) + ' min</b><br>Cook</div>' +
          '</div>' +
          '<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:14px;">' +
            '<div style="font-size:16px;font-weight:700;">' + m.k + ' kcal</div>' +
            '<div style="font-size:12.5px;color:var(--text-muted);">' + m.p + 'g protein \u00b7 ' + m.c + 'g carbs \u00b7 ' + m.fa + 'g fat</div>' +
          '</div>' +
          '<label style="font-size:12px;color:var(--text-muted);">Servings</label>' +
          '<select id="w7-rv-sv" class="inp" style="width:100%;margin:5px 0 16px;padding:8px;">' +
            [1,2,3,4,5,6,8,10,12].map(function(v){ return '<option value="' + v + '"' + (v===n?' selected':'') + '>' + v + (v===base?' \u2014 original recipe':'') + '</option>'; }).join('') +
          '</select>' +
          '<h3 style="font-size:14px;margin:0 0 6px;">Ingredients</h3>' +
          '<ul style="list-style:none;padding:0;margin:0 0 16px;">' + ingList(n) + '</ul>' +
          (method.length ? '<h3 style="font-size:14px;margin:0 0 6px;">Method</h3><ol style="padding-left:18px;margin:0;">' +
            method.map(function(x){ return '<li style="font-size:13px;line-height:1.55;margin-bottom:7px;">' + esc(x) + '</li>'; }).join('') + '</ol>' : '') +
        '</div>';
      }
      function render(n){
        ov.innerHTML = '<div style="background:var(--bg2,var(--surface));border:1px solid var(--border);border-radius:14px;max-width:520px;width:100%;overflow:hidden;position:relative;">' +
          '<button id="w7-rv-x" style="position:absolute;top:10px;right:10px;z-index:2;width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;font-size:15px;">\u00d7</button>' +
          (img ? '<div style="aspect-ratio:1;background:#0d1f1f url(' + img + ') center/cover;"></div>' : '') +
          body(n) + '</div>';
        ov.querySelector('#w7-rv-x').addEventListener('click', function(){ ov.remove(); });
        var sel = ov.querySelector('#w7-rv-sv');
        if (sel) sel.addEventListener('change', function(){ render(parseInt(sel.value, 10) || base); });
      }
      ov.addEventListener('click', function(ev){ if (ev.target === ov) ov.remove(); });
      render(base);
      document.body.appendChild(ov);
    }
    function mealCard(it){
      var p = it.payload || {};
      var sv = Math.max(1, parseInt(p.servings, 10) || 1);
      var t = w4Tot(p.items);
      var per = t.k ? Math.round(t.k / sv) : 0;
      var img = w7PhotoUrl(p.image_path);
      var thumb = img
        ? '<div style="aspect-ratio:1;background:#0d1f1f url(' + img + ') center/cover;"></div>'
        : '<div style="aspect-ratio:1;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;">No photo</div>';
      var slot = p.slot ? '<span style="font-size:10.5px;color:var(--text-muted);">' + esc(p.slot) + '</span>' : '';
      var kc = per ? '<span style="font-size:10.5px;color:var(--text-muted);">' + per + ' kcal / serving</span>' : '';
      var live = it._stock
        ? '<span class="w3-chip pri" style="font-size:10px;">VYVE</span>'
        : ((p.shared === true)
            ? '<span class="w3-chip pri" style="font-size:10px;">Shared</span>'
            : '<span class="w3-chip" style="font-size:10px;">Draft</span>');
      /* Stock rows are not the coach's to edit or delete — only to copy. */
      var ownActions = it._stock
        ? '<button class="btn" data-w4-dup="' + it.id + '" style="font-size:11px;">Copy to my library</button>'
        : '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11px;">Edit</button>' +
          '<button class="btn" data-w4-dup="' + it.id + '" style="font-size:11px;">Duplicate</button>' +
          '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11px;">Delete</button>';
      return '<div data-w7-view="' + it.id + '" style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-card,var(--surface));cursor:pointer;">' +
        thumb +
        '<div style="padding:9px 10px;">' +
          '<div style="font-weight:600;font-size:13px;line-height:1.3;margin-bottom:3px;">' + esc(it.name) + '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:7px;">' + slot + kc + '</div>' +
          '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">' + live + ownActions + '</div>' +
        '</div></div>';
    }
    function paint(){
      if (kindNow === 'meal'){
        el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;padding:4px 0;">' +
          plItems.map(mealCard).join('') + '</div>';
        bindActions();
        return;
      }
      el.innerHTML = plItems.map(function(it){
        var n = counts[it.id];
        var cBadge = kindNow === 'meal' ? '' : (n ? '<span class="w3-chip pri" title="Clients currently assigned">' + n + ' client' + (n === 1 ? '' : 's') + '</span>' : '<span class="w3-chip">unassigned</span>');
        var acts = '';
        if (kindNow === 'nutrition') acts += '<button class="btn" data-w4-pv="' + it.id + '" style="font-size:11.5px;">Preview</button>' +
          '<button class="btn" data-w4-sh="' + it.id + '" style="font-size:11.5px;">Shopping list</button>';
        if (kindNow !== 'meal') acts += '<button class="btn" data-w4-asg="' + it.id + '" style="font-size:11.5px;">Assign to\u2026</button>';
        acts += '<button class="btn" data-w4-dup="' + it.id + '" style="font-size:11.5px;">Duplicate</button>' +
          '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
          '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button>';
        return '<div style="display:flex;align-items:center;gap:8px;padding:9px 4px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:170px;"><div style="font-weight:600;">' + esc(it.name) + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);">' + esc(meta(it)) + ' \u00b7 edited ' + w3Rel(it.updated_at || it.created_at) + '</div></div>' +
          cBadge + acts + '</div>';
      }).join('');
      bindActions();
    }
    function bindActions(){
      function byId(id){ return plItems.find(function(x){ return x.id === id; }); }
      el.querySelectorAll('[data-w7-view]').forEach(function(c){
        c.addEventListener('click', function(ev){
          if (ev.target.closest('button')) return;   /* Edit/Copy/Delete win */
          w7RecipeView(byId(c.dataset.w7View));
        });
      });
      el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(byId(b.dataset.plEdit)); }); });
      el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
      el.querySelectorAll('[data-w4-pv]').forEach(function(b){ b.addEventListener('click', function(){ w4PreviewOpen(byId(b.dataset.w4Pv)); }); });
      el.querySelectorAll('[data-w4-sh]').forEach(function(b){ b.addEventListener('click', function(){ var it = byId(b.dataset.w4Sh); w4ShopOpen(w4PlanDays(it.payload || {}), it.name); }); });
      el.querySelectorAll('[data-w4-asg]').forEach(function(b){ b.addEventListener('click', function(){
        var it = byId(b.dataset.w4Asg);
        w4AssignOpen(it, slot, kindNow === 'nutrition' ? 'nutrition' : 'supplement');
      }); });
      el.querySelectorAll('[data-w4-dup]').forEach(function(b){ b.addEventListener('click', async function(){
        var it = byId(b.dataset.w4Dup);
        b.disabled = true;
        try {
          await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: it.kind, name: (it.name + ' (copy)').slice(0, 120), payload: it.payload } });
          await plLoad(); loadLibraries();
        } catch(e){ b.disabled = false; alert('Duplicate failed: ' + e.message); }
      }); });
    }
    paint();
  }

  /* ── #17 coach foods list (kindsel:food lens; data lives in coach_foods) ── */
  async function w4FoodList(el){
    var rows = await w4MyFoods(true);
    var q = '';
    function paint(){
      var vis = rows.filter(function(r){ return !q || r.food_name.toLowerCase().indexOf(q) >= 0 || (r.brand || '').toLowerCase().indexOf(q) >= 0; });
      var html = '<div class="field" style="max-width:320px;margin-bottom:10px;"><input id="w4fl-q" type="text" placeholder="Search your foods\u2026" value="' + esc(q) + '"/></div>';
      if (!rows.length) html += '<div class="empty-state"><h3>No foods yet</h3><p>Save your go-to foods once and they appear at the top of every search when you build meals. Use + New, or prefill from the UK food database.</p></div>';
      else if (!vis.length) html += '<p style="font-size:12.5px;color:var(--text-muted);">Nothing matches.</p>';
      else html += vis.map(function(r){
        return '<div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:170px;"><div style="font-weight:600;">' + esc(r.food_name) + (r.brand ? ' <span style="font-weight:400;color:var(--text-muted);font-size:12px;">\u00b7 ' + esc(r.brand) + '</span>' : '') + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);">Per ' + (r.serving_size_g || 100) + (esc(r.serving_unit || 'g')) + ': ' + Math.round(w4n(r.calories_kcal)) + ' kcal \u00b7 ' + w4r1(w4n(r.protein_g)) + 'g P \u00b7 ' + w4r1(w4n(r.carbs_g)) + 'g C \u00b7 ' + w4r1(w4n(r.fat_g)) + 'g F</div></div>' +
          '<button class="btn" data-w4f-ed="' + r.id + '" style="font-size:11.5px;">Edit</button>' +
          '<button class="btn" data-w4f-rm="' + r.id + '" style="font-size:11.5px;">Remove</button></div>';
      }).join('');
      el.innerHTML = html;
      var qi = $c('w4fl-q');
      qi.addEventListener('input', function(){ q = this.value.toLowerCase().trim(); paint(); var qi2 = $c('w4fl-q'); qi2.focus(); qi2.setSelectionRange(qi2.value.length, qi2.value.length); });
      el.querySelectorAll('[data-w4f-ed]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(rows.find(function(x){ return x.id === b.dataset.w4fEd; })); }); });
      el.querySelectorAll('[data-w4f-rm]').forEach(function(b){ b.addEventListener('click', async function(){
        if (!confirm('Remove this food from your library? Meals already built with it keep their values.')) return;
        b.disabled = true;
        try { await rest('/coach_foods?id=eq.' + b.dataset.w4fRm, { method: 'PATCH', body: { active: false, updated_at: new Date().toISOString() } }); w4FoodList(el); }
        catch(e){ b.disabled = false; alert('Remove failed: ' + e.message); }
      }); });
    }
    paint();
  }

  /* ── plLoad v6: food lens + nutrition/meal/supplements upgraded lists;
        workout kinds + forms byte-replicate v5 below. ── */
  async function plLoad(){
    var el = $c('pl-list');
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    if (plKind === 'food'){ plItems = []; w4FoodList(el); return; }
    try {
      if (IS_FORM(plKind)) plItems = await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
      else plItems = await rest('/coach_templates?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
    } catch(e){ plItems = []; }
    /* PM-1117 W7: the VYVE stock recipe library lives at partner_id IS NULL, and
       pscope() is partner_id=eq.<id> for a partner coach, so it was never even
       requested. NOTE: this file declares plLoad four times and hoisting means
       the LAST one wins — patching an earlier copy is dead code (§23.252). */
    if (plKind === 'meal'){
      try {
        var stock = await rest('/coach_templates?partner_id=is.null&kind=eq.meal&active=eq.true&order=name.asc&select=*') || [];
        var own = {}; plItems.forEach(function(x){ own[x.id] = 1; });
        stock.forEach(function(x){ if (!own[x.id]){ x._stock = true; plItems.push(x); } });
      } catch(e){ /* the coach's own library still renders */ }
    }
    if (!plItems.length){
      var hint = plKind === 'meal' ? 'Create your first meal \u2014 reuse it across every nutrition plan you build.' : 'Create your first ' + KIND_LABEL[plKind] + ' and it becomes assignable to clients.';
      el.innerHTML = '<div class="empty-state"><h3>Nothing here yet</h3><p>' + hint + '</p></div>';
      return;
    }

    if (plKind === 'nutrition' || plKind === 'meal' || plKind === 'supplements'){ w4PaintList(el); return; }

    if (W3_WK_KINDS[plKind]){
      var kindNow = plKind;
      var counts = {};
      Promise.all([w3Clients(), exLoad()]).then(function(res){
        if (plKind !== kindNow) return;
        (res[0] || []).forEach(function(c){
          var s = JSON.stringify(c.assignments || {});
          plItems.forEach(function(it){ if (s.indexOf(it.id) >= 0) counts[it.id] = (counts[it.id] || 0) + 1; });
        });
        paintWk();
      });
      function wkMeta(it){
        var p = it.payload || {};
        if (it.kind === 'program') return ((p.weeks || []).length) + ' wk \u00b7 ' + progDayCount(p) + ' days';
        if (it.kind === 'workout') return ((p.sessions || []).length) + ' sessions/wk';
        return ((p.exercises || []).length) + ' exercises' + (dayHasGroups(p) ? ' \u00b7 supersets' : '');
      }
      function wkThumb(it){
        var days = w3Days(it);
        var first = days.length && (days[0].day.exercises || [])[0];
        return w3ThumbImg(first ? w3Resolve(first) : null, 'w3-exthumb');
      }
      function paintWk(){
        el.innerHTML = plItems.map(function(it){
          var n = counts[it.id];
          var cBadge = n ? '<span class="w3-chip pri" title="Clients currently assigned">' + n + ' client' + (n === 1 ? '' : 's') + '</span>' : '<span class="w3-chip">unassigned</span>';
          return '<div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
            wkThumb(it) +
            '<div style="flex:1;min-width:170px;"><div style="font-weight:600;">' + esc(it.name) + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-muted);">' + esc(wkMeta(it)) + ' \u00b7 edited ' + w3Rel(it.updated_at || it.created_at) + '</div></div>' +
            cBadge +
            '<button class="btn" data-w3-pv="' + it.id + '" style="font-size:11.5px;">Preview</button>' +
            '<button class="btn" data-w3-asg="' + it.id + '" style="font-size:11.5px;">Assign to\u2026</button>' +
            '<button class="btn" data-w3-dup="' + it.id + '" style="font-size:11.5px;">Duplicate</button>' +
            '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
            '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button></div>';
        }).join('');
        function byId(id){ return plItems.find(function(x){ return x.id === id; }); }
        el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(byId(b.dataset.plEdit)); }); });
        el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
        el.querySelectorAll('[data-w3-qv]').forEach(function(b){ b.addEventListener('click', function(){ w3QvOpen(byId(b.dataset.w3Qv)); }); });
        el.querySelectorAll('[data-w3-pv]').forEach(function(b){ b.addEventListener('click', function(){ w3PreviewOpen(byId(b.dataset.w3Pv)); }); });
        el.querySelectorAll('[data-w3-asg]').forEach(function(b){ b.addEventListener('click', function(){ w3AssignOpen(byId(b.dataset.w3Asg)); }); });
        el.querySelectorAll('[data-w3-dup]').forEach(function(b){ b.addEventListener('click', async function(){
          var it = byId(b.dataset.w3Dup);
          b.disabled = true;
          try {
            await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: it.kind, name: (it.name + ' (copy)').slice(0, 120), payload: it.payload } });
            await plLoad(); loadLibraries();
          } catch(e){ b.disabled = false; alert('Duplicate failed: ' + e.message); }
        }); });
      }
      paintWk();
      return;
    }

    var defable = plKind === 'onboarding' || plKind === 'checkin';
    el.innerHTML = plItems.map(function(it){
      var name = it.title || it.name;
      var sub = IS_FORM(plKind) ? ((it.questions || []).length + ' questions') : summarise(it.payload || {});
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

  /* ── save path: plSave v2 shadow routes Wave-4 kinds to w4Save; every other
        kind keeps the legacy body verbatim. ── */
  function w4CleanItems(items){
    return (items || []).filter(function(i){ return String(i.food || '').trim() !== ''; }).map(function(i){
      var o = { food: String(i.food).trim(), amount: i.amount || '', kcal: i.kcal === '' || i.kcal == null ? null : Math.round(w4n(i.kcal)),
                protein_g: i.protein_g === '' || i.protein_g == null ? null : w4r1(w4n(i.protein_g)),
                carbs_g: i.carbs_g === '' || i.carbs_g == null ? null : w4r1(w4n(i.carbs_g)),
                fat_g: i.fat_g === '' || i.fat_g == null ? null : w4r1(w4n(i.fat_g)) };
      if (i.brand) o.brand = i.brand;
      if (i.per100){ o.per100 = i.per100; o.qty = w4n(i.qty); o.unit = i.unit; o.grams = Math.round(w4n(i.grams)); }
      return o;
    });
  }
  async function w4Save(){
    var name = $c('plf-name').value.trim(), msg = $c('pl-msg');
    if (!name){ msg.textContent = 'Give it a name.'; return; }
    var btn = $c('pl-save');
    var payload = null, valid = false, err = '';

    if (plKind === 'food'){
      var kv = $c('w4f-k').value;
      if (kv === ''){ msg.textContent = 'Calories per serving is required.'; return; }
      var body = { food_name: name, brand: $c('w4f-brand').value.trim() || null, barcode: $c('w4f-bar').value.trim() || null,
                   serving_size_g: w4n($c('w4f-sg').value) || 100, serving_unit: $c('w4f-su').value.trim() || 'g',
                   calories_kcal: w4n(kv), protein_g: w4n($c('w4f-p').value), carbs_g: w4n($c('w4f-c').value),
                   fat_g: w4n($c('w4f-f').value), fibre_g: $c('w4f-fb').value === '' ? null : w4n($c('w4f-fb').value),
                   updated_at: new Date().toISOString() };
      btn.disabled = true; msg.textContent = 'Saving\u2026';
      try {
        if (plEditing && plEditing.food_name) await rest('/coach_foods?id=eq.' + plEditing.id, { method: 'PATCH', body: body });
        else { body.partner_id = partnerId; delete body.updated_at; await rest('/coach_foods', { method: 'POST', body: body }); }
        w4MyFoodsCache = null;
        msg.textContent = 'Saved.';
        $c('pl-editor').style.display = 'none';
        await plLoad();
      } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      btn.disabled = false;
      return;
    }

    if (plKind === 'nutrition'){
      var days = w4Plan.days.map(function(d){
        return { name: String(d.name || '').trim() || 'Day', meals: (d.meals || []).map(function(m){
          var cm = { name: String(m.name || '').trim(), items: w4CleanItems(m.items) };
          if (m.note && String(m.note).trim()) cm.note = String(m.note).trim();
          if (typeof w7PlanMealKeep === 'function') w7PlanMealKeep(m, cm);   /* PM-1100 W7 */
          return cm;
        }).filter(function(m){ return m.name || m.items.length; }) };
      });
      while (days.length > 1 && !days[days.length - 1].meals.length) days.pop();
      var anyFood = days.some(function(d){ return d.meals.some(function(m){ return m.items.length; }); });
      payload = {};
      [['nf-cal','calories'],['nf-pro','protein_g'],['nf-fat','fat_g'],['nf-carb','carbs_g'],['nf-water','hydration_l']].forEach(function(pair){
        var v = $c(pair[0]).value;
        if (v !== '') payload[pair[1]] = w4n(v);
      });
      var notes = $c('nf-notes').value.trim();
      if (notes) payload.notes = notes;
      if (anyFood || days.some(function(d){ return d.meals.length; })){
        payload.days = days;
        payload.meals = days[0] ? days[0].meals : []; /* legacy mirror: day 1 for old readers */
      }
      if (w4Pdf){ payload.pdf_path = w4Pdf.path; payload.pdf_name = w4Pdf.name; }
      valid = payload.calories != null || payload.protein_g != null || anyFood || !!w4Pdf;
      err = 'Set targets, build at least one meal, or attach a PDF.';
    } else if (plKind === 'meal'){
      payload = { items: w4CleanItems(w4MealState.items) };
      if (w4MealState.note && String(w4MealState.note).trim()) payload.note = String(w4MealState.note).trim();
      /* PM-1098 W7: presentation keys (photo/method/servings/tags/shared). Guarded
         so a parse failure in the W7 zone saves the W6 meal rather than nothing. */
      if (typeof w7MealPayload === 'function') w7MealPayload(payload);
      valid = payload.items.length > 0;
      err = 'Add at least one food.';
    } else { /* supplements */
      var items = [];
      var rowsEl = $c('sp-rows2');
      if (rowsEl) rowsEl.querySelectorAll(':scope > div').forEach(function(d){
        var nm = d.querySelector('.sp-name').value.trim();
        if (!nm) return;
        items.push({ name: nm, dosage: d.querySelector('.sp-dose').value.trim(), timing: d.querySelector('.sp-time').value.trim(),
                     duration: d.querySelector('.sp-dur').value.trim(), link: d.querySelector('.sp-link').value.trim(),
                     notes: d.querySelector('.sp-notes').value.trim() });
      });
      payload = { items: items };
      if (w4SuppDoc){ payload.doc_path = w4SuppDoc.path; payload.doc_name = w4SuppDoc.name; }
      valid = items.length > 0 || !!w4SuppDoc;
      err = 'Add at least one supplement or upload a document.';
    }

    if (!valid){ msg.textContent = err; return; }
    btn.disabled = true; msg.textContent = 'Saving\u2026';
    try {
      if (plEditing) await rest('/coach_templates?id=eq.' + plEditing.id, { method: 'PATCH', body: { name: name, payload: payload, updated_at: new Date().toISOString() } });
      else await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: plKind, name: name, payload: payload } });
      msg.textContent = 'Saved.';
      $c('pl-editor').style.display = 'none';
      await plLoad(); loadLibraries();
    } catch(e){ msg.textContent = 'Save failed: ' + (e.message.indexOf('409') >= 0 ? 'you already have a ' + KIND_LABEL[plKind] + ' with that name.' : e.message); }
    btn.disabled = false;
  }
  async function plSave(){
    if (W4_KINDS[plKind]) return w4Save();
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
  /* ============================ end PM-986 Wave 4 ============================ */

