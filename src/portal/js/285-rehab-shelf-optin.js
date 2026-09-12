  /* ============================ PM-1208: rehab shelf opt-in (coach) ============================
     A coach never sees the rehab exercise set by default. The Settings checkbox stores
     coach_ui_prefs.rehab_library (coach-owned, own-row PATCH via w0savePrefs); w0loadPrefs calls
     exShelvesFromPrefs() so EX_SHELVES is right before the library is first opened. */
  function exShelvesFromPrefs(){
    var on = !!(w0.prefs && w0.prefs.rehab_library);
    EX_SHELVES = on ? ['strength', 'rehab'] : ['strength'];
    var t = $c('set-rehab-shelf'); if (t) t.checked = on;
  }
  (function(){
    var t = $c('set-rehab-shelf'); if (!t) return;
    t.addEventListener('change', async function(){
      await w0savePrefs({ rehab_library: !!t.checked });
      exShelvesFromPrefs();
      cexLoaded = false;
      if ($c('view-exercises') && $c('view-exercises').style.display !== 'none'){ await exLoad(); exRender(); }
    });
  })();
  /* ============================ end PM-1208 ============================ */
