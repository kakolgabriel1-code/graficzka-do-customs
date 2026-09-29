window.HSCPricing=(function(){
'use strict';

var servicePrices={
  diagnostyka:{name:'Diagnostyka pełna',price:1500},
  kola:{name:'Serwis kół / felg',price:2000},
  zawieszenie:{name:'Serwis zawieszenia',price:3000},
  hamulce:{name:'Serwis hamulców',price:2500},
  lakiernia:{name:'Lakiernia / zmiana lakieru',price:4000},
  detailing:{name:'Detailing / przygotowanie auta',price:1500}
};

var categoryPrices={
  'Bodykit':1500,
  'Exterior':1500,
  'Interior':1500,
  'Instruments':1500,
  'Wheels / Rims':2000,
  'Tires':2000,
  'Brakes':2500,
  'Suspension':3000,
  'Engine upgrades':3000,
  'Performance':3000,
  'Nitrous':3000
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
  return {rows:rows,total:total,mechanicCut:Math.round(total*0.35),workshopCut:total-Math.round(total*0.35)}
}
function publicTable(){
  return [
    ['Diagnostyka pełna',1500],
    ['Koła / felgi — serwis lub montaż',2000],
    ['Hamulce — serwis lub montaż',2500],
    ['Zawieszenie — serwis lub montaż',3000],
    ['Lakiernia / zmiana lakieru',4000],
    ['Zwykła część / element nadwozia / wnętrza',1500],
    ['Modyfikacja silnika / turbo / performance',3000],
    ['Detailing / przygotowanie auta',1500]
  ]
}

return {money:money,partPrice:partPrice,servicePrice:servicePrice,calculate:calculate,publicTable:publicTable,servicePrices:servicePrices,categoryPrices:categoryPrices};
})();