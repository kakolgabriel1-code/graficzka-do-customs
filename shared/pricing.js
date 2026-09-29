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
  'Bodykit':750,
  'Exterior':750,
  'Interior':750,
  'Instruments':750,
  'Wheels / Rims':1000,
  'Tires':1000,
  'Brakes':1250,
  'Suspension':1500,
  'Engine upgrades':1500,
  'Performance':1500,
  'Nitrous':1500
};

function money(n){
  return new Intl.NumberFormat('pl-PL').format(Math.max(0,Math.round(Number(n)||0)))+' $'
}
function partPrice(category){
  return categoryPrices[category]||1500
}
function servicePrice(id){
  return servicePrices[id]?servicePrices[id].price:1500
}
function calculate(parts,services){
  var rows=[],total=0;
  (parts||[]).forEach(function(p){
    var cat=typeof p==='string'?String(p).split('|')[0]:p.category;
    var name=typeof p==='string'?String(p).split('|').slice(1).join('|'):p.name;
    var price=partPrice(cat);
    rows.push({type:'part',category:cat,name:name,price:price});
    total+=price
  });
  (services||[]).forEach(function(s){
    var id=typeof s==='string'?s:(s.id||'');
    var rec=servicePrices[id]||{name:(s.name||id||'Usługa'),price:1500};
    rows.push({type:'service',id:id,name:rec.name,price:rec.price});
    total+=rec.price
  });
  return {rows:rows,total:total,mechanicCut:Math.round(total*0.65),workshopCut:total-Math.round(total*0.65)}
}
function publicTable(){
  return [
    ['Diagnostyka pełna',750],
    ['Koła / felgi — serwis lub montaż',1000],
    ['Hamulce — serwis lub montaż',1250],
    ['Zawieszenie — serwis lub montaż',1500],
    ['Lakiernia / zmiana lakieru',2000],
    ['Zwykła część / element nadwozia / wnętrza',750],
    ['Modyfikacja silnika / turbo / performance',1500],
    ['Detailing / przygotowanie auta',750]
  ]
}

return {money:money,partPrice:partPrice,servicePrice:servicePrice,calculate:calculate,publicTable:publicTable,servicePrices:servicePrices,categoryPrices:categoryPrices};
})();