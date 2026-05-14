// =====================================================================
// VYVE Command Centre - CC adapter layer
// Maps hub field names (localStorage shape) <-> Dean's cc_* schema in Supabase.
// 
// IMPORTANT: This is a NON-LIVE adapter. None of the hub pages call into it yet.
// It exists so the migration can be reviewed by Dean before being switched on.
// Settings > Supabase has per-entity feature flags, all OFF by default.
// =====================================================================

(function(){
  'use strict';

  var FLAG_KEY = 'vyve.cc.adapter';

  // ---------- Mapping definitions ----------
  // For each entity: localStorage_key + cc_table + field_map.
  // field_map: { hub_field: cc_field }  (one-way, both directions derived)

  var ENTITIES = {
    tasks: {
      lsKey: 'vyve_tasks',
      ccTable: 'cc_tasks',
      fieldMap: {
        title: 'title',
        owner: 'assignee',
        status: 'stage',
        priority: 'priority',
        due: 'due_date',
        notes: 'notes'
      },
      // Hub fields with no cc destination (would need Dean to add columns):
      missingInCC: ['area', 'pillar', 'completed_at'],
      // cc fields with no hub source:
      ccOnly: ['created_by', 'created_at', 'updated_at']
    },
    deals: {
      // Hub deals are stored alongside clients-in-pipeline in cc_clients.
      // The conceptual overlap is significant; this needs a Dean conversation.
      lsKey: 'vyve_deals',
      ccTable: 'cc_clients',
      fieldMap: {
        name: 'company',
        contact: 'contact',
        contact_email: 'email',
        value: 'value',
        stage: 'stage',
        notes: 'notes'
      },
      missingInCC: ['pillar', 'phone', 'next_step', 'last_contact'],
      ccOnly: ['package', 'nps_score', 'renewal_date']
    },
    clients: {
      lsKey: 'vyve_clients',
      ccTable: 'cc_clients',
      fieldMap: {
        name: 'company',
        contact: 'contact',
        email: 'email',
        phone: 'phone',
        value: 'value',
        stage: 'stage',
        notes: 'notes'
      },
      missingInCC: ['programme'],
      ccOnly: []
    },
    sessions: {
      lsKey: 'vyve_sessions',
      ccTable: 'cc_sessions',
      fieldMap: {
        title: 'title',
        client: 'client',
        date: 'session_date',
        facilitator: 'facilitator',
        notes: 'notes'
      },
      missingInCC: ['pillar', 'time', 'format', 'attendees', 'duration_minutes'],
      ccOnly: ['outcome']
    },
    investors: {
      lsKey: 'vyve_investors',
      ccTable: 'cc_investors',
      fieldMap: {
        name: 'name',
        contact: 'contact',
        contact_email: 'email',
        type: 'type',
        stage: 'stage',
        amount: 'amount',
        next_step: 'next_action',
        notes: 'notes'
      },
      missingInCC: ['round', 'last_contact'],
      ccOnly: []
    },
    finance: {
      lsKey: 'vyve_finance',
      ccTable: 'cc_finance',
      fieldMap: {
        mrr: 'mrr',
        burn: 'burn',
        cash: 'cash',
        date: 'recorded_date',
        notes: 'notes'
      },
      missingInCC: ['arr', 'runway_months', 'payroll'],
      ccOnly: ['target']
    },
    intel: {
      lsKey: 'vyve_intel',
      ccTable: 'cc_intel',
      fieldMap: {
        type: 'type',
        title: 'title',
        body: 'body',
        source: 'source',
        relevance: 'relevance'
      },
      missingInCC: ['url', 'tags', 'pillar'],
      ccOnly: ['imported_at']
    },
    partners: {
      lsKey: 'vyve_partners',
      ccTable: 'cc_partners',
      fieldMap: {
        name: 'name',
        contact: 'contact',
        email: 'email',
        type: 'type',
        stage: 'stage',
        value: 'value',
        notes: 'notes'
      },
      missingInCC: ['phone', 'next_step'],
      ccOnly: []
    },
    content: {
      lsKey: 'vyve_content',
      ccTable: 'cc_posts',
      fieldMap: {
        channel: 'platform',
        body: 'copy',
        pillar: 'pillar',
        status: 'status',
        publish_date: 'scheduled_date'
      },
      missingInCC: ['title', 'owner', 'hook', 'tags', 'due'],
      ccOnly: []
    },
    invoices: {
      lsKey: 'vyve_invoices',
      ccTable: 'cc_invoices',
      fieldMap: {
        client: 'client',
        amount: 'amount',
        due: 'due_date',
        status: 'status',
        notes: 'notes'
      },
      missingInCC: ['invoice_number', 'date_issued', 'date_paid'],
      ccOnly: []
    },
    calendar_events: {
      lsKey: '(none — native to Supabase)',
      ccTable: 'cc_calendar_events',
      fieldMap: {
        title: 'title',
        description: 'description',
        start_at: 'start_at',
        end_at: 'end_at',
        all_day: 'all_day',
        location: 'location',
        meet_url: 'meet_url',
        visibility: 'visibility',
        attendees: 'attendees'
      },
      missingInCC: [],
      ccOnly: ['owner_email', 'source', 'gcal_event_id', 'color'],
      nativeSupabase: true   // entity lives natively in Supabase, no localStorage fallback
    }
  };

  // ---------- Forward map: hub object -> cc row ----------
  function toCcRow(entity, hubObj){
    var def = ENTITIES[entity];
    if (!def) return null;
    var row = {};
    Object.keys(def.fieldMap).forEach(function(hubField){
      var ccField = def.fieldMap[hubField];
      if (hubObj[hubField] !== undefined) row[ccField] = hubObj[hubField];
    });
    return row;
  }

  // ---------- Reverse map: cc row -> hub object ----------
  function fromCcRow(entity, ccRow){
    var def = ENTITIES[entity];
    if (!def) return null;
    var obj = { _id: ccRow.id };
    Object.keys(def.fieldMap).forEach(function(hubField){
      var ccField = def.fieldMap[hubField];
      if (ccRow[ccField] !== undefined) obj[hubField] = ccRow[ccField];
    });
    // Pass through cc-only fields that don't conflict
    if (ccRow.created_at) obj.created_at = ccRow.created_at;
    if (ccRow.updated_at) obj.updated_at = ccRow.updated_at;
    if (ccRow.created_by) obj.created_by = ccRow.created_by;
    return obj;
  }

  // ---------- Feature flags ----------
  // Read/write the per-entity flag toggles.
  function loadFlags(){
    try { var raw = localStorage.getItem(FLAG_KEY); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function saveFlags(flags){
    try { localStorage.setItem(FLAG_KEY, JSON.stringify(flags || {})); return true; }
    catch(e){ return false; }
  }
  function isEnabled(entity){
    var flags = loadFlags();
    return !!flags[entity];
  }
  function setEnabled(entity, on){
    var flags = loadFlags();
    flags[entity] = !!on;
    saveFlags(flags);
  }

  // ---------- Public API ----------
  window.VYVE_CC_ADAPTER = {
    ENTITIES: ENTITIES,
    toCcRow: toCcRow,
    fromCcRow: fromCcRow,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    loadFlags: loadFlags
  };
})();
