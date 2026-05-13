// =====================================================================
// VYVE Command Centre — Shared Data Registry
// One read API across all pages. Brief and Dashboard use this to pull live data.
// Each accessor is read-only and tolerant of missing/empty data.
// =====================================================================

(function(){
  'use strict';

  function load(key, def){
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return def;
      var parsed = JSON.parse(raw);
      return parsed == null ? def : parsed;
    } catch(e){ return def; }
  }

  function startOfDay(d){ d = new Date(d || Date.now()); d.setHours(0,0,0,0); return d; }
  function endOfDay(d){ d = new Date(d || Date.now()); d.setHours(23,59,59,999); return d; }
  function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function startOfWeek(){
    // Monday as week start (UK convention)
    var d = startOfDay();
    var day = d.getDay(); // 0 Sun, 1 Mon
    var diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
  }
  function endOfWeek(){ return endOfDay(addDays(startOfWeek(), 6)); }
  function startOfMonth(){ var d = startOfDay(); d.setDate(1); return d; }
  function endOfMonth(){ var d = startOfMonth(); d.setMonth(d.getMonth() + 1); return new Date(d.getTime() - 1); }

  function parseDate(s){
    if (!s) return null;
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function fmt(n){ return new Intl.NumberFormat('en-GB').format(n); }
  function fmtGBP(n){ return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n||0); }
  function relTime(d){
    if (!d) return '';
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.round(diff/60) + 'm ago';
    if (diff < 86400) return Math.round(diff/3600) + 'h ago';
    if (diff < 2592000) return Math.round(diff/86400) + 'd ago';
    return Math.round(diff/2592000) + 'mo ago';
  }

  // ===== TASKS =====
  var Tasks = {
    all: function(){ return load('vyve_tasks', []); },
    byStatus: function(status){ return this.all().filter(function(t){ return (t.status||'').toLowerCase() === status.toLowerCase(); }); },
    overdue: function(){
      var today = startOfDay();
      return this.all().filter(function(t){
        if (!t.due) return false;
        if ((t.status||'').toLowerCase() === 'done') return false;
        var d = parseDate(t.due);
        return d && d < today;
      });
    },
    todayOrOverdue: function(){
      var today = startOfDay();
      var end = endOfDay();
      return this.all().filter(function(t){
        if (!t.due) return false;
        if ((t.status||'').toLowerCase() === 'done') return false;
        var d = parseDate(t.due);
        return d && d <= end;
      }).sort(function(a,b){ return parseDate(a.due) - parseDate(b.due); });
    },
    activeCount: function(){
      return this.all().filter(function(t){
        var s = (t.status||'').toLowerCase();
        return s !== 'done' && s !== 'archived';
      }).length;
    }
  };

  // ===== SESSIONS =====
  var Sessions = {
    all: function(){ return load('vyve_sessions', []); },
    todayAndTomorrow: function(){
      var start = startOfDay();
      var end = endOfDay(addDays(start, 1));
      return this.all().filter(function(s){
        var d = parseDate(s.date);
        return d && d >= start && d <= end;
      }).sort(function(a,b){ return parseDate(a.date) - parseDate(b.date); });
    },
    thisWeek: function(){
      var s = startOfWeek(), e = endOfWeek();
      return this.all().filter(function(x){
        var d = parseDate(x.date);
        return d && d >= s && d <= e;
      });
    }
  };

  // ===== DEALS / CRM =====
  var Deals = {
    all: function(){ return load('vyve_deals', []); },
    pipelineValue: function(){
      return this.all().filter(function(d){
        var s = (d.stage||'').toLowerCase();
        return s !== 'closed-won' && s !== 'closed-lost' && s !== 'won' && s !== 'lost';
      }).reduce(function(sum, d){ return sum + (Number(d.value)||0); }, 0);
    },
    closingSoon: function(){
      var end = endOfMonth();
      return this.all().filter(function(d){
        var s = (d.stage||'').toLowerCase();
        if (s === 'closed-won' || s === 'closed-lost' || s === 'won' || s === 'lost') return false;
        var due = parseDate(d.expected_close || d.close_date);
        return due && due <= end;
      }).sort(function(a,b){
        var av = Number(a.value)||0, bv = Number(b.value)||0;
        return bv - av;
      });
    },
    winRate: function(){
      var all = this.all();
      var won = all.filter(function(d){ var s=(d.stage||'').toLowerCase(); return s==='closed-won'||s==='won'; }).length;
      var lost = all.filter(function(d){ var s=(d.stage||'').toLowerCase(); return s==='closed-lost'||s==='lost'; }).length;
      var total = won + lost;
      return total > 0 ? Math.round((won/total) * 100) : null;
    }
  };

  // ===== CLIENTS =====
  var Clients = {
    all: function(){ return load('vyve_clients', []); },
    live: function(){ return this.all().filter(function(c){ return (c.stage||'').toLowerCase() === 'live'; }); },
    countByStage: function(){
      var counts = {};
      this.all().forEach(function(c){
        var s = (c.stage||'unknown').toLowerCase();
        counts[s] = (counts[s]||0) + 1;
      });
      return counts;
    }
  };

  // ===== FINANCE =====
  var Finance = {
    all: function(){ return load('vyve_finance_entries', []); },
    latestSnapshot: function(){
      var entries = this.all();
      if (!entries.length) return null;
      var sorted = entries.slice().sort(function(a,b){
        return (b.month||'').localeCompare(a.month||'');
      });
      return sorted[0];
    },
    mrr: function(){
      var s = this.latestSnapshot();
      return s ? Number(s.mrr)||0 : 0;
    },
    cash: function(){
      var s = this.latestSnapshot();
      return s ? Number(s.cash)||0 : 0;
    },
    burn: function(){
      var s = this.latestSnapshot();
      return s ? Number(s.burn)||0 : 0;
    },
    runwayMonths: function(){
      var burn = this.burn(), cash = this.cash();
      return burn > 0 ? Math.round(cash / burn * 10) / 10 : null;
    }
  };

  // ===== COMPLIANCE =====
  var Compliance = {
    all: function(){ return load('vyve_compliance', []); },
    dueSoon: function(days){
      days = days || 30;
      var now = startOfDay();
      var end = endOfDay(addDays(now, days));
      return this.all().filter(function(c){
        if ((c.status||'').toLowerCase() === 'complete') return false;
        var d = parseDate(c.due);
        return d && d <= end;
      }).sort(function(a,b){ return parseDate(a.due) - parseDate(b.due); });
    }
  };

  // ===== INTEL / COMPETITORS / RESEARCH =====
  var Intel = {
    all: function(){ return load('vyve_intel', []); },
    recent: function(n){ n = n || 5; return this.all().slice().sort(function(a,b){
      return new Date(b.created_at||0) - new Date(a.created_at||0);
    }).slice(0, n); }
  };
  var Competitors = {
    all: function(){ return load('vyve_competitors', []); },
    recent: function(n){ n = n || 5; return this.all().slice().sort(function(a,b){
      return new Date(b.created_at||0) - new Date(a.created_at||0);
    }).slice(0, n); }
  };

  // ===== PERFORMANCE =====
  var Performance = {
    all: function(){ return load('vyve_performance_log', []); },
    last30: function(){
      var cutoff = addDays(startOfDay(), -30);
      return this.all().filter(function(r){
        var d = parseDate(r.date || r.created_at);
        return d && d >= cutoff;
      });
    },
    totalReach: function(window){
      var rows = window === 30 ? this.last30() : this.all();
      return rows.reduce(function(s,r){ return s + (Number(r.reach)||0); }, 0);
    },
    totalEngagement: function(window){
      var rows = window === 30 ? this.last30() : this.all();
      return rows.reduce(function(s,r){ return s + (Number(r.engagements)||0); }, 0);
    },
    latestReachByChannel: function(){
      var byChannel = {};
      this.all().forEach(function(r){
        var c = r.channel || 'unknown';
        var existing = byChannel[c];
        if (!existing || (r.date||'') > (existing.date||'')){
          byChannel[c] = r;
        }
      });
      return byChannel;
    },
    reachGrowth30d: function(channel){
      var rows = this.all().filter(function(r){ return r.channel === channel; }).sort(function(a,b){
        return (a.date||'').localeCompare(b.date||'');
      });
      if (rows.length < 2) return null;
      var first = Number(rows[0].reach) || 0;
      var last = Number(rows[rows.length-1].reach) || 0;
      if (first === 0) return null;
      return Math.round(((last - first) / first) * 1000) / 10; // 1 decimal
    }
  };

  // ===== PODCAST =====
  var Podcast = {
    all: function(){ return load('vyve_podcast_eps', []); },
    published: function(){ return this.all().filter(function(e){ return (e.status||'').toLowerCase() === 'published'; }); },
    inProduction: function(){
      return this.all().filter(function(e){
        var s = (e.status||'').toLowerCase();
        return s === 'recording' || s === 'editing' || s === 'ready';
      });
    },
    totalDownloads: function(){
      return this.all().reduce(function(s,e){ return s + (Number(e.downloads)||0); }, 0);
    }
  };

  // ===== CONTENT =====
  var Content = {
    all: function(){ return load('vyve_content_items', []); },
    inFlight: function(){
      return this.all().filter(function(c){
        var s = (c.status||'').toLowerCase();
        return s !== 'published' && s !== 'archived' && s !== 'killed';
      });
    },
    publishedLast30: function(){
      var cutoff = addDays(startOfDay(), -30);
      return this.all().filter(function(c){
        if ((c.status||'').toLowerCase() !== 'published') return false;
        var d = parseDate(c.published_at || c.updated_at);
        return d && d >= cutoff;
      });
    }
  };

  // ===== UNIFIED ACTIVITY FEED =====
  // Aggregates the most recent N items across pages with a created_at-style field.
  function recentActivity(n){
    n = n || 8;
    var items = [];
    function push(arr, type, titleFn, dateField){
      arr.forEach(function(x){
        var d = parseDate(x[dateField] || x.updated_at || x.created_at);
        if (d) items.push({type:type, title:titleFn(x), date:d, source:x});
      });
    }
    push(Tasks.all(), 'task', function(t){ return t.title || 'Untitled task'; }, 'updated_at');
    push(Deals.all(), 'deal', function(d){ return (d.company || d.title || 'Deal') + ' — ' + (d.stage||''); }, 'updated_at');
    push(Sessions.all(), 'session', function(s){ return s.title || 'Session'; }, 'updated_at');
    push(Content.all(), 'content', function(c){ return c.title || (c.channel + ' post'); }, 'updated_at');
    push(Podcast.all(), 'podcast', function(p){ return p.title || 'Episode'; }, 'updated_at');
    push(Clients.all(), 'client', function(c){ return (c.name || 'Client') + ' — ' + (c.stage||''); }, 'updated_at');
    push(Compliance.all(), 'compliance', function(c){ return c.title || c.area || 'Compliance item'; }, 'updated_at');
    return items.sort(function(a,b){ return b.date - a.date; }).slice(0, n);
  }

  window.VYVE_DATA = {
    tasks: Tasks,
    sessions: Sessions,
    deals: Deals,
    clients: Clients,
    finance: Finance,
    compliance: Compliance,
    intel: Intel,
    competitors: Competitors,
    performance: Performance,
    podcast: Podcast,
    content: Content,
    activity: recentActivity,
    fmt: fmt,
    fmtGBP: fmtGBP,
    relTime: relTime,
    parseDate: parseDate,
    startOfDay: startOfDay,
    startOfWeek: startOfWeek
  };
})();
