  /* ── PM-1217 Calum review r1 (2026-09-12): plans page title per kind, no
     self-linking single chip on the Programmes / Weekly workouts / Day
     templates deep links, date fields open their picker on click. ── */
  var PL_TITLES = { onboarding:'Questionnaires', checkin:'Check-in forms', lead:'Lead forms', habits:'Habit plans', workout:'Weekly workouts', workout_day:'Day templates', program:'Programmes', nutrition:'Nutrition plans', meal:'Meals', food:'Foods', supplements:'Supplement plans' };
  function plTitleSync(){
    var t = $c('pl-title'), row = $c('pl-kinds');
    if (!t || !row) return;
    var vis = Array.prototype.filter.call(row.querySelectorAll('.pl-kind'), function(b){ return b.style.display !== 'none'; });
    t.textContent = PL_TITLES[plKind] || 'My plans & forms';
    /* one visible chip = the page you are already on; hide the row */
    row.style.display = vis.length <= 1 ? 'none' : '';
  }
  document.addEventListener('click', function(ev){
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('.pl-kind')) setTimeout(plTitleSync, 0);
    else if (t.closest('.cp-item,.cp-subitem,.cp-ghead')) setTimeout(plTitleSync, 40);
    var i = t.tagName === 'INPUT' ? t : null;
    if (i && i.type === 'date' && !i.disabled && !i.readOnly && typeof i.showPicker === 'function'){
      try { i.showPicker(); } catch(_){ /* not from a user gesture, or unsupported */ }
    }
  }, true);
  window.addEventListener('hashchange', function(){ setTimeout(plTitleSync, 40); });
  setTimeout(plTitleSync, 600);
