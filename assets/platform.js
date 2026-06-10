// VYVE CC — Platform & UX page (PM-591)
(function(){
  'use strict';
  var SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
  var EF_URL  = SB_URL + '/functions/v1/cc-platform';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ return n==null?'—':Number(n).toLocaleString(); }
  function relTime(ts){
    if(!ts) return '—';
    var d=Date.now()-new Date(ts).getTime();
    if(d<60000) return 'just now';
    if(d<3600000) return Math.floor(d/60000)+'m ago';
    if(d<86400000) return Math.floor(d/3600000)+'h ago';
    return Math.floor(d/86400000)+'d ago';
  }

  async function pltGetJwt(){
    try{ var r=localStorage.getItem('vyve-cc-supabase-auth'); if(r){var p=JSON.parse(r);var at=p&&(p.access_token||(p.data&&p.data.session&&p.data.session.access_token)||(p.session&&p.session.access_token));if(at)return at;} }catch(_){}
    if(window.VYVE_SUPABASE){try{var d=await window.VYVE_SUPABASE.client().auth.getSession();if(d&&d.data&&d.data.session&&d.data.session.access_token)return d.data.session.access_token;}catch(_){}}
    return null;
  }

  var _tt; function pltToast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},3200);}
  function pltStatus(m){var e=$('plt-refresh-text');if(e)e.textContent=m;}

  window.pltToggleTheme=function(){
    var cur=document.documentElement.getAttribute('data-theme')||'dark',next=cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('vyve-cc-theme',next);}catch(_){}
  };
  function pltApplyTheme(){
    try{var t=localStorage.getItem('vyve-cc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(_){}
  }

  // ── LCP colour helper (Web Vitals thresholds) ─────────────────────────────
  function lcpCls(ms){ if(ms<=0)return ''; if(ms<2500)return 'pill-ok'; if(ms<4000)return 'pill-warn'; return 'pill-danger'; }
  function fcpCls(ms){ if(ms<=0)return ''; if(ms<1800)return 'pill-ok'; if(ms<3000)return 'pill-warn'; return 'pill-danger'; }
  function ttfbCls(ms){ if(ms<=0)return ''; if(ms<800)return 'pill-ok'; if(ms<1800)return 'pill-warn'; return 'pill-danger'; }
  function msCell(ms, cls){ if(!ms||ms<=0) return '<td class="num">—</td>'; return '<td class="num"><span class="pill '+cls+'">'+(ms)+'</span></td>'; }

  // ── Render headline ────────────────────────────────────────────────────────
  function pltRenderHeadline(h){
    if(!h) return;
    var ev=$('h-views'), eu=$('h-users'), ee=$('h-errors'), esub=$('h-errors-sub'),
        el=$('h-lcp'), ep=$('h-pages'), ed=$('h-dead'), edsub=$('h-dead-sub');
    if(ev) ev.textContent=fmt(h.total_views);
    if(eu) eu.textContent=fmt(h.unique_sessions);
    if(ee){
      ee.textContent=fmt(h.error_count);
      ee.className='stat-value'+(h.error_count>0?' warn':'');
    }
    if(esub) esub.textContent=(h.error_rate_pct||0)+'% of page views';
    if(el){
      el.textContent=h.median_lcp_ms?h.median_lcp_ms+'ms':'—';
      el.className='stat-value'+(!h.median_lcp_ms?'':h.median_lcp_ms<2500?' ok':h.median_lcp_ms<4000?' warn':' danger');
    }
    if(ep) ep.textContent=fmt(h.pages_tracked);
    if(ed) ed.textContent=(h.low_traffic_count||0)+'/'+(h.dead_pages_count||0);
    if(edsub) edsub.textContent='low / untracked (of '+34+' known)';
  }

  // ── Render top pages bar chart + table ─────────────────────────────────────
  function pltRenderPages(pages){
    var body=$('plt-pages-body'); if(!body) return;
    if(!pages||!pages.length){body.innerHTML='<div class="empty-state">No page view data yet</div>';return;}
    var maxV=Math.max.apply(null,pages.map(function(r){return r.views;}));
    var html='';
    // Top 20 as bars
    var top=pages.slice(0,20);
    html+='<div style="margin-bottom:16px">';
    top.forEach(function(r){
      var pct=maxV>0?Math.round(r.views/maxV*100):0;
      var label=r.page||'(empty)';
      html+='<div class="bar-row">'
        +'<div class="bar-label" title="'+esc(label)+'">'+esc(label)+'</div>'
        +'<div class="bar-bg"><div class="bar-fill" style="width:'+pct+'%"><span class="bar-fill-text">'+fmt(r.views)+'</span></div></div>'
        +'<div class="bar-count">'+r.pct+'%</div>'
        +'</div>';
    });
    html+='</div>';
    // Full table below bar chart
    html+='<div class="table-wrap"><table class="data-table"><thead><tr><th>Page</th><th class="num">Views</th><th class="num">Unique users</th><th class="num">% of total</th></tr></thead><tbody>';
    pages.forEach(function(r){
      html+='<tr><td style="font-family:monospace;font-size:11px">'+esc(r.page||'(empty)')+'</td>'
        +'<td class="num">'+fmt(r.views)+'</td>'
        +'<td class="num">'+fmt(r.unique_users)+'</td>'
        +'<td class="num">'+r.pct+'%</td></tr>';
    });
    html+='</tbody></table></div>';
    body.innerHTML=html;
  }

  // ── Render errors table ────────────────────────────────────────────────────
  function pltRenderErrors(errors){
    var body=$('plt-errors-body'); if(!body) return;
    if(!errors||!errors.length){
      body.innerHTML='<tr><td colspan="4"><div class="empty-state">No ef_error events in last 30 days</div></td></tr>';
      return;
    }
    var html='';
    errors.forEach(function(r){
      var cls=r.count>=10?'pill-danger':r.count>=3?'pill-warn':'pill-grey';
      html+='<tr>'
        +'<td style="font-family:monospace;font-size:11px">'+esc(r.ef_name)+'</td>'
        +'<td><span class="pill pill-grey">'+esc(r.status)+'</span></td>'
        +'<td class="num"><span class="pill '+cls+'">'+r.count+'</span></td>'
        +'<td style="font-size:11px;color:var(--text-dim)">'+esc(relTime(r.last_seen))+'</td>'
        +'</tr>';
    });
    body.innerHTML=html;
  }

  // ── Render perf table ──────────────────────────────────────────────────────
  function pltRenderPerf(perf){
    var body=$('plt-perf-body'); if(!body) return;
    if(!perf||!perf.length){
      body.innerHTML='<tr><td colspan="8"><div class="empty-state">No perf_telemetry data in last 30 days</div></td></tr>';
      return;
    }
    var html='';
    perf.forEach(function(r){
      html+='<tr>'
        +'<td style="font-family:monospace;font-size:11px">'+esc(r.page)+'</td>'
        +msCell(r.lcp_p50, lcpCls(r.lcp_p50))
        +msCell(r.lcp_p75, lcpCls(r.lcp_p75))
        +msCell(r.lcp_p95, lcpCls(r.lcp_p95))
        +msCell(r.fcp_p50, fcpCls(r.fcp_p50))
        +msCell(r.ttfb_p50, ttfbCls(r.ttfb_p50))
        +'<td class="num">'+(r.inp_p75||0>0?r.inp_p75+'ms':'—')+'</td>'
        +'<td class="num" style="color:var(--text-dim)">'+r.sample_count+'</td>'
        +'</tr>';
    });
    body.innerHTML=html;
  }

  // ── Render dead/low pages ──────────────────────────────────────────────────
  function pltRenderDead(dead){
    var lb=$('plt-low-body'), db=$('plt-dead-body'); if(!lb||!db) return;
    var low=dead&&dead.low||[], d=dead&&dead.dead||[];
    lb.innerHTML=low.length
      ? low.map(function(p){return '<div class="dead-item">'+esc(p)+'</div>';}).join('')
      : '<div class="empty-state" style="padding:12px">All known pages have &ge;10 views</div>';
    db.innerHTML=d.length
      ? d.map(function(p){return '<div class="dead-item really-dead">'+esc(p)+'</div>';}).join('')
      : '<div class="empty-state" style="padding:12px">All known pages recorded</div>';
  }

  // ── Render all ─────────────────────────────────────────────────────────────
  function pltRenderAll(row){
    if(!row) return;
    pltRenderHeadline(row.headline_json);
    pltRenderPages(row.pages_json);
    pltRenderErrors(row.errors_json);
    pltRenderPerf(row.perf_json);
    pltRenderDead(row.dead_json);
    pltStatus('Updated '+relTime(row.refreshed_at));
    var s=$('plt-sub');
    if(s&&row.refreshed_at) s.textContent='Last refreshed '+new Date(row.refreshed_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  }

  function pltShowEmpty(){
    var els=['plt-pages-body','plt-errors-body','plt-perf-body','plt-low-body','plt-dead-body'];
    els.forEach(function(id){
      var e=$(id);
      if(e) e.innerHTML='<div class="empty-state">Cache not yet built — click Refresh</div>';
    });
  }

  async function pltLoad(){
    pltApplyTheme(); pltStatus('Loading…');
    try{
      var jwt=await pltGetJwt();
      var url=new URL(SB_URL+'/rest/v1/cc_platform');
      url.searchParams.set('select','*'); url.searchParams.set('id','eq.1');
      var res=await fetch(url.toString(),{headers:{'apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON),'Accept':'application/json'}});
      var rows=await res.json();
      var row=rows&&rows[0];
      if(!row||!row.refreshed_at){pltStatus('Cache empty — click Refresh');pltShowEmpty();return;}
      pltRenderAll(row);
    }catch(e){pltStatus('Load failed');console.error('Platform load:',e);}
  }

  window.pltRefresh=async function(){
    var btn=$('plt-btn-refresh');if(btn)btn.disabled=true;
    pltStatus('Refreshing (PostHog + perf data, ~10s)…');
    try{
      var jwt=await pltGetJwt();
      var res=await fetch(EF_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON)},body:JSON.stringify({action:'refresh'})});
      var data=await res.json();
      if(data.ok){pltToast('Refreshed');await pltLoad();}
      else pltToast('Refresh failed: '+(data.error||'unknown'));
    }catch(e){pltToast('Error: '+e.message);}
    finally{if(btn)btn.disabled=false;}
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',pltLoad);}else{pltLoad();}
})();
