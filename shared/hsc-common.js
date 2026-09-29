window.HSCCommon=(function(){
'use strict';
var PROJECTS_KEY='hsc_projects_v2';
var ORDERS_KEY='hsc_orders_v2';
var OWNER_HASH_KEY='hsc_staff_owner_hash_v1';
var OWNER_SALT_KEY='hsc_staff_owner_salt_v1';

var plateStyles=[
  'European License Plate',
  'European License Plate Union',
  'European License Plate Norway',
  'European License Plate Russia',
  'European License Plate Ukraine'
];

var cnRegions=[
 ['BJ','京','Beijing'],['SH','沪','Shanghai'],['GD','粤','Guangdong'],['JS','苏','Jiangsu'],
 ['ZJ','浙','Zhejiang'],['SD','鲁','Shandong'],['SC','川','Sichuan'],['HB','鄂','Hubei'],
 ['HN','湘','Hunan'],['FJ','闽','Fujian'],['HE','冀','Hebei'],['HA','豫','Henan'],
 ['LN','辽','Liaoning'],['JL','吉','Jilin'],['HL','黑','Heilongjiang'],['AH','皖','Anhui'],
 ['JX','赣','Jiangxi'],['GX','桂','Guangxi'],['HI','琼','Hainan'],['GZ','贵','Guizhou'],
 ['YN','云','Yunnan'],['XZ','藏','Tibet'],['SN','陕','Shaanxi'],['GS','甘','Gansu'],
 ['QH','青','Qinghai'],['NX','宁','Ningxia'],['XJ','新','Xinjiang'],['TJ','津','Tianjin'],
 ['CQ','渝','Chongqing'],['NM','蒙','Inner Mongolia'],['SX','晋','Shanxi']
];

var jpRegions=[
 ['SHINAGAWA','品川','Shinagawa'],
 ['NERIMA','練馬','Nerima'],
 ['ADACHI','足立','Adachi'],
 ['TAMA','多摩','Tama'],
 ['HACHIOJI','八王子','Hachioji'],
 ['YOKOHAMA','横浜','Yokohama'],
 ['KAWASAKI','川崎','Kawasaki'],
 ['SAGAMI','相模','Sagami'],
 ['CHIBA','千葉','Chiba'],
 ['NARITA','成田','Narita'],
 ['OMIYA','大宮','Omiya'],
 ['TOKOROZAWA','所沢','Tokorozawa'],
 ['OSAKA','大阪','Osaka'],
 ['NANIWA','なにわ','Naniwa'],
 ['KYOTO','京都','Kyoto'],
 ['KOBE','神戸','Kobe'],
 ['NAGOYA','名古屋','Nagoya'],
 ['FUKUOKA','福岡','Fukuoka'],
 ['SAPPORO','札幌','Sapporo']
];

var jpKana=[
 ['SA','さ'],['SU','す'],['SE','せ'],['SO','そ'],
 ['TA','た'],['CHI','ち'],['TSU','つ'],['TE','て'],['TO','と'],
 ['NA','な'],['NI','に'],['NU','ぬ'],['NE','ね'],['NO','の'],
 ['HA','は'],['HI','ひ'],['FU','ふ'],['HO','ほ'],
 ['MA','ま'],['MI','み'],['MU','む'],['ME','め'],['MO','も'],
 ['YA','や'],['YU','ゆ'],['YO','よ'],
 ['RA','ら'],['RI','り'],['RU','る'],['RO','ろ'],
 ['WA','わ'],['RE','れ']
];

function load(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
function save(key,v){localStorage.setItem(key,JSON.stringify(v))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function id(prefix){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return prefix+'-'+String(d.getFullYear()).slice(-2)+p(d.getMonth()+1)+p(d.getDate())+'-'+Math.random().toString(16).slice(2,6).toUpperCase()}
function projectId(){return id('PRJ')}
function orderId(){return id('HSC')}
function normalizeLatin(v){return String(v||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 -]/g,'').replace(/\s+/g,' ').trim().slice(0,18)}
function makeChinaReg(regionCode,letter,suffix){
  var r=cnRegions.find(function(x){return x[0]===regionCode})||cnRegions[0];
  var l=String(letter||'A').toUpperCase().replace(/[^A-Z]/g,'').slice(0,1)||'A';
  var s=String(suffix||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
  return {kind:'CN',canonical:'CN-'+r[0]+'-'+l+s,display:r[1]+l+'·'+s,region:r[0],regionName:r[2],letter:l,suffix:s};
}
function makeJapanReg(regionCode,classNo,kanaCode,serial){
  var r=jpRegions.find(function(x){return x[0]===regionCode})||jpRegions[0];
  var k=jpKana.find(function(x){return x[0]===kanaCode})||jpKana[0];
  var cls=String(classNo||'330').replace(/[^0-9]/g,'').slice(0,3)||'330';
  var ser=String(serial||'').replace(/[^0-9]/g,'').slice(0,4);
  while(ser.length<4)ser='0'+ser;
  var shown=ser.slice(0,2)+'-'+ser.slice(2);
  return {kind:'JP',canonical:'JP-'+r[0]+'-'+cls+'-'+k[0]+'-'+ser,display:r[1]+' '+cls+' '+k[1]+' '+shown,region:r[0],regionName:r[2],classNo:cls,kana:k[0],serial:ser};
}
function makeLatinReg(value){var x=normalizeLatin(value);return {kind:'LATIN',canonical:x,display:x}}
function formatReg(reg){
  if(!reg)return '—';
  if(typeof reg==='string')return reg;
  if(reg.kind==='JP'){
    var jr=jpRegions.find(function(x){return x[0]===reg.region})||jpRegions[0];
    var jk=jpKana.find(function(x){return x[0]===reg.kana})||jpKana[0];
    var ser=String(reg.serial||'0000').padStart(4,'0');
    return jr[1]+' '+(reg.classNo||'330')+' '+jk[1]+' '+ser.slice(0,2)+'-'+ser.slice(2);
  }
  if(reg.kind==='CN'){
    var r=cnRegions.find(function(x){return x[0]===reg.region})||cnRegions[0];
    return r[1]+(reg.letter||'A')+'·'+(reg.suffix||'');
  }
  return reg.display||reg.canonical||'—';
}
function saveProject(p){var a=load(PROJECTS_KEY);var i=a.findIndex(function(x){return x.id===p.id});if(i>=0)a[i]=p;else a.unshift(p);save(PROJECTS_KEY,a);return p}
function listProjects(){return load(PROJECTS_KEY)}
function saveOrders(a){save(ORDERS_KEY,a)}
function listOrders(){return load(ORDERS_KEY)}
function saveOrder(o){var a=listOrders(),i=a.findIndex(function(x){return x.id===o.id});if(i>=0)a[i]=o;else a.unshift(o);saveOrders(a);return o}
function encode(obj,prefix){var s=unescape(encodeURIComponent(JSON.stringify(obj)));return prefix+':'+btoa(s)}
function decode(code,prefix){if(String(code).indexOf(prefix+':')!==0)throw new Error('BAD_PREFIX');return JSON.parse(decodeURIComponent(escape(atob(String(code).slice(prefix.length+1)))))}
function projectCode(p){return encode(p,'HSCP1')}
function parseProjectCode(c){return decode(c,'HSCP1')}
function randomSalt(){var arr=new Uint8Array(16);crypto.getRandomValues(arr);return Array.from(arr).map(function(b){return b.toString(16).padStart(2,'0')}).join('')}
async function sha256(v){var b=new TextEncoder().encode(v),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')}
async function setupOwnerPin(pin){
  if(String(pin).length<4)throw new Error('PIN_SHORT');
  var salt=randomSalt(),hash=await sha256(salt+'|'+pin);
  localStorage.setItem(OWNER_SALT_KEY,salt);localStorage.setItem(OWNER_HASH_KEY,hash);return true
}
function ownerPinExists(){return !!localStorage.getItem(OWNER_HASH_KEY)}
async function verifyOwnerPin(pin){
  var salt=localStorage.getItem(OWNER_SALT_KEY)||'',expected=localStorage.getItem(OWNER_HASH_KEY)||'';
  if(!salt||!expected)return false;
  return (await sha256(salt+'|'+pin))===expected
}
function platesForVehicle(v){return v&&(v.pack==='BRCC'||v.pack==='New Cars')?plateStyles.slice():[]}
return {
  PROJECTS_KEY:PROJECTS_KEY,ORDERS_KEY:ORDERS_KEY,plateStyles:plateStyles,cnRegions:cnRegions,jpRegions:jpRegions,jpKana:jpKana,
  esc:esc,projectId:projectId,orderId:orderId,normalizeLatin:normalizeLatin,makeChinaReg:makeChinaReg,makeJapanReg:makeJapanReg,makeLatinReg:makeLatinReg,formatReg:formatReg,
  saveProject:saveProject,listProjects:listProjects,saveOrder:saveOrder,listOrders:listOrders,saveOrders:saveOrders,
  projectCode:projectCode,parseProjectCode:parseProjectCode,setupOwnerPin:setupOwnerPin,ownerPinExists:ownerPinExists,verifyOwnerPin:verifyOwnerPin,
  platesForVehicle:platesForVehicle
};
})();