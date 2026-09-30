(function(){
'use strict';
var C=window.HSCCommon,T=window.HSCI18N,B=window.HSCBackend,P=window.HSCPricing,R=window.HSCPartRules;
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
function showAuth(){q('#auth-screen').style.display='grid';q('#staff-app').classList.add('hidden');var first=!C.ownerPinExists();q('#auth-title').textContent=first?'Pierwsze uruchomienie Staff OS':'Weryfikacja pracownika';q('#auth-copy').textContent=first?'Ustaw PIN właściciela dla tego urządzenia.':'Wpisz PIN pracownika, aby otworzyć panel warsztatu.';q('#auth-submit').textContent=first?'Ustaw PIN i otwórz panel':'Zaloguj';q('#auth-note').textContent=first?'PIN jest teraz lokalny. Docelowe konta pracowników są przygotowane pod wspólną bazę Cent\'s Detailing&Customs.':'';q('#staff-pin').value='';q('#staff-pin').focus()}
async function auth(){var pin=q('#staff-pin').value.trim();if(pin.length<4)return toast('PIN musi mieć minimum 4 znaki.');try{if(!C.ownerPinExists()){await C.setupOwnerPin(pin);sessionStorage.setItem(SESSION,'1');showApp()}else if(await C.verifyOwnerPin(pin)){sessionStorage.setItem(SESSION,'1');showApp()}else toast('Nieprawidłowy PIN.')}catch(e){toast('Nie udało się zweryfikować PIN-u.')}}
q('#auth-submit').onclick=auth;q('#staff-pin').addEventListener('keydown',function(e){if(e.key==='Enter')auth()});q('#logout').onclick=function(){sessionStorage.removeItem(SESSION);showAuth()};
q('#staff-reset-test').onclick=function(){
 if(!confirm('Wyczyścić wszystkie projekty, zlecenia i dostawy zapisane na tym urządzeniu? PIN zostanie.'))return;
 localStorage.removeItem(C.PROJECTS_KEY);localStorage.removeItem(C.ORDERS_KEY);localStorage.removeItem(PARTS_KEY);
 closeModal();setTab('projects');renderAll();toast('Staff OS wyczyszczony. Możesz zacząć od początku.')
};

function setTab(name){qa('[data-tab]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===name)});qa('.panel-view').forEach(function(p){p.classList.add('hidden')});q('#tab-'+name).classList.remove('hidden');if(name==='projects')renderProjects();if(name==='orders')renderOrders();if(name==='bays')renderBays();if(name==='parts')renderPartsOrders()}
qa('[data-tab]').forEach(function(b){b.onclick=function(){setTab(b.getAttribute('data-tab'))}});
function renderStaffNow(){
 var box=q('#staff-now');if(!box)return;
 var projects=activeProjects();
 var orders=C.listOrders().filter(function(o){return o.status!=='WYDANE'});
 var ready=orders.find(function(o){return o.status==='GOTOWE DO ODBIORU'});
 var intake=orders.find(function(o){return o.status==='PRZYJĘCIE'});
 var work=orders.find(function(o){return o.status==='W TRAKCIE'});
 if(projects.length) box.innerHTML='<b>Następny krok:</b> otwórz projekt klienta i kliknij „Przyjmij zlecenie”.';
 else if(intake) box.innerHTML='<b>Następny krok:</b> terminal w grze → „Wezwij klienta na stanowisko 1”.';
 else if(work) box.innerHTML='<b>Następny krok:</b> wykonuj zakres zlecenia. Brakuje części? Otwórz „Części / dostawy”.';
 else if(ready) box.innerHTML='<b>Następny krok:</b> odbiór klienta → płatność → wydanie auta.';
 else box.innerHTML='<b>Następny krok:</b> czekaj na kod projektu od klienta.'
}
function renderMetrics(){
 var projects=activeProjects().length;
 var orders=C.listOrders().filter(function(o){return o.status!=='WYDANE'}).length;
 var occupied=C.listOrders().filter(function(o){return o.status!=='WYDANE'&&Number(o.bay)>=2&&Number(o.bay)<=8}).length;
 var deliveries=getPartsOrders().filter(function(x){return x.state!=='ODEBRANE'&&x.state!=='ANULOWANE'}).length;
 if(q('#metric-projects'))q('#metric-projects').textContent=projects;
 if(q('#metric-orders'))q('#metric-orders').textContent=orders;
 if(q('#metric-bays'))q('#metric-bays').textContent=occupied+' / 7';
 if(q('#metric-parts'))q('#metric-parts').textContent=deliveries
}
function renderAll(){renderProjects();renderOrders();renderBays();renderPartsOrders();renderMetrics();renderStaffNow()}

function activeProjects(){return C.listProjects().filter(function(p){return !p.convertedOrderId})}
function renderProjects(){
 var list=activeProjects();q('#project-count').textContent=list.length+' oczekujących';
 q('#project-list').innerHTML=list.length?list.map(function(p){return '<div class="project-row" data-project="'+C.esc(p.id)+'"><div><b>'+C.esc(p.id)+'</b><small>'+new Date(p.createdAt).toLocaleString('pl-PL')+'</small></div><div><b>'+C.esc(p.vehicle.name)+'</b><small>'+C.esc(p.vehicle.pack)+'</small></div><div><b>'+C.esc(p.client)+'</b><small>'+C.esc(C.formatReg(p.registration))+'</small></div><div><span class="status-pill">DO PRZYJĘCIA</span></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak projektów oczekujących.</div>';
 qa('[data-project]').forEach(function(el){el.onclick=function(){openProject(el.getAttribute('data-project'))}})
}
q('#import-project').onclick=function(){try{var p=C.parseProjectCode(q('#project-code').value.trim());if(!p||!p.id||!p.vehicle)throw new Error('BAD');if(!p.trackingCode)p.trackingCode=C.trackingCode();if(!p.registration||String(C.formatReg(p.registration)).indexOf('CHICAGO ')!==0)return toast('Ten stary projekt ma inną rejestrację niż Chicago. Klient musi utworzyć nowe zlecenie.');var all=C.listProjects();if(all.some(function(x){return x.id===p.id}))return toast('Ten projekt już jest zapisany.');C.saveProject(p);q('#project-code').value='';renderProjects();toast('Projekt dodany. Otwórz go i przyjmij zlecenie.')}catch(e){toast('Nieprawidłowy kod klienta.')}};

function openProject(id){
 var p=C.listProjects().find(function(x){return x.id===id});if(!p)return;
 var vd=vehicleDef(p.vehicle.id)||{colors:[]},current=(p.parts||[]).map(function(x){return x.category+'|'+x.name});
 var options=compatibleParts(p.vehicle.id).filter(function(x){return current.indexOf(x.category+'|'+x.name)<0}).slice(0,500);
 var parts=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+(x.color?' • kolor: '+C.esc(x.color):'')+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';
 var colorOpts=['<option value="">Bez zmian</option>'].concat((vd.colors||[]).map(function(c){return '<option value="'+C.esc(c)+'" '+(p.paint===c?'selected':'')+'>'+C.esc(T.color(c))+'</option>'})).join('');
 var addOpts='<option value="">Dodaj kompatybilną część...</option>'+options.map(function(x){return '<option value="'+C.esc(x.category+'|'+x.name)+'">'+C.esc(T.category(x.category)+' — '+T.part(x.name))+'</option>'}).join('');
 modal('<div class="eyebrow">ZLECENIE KLIENTA • '+C.esc(p.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(p.vehicle.name)+'</h2><div class="cee-next-step"><b>Sprawdź projekt.</b> Jeśli wszystko się zgadza → <b>PRZYJMIJ ZLECENIE</b>. Potem w grze: terminal → <b>WEZWIJ NA STANOWISKO 1</b>.</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(p.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(p.registration))+'</b></div><div class="detail-box"><span>Kod śledzenia klienta</span><b>'+C.esc(p.trackingCode||'—')+'</b></div><div class="detail-box"><span>Cena zlecenia</span><b>'+(P?P.money(Number(p.priceTotal)||0):(Number(p.priceTotal)||0)+' $')+'</b></div></div><div style="margin-top:14px"><label class="field-label">LAKIER</label><select id="project-paint" class="input">'+colorOpts+'</select></div><h4>Modyfikacje</h4><div id="project-parts" class="part-list">'+parts+'</div><div style="display:flex;gap:8px;margin-top:10px"><select id="add-part" class="input">'+addOpts+'</select><button id="add-part-btn" class="btn ghost">Dodaj</button></div><label class="field-label" style="margin-top:16px">UWAGI</label><textarea id="project-note" class="input" rows="4">'+C.esc(p.note||'')+'</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="save-project-edit" class="btn ghost">ZAPISZ POPRAWKI</button><button id="create-order" class="btn primary">PRZYJMIJ ZLECENIE</button></div>');
 setTimeout(function(){
   function redraw(){q('#project-parts').innerHTML=(p.parts||[]).map(function(x,i){return '<span>'+C.esc(T.part(x.name))+(x.color?' • kolor: '+C.esc(x.color):'')+' <button data-rm-part="'+i+'" style="border:0;background:transparent;color:#e89aff;cursor:pointer">×</button></span>'}).join('')||'<span>Brak wybranych części</span>';qa('[data-rm-part]').forEach(function(b){b.onclick=function(){p.parts.splice(Number(b.getAttribute('data-rm-part')),1);redraw()}})}
   redraw();
   q('#add-part-btn').onclick=function(){
 var v=q('#add-part').value;if(!v)return;
 var a=v.split('|'),cat=a.shift(),name=a.join('|');p.parts=p.parts||[];
 var keys=p.parts.map(function(x){return x.category+'|'+x.name});
 var conflict=R?R.findConflict(keys,cat,name):null;
 if(conflict)return toast('Najpierw usuń „'+T.part(conflict.name)+'”. Ten slot może mieć tylko jeden element.');
 p.parts.push({category:cat,name:name});q('#add-part').selectedIndex=0;redraw()
};
   q('#save-project-edit').onclick=function(){p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();if(P){var calc=P.calculate(p.parts||[],p.services||[]);p.priceTotal=calc.total;p.mechanicCut=calc.mechanicCut;p.workshopCut=calc.workshopCut}C.saveProject(p);closeModal();renderProjects();toast('Poprawki i cena zapisane.')};
   q('#create-order').onclick=function(){
 p.paint=q('#project-paint').value||null;p.note=q('#project-note').value.trim();
 var conflicts=R?R.validateParts(p.parts||[]):[];
 if(conflicts.length){
  var x=conflicts[0];
  return toast('Konflikt części: „'+T.part(x.a.name)+'” i „'+T.part(x.b.name)+'”. Zostaw tylko jeden element tego slotu.')
 }
 if(P){var calc=P.calculate(p.parts||[],p.services||[]);p.priceTotal=calc.total;p.mechanicCut=calc.mechanicCut;p.workshopCut=calc.workshopCut}
 createOrderFromProject(p)
}
 },0)
}

function createOrderFromProject(p){
 var now=new Date().toISOString(),total=Number(p.priceTotal)||0,mech=Number(p.mechanicCut)||Math.round(total*0.65),order={id:C.orderId(),projectId:p.id,trackingCode:p.trackingCode||C.trackingCode(),createdAt:now,client:p.client,registration:p.registration,vehicle:p.vehicle,paint:p.paint||null,parts:(p.parts||[]).slice(),services:(p.services||[]).slice(),priceTotal:total,mechanicCut:mech,workshopCut:total-mech,note:p.note||'',status:'PRZYJĘCIE',bay:null,paymentMethod:'NIE USTALONO',paymentStatus:'NIEOPŁACONE',history:(p.history||[]).slice()};
 addHistory(order,'Projekt został przyjęty przez Cent\'s Detailing&Customs. Zostań przy recepcji. Warsztat wyśle ci wezwanie, kiedy możesz podjechać autem na stanowisko 1.');
 saveOrder(order);p.convertedOrderId=order.id;p.convertedAt=now;C.saveProject(p);closeModal();renderAll();setTab('orders');toast('Projekt przyjęty. Teraz w grze użyj terminala i wezwij klienta na stanowisko 1.');openOrder(order.id)
}

function renderOrders(){
 var list=C.listOrders(),filter=q('#order-filter').value;if(filter!=='all')list=list.filter(function(o){return o.status===filter});
 q('#order-list').innerHTML=list.length?list.map(function(o){return '<div class="order-row" data-order="'+C.esc(o.id)+'"><div><b>'+C.esc(o.id)+'</b><small>'+C.esc(o.client)+' • '+C.esc(C.formatReg(o.registration))+'</small></div><div><b>'+C.esc(o.vehicle.name)+'</b><small>Kod: '+C.esc(o.trackingCode||'—')+'</small></div><div><span class="status-pill">'+C.esc(o.status)+'</span></div><div><b>'+(o.bay||'—')+'</b><small>stanowisko</small></div><div>›</div></div>'}).join(''):'<div class="mini-empty">Brak zleceń.</div>';
 qa('[data-order]').forEach(function(el){el.onclick=function(){openOrder(el.getAttribute('data-order'))}})
}
q('#order-filter').onchange=renderOrders;

function openOrder(id){
 var o=C.listOrders().find(function(x){return x.id===id});if(!o)return;if(statuses.indexOf(o.status)<0)o.status='W TRAKCIE';
 var parts=(o.parts||[]).map(function(x){return '<span>'+C.esc(T.part(x.name||x))+(x.color?' • kolor: '+C.esc(x.color):'')+'</span>'}).join('')||'<span>Brak części</span>';
 var priced=P?P.calculate(o.parts||[],[]):{rows:[],total:Number(o.priceTotal)||0,mechanicCut:Number(o.mechanicCut)||0};
 if(o.priceTotal!=null&&Number(o.priceTotal)!==priced.total){priced.total=Number(o.priceTotal);priced.mechanicCut=Number(o.mechanicCut)||priced.mechanicCut}
 var payoutRows=(priced.rows||[]).map(function(r){return '<div class="detail-box"><span>'+C.esc(T.part(r.name||'Pozycja'))+' • '+P.money(r.price)+'</span><b>udział ~65%: '+P.money(r.mechanicPayout)+'</b></div>'}).join('');
 var bays=['','2','3','4','5','6','7','8'].map(function(b){return '<option value="'+b+'" '+(String(o.bay||'')===b?'selected':'')+'>'+(b?'Stanowisko '+b:'Jeszcze nie wybrano')+'</option>'}).join('');
 var guide=o.status==='PRZYJĘCIE'
  ?'<b>Teraz:</b> terminal w grze → WEZWIJ NA STANOWISKO 1 → oględziny → przydziel 2–8.'
  :o.status==='W TRAKCIE'
   ?'<b>Teraz:</b> wykonuj zakres zlecenia. Po skończeniu oznacz AUTO GOTOWE.'
   :o.status==='GOTOWE DO ODBIORU'
    ?'<b>Teraz:</b> kliknij PRZYGOTUJ RACHUNEK → wklej komendę w Minecraft → terminal → ROZLICZENIE / WYDANIE → wybierz stanowisko. Klient płaci w recepcji kartą albo gotówką.'
    :'<b>Zakończone.</b> Auto zostało wydane.';
 modal('<div class="eyebrow">'+C.esc(o.id)+'</div><h2 style="margin:0 0 8px">'+C.esc(o.vehicle.name)+'</h2><div class="cee-next-step">'+guide+'</div><div class="detail-grid" style="margin-top:12px"><div class="detail-box"><span>Klient</span><b>'+C.esc(o.client)+'</b></div><div class="detail-box"><span>Rejestracja</span><b>'+C.esc(C.formatReg(o.registration))+'</b></div><div class="detail-box"><span>Status</span><b>'+C.esc(o.status)+'</b></div><div class="detail-box"><span>Klient zapłaci</span><b>'+(P?P.money(Number(o.priceTotal)||0):(Number(o.priceTotal)||0)+' $')+'</b></div><div class="detail-box"><span>Twoja wypłata 65%</span><b>'+(P?P.money(Number(o.mechanicCut)||0):(Number(o.mechanicCut)||0)+' $')+'</b></div><div class="detail-box"><span>Kod statusu klienta</span><b>'+C.esc(o.trackingCode||'—')+'</b></div></div><h4>Podgląd pozycji — wypłata końcowa to dokładnie 65% całego rachunku</h4><div class="detail-grid">'+(payoutRows||'<div class="mini-empty">Brak pozycji do rozliczenia.</div>')+'</div><h4>Zakres zlecenia</h4><div class="part-list">'+parts+'</div><div class="modal-controls"><div><label class="field-label">STANOWISKO 2–8</label><select id="edit-bay" class="input">'+bays+'</select></div><div><label class="field-label">PŁATNOŚĆ</label><select id="edit-pay-method" class="input"><option '+(o.paymentMethod==='NIE USTALONO'?'selected':'')+'>NIE USTALONO</option><option '+(o.paymentMethod==='KARTA'?'selected':'')+'>KARTA</option><option '+(o.paymentMethod==='GOTÓWKA'?'selected':'')+'>GOTÓWKA</option></select></div></div><label class="field-label" style="margin-top:14px">WIADOMOŚĆ DLA KLIENTA</label><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="client-message" class="input" placeholder="Np. Część jest w drodze. Auto zostaje na stanowisku 4."><button id="send-client-message" class="btn ghost">DODAJ</button></div><label class="field-label" style="margin-top:14px">NOTATKI WARSZTATU</label><textarea id="order-note" class="input" rows="3">'+C.esc(o.note||'')+'</textarea><div id="simple-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div><h4>Historia / wiadomości klienta</h4><div class="message-list">'+((o.history||[]).length?(o.history||[]).slice().reverse().map(function(m){return '<div class="message"><b>'+new Date(m.at).toLocaleString('pl-PL')+'</b><span>'+C.esc(m.text)+'</span></div>'}).join(''):'<div class="mini-empty">Brak wiadomości.</div>')+'</div>');
 setTimeout(function(){
   function saveFields(){var b=q('#edit-bay').value;o.bay=b?Number(b):null;o.paymentMethod=q('#edit-pay-method').value;o.note=q('#order-note').value.trim();saveOrder(o)}
   var box=q('#simple-actions'),btn=['<button id="save-basic" class="btn ghost">ZAPISZ DANE</button>'];
   if(o.status==='PRZYJĘCIE')btn.push('<button id="start-work" class="btn primary">ROZPOCZNIJ PRACĘ</button>');
   if(o.status==='W TRAKCIE')btn.push('<button id="mark-ready" class="btn primary">AUTO GOTOWE</button>');
   if(o.status==='GOTOWE DO ODBIORU'){btn.push('<button id="prepare-bill" class="btn primary">PRZYGOTUJ RACHUNEK</button>');btn.push('<button id="finish-order" class="btn ghost">ZAMKNIJ NA STRONIE PO PŁATNOŚCI</button>');}
   box.innerHTML=btn.join('');
   q('#send-client-message').onclick=function(){var m=q('#client-message').value.trim();if(!m)return;addHistory(o,m);saveOrder(o);q('#client-message').value='';closeModal();openOrder(o.id);toast('Wiadomość zapisana.')};
   q('#save-basic').onclick=function(){saveFields();closeModal();renderAll();toast('Dane zapisane.')};
   if(q('#prepare-bill'))q('#prepare-bill').onclick=function(){
     var cmd='/trigger hsc_bill set '+Math.round(Number(o.priceTotal)||0);
     if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(cmd).then(function(){toast('Rachunek skopiowany. Wklej komendę w Minecraft.');}).catch(function(){window.prompt('Skopiuj komendę i wklej ją w Minecraft:',cmd);});}
     else window.prompt('Skopiuj komendę i wklej ją w Minecraft:',cmd);
   };
   if(q('#start-work'))q('#start-work').onclick=function(){if(!q('#edit-bay').value)return toast('Wybierz stanowisko 2–8.');saveFields();o.status='W TRAKCIE';addHistory(o,'Auto jest na stanowisku '+o.bay+'. Czekaj na informację z warsztatu.');saveOrder(o);closeModal();renderAll();toast('Praca rozpoczęta.')};
   if(q('#mark-ready'))q('#mark-ready').onclick=function(){saveFields();o.status='GOTOWE DO ODBIORU';addHistory(o,'Auto gotowe do odbioru. Wróć do recepcji Cent\'s Detailing&Customs.');saveOrder(o);closeModal();renderAll();toast('Auto gotowe.')};
   if(q('#finish-order'))q('#finish-order').onclick=function(){if(!confirm('Czy w Minecraft pojawił się komunikat PŁATNOŚĆ ZAKOŃCZONA i klient odebrał auto?'))return;saveFields();o.status='WYDANE';o.paymentStatus='OPŁACONE';addHistory(o,'Płatność została zrealizowana w Minecraft, a auto wydane. Zlecenie Cent\'s Detailing&Customs jest zakończone.');saveOrder(o);closeModal();renderAll();toast('Zlecenie zsynchronizowane z grą.')};
 },0)
}

function renderBays(){
 var active=C.listOrders().filter(function(o){return o.status!=='WYDANE'}),b=[{n:1,title:'PRZYJĘCIE AUTA',type:'intake'}];for(var i=2;i<=8;i++)b.push({n:i,title:'STANOWISKO UNIWERSALNE'});b.push({n:'P',title:'LAKIERNIA',type:'paint'});
 b.forEach(function(x){x.order=active.find(function(o){return o.bay===(x.n==='P'?'PAINT':x.n)})});
 q('#bay-grid').innerHTML=b.map(function(x){var o=x.order;return '<div class="bay '+(x.type||'')+'"><div class="bay-num">'+(x.n==='P'?'STREFA SPECJALNA':'STANOWISKO '+x.n)+'</div><h4>'+x.title+'</h4><div class="bay-status">'+(o?C.esc(o.status):'WOLNE')+'</div>'+(o?'<div class="bay-car">'+C.esc(o.vehicle.name)+'<br><span class="muted">'+C.esc(C.formatReg(o.registration))+' • '+C.esc(o.id)+'</span></div>':'')+'</div>'}).join('')
}

function getPartsOrders(){try{return JSON.parse(localStorage.getItem(PARTS_KEY)||'[]')}catch(e){return[]}}
function savePartsOrders(a){localStorage.setItem(PARTS_KEY,JSON.stringify(a))}

const CENTS_VALID_PART_IDS=new Set([11316043,12793415,20351911,23924084,38870799,44739527,49756079,54384158,55918972,88847639,104370957,109384145,116932450,128494942,137254784,138107598,160227850,164309139,166091375,171452022,183958164,190069777,193910064,194158506,203813862,212303047,219833782,221107415,226185421,249211112,253484210,257878212,258777824,267842027,271213845,274350172,275031290,276027433,283695483,284619646,297613685,304419070,314609651,316827608,328012926,331984582,346512173,371391705,378912194,380862055,382197772,384271848,386848320,392704627,397511040,401049467,402475541,404298779,404685324,414611775,423187356,423708243,434604705,437093149,438902612,441458785,441937346,445413045,449213361,450695811,456532035,458373868,460427176,465945662,470619043,484937562,490851791,495835410,496236543,508174532,510934160,513636736,513828007,528835150,533560753,553025149,553786508,557538451,561810862,561936916,563969593,569302698,589032321,591888643,597080450,598341003,609580740,613768143,614621440,615188619,615748362,624097191,630209539,633910569,643000098,655455836,660849053,661532052,664788051,666460757,670747060,674348109,679918904,684488038,687454278,689936870,695747446,705345097,711071371,714918838,725205977,725402794,726076956,738192256,740231337,742246033,742382733,743529046,755337131,756550131,762100875,785849719,785976564,789553395,797683942,799567057,808150159,808396732,816715696,821409042,827666071,830157772,838962909,848947585,849474885,855919822,867036841,869292734,872086095,878796207,879889721,881152085,888629499,894784477,904511782,905267110,912468739,918683070,920864490,921441717,927844438,948692917,961016170,967103578,970343758,979139575,981840379,984112809,984917818,996758231,1011179734,1024911957,1028830707,1038263265,1042573019,1058003581,1067881420,1069545120,1082336464,1087623691,1091414918,1096215543,1101389970,1111633660,1115682692,1119877977,1133539841,1150317460,1154273814,1163165125,1169310149,1188286482,1195793473,1199302415,1200220117,1207238574,1212738250,1218163464,1222631615,1226291222,1248574666,1248901058,1250494259,1251230322,1252836207,1265702800,1298966086,1318173283,1318649562,1321018434,1324355373,1327300131,1337237891,1341990696,1378598776,1411699972,1412647242,1417223894,1428536823,1433333259,1435581340,1437269734,1438184903,1438798260,1444243556,1444494082,1445314442,1446607121,1463499788,1472913373,1474617080,1482842907,1486473261,1494972566,1506250875,1511079781,1536834868,1551488971,1557994791,1558940330,1561243202,1565057423,1573728565,1578157703,1580681565,1581835042,1584923836,1585399588,1593149488,1602316944,1605506768,1618431394,1624154397,1625052737,1628509745,1650595452,1655058679,1658371914,1659581707,1669360227,1673258565,1677341548,1677415612,1684069219,1684174778,1684186747,1694749275,1695580752,1701956848,1704252623,1709767445,1727554050,1737223053,1740884774,1742380277,1744211228,1749199693,1749413392,1757856676,1761518005,1763663472,1771791677,1772799974,1773391471,1776024277,1784829067,1784915855,1789997063,1792146992,1793123517,1799634720,1809562827,1810534809,1811619432,1817734943,1836587282,1839740620,1840328631,1843113624,1844953199,1848685228,1851572155,1856080441,1856566183,1857893892,1867836733,1869679371,1874035432,1877637141,1880287661,1887328356,1894220559,1908107274,1918554286,1919301303,1931627823,1939802399,1950384704,1960226683,1970042919,1982698321,1989548248,1993672276,1998936298,2013020883,2015474402,2021134363,2029119780,2040627717,2041655565,2041963978,2054390311,2063320144,2066166724,2075275023,2081019274,2082179463,2098957671,2099344873,2105003120,2122315688,2123652571,2124024898,2126821575,2137218258,2139139321,2140234602,2140988490]);
function centsNormalizePartName(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'')}
function centsDeliveryId(name){
 var str=centsNormalizePartName(name),h=2166136261>>>0;
 for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
 return h&0x7fffffff
}
function centsCanDeliver(name){return centsDeliveryId(name)>0}
function deliveryCategoryFor(part){
 var c=String((part&&part.category)||'');
 if(c==='Engine upgrades'||c==='Performance'||c==='Nitrous')return 1;
 if(c==='Suspension')return 2;
 if(c==='Brakes')return 3;
 if(c==='Wheels / Rims'||c==='Tires')return 4;
 if(c==='Bodykit'||c==='Exterior')return 5;
 if(c==='Interior')return 6;
 if(c==='Instruments')return 7;
 return 8
}
function partOrderValue(part,index){
 return encodeURIComponent(JSON.stringify({i:index,c:part.category||'',n:part.name||'',col:part.color||''}))
}
function parsePartOrderValue(v){
 try{return JSON.parse(decodeURIComponent(v))}catch(e){return null}
}
function fillPartsForSelectedOrder(){
 var oid=q('#parts-order-id').value,sel=q('#parts-name'),hint=q('#parts-auto-category');
 if(!sel)return;
 if(!oid){
  sel.innerHTML='<option value="">Najpierw wybierz zlecenie...</option>';
  if(hint)hint.textContent='Kategoria dostawy ustawi się automatycznie.';
  return
 }
 var o=C.listOrders().find(function(x){return x.id===oid});
 var parts=o&&o.parts||[];
 if(!parts.length){
  sel.innerHTML='<option value="">To zlecenie nie ma części do zamówienia</option>';
  if(hint)hint.textContent='Klient nie wybrał żadnej części / modyfikacji.';
  return
 }
 sel.innerHTML='<option value="">Wybierz część...</option>'+parts.map(function(p,i){
   var label=T.part(p.name||p)+(p.color?' • '+p.color:'');
   return '<option value="'+partOrderValue(p,i)+'">'+C.esc(label)+'</option>'
 }).join('');
 if(hint)hint.textContent='Wybierz dokładnie tę część, którą chcesz sprowadzić.'
}
function updatePartCategoryHint(){
 var v=q('#parts-name').value,hint=q('#parts-auto-category');if(!hint)return;
 var p=parsePartOrderValue(v);
 if(!p){hint.textContent='Kategoria dostawy ustawi się automatycznie.';return}
 var id=deliveryCategoryFor({category:p.c,name:p.n}),cc=partCats.find(function(x){return x.id===id});
 hint.innerHTML='Dostawa: <b>'+C.esc(cc?cc.name:'Pozostałe części')+'</b> • 1 zestaw'
}
function renderPartsOrders(){
 var os=q('#parts-order-id');if(!os)return;
 var previous=os.value;
 var orders=C.listOrders().filter(function(o){return o.status==='W TRAKCIE'||o.status==='PRZYJĘCIE'});
 os.innerHTML='<option value="">Wybierz zlecenie...</option>'+orders.map(function(o){return '<option value="'+C.esc(o.id)+'">'+C.esc(o.id+' — '+o.vehicle.name+' — '+C.formatReg(o.registration))+'</option>'}).join('');
 if(previous&&orders.some(function(o){return o.id===previous}))os.value=previous;
 fillPartsForSelectedOrder();
 var all=getPartsOrders(),active=all.filter(function(x){return x.state!=='ODEBRANE'&&x.state!=='ANULOWANE'});
 q('#parts-count').textContent=active.length+' aktywnych';
 q('#parts-list').innerHTML=active.length?active.map(function(x){
   var i=all.indexOf(x);
   var state=x.state==='W DRODZE'?'W DRODZE':'DO URUCHOMIENIA';
   return '<div class="order-row" style="grid-template-columns:1.15fr 1.7fr .8fr auto"><div><b>'+C.esc(x.orderId)+'</b><small>'+C.esc(x.categoryName)+'</small></div><div><b>'+C.esc(x.name)+'</b><small>1 zestaw'+(x.color?' • '+C.esc(x.color):'')+'</small></div><div><span class="status-pill">'+C.esc(state)+'</span></div><div><button class="btn ghost" data-part-action="'+i+'" style="padding:8px 10px">OBSŁUŻ DOSTAWĘ</button></div></div>'
 }).join(''):'<div class="mini-empty">Brak aktywnych dostaw.</div>';
 qa('[data-part-action]').forEach(function(b){b.onclick=function(){openPartsAction(Number(b.getAttribute('data-part-action')))}})
}
q('#parts-order-id').onchange=function(){fillPartsForSelectedOrder();updatePartCategoryHint()};
q('#parts-name').onchange=updatePartCategoryHint;

function openPartsAction(i){
 var a=getPartsOrders(),x=a[i];if(!x)return;
 var cmd='/trigger hsc_part set '+x.deliveryId;
 if(x.state==='W DRODZE'){
  modal('<div class="eyebrow">DOSTAWA W DRODZE</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2><div class="cee-next-step"><b>Teraz nic nie wpisujesz na stronie.</b><br>Poczekaj, aż Minecraft poinformuje, że dostawa dotarła. W terminalu pracownika odbierz paczkę, a potem wróć tutaj i oznacz ją jako odebraną.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button id="parts-received" class="btn primary">PACZKA ODEBRANA</button><button id="parts-close" class="btn ghost">ZAMKNIJ</button></div>');
  setTimeout(function(){
   q('#parts-received').onclick=function(){x.state='ODEBRANE';savePartsOrders(a);closeModal();renderAll();toast('Dostawa zakończona.')};
   q('#parts-close').onclick=closeModal
  },0);
  return
 }
 modal('<div class="eyebrow">DOSTAWA CZĘŚCI</div><h2 style="margin-top:0">'+C.esc(x.name)+'</h2>'+
 '<div class="cee-next-step"><b>Ta komenda zamawia dokładnie wybraną część.</b><br>Skopiuj ją → wklej w Minecraft → po uruchomieniu dostawa sama losuje czas i półkę w magazynie.</div>'+
 '<label class="field-label" style="margin-top:15px">KOMENDA</label><input id="parts-command" class="input" readonly value="'+C.esc(cmd)+'">'+
 '<button id="copy-parts-command" class="btn primary wide" style="margin-top:10px">1. KOPIUJ KOMENDĘ</button>'+
 '<button id="mark-parts-sent" class="btn ghost wide" style="margin-top:8px">2. WPISAŁEM KOMENDĘ W GRZE</button>'+
 '<button id="remove-parts-order" class="btn danger wide" style="margin-top:8px">ANULUJ ZAMÓWIENIE</button>');
 setTimeout(function(){
  q('#copy-parts-command').onclick=function(){
   var t=q('#parts-command');t.select();
   try{document.execCommand('copy');toast('Skopiowano. Teraz wklej komendę w Minecraft.')}catch(e){toast('Zaznacz komendę i skopiuj ręcznie.')}
  };
  q('#mark-parts-sent').onclick=function(){
   x.state='W DRODZE';savePartsOrders(a);
   var o=C.listOrders().find(function(z){return z.id===x.orderId});
   if(o){addHistory(o,'Część „'+x.name+'” została zamówiona. Dostawa jest w drodze.');saveOrder(o)}
   closeModal();renderAll();toast('Okej — dostawa jest teraz oznaczona jako W DRODZE.')
  };
  q('#remove-parts-order').onclick=function(){x.state='ANULOWANE';savePartsOrders(a);closeModal();renderPartsOrders();toast('Zamówienie anulowane.')}
 },0)
}
q('#parts-create').onclick=function(){
 var oid=q('#parts-order-id').value,val=q('#parts-name').value;
 if(!oid)return toast('Najpierw wybierz zlecenie.');
 var picked=parsePartOrderValue(val);if(!picked)return toast('Wybierz część z listy.');
 var o=C.listOrders().find(function(x){return x.id===oid});if(!o)return toast('Nie znaleziono zlecenia.');
 var part=(o.parts||[])[Number(picked.i)];if(!part)return toast('Ta część nie jest już w zleceniu.');
 var cat=deliveryCategoryFor(part),cc=partCats.find(function(x){return x.id===cat});
 var rawName=part.name||part,name=T.part(rawName),color=part.color||'',deliveryId=centsDeliveryId(rawName);
 if(!centsCanDeliver(rawName))return toast('Ta część nie ma jeszcze potwierdzonego fizycznego itemu w GT Craft. Nie uruchamiam błędnej dostawy.');
 var a=getPartsOrders();
 if(a.some(function(x){return x.orderId===oid&&x.name===name&&x.color===color&&x.state!=='ODEBRANE'&&x.state!=='ANULOWANE'}))return toast('Ta część ma już aktywną dostawę.');
 a.unshift({id:'PART-'+Date.now(),orderId:oid,category:cat,categoryName:cc?cc.name:'Pozostałe części',name:name,rawName:rawName,deliveryId:deliveryId,color:color,qty:1,state:'DO URUCHOMIENIA',createdAt:new Date().toISOString()});
 savePartsOrders(a);q('#parts-name').value='';updatePartCategoryHint();renderPartsOrders();toast('Dodano do dostawy. Teraz kliknij OBSŁUŻ DOSTAWĘ.')
};

if(sessionStorage.getItem(SESSION)==='1'&&C.ownerPinExists())showApp();else showAuth();
})();