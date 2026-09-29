window.HSCCommon=(function(){
'use strict';
var PROJECTS_KEY='hsc_projects_v3';
var ORDERS_KEY='hsc_orders_v3';
var OWNER_HASH_KEY='hsc_staff_owner_hash_v1';
var OWNER_SALT_KEY='hsc_staff_owner_salt_v1';

function load(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
function save(key,v){localStorage.setItem(key,JSON.stringify(v))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function id(prefix){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return prefix+'-'+String(d.getFullYear()).slice(-2)+p(d.getMonth()+1)+p(d.getDate())+'-'+Math.random().toString(16).slice(2,6).toUpperCase()}
function projectId(){return id('PRJ')}
function orderId(){return id('HSC')}
function randomHex(bytes){
  var a=new Uint8Array(bytes||12);
  if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(a);
  else for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256);
  return Array.from(a).map(function(b){return b.toString(16).padStart(2,'0')}).join('').toUpperCase()
}
function trackingCode(){return 'HSC-'+randomHex(8)}
function normalizeChicago(v){
  var digits=String(v||'').replace(/\D/g,'').slice(-4);
  if(!digits)return '';
  return 'CHICAGO '+digits.padStart(4,'0')
}
function makeChicagoReg(v){
  var x=normalizeChicago(v);
  return {kind:'CHICAGO',canonical:x,display:x}
}
function formatReg(reg){
  if(!reg)return '—';
  if(typeof reg==='string')return reg;
  return reg.display||reg.canonical||'—'
}
function saveProject(p){var a=load(PROJECTS_KEY);var i=a.findIndex(function(x){return x.id===p.id});if(i>=0)a[i]=p;else a.unshift(p);save(PROJECTS_KEY,a);return p}
function listProjects(){return load(PROJECTS_KEY)}
function saveOrders(a){save(ORDERS_KEY,a)}
function listOrders(){return load(ORDERS_KEY)}
function saveOrder(o){var a=listOrders(),i=a.findIndex(function(x){return x.id===o.id});if(i>=0)a[i]=o;else a.unshift(o);saveOrders(a);return o}
function encode(obj,prefix){var s=unescape(encodeURIComponent(JSON.stringify(obj)));return prefix+':'+btoa(s)}
function decode(code,prefix){if(String(code).indexOf(prefix+':')!==0)throw new Error('BAD_PREFIX');return JSON.parse(decodeURIComponent(escape(atob(String(code).slice(prefix.length+1)))))}
function projectCode(p){return encode(p,'HSCP2')}
function parseProjectCode(c){
  if(String(c).indexOf('HSCP2:')===0)return decode(c,'HSCP2');
  if(String(c).indexOf('HSCP1:')===0)return decode(c,'HSCP1');
  throw new Error('BAD_PREFIX')
}
function randomSalt(){return randomHex(16).toLowerCase()}
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
return {
  PROJECTS_KEY:PROJECTS_KEY,ORDERS_KEY:ORDERS_KEY,
  esc:esc,projectId:projectId,orderId:orderId,trackingCode:trackingCode,
  normalizeChicago:normalizeChicago,makeChicagoReg:makeChicagoReg,formatReg:formatReg,
  saveProject:saveProject,listProjects:listProjects,saveOrder:saveOrder,listOrders:listOrders,saveOrders:saveOrders,
  projectCode:projectCode,parseProjectCode:parseProjectCode,
  setupOwnerPin:setupOwnerPin,ownerPinExists:ownerPinExists,verifyOwnerPin:verifyOwnerPin
};
})();