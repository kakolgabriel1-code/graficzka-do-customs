(function(){
'use strict';
var C=window.HSCCommon,T=window.HSCI18N,B=window.HSCBackend,P=window.HSCPricing,R=window.HSCPartRules,DATA=window.HSC_DATA||{vehicles:[],parts:[]},vehicles=DATA.vehicles||[];
DATA.parts=DATA.parts||[];
var state={vehicle:null,paint:null,parts:[],partColors:{},services:[],pack:'all',cat:'all'};
var services=[
 {id:'diagnostyka',name:'Diagnostyka pełna',desc:'Skan auta, kontrola podzespołów i raport mechanika.'},
 {id:'kola',name:'Serwis kół / felg',desc:'Kontrola, demontaż i montaż wybranego zestawu.'},
 {id:'zawieszenie',name:'Serwis zawieszenia',desc:'Kontrola i obsługa dostępnych elementów zawieszenia.'},
 {id:'hamulce',name:'Serwis hamulców',desc:'Kontrola hamulców i montaż kompatybilnego zestawu.'},
 {id:'lakiernia',name:'Lakiernia',desc:'Zmiana wariantu lakieru w osobnej strefie lakierniczej.'},
 {id:'detailing',name:'Detailing / przygotowanie',desc:'Końcowa kontrola i przygotowanie auta do wydania.'}
];
var icons={'Bodykit':'◩','Interior':'◫','Wheels / Rims':'◉','Engine upgrades':'⚙','Exterior':'⌁','Suspension':'↕','Brakes':'◍','Tires':'◎','Performance':'◆','Instruments':'◌','Nitrous':'N₂O'};
var colors={white:'#eee',black:'#151515',blue:'#3d73ff',red:'#e84c5a',green:'#44b875',yellow:'#ffd65d',gray:'#8f9098',grey:'#8f9098',silver:'#c7c9d2',orange:'#ff934c',purple:'#a65cff','pearl white':'#f9f5ff',aurora:'#cc75ff',custom:'#c680ff','custom 1':'#cc79ff','custom 2':'#78d5ff',base:'#aaa',eggs:'#f5dda3',police:'#4672ff'};
function q(s,r){return (r||document).querySelector(s)}function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function toast(m){var t=q('#toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2200)}
function modal(html){q('#modal-content').innerHTML=html;q('#modal').classList.remove('hidden')}
function closeModal(){q('#modal').classList.add('hidden')}qa('[data-close-modal]').forEach(function(x){x.onclick=closeModal});
function copy(t){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){toast('Skopiowano.')}).catch(function(){fallback(t)});else fallback(t)}
function fallback(t){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Skopiowano.')}catch(e){toast('Zaznacz tekst ręcznie.')}a.remove()}

function setView(v){qa('.client-view').forEach(function(x){x.classList.add('hidden')});q('#client-'+v).classList.remove('hidden');qa('[data-client-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-client-view')===v)});window.scrollTo(0,0)}
qa('[data-client-view]').forEach(function(b){b.onclick=function(){setView(b.getAttribute('data-client-view'))}});
function renderPriceList(){
 if(!P||!q('#price-list'))return;
 q('#price-list').innerHTML=P.publicTable().map(function(x){
  var val=typeof x[1]==='number'?P.money(x[1]):String(x[1]);
  return '<div class="detail-box"><span>'+C.esc(x[0])+'</span><b>'+C.esc(val)+'</b></div>'
 }).join('')
}
function renderFilters(){var packs=['all','GT Craft','New Cars','BRCC'];q('#pack-filters').innerHTML=packs.map(function(p){return '<button class="filter-chip '+(state.pack===p?'active':'')+'" data-pack="'+p+'">'+(p==='all'?'Wszystkie':p)+'</button>'}).join('');qa('[data-pack]').forEach(function(b){b.onclick=function(){state.pack=b.getAttribute('data-pack');renderFilters();renderVehicles()}})}
function renderVehicles(){var term=q('#vehicle-search').value.trim().toLowerCase();var list=vehicles.filter(function(v){return (state.pack==='all'||v.pack===state.pack)&&(!term||(v.name+' '+v.id+' '+v.category).toLowerCase().indexOf(term)>=0)});q('#vehicle-list').innerHTML=list.map(function(v){return '<button class="vehicle-item '+(state.vehicle&&state.vehicle.id===v.id?'active':'')+'" data-v="'+v.id+'"><b>'+C.esc(v.name)+'</b><small>'+v.id+' • '+C.esc(v.pack)+'</small></button>'}).join('')||'<div class="mini-empty">Brak wyników.</div>';qa('[data-v]').forEach(function(b){b.onclick=function(){selectVehicle(b.getAttribute('data-v'))}})}
function selectVehicle(id){state.vehicle=vehicles.find(function(v){return v.id===id});state.paint=null;state.parts=[];state.partColors={};state.services=[];state.cat='all';renderVehicles();renderConfig();renderSummary()}
function renderConfig(){var v=state.vehicle;if(!v){q('#vehicle-empty').classList.remove('hidden');q('#vehicle-config').classList.add('hidden');return}q('#vehicle-empty').classList.add('hidden');q('#vehicle-config').classList.remove('hidden');q('#selected-pack').textContent=v.pack;q('#selected-name').textContent=v.name;q('#selected-id').textContent=v.id+' • '+T.vcategory(v.category);
 var cs=v.colors||[];q('#paint-options').innerHTML=cs.length?cs.map(function(c){var col=colors[String(c).toLowerCase()]||'#b66cff';return '<button data-color="'+C.esc(c)+'" class="'+(state.paint===c?'active':'')+'"><span class="color-dot" style="background:'+col+'"></span>'+C.esc(T.color(c))+'</button>'}).join(''):'<span class="muted">Brak osobnych wariantów lakieru.</span>';qa('[data-color]').forEach(function(b){b.onclick=function(){
  state.paint=b.getAttribute('data-color');
  if(state.services.indexOf('lakiernia')<0)state.services.push('lakiernia');
  renderConfig();
  renderSummary();
  toast('Lakiernia została dopisana do projektu, bo zmieniasz kolor auta.')
}});
 renderTabs();renderParts();renderServices()}
function vehicleParts(){if(!state.vehicle)return[];return DATA.parts.filter(function(p){return (p.cars||[]).indexOf(state.vehicle.id)>=0})}
function renderTabs(){var cats=['all'].concat(Array.from(new Set(vehicleParts().map(function(p){return p.category}))).sort());q('#mod-tabs').innerHTML=cats.map(function(c){return '<button data-cat="'+C.esc(c)+'" class="'+(state.cat===c?'active':'')+'">'+(c==='all'?'Wszystko':C.esc(T.category(c)))+'</button>'}).join('');qa('[data-cat]').forEach(function(b){b.onclick=function(){state.cat=b.getAttribute('data-cat');renderTabs();renderParts()}})}
function renderParts(){
 if(!state.vehicle)return;
 var all=vehicleParts(),term=q('#mod-search').value.trim().toLowerCase();
 var list=all.filter(function(p){
  var desc=R?R.description(p.category,p.name):'';
  var app=R?R.appearance(p.category,p.name):'';
  return (state.cat==='all'||p.category===state.cat)&&(!term||(p.name+' '+T.part(p.name)+' '+p.category+' '+T.category(p.category)+' '+desc+' '+app).toLowerCase().indexOf(term)>=0)
 });
 q('#mod-count').textContent=list.length+' pozycji';
 if(!all.length){
  q('#mod-grid').innerHTML='<div class="note" style="grid-column:1/-1">Ten model nie ma rozbudowanej listy wymiennych części w naszej bazie. Nie pokazujemy opcji, których mod nie obsługuje.</div>';
  return
 }
 q('#mod-grid').innerHTML=list.map(function(p){
  var key=p.category+'|'+p.name,on=state.parts.indexOf(key)>=0;
  var price=P?P.partPrice(p.category,p.name):0,priceText=P?P.money(price):String(price)+' $';
  var conflict=R?R.findConflict(state.parts,p.category,p.name):null;
  var blocked=!!conflict&&!on;
  var desc=R?R.description(p.category,p.name):'';
  var app=R?R.appearance(p.category,p.name):'';
  var slot=R?R.slotLabel(p.category,p.name):'';
  var colors=R?R.colorOptions(p.category,p.name):[];
  var colorSelect='';
  if(on&&colors.length){
    var current=state.partColors[key]||'';
    colorSelect='<div class="part-color-box" style="margin-top:9px" onclick="event.stopPropagation()">'+
      '<label class="field-label" style="margin-bottom:5px">KOLOR / WARIANT</label>'+
      '<select class="input part-color-select" data-color-key="'+encodeURIComponent(key)+'">'+
      '<option value="">Wybierz kolor...</option>'+
      colors.map(function(col){return '<option value="'+C.esc(col)+'" '+(current===col?'selected':'')+'>'+C.esc(col)+'</option>'}).join('')+
      '</select></div>'
  }
  var blockText=blocked?'<small style="display:block;margin-top:7px;color:#ff9da8"><b>Zajęte:</b> '+C.esc(T.part(conflict.name))+' — najpierw odznacz tę część.</small>':'';
  return '<article class="mod-card '+(on?'selected ':'')+(blocked?'blocked':'')+'" data-part="'+encodeURIComponent(key)+'" style="'+(blocked?'opacity:.62;':'')+'">'+
   '<span class="check">'+(on?'✓':'')+'</span>'+
   '<div class="mod-visual">'+(icons[p.category]||'◇')+'</div>'+
   '<b>'+C.esc(T.part(p.name))+'</b>'+
   '<small>'+C.esc(T.category(p.category))+' • slot: '+C.esc(slot)+'</small>'+
   '<small style="display:block;margin-top:7px;line-height:1.45;color:#a99ab3">'+C.esc(desc)+'</small>'+
   '<small style="display:block;margin-top:5px;line-height:1.45;color:#c6afd4">'+C.esc(app)+'</small>'+
   colorSelect+
   '<strong style="display:block;margin-top:8px;color:#ddb0ff">'+C.esc(priceText)+'</strong>'+
   blockText+
   '</article>'
 }).join('');
 qa('[data-part]').forEach(function(el){
  el.onclick=function(){
   var key=decodeURIComponent(el.getAttribute('data-part')),a=key.split('|'),cat=a.shift(),name=a.join('|'),i=state.parts.indexOf(key);
   if(i>=0){
    state.parts.splice(i,1);
    delete state.partColors[key];
    renderParts();renderSummary();return
   }
   var conflict=R?R.findConflict(state.parts,cat,name):null;
   if(conflict){
    toast('Najpierw odznacz „'+T.part(conflict.name)+'”, aby wybrać „'+T.part(name)+'”.');
    return
   }
   state.parts.push(key);
   renderParts();renderSummary()
  }
 });
 qa('.part-color-select').forEach(function(sel){
   sel.onchange=function(){
     var key=decodeURIComponent(sel.getAttribute('data-color-key'));
     state.partColors[key]=sel.value;
     renderSummary()
   };
   sel.onclick=function(e){e.stopPropagation()}
 })
}
function renderServices(){
 q('#service-grid').innerHTML=services.map(function(s){
  var forced=s.id==='lakiernia'&&!!state.paint;
  var on=forced||state.services.indexOf(s.id)>=0;
  var suffix=forced?' • automatycznie przez wybrany lakier':'';
  return '<div class="service-item '+(on?'selected':'')+'" data-s="'+s.id+'"><b>'+(on?'✓ ':'')+C.esc(s.name)+'</b><small>'+C.esc(s.desc+suffix)+'</small></div>'
 }).join('');
 qa('[data-s]').forEach(function(el){
  el.onclick=function(){
   var id=el.getAttribute('data-s');
   if(id==='lakiernia'&&state.paint){
    if(state.services.indexOf('lakiernia')<0)state.services.push('lakiernia');
    toast('Najpierw wróć do fabrycznego lakieru — wtedy możesz usunąć usługę lakierni.');
    renderServices();renderSummary();return
   }
   var i=state.services.indexOf(id);
   if(i>=0)state.services.splice(i,1);else state.services.push(id);
   renderServices();renderSummary()
  }
 })
}
function renderSummary(){
 var rows=[];
 if(state.vehicle)rows.push({n:state.vehicle.name,m:state.vehicle.id});
 if(state.paint)rows.push({n:'Lakier: '+T.color(state.paint),m:'nadwozie'});
 state.parts.forEach(function(k){
  var a=k.split('|'),cat=a.shift(),name=a.join('|'),price=P?P.partPrice(cat,name):0;
  var color=state.partColors[k]||'';
  rows.push({n:T.part(name)+(color?' — '+color:''),m:T.category(cat)+' • '+(P?P.money(price):String(price)+' $')})
 });
 state.services.forEach(function(id){
  var s=services.find(function(x){return x.id===id});
  if(s){
   var price=P?P.servicePrice(id):0;
   rows.push({n:s.name,m:'usługa • '+(P?P.money(price):String(price)+' $')})
  }
 });
 q('#build-count').textContent=Math.max(0,rows.length-(state.vehicle?1:0));
 q('#build-summary').innerHTML=rows.length?rows.map(function(r){
  return '<div class="summary-item"><div><b>'+C.esc(r.n)+'</b><small>'+C.esc(r.m)+'</small></div></div>'
 }).join(''):'<div class="mini-empty">Jeszcze nic nie wybrano.</div>';
 if(P&&q('#project-total'))q('#project-total').textContent=P.money(P.calculate(state.parts,state.services).total)
}
function updateReg(){var raw=q('#client-reg').value.replace(/\D/g,'').slice(0,4);q('#client-reg').value=raw;q('#reg-preview').textContent=raw.length?'CHICAGO '+raw.padStart(4,'0'):'CHICAGO ----'}
q('#client-reg').addEventListener('input',updateReg);

async function saveProject(){
 if(!state.vehicle)return toast('Najpierw wybierz auto.');
 var client=q('#client-name').value.trim();if(!client)return toast('Wpisz swój nick.');
 var digits=q('#client-reg').value.replace(/\D/g,'');if(digits.length!==4)return toast('Wpisz 4 cyfry rejestracji Chicago.');
 for(var ci=0;ci<state.parts.length;ci++){
   var ck=state.parts[ci],ca=ck.split('|'),ccat=ca.shift(),cname=ca.join('|'),opts=R?R.colorOptions(ccat,cname):[];
   if(opts.length&&!state.partColors[ck])return toast('Wybierz kolor / wariant dla: '+T.part(cname));
 }
 var reg=C.makeChicagoReg(digits),tracking=C.trackingCode();
 var priced=P?P.calculate(state.parts,state.services):{total:0,mechanicCut:0,workshopCut:0};var project={id:C.projectId(),trackingCode:tracking,createdAt:new Date().toISOString(),status:'PROJEKT KLIENTA',client:client,registration:reg,vehicle:{id:state.vehicle.id,name:state.vehicle.name,pack:state.vehicle.pack,itemId:state.vehicle.itemId},paint:state.paint,parts:state.parts.map(function(k){var a=k.split('|'),cat=a.shift(),name=a.join('|');return{category:cat,name:name,color:state.partColors[k]||null}}),services:state.services.map(function(id){var s=services.find(function(x){return x.id===id});return s?s.name:id}),priceTotal:priced.total,mechanicCut:priced.mechanicCut,workshopCut:priced.workshopCut,note:q('#client-note').value.trim(),history:[{at:new Date().toISOString(),text:'Projekt został przygotowany online. Wyślij kod mechanikowi przez aplikację (Discord) albo czat, a potem zgłoś się przy recepcji Central CEE Customs.'}]};
 C.saveProject(project);
 try{if(B)await B.submitProject(project)}catch(e){console.warn(e)}
 var code=C.projectCode(project);
 modal('<div class="eyebrow">CENTRAL CEE • PROJEKT GOTOWY</div><h2 style="margin:0 0 10px">'+C.esc(project.id)+'</h2><div class="cee-next-step"><span class="rp-label">CO TERAZ ROBISZ W RP</span><b>1.</b> Skopiuj kod dla mechanika.<br><b>2.</b> Wyślij go mechanikowi przez <span class="cee-app-chip">aplikację (Discord)</span> albo czat w mieście.<br><b>3.</b> Podejdź do recepcji Central CEE Customs i zgłoś, że projekt jest gotowy.<br><b>4.</b> Zostań przy recepcji. <b>Nie jedź na halę</b>, dopóki warsztat nie wyśle ci wezwania na stanowisko 1.</div><div class="detail-grid" style="margin-top:14px"><div class="detail-box"><span>Auto</span><b>'+C.esc(project.vehicle.name)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(project.registration))+'</b></div><div class="detail-box"><span>Kod śledzenia</span><b>'+C.esc(tracking)+'</b></div><div class="detail-box"><span>Do zapłaty po wykonaniu</span><b>'+(P?P.money(project.priceTotal):String(project.priceTotal)+' $')+'</b></div></div><label class="field-label" style="margin-top:16px">KOD DLA MECHANIKA</label><textarea id="project-code" class="input project-code" readonly>'+C.esc(code)+'</textarea><button id="copy-project" class="btn primary wide" style="margin-top:10px">KOPIUJ KOD I WYŚLIJ PRZEZ APLIKACJĘ</button><button id="copy-track" class="btn ghost wide" style="margin-top:8px">KOPIUJ KOD ŚLEDZENIA</button>');
 setTimeout(function(){q('#copy-project').onclick=function(){copy(code)};q('#copy-track').onclick=function(){copy(tracking)}},0)
}

function clientGuide(status,bay,payment){
 var s=String(status||'').toUpperCase();
 if(s==='CZEKA NA PRZYJĘCIE'||s==='PROJEKT KLIENTA'||s==='PRZYJĘCIE'){
   return '<div class="cee-next-step"><span class="rp-label">CO TERAZ</span><b>Zostań przy recepcji.</b> Projekt jest u warsztatu. Nie wjeżdżaj na halę, dopóki mechanik nie wezwie cię na stanowisko 1.</div>'
 }
 if(s==='W TRAKCIE'){
   var place=bay&&bay!=='—'?' na stanowisku '+C.esc(bay):' w warsztacie';
   return '<div class="cee-next-step"><span class="rp-label">CO TERAZ</span>Auto jest'+place+'. <b>Nie musisz nic robić.</b> Czekaj na wiadomość z warsztatu przez stronę, czat lub aplikację (Discord).</div>'
 }
 if(s==='GOTOWE DO ODBIORU'){
   return '<div class="cee-next-step"><span class="rp-label">CO TERAZ</span><b>Wróć do Central CEE Customs po odbiór.</b> Podejdź do recepcji i poczekaj na rozliczenie oraz wydanie auta.</div>'
 }
 if(s==='WYDANE'){
   return '<div class="cee-next-step"><span class="rp-label">ZLECENIE ZAKOŃCZONE</span>Auto zostało wydane. Nie masz już żadnych czynności do wykonania.</div>'
 }
 return '<div class="cee-next-step"><span class="rp-label">CO TERAZ</span>Sprawdź ostatnią wiadomość z warsztatu. Jeśli nie ma nowej instrukcji, poczekaj na kontakt mechanika.</div>'
}

async function checkStatus(){
 var code=q('#tracking-code').value.trim().toUpperCase();if(!code)return toast('Wpisz kod śledzenia.');
 q('#status-result').innerHTML='<div class="note">Sprawdzanie...</div>';
 try{
   var o=B?await B.publicStatus(code):null;
   if(!o){q('#status-result').innerHTML='<div class="note">Nie znaleziono zlecenia. Jeżeli mechanik jeszcze nie utworzył oficjalnego zlecenia, poczekaj przy recepcji.</div>';return}
   var status=o.status||'PRZYJĘCIE',bay=o.bay||'—',hist=o.history||[];
   q('#status-result').innerHTML='<div class="card" style="padding:18px"><div class="status-big">'+C.esc(status)+'</div>'+clientGuide(status,bay,o.paymentStatus)+'<div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Auto</span><b>'+C.esc((o.vehicle&&o.vehicle.name)||'—')+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Stanowisko</span><b>'+C.esc(bay)+'</b></div><div class="detail-box"><span>Płatność</span><b>'+C.esc(o.paymentStatus||'NIEOPŁACONE')+'</b></div></div><h3 style="margin-bottom:8px">Wiadomości z warsztatu</h3><div class="message-list">'+(hist.length?hist.slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak nowych wiadomości. Poczekaj na kontakt warsztatu.</div>')+'</div></div>';
 }catch(e){q('#status-result').innerHTML='<div class="note">Nie udało się pobrać statusu. Status online między dwoma komputerami wymaga podłączonej wspólnej bazy Central CEE.</div>'}
}
q('#tracking-check').onclick=checkStatus;q('#tracking-code').addEventListener('keydown',function(e){if(e.key==='Enter')checkStatus()});

function clearAll(){state={vehicle:null,paint:null,parts:[],partColors:{},services:[],pack:'all',cat:'all'};q('#vehicle-search').value='';q('#mod-search').value='';q('#client-name').value='';q('#client-reg').value='';q('#client-note').value='';updateReg();renderFilters();renderVehicles();renderConfig();renderSummary()}
q('#vehicle-search').addEventListener('input',renderVehicles);q('#mod-search').addEventListener('input',renderParts);q('#save-project').onclick=saveProject;q('#clear-build').onclick=clearAll;
renderPriceList();renderFilters();renderVehicles();renderConfig();renderSummary();updateReg();
})();