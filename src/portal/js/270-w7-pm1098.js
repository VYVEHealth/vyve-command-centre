  /* ============================ PM-1098 W7 ============================
   * Trainerize W7 part 1 — RECIPES on the coach portal.
   *
   * A recipe is NOT a new object. It is the existing `coach_templates`
   * kind='meal' row whose payload gains presentation keys:
   *   image_path · method[] · prep_mins · cook_mins · servings · tags[] · shared
   * A row without them is exactly the meal it was before, so all 35 stock
   * programmes, every saved meal and the day-tabbed nutrition plan builder
   * collect byte-identical to W6 — no migration, and the plan builder picks
   * recipes up with zero changes because it already copies meals in by value.
   *
   * `shared:true` is the ONLY thing that puts a meal in a client's Recipes
   * tab (my_recipes RPC). Off = plan-only, which is what every pre-W7 row is.
   *
   * Shadows w4MealOpen. Hooks w4Save's meal branch through w7MealPayload and
   * w4PaintList's meal meta through w7MealChip — both guarded by typeof, so a
   * parse failure in this zone degrades to the W6 behaviour instead of
   * breaking the editor.
   * ==================================================================== */

  var W7_TAGS = ['High protein', 'Batch cook', 'Vegetarian', 'Under 30 min', 'Low carb', 'Breakfast', 'Post-workout'];
  var w7Meal = null;   // { image_path, method[], prep_mins, cook_mins, servings, tags[], shared }

  function w7PhotoUrl(p){ return p ? (SUPA_URL + '/storage/v1/object/public/recipe-photos/' + p) : ''; }
  function w7IsRecipe(p){
    if (!p) return false;
    return !!(p.image_path || (Array.isArray(p.method) && p.method.length) || p.prep_mins || p.cook_mins || (p.servings && +p.servings > 1) || p.shared);
  }
  function w7MealChip(p){
    return w7IsRecipe(p)
      ? '<span class="w3-chip pri" style="margin-right:6px;">Recipe' + (p && p.shared ? '' : ' \u00b7 not shared') + '</span>'
      : '<span class="w3-chip" style="margin-right:6px;">Quick meal</span>';
  }

  /* Called from w4Save's meal branch — merges presentation onto {items, note}. */
  function w7MealPayload(payload){
    if (!w7Meal || !payload) return payload;
    w7ReadFields();
    var s = Math.min(50, Math.max(1, Math.round(w4n(w7Meal.servings) || 1)));
    payload.servings = s;
    if (w7Meal.image_path) payload.image_path = w7Meal.image_path;
    if (w7Meal.method && w7Meal.method.length) payload.method = w7Meal.method;
    if (w7Meal.tags && w7Meal.tags.length) payload.tags = w7Meal.tags;
    if (w7Meal.prep_mins !== '' && w7Meal.prep_mins != null) payload.prep_mins = Math.round(w4n(w7Meal.prep_mins));
    if (w7Meal.cook_mins !== '' && w7Meal.cook_mins != null) payload.cook_mins = Math.round(w4n(w7Meal.cook_mins));
    if (w7Meal.shared) payload.shared = true;
    return payload;
  }

  function w7ReadFields(){
    if (!w7Meal) return;
    var g = function(id){ var el = $c(id); return el ? el.value : ''; };
    w7Meal.servings  = g('w7-servings') || 1;
    w7Meal.prep_mins = g('w7-prep');
    w7Meal.cook_mins = g('w7-cook');
    w7Meal.method = String(g('w7-method') || '').split('\n').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 40);
    var sw = $c('w7-shared');
    if (sw) w7Meal.shared = sw.getAttribute('data-on') === '1';
  }

  function w7RenderPhoto(){
    var el = $c('w7-photo');
    if (!el) return;
    if (w7Meal.image_path){
      el.style.backgroundImage = 'url(' + w7PhotoUrl(w7Meal.image_path) + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.innerHTML = '<button class="btn" id="w7-photo-x" type="button" style="font-size:11px;background:rgba(0,0,0,.55);color:#fff;border-color:transparent;">Remove</button>';
      $c('w7-photo-x').addEventListener('click', function(e){ e.stopPropagation(); w7Meal.image_path = null; w7RenderPhoto(); });
    } else {
      el.style.backgroundImage = '';
      el.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">Upload or drop an image</span>';
    }
  }

  function w7RenderTags(){
    var host = $c('w7-tags');
    if (!host) return;
    host.innerHTML = W7_TAGS.map(function(t){
      var on = w7Meal.tags.indexOf(t) >= 0;
      return '<button class="btn w7-tag' + (on ? ' btn-primary' : '') + '" type="button" data-w7t="' + esc(t) + '" style="font-size:11.5px;">' + esc(t) + '</button>';
    }).join(' ');
    host.querySelectorAll('[data-w7t]').forEach(function(b){
      b.addEventListener('click', function(){
        var t = this.getAttribute('data-w7t');
        var ix = w7Meal.tags.indexOf(t);
        if (ix >= 0) w7Meal.tags.splice(ix, 1); else w7Meal.tags.push(t);
        w7RenderTags();
      });
    });
  }

  function w7RenderShared(){
    var b = $c('w7-shared');
    if (!b) return;
    var on = !!w7Meal.shared;
    b.setAttribute('data-on', on ? '1' : '0');
    b.className = 'btn' + (on ? ' btn-primary' : '');
    b.textContent = on ? 'Shared with your clients' : 'Not shared \u2014 plan only';
  }

  async function w7UploadPhoto(file){
    if (!file) return;
    if (!partnerId){ $c('w7-photo-msg').textContent = 'VYVE-scope photo upload needs a partner scope.'; return; }
    if (file.size > 8 * 1024 * 1024){ $c('w7-photo-msg').textContent = 'That image is over 8MB.'; return; }
    var ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    var path = 'p-' + partnerId + '/' + (Date.now().toString(36)) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    $c('w7-photo-msg').textContent = 'Uploading\u2026';
    try {
      var up = await sb().storage.from('recipe-photos').upload(path, file, { upsert: true, contentType: file.type });
      if (up && up.error) throw up.error;
      w7Meal.image_path = path;
      $c('w7-photo-msg').textContent = '';
      w7RenderPhoto();
    } catch(e){ $c('w7-photo-msg').textContent = 'Upload failed: ' + (e.message || e); }
  }

  /* Shadows the PM-986 Wave 4 meal editor: same meal card, plus presentation. */
  function w4MealOpen(b, item){
    var p = (item && item.payload) || {};
    w4MealState = { note: p.note || '', items: deepCopy(p.items || []) };
    w7Meal = {
      image_path: p.image_path || null,
      method: Array.isArray(p.method) ? p.method.slice() : [],
      prep_mins: p.prep_mins != null ? p.prep_mins : '',
      cook_mins: p.cook_mins != null ? p.cook_mins : '',
      servings: p.servings != null ? p.servings : 1,
      tags: Array.isArray(p.tags) ? p.tags.slice() : [],
      shared: !!p.shared
    };

    b.innerHTML =
      '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">A reusable meal. Drop it into any nutrition plan \u2014 each plan keeps its own copy, so editing here never changes what\u2019s already assigned. Add a photo, a method and a serving count and it also becomes a <b>recipe</b> your clients can see and log.</p>' +
      '<div class="w7-cols" style="display:grid;grid-template-columns:minmax(320px,1fr) minmax(280px,380px);gap:18px;align-items:start;">' +
        '<div id="w7-mealcol"><div id="w4-mealhost"></div></div>' +
        '<div class="w4-mealcard" style="padding:14px;">' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">Shown to clients</div>' +
          '<div class="field" style="margin:0 0 4px;"><label>Photo</label></div>' +
          '<div id="w7-photo" style="height:92px;border:1.5px dashed var(--border);border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;"></div>' +
          '<div id="w7-photo-msg" style="font-size:11px;color:var(--text-muted);margin:5px 0 12px;min-height:14px;"></div>' +
          '<input type="file" id="w7-photo-input" accept="image/jpeg,image/png,image/webp" style="display:none;"/>' +
          '<div class="field-row">' +
            '<div class="field"><label>Servings</label><input id="w7-servings" type="number" min="1" max="50" step="1" value="' + esc(w7Meal.servings) + '"/></div>' +
            '<div class="field"><label>Prep (min)</label><input id="w7-prep" type="number" min="0" step="1" value="' + esc(w7Meal.prep_mins) + '"/></div>' +
          '</div>' +
          '<div class="field-row"><div class="field"><label>Cook (min)</label><input id="w7-cook" type="number" min="0" step="1" value="' + esc(w7Meal.cook_mins) + '"/></div><div class="field"></div></div>' +
          '<div class="field"><label>Method \u2014 one step per line</label><textarea id="w7-method" rows="5" style="width:100%;resize:vertical;">' + esc(w7Meal.method.join('\n')) + '</textarea></div>' +
          '<div class="field" style="margin-bottom:6px;"><label>Tags</label></div>' +
          '<div id="w7-tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>' +
          '<button class="btn" id="w7-shared" type="button" style="width:100%;font-size:12px;"></button>' +
          '<p style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">Off keeps it plan-only: it still works inside a nutrition plan, it just won\u2019t appear in your clients\u2019 Recipes tab.</p>' +
        '</div>' +
      '</div>';

    $c('w4-mealhost').appendChild(w4MealCard(w4MealState, null, null));
    w7RenderPhoto(); w7RenderTags(); w7RenderShared();

    $c('w7-photo').addEventListener('click', function(){ $c('w7-photo-input').click(); });
    $c('w7-photo-input').addEventListener('change', function(){ var f = this.files && this.files[0]; this.value = ''; w7UploadPhoto(f); });
    $c('w7-shared').addEventListener('click', function(){ w7Meal.shared = !w7Meal.shared; w7RenderShared(); });
  }


  /* PM-1100 W7: presentation must survive the assignment boundary.
     A plan day copies meals BY VALUE (that is the design — editing the library
     never rewrites an assigned plan), so the copy has to carry the recipe keys
     or the member gets a bare ingredient list. `recipe_ref` is provenance only;
     nothing reads back through it, so a deleted template cannot break a plan. */
  function w7PlanMealFrom(t){
    var p = t.payload || {};
    var m = { name: t.name, note: p.note || '', items: p.items || [] };
    if (w7IsRecipe(p)){
      m.recipe_ref = t.id;
      if (p.image_path) m.image_path = p.image_path;
      if (Array.isArray(p.method) && p.method.length) m.method = p.method.slice();
      if (Array.isArray(p.tags) && p.tags.length) m.tags = p.tags.slice();
      if (p.servings != null) m.servings = p.servings;
      if (p.prep_mins != null) m.prep_mins = p.prep_mins;
      if (p.cook_mins != null) m.cook_mins = p.cook_mins;
    }
    return m;
  }
  function w7PlanMealKeep(src, out){
    if (!src || !out) return out;
    ['recipe_ref','image_path','servings','prep_mins','cook_mins'].forEach(function(k){
      if (src[k] != null && src[k] !== '') out[k] = src[k];
    });
    ['method','tags'].forEach(function(k){
      if (Array.isArray(src[k]) && src[k].length) out[k] = src[k].slice();
    });
    return out;
  }

  /* ============================ end PM-1098 W7 ============================ */
