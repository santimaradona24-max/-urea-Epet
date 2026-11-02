(function importer(){
'use strict';
const text=(s)=>String(s||'').replace(/\r/g,'').trim();
const parse=(content)=>{
 const input=String(content||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(!input)return [];
 const blocks=input.split(/(?=^\s*(?:pregunta\s*(?:n[º°.]?\s*)?)?\d+\s*[.):\-]\s*)/gim).map(x=>x.trim()).filter(Boolean);
 const out=[];const errors=[];
 const sequence=blocks.length>1?blocks:[input];
 for(const block of sequence){
  const rows=block.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!rows.length)continue;
  let prompt=rows[0].replace(/^(?:pregunta\s*(?:n[º°.]?\s*)?)?\d+\s*[.):\-]\s*/i,'').trim();
  if(!prompt&&rows.length>1)prompt=rows.shift().trim();
  const choices=rows.filter(x=>/^[A-F][).:\-]\s*\S/i.test(x)).map(x=>x.replace(/^[A-F][).:\-]\s*/i,'').trim());
  const answerLine=rows.find(x=>/^(?:respuesta(?:\s+correcta)?|correcta|soluci[oó]n|clave)\s*[:=\-]\s*\S/i.test(x));
  const rubricLine=rows.find(x=>/^(?:r[uú]brica|criterios?)\s*[:=\-]/i.test(x));
  const pointsLine=rows.find(x=>/^(?:puntos?|valor)\s*[:=\-]/i.test(x));
  const modeLine=rows.find(x=>/^(?:tipo|modalidad)\s*[:=\-]/i.test(x));
  let answer=(answerLine||'').replace(/^[^:=\-]+[:=\-]\s*/,'').trim();
  const rubric=(rubricLine||'').replace(/^[^:=\-]+[:=\-]\s*/,'').trim();
  let points=pointsLine?Number(pointsLine.replace(/^[^:=\-]+[:=\-]\s*/,'').replace(',','.')):1;
  if(!Number.isFinite(points)||points<=0||points>100)points=1;
  if(/^[A-F][):.\-]/i.test(answer)&&choices.length)answer=answer.charAt(0);
  if(/^[A-F]$/i.test(answer)&&choices.length)answer=choices[answer.toUpperCase().charCodeAt(0)-65]||answer;
  let kind=choices.length>=2?'choice':/^(verdadero|falso|true|false)$/i.test(answer)?'boolean':'short';
  if(/desarrollo|abierta|manual/i.test(modeLine||''))kind='short';
  if(kind==='boolean')answer=/^(verdadero|true)$/i.test(answer)?'Verdadero':'Falso';
  const options=kind==='boolean'?['Verdadero','Falso']:kind==='choice'?choices:[];
  if(kind==='short'&&!rubric&&answer)errors.push('La pregunta "'+prompt.slice(0,50)+'" necesita criterios de corrección para desarrollo.');
  if(prompt.length<5||kind==='choice'&&(!answer||!choices.includes(answer))||kind==='boolean'&&!answer||kind==='short'&&rubric.length<5){errors.push('Revisá la pregunta "'+prompt.slice(0,60)+'" y su respuesta.');continue;}
  out.push({prompt,kind,options,correct_answer:kind==='short'?'Revisión docente':answer,points,grading_mode:kind==='short'?'manual':'automatic',rubric:kind==='short'?rubric:''});
 }
 parse.lastErrors=errors;
 return out;
};
const docxText=async(file)=>{
 const b=await file.arrayBuffer(),v=new DataView(b);let e=-1;
 for(let p=b.byteLength-22;p>=Math.max(0,b.byteLength-66000);p--){if(v.getUint32(p,true)===0x06054b50){e=p;break;}}
 if(e<0)throw Error('El archivo DOCX no es válido');
 let count=v.getUint16(e+10,true),p=v.getUint32(e+16,true),xml='';
 for(let i=0;i<count;i++){
  if(v.getUint32(p,true)!==0x02014b50)break;
  const method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),len=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);
  const name=new TextDecoder().decode(new Uint8Array(b,p+46,len));
  if(name==='word/document.xml'){
   const begin=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true),raw=new Uint8Array(b.slice(begin,begin+size));
   if(method===8){const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));xml=new TextDecoder().decode(await new Response(stream).arrayBuffer());}
   else if(method===0)xml=new TextDecoder().decode(raw);
   break;
  }
  p+=46+len+extra+comment;
 }
 if(!xml)throw Error('No se pudo leer el texto del DOCX');
 const d=new DOMParser().parseFromString(xml,'application/xml');
 return Array.from(d.getElementsByTagName('w:p')).map(x=>x.textContent||'').join('\n');
};
const read=async(file)=>{
 if(!file||file.size>8e6)throw Error('El archivo debe tener un máximo de 8 MB');
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='json'){const a=JSON.parse(await file.text());if(!Array.isArray(a))throw Error('El JSON debe contener un listado');return a.map(x=>({prompt:String(x.prompt||''),kind:String(x.kind||'choice'),options:Array.isArray(x.options)?x.options.map(String):[],correct_answer:String(x.correct_answer||x.answer||''),points:Number(x.points)||1}));}
 let content='';
 if(ext==='txt')content=await file.text();
 else if(ext==='docx')content=await docxText(file);
 else if(ext==='pdf'){
  try{
   const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
   pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
   const d=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
   for(let i=1;i<=Math.min(d.numPages,35);i++){const pg=await d.getPage(i),t=await pg.getTextContent();content+='\n'+t.items.map(x=>x.str).join(' ')+'\n';}
  }catch(e){throw Error('No se pudo interpretar el PDF. Comprobá que contenga texto seleccionable y la conexión.');}
 }else throw Error('Formato no compatible: usá TXT, DOCX, JSON o PDF');
 return parse(content);
};
const csv=(src)=>{
 const lines=String(src||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2)throw Error('La libreta debe incluir encabezados y filas');
 const delim=lines[0].includes(';')?';':',';
 const fields=line=>{const out=[];let word='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&quoted&&line[i+1]==='"'){word+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===delim&&!quoted){out.push(word.trim());word='';}else word+=c;}out.push(word.trim());return out;};
 const head=fields(lines[0]).map(s=>s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 const col=(...names)=>{const i=head.findIndex(x=>names.includes(x));if(i<0)throw Error('Columna ausente: '+names[0]);return i;};
 const ix=[col('usuario','username'),col('materia','subject_name'),col('periodo','trimestre','term'),col('nota','score'),col('ano','school_year')];
 return lines.slice(1).map(line=>{const a=fields(line);return {username:a[ix[0]],subject_name:a[ix[1]],term:a[ix[2]],score:Number(String(a[ix[3]]).replace(',','.')),school_year:a[ix[4]]};});
};
window.QImporter={parse,read,csv};
})();