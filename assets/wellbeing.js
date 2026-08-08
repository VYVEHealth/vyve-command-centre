// VYVE CC — Wellbeing page (PM-590)
(function(){
  'use strict';
  var SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
  var EF_URL  = SB_URL + '/functions/v1/cc-wellbeing';

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

  async function wbGetJwt(){
    try{ var r=localStorage.getItem('vyve-cc-supabase-auth'); if(r){var p=JSON.parse(r);var at=p&&(p.access_token||(p.data&&p.data.session&&p.data.session.access_token)||(p.session&&p.session.access_token));if(at)return at;} }catch(_){}
    if(window.VYVE_SUPABASE){try{var d=await window.VYVE_SUPABASE.getClient().auth.getSession();if(d&&d.data&&d.data.session&&d.data.session.access_token)return d.data.session.access_token;}catch(_){}}
    return null;
  }

  var _tt; function wbToast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},3200);}
  function wbStatus(m){var e=$('wb-refresh-text');if(e)e.textContent=m;}

  window.wbToggleTheme=function(){
    var cur=document.documentElement.getAttribute('data-theme')||'dark',next=cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    var d=$('wb-theme-dark'),l=$('wb-theme-light');
    if(d)d.style.display=next==='dark'?'':'none';if(l)l.style.display=next==='light'?'':'none';
    localStorage.setItem('vyve_cc_theme',next);
  };
  function wbApplyTheme(){
    var t=localStorage.getItem('vyve_cc_theme')||'dark';
    document.documentElement.setAttribute('data-theme',t);
    var d=$('wb-theme-dark'),l=$('wb-theme-light');
    if(d)d.style.display=t==='dark'?'':'none';if(l)l.style.display=t==='light'?'':'none';
  }

  function scoreColor(s){
    if(s<=3) return 'var(--danger)';
    if(s<=5) return 'var(--warning)';
    if(s<=7) return 'var(--gold)';
    return 'var(--success)';
  }

  // ── Headline ─────────────────────────────────────────────────────────────────
  function wbRenderHeadline(h){
    if(!h) return;
    function el(id,v){var e=$(id);if(e)e.textContent=v;}
    el('wb-avg', h.avg_wellbeing||'—');
    el('wb-checked', fmt(h.members_ever_checked));
    el('wb-checked-pct', (h.participation_pct||'?')+'% of '+h.real_members+' members');
    el('wb-total', fmt(h.total_checkins));
    el('wb-atrisk', fmt(h.at_risk_count));
    el('wb-improving', fmt(h.improving_count));
    el('wb-declining-sub', (h.declining_count||0)+' declining vs baseline');
    el('wb-pct', (h.participation_pct||'?')+'%');
  }

  // ── Trend chart ──────────────────────────────────────────────────────────────
  function wbRenderTrend(rows){
    var el=$('wb-trend-body'); if(!el) return;
    if(!rows||!rows.length){el.innerHTML='<div class="empty-state">No check-in data yet.</div>';return;}
    // Show last 20 weeks max
    var data=rows.slice(-20);
    var bars='',labels='';
    data.forEach(function(r,i){
      var s=parseFloat(r.avg_score)||0;
      var h=Math.round((s/10)*92);
      var col=scoreColor(s);
      var showLabel=data.length<=12||(i%Math.ceil(data.length/12)===0)||i===data.length-1;
      bars+='<div class="trend-bar-wrap" title="W'+r.iso_week+' '+r.week_date+': avg '+r.avg_score+' ('+r.submissions+' submissions)">' +
        '<div class="trend-bar" style="height:'+h+'px;background:'+col+';position:relative">' +
          (data.length<=16?'<span class="trend-bar-val">'+r.avg_score+'</span>':'') +
        '</div>' +
      '</div>';
      labels+='<div class="trend-sub">'+(showLabel?r.week_label||('W'+r.iso_week):'')+'</div>';
    });
    el.innerHTML='<div class="trend-wrap">'+bars+'</div>' +
      '<div class="trend-axis">'+labels+'</div>' +
      '<div style="margin-top:6px;font-size:10px;color:var(--text-dim)">'+data.length+' weeks · hover bar for detail · green ≥8 · amber 6–7 · yellow 4–5 · red ≤3</div>';
  }

  // ── Members table ─────────────────────────────────────────────────────────────
  function wbRenderMembers(rows){
    var el=$('wb-members-body'); if(!el) return;
    if(!rows||!rows.length){el.innerHTML='<tr><td colspan="9"><div class="empty-state">No member data.</div></td></tr>';return;}
    var html='';
    rows.forEach(function(r){
      var delta=r.delta;
      var deltaStr=delta==null?'—':(delta>0?'+'+delta:delta);
      var deltaColor=delta==null?'':delta>0?'color:var(--success)':delta<0?'color:var(--danger)':'color:var(--text-dim)';
      var trendIcon=r.trend==='up'?'<span class="trend-up">↑</span>':r.trend==='down'?'<span class="trend-dn">↓</span>':'<span class="trend-fl">—</span>';
      var statusPill=r.status==='at_risk'?'<span class="pill pill-danger">At risk</span>':
        r.status==='low'?'<span class="pill pill-warn">Low</span>':
        r.status==='moderate'?'<span class="pill" style="background:rgba(201,168,76,.12);color:var(--gold)">Moderate</span>':
        '<span class="pill pill-ok">Good</span>';
      var name=esc((r.first_name+' '+r.last_name).trim()||r.email);
      html+='<tr>'+
        '<td>'+name+'</td>'+
        '<td><span class="persona-badge persona-'+esc(r.persona)+'">'+esc(r.persona||'—')+'</span></td>'+
        '<td class="num">'+(r.baseline_wellbeing||'—')+'</td>'+
        '<td class="num" style="color:'+scoreColor(r.latest_score)+'">'+fmt(r.latest_score)+'</td>'+
        '<td class="num" style="'+deltaColor+'">'+esc(deltaStr)+'</td>'+
        '<td>'+trendIcon+'</td>'+
        '<td>'+statusPill+'</td>'+
        '<td class="num">'+fmt(r.checkin_count)+'</td>'+
        '<td style="color:var(--text-dim);font-size:11px">'+esc(r.last_checkin||'—')+'</td>'+
      '</tr>';
    });
    el.innerHTML=html;
  }

  // ── Distribution ─────────────────────────────────────────────────────────────
  function wbRenderDist(rows){
    var el=$('wb-dist-body'); if(!el) return;
    if(!rows||!rows.length){el.innerHTML='<div class="empty-state">No data.</div>';return;}
    var maxN=rows.reduce(function(m,r){return Math.max(m,r.count||0);},1);
    var bars='',labels='',counts='';
    rows.forEach(function(r){
      var s=r.score,n=r.count||0;
      var h=Math.max(n?4:2,Math.round((n/maxN)*70));
      var cls=s<=3?'danger':s<=5?'warning':s<=7?'moderate':s<=8?'good':'great';
      bars+='<div class="dist-bar-wrap">'+
        '<div class="dist-count">'+(n||'')+'</div>'+
        '<div class="dist-bar '+cls+'" style="height:'+h+'px" title="Score '+s+': '+n+' members"></div>'+
      '</div>';
      labels+='<div class="dist-label">'+s+'</div>';
    });
    el.innerHTML='<div class="dist-wrap">'+bars+'</div>'+
      '<div style="display:flex;gap:6px;margin-top:2px">'+labels+'</div>'+
      '<div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Latest score per member · red ≤3 · amber 4–5 · yellow 6–7 · green 8–10</div>';
  }

  // ── Baseline dimensions ───────────────────────────────────────────────────────
  function wbRenderBaseline(bl){
    var el=$('wb-baseline-body'); if(!el) return;
    if(!bl||!bl.dimensions){el.innerHTML='<div class="empty-state">No baseline data.</div>';return;}
    var dims=bl.dimensions.filter(function(d){return d.avg!=null&&d.n>0;});
    if(!dims.length){el.innerHTML='<div class="empty-state">No baseline scores recorded.</div>';return;}
    var html='';
    dims.forEach(function(d){
      var avg=parseFloat(d.avg)||0;
      var w=Math.round((avg/10)*100);
      var col=avg<=4?'var(--warning)':avg<=6?'var(--gold)':'var(--teal)';
      html+='<div class="baseline-row">'+
        '<div class="baseline-label">'+esc(d.dim)+'</div>'+
        '<div class="baseline-bar-bg"><div class="baseline-bar-fill" style="width:'+w+'%;background:'+col+'">'+
          (w>20?'<span class="baseline-bar-text">'+d.avg+'</span>':'')+
        '</div></div>'+
        '<div class="baseline-val">'+(w<=20?d.avg:'')+'</div>'+
      '</div>';
    });
    el.innerHTML=html+'<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">'+bl.note+'</div>';
  }

  // ── Render all ───────────────────────────────────────────────────────────────
  function wbRenderAll(row){
    if(!row) return;
    wbRenderHeadline(row.headline_json);
    wbRenderTrend(row.trend_json);
    wbRenderMembers(row.members_json);
    wbRenderDist(row.distribution_json);
    wbRenderBaseline(row.baseline_json);
    wbRenderCorrelation(row.correlation_json || []);
    wbStatus('Updated '+relTime(row.refreshed_at));
    var s=$('wb-sub');
    if(s&&row.refreshed_at) s.textContent='Last refreshed '+new Date(row.refreshed_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  }

  function wbShowEmpty(){
    ['wb-trend-body','wb-dist-body','wb-baseline-body'].forEach(function(id){
      var e=$(id);if(e)e.innerHTML='<div class="empty-state">Cache not yet built — click Refresh</div>';
    });
    var b=$('wb-members-body');
    if(b) b.innerHTML='<tr><td colspan="9"><div class="empty-state">Cache not yet built — click Refresh</div></td></tr>';
  }

  async function wbLoad(){
    wbApplyTheme(); wbStatus('Loading…');
    try{
      var jwt=await wbGetJwt();
      var url=new URL(SB_URL+'/rest/v1/cc_wellbeing');
      url.searchParams.set('select','*'); url.searchParams.set('id','eq.1');
      var res=await fetch(url.toString(),{headers:{'apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON),'Accept':'application/json'}});
      var rows=await res.json();
      var row=rows&&rows[0];
      if(!row||!row.refreshed_at){wbStatus('Cache empty — click Refresh');wbShowEmpty();return;}
      wbRenderAll(row);
    }catch(e){wbStatus('Load failed');console.error('Wellbeing load:',e);}
  }

  window.wbRefresh=async function(){
    var btn=$('wb-btn-refresh');if(btn)btn.disabled=true;
    wbStatus('Refreshing…');
    try{
      var jwt=await wbGetJwt();
      var res=await fetch(EF_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON)},body:JSON.stringify({action:'refresh'})});
      var data=await res.json();
      if(data.ok){wbToast('Refreshed');await wbLoad();}
      else wbToast('Refresh failed: '+(data.error||'unknown'));
    }catch(e){wbToast('Error: '+e.message);}
    finally{if(btn)btn.disabled=false;}
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',wbLoad);}else{wbLoad();}

  // ── Wellbeing × Activity correlation ─────────────────────────────────────────
  function wbRenderCorrelation(rows) {
    var el = $('wb-correlation-body'); if (!el) return;
    if (!rows || !rows.length) { el.innerHTML = '<div class="empty-state">Not enough data yet — members need both check-ins and logged activity. More data will appear as the cohort grows.</div>'; return; }
    // Simple sortable table + scatter hint
    var html = '<p style="font-size:11px;color:var(--text-dim);margin-bottom:12px">Only members with both activity data and at least one check-in are shown. Pearson correlation grows more meaningful above n=20.</p>';
    html += '<div class="table-wrap"><table class="data-table"><thead><tr>'
      + '<th>Member</th><th class="num">Avg wellbeing</th><th class="num">Check-ins</th><th class="num">Total activities</th><th>Trend</th>'
      + '</tr></thead><tbody>';
    // Compute rough correlation direction
    var sorted = rows.slice().sort(function(a,b){return (b.total_acts||0)-(a.total_acts||0);});
    sorted.forEach(function(r) {
      var wbColor = r.avg_wb >= 8 ? 'var(--success)' : r.avg_wb >= 6 ? 'var(--gold)' : r.avg_wb >= 4 ? 'var(--warning)' : 'var(--danger)';
      // Render initials or redacted name (email only for privacy)
      var email = r.member_email || '';
      var disp = email.length > 20 ? email.slice(0,3)+'***'+email.slice(email.indexOf('@')) : email;
      html += '<tr>'
        + '<td style="font-size:11px;color:var(--text-dim)">' + esc(disp) + '</td>'
        + '<td class="num"><span style="font-weight:700;color:' + wbColor + '">' + (r.avg_wb||'—') + '</span></td>'
        + '<td class="num">' + (r.checkins||0) + '</td>'
        + '<td class="num">' + fmt(r.total_acts) + '</td>'
        + '<td>' + actBadge(r.total_acts) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    // Simple correlation note
    if (rows.length >= 3) {
      // Sort by acts, check if wb correlates
      var top3 = sorted.slice(0,3), bot = sorted.slice(-Math.min(3,sorted.length));
      var topAvgWb = top3.reduce(function(s,r){return s+(r.avg_wb||0);},0) / top3.length;
      var botAvgWb = bot.reduce(function(s,r){return s+(r.avg_wb||0);},0) / bot.length;
      var diff = Math.round((topAvgWb - botAvgWb) * 10) / 10;
      html += '<div style="margin-top:10px;padding:10px 14px;background:var(--surface-2);border-radius:8px;font-size:11px;color:var(--text-muted)">';
      if (diff > 0) html += '<strong style="color:var(--success)">Positive signal:</strong> The 3 most active members average wellbeing ' + topAvgWb.toFixed(1) + ' vs ' + botAvgWb.toFixed(1) + ' for the least active — a +' + diff + ' difference. Small sample (n=' + rows.length + '), but directionally consistent with the VYVE hypothesis.';
      else if (diff < 0) html += '<strong style="color:var(--warning)">No positive signal yet:</strong> Most active members don\'t show higher wellbeing scores yet. Sample is small (n=' + rows.length + ') — this may reverse as more members check in.';
      else html += 'No clear correlation direction yet — need more data (n=' + rows.length + ').';
      html += '</div>';
    }
    el.innerHTML = html;
  }
  function actBadge(n) {
    if (n > 200) return '<span class="pill pill-ok">High</span>';
    if (n > 50)  return '<span class="pill" style="background:rgba(201,168,76,.12);color:var(--gold)">Active</span>';
    if (n > 10)  return '<span class="pill pill-grey">Low</span>';
    return '<span class="pill pill-grey">Minimal</span>';
  }
  function fmt(n){ return n==null?'—':Number(n).toLocaleString(); }

})();
