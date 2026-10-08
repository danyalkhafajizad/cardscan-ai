(function(){
const $=id=>document.getElementById(id);
const endpoint=$('researchServiceUrl');
endpoint.value=localStorage.getItem('cardscan_research_service')||'';
$('saveResearchService').onclick=()=>{
 let url=endpoint.value.trim().replace(/\/+$/,'');
 try{let u=new URL(url);if(u.protocol!=='https:')throw Error();localStorage.setItem('cardscan_research_service',url);alert('Research service saved.')}catch{alert('Enter a valid HTTPS Worker URL.')}
};
$('cancelResearch').onclick=()=>$('researchReview').classList.add('hidden');
$('researchCompany').onclick=async()=>{
 const btn=$('researchCompany'),status=$('researchStatus'),service=localStorage.getItem('cardscan_research_service')||'';
 if(!service){status.textContent='Setup required: open Backup → Online company research setup and enter your Worker URL.';return}
 let website=$('website').value.trim(),company=$('company').value.trim(),email=$('email').value.trim();
 if(!website&&email.includes('@'))website=email.split('@')[1];
 if(!website){status.textContent='Add the company website first, or an email address with a company domain.';return}
 btn.disabled=true;status.textContent='Reading the company website…';$('researchReview').classList.add('hidden');
 try{
  let u=new URL(service);u.searchParams.set('website',website);
  let ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),22000);
  let resp;try{resp=await fetch(u.toString(),{signal:ctrl.signal})}finally{clearTimeout(timer)}
  let data=await resp.json().catch(()=>({}));
  if(!resp.ok)throw Error(data.error||'Research service unavailable');
  if(!Array.isArray(data.specialties)||!data.specialties.length)throw Error('No reliable specialties found. Please review the website manually.');
  const source=data.source||website;
  $('researchDraft').value='Company Specialties'+(company?' — '+company:'')+'\n'+data.specialties.slice(0,6).map(x=>'• '+x).join('\n')+'\nSource: '+source;
  $('researchReview').classList.remove('hidden');status.textContent='Suggested from the company website. Please verify accuracy before adding.';
 }catch(e){status.textContent='Research unavailable: '+(e.name==='AbortError'?'request timed out':e.message)}
 finally{btn.disabled=false}
};
$('addResearchNotes').onclick=()=>{
 let draft=$('researchDraft').value.trim();if(!draft)return;
 let notes=$('notes');notes.value=[notes.value.trim(),draft].filter(Boolean).join('\n\n');
 $('researchReview').classList.add('hidden');$('researchStatus').textContent='Added to Notes. Tap Save Contact to keep it.';
};
})();