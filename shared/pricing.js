window.HSCPricing=(function(){
'use strict';

var servicePrices={
  diagnostyka:{name:'Diagnostyka pełna',price:750},
  kola:{name:'Serwis kół / felg',price:1000},
  zawieszenie:{name:'Serwis zawieszenia',price:1500},
  hamulce:{name:'Serwis hamulców',price:1250},
  lakiernia:{name:'Lakiernia / zmiana lakieru',price:2000},
  detailing:{name:'Detailing / przygotowanie auta',price:750}
};

var categoryPrices={
  'Bodykit':1250,
  'Exterior':750,
  'Interior':750,
  'Instruments':600,
  'Wheels / Rims':1000,
  'Tires':750,
  'Brakes':1250,
  'Suspension':1500,
  'Engine upgrades':1500,
  'Performance':1500,
  'Nitrous':1750
};

function money(n){
  return new Intl.NumberFormat('pl-PL').format(Math.max(0,Math.round(Number(n)||0)))+' $'
}
function lower(v){return String(v||'').toLowerCase()}

function partPrice(category,name){
  var cat=String(category||''),n=lower(name),base=categoryPrices[cat]||750;

  // Nadwozie / pakiety karoserii
  if(cat==='Bodykit'){
    if(/full|complete|body ?kit|wide ?body|aero ?kit|kit/.test(n)) return 2000;
    if(/bumper|zderzak|hood|bonnet|maska|fender|błotnik|fender/.test(n)) return 1250;
    if(/side ?skirt|progi|diffuser|dyfuzor/.test(n)) return 1000;
    if(/spoiler|wing|skrzyd|lip|splitter/.test(n)) return 750;
    if(/canard/.test(n)) return 500;
  }

  // Elementy zewnętrzne
  if(cat==='Exterior'){
    if(/hood|bonnet|maska|bumper|zderzak|fender|błotnik/.test(n)) return 1250;
    if(/spoiler|wing|diffuser|splitter|lip/.test(n)) return 750;
    if(/mirror|luster|grill|grille/.test(n)) return 600;
  }

  // Wnętrze
  if(cat==='Interior'){
    if(/seat|recaro|fotel/.test(n)) return 1000;
    if(/roll ?cage|klat/.test(n)) return 1500;
    if(/steering|kierown/.test(n)) return 750;
    if(/shift|shifter|lewarek|gałk/.test(n)) return 500;
  }

  // Zegary / wskaźniki
  if(cat==='Instruments'){
    if(/gauge|meter|wskaź|instrument/.test(n)) return 600;
  }

  // Koła i opony
  if(cat==='Wheels / Rims') return 1000;
  if(cat==='Tires') return 750;

  // Hamulce
  if(cat==='Brakes'){
    if(/big|sport|race|racing|performance|upgrade/.test(n)) return 1500;
    return 1250;
  }

  // Zawieszenie
  if(cat==='Suspension'){
    if(/coil|sport|race|racing|drift|upgrade/.test(n)) return 1750;
    return 1500;
  }

  // Silnik / osiągi
  if(cat==='Engine upgrades'){
    if(/turbo|supercharger|charger|nitro|nos/.test(n)) return 2000;
    if(/intake|manifold|air ?cleaner|surge|intercooler/.test(n)) return 1250;
    if(/muffler|exhaust|wydech/.test(n)) return 1000;
    return 1500;
  }
  if(cat==='Performance'){
    if(/turbo|supercharger|charger|race|racing|stage|upgrade/.test(n)) return 2000;
    return 1500;
  }
  if(cat==='Nitrous') return 1750;

  return base
}

function serviceRecord(value){
  var raw=typeof value==='string'?value:(value&&(value.id||value.name))||'';
  if(servicePrices[raw])return {id:raw,name:servicePrices[raw].name,price:servicePrices[raw].price};
  var key=Object.keys(servicePrices).find(function(k){return lower(servicePrices[k].name)===lower(raw)});
  if(key)return {id:key,name:servicePrices[key].name,price:servicePrices[key].price};
  return {id:raw,name:raw||'Usługa',price:750}
}
function servicePrice(value){return serviceRecord(value).price}

function calculate(parts,services){
  var rows=[],total=0;
  (parts||[]).forEach(function(x){
    var cat=typeof x==='string'?String(x).split('|')[0]:x.category;
    var name=typeof x==='string'?String(x).split('|').slice(1).join('|'):x.name;
    var price=partPrice(cat,name),payout=Math.round(price*0.65);
    rows.push({type:'part',category:cat,name:name,price:price,mechanicPayout:payout,workshopShare:price-payout});
    total+=price
  });
  (services||[]).forEach(function(x){
    var rec=serviceRecord(x),payout=Math.round(rec.price*0.65);
    rows.push({type:'service',id:rec.id,name:rec.name,price:rec.price,mechanicPayout:payout,workshopShare:rec.price-payout});
    total+=rec.price
  });
  var mechanicCut=rows.reduce(function(sum,row){return sum+(row.mechanicPayout||0)},0);
  return {rows:rows,total:total,mechanicCut:mechanicCut,workshopCut:total-mechanicCut}
}

function publicTable(){
  return [
    ['Diagnostyka pełna',750],
    ['Koła / felgi — serwis',1000],
    ['Hamulce — serwis',1250],
    ['Zawieszenie — serwis',1500],
    ['Lakiernia / zmiana lakieru',2000],
    ['Detailing / przygotowanie auta',750],
    ['Modyfikacje nadwozia', '500–2 000 $'],
    ['Wnętrze', '500–1 500 $'],
    ['Koła / felgi — modyfikacja',1000],
    ['Opony — modyfikacja',750],
    ['Hamulce — modyfikacja','1 250–1 500 $'],
    ['Zawieszenie — modyfikacja','1 500–1 750 $'],
    ['Silnik / turbo / performance','1 000–2 000 $']
  ]
}

return {
  money:money,partPrice:partPrice,servicePrice:servicePrice,serviceRecord:serviceRecord,
  calculate:calculate,publicTable:publicTable,servicePrices:servicePrices,categoryPrices:categoryPrices
};
})();