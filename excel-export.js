
/* CardScan AI offline XLSX writer: no network libraries, images embedded. */
(function(){
const enc=new TextEncoder(), X=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
const bytes=s=>enc.encode(s), join=parts=>{let len=parts.reduce((n,x)=>n+x.length,0),a=new Uint8Array(len),i=0;for(let x of parts){a.set(x,i);i+=x.length}return a};
const u16=n=>Uint8Array.of(n&255,(n>>>8)&255),u32=n=>Uint8Array.of(n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255);
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc(b){let c=0xffffffff;for(let v of b)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function zip(files){let parts=[],central=[],offset=0;for(let [name,data] of files){let nb=bytes(name),c=crc(data),local=join([u32(0x04034b50),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(c),u32(data.length),u32(data.length),u16(nb.length),u16(0),nb,data]);parts.push(local);central.push(join([u32(0x02014b50),u16(20),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(c),u32(data.length),u32(data.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb]));offset+=local.length}let cd=join(central);return new Blob([...parts,cd,join([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cd.length),u32(offset),u16(0)])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
function cell(r,c,v,style=0){let ref=col(c)+r,st=` s="${style}"`;if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}"${st}><v>${v}</v></c>`;if(v===null||v===undefined||v==='')return '';return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`}
function sheet(rows,widths,opt={}){let body=rows.map((row,i)=>`<row r="${i+1}"${opt.rowHeights&&opt.rowHeights[i]?` ht="${opt.rowHeights[i]}" customHeight="1"`:''}>${row.map((v,j)=>cell(i+1,j,v,i===0?1:(i%2?2:3))).join('')}</row>`).join('');let w=widths.map((v,i)=>`<col min="${i+1}" max="${i+1}" width="${v}" customWidth="1"/>`).join('');let max=col(widths.length-1)+(rows.length||1);return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${max}"/><sheetViews><sheetView workbookViewId="0">${opt.freeze?'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>':''}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="19"/><cols>${w}</cols><sheetData>${body}</sheetData>${opt.filter?`<autoFilter ref="A1:${max}"/>`:''}${opt.hyperlinks?`<hyperlinks>${opt.hyperlinks}</hyperlinks>`:''}${opt.drawing?'<drawing r:id="rId1"/>':''}</worksheet>`}
const NS='http://schemas.openxmlformats.org/package/2006/relationships';
function rel(items){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}">${items.map(([id,type,target])=>`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${X(target)}"/>`).join('')}</Relationships>`}
function photoJPEG(blob){return new Promise((resolve,reject)=>{let u=URL.createObjectURL(blob),im=new Image();im.onload=()=>{try{let scale=Math.min(1,1400/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(async b=>{URL.revokeObjectURL(u);if(!b)return reject(Error('Image conversion failed'));resolve({data:new Uint8Array(await b.arrayBuffer()),width:c.width,height:c.height})},'image/jpeg',.78)}catch(e){URL.revokeObjectURL(u);reject(e)}};im.onerror=()=>{URL.revokeObjectURL(u);reject(Error('Could not open photo'))};im.src=u})}
const imageAnchor=(id,row,img,large)=>{let width=large?850:160,height=Math.round(width*img.height/img.width);height=Math.min(height,large?640:125);return `<xdr:oneCellAnchor><xdr:from><xdr:col>${large?5:22}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${width*9525}" cy="${height*9525}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Card Photo ${id}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${id}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`};
function drawing(items){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${items.map((x,i)=>imageAnchor(i+1,x.row,x.img,x.large)).join('')}</xdr:wsDr>`}
const tableHeaders=['First Name','Last Name','Company','Job Title','Email','Phone 1 Type','Phone 1','Phone 2 Type','Phone 2','Other Phones','Website','Street Address','City','State','ZIP / Postal','Country','Event / Met At','Categories / Tags','Notes','Photo Count','Photo Gallery Row','Created','Card Thumbnail'];
async function exportExcel(){
 let btn=document.getElementById('exportExcel');btn.disabled=true;let prior=btn.textContent;btn.textContent='Preparing Excel with photos…';
 try{
  const contacts=db(),photos=[],byId=new Map(),galleryRows=[],galleryImages=[],dirImages=[];
  let contactRows=[tableHeaders],categoryCounts=new Map(),companyCounts=new Map(),cityCounts=new Map(),photoCount=0;
  for(let i=0;i<contacts.length;i++){
   let c=contacts[i],p=await getPhotos(c.id);byId.set(c.id,p);photoCount+=p.length;
   let more=(c.extraPhones||[]).map(x=>(x.type||'Other')+': '+(x.number||'')).join(' | ');
   let galleryStart=p.length?galleryRows.length+2:'';
   contactRows.push([c.first||'',c.last||'',c.company||'',c.title||'',c.email||'',c.phone1Type||'',c.phone1||c.phone||'',c.phone2Type||'',c.phone2||'',more,c.website||'',c.street||c.address||'',c.city||'',c.state||'',c.postal||'',c.country||'',c.metAt||'',c.tags||'',c.notes||'',p.length,p.length?'View photos':'',c.created||'','']);
   for(let tag of String(c.tags||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean))categoryCounts.set(tag,(categoryCounts.get(tag)||0)+1);
   for(let [map,key] of [[companyCounts,c.company],[cityCounts,c.city]])if(key)map.set(key,(map.get(key)||0)+1);
   for(let j=0;j<p.length;j++){
    let gr=galleryRows.length+2;
    galleryRows.push([`${c.first||''} ${c.last||''}`.trim(),c.company||'',`Photo ${j+1} of ${p.length}`,c.email||'',c.tags||'']);
    try{let img=await photoJPEG(p[j].blob);photos.push(img);galleryImages.push({row:gr-1,img,large:true,photoIndex:photos.length});if(j===0)dirImages.push({row:i+1,img,large:false,photoIndex:photos.length})}catch(err){console.warn('Skipped unreadable photo',err)}
   }
  }
  const dashboard=[['CARDSCAN AI — CONTACT DASHBOARD','Value'],['Total Contacts',contacts.length],['Total Card Photos',photoCount],['Unique Companies',companyCounts.size],['Unique Cities',cityCounts.size],['Categories Used',categoryCounts.size],['Exported At',new Date().toLocaleString()],['',''],['CATEGORY','CONTACTS'],...Array.from(categoryCounts).sort((a,b)=>b[1]-a[1]),['',''],['COMPANY','CONTACTS'],...Array.from(companyCounts).sort((a,b)=>b[1]-a[1])];
  const categories=[['Category','Contacts'],...Array.from(categoryCounts).sort((a,b)=>a[0].localeCompare(b[0]))];
  const galleryLinks=contacts.map((c,i)=>({row:i+2,first:(byId.get(c.id)||[]).length?contacts.slice(0,i).reduce((n,p)=>n+(byId.get(p.id)||[]).length,2):null})).filter(x=>x.first).map(x=>`<hyperlink ref="U${x.row}" location="'Card Photos'!A${x.first}" display="View photos"/>`).join('');
  const gallery=[['Contact Name','Company','Photo','Email','Tags'],...galleryRows];
  const names=['Dashboard','Contact Directory','Categories','Card Photos'];
  let sheets=[sheet(dashboard,[43,28],{freeze:true}),sheet(contactRows,[19,19,27,28,32,17,21,17,21,36,32,32,22,15,18,18,26,30,45,14,18,26,25],{freeze:true,filter:true}),sheet(categories,[32,16],{freeze:true,filter:true}),sheet(gallery,[28,28,20,32,28],{freeze:true,filter:true,rowHeights:Object.fromEntries(galleryImages.map(x=>[x.row,390]))})];
  // Set row heights on the directory so thumbnails fit.
  sheets[1]=sheet(contactRows,[19,19,27,28,32,17,21,17,21,36,32,32,22,15,18,18,26,30,45,14,18,26,25],{freeze:true,filter:true,hyperlinks:galleryLinks,rowHeights:Object.fromEntries(dirImages.map(x=>[x.row,100]))});
  const files=[];
  const add=(name,data)=>files.push([name,typeof data==='string'?bytes(data):data]);
  add('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}${photos.length?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/drawings/drawing2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`);
  add('_rels/.rels',`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${NS}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n,i)=>`<sheet name="${X(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`);
  add('xl/_rels/workbook.xml.rels',rel([...names.map((_,i)=>[`rId${i+1}`,'worksheet',`worksheets/sheet${i+1}.xml`]),['rId5','styles','styles.xml']]));
  add('xl/styles.xml',`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173B72"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF4FC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`);
  if(photos.length){sheets[1]=sheets[1].replace('</worksheet>','<drawing r:id="rId1"/></worksheet>');sheets[3]=sheets[3].replace('</worksheet>','<drawing r:id="rId1"/></worksheet>')}
  sheets.forEach((s,i)=>add(`xl/worksheets/sheet${i+1}.xml`,s));
  if(photos.length){
   add('xl/worksheets/_rels/sheet2.xml.rels',rel([['rId1','drawing','../drawings/drawing1.xml']]));
   add('xl/worksheets/_rels/sheet4.xml.rels',rel([['rId1','drawing','../drawings/drawing2.xml']]));
   add('xl/drawings/drawing1.xml',drawing(dirImages));add('xl/drawings/drawing2.xml',drawing(galleryImages));
   add('xl/drawings/_rels/drawing1.xml.rels',rel(dirImages.map((x,i)=>[`rId${i+1}`,'image',`../media/photo${x.photoIndex}.jpeg`])));
   add('xl/drawings/_rels/drawing2.xml.rels',rel(galleryImages.map((x,i)=>[`rId${i+1}`,'image',`../media/photo${x.photoIndex}.jpeg`])));
   photos.forEach((p,i)=>add(`xl/media/photo${i+1}.jpeg`,p.data));
  }
  const file=zip(files),u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=`CardScanAI-Contacts-${new Date().toISOString().slice(0,10)}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);
  toast(`Excel exported: ${contacts.length} contacts, ${photos.length} photos`);
 }catch(err){console.error(err);alert('Excel export failed: '+(err.message||err))}
 finally{btn.disabled=false;btn.textContent=prior}
}
document.getElementById('exportExcel').addEventListener('click',exportExcel);
})();
