// CardScan AI research helper for Cloudflare Workers.
// Public websites only; no photos or saved contacts are uploaded.
// Website headings, descriptions and relevant list items are extracted as suggestions.
const ALLOWED_HOST=/^[a-z0-9.-]+\.[a-z]{2,}$/i;
const BAD_HOST=/(^|\.)(localhost|local|internal|test|invalid|example|workers\.dev)$/i;
const BAD_IP=/^(?:\d{1,3}\.){3}\d{1,3}$/;
const SKIP=/^(home|about us|contact us|learn more|read more|menu|services|products|solutions|overview|our company|careers|news|blog|privacy policy|terms|click here|view all|discover more|subscribe|request a quote|send message|submit)$/i;
function safeUrl(raw){
 raw=String(raw||'').trim();if(!/^https?:\/\//i.test(raw))raw='https://'+raw;
 let u=new URL(raw);
 let h=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.port||!ALLOWED_HOST.test(h)||BAD_HOST.test(h)||BAD_IP.test(h)||h.includes('..')||h.startsWith('-'))throw Error('Enter a public HTTPS company website.');
 u.username='';u.password='';u.hash='';u.search='';
 return u;
}
class Collect {
 constructor(){this.current='';this.items=[];this.active=false}
 element(e){this.active=true;this.current='';e.onEndTag(()=>{let v=this.current.replace(/\s+/g,' ').trim();if(v&&v.length>=12&&v.length<=180)this.items.push(v);this.active=false})}
 text(t){if(this.active)this.current+=t.text}
}
class Meta{constructor(){this.items=[]}element(e){let key=(e.getAttribute('name')||e.getAttribute('property')||'').toLowerCase();if(/^(description|og:description|twitter:description)$/.test(key)){let s=e.getAttribute('content');if(s)this.items.push(s)}}}
async function getText(url){
 let response=await fetch(url.toString(),{redirect:'manual',headers:{'Accept':'text/html','User-Agent':'CardScanAI-CompanyResearch/1.0'},signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw Error('Website returned HTTP '+response.status);
 if(!/text\/html/i.test(response.headers.get('content-type')||''))throw Error('Website did not return an HTML page');
 let length=Number(response.headers.get('content-length')||0);
 if(length>1500000)throw Error('Website page is too large');
 let collector=new Collect(),meta=new Meta();
 // HTMLRewriter streams extraction from the website; only text is retained.
 await new HTMLRewriter().on('h1,h2,h3,li',collector).on('meta',meta).transform(response).text();
 return [...meta.items,...collector.items];
}
function shortlist(lines){
 let uniq=new Set(),out=[];
 const signal=/\b(manufactur|equipment|system|process|automation|packag|convey|engineering|design|integrat|food|bakery|industrial|service|product|solution|technology|consult|fabricat|distribution|material handling|robotic|machine|refrigerat|software|control|supply|install|maintenance|specializ|expertise|capabilit|industries|production)\b/i;
 for(let line of lines){
  line=line.replace(/\s+/g,' ').trim().replace(/[.]+$/,'');
  if(line.length<12||line.length>160||SKIP.test(line)||/^(cookie|copyright|©|all rights|follow us|sign up|javascript)/i.test(line))continue;
  let k=line.toLowerCase();
  if(uniq.has(k))continue;
  uniq.add(k);
  if(signal.test(line))out.push(line);
  if(out.length>=6)break;
 }
 return out;
}
export default {
 async fetch(request){
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='GET')return new Response(JSON.stringify({error:'GET only'}),{status:405,headers});
  try{
   let target=safeUrl(new URL(request.url).searchParams.get('website'));
   let lines=await getText(target);
   let specialties=shortlist(lines);
   if(specialties.length<2){
    for(let path of ['/services','/products','/solutions']){
     try{let more=await getText(new URL(path,target.origin));specialties=shortlist([...lines,...more]);if(specialties.length>=2)break}catch{}
    }
   }
   return new Response(JSON.stringify({source:target.origin+'/',specialties,method:'Website text extraction; verify suggestions before saving'}),{status:200,headers});
  }catch(err){return new Response(JSON.stringify({error:err.message||'Website research failed'}),{status:400,headers})}
 }
};
