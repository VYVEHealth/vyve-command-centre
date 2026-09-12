  /* ═══════════════════════════════════════════════════════════════════════
     PM-985 WAVE 3 — workout depth (gap-map #19-23, #25-31; #24 circuits
     PARKED by Dean product call — do not build here).
     Shadow rules as Waves 1-2: everything below redeclares over earlier
     versions by same-scope function declaration. exLoad/exRender/exOpen/
     exSave are now v3; addDayRow/renderDayEditor/collectDay v2; plLoad v5.
     All new DOM (cards CSS, quick-view, preview, assign picker, editor
     extras) is created at runtime — zero edits above this line.
     Data spine: coach_exercises.muscle_volumes jsonb (primary=1,
     secondary=0.5, enriched PM-985), exercise_type reps|duration,
     default_sets/reps/rest/duration, alternatives uuid[], image_url.
     ═══════════════════════════════════════════════════════════════════════ */

