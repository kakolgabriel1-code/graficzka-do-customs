window.HSCBackend=(function(){
'use strict';
var cfg=window.HSC_BACKEND_CONFIG||{};
function enabled(){return !!(cfg.supabaseUrl&&cfg.supabaseAnonKey)}
function headers(extra){
  var h={'Content-Type':'application/json','apikey':cfg.supabaseAnonKey,'Authorization':'Bearer '+cfg.supabaseAnonKey};
  if(extra)Object.keys(extra).forEach(function(k){h[k]=extra[k]});
  return h
}
async function submitProject(project){
  if(!enabled())return {mode:'local',ok:true};
  var r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/rest/v1/projects',{
    method:'POST',
    headers:headers({'Prefer':'resolution=merge-duplicates,return=minimal'}),
    body:JSON.stringify({id:project.id,payload:project,tracking_code:project.trackingCode})
  });
  if(!r.ok)throw new Error('PROJECT_SYNC_'+r.status);
  return {mode:'online',ok:true}
}
async function publicStatus(trackingCode){
  if(enabled()){
    var r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/hsc_public_status',{
      method:'POST',
      headers:headers(),
      body:JSON.stringify({p_token:String(trackingCode||'').trim().toUpperCase()})
    });
    if(!r.ok)throw new Error('STATUS_'+r.status);
    var data=await r.json();
    return data||null
  }
  var orders=(window.HSCCommon&&HSCCommon.listOrders)?HSCCommon.listOrders():[];
  var o=orders.find(function(x){return String(x.trackingCode||'').toUpperCase()===String(trackingCode||'').trim().toUpperCase()});
  return o?{id:o.id,status:o.status,vehicle:o.vehicle,registration:o.registration,bay:o.bay,paymentStatus:o.paymentStatus,history:o.history||[]}:null
}
return {enabled:enabled,submitProject:submitProject,publicStatus:publicStatus};
})();