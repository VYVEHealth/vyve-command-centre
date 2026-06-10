// VYVE CC — AI Usage page (PM-594)
(function(){
  'use strict';
  var SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
  var EF_URL  = SB_URL + '/functions/v1/cc-ai';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ return n==null?'—':Number(n).toLocaleString(); }
  function relTime(ts){ if(!ts)return '—'; var d=Date.now()-new Date(ts).getTime(); if(d<60000)return 'just now'; if(d<3600000)return Math.floor(d/60000)+'m ago'; if(d<86400000)return Math.floor(d/3600000)+'h ago'; return Math.floor(d/86400000)+'d ago'; }
  function fmtDate(s){ if(!s)return '—'; try{return new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){return s;} }
  var TRIGGER_LABELS = {onboarding:'Onboarding',weekly_checkin:'Weekly check-in',re_engagement:'Re-engagement',running_plan:'Running plan'};

  async function aiGetJwt(){
    try{var r=localStorage.getItem('vyve-cc-supabase-auth');if(r){var p=JSON.parse(r);var at=p&&(p.access_token||(p.data&&p.data.session&&p.data.session.access_token)||(p.session&&p.session.access_token));if(at)return at;}}catch(_){}
    if(window.VYVE_SUPABASE){try{var d=await window.VYVE_SUPABASE.client().auth.getSession();if(d&&d.data&&d.data.session&&d.data.session.access_token)return d.data.session.access_token;}catch(_){}}
    return null;
  }
  var _tt;function aiToast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},3200);}
  function aiStatus(m){var e=$('ai-refresh-text');if(e)e.textContent=m;}
  window.aiToggleTheme=function(){var cur=document.documentElement.getAttribute('data-theme')||'dark',next=cur==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('vyve-cc-theme',next);}catch(_){}};
  function aiApplyTheme(){try{var t=localStorage.getItem('vyve-cc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(_){}}

  function aiRenderHeadline(h, haven){
    if(!h)return;
    function el(id,v){var e=$(id);if(e)e.textContent=v;}
    el('h-total',fmt(h.total));
    el('h-members',fmt(h.unique_members));
    var hv=$('h-haven');if(hv){hv.textContent=fmt(h.haven_count);hv.className='stat-value'+(h.haven_count>0?' danger':'');}
    el('h-acted',(h.acted_on_rate||0)+'%');
    el('h-acted-sub','acted_on flag = all 0 (not tracked yet)');
    el('h-trigger',TRIGGER_LABELS[h.top_trigger]||h.top_trigger||'—');
    // HAVEN alert
    var alert=$('ai-haven-alert');
    if(alert){alert.style.display=h.haven_count>0?'flex':'none';}
    if(h.haven_count>0){
      var txt=$('ai-haven-alert-text');
      if(txt)txt.innerHTML='<strong>'+h.haven_count+' interactions</strong> across <strong>'+(haven&&haven.unique_members||'?')+' real members</strong> have received HAVEN persona responses in production. Phil Hurwood (Clinical Lead) has not yet signed off on HAVEN for live use. This includes onboarding and re-engagement email contexts. Review and coordinate with Phil before the Sage demo.';
    }
  }

  function aiRenderBars(containerId, rows, labelKey, countKey){
    var el=$(containerId);if(!el)return;
    if(!rows||!rows.length){el.innerHTML='<div style="padding:12px;color:var(--text-dim);font-size:12px">No data</div>';return;}
    var maxC=Math.max(1,Math.max.apply(null,rows.map(function(r){return r[countKey]||0;})));
    var html='';
    rows.forEach(function(r){
      var lbl=TRIGGER_LABELS[r[labelKey]]||r[labelKey]||'(unknown)';
      var pctW=maxC>0?Math.round((r[countKey]||0)/maxC*100):0;
      var isPers=labelKey==='persona';
      var pillCls=isPers?('persona-badge persona-'+esc(r[labelKey])):'';
      html+='<div class="bar-row">'
        +'<div class="bar-label" title="'+esc(lbl)+'">'+( isPers?'<span class="'+pillCls+'">'+esc(lbl)+'</span>' : esc(lbl))+'</div>'
        +'<div class="bar-bg"><div class="bar-fill" style="width:'+pctW+'%"><span class="bar-fill-text">'+fmt(r[countKey])+'</span></div></div>'
        +'<div class="bar-count">'+r.pct+'%</div>'
        +'</div>';
    });
    el.innerHTML=html;
  }

  function aiRenderTrend(rows){
    var el=$('ai-trend-chart');if(!el)return;
    if(!rows||!rows.length){el.textContent='—';return;}
    var maxC=Math.max(1,Math.max.apply(null,rows.map(function(r){return r.count||0;})));
    var bars='<div class="trend-mini">';
    rows.forEach(function(r,i){
      var h=Math.max(2,Math.round((r.count||0)/maxC*44));
      var cls=i===rows.length-1?'trend-mini-bar current':'trend-mini-bar';
      bars+='<div class="'+cls+'" style="height:'+h+'px" title="'+esc(r.label)+': '+r.count+' interactions"></div>';
    });
    bars+='</div><div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Last 12 weeks · gold = this week</div>';
    el.innerHTML=bars;
  }

  function aiRenderHaven(haven){
    var body=$('ai-haven-body');if(!body)return;
    var rows=haven&&haven.interactions||[];
    if(!rows.length){body.innerHTML='<tr><td colspan="7"><div style="padding:16px;text-align:center;color:var(--text-dim);font-size:12px">No HAVEN interactions</div></td></tr>';return;}
    var html='';
    rows.forEach(function(r){
      var name=esc((r.first_name+' '+r.last_name).trim()||r.member_email);
      var method=r.decision_method==='hard_rule_haven'?'<span class="pill pill-warn">Hard rule</span>':'<span class="pill pill-danger">'+esc(r.decision_method)+'</span>';
      html+='<tr>'
        +'<td><div style="font-weight:500">'+name+'</div><div style="font-size:10px;color:var(--text-dim)">'+esc(r.member_email)+'</div></td>'
        +'<td><span class="pill pill-grey">'+esc(TRIGGER_LABELS[r.triggered_by]||r.triggered_by)+'</span></td>'
        +'<td style="font-size:11px;color:var(--text-dim)">'+esc(fmtDate(r.created_at))+'</td>'
        +'<td>'+method+'</td>'
        +'<td class="num" style="color:'+(r.stress<=4?'var(--danger)':'var(--text-dim)')+'">'+esc(r.stress||'—')+'</td>'
        +'<td class="num" style="color:'+(r.wellbeing<=4?'var(--danger)':'var(--text-dim)')+'">'+esc(r.wellbeing||'—')+'</td>'
        +'<td class="num" style="color:'+(r.energy<=4?'var(--danger)':'var(--text-dim)')+'">'+esc(r.energy||'—')+'</td>'
        +'</tr>';
    });
    body.innerHTML=html;
  }

  function aiRenderAll(row){
    if(!row)return;
    var u=row.usage_json,h=row.haven_json;
    aiRenderHeadline(row.headline_json,h);
    aiRenderBars('ai-trigger-body',(u&&u.trigger_breakdown)||[],'trigger','count');
    aiRenderBars('ai-persona-body',(u&&u.persona_breakdown)||[],'persona','count');
    aiRenderTrend(row.trend_json);
    aiRenderHaven(h);
    aiStatus('Updated '+relTime(row.refreshed_at));
    var s=$('ai-sub');if(s&&row.refreshed_at)s.textContent='Last refreshed '+new Date(row.refreshed_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  }

  async function aiLoad(){
    aiApplyTheme();aiStatus('Loading…');
    try{
      var jwt=await aiGetJwt();
      var url=new URL(SB_URL+'/rest/v1/cc_ai');url.searchParams.set('select','*');url.searchParams.set('id','eq.1');
      var res=await fetch(url.toString(),{headers:{'apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON),'Accept':'application/json'}});
      var rows=await res.json();var row=rows&&rows[0];
      if(!row||!row.refreshed_at){aiStatus('Cache empty — click Refresh');return;}
      aiRenderAll(row);
    }catch(e){aiStatus('Load failed');console.error('AI load:',e);}
  }

  window.aiRefresh=async function(){
    var btn=$('ai-btn-refresh');if(btn)btn.disabled=true;aiStatus('Refreshing…');
    try{
      var jwt=await aiGetJwt();
      var res=await fetch(EF_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_ANON,'Authorization':'Bearer '+(jwt||SB_ANON)},body:JSON.stringify({})});
      var data=await res.json();if(data.ok){aiToast('Refreshed');await aiLoad();}else aiToast('Failed: '+(data.error||'unknown'));
    }catch(e){aiToast('Error: '+e.message);}finally{if(btn)btn.disabled=false;}
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',aiLoad);}else{aiLoad();}
})();
