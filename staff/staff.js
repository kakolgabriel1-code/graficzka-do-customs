(function(){
'use strict';
var C=window.HSCCommon,T=window.HSCI18N,B=window.HSCBackend,P=window.HSCPricing;
var DATA=window.HSC_DATA||{vehicles:[],parts:[]};DATA.parts=DATA.parts||[];
var SESSION='hsc_staff_session_v1',PARTS_KEY='hsc_parts_orders_v2';
var statuses=['PRZYJĘCIE','W TRAKCIE','GOTOWE DO ODBIORU','WYDANE'];
var partCats=[{id:1,name:'Silnik / osiągi'},{id:2,name:'Zawieszenie'},{id:3,name:'Hamulce'},{id:4,name:'Koła / opony'},{id:5,name:'Nadwozie / pakiet karoserii'},{id:6,name:'Wnętrze'},{id:7,name:'Wskaźniki / elektryka'},{id:8,name:'Pozostałe części'}];

function q(s,r){return (r||document).querySelector(s)}function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function toast(m){var t=q('#toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2200)}
function modal(html){q('#modal-content').innerHTML=html;q('#modal').classList.remove('hidden')}function closeModal(){q('#modal').classList.add('hidden')}qa('[data-close-modal]').forEach(function(x){x.onclick=closeModal});
function addHistory(o,text){o.history=o.history||[];o.history.push({at:new Date().toISOString(),text:text})}
function saveOrder(o){C.saveOrder(o)}
function vehicleDef(id){return (DATA.vehicles||[]).find(function(v){return v.id===id})}
function compatibleParts(id){return (DATA.parts||[]).filter(function(p){return (p.cars||[]).indexOf(id)>=0})}

function showApp(){q('#auth-screen').style.display='none';q('#staff-app').classList.remove('hidden');renderAll()}
function showAuth(){q('#auth-screen').style.display='grid';q('#staff-app').classList.add('hidden');var first=!C.ownerPinExists();q('#auth-title').textContent=first?'Pierwsze uruchomienie Staff OS':'Weryfikacja pracownika';q('#auth-copy').textContent=first?'Ustaw PIN właściciela dla tego urządzenia.':'Wpisz PIN pracownika, aby otworzyć panel warsztatu.';q('#auth-submit').textContent=first?'Ustaw PIN i otwórz panel':'Zaloguj';q('#auth-note').textContent=first?'PIN jest teraz lokalny. Docelowe konta pracowników są przygotowane pod wspólną bazę HSC.':'';q('#staff-pin').value='';q('#staff-pin').focus()}
async function auth(){var pin=q('#staff-pin').value.trim();if(pin.length<4)return toast('PIN musi mieć minimum 4 znaki.');try{if(!C.ownerPinExists()){await C.setupOwnerPin(pin);sessionStorage.setItem(SESSION,'1');showApp()}else if(await C.verifyOwnerPin(pin)){sessionStorage.setItem(SESSION,'1');showApp()}else toast('Nieprawidłowy PIN.')}catch(e){toast('Nie udało się zweryfikować PIN-u.')}}
q('#auth-submit').onclick=auth;q('#staff-pin').addEventListener('keydown',function(e){if(e.key==='Enter')auth()});q('#logout').onclick=function(){sessionStorage.removeItem(SESSION);showAuth()};

function setTab(name){qa('[data-tab]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===name)});qa('.panel-view').forEach(function(p){p.classList.add('hidden')});q('#tab-'+name).classList.remove('hidden');if(name==='projects')renderProjects();if(name==='orders')renderOrders();if(name==='bays')renderBays();if(name==='parts')renderPartsOrders()}
qa('[data-tab]').forEach(function(b){b.onclick=function(){setTab(b.getAttribute('data-tab'))}});
function renderAll(){renderProjects();renderOrders();renderBays();renderPartsOrders()}

function activeProjects(){return C.listProjects().filter(function(p){return !p.convertedOrderId})}
function renderProjects(){
 var list=activeProjects();q('#project-count').textContent=list.length+' oczekujących';
 q('#project-list').innerHTML=list.length?list.map(function(p){return '<div class="project-row" data-project="'+C.esc(p.id)+'"><div><b>'+C.esc(p.id)+'</b><small>'+new Date(p.createdAt).toLocaleString('pl-PL')+'</small></div><div><b>'+C.esc(p.vehicle.name)+'</b><small>'+C.esc(p.vehicle.pack)+'</small></div><div><b>'+C.esc(p.client)+'</b><small>'+C.esc(C.formatReg(p.registration))+'</small></div><div><span class="status-pill">DO PRZYJĘCIA</span></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak projektów oczekujących.</div>';
 qa('[data-project]').forEach(function(el){el.onclick=function(){openProject(el.getAttribute('data-project'))}})
}
q('#import-project').onclick=function(){try{var p=C.parseProjectCode(q('#project-code').value.trim());if(!p||!p.id||!p.vehicle)throw new Error('BAD');if(!p.trackingCode)p.trackingCode=C.trackingCode();if(!p.registration||String(C.formatReg(p.registration)).indexOf('CHICAGO ')!==0)return toast('Ten stary projekt ma inną rejestrację niż Chicago. Klient musi utworzyć nowe zlecenie.');var all=C.listProjects();if(all.some(function(x){return x.id===p.id}))return toast('Ten projekt już jest zapisany.');C.saveProject(p);q('#project-code').value='';renderProjects();toast('Zlecenie klienta zaimportowane.')}catch(e){toast('Nieprawidłowy kod klienta.')}};

function openProject(id){
 var p=C.listProjects().find(function(x){return x.id===id});if(!p)return;
 var vd=vehicleDef(p.vehicle.id)||{colors:[]},current=(p.parts||[]).map(function(x){return x.category+'|'+x.name});
 var options=compatibleParts(p.vehicle.id).filter(function(x){return current.indexOf(x.category+'|'+x.name)<0}).slice(0,500);
 var parts=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';
 var colorOpts=['<option value="">Bez zmian</option>'].concat((vd.colors||[]).map(function(c){return '<option value="'+C.esc(c)+'" '+(p.paint===c?'selected':'')+'>'+C.esc(T.color(c))+'</option>'})).join('');
 var addOpts='<option value="">Dodaj kompatybilną część...</option>'+options.map(function(x){return '<option value="'+C.esc(x.category+'|'+x.name)+'">'+C.esc(T.category(x.category)+' — '+T.part(x.name))+'</option>'}).join('');
 modal('<div class="eyebrow">ZLECENIE KLIENTA • '+C.esc(p.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(p.vehicle.name)+'</h2><div class="note" style="font-size:13px;line-height:1.6"><b>CO ROBISZ:</b><br>1. Klient stoi przy recepcji i podaje ci ten kod.<br>2. Sprawdź z nim listę poniżej.<br>3. Kliknij <b>PRZYJMIJ ZLECENIE</b>.<br>4. Potem w Minecraft terminal → <b>WEZWIJ NA STANOWISKO 1</b>.</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(p.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(p.registration))+'</b></div><div class="detail-box"><span>Kod śledzenia klienta</span><b>'+C.esc(p.trackingCode||'—')+'</b></div><div class="detail-box"><span>Cena zlecenia</span><b>'+(P?P.money((p.priceTotal!=null?p.priceTotal:P.calculate(p.parts||[],[]).total)):(p.priceTotal||0)+' </div><div style="margin-top:14px"><label class="field-label">LAKIER</label><select id="project-paint" class="input">'+colorOpts+'</select></div><h4>Modyfikacje</h4><div id="project-parts" class="part-list">'+parts+'</div><div style="display:flex;gap:8px;margin-top:10px"><select id="add-part" class="input">'+addOpts+'</select><button id="add-part-btn" class="btn ghost">Dodaj</button></div><label class="field-label" style="margin-top:16px">UWAGI</label><textarea id="project-note" class="input" rows="4">'+C.esc(p.note||'')+'</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="save-project-edit" class="btn ghost">ZAPISZ POPRAWKI</button><button id="create-order" class="btn primary">PRZYJMIJ ZLECENIE</button></div>');
 setTimeout(function(){
   function redraw(){q('#project-parts').innerHTML=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';qa('[data-rm-part]').forEach(function(b){b.onclick=function(){p.parts.splice(Number(b.getAttribute('data-rm-part')),1);redraw()}})}
   redraw();
   q('#add-part-btn').onclick=function(){var v=q('#add-part').value;if(!v)return;var a=v.split('|');p.parts=p.parts||[];p.parts.push({category:a.shift(),name:a.join('|')});q('#add-part').selectedIndex=0;redraw()};
   q('#save-project-edit').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();C.saveProject(p);closeModal();renderProjects();toast('Poprawki zapisane.')};
   q('#create-order').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();createOrderFromProject(p)}
 },0)
}

function createOrderFromProject(p){
 var now=new Date().toISOString(),calc=P?P.calculate(p.parts||[],[]):{total:Number(p.priceTotal)||0,mechanicCut:Number(p.mechanicCut)||0,workshopCut:Number(p.workshopCut)||0},total=(p.priceTotal!=null?Number(p.priceTotal):calc.total),mech=(p.mechanicCut!=null?Number(p.mechanicCut):Math.round(total*0.35)),order={id:C.orderId(),projectId:p.id,trackingCode:p.trackingCode||C.trackingCode(),createdAt:now,client:p.client,registration:p.registration,vehicle:p.vehicle,paint:p.paint||null,parts:(p.parts||[]).slice(),services:(p.services||[]).slice(),priceTotal:total,mechanicCut:mech,workshopCut:total-mech,note:p.note||'',status:'PRZYJĘCIE',bay:null,paymentMethod:'NIE USTALONO',paymentStatus:'NIEOPŁACONE',history:(p.history||[]).slice()};
 addHistory(order,'Mechanik przyjął zlecenie. Zostań przy recepcji — za chwilę dostaniesz informację, kiedy podjechać na stanowisko 1.');
 saveOrder(order);p.convertedOrderId=order.id;p.convertedAt=now;C.saveProject(p);closeModal();renderAll();setTab('orders');toast('Zlecenie przyjęte: '+order.id);openOrder(order.id)
}

function renderOrders(){
 var list=C.listOrders(),filter=q('#order-filter').value;if(filter!=='all')list=list.filter(function(o){return o.status===filter});
 q('#order-list').innerHTML=list.length?list.map(function(o){return '<div class="order-row" data-order="'+C.esc(o.id)+'"><div><b>'+C.esc(o.id)+'</b><small>'+C.esc(o.client)+' • '+C.esc(C.formatReg(o.registration))+'</small></div><div><b>'+C.esc(o.vehicle.name)+'</b><small>Kod: '+C.esc(o.trackingCode||'—')+'</small></div><div><span class="status-pill">'+C.esc(o.status)+'</span></div><div><b>'+(o.bay||'—')+'</b><small>stanowisko</small></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak zleceń.</div>';
 qa('[data-order]').forEach(function(el){el.onclick=function(){openOrder(el.getAttribute('data-order'))}})
}
q('#order-filter').onchange=renderOrders;

function openOrder(id){
 var o=C.listOrders().find(function(x){return x.id===id});if(!o)return;if(statuses.indexOf(o.status)<0)o.status='W TRAKCIE';
 var parts=(o.parts||[]).map(function(x){return '<span>'+C.esc(T.part(x.name||x))+'</span>'}).join('')||'<span>Brak części</span>';
 var bays=['','2','3','4','5','6','7','8'].map(function(b){return '<option value="'+b+'" '+(String(o.bay||'')===b?'selected':'')+'>'+(b?'Stanowisko '+b:'Jeszcze nie wybrano')+'</option>'}).join('');
 var guide=o.status==='PRZYJĘCIE'
  ?'<b>NASTĘPNY KROK:</b><br>W Minecraft kliknij terminal pracownika → <b>WEZWIJ KLIENTA NA STANOWISKO 1</b>. Obejrzyj auto. Potem przydziel stanowisko 2–8. Dopiero wtedy tutaj wybierz ten sam numer i kliknij <b>ROZPOCZNIJ PRACĘ</b>.'
  :o.status==='W TRAKCIE'
   ?'<b>NASTĘPNY KROK:</b><br>Robisz całe zlecenie przy jednym stanowisku. Części zamawiasz w zakładce <b>CZĘŚCI / DOSTAWY</b>. Gdy skończysz, najpierw kliknij w Minecraft terminal → <b>AUTO GOTOWE</b>, a potem tutaj <b>AUTO GOTOWE</b>.'
   :o.status==='GOTOWE DO ODBIORU'
    ?'<b>NASTĘPNY KROK:</b><br>Klient może odebrać auto. Po płatności kliknij w Minecraft terminal → <b>OPŁACONE I WYDANE</b>, a potem tutaj ten sam przycisk.'
    :'<b>ZAKOŃCZONE.</b><br>Auto zostało opłacone i wydane.';
 modal('<div class="eyebrow">'+C.esc(o.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(o.vehicle.name)+'</h2><div class="note" style="font-size:13px;line-height:1.65">'+guide+'</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(o.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Status</span><b>'+C.esc(o.status)+'</b></div><div class="detail-box"><span>Klient zapłaci</span><b>'+(P?P.money(o.priceTotal||0):(o.priceTotal||0)+' </div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();)+'</b></div></div><div style="margin-top:14px"><label class="field-label">LAKIER</label><select id="project-paint" class="input">'+colorOpts+'</select></div><h4>Modyfikacje</h4><div id="project-parts" class="part-list">'+parts+'</div><div style="display:flex;gap:8px;margin-top:10px"><select id="add-part" class="input">'+addOpts+'</select><button id="add-part-btn" class="btn ghost">Dodaj</button></div><label class="field-label" style="margin-top:16px">UWAGI</label><textarea id="project-note" class="input" rows="4">'+C.esc(p.note||'')+'</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="save-project-edit" class="btn ghost">ZAPISZ POPRAWKI</button><button id="create-order" class="btn primary">PRZYJMIJ ZLECENIE</button></div>');
 setTimeout(function(){
   function redraw(){q('#project-parts').innerHTML=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';qa('[data-rm-part]').forEach(function(b){b.onclick=function(){p.parts.splice(Number(b.getAttribute('data-rm-part')),1);redraw()}})}
   redraw();
   q('#add-part-btn').onclick=function(){var v=q('#add-part').value;if(!v)return;var a=v.split('|');p.parts=p.parts||[];p.parts.push({category:a.shift(),name:a.join('|')});q('#add-part').selectedIndex=0;redraw()};
   q('#save-project-edit').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();C.saveProject(p);closeModal();renderProjects();toast('Poprawki zapisane.')};
   q('#create-order').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();createOrderFromProject(p)}
 },0)
}

function createOrderFromProject(p){
 var now=new Date().toISOString(),order={id:C.orderId(),projectId:p.id,trackingCode:p.trackingCode||C.trackingCode(),createdAt:now,client:p.client,registration:p.registration,vehicle:p.vehicle,paint:p.paint||null,parts:(p.parts||[]).slice(),services:(p.services||[]).slice(),note:p.note||'',status:'PRZYJĘCIE',bay:null,paymentMethod:'NIE USTALONO',paymentStatus:'NIEOPŁACONE',history:(p.history||[]).slice()};
 addHistory(order,'Mechanik przyjął zlecenie. Zostań przy recepcji — za chwilę dostaniesz informację, kiedy podjechać na stanowisko 1.');
 saveOrder(order);p.convertedOrderId=order.id;p.convertedAt=now;C.saveProject(p);closeModal();renderAll();setTab('orders');toast('Zlecenie przyjęte: '+order.id);openOrder(order.id)
}

function renderOrders(){
 var list=C.listOrders(),filter=q('#order-filter').value;if(filter!=='all')list=list.filter(function(o){return o.status===filter});
 q('#order-list').innerHTML=list.length?list.map(function(o){return '<div class="order-row" data-order="'+C.esc(o.id)+'"><div><b>'+C.esc(o.id)+'</b><small>'+C.esc(o.client)+' • '+C.esc(C.formatReg(o.registration))+'</small></div><div><b>'+C.esc(o.vehicle.name)+'</b><small>Kod: '+C.esc(o.trackingCode||'—')+'</small></div><div><span class="status-pill">'+C.esc(o.status)+'</span></div><div><b>'+(o.bay||'—')+'</b><small>stanowisko</small></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak zleceń.</div>';
 qa('[data-order]').forEach(function(el){el.onclick=function(){openOrder(el.getAttribute('data-order'))}})
}
q('#order-filter').onchange=renderOrders;

function openOrder(id){
 var o=C.listOrders().find(function(x){return x.id===id});if(!o)return;if(statuses.indexOf(o.status)<0)o.status='W TRAKCIE';
 var parts=(o.parts||[]).map(function(x){return '<span>'+C.esc(T.part(x.name||x))+'</span>'}).join('')||'<span>Brak części</span>';
 var bays=['','2','3','4','5','6','7','8'].map(function(b){return '<option value="'+b+'" '+(String(o.bay||'')===b?'selected':'')+'>'+(b?'Stanowisko '+b:'Jeszcze nie wybrano')+'</option>'}).join('');
 var guide=o.status==='PRZYJĘCIE'
  ?'<b>NASTĘPNY KROK:</b><br>W Minecraft kliknij terminal pracownika → <b>WEZWIJ KLIENTA NA STANOWISKO 1</b>. Obejrzyj auto. Potem przydziel stanowisko 2–8. Dopiero wtedy tutaj wybierz ten sam numer i kliknij <b>ROZPOCZNIJ PRACĘ</b>.'
  :o.status==='W TRAKCIE'
   ?'<b>NASTĘPNY KROK:</b><br>Robisz całe zlecenie przy jednym stanowisku. Części zamawiasz w zakładce <b>CZĘŚCI / DOSTAWY</b>. Gdy skończysz, najpierw kliknij w Minecraft terminal → <b>AUTO GOTOWE</b>, a potem tutaj <b>AUTO GOTOWE</b>.'
   :o.status==='GOTOWE DO ODBIORU'
    ?'<b>NASTĘPNY KROK:</b><br>Klient może odebrać auto. Po płatności kliknij w Minecraft terminal → <b>OPŁACONE I WYDANE</b>, a potem tutaj ten sam przycisk.'
    :'<b>ZAKOŃCZONE.</b><br>Auto zostało opłacone i wydane.';
 modal('<div class="eyebrow">'+C.esc(o.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(o.vehicle.name)+'</h2><div class="note" style="font-size:13px;line-height:1.65">'+guide+'</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(o.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Status</span><b>'+C.esc(o.status)+'</b></div><div class="detail-box"><span>Kod statusu klienta</span><b>'+C.esc(o.trackingCode||'—')+'</b></div></div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();)+'</b></div><div class="detail-box"><span>Twoja wypłata 35%</span><b>'+(P?P.money(o.mechanicCut||0):(o.mechanicCut||0)+' </div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();)+'</b></div></div><div style="margin-top:14px"><label class="field-label">LAKIER</label><select id="project-paint" class="input">'+colorOpts+'</select></div><h4>Modyfikacje</h4><div id="project-parts" class="part-list">'+parts+'</div><div style="display:flex;gap:8px;margin-top:10px"><select id="add-part" class="input">'+addOpts+'</select><button id="add-part-btn" class="btn ghost">Dodaj</button></div><label class="field-label" style="margin-top:16px">UWAGI</label><textarea id="project-note" class="input" rows="4">'+C.esc(p.note||'')+'</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="save-project-edit" class="btn ghost">ZAPISZ POPRAWKI</button><button id="create-order" class="btn primary">PRZYJMIJ ZLECENIE</button></div>');
 setTimeout(function(){
   function redraw(){q('#project-parts').innerHTML=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';qa('[data-rm-part]').forEach(function(b){b.onclick=function(){p.parts.splice(Number(b.getAttribute('data-rm-part')),1);redraw()}})}
   redraw();
   q('#add-part-btn').onclick=function(){var v=q('#add-part').value;if(!v)return;var a=v.split('|');p.parts=p.parts||[];p.parts.push({category:a.shift(),name:a.join('|')});q('#add-part').selectedIndex=0;redraw()};
   q('#save-project-edit').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();C.saveProject(p);closeModal();renderProjects();toast('Poprawki zapisane.')};
   q('#create-order').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();createOrderFromProject(p)}
 },0)
}

function createOrderFromProject(p){
 var now=new Date().toISOString(),order={id:C.orderId(),projectId:p.id,trackingCode:p.trackingCode||C.trackingCode(),createdAt:now,client:p.client,registration:p.registration,vehicle:p.vehicle,paint:p.paint||null,parts:(p.parts||[]).slice(),services:(p.services||[]).slice(),note:p.note||'',status:'PRZYJĘCIE',bay:null,paymentMethod:'NIE USTALONO',paymentStatus:'NIEOPŁACONE',history:(p.history||[]).slice()};
 addHistory(order,'Mechanik przyjął zlecenie. Zostań przy recepcji — za chwilę dostaniesz informację, kiedy podjechać na stanowisko 1.');
 saveOrder(order);p.convertedOrderId=order.id;p.convertedAt=now;C.saveProject(p);closeModal();renderAll();setTab('orders');toast('Zlecenie przyjęte: '+order.id);openOrder(order.id)
}

function renderOrders(){
 var list=C.listOrders(),filter=q('#order-filter').value;if(filter!=='all')list=list.filter(function(o){return o.status===filter});
 q('#order-list').innerHTML=list.length?list.map(function(o){return '<div class="order-row" data-order="'+C.esc(o.id)+'"><div><b>'+C.esc(o.id)+'</b><small>'+C.esc(o.client)+' • '+C.esc(C.formatReg(o.registration))+'</small></div><div><b>'+C.esc(o.vehicle.name)+'</b><small>Kod: '+C.esc(o.trackingCode||'—')+'</small></div><div><span class="status-pill">'+C.esc(o.status)+'</span></div><div><b>'+(o.bay||'—')+'</b><small>stanowisko</small></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak zleceń.</div>';
 qa('[data-order]').forEach(function(el){el.onclick=function(){openOrder(el.getAttribute('data-order'))}})
}
q('#order-filter').onchange=renderOrders;

function openOrder(id){
 var o=C.listOrders().find(function(x){return x.id===id});if(!o)return;if(statuses.indexOf(o.status)<0)o.status='W TRAKCIE';
 var parts=(o.parts||[]).map(function(x){return '<span>'+C.esc(T.part(x.name||x))+'</span>'}).join('')||'<span>Brak części</span>';
 var bays=['','2','3','4','5','6','7','8'].map(function(b){return '<option value="'+b+'" '+(String(o.bay||'')===b?'selected':'')+'>'+(b?'Stanowisko '+b:'Jeszcze nie wybrano')+'</option>'}).join('');
 var guide=o.status==='PRZYJĘCIE'
  ?'<b>NASTĘPNY KROK:</b><br>W Minecraft kliknij terminal pracownika → <b>WEZWIJ KLIENTA NA STANOWISKO 1</b>. Obejrzyj auto. Potem przydziel stanowisko 2–8. Dopiero wtedy tutaj wybierz ten sam numer i kliknij <b>ROZPOCZNIJ PRACĘ</b>.'
  :o.status==='W TRAKCIE'
   ?'<b>NASTĘPNY KROK:</b><br>Robisz całe zlecenie przy jednym stanowisku. Części zamawiasz w zakładce <b>CZĘŚCI / DOSTAWY</b>. Gdy skończysz, najpierw kliknij w Minecraft terminal → <b>AUTO GOTOWE</b>, a potem tutaj <b>AUTO GOTOWE</b>.'
   :o.status==='GOTOWE DO ODBIORU'
    ?'<b>NASTĘPNY KROK:</b><br>Klient może odebrać auto. Po płatności kliknij w Minecraft terminal → <b>OPŁACONE I WYDANE</b>, a potem tutaj ten sam przycisk.'
    :'<b>ZAKOŃCZONE.</b><br>Auto zostało opłacone i wydane.';
 modal('<div class="eyebrow">'+C.esc(o.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(o.vehicle.name)+'</h2><div class="note" style="font-size:13px;line-height:1.65">'+guide+'</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(o.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Status</span><b>'+C.esc(o.status)+'</b></div><div class="detail-box"><span>Kod statusu klienta</span><b>'+C.esc(o.trackingCode||'—')+'</b></div></div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();)+'</b></div><div class="detail-box"><span>Kod statusu klienta</span><b>'+C.esc(o.trackingCode||'—')+'</b></div></div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();)+'</b></div></div><div style="margin-top:14px"><label class="field-label">LAKIER</label><select id="project-paint" class="input">'+colorOpts+'</select></div><h4>Modyfikacje</h4><div id="project-parts" class="part-list">'+parts+'</div><div style="display:flex;gap:8px;margin-top:10px"><select id="add-part" class="input">'+addOpts+'</select><button id="add-part-btn" class="btn ghost">Dodaj</button></div><label class="field-label" style="margin-top:16px">UWAGI</label><textarea id="project-note" class="input" rows="4">'+C.esc(p.note||'')+'</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="save-project-edit" class="btn ghost">ZAPISZ POPRAWKI</button><button id="create-order" class="btn primary">PRZYJMIJ ZLECENIE</button></div>');
 setTimeout(function(){
   function redraw(){q('#project-parts').innerHTML=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';qa('[data-rm-part]').forEach(function(b){b.onclick=function(){p.parts.splice(Number(b.getAttribute('data-rm-part')),1);redraw()}})}
   redraw();
   q('#add-part-btn').onclick=function(){var v=q('#add-part').value;if(!v)return;var a=v.split('|');p.parts=p.parts||[];p.parts.push({category:a.shift(),name:a.join('|')});q('#add-part').selectedIndex=0;redraw()};
   q('#save-project-edit').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();C.saveProject(p);closeModal();renderProjects();toast('Poprawki zapisane.')};
   q('#create-order').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();createOrderFromProject(p)}
 },0)
}

function createOrderFromProject(p){
 var now=new Date().toISOString(),order={id:C.orderId(),projectId:p.id,trackingCode:p.trackingCode||C.trackingCode(),createdAt:now,client:p.client,registration:p.registration,vehicle:p.vehicle,paint:p.paint||null,parts:(p.parts||[]).slice(),services:(p.services||[]).slice(),note:p.note||'',status:'PRZYJĘCIE',bay:null,paymentMethod:'NIE USTALONO',paymentStatus:'NIEOPŁACONE',history:(p.history||[]).slice()};
 addHistory(order,'Mechanik przyjął zlecenie. Zostań przy recepcji — za chwilę dostaniesz informację, kiedy podjechać na stanowisko 1.');
 saveOrder(order);p.convertedOrderId=order.id;p.convertedAt=now;C.saveProject(p);closeModal();renderAll();setTab('orders');toast('Zlecenie przyjęte: '+order.id);openOrder(order.id)
}

function renderOrders(){
 var list=C.listOrders(),filter=q('#order-filter').value;if(filter!=='all')list=list.filter(function(o){return o.status===filter});
 q('#order-list').innerHTML=list.length?list.map(function(o){return '<div class="order-row" data-order="'+C.esc(o.id)+'"><div><b>'+C.esc(o.id)+'</b><small>'+C.esc(o.client)+' • '+C.esc(C.formatReg(o.registration))+'</small></div><div><b>'+C.esc(o.vehicle.name)+'</b><small>Kod: '+C.esc(o.trackingCode||'—')+'</small></div><div><span class="status-pill">'+C.esc(o.status)+'</span></div><div><b>'+(o.bay||'—')+'</b><small>stanowisko</small></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak zleceń.</div>';
 qa('[data-order]').forEach(function(el){el.onclick=function(){openOrder(el.getAttribute('data-order'))}})
}
q('#order-filter').onchange=renderOrders;

function openOrder(id){
 var o=C.listOrders().find(function(x){return x.id===id});if(!o)return;if(statuses.indexOf(o.status)<0)o.status='W TRAKCIE';
 var parts=(o.parts||[]).map(function(x){return '<span>'+C.esc(T.part(x.name||x))+'</span>'}).join('')||'<span>Brak części</span>';
 var bays=['','2','3','4','5','6','7','8'].map(function(b){return '<option value="'+b+'" '+(String(o.bay||'')===b?'selected':'')+'>'+(b?'Stanowisko '+b:'Jeszcze nie wybrano')+'</option>'}).join('');
 var guide=o.status==='PRZYJĘCIE'
  ?'<b>NASTĘPNY KROK:</b><br>W Minecraft kliknij terminal pracownika → <b>WEZWIJ KLIENTA NA STANOWISKO 1</b>. Obejrzyj auto. Potem przydziel stanowisko 2–8. Dopiero wtedy tutaj wybierz ten sam numer i kliknij <b>ROZPOCZNIJ PRACĘ</b>.'
  :o.status==='W TRAKCIE'
   ?'<b>NASTĘPNY KROK:</b><br>Robisz całe zlecenie przy jednym stanowisku. Części zamawiasz w zakładce <b>CZĘŚCI / DOSTAWY</b>. Gdy skończysz, najpierw kliknij w Minecraft terminal → <b>AUTO GOTOWE</b>, a potem tutaj <b>AUTO GOTOWE</b>.'
   :o.status==='GOTOWE DO ODBIORU'
    ?'<b>NASTĘPNY KROK:</b><br>Klient może odebrać auto. Po płatności kliknij w Minecraft terminal → <b>OPŁACONE I WYDANE</b>, a potem tutaj ten sam przycisk.'
    :'<b>ZAKOŃCZONE.</b><br>Auto zostało opłacone i wydane.';
 modal('<div class="eyebrow">'+C.esc(o.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(o.vehicle.name)+'</h2><div class="note" style="font-size:13px;line-height:1.65">'+guide+'</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(o.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Status</span><b>'+C.esc(o.status)+'</b></div><div class="detail-box"><span>Kod statusu klienta</span><b>'+C.esc(o.trackingCode||'—')+'</b></div></div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="np. Czekamy na dostawę turbiny."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU')btn.push('<button id="finish-order" class="btn primary">OPŁACONE I WYDANE</button>');
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto trafiło na stanowisko '+o.bay+'. Rozpoczęliśmy prace.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Twoje auto jest gotowe do odbioru. Podejdź do Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność przyjęta. Auto zostało wydane. Dziękujemy za wizytę w Hood Stories Customs.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zakończone.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}
function renderPartsOrders(){
 var os=q('#parts-order-id'),cs=q('#parts-category');if(!os||!cs)return;var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 cs.innerHTML=partCats.map(function(x){return '<option value="'+x.id+'">'+x.id+'. '+C.esc(x.name)+'</option>'}).join('');
 var a=getPartsOrders();q('#parts-count').textContent=a.length+' zapisanych';q('#parts-list').innerHTML=a.length?a.map(function(x,i){return '<div class="order-row" style="grid-template-columns:1.15fr 1.5fr 1fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>Ilość: '+x.qty+'</small></div><div><span class="status-pill">'+C.esc(x.state)+'</span><small>/trigger hsc_part set '+x.category+'</small></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">Akcja</button></div></div>'}).join(''):'<div class="mini-empty">Brak zamówień części.</div>';qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;var cmd='/trigger hsc_part set '+x.category;
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="detail-grid"><div class="detail-box"><span>Zlecenie</span><b>'+C.esc(x.orderId)+'</b></div><div class="detail-box"><span>Kategoria</span><b>'+C.esc(x.categoryName)+'</b></div></div><label class="field-label" style="margin-top:15px">KOMENDA W MINECRAFT</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="copy-parts-command" class="btn ghost">KOPIUJ KOMENDĘ</button><button id="mark-parts-sent" class="btn primary">DOSTAWA URUCHOMIONA</button></div><button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">Usuń wpis</button>');
 setTimeout(function(){q('#copy-parts-command').onclick=function(){var t=q('#parts-command');t.select();document.execCommand('copy');toast('Skopiowano komendę.')};q('#mark-parts-sent').onclick=function(){x.state='W DRODZE';savePartsOrders(a);var o=C.listOrders().find(function(z){return z.id===x.orderId});if(o){addHistory(o,'Zamówiliśmy część: '+x.name+'. Dostawa jest w drodze.');saveOrder(o)}closeModal();renderAll();toast('Dostawa uruchomiona.')};q('#remove-parts-order').onclick=function(){a.splice(i,1);savePartsOrders(a);closeModal();renderPartsOrders()}},0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,name=q('#parts-name').value.trim(),cat=Number(q('#parts-category').value),qty=Math.max(1,Number(q('#parts-qty').value)||1);if(!oid)return toast('Wybierz zlecenie.');if(!name)return toast('Wpisz nazwę części.');var cc=partCats.find(function(x){return x.id===cat}),a=getPartsOrders();a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc.name,name:name,qty:qty,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});savePartsOrders(a);q('#parts-name').value='';q('#parts-qty').value='1';renderPartsOrders();toast('Zamówienie zapisane. Teraz kliknij Akcja i uruchom komendę w Minecraft.')};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();