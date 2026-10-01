window.HSCPartRules=(function(){
'use strict';

function low(v){return String(v||'').toLowerCase()}
function has(n,re){return re.test(low(n))}

function slot(category,name){
  var c=String(category||''),n=low(name);

  if(c==='Brakes') return 'brakes:set';
  if(c==='Wheels / Rims') return 'wheels:set';
  if(c==='Tires') return 'tires:set';

  if(c==='Suspension'){
    if(/front/.test(n)) return 'suspension:front';
    if(/rear/.test(n)) return 'suspension:rear';
    return 'suspension:set';
  }

  if(c==='Engine upgrades'){
    if(/air cleaner/.test(n)) return 'engine:air-cleaner';
    if(/intake manifold/.test(n)) return 'engine:intake-manifold';
    if(/surgetank/.test(n)) return 'engine:surgetank';
    if(/turbo kit|upgrade kit/.test(n)) return 'engine:turbo-upgrade';
    return 'engine:other';
  }

  if(c==='Exterior'){
    if(/twin muffler|muffler/.test(n)) return 'exterior:muffler';
    if(/towing hook/.test(n)) return 'exterior:towing-hook';
    return 'exterior:other';
  }

  if(c==='Bodykit'){
    if(/frontbumper|front bumper/.test(n)) return 'body:front-bumper';
    if(/rearbumper|rear bumper/.test(n)) return 'body:rear-bumper';
    if(/frontfender|front fender/.test(n)) return 'body:front-fender';
    if(/rearfender|rear fender/.test(n)) return 'body:rear-fender';
    if(/sideskirts|side skirts|sidelips|side lips/.test(n)) return 'body:side-skirts';
    if(/hood/.test(n)) return 'body:hood';
    if(/spoiler|wing/.test(n)) return 'body:spoiler';
    if(/frontcanards|front canards/.test(n)) return 'body:front-canards';
    if(/rearcanards|rear canards/.test(n)) return 'body:rear-canards';
    if(/sidecanards|side canards/.test(n)) return 'body:side-canards';
    if(/canards/.test(n)) return 'body:canards';
    if(/frontlips|front lips|frontlip|front lip/.test(n)) return 'body:front-lip';
    if(/rear diffuser|diffuser/.test(n)) return 'body:rear-diffuser';
    return 'body:other';
  }

  if(c==='Interior'){
    if(/steering|momo prototipo|momo retro|momo tuner/.test(n)) return 'interior:steering-wheel';
    if(/rear seats/.test(n)) return 'interior:rear-seats';
    if(/seat|seats|recaro|sparco/.test(n)) return 'interior:front-seats';
    if(/shiftlever/.test(n)) return 'interior:shift-lever';
    if(/handbrake/.test(n)) return 'interior:handbrake';
    if(/rollcage|roll cage/.test(n)) return 'interior:roll-cage';
    if(/dashboard gauge/.test(n)) return 'interior:dashboard-gauge';
    if(/pillar gauge/.test(n)) return 'interior:pillar-gauge';
    if(/glove compartment gauge/.test(n)) return 'interior:glove-gauge';
    return 'interior:other';
  }

  if(c==='Instruments'){
    if(/fuel gauge/.test(n)) return 'instrument:fuel';
    if(/oil gauge/.test(n)) return 'instrument:oil';
    if(/water gauge/.test(n)) return 'instrument:water';
    if(/battery gauge/.test(n)) return 'instrument:battery';
    if(/psigauge|psi gauge/.test(n)) return 'instrument:boost';
    if(/tachometer/.test(n)) return 'instrument:tachometer';
    if(/speedometer/.test(n)) return 'instrument:speedometer';
    if(/gear shift indicator/.test(n)) return 'instrument:gear-indicator';
    if(/nitrous oxide meter/.test(n)) return 'instrument:nitrous-meter';
    return 'instrument:other';
  }

  if(c==='Performance'){
    if(/towerbar/.test(n)) return 'performance:towerbar';
    if(/suspension setter/.test(n)) return 'performance:suspension-setter';
    return 'performance:other';
  }

  if(c==='Nitrous') return 'nitrous:set';
  return 'other:'+c;
}

var labels={
 'brakes:set':'zestaw hamulcowy','wheels:set':'zestaw felg','tires:set':'zestaw opon',
 'suspension:front':'przednie zawieszenie','suspension:rear':'tylne zawieszenie','suspension:set':'zawieszenie',
 'engine:air-cleaner':'filtr powietrza','engine:intake-manifold':'kolektor dolotowy','engine:surgetank':'surge tank','engine:turbo-upgrade':'zestaw turbo / ulepszenie silnika',
 'exterior:muffler':'tłumik / wydech','exterior:towing-hook':'hak holowniczy',
 'body:front-bumper':'przedni zderzak','body:rear-bumper':'tylny zderzak','body:front-fender':'przedni błotnik','body:rear-fender':'tylny błotnik',
 'body:side-skirts':'progi / boczny pakiet','body:hood':'maska','body:spoiler':'spoiler','body:front-canards':'przednie canardy','body:rear-canards':'tylne canardy','body:side-canards':'boczne canardy','body:canards':'canardy','body:front-lip':'przedni lip','body:rear-diffuser':'tylny dyfuzor',
 'interior:steering-wheel':'kierownica','interior:rear-seats':'tylne fotele','interior:front-seats':'przednie fotele','interior:shift-lever':'lewarek zmiany biegów','interior:handbrake':'hamulec ręczny','interior:roll-cage':'klatka bezpieczeństwa','interior:dashboard-gauge':'wskaźnik na desce','interior:pillar-gauge':'wskaźnik na słupku','interior:glove-gauge':'wskaźnik przy schowku',
 'instrument:fuel':'wskaźnik paliwa','instrument:oil':'wskaźnik oleju','instrument:water':'wskaźnik temperatury','instrument:battery':'wskaźnik akumulatora','instrument:boost':'wskaźnik doładowania','instrument:tachometer':'obrotomierz','instrument:speedometer':'prędkościomierz','instrument:gear-indicator':'wskaźnik biegu','instrument:nitrous-meter':'wskaźnik podtlenku azotu',
 'performance:towerbar':'rozpórka kielichów','performance:suspension-setter':'regulator zawieszenia','nitrous:set':'zestaw podtlenku azotu'
};

function slotLabel(category,name){var s=slot(category,name);return labels[s]||'element tej samej pozycji montażowej'}

function description(category,name){
  var s=slot(category,name);
  var map={
   'brakes:set':'Kompletny zestaw hamulcowy. W aucie może być wybrany tylko jeden zestaw.',
   'wheels:set':'Komplet felg dla auta. Jednocześnie można zamontować tylko jeden model felg.',
   'tires:set':'Komplet opon. Jednocześnie można wybrać tylko jeden typ opon.',
   'suspension:front':'Element przedniego zawieszenia — zajmuje przedni slot zawieszenia.',
   'suspension:rear':'Element tylnego zawieszenia — zajmuje tylny slot zawieszenia.',
   'engine:air-cleaner':'Filtr powietrza do układu dolotowego. Można wybrać tylko jeden filtr.',
   'engine:intake-manifold':'Kolektor dolotowy silnika. To alternatywa dla innych kolektorów tego samego silnika.',
   'engine:surgetank':'Element układu paliwowego / dolotowego. Można wybrać jeden wariant.',
   'engine:turbo-upgrade':'Zestaw zwiększający osiągi silnika. Wybierasz jeden poziom / wariant zestawu.',
   'exterior:muffler':'Końcowy element układu wydechowego. Pojedynczy i podwójny tłumik są alternatywami.',
   'exterior:towing-hook':'Hak holowniczy / akcent zewnętrzny. Wybierasz jeden wariant.',
   'body:front-bumper':'Przedni zderzak bodykitu — zmienia wygląd przodu auta.',
   'body:rear-bumper':'Tylny zderzak bodykitu — zmienia wygląd tyłu auta.',
   'body:front-fender':'Przedni błotnik / poszerzenie. Wybierasz jeden wariant.',
   'body:rear-fender':'Tylny błotnik / poszerzenie. Wybierasz jeden wariant.',
   'body:side-skirts':'Progi / boczny element pakietu karoserii.',
   'body:hood':'Maska samochodu. Nie można zamontować dwóch masek naraz.',
   'body:spoiler':'Spoiler tylny. Nie można zamontować kilku spoilerów jednocześnie.',
   'body:front-canards':'Przednie canardy aerodynamiczne — jeden wariant na tę pozycję.',
   'body:rear-canards':'Tylne canardy aerodynamiczne — jeden wariant na tę pozycję.',
   'body:side-canards':'Boczne canardy aerodynamiczne — jeden wariant na tę pozycję.',
   'body:canards':'Zestaw canardów aerodynamicznych — jeden wariant na tę pozycję.',
   'body:front-lip':'Przedni lip / dokładka zderzaka — jeden wariant.',
   'body:rear-diffuser':'Tylny dyfuzor — jeden wariant.',
   'interior:steering-wheel':'Kierownica montowana zamiast obecnej. Wybierasz dokładnie jeden model.',
   'interior:front-seats':'Zestaw przednich foteli. Wybierasz jeden model foteli.',
   'interior:rear-seats':'Tylne fotele. To osobny slot od przednich foteli.',
   'interior:shift-lever':'Lewarek zmiany biegów. Wybierasz jeden model.',
   'interior:handbrake':'Hamulec ręczny. Wybierasz jeden model.',
   'interior:roll-cage':'Klatka bezpieczeństwa dopasowana do wnętrza auta. Jeden wariant.',
   'interior:dashboard-gauge':'Dodatkowy wskaźnik montowany na desce. Jeden wskaźnik na ten punkt montażowy.',
   'interior:pillar-gauge':'Dodatkowy wskaźnik montowany na słupku. Jeden wskaźnik na ten punkt montażowy.',
   'interior:glove-gauge':'Dodatkowy wskaźnik przy schowku. Jeden wskaźnik na ten punkt montażowy.',
   'instrument:fuel':'Wskaźnik poziomu paliwa. Wybierasz jeden styl tego wskaźnika.',
   'instrument:oil':'Wskaźnik oleju. Wybierasz jeden styl tego wskaźnika.',
   'instrument:water':'Wskaźnik temperatury cieczy. Wybierasz jeden styl.',
   'instrument:battery':'Wskaźnik akumulatora. Wybierasz jeden styl.',
   'instrument:boost':'Wskaźnik ciśnienia doładowania. Wybierasz jeden styl.',
   'instrument:tachometer':'Obrotomierz. Wybierasz jeden styl.',
   'instrument:speedometer':'Prędkościomierz. Wybierasz jeden styl.',
   'instrument:gear-indicator':'Wskaźnik aktualnego biegu. Wybierasz jeden wariant.',
   'instrument:nitrous-meter':'Wskaźnik podtlenku azotu. Wybierasz jeden wariant.',
   'performance:towerbar':'Rozpórka kielichów usztywniająca komorę. Jeden wariant.',
   'performance:suspension-setter':'Regulator ustawień zawieszenia.'
  };
  return map[s]||'Element modyfikacji przypisany do konkretnego miejsca montażowego w aucie.'
}

var exactVariantOptions={"GT Sports Air Cleaner":["żółty","niebieski","zielony","fioletowy"],"Yokohama Advan A052[Tail-Slide]":["czarny","czarny z oznaczeniem / naklejką"],"5Zigen T7R":["bazowy","czarny","brązowy","szary","srebrny"],"MOMO Tuner":["bazowy","ciemnoszary","srebrny"],"Rollcage Toyota AE86 Spec":["bazowy","czerwony","niebieski","biały","żółty"],"Yokohama Advan DB[Hi-Grip]":["czarny","czarny z oznaczeniem / naklejką"],"Generic Towerbar Type1":["czerwony","niebieski","zielony","fioletowy","żółty","biały","czarny"],"GT SemiRacing Air Cleaner":["czerwony","niebieski","zielony","fioletowy","żółty","biały"],"Rollcage Mazda RX-7 FC3S Spec":["bazowy","czerwony","niebieski","biały","żółty"],"Generic Towerbar Type2":["czarny","niebieski","zielony","fioletowy","żółty","biały","czerwony"],"Generic Shiftlever Type2":["bazowy","czerwony","niebieski","srebrny","czarny","brązowy"],"Generic Shiftlever Type3":["bazowy","czerwony","niebieski","srebrny","fioletowy"],"Generic Shiftlever Type1":["bazowy","czerwony","niebieski","srebrny","fioletowy"],"RAYS Volk Racing 21A":["bazowy","złoty","srebrny","szary","czerwony"],"RAYS Volk Racing CE28":["bazowy","biały","czerwono-szary","srebrno-czarny","czerwony","srebrno-szary","złoty","brązowy","czarny"],"Rollcage Toyota A80 Supra Spec":["bazowy","czerwony","niebieski","biały","żółty"],"Generic Shiftlever Type4":["bazowy","czerwony","niebieski","srebrny","fioletowy"],"Generic Rollcage Type2(Skyline Spec)":["bazowy","czerwony","niebieski","biały","żółty"],"Generic Handbrake Type2":["bazowy","czerwony","niebieski","srebrny","fioletowy"],"Sparco Seats":["bazowy","czarny","niebieski","biały","srebrny","żółty","zielony","różowy"],"Generic Handbrake Type1":["bazowy","czerwony","niebieski","srebrny","fioletowy"],"ADVAN Oni2":["bazowy","czarny","żółty","niebieski","złoty","srebrny"],"OZ Racing Superturismo":["bazowy","szary","srebrny","czarny"],"ADVAN RS2":["bazowy","czarny","ciemnozielony","niebieski","czerwony","złoty","srebrny","szary"],"ADVAN SA3":["bazowy","czarny","żółty","niebieski","czerwony","srebrny","brązowy"],"ENKEI RS05RR":["bazowy","srebrny","złoty","brązowy","szary"],"Generic Rear Seats":["bazowy","czerwony","niebieski"],"ENKEI RPF1":["bazowy","czarny","złoty","brązowy","szary","czerwony","niebieski"],"ADVAN RG3":["bazowy","czarny","brązowy","niebieski","czerwony","złoty"],"Yokohama Advan Apex[DynamicDrift]":["czarny","czarny z oznaczeniem / naklejką"],"RAYS Volk Racing 57C6":["bazowy","różowy","srebrny","niebieski","czerwony","żółty","czarny"],"BBS LM-R":["bazowy","czarny","złoty","szary","srebrny"],"ADVAN RT":["bazowy","czarny","srebrny"],"GT Towing Hook":["bazowy","czerwony","biały","niebieski","limonkowy","pomarańczowy"],"ADVAN GT":["bazowy","niebieski","brązowy","złoty","jasnozielony","czerwony","żółty"],"WORK Meister L1":["bazowy","złoty","czarny","szary","srebrny"],"RS Watanabe":["bazowy","złoty","brązowy"],"Recaro Seats":["bazowy","czarny","niebieski","biały","srebrny","żółty","zielony","różowy"],"Caron Sports Muffler":["wzór 1","wzór 2"],"ENKEI PF-06":["bazowy","czarny","złoty","czerwony"],"ENKEI PF-01":["bazowy","czarny","złoty"],"WORK Meister S1":["bazowy","złoty","czarny","srebrny"],"RAYS Volk Racing TE37 Gravel":["bazowy","czarny","brązowy","złoty"],"GT Towing Hook 2":["bazowy","czerwony","biały","niebieski","limonkowy","pomarańczowy"],"Panasport C5C":["bazowy","czarny","czerwony","złoty","srebrny"],"SuperAdvanRacing Ver2":["bazowy","złoty","szary","niebieski","czerwony","żółty"],"MOMO Prototipo":["czarny + srebrne ramiona","czarny"],"ADVAN RG-D2":["bazowy","czarny","złoty","niebieski","czerwony","brązowy"],"5Zigen ProRacer Z1":["bazowy","srebrny"],"GT Racing Air Cleaner":["niebieski","czerwony","zielony","fioletowy","żółty","biały"],"Rollcage Mazda RX-7 FD3S Spec":["bazowy","czerwony","niebieski","biały","żółty"],"MOMO Steering":["MOD.08 — bazowy","MOD.08 — niebieski","MOD.08 — czerwony","DRIFTING — niebieski","DRIFTING — pomarańczowy","DRIFTING — czerwony","DRIFTING — biały"],"Generic Rollcage Type1(Silvia Spec)":["bazowy","czerwony","niebieski","biały","żółty"],"OZ Racing Mito":["bazowy","szary"],"RAYS Volk Racing TE37":["bazowy","biały","zielony","niebieski","czerwony","żółty","jasnożółty","szary"],"5Zigen ProRacer ZR5F":["bazowy","czarny","srebrny"],"Recaro SR3":["bazowy","czarny","niebieski","biały","srebrny","żółty","zielony","różowy"],"OZ Racing Crono":["bazowy","srebrny","złoty","czarny"],"RAYS Volk Racing 57CR":["bazowy","czarny","srebrny","niebieski","czerwony","żółty"],"ENKEI GTC01RR":["bazowy","czarny","złoty","brązowy","szary","srebrny"],"WORK Meister CR01":["bazowy","złoty","brązowy","szary","czarny"],"Yokohama AVS Model T5":["bazowy","czarny","srebrny"],"OZ Racing Crono HT":["bazowy","srebrny"],"Rollcage Subaru Impreza GC8 Spec":["bazowy","czerwony","niebieski","biały","żółty"],"Caron Sports Twin Muffler":["wzór 1","wzór 2"],"ENKEI NT03RR":["bazowy","czarny","złoty","brązowy","szary","srebrny"]};

function colorOptions(category,name){
  var n=String(name||'');
  return exactVariantOptions[n]?exactVariantOptions[n].slice():[];
}

function deliveryQuantity(category,name){
  var s=slot(category,name);
  if(s==='wheels:set'||s==='tires:set')return 4;
  if(s==='interior:front-seats'||s==='interior:rear-seats')return 2;
  if(s==='suspension:front'||s==='suspension:rear')return 2;
  return 1;
}

function appearance(category,name){
  var c=String(category||''),n=String(name||''),l=low(n),s=slot(c,n);
  if(c==='Bodykit') return 'Kolor: dopasowany do lakieru / tekstury nadwozia auta.';
  if(c==='Wheels / Rims'){
    if(exactVariantOptions[n]) return 'Warianty kolorów: '+exactVariantOptions[n].join(', ')+'.';
    if(/stock|rims|wheels/i.test(n)) return 'Kolor: fabryczna kolorystyka felgi danego modelu.';
    return 'Kolor: bazowy wariant felgi z paczki GT Craft.';
  }
  if(c==='Tires') return 'Kolor: czarna opona; dostępny jest także wariant z oznaczeniem / naklejką.';
  if(c==='Brakes') return 'Wygląd: metaliczny, ciemny zestaw hamulcowy; kolorystyka zgodna z teksturą GT Craft.';
  if(s==='engine:air-cleaner'){
    if(/racing/i.test(n)&&!/semi/i.test(n)) return 'Warianty kolorów: niebieski, czerwony, zielony, fioletowy, żółty, biały.';
    if(/semiracing/i.test(n)) return 'Warianty kolorów: czerwony, niebieski, zielony, fioletowy, żółty, biały.';
    return 'Warianty kolorów: żółty, niebieski, zielony, fioletowy.';
  }
  if(s==='engine:turbo-upgrade'||s==='engine:intake-manifold'||s==='engine:surgetank') return 'Wygląd: metaliczny / techniczny, zgodny z modelem części GT Craft.';
  if(s==='exterior:muffler') return 'Wygląd: metaliczny wydech; dostępny także drugi wariant wzoru.';
  if(s==='exterior:towing-hook') return 'Warianty kolorów: bazowy, czerwony, biały, niebieski, limonkowy, pomarańczowy.';
  if(s==='interior:steering-wheel'){
    if(/momo retro/i.test(n)) return 'Kolor: czarna obręcz + srebrne ramiona.';
    if(/momo prototipo/i.test(n)) return 'Kolor: czarna obręcz + srebrne ramiona; jest też wariant czarny.';
    if(/momo steeringwheel 1/i.test(n)) return 'Kolor: czarny / ciemnoszary.';
    if(/momo steeringwheel 2/i.test(n)) return 'Kolor: ciemny; część korzysta z tekstury pojazdu.';
    if(/momo tuner/i.test(n)) return 'Warianty: bazowy, ciemnoszary, srebrny.';
    if(/^momo steering$/i.test(n)) return 'Warianty MOMO MOD.08 i DRIFTING; akcenty: niebieski, czerwony, pomarańczowy lub biały.';
    return 'Kolor: fabryczna / ciemna kolorystyka kierownicy zgodna z modelem.';
  }
  if(s==='interior:front-seats'){
    if(/recaro|sparco/i.test(n)) return 'Warianty kolorów: bazowy, czarny, niebieski, biały, srebrny, żółty, zielony, różowy.';
    return 'Kolor: fabryczna kolorystyka fotela z paczki.';
  }
  if(s==='interior:rear-seats') return 'Warianty kolorów: bazowy, czerwony, niebieski.';
  if(s==='interior:roll-cage') return 'Warianty kolorów: bazowy, czerwony, niebieski, biały, żółty.';
  if(s==='interior:shift-lever'){
    if(/type2/i.test(n)) return 'Warianty kolorów: bazowy, czerwony, niebieski, srebrny, czarny, brązowy.';
    return 'Warianty kolorów: bazowy, czerwony, niebieski, srebrny, fioletowy.';
  }
  if(s==='interior:handbrake') return 'Warianty kolorów: bazowy, czerwony, niebieski, srebrny / fioletowy zależnie od modelu.';
  if(s==='performance:towerbar') return 'Warianty kolorów: czerwony, niebieski, zielony, fioletowy, żółty, biały, czarny.';
  if(c==='Instruments'||/gauge/.test(l)) return 'Wygląd: ciemna obudowa i czytelna tarcza; stylistyka Basic / Spec.A / Spec.B / Spec.C zależy od wybranego modelu.';
  if(c==='Suspension') return 'Wygląd: metaliczny / techniczny element zawieszenia.';
  return 'Wygląd / kolor: bazowa tekstura tej części z paczki GT Craft.'
}

function findConflict(selectedKeys,category,name){
  var target=slot(category,name),arr=selectedKeys||[];
  for(var i=0;i<arr.length;i++){
    var a=String(arr[i]).split('|'),cat=a.shift(),part=a.join('|');
    if(slot(cat,part)===target&&!(cat===category&&part===name)) return {key:arr[i],category:cat,name:part,slot:target}
  }
  return null
}

function validateParts(parts){
  var seen={},conflicts=[];
  (parts||[]).forEach(function(p){
    var cat=typeof p==='string'?String(p).split('|')[0]:p.category;
    var name=typeof p==='string'?String(p).split('|').slice(1).join('|'):p.name;
    var s=slot(cat,name);
    if(seen[s])conflicts.push({slot:s,a:seen[s],b:{category:cat,name:name}});
    else seen[s]={category:cat,name:name}
  });
  return conflicts
}

return {slot:slot,slotLabel:slotLabel,description:description,appearance:appearance,colorOptions:colorOptions,deliveryQuantity:deliveryQuantity,findConflict:findConflict,validateParts:validateParts};
})();