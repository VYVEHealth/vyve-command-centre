// VYVE CC — Revenue page (PM-592)
(function(){
  'use strict';
  var SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
  var EF_URL  = SB_URL + '/functions/v1/cc-revenue';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ return n==null?'—':Number(n).toLocaleString(); }
  function relTime(ts){ if(!ts)return '—'; var d=Date.now()-new Date(ts).getTime(); if(d<60000)return 'just now'; if(d<3600000)return Math.floor(d/60000)+'m ago'; if(d<86400000)return Math.floor(d/3600000)+'h ago'; return Math.floor(d/86400000)+'d ago'; }
  function fmtDate(s){ if(!s)return '—'; try{return new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){return s;} }

  async function revGetJwt(){
    try{ var r=localStorage.getItem('vyve-cc-supabase-auth'); if(r){var p=JSON.parse(r);var at=p&&(p.access_token||(p.data&&p.data.session&&p.data.session.access_token)||(p.session&&p.session.access_token));if(at)return at;} }catch(_){}
    if(window.VYVE_SUPABASE){try{var d=await window.VYVE_SUPABASE.getClient().auth.getSession();if(d&&d.data&&d.data.session&&d.data.session.access_token)return d.data.session.access_token;}catch(_){}}
    return null;
  }
  var _tt; function revToast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},3200);}
  function revStatus(m){var e=$('rev-refresh-text');if(e)e.textContent=m;}
  window.revToggleTheme=function(){ var cur=document.documentElement.getAttribute('data-theme')||'dark',next=cur==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',next); try{localStorage.setItem('vyve-cc-theme',next);}catch(_){} };
  function revApplyTheme(){ try{var t=localStorage.getItem('vyve-cc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(_){} }

  function revRenderHeadline(h){
    if(!h)return;
    var mrr=$('h-mrr'); if(mrr){ mrr.textContent='£'+(h.mrr||0).toLocaleString(); }
    var note=$('h-mrr-note'); if(note&&h.note_mrr)note.textContent=h.note_mrr;
    function el(id,v){var e=$(id);if(e)e.textContent=v;}
    el('h-paid',fmt(h.paid_members));
    el('h-trial',fmt(h.trial_members));
    el('h-ent',fmt(h.enterprise_members));
    el('h-comp',fmt(h.comp_members));
    el('h-conv',(h.trial_conversion_rate_pct||0)+'%');
  }

  function revRenderBreakdown(rows){
    var b=$('rev-breakdown-body'); if(!b)return;
    if(!rows||!rows.length){b.innerHTML='<tr><td colspan="4"><div class="empty-state">—</div></td></tr>';return;}
    var html=''; var total=rows.reduce(function(s,r){return s+(r.count||0);},0);
    rows.forEach(function(r){
      var typePill = r.type==='Paid B2C'?'pill-ok':r.type==='Enterprise'?'pill-teal':r.type==='Trial'?'pill-gold':r.type==='Expired'?'pill-danger':'pill-grey';
      var pctBar = total>0?Math.round((r.count||0)/total*100):0;
      html+='<tr>'
        +'<td><span class="pill '+typePill+'">'+esc(r.type)+'</span></td>'
        +'<td class="num">'+fmt(r.count)+'</td>'
        +'<td class="num">'+(r.mrr>0?'£'+r.mrr.toLocaleString():'—')+'</td>'
        +'<td style="color:var(--text-dim);font-size:11px">'+esc(r.note)+'</td>'
        +'</tr>';
    });
    b.innerHTML=html;
  }

  function revRenderTrend(rows){
    var chart=$('rev-trend-chart'), tbody=$('rev-trend-body'); if(!chart||!tbody)return;
    if(!rows||!rows.length){chart.textContent='—';return;}
    var maxC=Math.max(1,Math.max.apply(null,rows.map(function(r){return r.count||0;})));
    // mini bar chart
    var bars='<div class="trend-mini">';
    rows.forEach(function(r,i){
      var h=Math.max(2,Math.round((r.count||0)/maxC*44));
      var cls=i===rows.length-1?'trend-mini-bar current':'trend-mini-bar';
      bars+='<div class="'+cls+'" style="height:'+h+'px" title="'+esc(r.label)+': '+r.count+' new members"></div>';
    });
    bars+='</div>';
    chart.innerHTML=bars;
    var html='';
    rows.slice().reverse().slice(0,6).forEach(function(r){
      html+='<tr><td style="color:var(--text-muted)">'+esc(r.label)+'</td><td class="num">'+fmt(r.count)+'</td></tr>';
    });
    tbody.innerHTML=html||'<tr><td colspan="2"><div class="empty-state">No data</div></td></tr>';
  }

  function revRenderPipeline(rows){
    var b=$('rev-pipeline-body'); if(!b)return;
    if(!rows||!rows.length){b.innerHTML='<tr><td colspan="9"><div class="empty-state">No active trial members</div></td></tr>';return;}
    var html='';
    rows.forEach(function(r){
      var engCls=r.engagement==='high'?'eng-high':r.engagement==='medium'?'eng-medium':'eng-low';
      var engPill=r.engagement==='high'?'pill-ok':r.engagement==='medium'?'pill-gold':'pill-danger';
      var name=esc((r.first_name+' '+r.last_name).trim()||r.email);
      var daysLeftStr=r.days_left!=null?(r.days_left<=0?'<span style="color:var(--danger)">Expired</span>':r.days_left+' days'):'—';
      html+='<tr>'
        +'<td><div style="font-weight:500">'+name+'</div><div style="font-size:10px;color:var(--text-dim)">'+esc(r.email)+'</div></td>'
        +'<td style="font-size:11px;color:var(--text-muted)">'+esc(r.company||'—')+'</td>'
        +'<td><span class="pill pill-grey">'+esc(r.persona||'—')+'</span></td>'
        +'<td class="num">'+fmt(r.days_in_trial)+'d</td>'
        +'<td style="font-size:11px;color:var(--text-muted)">'+daysLeftStr+'</td>'
        +'<td class="num">'+fmt(r.total_activities)+'</td>'
        +'<td class="num">'+fmt(r.activities_7d)+'</td>'
        +'<td><span class="pill '+engPill+'"><span class="eng-dot '+engCls+'"></span>'+esc(r.engagement)+'</span></td>'
        +'<td>'+(r.at_risk?'<span class="pill pill-danger">At risk</span>':'<span class="pill pill-ok">Active</span>')+'</td>'
        +'</tr>';
    });
    b.innerHTML=html;
  }

  function revRenderAll(row){
    if(!row)return;
    revRenderHeadline(row.headline_json);
    revRenderBreakdown(row.breakdown_json);
    revRenderTrend(row.trend_json);
    revRenderPipeline(row.pipeline_json);
    revStatus('Updated '+relTime(row.refreshed_at));
    var s=$('rev-sub'); if(s&&row.refreshed_at)s.textContent='Last refreshed '+new Date(row.refreshed_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  }

  async function revLoad(){
    revApplyTheme(); revStatus('Loading…');
    try{
      var jwt=await revGetJwt();
      var url=new URL(SB_URL+'/rest/v1/cc_revenue_cache');
      url.searchParams.set('select','*'); url.searchParams.set('id','eq.1');
      var res=await fetch(url.toString(),{headers:{'apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON),'Accept':'application/json'}});
      var rows=await res.json(); var row=rows&&rows[0];
      if(!row||!row.refreshed_at){revStatus('Cache empty — click Refresh');return;}
      revRenderAll(row);
    }catch(e){revStatus('Load failed');console.error('Revenue load:',e);}
  }

  window.revRefresh=async function(){
    var btn=$('rev-btn-refresh');if(btn)btn.disabled=true;
    revStatus('Refreshing…');
    try{
      var jwt=await revGetJwt();
      var res=await fetch(EF_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON)},body:JSON.stringify({})});
      var data=await res.json();
      if(data.ok){revToast('Refreshed');await revLoad();}
      else revToast('Refresh failed: '+(data.error||'unknown'));
    }catch(e){revToast('Error: '+e.message);}
    finally{if(btn)btn.disabled=false;}
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',revLoad);}else{revLoad();}
})();
