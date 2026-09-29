window.HSCI18N=(function(){
'use strict';

var cat={
 'Bodykit':'Nadwozie / pakiet karoserii',
 'Brakes':'Hamulce',
 'Engine upgrades':'Modyfikacje silnika',
 'Exterior':'Elementy zewnętrzne',
 'Instruments':'Wskaźniki / zegary',
 'Interior':'Wnętrze',
 'Performance':'Osiągi',
 'Suspension':'Zawieszenie',
 'Tires':'Opony',
 'Wheels / Rims':'Koła / felgi',
 'Nitrous':'Podtlenek azotu'
};

var colors={
 'White':'Biały','Black':'Czarny','Blue':'Niebieski','Red':'Czerwony','Green':'Zielony','Yellow':'Żółty','Gray':'Szary','Grey':'Szary','Silver':'Srebrny','Orange':'Pomarańczowy','Purple':'Fioletowy',
 'Custom':'Niestandardowy','Custom 1':'Niestandardowy 1','Custom 2':'Niestandardowy 2','Base':'Podstawowy','Police':'Policyjny','EGGS':'EGGS',
 'BlazeRed':'Ognista czerwień','SteelBlue':'Stalowy niebieski','TitaniumGrey':'Tytanowy szary','Special':'Specjalny','Special Yellow':'Specjalny żółty','Special Red':'Specjalny czerwony','Special Blue':'Specjalny niebieski',
 'Super Red':'Super czerwony','Midnight Purple Pearl':'Perłowy nocny fiolet','Spark Silver Metallic':'Srebrny metalik','Super Black':'Głęboka czerń','Two-Tone':'Dwukolorowy','Dark Blue':'Ciemnoniebieski',
 'Midnight Purple':'Nocny fiolet','Deep Marine Blue':'Głęboki morski niebieski','Sparkling Silver':'Lśniący srebrny','Pearl White':'Perłowy biały','Cranberry Red':'Żurawinowa czerwień',
 'Red Pearl':'Perłowy czerwony','DarkBlue Pearl':'Perłowy ciemnoniebieski','Crystal White':'Krystaliczny biały','Jetsilver Metalic':'Srebrny metalik','Nismo':'Nismo','Nismo Silver':'Nismo srebrny',
 'bayside Blue':'Bayside Blue (niebieski)','Silica Bless':'Silica Breath','Avtive Red':'Active Red (czerwony)','Millennium Jade':'Millennium Jade (jadeitowy)','Lightning Yellow':'Lightning Yellow (żółty)','Solid White':'Jednolity biały','Nismo White':'Nismo biały',
 'Pearl Red':'Perłowy czerwony','Yellow Pearl Metalic':'Żółty perłowy metalik','bluish Silver':'Niebieskawy srebrny','Purplish Blue':'Fioletowoniebieski','Sapphire Blue':'Szafirowy niebieski','Solid Black':'Jednolity czarny','Dark Green':'Ciemnozielony',
 'WorldRally Blue Mica':'World Rally Blue (niebieski)','Pure White':'Czysty biały','Black Mica':'Mika czarna','Silver Metalic':'Srebrny metalik',
 'DarkBlue':'Ciemnoniebieski','Special White':'Specjalny biały','Aurora':'Aurora (fioletowo-perłowy)'
};

var plates={
 'European License Plate':'Europejska tablica rejestracyjna',
 'European License Plate Union':'Europejska tablica — Unia Europejska',
 'European License Plate Norway':'Europejska tablica — Norwegia',
 'European License Plate Russia':'Europejska tablica — Rosja',
 'European License Plate Ukraine':'Europejska tablica — Ukraina'
};

var vehicleCat={
 'SUV':'SUV','Pickup':'Pickup','Inne':'Inne','Sedan / miejskie':'Sedan / miejskie',
 'Sport / Supercar':'Sportowe / supersamochody','Klasyki / JDM':'Klasyki / JDM','Moto / rower / ATV':'Motocykle / rowery / ATV'
};

var rules=[
 [/\bFrontbumper\b/gi,'przedni zderzak'],[/\bRearbumper\b/gi,'tylny zderzak'],[/\bFront Bumper\b/gi,'przedni zderzak'],[/\bRear Bumper\b/gi,'tylny zderzak'],
 [/\bFrontCanards\b/gi,'przednie canardy'],[/\bRearCanards\b/gi,'tylne canardy'],[/\bSideCanards\b/gi,'boczne canardy'],[/\bCanards\b/gi,'canardy'],
 [/\bFrontLips?\b/gi,'przedni lip'],[/\bFrontlips?\b/gi,'przedni lip'],[/\bRear Diffuser\b/gi,'tylny dyfuzor'],[/\bDiffuser\b/gi,'dyfuzor'],
 [/\bSideskirts\b/gi,'progi boczne'],[/\bSide Skirts\b/gi,'progi boczne'],[/\bFrontFender\b/gi,'przedni błotnik'],[/\bFrontfender\b/gi,'przedni błotnik'],[/\bRearFender\b/gi,'tylny błotnik'],[/\bRearfender\b/gi,'tylny błotnik'],[/\bFender\b/gi,'błotnik'],
 [/\bGT Spoiler\b/gi,'spoiler GT'],[/\bSpoiler\b/gi,'spoiler'],[/\bWing\b/gi,'skrzydło'],[/\bHood\b/gi,'maska'],
 [/\bGeneric Brake\b/gi,'uniwersalny zestaw hamulcowy'],[/\bStock Brake\b/gi,'fabryczny zestaw hamulcowy'],[/\bBrake\b/gi,'hamulec'],
 [/\bAir Cleaner\b/gi,'filtr powietrza'],[/\bIntake Manifold\b/gi,'kolektor dolotowy'],[/\bTurbo Kit\b/gi,'zestaw turbo'],[/\bSurgetank\b/gi,'zbiornik wyrównawczy'],
 [/\bTwin Muffler\b/gi,'podwójny tłumik'],[/\bMuffler\b/gi,'tłumik'],[/\bTowing Hook\b/gi,'hak holowniczy'],
 [/\bGear shift indicator\b/gi,'wskaźnik zmiany biegu'],[/\bNitrous Oxide Meter\b/gi,'wskaźnik podtlenku azotu'],[/\bNitrous Oxide\b/gi,'podtlenek azotu'],
 [/\bGlove compartment\b/gi,'schowek'],[/\bdashboard\b/gi,'deska rozdzielcza'],[/\bPillar Gauge\b/gi,'wskaźnik na słupku'],
 [/\bDefault Instrument\b/gi,'domyślny wskaźnik'],[/\bFuel Gauge\b/gi,'wskaźnik paliwa'],[/\bOil Gauge\b/gi,'wskaźnik oleju'],[/\bWater Gauge\b/gi,'wskaźnik temperatury cieczy'],[/\bBattery Gauge\b/gi,'wskaźnik akumulatora'],[/\bPSIgauge\b/gi,'wskaźnik ciśnienia doładowania'],[/\bGauge\b/gi,'wskaźnik'],
 [/\bGearshift\b/gi,'zmiany biegu'],[/\bTachometer\b/gi,'obrotomierz'],[/\bSpeedometer\b/gi,'prędkościomierz'],
 [/\bSteeringwheel\b/gi,'kierownica'],[/\bSteering Wheel\b/gi,'kierownica'],[/\bSteering\b/gi,'kierownica'],
 [/\bHandbrake\b/gi,'hamulec ręczny'],[/\bShiftlever\b/gi,'lewarek zmiany biegów'],[/\bTowerbar\b/gi,'rozpórka kielichów'],
 [/\bRollcage\b/gi,'klatka bezpieczeństwa'],[/\bRoll Cage\b/gi,'klatka bezpieczeństwa'],
 [/\bRear Seats\b/gi,'tylne fotele'],[/\bSeats\b/gi,'fotele'],[/\bRacing Seat\b/gi,'fotel wyścigowy'],[/\bSports Seat\b/gi,'fotel sportowy'],[/\bSeat\b/gi,'fotel'],
 [/\bUpgrade Kit\b/gi,'zestaw ulepszeń'],[/\bType([0-9]+)\b/gi,'typ $1'],[/\bType\b/gi,'typ'],
 [/\bSemiRacing\b/gi,'półwyścigowy'],[/\bSemi Racing\b/gi,'półwyścigowy'],[/\bRacing\b/gi,'wyścigowy'],[/\bSports\b/gi,'sportowy'],[/\bSport\b/gi,'sportowy'],
 [/\bStock\b/gi,'fabryczny'],[/\bCustom\b/gi,'niestandardowy'],[/\bGeneric\b/gi,'uniwersalny'],[/\bAdded\b/gi,'dodatkowy'],[/\bBasic\b/gi,'podstawowy'],
 [/\bBattery\b/gi,'akumulator'],[/\bFuel\b/gi,'paliwo'],[/\bOil\b/gi,'olej'],[/\bWater\b/gi,'ciecz chłodząca'],
 [/\bSuspension\b/gi,'zawieszenie'],[/\bfront\b/gi,'przednie'],[/\brear\b/gi,'tylne'],
 [/\bTires\b/gi,'opony'],[/\bTire\b/gi,'opona'],[/\bWheels\b/gi,'felgi'],[/\bWheel\b/gi,'felga']
];

function category(v){return cat[v]||v}
function color(v){return colors[v]||String(v||'').replace(/DarkBlue/g,'Ciemnoniebieski')}
function plate(v){return plates[v]||v}
function vcategory(v){return vehicleCat[v]||v}
function part(v){
 var s=String(v||'');
 // Chronimy nazwy własne marek przed tłumaczeniem zwykłych słów.
 s=s.replace(/GP Sports/g,'GP__SPORTS__');
 rules.forEach(function(r){s=s.replace(r[0],r[1])});
 s=s.replace(/GP__SPORTS__/g,'GP Sports');
 s=s.replace(/\s+/g,' ').replace(/\(\s+/g,'(').replace(/\s+\)/g,')').trim();
 return s;
}
return {category:category,color:color,plate:plate,vcategory:vcategory,part:part};
})();