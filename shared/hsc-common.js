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
function makeLatinReg(value){var x=normalizeLatin(value);return {kind:'LATIN',canonical:x,display:x}}
function formatReg(reg){
  if(!reg)return '—';
  if(typeof reg==='string')return reg;
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
  PROJECTS_KEY:PROJECTS_KEY,ORDERS_KEY:ORDERS_KEY,plateStyles:plateStyles,cnRegions:cnRegions,
  esc:esc,projectId:projectId,orderId:orderId,normalizeLatin:normalizeLatin,makeChinaReg:makeChinaReg,makeLatinReg:makeLatinReg,formatReg:formatReg,
  saveProject:saveProject,listProjects:listProjects,saveOrder:saveOrder,listOrders:listOrders,saveOrders:saveOrders,
  projectCode:projectCode,parseProjectCode:parseProjectCode,setupOwnerPin:setupOwnerPin,ownerPinExists:ownerPinExists,verifyOwnerPin:verifyOwnerPin,
  platesForVehicle:platesForVehicle
};
})();