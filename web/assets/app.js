(function appRuntime(){
'use strict';
const BASE='https://vaectixpzcpzvkbhjrqy.supabase.co/functions/v1/';
const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 home:'M3 11l9-8 9 8v10H3z M9 21v-8h6v8',
 book:'M4 4h16v17H4z M8 4v17 M12 9h5 M12 13h5',
 paper:'M7 3h9l5 5v13H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z M15 3v6h6 M9 14h8 M9 18h8',
 chart:'M3 20V8 M9 20V4 M15 20v-9 M21 20V6 M2 21h21',
 people:'M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M17 11h6',
 gear:'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.2 2.2 M16.9 16.9l2.2 2.2 M19.1 4.9l-2.2 2.2 M7.1 16.9l-2.2 2.2 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
 help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9.5 9a2.6 2.6 0 1 1 4.8 1.5c-.9.8-2.3 1.6-2.3 3 M12 17h.01',
 shield:'M12 2l9 4v6c0 6-4 8-9 10-5-2-9-4-9-10V6z M8 12l3 3 5-5',
 upload:'M12 16V3 M7 8l5-5 5 5 M4 17v4h16v-4',
 lock:'M4 10h16v11H4z M8 10V7a4 4 0 0 1 8 0v3',
 logout:'M10 3H4v18h6 M15 7l5 5-5 5 M20 12H9',
 cap:'M2 9l10-6 10 6-10 6z M6 12v6c4 3 8 3 12 0v-6',
 arrow:'M4 12h16 M14 6l6 6-6 6'
};
const icon=(id,size=18)=>`<svg width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[id]||paths.paper}"/></svg>`;
const state={route:'home',id:'',tab:'questions',token:sessionStorage.getItem('aurea_auth')||localStorage.getItem('aurea_auth')||'',user:null,online:null,catalog:{subjects:[],exams:[]},subjects:[],exams:[],subjectExams:[],exam:null,results:[],students:[],staff:[],unlinked:[],report:[],profile:null,preview:[],attempt:null,filter:'',busy:false,submitting:false,expiryQueued:false,examResetting:false,examFullscreenRequired:false,live:null,review:null,gradingMode:'automatic',questionType:'choice',lastLiveFetch:0,studentMonitor:null,studentMonitorAttempt:null,myProfile:null,directory:[],knownUser:localStorage.getItem('aurea_known_user')||'',ownerData:null,routeFetched:{},routeVersion:0,loadingRoute:false,community:{tab:'posts',posts:[],people:[],comments:{},page:0,more:false,query:'',loaded:false},communityImage:null};
try{state.attempt=JSON.parse(sessionStorage.getItem('aurea_attempt')||'null')}catch{}
async function call(fn,action,data={}){
 let res;try{res=await fetch(BASE+fn,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,action,...(state.token?{staff_token:state.token}:{})}),cache:'no-store'});}catch{throw Error('No se pudo conectar al servidor. Verificá tu conexión.')}
 const dataOut=await res.json().catch(()=>({error:'Respuesta incorrecta del servidor'}));
 if(!res.ok)throw Error(dataOut.error||'La operación no se completó');
 return dataOut;
}
async function checkServerHealth(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
 let connected=false;
 try{
  const response=await fetch(BASE+'campus-health',{method:'GET',cache:'no-store',signal:controller.signal});
  connected=response.ok&&(await response.text()).trim()==='ok';
 }catch(e){connected=false;}finally{clearTimeout(timer);}
 state.online=connected;
 document.querySelectorAll('.topbar .server').forEach(el=>{
  el.classList.toggle('offline',!connected);el.classList.remove('checking');
  el.textContent=connected?'Conectado':'Sin conexión';
  el.title=connected?'Servidor académico disponible':'No se pudo comprobar el servidor. Reintentando automáticamente.';
 });
 return connected;
}
const api=(a,d)=>call('campus-api',a,d), users=(a,d)=>call('campus-users',a,d),assess=(a,d)=>call('campus-assessment',a,d),profileAPI=(a,d)=>call('campus-profile',a,d),ownerAPI=(a,d)=>call('campus-owner',a,d),communityAPI=(a,d)=>call('campus-community',a,d);
function toast(message,bad=false){const t=$('#toast');if(!t)return;t.textContent=String(message);t.className=bad?'show error':'show';clearTimeout(toast.id);toast.id=setTimeout(()=>t.className='',4700)}

function aureaModal(message,{entry=false,danger=false,onAccept=null}={}){
 return new Promise(resolve=>{
  let dialog=document.getElementById('aurea-confirm-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='aurea-confirm-dialog';dialog.className='aurea-dialog';document.body.appendChild(dialog);}
  if(dialog.open)dialog.close();
  const title=document.createElement('h2');title.textContent=danger?'Confirmar acción importante':'Confirmación';
  title.id='aurea-dialog-heading';
  const text=document.createElement('p');text.textContent=String(message||'');
  const box=document.createElement('div');box.className='aurea-dialog-inner';
  const glyph=document.createElement('div');glyph.className='aurea-dialog-icon';glyph.innerHTML=icon(danger?'shield':'paper',23);
  box.append(glyph,title,text);
  let input=null;
  if(entry){input=document.createElement('input');input.type='text';input.placeholder='Escribí la confirmación';input.setAttribute('aria-label','Texto de confirmación');input.autocomplete='off';box.appendChild(input);}
  const actions=document.createElement('div');actions.className='aurea-dialog-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='btn secondary';cancel.textContent='Cancelar';
  const accept=document.createElement('button');accept.type='button';accept.className='btn '+(danger?'danger':'primary');accept.textContent=danger?'Confirmar eliminación':'Continuar';
  actions.append(cancel,accept);box.append(actions);dialog.replaceChildren(box);
  dialog.setAttribute('aria-labelledby',title.id);
  let done=false;const close=value=>{if(done)return;done=true;dialog.removeEventListener('cancel',onCancel);dialog.close();resolve(value);};
  const onCancel=e=>{e.preventDefault();close(entry?null:false);};
  dialog.addEventListener('cancel',onCancel);
  cancel.onclick=()=>close(entry?null:false);
  accept.onclick=()=>{try{onAccept?.()}catch{}close(entry?input.value:true)};
  dialog.showModal();if(input)input.focus();else accept.focus();
 });
}
const aureaConfirm=(message,options={})=>aureaModal(message,options);
const aureaPrompt=(message,options={})=>aureaModal(message,{...options,entry:true});

const access=()=>state.user?.role||'public';
const titleRole=(r)=>({public:'Visitante',student:'Alumno',teacher:'Docente',preceptor:'Preceptoría',admin:'Administración'})[r]||'Usuario';
const nav=()=>{
 const common=[['home','Resumen','home']];
 if(!state.user)return [...common,['register','Crear cuenta','people'],['login','Iniciar sesión','lock'],['catalog','Evaluaciones','paper'],['help','Ayuda','help']];
 if(access()==='student')return [['home','Inicio','home'],['student-exams','Mis pruebas','paper'],['grades','Mis notas','chart'],['community','Comunidad','people'],['account','Mi perfil','gear'],['help','Ayuda','help']];
 if(access()==='teacher')return [...common,['subjects','Materias','book'],['exams','Evaluaciones','paper'],['account','Mi perfil','gear'],['community','Comunidad','people'],['help','Ayuda','help']];
 if(access()==='preceptor')return [...common,['reportbook','Libretas','book'],['students','Alumnos','people'],['account','Mi perfil','gear'],['community','Comunidad','people'],['help','Ayuda','help']];
 return [...common,['subjects','Materias','book'],['exams','Evaluaciones','paper'],['reportbook','Libretas','chart'],['students','Alumnos','people'],['staff','Personal','shield'],...(state.user?.platform_owner?[['owner','Centro Owner','shield'],['owner-history','Mi historial','chart']]:[]),['account','Mi perfil','gear'],['community','Comunidad','people'],['help','Ayuda','help']];
};
const button=(label,act,kind='secondary',attrs='')=>`<button type="button" class="btn ${kind}" data-action="${act}" ${attrs}>${label}</button>`;
const back=(to)=>button('‹ Volver','goto:'+to,'ghost');
const pill=(s)=>{
 const values={draft:['Borrador','warn'],published:['Publicada','success'],closed:['Cerrada','muted'],passed:['Aprobado','success'],failed:['Desaprobado','danger'],submitted:['Entregado','success'],expired:['Vencido','warn'],cancelled:['Anulado','danger'],in_progress:['En progreso','warn'],no_iniciada:['Pendiente','warn'],not_started:['Sin iniciar','warn']};
 const [name,color]=values[s]||[s||'Sin iniciar','muted'];return `<span class="pill ${color}">${esc(name)}</span>`;
};
const grade=(n)=>n==null?'—':(Number(n)/10).toFixed(1);
const avg=(g)=>g.length?(g.reduce((a,x)=>a+Number(x.score),0)/g.length).toFixed(2):'—';
const when=(d)=>d?new Date(d).toLocaleDateString('es-AR'):'—';
const subname=(id)=>state.catalog.subjects.find(x=>x.id===id)?.name||state.subjects.find(x=>x.id===id)?.name||'Materia';
const title=(s,d='',actions='')=>`<div class="page-head"><div><div class="eyebrow">EPET N.º 6 · Gestión académica</div><h1>${s}</h1><p>${d}</p></div><div class="actions">${actions}</div></div>`;
const section=(s,d='',actions='')=>`<div class="section"><div class="section-head"><div><h2>${s}</h2>${d?`<p>${d}</p>`:''}</div><div class="actions">${actions}</div></div></div>`;
const panel=(s,x,actions='')=>`<div class="panel">${s?`<div class="section-head"><h3>${s}</h3><div class="actions">${actions}</div></div>`:''}${x}</div>`;
const empty=(s,d,act='')=>`<div class="empty"><div class="big">${icon('paper',28)}</div><h3>${s}</h3><p>${d}</p>${act}</div>`;
const kpis=(values)=>`<div class="grid cols3">${values.map(x=>`<div class="metric"><div class="metric-label">${x[0]}</div><div class="metric-number">${esc(x[1])}</div><div class="metric-note">${x[2]||''}</div></div>`).join('')}</div>`;
const feature=(name,description,act,label,ico)=>`<div class="card"><div class="icon-tile">${icon(ico,20)}</div><h3>${name}</h3><p>${description}</p><div class="foot">${button(label,act)}</div></div>`;
const steps=(arr)=>arr.map((x,i)=>`<div class="step"><span class="step-num">${i+1}</span><p>${x}</p></div>`).join('');
const formatLink=(r)=>({home:'Inicio',catalog:'Catálogo',login:'Acceso',register:'Registro',subjects:'Materias',subject:'Materia',exams:'Evaluaciones',exam:'Evaluación',grades:'Calificaciones','student-exams':'Mis evaluaciones',reportbook:'Libretas',students:'Alumnos',staff:'Personal',account:'Mi perfil',directory:'Comunidad educativa',community:'Comunidad escolar',owner:'Centro Owner','owner-history':'Mi historial',help:'Ayuda',take:'Examen'})[r]||r;
function shell(inner){
 if(state.route==='take'&&state.attempt)return '<div class="aurea-exam-shell"><header class="aurea-exam-header"><span class="gem"></span><div><strong>Áurea · Evaluación en curso</strong><small>Modo concentración · Tu tiempo continúa aunque cambies de aplicación</small></div><span class="aurea-exam-badge">Sesión activa</span></header><main class="aurea-exam-content">'+inner+'</main><footer class="aurea-exam-footer">Las respuestas se sincronizan con el servidor. No cierres el navegador antes de entregar.</footer></div>';
 const items=nav(),name=state.user?.display_name||'EPET N.º 6';
 return `<div class="app-shell"><aside class="sidebar"><div class="logo"><span class="gem"></span><div><div class="wordmark">Áurea</div><div class="logo-sub">Campus académico · EPET 6</div></div></div><div class="nav-label">Navegación</div><nav>${items.map(([r,t,i])=>`<button class="nav-link ${state.route===r?'active':''}" data-go="${r}">${icon(i)}${t}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="identity"><div class="avatar">${esc(name.charAt(0).toUpperCase())}</div><div><strong>${esc(name)}</strong><small>${titleRole(access())}</small></div></div>${state.user?`<button class="nav-link" data-action="logout" style="margin-top:9px">${icon('logout')}Cerrar sesión</button>`:''}<p style="font-size:10px;margin:14px 7px;color:#b0a18f">EPET N.º 6 · San Juan</p></div></aside><div class="main-wrap"><div class="topbar"><span class="crumb">EPET N.º 6 &nbsp;/&nbsp; <strong>${formatLink(state.route)}</strong></span><div class="top-actions"><span class="server ${state.online===false?'offline':state.online===null?'checking':''}" title="Estado de conexión al servidor académico">${state.online===true?'Conectado':state.online===false?'Sin conexión':'Verificando...'}</span>${state.user?`<span class="avatar" style="height:33px;width:33px">${esc(name.charAt(0).toUpperCase())}</span>`:''}</div></div><main class="content">${inner}<div class="footer-note">EPET N.º 6 · Plataforma de evaluaciones y seguimiento académico. Datos privados protegidos mediante cuentas personales.</div></main></div></div><nav class="mobilebar" aria-label="Navegación principal">${items.filter(([r])=>['home','student-exams','exams','grades','community','account'].includes(r)).slice(0,4).map(([r,t,i])=>`<button class="mobile-link ${state.route===r?'active':''}" data-go="${r}">${icon(i)}<span>${t}</span></button>`).join('')}<button class="mobile-link" type="button" data-action="mobile-more" aria-label="Más secciones" aria-expanded="false">${icon('gear')}<span>Más</span></button></nav><div class="mobile-more-sheet" id="mobile-more-sheet" aria-hidden="true"><div class="mobile-more-header"><strong>Explorar Áurea</strong><button class="btn ghost small" type="button" data-action="mobile-more">Cerrar</button></div>${items.map(([r,t,i])=>`<button class="mobile-more-link ${state.route===r?'active':''}" type="button" data-go="${r}">${icon(i)}<span>${t}</span></button>`).join('')}</div>`;
}
function examRows(items,mode='public'){
 if(!items.length)return empty('No hay evaluaciones','Cuando haya convocatorias, aparecerán en esta lista.');
 return `<div class="list">${items.map(e=>`<div class="list-row"><div><div class="stack">${pill(e.status)}${e.legacy_readonly?'<span class="pill muted">Histórico</span>':''}</div><strong>${esc(e.title)}</strong><span class="sub">${esc(e.subject_name||subname(e.subject_id))} ${e.duration_minutes?'· '+e.duration_minutes+' minutos':''}</span></div><div class="actions">${button(mode==='public'?'Ver información':'Gestionar',mode==='public'?'show-public-exam':'show-exam','secondary',`data-id="${esc(e.id)}"`)}${mode==='teacher'&&state.user?.platform_owner&&!e.legacy_readonly?button('Eliminar','owner-delete-academic','ghost small',`data-id="${esc(e.id)}" data-kind="exam"`):''}</div></div>`).join('')}</div>`;
}
function gradeTable(data,withName=false){
 return `<div class="desktop-records table-scroll"><table class="table"><thead><tr>${withName?'<th>Alumno</th>':''}<th>Materia</th><th>Período</th><th>Año</th><th>Nota</th></tr></thead><tbody>${data.map(x=>`<tr>${withName?`<td><strong>${esc(x.student_name||'')}</strong></td>`:''}<td>${esc(x.subject_name)}</td><td>${esc(x.term)}</td><td>${esc(x.school_year)}</td><td><strong>${Number(x.score).toFixed(2)}</strong></td></tr>`).join('')}</tbody></table></div><div class="mobile-records">${data.map(x=>`<article class="mobile-record"><div><strong>${esc(x.subject_name)}</strong><span class="mobile-grade">${Number(x.score).toFixed(2)}</span></div>${withName?`<p>${esc(x.student_name||'')}</p>`:''}<small>${esc(x.term)} · ${esc(x.school_year)}</small></article>`).join('')}</div>`;
}
function welcomeHome(){
 const known=state.knownUser;
 return `<div class="onboard-grid">
 <section class="onboard-intro"><div class="eyebrow">EPET N.º 6 · SAN JUAN</div><div class="onboard-logo"><span class="gem"></span><span>Áurea</span></div><h1>Tu escuela, <em>en un solo lugar.</em></h1><p>Tu perfil, las evaluaciones y las notas, reunidos en un espacio personal. Ingresá para continuar con tu trayectoria académica.</p><div class="onboard-tags"><span>${icon('shield',16)} Cuenta segura</span><span>${icon('paper',16)} Evaluaciones</span><span>${icon('cap',16)} Tu educación</span></div><div class="onboard-orb" aria-hidden="true"></div></section>
 <section class="onboard-choice"><div class="eyebrow">BIENVENIDO A ÁUREA</div><h2>${known?'Qué bueno verte de nuevo':'Empezá tu experiencia'}</h2><p>${known?'Ya hay un usuario recordado en este dispositivo. Iniciá sesión para entrar al campus.':'Creá tu cuenta personal para poder acceder a tus evaluaciones y al resto de tu información escolar.'}</p><div class="onboard-actions">${known?`${button('Iniciar sesión','goto:login','primary')}${button('Crear otra cuenta','goto:register')}`:`${button('Crear mi cuenta','goto:register','primary')}${button('Ya tengo una cuenta','goto:login')}`}</div><div class="onboard-separator"><span>ACCESO ESCOLAR</span></div><div class="onboard-info">${icon('shield',17)}<span>Los profesores, preceptores y administración ingresan con las cuentas asignadas por la institución.</span></div></section>
 </div>`;
}
function authShell(inner){
 return `<div class="onboard-screen">
 <header class="onboard-header"><button type="button" data-go="home" class="onboard-brand"><span class="gem"></span><span><strong>Áurea</strong><small>EPET N.º 6</small></span></button><button type="button" class="onboard-help" data-go="help">${icon('help',16)} Ayuda</button></header>
 <main class="onboard-main">${inner}</main>
 <footer class="onboard-footer"><span>Áurea · EPET N.º 6</span><span>Identidad académica. Aprendizaje conectado.</span></footer>
 </div>`;
}
function publicHome(){
 const open=state.catalog.exams.filter(x=>x.status==='published');
 return `<div class="hero"><div><div class="eyebrow">Plataforma educativa · EPET N.º 6</div><h1>Un solo lugar para <em style="font-weight:400;color:#a6532b">aprender, evaluar y avanzar.</em></h1><p>Evaluaciones, libretas y calificaciones organizadas para cada alumno, docente y preceptor. Datos compartidos entre módulos, no entre aplicaciones.</p><div class="actions">${button('Explorar evaluaciones','goto:catalog','primary')}${button('Crear mi cuenta','goto:register')}${button('Iniciar sesión','goto:login','ghost')}</div></div><div class="opal" aria-hidden="true"></div></div>`+
 section('Tres espacios, una plataforma','Cada usuario accede a lo que necesita desde su cuenta.')+
 `<div class="grid cols3">${feature('Para alumnos','Exámenes asignados, calificaciones y libretas personales.','goto:register','Crear cuenta','cap')}${feature('Para profesores','Materias, evaluaciones, importación de preguntas y resultados.','goto:login','Acceder','paper')}${feature('Para preceptoría','Libretas de notas y seguimiento de estudiantes.','goto:login','Acceder','chart')}</div>`+
 section('Convocatorias del campus','El archivo histórico también forma parte del sistema.',button('Ver catálogo','goto:catalog','ghost'))+
 panel('Evaluaciones registradas',examRows(state.catalog.exams.slice(0,6)));
}
function studentHome(){
 const p=state.profile?.profile||{},ex=state.profile?.exams||[],grades=state.profile?.grades||[],first=(state.user?.display_name||'').split(' ')[0];
 const pending=ex.filter(x=>x.status==='no_iniciada'&&x.exam_status==='published'||x.status==='in_progress');
 const finished=ex.filter(x=>!pending.includes(x));
 const welcome=title('Hola, '+esc(first)+'.','Este es tu espacio. Acá ves qué tenés pendiente y dónde encontrar tus notas.');
 const verify=p.identity_verified?'':'<div class="banner">'+icon('shield')+'<div><strong>Cuenta pendiente de verificación</strong><p>El personal de la escuela debe verificar tu identidad para habilitar evaluaciones.</p></div></div>';
 const pendingList=pending.length?studentExamRows(pending.slice(0,4)):empty('Estás al día','No hay evaluaciones pendientes por ahora.');
 return welcome+verify+
 '<div class="aurea-student-quick">'+
 '<button type="button" data-go="student-exams">'+icon('paper')+'<strong>Mis evaluaciones</strong><span>'+pending.length+' pendientes</span></button>'+
 '<button type="button" data-go="grades">'+icon('chart')+'<strong>Mis notas</strong><span>'+grades.length+' registros</span></button>'+
 '<button type="button" data-go="account">'+icon('gear')+'<strong>Mi perfil</strong><span>Identidad y apariencia</span></button></div>'+
 section('Lo que tenés que rendir','Tus próximas evaluaciones. Tocá «Comenzar» o «Retomar» para entrar.',button('Ver todas','goto:student-exams'))+
 panel('Evaluaciones pendientes',pendingList)+
 (finished.length?section('Entregas anteriores','Consultá resultados sin mezclarlos con tus tareas pendientes.',button('Historial','goto:student-exams'))+panel('Últimas entregas',studentExamRows(finished.slice(0,3))):'');
}
function studentExamRows(items){
 return `<div class="list">${items.map(e=>`<div class="list-row"><div><div class="stack">${pill(e.status)}${e.legacy?'<span class="pill muted">Histórico</span>':''}</div><strong>${esc(e.title)}</strong><span class="sub">${e.score_percent==null?(e.grading_status==='needs_review'?'Pendiente de corrección docente':'Sin nota'):grade(e.score_percent)+' / 10'} · ${e.duration_minutes} minutos</span></div><div class="actions">${e.status==='no_iniciada'&&e.exam_status==='published'?button('Ver convocatoria','start-exam','primary',`data-id="${esc(e.invite_id)}"`):e.status==='in_progress'?button('Retomar','resume-exam','secondary',`data-id="${esc(e.invite_id)}"`):''}</div></div>`).join('')}</div>`;
}
function staffHome(){
 const arr=state.exams,admin=access()==='admin';
 return title(admin?'Administración académica':'Espacio docente',admin?'Gestión de evaluaciones, materias, usuarios y resultados desde una sola plataforma.':'Prepará exámenes y consultá sus resultados sin salir de tu espacio.')+
 kpis([['Materias',state.subjects.length,'Accesibles para tu usuario'],['Evaluaciones',arr.length,'Incluidas históricas'],['Convocatorias abiertas',arr.filter(x=>x.status==='published').length,'Disponibles para alumnos']])+
 section('Herramientas académicas','Un flujo único desde la materia hasta la calificación.')+
 `<div class="grid cols3">${feature('Materias y cursos','Organizá las evaluaciones por materia y división.','goto:subjects','Abrir materias','book')}${feature('Evaluaciones','Creá o transformá preguntas, publicá y asigná.','goto:exams','Ver evaluaciones','paper')}${feature('Resultados','Consultá calificaciones e historial histórico.','goto:exams','Consultar','chart')}</div>`+
 section('Evaluaciones registradas','Información de las materias a tu cargo.')+
 panel('Biblioteca',examRows(arr.slice(0,7),'teacher'));
}
function preceptorHome(){
 const gr=state.report||[];
 return title('Espacio de preceptoría','Las libretas y las cuentas de alumnos se gestionan dentro del mismo sistema.')+
 kpis([['Notas registradas',gr.length,'Registros recientes disponibles'],['Alumnos',state.students.length,'Cuentas de alumnos'],['Promedio registrado',avg(gr),'Media simple de registros']])+
 section('Herramientas de preceptoría','Las calificaciones se vinculan con alumnos verificados.')+
 `<div class="grid cols2">${feature('Libretas académicas','Importá notas y consultá su historial.','goto:reportbook','Ver libretas','book')}${feature('Cuentas de alumnos','Consultá identidades y cursos registrados.','goto:students','Ver alumnos','people')}</div>`+
 section('Calificaciones recientes')+panel('Registros',gr.length?gradeTable(gr.slice(0,7),true):empty('Sin notas importadas','Las notas aparecerán cuando se carguen las libretas.'));
}
function catalog(){
 const ex=state.catalog.exams.filter(x=>(x.title+' '+subname(x.subject_id)).toLowerCase().includes(state.filter.toLowerCase()));
 return title('Catálogo de evaluaciones','Todas las materias en un solo catálogo, con convocatorias y archivos históricos.')+
 panel('',`<div class="field"><label>Buscar por materia o evaluación</label><input id="catalog-filter" value="${esc(state.filter)}"></div><div id="catalog-results">${examRows(ex)}</div>`);
}
function publicExam(){
 const x=state.catalog.exams.find(v=>v.id===state.id);if(!x)return catalog();
 return title(esc(x.title),esc(subname(x.subject_id)),back('catalog'))+
 `<div class="split">${panel('Evaluación',`${pill(x.status)} <span class="pill muted">${x.legacy_readonly?'Archivo histórico':'Convocatoria'}</span><div class="divider"></div><h3>${x.legacy_readonly?'Historial integrado':'Ingreso desde cuenta'}</h3><p style="margin-top:10px">${x.legacy_readonly?'Las tres versiones y sus resultados permanecen en el sistema. Los alumnos verificados pueden consultar sus propios registros históricos una vez vinculados.':'Esta evaluación se asigna a cuentas verificadas. No se accede escribiendo nombres ni códigos compartidos.'}</p><div class="actions" style="margin-top:18px">${button('Ir a mi perfil',state.user?'goto:home':'goto:login','primary')}</div>`)}
 ${panel('Proceso',steps(['Registrate o iniciá sesión.','Administración valida tu identidad escolar.','El profesor te asigna la evaluación.','La rendís y consultás su calificación en tu perfil.']))}</div>`;
}
function login(){
 return title('Acceso al campus','El mismo inicio de sesión sirve para alumnos, docentes, preceptores y administración.')+
 `<div class="account-wrap">${panel('Ingresar con mi cuenta',`<form data-form="login"><div class="field"><label>Usuario</label><input name="username" autocomplete="username" value="${esc(state.knownUser||'')}" required></div><div class="field"><label>Contraseña</label><input name="password" type="password" autocomplete="current-password" required></div><button class="btn primary" type="submit">Ingresar al campus</button></form><div class="divider"></div>${button('Crear cuenta de alumno','goto:register')}`)}
 ${panel('Identidades protegidas',`${steps(['Cada usuario tiene su propia cuenta.','Administración verifica la identidad escolar.','Cada alumno consulta únicamente sus notas.'])}<div class="notice">Los accesos de docentes y preceptores los habilita administración.</div>`)}</div>`;
}
function register(){
 return title('Crear cuenta de alumno','Un usuario para todas las evaluaciones y libretas, sin volver a escribir tu nombre.')+
 `<div class="account-wrap">${panel('Datos personales',`<form data-form="register"><div class="field"><label>Nombre y apellido reales</label><input name="display_name" minlength="5" maxlength="120" autocomplete="name" required></div><div class="field"><label>Curso y división</label><input name="course" maxlength="80" required></div><div class="field"><label>Nombre de usuario</label><input name="username" minlength="4" maxlength="40" autocomplete="username" required></div><div class="field"><label>Contraseña (12 caracteres como mínimo)</label><input name="password" minlength="12" type="password" autocomplete="new-password" required></div><button class="btn primary" type="submit">Registrar mi cuenta</button></form>`)}
 ${panel('Qué sucede después',`${steps(['Creás la cuenta.','Administración verifica que sos el alumno declarado.','Tus docentes te asignan evaluaciones.','Las notas quedan asociadas a tu perfil.'])}<div class="notice">Registrar un nombre ajeno no permite ver las calificaciones de esa persona.</div>`)}</div>`;
}
function studentExams(){
 const arr=state.profile?.exams||[];
 const pending=arr.filter(x=>x.status==='no_iniciada'||x.status==='in_progress');
 const done=arr.filter(x=>!pending.includes(x));
 return title('Mis evaluaciones','Las pendientes arriba. Las entregadas quedan en tu historial.',button('Actualizar','reload-profile'))+
 (!state.profile?.profile?.identity_verified?'<div class="notice">La cuenta todavía no está verificada por la institución.</div>':'')+
 section('Por rendir',pending.length+' evaluaciones', '')+
 panel('Pendientes',pending.length?studentExamRows(pending):empty('No tenés evaluaciones pendientes','Cuando un docente te asigne una, aparecerá aquí.'))+
 (done.length?section('Ya rendidas','Tus entregas, correcciones y calificaciones.')+panel('Historial',studentExamRows(done)):'');
}
function studentSubjectAverages(grades){
 const groups=new Map();
 for(const entry of grades){
  const score=Number(entry.score);if(!Number.isFinite(score))continue;
  const subject=String(entry.subject_name||'Materia'),year=String(entry.school_year||'Sin año');
  const key=subject+'\u001f'+year,prev=groups.get(key)||{subject,year,sum:0,count:0};
  prev.sum+=score;prev.count++;groups.set(key,prev);
 }
 return [...groups.values()].sort((a,b)=>a.subject.localeCompare(b.subject,'es')||b.year.localeCompare(a.year));
}
function studentAveragesPanel(grades){
 const entries=studentSubjectAverages(grades);if(!entries.length)return '';
 return panel('Promedios orientativos por materia',`<div class="subject-averages">${entries.map(x=>`<div class="subject-average"><div><strong>${esc(x.subject)}</strong><small>${esc(x.year)} · ${x.count} ${x.count===1?'calificación':'calificaciones'}</small></div><span>${(x.sum/x.count).toFixed(2)}</span></div>`).join('')}</div><p class="hint" style="margin-top:12px">Promedio aritmético simple de las notas de libreta visibles. No reemplaza el cálculo institucional de la nota final ni considera ponderaciones.</p>`);
}
function grades(){
 const gr=state.profile?.grades||[],ex=state.profile?.exams?.filter(x=>['submitted','expired','passed','failed'].includes(x.status))||[];
 return title('Mis calificaciones','Libretas y evaluaciones terminadas, consultables desde tu propia cuenta.',button('Actualizar','reload-profile'))+
 kpis([['Promedio de libretas',avg(gr),'Media de notas importadas'],['Evaluaciones calificadas',ex.filter(x=>x.score_percent!=null).length,'Notas finales recibidas'],['Registros de libreta',gr.length,'Materia y período']])+
 studentAveragesPanel(gr)+
 section('Libretas escolares','Calificaciones ingresadas por preceptoría.')+
 panel('Notas por materia y período',gr.length?gradeTable(gr):empty('No hay libretas cargadas','Preceptoría debe cargar las notas de tu curso.'))+
 section('Evaluaciones terminadas','También incluye resultados históricos que se hayan vinculado a tu cuenta.')+
 panel('Historial de exámenes',ex.length?`<div class="desktop-records table-scroll"><table class="table"><thead><tr><th>Evaluación</th><th>Estado</th><th>Nota / 10</th><th>Finalización</th></tr></thead><tbody>${ex.map(x=>`<tr><td><strong>${esc(x.title)}</strong></td><td>${pill(x.status)}</td><td>${x.grading_status==='needs_review'?'En revisión':grade(x.score_percent)}</td><td>${when(x.finished_at)}</td></tr>`).join('')}</tbody></table></div><div class="mobile-records">${ex.map(x=>`<article class="mobile-record"><div><strong>${esc(x.title)}</strong><span class="mobile-grade">${x.grading_status==='needs_review'?'Pendiente':grade(x.score_percent)+'/10'}</span></div><p>${pill(x.status)}</p><small>${when(x.finished_at)} · ${x.legacy?'Archivo histórico':'Evaluación escolar'}</small></article>`).join('')}</div>`:empty('No hay notas de examen','Las notas se registran cuando se entrega o vincula una evaluación.'))+
 `<div class="notice" style="margin-top:17px">El promedio mostrado es orientativo. La calificación final oficial depende de las reglas académicas de la escuela.</div>`+section('Historial anterior','Si rendiste Derecho Laboral en el sistema viejo, pedí vincularlo con tu cuenta.',button('Solicitar mi evaluación anterior','request-history'));
}
function subjects(){
 return title('Materias y cursos','Organización académica por asignatura, curso y ciclo lectivo.')+
 `<div class="split">${panel('Materias registradas',state.subjects.length?`<div class="list">${state.subjects.map(x=>`<div class="list-row"><div><strong>${esc(x.name)}</strong><span class="sub">${esc(x.course||'Curso no especificado')} · ${esc(x.school_year||'2026')}</span></div><div class="actions">${button('Abrir','show-subject','secondary',`data-id="${esc(x.id)}"`)}${state.user?.platform_owner?button('Eliminar materia','owner-delete-academic','ghost small',`data-id="${esc(x.id)}" data-kind="subject"`):''}</div></div>`).join('')}</div>`:empty('Sin materias','Creá una materia desde el formulario.'))}
 ${panel('Crear materia',`<form data-form="subject"><div class="field"><label>Materia</label><input name="name" maxlength="100" required></div><div class="field"><label>Curso y división</label><input name="course" maxlength="80" required></div><div class="field"><label>Ciclo lectivo</label><input name="school_year" value="2026" maxlength="12" required></div><button class="btn primary" type="submit">Crear materia</button></form>`)}</div>`;
}
function subject(){
 const s=state.subjects.find(x=>x.id===state.id);if(!s)return subjects();
 const ex=state.subjectExams||[],drafts=ex.filter(x=>x.status==='draft').length;
 return title(esc(s.name),`${esc(s.course||'EPET N.º 6')} · Ciclo ${esc(s.school_year||'2026')}`,back('subjects'))+
 `<div class="teacher-subject-header"><div><span class="eyebrow">ESPACIO DOCENTE</span><h2>Evaluaciones de la materia</h2><p>${ex.length} evaluaciones · ${drafts} borradores en preparación</p></div><span class="teacher-subject-icon">${icon('paper',26)}</span></div>`+
 `<div class="teacher-subject-layout"><section>${panel('Biblioteca de evaluaciones',ex.length?examRows(ex,'teacher'):empty('No hay evaluaciones creadas','Usá el formulario para crear la primera.'))}</section><aside>`+
 panel('Nueva evaluación',`<div class="teacher-step"><span>1</span><div><strong>Datos básicos</strong><small>Después agregás preguntas y publicás.</small></div></div>
 <form data-form="exam-create"><div class="field"><label>Nombre de la evaluación</label><input name="title" maxlength="160" placeholder="Ej.: Evaluación integradora · Unidad 2" required></div>
 <div class="field"><label>Tiempo para responder</label><div class="teacher-duration"><input name="duration_minutes" type="number" min="5" max="240" value="45" required><span>minutos</span></div></div>
 <details class="teacher-advanced"><summary>Configuración avanzada <span>Opcional</span></summary>
 <div class="field"><label>Porcentaje de aprobación</label><input name="passing_percent" type="number" min="0" max="100" value="60" required></div>
 <div class="form-grid"><div class="field"><label>Apertura</label><input name="starts_at" type="datetime-local"></div><div class="field"><label>Cierre</label><input name="ends_at" type="datetime-local"></div></div>
 <div class="field"><label>Instrucciones para el estudiante</label><textarea name="instructions" maxlength="1800" rows="3">Leé cada consigna atentamente y respondé con claridad. Las respuestas de desarrollo serán revisadas por el docente.</textarea></div></details>
 <button class="btn primary teacher-create-btn" type="submit">Crear borrador y agregar preguntas ${icon('arrow',16)}</button></form><p class="teacher-safe-note">${icon('lock',15)} El borrador no se muestra a los alumnos hasta que lo publiques.</p>`)+
 `</aside></div>`;
}function exams(){
 return title('Gestor de evaluaciones','Una biblioteca de todas las materias, con creación, publicación y resultados.',button('Ir a materias','goto:subjects','primary'))+
 panel('Todas las evaluaciones',examRows(state.exams,'teacher'));
}
function exam(){
 const e=state.exam?.exam;if(!e)return empty('Evaluación no encontrada','Volvé a la lista de evaluaciones.');
 const qs=state.exam?.questions||[];
 const draft=e.status==='draft',mainTabs=draft?[['questions','1. Preguntas'],['details','2. Publicar']]:[['students','Alumnos'],['live','En vivo'],['review','Corregir'],['results','Resultados']];
 const extraTabs=draft?[]:[['questions','Preguntas'],['details','Configuración']];
 const tabView=state.tab==='questions'?questionsTab():state.tab==='students'?studentsTab():state.tab==='live'?liveTab():state.tab==='review'?reviewTab():state.tab==='results'?resultsTab():detailsTab();
 return title(esc(e.title),esc(e.subject?.name||subname(e.subject_id)),back('exams'))+
 '<div class="aurea-exam-status">'+pill(e.status)+(e.legacy_readonly?'<span class="pill muted">Histórico · Solo lectura</span>':'')+'<span>'+qs.length+' preguntas · '+e.duration_minutes+' minutos</span></div>'+
 '<nav class="aurea-exam-tabs" aria-label="Apartados de la evaluación">'+mainTabs.map(([id,label])=>'<button type="button" data-tab="'+id+'" class="'+(state.tab===id?'active':'')+'">'+label+'</button>').join('')+
 (extraTabs.length?'<details class="aurea-exam-more"><summary>Más opciones</summary><div>'+extraTabs.map(([id,label])=>'<button type="button" data-tab="'+id+'">'+label+'</button>').join('')+'</div></details>':'')+
 '</nav>'+tabView;
}
function questionsTab(){
 const ex=state.exam.exam,qs=state.exam.questions||[],locked=ex.status!=='draft'||ex.legacy_readonly,mode=state.questionType||'choice';
 const open=qs.filter(q=>q.grading_mode==='manual');
 const entry=(q,i)=>`<div class="teacher-question"><span class="teacher-question-num">${i+1}</span><div><strong>${esc(q.prompt)}</strong><small>${q.grading_mode==='manual'?'Desarrollo · Corrige el docente':q.kind==='boolean'?'Verdadero o falso':'Opción múltiple'} · ${Number(q.points||0)} puntos</small></div>${!locked?button('Eliminar','delete-question','ghost small',`data-id="${esc(q.id)}"`):''}</div>`;
 const bank=panel('Preguntas guardadas',qs.length?`<div class="teacher-question-list">${qs.map(entry).join('')}</div>`:empty('Sin preguntas todavía','Elegí el tipo de pregunta y redactá una consigna.'));
 if(locked)return section('Preguntas','Evaluación publicada o histórica · Solo lectura')+bank;
 const kinds=[['choice','Opción múltiple','La plataforma corrige los aciertos.','paper'],['boolean','Verdadero o falso','Dos respuestas posibles, corrección automática.','shield'],['manual','Desarrollo escrito','El alumno escribe y vos asignás puntos.','book']];
 const kindButtons=`<div class="teacher-type-grid">${kinds.map(([val,label,description,ic])=>`<button type="button" data-action="grading:${val}" class="teacher-type ${mode===val?'selected':''}" aria-pressed="${mode===val}"><span class="teacher-type-symbol">${icon(ic,19)}</span><strong>${label}</strong><small>${description}</small></button>`).join('')}</div>`;
 let fields='';
 if(mode==='manual')fields=`<input name="kind" type="hidden" value="short"><div class="field"><label>Criterios de corrección</label><textarea name="rubric" rows="3" minlength="5" maxlength="2500" required placeholder="Ej.: explica el concepto (2 puntos), argumenta (2) y da un ejemplo (1)"></textarea><small class="teacher-field-help">La respuesta se revisa en «Corrección docente» después de la entrega.</small></div>`;
 else if(mode==='boolean')fields=`<input type="hidden" name="kind" value="boolean"><div class="field"><label>Respuesta correcta</label><select name="boolean_answer" required><option value="Verdadero">Verdadero</option><option value="Falso">Falso</option></select></div>`;
 else fields=`<input type="hidden" name="kind" value="choice"><div class="field"><label>Opciones de respuesta</label><textarea id="teacher-options" name="options" rows="4" required placeholder="Escribí una opción por línea"></textarea><small class="teacher-field-help">Cada línea será una opción para el alumno. Mínimo dos.</small></div><div class="field"><label>Seleccioná la opción correcta</label><select id="teacher-correct" name="correct_answer" required><option value="">Primero escribí las opciones</option></select></div>`;
 const editor=panel('Agregar una pregunta',`<div class="teacher-step"><span>2</span><div><strong>Elegí el tipo de pregunta</strong><small>Podés combinarlos en la misma evaluación.</small></div></div>${kindButtons}
 <form data-form="question" data-mode="${mode==='manual'?'manual':'automatic'}"><div class="field"><label>Consigna</label><textarea name="prompt" rows="3" minlength="5" maxlength="2500" required placeholder="Escribí aquí la pregunta que verá el alumno"></textarea></div>${fields}<div class="teacher-question-footer"><div class="field"><label>Valor de la pregunta</label><div class="teacher-duration"><input name="points" type="number" min="0.5" max="100" step="0.5" value="${mode==='manual'?5:1}" required><span>puntos</span></div></div><button class="btn primary" type="submit">Guardar pregunta ${icon('arrow',16)}</button></div></form>`);
 const importer=`<details class="assessment-import"><summary>${icon('upload',16)} Importar preguntas desde archivo</summary><p class="teacher-field-help">TXT, DOCX, PDF de texto o JSON. Revisá las preguntas antes de guardarlas.</p><input id="questions-file" type="file" accept=".txt,.docx,.pdf,.json"><div class="field"><label>O pegá el contenido</label><textarea id="questions-text" rows="5">${esc(state.importText||'')}</textarea></div><div class="actions">${button('Interpretar','parse-questions','secondary')}${button('Cargar ejemplo','example-questions','ghost')}</div></details>${state.preview.length?preview():''}`;
 return `<div class="teacher-progress"><div><strong>Preparar evaluación</strong><small>Preguntas → Alumnos → Publicar</small></div><div class="teacher-counts"><span>${qs.length} preguntas</span><span>${open.length} de desarrollo</span><strong>${qs.reduce((n,q)=>n+Number(q.points||0),0)} puntos</strong></div></div><div class="teacher-builder"><section>${editor}${importer}</section><aside>${bank}<div class="teacher-next-tip">${icon('shield',19)}<div><strong>¿Ya terminaste?</strong><p>Revisá las preguntas y publicá desde Configuración.</p></div></div></aside></div>`;
}function liveTab(){
 const d=state.live||{students:[],summary:{}},s=d.summary||{},items=d.students||[];
 return `<div class="notice" style="margin-bottom:18px">Actualización cada 5 segundos. Los aciertos mostrados corresponden solo a preguntas automáticas; las respuestas abiertas requieren corrección docente.</div>`+
 kpis([['Alumnos asignados',s.assigned||0,'Convocatorias'],['Conectados',s.connected||0,'Actividad en los últimos 30 s'],['Finalizados',s.submitted||0,'Entregas o vencimientos']])+
 section('Supervisión en vivo','Última lectura: '+(state.lastLiveFetch?new Date(state.lastLiveFetch).toLocaleTimeString('es-AR'):'—'),button('Actualizar','live-refresh'))+
 panel('Seguimiento por alumno',items.length?`<div class="table-scroll"><table class="table"><thead><tr><th>Alumno</th><th>Estado</th><th>Avance</th><th>Aciertos</th><th>Incorrectas</th><th>Abiertas</th><th>Tiempo</th><th>Detalle</th></tr></thead><tbody>${items.map(x=>`<tr><td><strong>${esc(x.student_name)}</strong><br><span class="pill ${x.connected?'success':'muted'}">${x.connected?'Conectado':'Desconectado'}</span></td><td>${pill(x.status)}</td><td>${x.answered}/${x.total}<div class="bar"><span style="width:${x.total?100*x.answered/x.total:0}%"></span></div></td><td>${x.automatic_correct}</td><td>${x.automatic_wrong}</td><td>${x.manual_answered} ${x.pending_review?'(sin corregir)':''}</td><td>${x.remaining_seconds==null?'—':Math.ceil(x.remaining_seconds/60)+' min'}</td><td>${x.attempt_id?button('Detalle','live-student','secondary small',`data-id="${esc(x.attempt_id)}"`):'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('No hay alumnos asignados','Asigná evaluaciones a cuentas verificadas desde Alumnos.'))+
 `<div class="notice" style="margin-top:15px">El estado de conexión es aproximado y las incidencias no demuestran por sí mismas una falta disciplinaria.</div>`+studentLiveDetails();
}
function studentLiveDetails(){
 const d=state.studentMonitor;if(!d)return '';
 return section('Detalle de '+esc(d.student_name),'Progreso actualizado cada 5 segundos.',button('Cerrar','close-live-details'))+
 panel('Respuestas por pregunta',`<div class="list">${(d.questions||[]).map(q=>`<div class="list-row"><div><span class="sub">Pregunta ${q.number} · ${q.grading_mode==='manual'?'Corrección docente':'Automática'}</span><strong>${esc(q.prompt)}</strong><p style="white-space:pre-wrap;font-size:12px;margin-top:6px">Respuesta: ${esc(q.response||'Sin responder')}</p>${q.grading_mode==='automatic'?`<span class="sub">Clave: ${esc(q.correct_answer)}</span>`:''}</div><span class="pill ${q.status==='correct'||q.status==='reviewed'?'success':q.status==='incorrect'?'danger':'warn'}">${({correct:'Correcta',incorrect:'Incorrecta',pending_review:'Por corregir',reviewed:'Calificada',unanswered:'Sin respuesta'})[q.status]||q.status}</span></div>`).join('')}</div>`)+
 section('Incidencias del intento','Revisión documentada de eventos de supervisión.')+
 panel('Registro de incidencias',d.incidents?.length?d.incidents.map(i=>`<div class="question"><div class="section-head"><strong>${esc(i.kind)}</strong><span class="pill ${i.reviewed_at?'success':'warn'}">${i.reviewed_at?'Revisada':'Pendiente'}</span></div><p>${esc(i.detail||'Sin detalle')} · ${i.created_at?new Date(i.created_at).toLocaleString('es-AR'):'—'}</p>${i.reviewed_at?`<p>Resolución: ${esc(i.resolution||'Sin descripción')}</p>`:`<form data-form="incident" data-attempt="${esc(state.studentMonitorAttempt)}" data-incident="${esc(i.id)}" style="margin-top:12px"><div class="field"><label>Resolución docente</label><input name="resolution" minlength="4" maxlength="1500" required></div><button class="btn secondary" type="submit">Registrar revisión</button></form>`}</div>`).join(''):empty('Sin incidencias','No se registraron eventos de supervisión.'));
}
function reviewTab(){
 const d=state.review||{items:[],pending:0},items=d.items||[];
 return kpis([['Pendientes',d.pending||0,'Respuestas que esperan nota'],['Abiertas',items.length,'Entregadas para revisión'],['Revisadas',items.length-(d.pending||0),'Puntajes guardados']])+
 section('Corrección docente','Al completar las revisiones se calcula la nota final.',button('Actualizar','review-refresh'))+
 (items.length?items.map(q=>`<div class="panel" style="margin-bottom:14px"><div class="section-head"><div><h3>${esc(q.student_name)}</h3><p>${esc(q.prompt)}</p></div><span class="pill ${q.reviewed_at?'success':'warn'}">${q.reviewed_at?'Revisada':'Pendiente'}</span></div><div class="soft-tile"><strong>Respuesta del alumno</strong><p style="white-space:pre-wrap">${esc(q.response)}</p></div><div class="soft-tile" style="margin-top:10px"><strong>Rúbrica</strong><p>${esc(q.rubric||'Sin rúbrica definida')}</p></div><form data-form="review" data-attempt="${esc(q.attempt_id)}" data-question="${esc(q.question_id)}" style="margin-top:17px"><div class="form-grid"><div class="field"><label>Puntos (máximo ${q.max_points})</label><input type="number" name="points" min="0" max="${q.max_points}" step="0.25" value="${q.awarded_points??0}" required></div><div class="field"><label>Comentario</label><input name="comment" maxlength="1500" value="${esc(q.review_comment||'')}"></div></div><button class="btn primary" type="submit">Guardar corrección</button></form></div>`).join(''):panel('Cola de corrección',empty('Sin respuestas pendientes','Las respuestas aparecerán cuando los alumnos entreguen.')));
}
function preview(){
 return '<section class="aurea-import-review"><header><strong>'+state.preview.length+' preguntas interpretadas</strong><p>Las preguntas NO están guardadas aún. Revisá y confirmá.</p>'+button('Guardar '+state.preview.length+' preguntas','save-preview','primary')+'</header>'+
 state.preview.map((q,i)=>'<div data-preview="'+i+'" class="aurea-import-card"><div class="section-head"><strong>Pregunta '+(i+1)+'</strong>'+button('Quitar','remove-preview','ghost small','data-index="'+i+'"')+'</div>'+
 '<label>Pregunta</label><textarea data-field="prompt" rows="2">'+esc(q.prompt)+'</textarea>'+
 '<div class="aurea-import-grid"><div><label>Modalidad</label><select data-field="kind"><option value="choice" '+(q.kind==='choice'?'selected':'')+'>Opción múltiple</option><option value="boolean" '+(q.kind==='boolean'?'selected':'')+'>Verdadero/Falso</option><option value="short" '+(q.kind==='short'?'selected':'')+'>Desarrollo escrito</option></select></div><div><label>Puntos</label><input type="number" data-field="points" min=".5" max="100" step=".5" value="'+Number(q.points||1)+'"></div></div>'+
 '<label>Opciones · una por línea</label><textarea data-field="options" rows="3">'+esc((q.options||[]).join('\n'))+'</textarea>'+
 '<label>Respuesta correcta</label><input data-field="correct_answer" value="'+esc(q.correct_answer||'')+'">'+
 '<label>Rúbrica · solo desarrollo</label><textarea data-field="rubric" rows="2">'+esc(q.rubric||'')+'</textarea></div>').join('')+'</section>';
}
function studentsTab(){
 const e=state.exam.exam,r=state.results||[],verified=(state.students||[]).filter(x=>x.identity_verified);
 const assigned=new Set(r.map(x=>x.student_account_id).filter(Boolean));
 const choices=verified.filter(x=>!assigned.has(x.id));
 const rows=r.length?r.map(x=>'<div class="aurea-student"><div><strong>'+esc(x.student_name)+'</strong><small>'+(x.status==='not_started'?'No inició':esc(x.status))+(x.score_percent==null?'':' · '+grade(x.score_percent)+'/10')+'</small></div><div class="actions">'+
 (x.can_unassign?button('Retirar','unassign-student','secondary small','data-id="'+esc(x.invite_id)+'"'):'')+
 (state.user?.platform_owner&&!e.legacy_readonly&&x.invite_id?button('Reiniciar','owner-reset-student','secondary small','data-id="'+esc(x.invite_id)+'"')+button('Eliminar','owner-remove-student','danger small','data-id="'+esc(x.invite_id)+'"'):'')+
 '</div></div>').join(''):empty('Todavía no hay asignaciones','Elegí un alumno verificado para empezar.');
 const form=e.status==='published'&&!e.legacy_readonly?'<form data-form="assign"><div class="field"><label>Elegí un alumno verificado</label><select name="username" required><option value="">Seleccionar alumno</option>'+choices.map(x=>'<option value="'+esc(x.username)+'">'+esc(x.display_name)+' · @'+esc(x.username)+' · '+esc(x.course||'Sin curso')+'</option>').join('')+'</select></div><button class="btn primary" type="submit">Asignar alumno</button></form>':
 '<p>Primero publicá la evaluación. Después podés seleccionar alumnos.</p>'+button('Abrir configuración','goto-exam-settings','secondary');
 return '<div class="aurea-assign-layout">'+panel('Alumnos de esta evaluación',rows)+panel('Asignar evaluación',form)+'</div>';
}
function resultsTab(){
 const r=state.results,done=r.filter(x=>x.score_percent!=null);
 return kpis([['Alumnos',r.length,'Asignados y archivados'],['Con calificación',done.length,'Notas registradas'],['Promedio / 10',done.length?(done.reduce((a,x)=>a+Number(x.score_percent),0)/done.length/10).toFixed(2):'—','Exámenes con nota']])+
 section('Historial de resultados','Incluye la evaluación antigua de Derecho Laboral.',button('Exportar CSV','export-results'))+
 panel('Calificaciones',r.length?`<div class="desktop-records table-scroll"><table class="table"><thead><tr><th>Alumno</th><th>Estado</th><th>Nota / 10</th><th>Versión</th><th>Incidentes</th><th>Fecha</th></tr></thead><tbody>${r.map(x=>`<tr><td><strong>${esc(x.student_name)}</strong></td><td>${pill(x.status)}</td><td>${grade(x.score_percent)}</td><td>${x.bank_version||'Actual'}</td><td>${Number(x.incident_count||0)}</td><td>${when(x.finished_at)}</td></tr>`).join('')}</tbody></table></div><div class="mobile-records">${r.map(x=>`<article class="mobile-record"><div><strong>${esc(x.student_name)}</strong><span class="mobile-grade">${grade(x.score_percent)}/10</span></div><div>${pill(x.status)}</div><small>${when(x.finished_at)} · Versión ${x.bank_version||'actual'} · ${Number(x.incident_count||0)} incidencias históricas</small></article>`).join('')}</div>`:empty('Aún no hay calificaciones','Las notas quedarán guardadas aquí después de las entregas.'))+
 `<div class="notice" style="margin-top:17px">Un evento de navegador registrado como incidencia no demuestra por sí solo una trampa.</div>`;
}
function detailsTabOriginal(){
 const e=state.exam.exam;
 return `<div class="split">${panel('Ficha académica',`<div class="list"><div class="list-row"><span>Materia</span><strong>${esc(e.subject?.name||'')}</strong></div><div class="list-row"><span>Duración</span><strong>${e.duration_minutes} minutos</strong></div><div class="list-row"><span>Aprobación</span><strong>${e.passing_percent}%</strong></div><div class="list-row"><span>Estado</span>${pill(e.status)}</div>${e.starts_at?`<div class="list-row"><span>Desde</span><strong>${new Date(e.starts_at).toLocaleString('es-AR')}</strong></div>`:''}${e.ends_at?`<div class="list-row"><span>Hasta</span><strong>${new Date(e.ends_at).toLocaleString('es-AR')}</strong></div>`:''}</div><div class="divider"></div><p style="white-space:pre-wrap">${esc(e.instructions||'Sin instrucciones adicionales.')}</p>`)}
 ${panel('Acciones',e.legacy_readonly?`<p>El historial antiguo permanece inalterable. Podés crear una nueva evaluación a partir de una versión.</p><div class="divider"></div><div class="field"><label>Versión original</label><select id="clone-bank"><option value="3">Versión 3</option><option value="2">Versión 2</option><option value="1">Versión 1</option></select></div>${button('Crear copia editable','clone-exam','primary')}`:e.status==='draft'?`<p style="margin-bottom:15px">Revisá las preguntas antes de publicar. Después de publicar quedarán bloqueadas para evitar cambios durante las entregas.</p>${button('Publicar evaluación','publish','primary')}`:e.status==='published'?`<p style="margin-bottom:15px">La evaluación acepta nuevos alumnos asignados. Cerrarla conserva sus resultados.</p>${button('Cerrar convocatoria','close','danger')}`:'<p>La evaluación está cerrada. Sus registros históricos siguen disponibles para consulta.</p>')}</div>`;
}
function detailsTab(){
 const e=state.exam.exam;
 if(e.legacy_readonly)return detailsTabOriginal();
 const isOwner=state.user?.platform_owner===true;
 const description=isOwner?'Como Owner podés eliminar esta evaluación y sus datos de prueba, incluso si tiene entregas. Esta acción es irreversible.':'Solo podés eliminarla si no tiene entregas.';
 const deletion=isOwner?button('Eliminar evaluación','owner-delete-academic','danger',`data-id="${esc(e.id)}" data-kind="exam"`):button('Eliminar evaluación','delete-exam','danger');
 return detailsTabOriginal()+panel('Eliminar evaluación',`<p>${description}</p>`+deletion);
}
function reportbook(){
 const r=state.report,people=state.students;
 return title('Libretas y calificaciones','Una carga por alumno, materia, ciclo lectivo y período académico.')+
 kpis([['Notas registradas',r.length,'Últimos 500 registros'],['Alumnos',people.length,'Cuentas registradas'],['Promedio simple',avg(r),'De las notas visibles']])+
 `<div class="split">${panel('Historial',r.length?gradeTable(r.slice(0,100),true):empty('Sin notas registradas','Podés importar una libreta desde el panel de carga.'),button('Exportar CSV','export-grades'))}
 ${panel('Cargar libreta',`<div class="file-area"><div class="field"><label>Archivo CSV</label><input id="libreta-file" type="file" accept=".csv,.txt"></div><div class="hint">Encabezados: usuario, materia, periodo, nota, año.</div></div><div class="divider"></div><form data-form="report"><div class="field"><label>Contenido de libreta</label><textarea id="libreta-text" name="csv" rows="11" required></textarea></div><button type="submit" class="btn primary">Validar y guardar</button></form><div class="divider"></div><div class="notice">Solo se cargan notas de cuentas verificadas. Al importar el mismo período se actualiza su registro.</div>`)}</div>`;
}
function students(){
 const a=state.students;
 return title('Directorio de alumnos','Usuarios, cursos y estado de verificación de identidad.',button('Actualizar','reload-students'))+
 panel('Alumnos registrados',a.length?`<div class="list">${a.map(s=>`<div class="list-row"><div><strong>${esc(s.display_name)}</strong><span class="sub">@${esc(s.username)} · ${esc(s.course||'Sin curso')}</span></div><div class="actions"><span class="pill ${s.identity_verified?'success':'warn'}">${s.identity_verified?'Verificado':'Sin verificar'}</span>${access()==='admin'?button(s.identity_verified?'Revocar':'Verificar',s.identity_verified?'unverify':'verify',s.identity_verified?'secondary small':'primary small',`data-id="${esc(s.id)}"`):''}</div></div>`).join('')}</div>`:empty('No hay cuentas de alumnos','Cuando se registren alumnos aparecerán acá.'))+
 (access()!=='admin'?'':section('Notas anteriores','Vinculá los resultados históricos únicamente tras comprobar la identidad.')+
 panel('Vinculación de Derecho Laboral',`<form data-form="link"><div class="form-grid"><div class="field"><label>Registro histórico</label><select name="attempt_id" required><option value="">Elegir registro</option>${state.unlinked.map(x=>`<option value="${esc(x.attempt_id)}">${esc(x.student_name)} · ${grade(x.score_percent)}/10</option>`).join('')}</select></div><div class="field"><label>Cuenta verificada</label><select name="student_id" required><option value="">Elegir alumno</option>${a.filter(x=>x.identity_verified).map(x=>`<option value="${esc(x.id)}">${esc(x.display_name)} (@${esc(x.username)})</option>`).join('')}</select></div></div><button class="btn primary" type="submit">Vincular registro</button></form><p class="hint" style="margin-top:10px">No se asocian calificaciones basándose únicamente en un nombre.</p>`));
}
function staff(){
 const s=state.staff.filter(x=>x.role!=='student');
 return title('Personal de la plataforma','Accesos diferenciados para docentes, preceptores y administración.')+
 `<div class="split">${panel('Equipo registrado',s.length?`<div class="list">${s.map(x=>`<div class="list-row"><div><strong>${esc(x.display_name)}</strong><span class="sub">@${esc(x.username)} · ${titleRole(x.role)}</span></div><span class="pill ${x.active?'success':'danger'}">${x.active?'Activo':'Inactivo'}</span></div>`).join('')}</div>`:empty('Sin personal','Podés crear cuentas desde el formulario.'))}
 ${panel('Nuevo acceso',`<form data-form="staff"><div class="field"><label>Nombre completo</label><input name="display_name" minlength="5" required></div><div class="field"><label>Usuario</label><input name="username" minlength="4" required></div><div class="field"><label>Tipo de cuenta</label><select name="role"><option value="teacher">Docente</option><option value="preceptor">Preceptor</option></select></div><div class="field"><label>Contraseña inicial</label><input name="password" type="password" minlength="12" required></div><button class="btn primary" type="submit">Crear acceso</button></form>`)}</div>`;
}
function avatar(p,n=75){const name=p?.nickname||p?.display_name||'?';return `<span class="profile-avatar" style="width:${n}px;height:${n}px">${p?.avatar_url?`<img src="${esc(p.avatar_url)}" alt="Foto de ${esc(name)}">`:esc(name.charAt(0).toUpperCase())}</span>`;}
function roleSeal(p){
 const role=p.platform_owner?'Owner':p.role==='admin'?'Administrador':p.role==='teacher'?'Docente':p.role==='preceptor'?'Preceptor':'Alumno';
 const verified=!!(p.verified||p.identity_verified);
 const kind=p.platform_owner?'owner':["admin","teacher","preceptor","student"].includes(p.role)?p.role:"student";
 const roleIcon=p.platform_owner?'shield':p.role==='admin'?'gear':p.role==='teacher'?'cap':p.role==='preceptor'?'book':'people';
 return `<span class="role-seal rank-badge rank-badge--${kind} ${verified?'rank-badge--verified':'rank-badge--pending'}" title="${esc(role)}${verified?' verificado':' sin verificar'}">${icon(roleIcon,15)} <strong>${esc(role)}</strong>${verified?'<span aria-label="Verificado" class="rank-check">✓</span>':'<span class="rank-unverified">Sin verificar</span>'}</span>`;
}
function themeChoices(p){
 const themes=[["copper","Ópalo naranja"],["amber","Ámbar dorado"],["jade","Jade verde"],["indigo","Índigo violeta"]];
 return `<div class="field"><label>Colores de toda la plataforma</label><input type="hidden" name="profile_accent" value="${esc(p.profile_accent||'copper')}"><div class="theme-gallery" role="group" aria-label="Elegir tema">${themes.map(([v,t])=>`<button type="button" class="theme-tile ${(p.profile_accent||'copper')===v?'selected':''}" data-action="theme-preview" data-theme="${v}" aria-pressed="${(p.profile_accent||'copper')===v}"><span class="theme-tile__preview theme-tile__preview--${v}"></span><span>${t}</span><span class="theme-tile__tick">✓</span></button>`).join('')}</div><p class="hint">El tema cambia menús, tarjetas y botones de Áurea.</p></div>`;
}
function account(){
 const p=state.myProfile||state.user,colors={copper:'#b65d2d',amber:'#bd8236',jade:'#277765',indigo:'#555a96'};
 return title('Mi perfil','Personalizá tu presencia escolar sin modificar tu identidad institucional.')+(p.platform_owner?panel('Creador de Áurea',button('Centro Owner','goto:owner','primary')+button('Mi historial escolar','goto:owner-history')):'')+
 `<section class="profile-cover" style="--profile-color:${colors[p.profile_accent]||colors.copper}"><div class="profile-heading">${avatar(p,105)}<div><div class="eyebrow">IDENTIDAD ACADÉMICA</div><h2>${esc(p.nickname||p.display_name)}</h2><div class="profile-handle">@${esc(p.username)}</div><div style="margin-top:10px">${roleSeal(p)}</div></div></div></section>`+
 (state.user.must_change_password?'<div class="notice" style="margin:18px 0">Cambiá la contraseña inicial para habilitar las funciones de tu cuenta.</div>':'')+
 `<div class="profile-content-grid">${panel('Editar presentación',`<form data-form="profile"><div class="field"><label>Nombre visible o apodo</label><input name="nickname" maxlength="40" value="${esc(p.nickname||'')}"></div><div class="field"><label>Descripción del perfil</label><textarea name="biography" maxlength="420" rows="5">${esc(p.biography||'')}</textarea></div><div class="field"><label>Intereses académicos</label><input name="academic_interests" maxlength="120" value="${esc(p.academic_interests||'')}"></div>${themeChoices(p)}<button class="btn primary" type="submit" ${state.user.must_change_password?'disabled':''}>Guardar perfil</button></form><div class="divider"></div><h3>Fotografía</h3><p class="hint" style="margin:10px 0">Solo fotos JPG, PNG y WebP. No se admiten videos, GIF ni archivos ejecutables.</p><div class="field"><label>Elegir fotografía</label><input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" ${state.user.must_change_password?'disabled':''}></div>${p.avatar_url?button('Quitar foto','avatar-remove','ghost'):''}`)}
 <div class="grid">${panel('Datos oficiales',`<div class="list"><div class="list-row"><span>Nombre escolar</span><strong>${esc(p.display_name)}</strong></div><div class="list-row"><span>Cuenta</span><strong>@${esc(p.username)}</strong></div><div class="list-row"><span>Rol</span>${roleSeal(p)}</div>${p.course?`<div class="list-row"><span>Curso</span><strong>${esc(p.course)}</strong></div>`:''}</div><p class="hint" style="margin-top:12px">Los distintivos y nombres oficiales los asigna administración, no el usuario.</p>`)}
 ${panel('Seguridad',`<div class="notice safe">La foto se guarda en un espacio privado y se consulta mediante un enlace temporal.</div><div class="divider"></div><h3>Actualizar contraseña</h3><form data-form="password"><div class="field"><label>Contraseña actual</label><input name="old_password" type="password" required></div><div class="field"><label>Nueva contraseña</label><input name="new_password" type="password" minlength="12" required></div><button type="submit" class="btn secondary">Cambiar contraseña</button></form><div class="divider"></div>${button('Cerrar sesión','logout','ghost')}`)}</div></div>`;
}
function communityView(){return window.AureaSocial?.view({state,esc,roleSeal,title,panel,button,empty})||'<div class="notice">Comunidad en preparación</div>';}
async function loadCommunity(more=false){await window.AureaSocial?.load({state,api:communityAPI,draw},more);}
function directory(){
 const arr=(state.directory||[]).filter(p=>p.verified),colors={copper:'#b65d2d',amber:'#bd8236',jade:'#277765',indigo:'#555a96'};
 return title('Comunidad educativa','Perfiles oficiales de profesores, preceptores y administración.')+
 `<div class="notice" style="margin-bottom:18px">Las verificaciones dependen del servidor. No hay videos, publicaciones abiertas ni datos académicos privados de compañeros.</div>`+
 (arr.length?`<div class="grid cols2">${arr.map(p=>`<div class="panel person-card" style="--profile-color:${colors[p.profile_accent]||colors.copper}"><div class="person-card-header">${avatar(p,68)}<div><h3>${esc(p.nickname||p.display_name)}</h3>${p.nickname?`<small>${esc(p.display_name)}</small>`:''}<div>${roleSeal(p)}</div></div></div><p style="margin:15px 0">${esc(p.biography||'Este integrante todavía no completó su presentación.')}</p>${p.academic_interests?`<span class="pill muted">${esc(p.academic_interests)}</span>`:''}</div>`).join('')}</div>`:empty('Todavía no hay perfiles verificados','El personal aparecerá aquí al habilitar sus cuentas.'));
}

function ownerManagement(){
 const d=state.ownerData||{},list=d.accounts||[],claims=d.claims||[];
 const gradeRows=list.map(p=>{
  const badge=roleSeal({...p,verified:p.identity_verified});
  const controls=p.platform_owner?'<span class="owner-immutable">Protegida · única cuenta Owner</span>':
  `<div class="owner-account-actions">
  <div class="owner-role-selector"><label for="role-${esc(p.id)}">Rango institucional</label><select id="role-${esc(p.id)}" data-owner-role="${esc(p.id)}">
  ${[['student','Alumno'],['teacher','Docente'],['preceptor','Preceptor'],['admin','Administrador']].map(([r,title])=>`<option value="${r}" ${p.role===r?'selected':''}>${title}</option>`).join('')}</select>
  ${button('Asignar rango','owner-rank','secondary small',`data-id="${esc(p.id)}"`)}
  </div>
  <div class="owner-verify-row">
   ${p.identity_verified?(p.role==='student'?button('Quitar verificación','owner-unverify','ghost small',`data-id="${esc(p.id)}"`):'<span class="owner-immutable">Insignia certificada por el cargo</span>'):button('Verificar identidad','owner-verify','primary small',`data-id="${esc(p.id)}"`)}
   ${button(p.active?'Suspender':'Reactivar',p.active?'owner-disable':'owner-enable','secondary small',`data-id="${esc(p.id)}"`)}
   ${button('Cerrar sesiones','owner-sessions','ghost small',`data-id="${esc(p.id)}"`)}
  </div></div>`;
  return `<div class="owner-account-item">
    <div class="owner-account-identity"><div><strong>${esc(p.display_name)}</strong><div class="sub">@${esc(p.username)}</div></div><div>${badge}</div><span class="pill ${p.active?'success':'danger'}">${p.active?'Cuenta activa':'Suspendida'}</span></div>
    ${controls}
   </div>`;
 }).join('');
 const claimRows=claims.map(c=>`<div class="owner-claim"><div><strong>${esc(c.display_name||c.username)}</strong><div class="sub">@${esc(c.username||'')}</div><span class="pill ${c.identity_verified?'success':'warn'}">${c.identity_verified?'Identidad verificada':'Identidad pendiente'}</span><span class="pill muted">${esc(c.status)}</span></div>${c.status==='pending'?`<div class="actions">${button('Aprobar','owner-claim-approve','primary small',`data-id="${esc(c.id)}"`)}${button('Rechazar','owner-claim-reject','secondary small',`data-id="${esc(c.id)}"`)}</div>`:''}</div>`).join('');
 return section('Rangos e identidades','Los distintivos representan permisos reales, no etiquetas decorativas.')+
 `<div class="rank-legend">${[['owner','Owner · exclusivo'],['admin','Administrador'],['teacher','Docente'],['preceptor','Preceptor'],['student','Alumno']].map(([code,name])=>`<span class="rank-legend-item rank-badge--${code}">${esc(name)}</span>`).join('')}</div>`+
 panel('Gestión institucional',list.length?`<div class="owner-list">${gradeRows}</div>`:empty('No hay cuentas para administrar','La lista aparecerá cuando el servidor responda.'))+
 section('Recuperación de resultados antiguos','Revisá las solicitudes para recuperar Derecho Laboral. La identidad debe coincidir y estar verificada.')+
 panel('Solicitudes pendientes',claims.length?`<div class="owner-list">${claimRows}</div>`:empty('Sin solicitudes','Todavía no hay pedidos de recuperación.'))+
 `<div class="notice" style="margin-top:16px">Los rangos Docente, Preceptor y Administrador otorgan funciones reales; verificarlos y asignarlos queda registrado. Nadie puede crear otro Owner. Al cambiar un rango, se cierran las sesiones de esa cuenta.</div>`;
}
function ownerPortal(){const d=state.ownerData||{},m=d.metrics||{};return title('Centro Owner','Panel exclusivo de @santyx. Los permisos se verifican en el servidor.')+
kpis([['Usuarios',m.school_accounts??'—','Cuentas registradas'],['Evaluaciones',m.school_exams??'—','Exámenes'],['Sesiones activas',d.active_sessions??'—','Accesos vigentes']])+
section('Identidad de propietario','Santyx está identificado como creador y administrador técnico de Áurea.')+
panel('Protección del sistema','<p>El servidor reconoce únicamente la cuenta fundadora. El rango no se puede crear ni transferir desde la interfaz pública. Las operaciones administrativas y de cuentas requieren sesión válida.</p>')+ownerManagement()+
section('Historial de Derecho Laboral','Tu evaluación original está asociada a tu cuenta.',button('Consultar mi historial','goto:owner-history'));}
function ownerHistory(){const exams=state.profile?.exams||[];return title('Mi historial','Resultados históricos vinculados a Santyx.')+
panel('Evaluaciones realizadas',exams.length?'<div class="table-scroll"><table class="table"><thead><tr><th>Evaluación</th><th>Nota sobre 10</th><th>Fecha</th></tr></thead><tbody>'+exams.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+grade(x.score_percent)+'</td><td>'+when(x.finished_at)+'</td></tr>').join('')+'</tbody></table></div>':empty('Sin resultados','No se encontraron registros asociados.'));}

function help(){
 return title('Centro de ayuda','Guías completas reunidas fuera de los formularios.')+
 `<div class="grid cols3">${panel('Alumnos',steps(['Registrá tu usuario personal.','Solicitá a administración la verificación escolar.','Consultá los exámenes asignados en tu perfil.','Rendí y revisá las notas.','Consultá tu libreta desde Mis notas.']))}${panel('Docentes',steps(['Creá o elegí una materia.','Prepará preguntas manualmente o importá un documento.','Revisá y publicá.','Asigná la evaluación por usuario.','Consultá el historial y descargá resultados.']))}${panel('Preceptoría',steps(['Comprobá las cuentas de alumnos.','Importá el CSV con notas.','Revisá las materias, períodos y promedios.','Administración vincula las notas anteriores.']))}</div>`+
 section('Formatos de archivo')+
 panel('Preguntas',`<p style="font-size:12px;margin-bottom:12px">El transformador reconoce números, opciones A/B/C y una línea de respuesta. Cada pregunta puede revisarse antes de guardarla.</p><pre style="white-space:pre-wrap;background:#faf1e6;padding:15px;border-radius:10px">1. ¿Para qué sirve una evaluación?\nA) Comprobar aprendizajes\nB) Borrar información\nRespuesta: A</pre><div class="divider"></div><p style="font-size:12px">Libretas CSV: usuario;materia;periodo;nota;año. Los PDF escaneados pueden requerir transcripción adicional.</p>`)+
 section('Seguridad y supervisión')+
 `<div class="notice">Las salidas de pantalla son incidencias para revisión, no pruebas automáticas de trampas. Una página web no puede detectar de manera infalible el uso de ChatGPT ni de otros dispositivos.</div>`;
}
function examReady(){
 const e=state.profile?.exams?.find(x=>x.invite_id===state.id);
 if(!e)return title('Convocatoria no encontrada','No está asignada a tu cuenta.',back('student-exams'))+empty('Sin acceso','Consultá con tu docente.');
 const before=e.starts_at&&Date.parse(e.starts_at)>Date.now(),after=e.ends_at&&Date.parse(e.ends_at)<Date.now(),verified=state.profile?.profile?.identity_verified;
 const eligible=!before&&!after&&verified&&e.exam_status==='published'&&e.status==='no_iniciada';
 return title(esc(e.title),'Información oficial antes de comenzar a rendir.',back('student-exams'))+
 `<div class="split">${panel('Condiciones de la evaluación',`<div class="list"><div class="list-row"><span>Duración</span><strong>${e.duration_minutes} minutos</strong></div><div class="list-row"><span>Disponibilidad</span>${pill(e.exam_status)}</div>${e.starts_at?`<div class="list-row"><span>Apertura</span><strong>${new Date(e.starts_at).toLocaleString('es-AR')}</strong></div>`:''}${e.ends_at?`<div class="list-row"><span>Fin</span><strong>${new Date(e.ends_at).toLocaleString('es-AR')}</strong></div>`:''}</div><div class="divider"></div><h3>Instrucciones del profesor</h3><p style="white-space:pre-wrap;margin:12px 0 20px">${esc(e.instructions||'Leé las preguntas con atención. Podés volver a preguntas anteriores antes de entregar.')}</p><div class="notice">El cronómetro comienza cuando seleccionás «Iniciar evaluación», no al abrir esta página. Una vez iniciada, la entrega queda asociada a tu usuario.</div><div class="actions" style="margin-top:18px">${eligible?button('Iniciar evaluación','begin-selected','primary'):''}${button('Volver','goto:student-exams')}</div>`)}
 ${panel('Estado de tu convocatoria',`<div class="role-seal ${verified?'is-verified':'is-pending'}">${verified?'Identidad verificada':'Identidad pendiente'}</div><div class="divider"></div>${before?'<div class="notice">La convocatoria aún no comenzó.</div>':after?'<div class="notice">La fecha de cierre ya pasó.</div>':!verified?'<div class="notice">Administración debe verificar tu cuenta para rendir.</div>':'<p>La evaluación está disponible para tu cuenta. Las respuestas automáticas se corrigen en el servidor; las abiertas requieren revisión del profesor.</p>'}`)}</div>`;
}
function take(){
 const a=state.attempt;if(!a?.questions?.length)return empty('No hay una evaluación abierta','Volvé a tu perfil para comenzar.');
 if(state.examResetting)return '<div class="aurea-focus-lock"><div class="aurea-focus-symbol">'+icon('shield',28)+'</div><h2>Reiniciando la evaluación</h2><p>Se están borrando las respuestas anteriores. El tiempo disponible continúa sin cambios.</p></div>';
 if(state.examFullscreenRequired&&!document.fullscreenElement)return '<div class="aurea-focus-lock"><div class="aurea-focus-symbol">'+icon('shield',28)+'</div><h2>Volvé al modo de evaluación</h2><p>Para continuar tenés que volver a pantalla completa. Las salidas confirmadas reinician las respuestas, sin devolverte el tiempo.</p>'+button('Volver a pantalla completa','restore-exam-fullscreen','primary')+'</div>';
 const i=a.index||0,q=a.questions[i],total=a.questions.length,count=a.questions.filter(x=>String(x.response||'').trim()).length;
 return title(esc(a.title),`Pregunta ${i+1} de ${total} · ${count} respondidas`,`<span class="counter" id="clock">--:--</span>`)+
 `<div class="bar"><span style="width:${count/total*100}%"></span></div><div class="split" style="margin-top:20px">
 ${panel('Pregunta '+(i+1),`<h3 class="question-title">${esc(q.prompt)}</h3>${q.kind==='short'?`<div class="field"><label for="short-answer">Tu respuesta</label><textarea id="short-answer" maxlength="1800" rows="7">${esc(q.response||'')}</textarea></div>`:(q.options||[]).map(v=>`<label class="option"><input type="radio" name="answer" value="${esc(v)}" ${v===q.response?'checked':''}>${esc(v)}</label>`).join('')}<p class="hint" id="save-state" aria-live="polite">${q.response?'Respuesta guardada':'Sin responder'}</p><div class="divider"></div><div class="actions">${button('Anterior','prev','secondary',i===0?'disabled':'')}${button('Guardar','save')}${button(i===total-1?'Revisar y entregar':'Guardar y siguiente','next','primary')}</div>`)}
 <div class="grid">${panel('Mapa de preguntas',`<div class="question-nav">${a.questions.map((v,n)=>`<button class="question-nav-button ${n===i?'active':''} ${String(v.response||'').trim()?'answered':''}" type="button" data-action="jump-question" data-index="${n}" aria-label="Pregunta ${n+1}">${n+1}</button>`).join('')}</div><p class="hint" style="margin:13px 0">${count} de ${total} respuestas guardadas.</p>${button('Revisar y entregar','submit-now')}`)}
 ${panel('Instrucciones',`<details ${i===0?'open':''}><summary>Indicaciones del profesor</summary><p style="white-space:pre-wrap;margin-top:10px">${esc(a.instructions||'Podés revisar las respuestas antes de entregar.')}</p></details><div class="divider"></div><div class="notice">Tus respuestas se guardan en el servidor. Si aparece un error de conexión, reintentá el guardado.</div>`)}</div></div>`;
}
function decorateProfile(){
 if(!state.user||!state.myProfile)return;
 const p=state.myProfile;
 document.querySelectorAll('.identity .avatar,.topbar .avatar').forEach(x=>{
  if(p.avatar_url){const image=document.createElement('img');image.src=p.avatar_url;image.alt='Foto de perfil';image.referrerPolicy='no-referrer';image.style.cssText='width:100%;height:100%;object-fit:cover;display:block';x.replaceChildren(image);x.style.overflow='hidden';}
 });
 const label=document.querySelector('.identity strong');if(label)label.textContent=p.nickname||p.display_name;
 const sub=document.querySelector('.identity small');if(sub)sub.textContent=(p.identity_verified?'✓ ':'')+titleRole(p.role);
}
function applyTheme(t,save=false){
 const valid=['copper','amber','jade','indigo'];
 let chosen=valid.includes(t)?t:null;
 if(!chosen){try{chosen=localStorage.getItem(state.user?.username?'aurea_theme_user_'+state.user.username:'aurea_theme_last')||localStorage.getItem('aurea_theme_last')}catch{}}
 chosen=valid.includes(chosen)?chosen:'copper';
 document.documentElement.dataset.theme=chosen;
 const tag=document.querySelector('meta[name="theme-color"]');if(tag)tag.content={copper:'#faf7f0',amber:'#faf6e7',jade:'#f1faf6',indigo:'#f6f4fc'}[chosen];
 if(save){try{localStorage.setItem('aurea_theme_last',chosen);if(state.user?.username)localStorage.setItem('aurea_theme_user_'+state.user.username,chosen)}catch{}}
 return chosen;
}
function draw(){
 applyTheme(state.myProfile?.profile_accent);
 const views={owner:ownerPortal,'owner-history':ownerHistory,home:access()==='public'?welcomeHome:access()==='student'?studentHome:access()==='preceptor'?preceptorHome:staffHome,catalog,publicExam,login,register,studentExams,grades,subjects,subject,exams,exam,reportbook,students,staff,account,directory,community:communityView,help,take,examReady};
 const routeMap={'public-exam':'publicExam','student-exams':'studentExams','exam-ready':'examReady'};
 const key=routeMap[state.route]||state.route;const fn=views[key]||views.home;if(state.loadingRoute&&key==='exam'&&!state.exam){$('#app').innerHTML=shell('<div class="route-skeleton"><strong>Abriendo evaluación…</strong><p>Consultando preguntas y resultados.</p></div>');return;}
 $('#app').innerHTML=state.user?shell(fn()):authShell(fn());if(state.user)decorateProfile();
}
async function loadAll(force=false){
 if(!force&&Date.now()-(state.workspaceFetched||0)<30000)return;
 const received=await api('subjects');
 const subjects=received.subjects||[];
 state.subjects=subjects;
 if(!subjects.length){state.exams=[];state.workspaceFetched=Date.now();return;}
 const results=[];
 for(let i=0;i<subjects.length;i+=8){
  const batch=subjects.slice(i,i+8);
  const rows=await Promise.all(batch.map(async sub=>{
    const r=await api('exams',{subject_id:sub.id});
    return (r.exams||[]).map(ex=>({...ex,subject_id:sub.id}));
  }));
  results.push(...rows.flat());
 }
 state.exams=results;state.workspaceFetched=Date.now();
}
async function loadProfile(){state.profile=await users('profile');}
let activeProfileRequest=null;
async function loadMyProfile(){
 if(activeProfileRequest)return activeProfileRequest;
 const username=state.user?.username;
 activeProfileRequest=profileAPI('get').then(r=>{
  if(username!==state.user?.username)return null;
  const p=r.profile;
  state.myProfile=p;
  if(p?.profile_accent)applyTheme(p.profile_accent,true);
  return p;
 }).finally(()=>{activeProfileRequest=null});
 return activeProfileRequest;
}
async function loadExam(id){const [detail,res]=await Promise.all([api('exam_detail',{exam_id:id}),api('results',{exam_id:id})]);state.exam=detail;state.results=res.results;state.preview=[];}
async function refresh(){
 const parts=location.hash.replace(/^#\/?/,'').split('/'),target=parts[0]||'home',id=parts[1]||'',role=access();
 const allowed=nav().map(x=>x[0]).concat(['public-exam','subject','exam','take','exam-ready']);
 if(state.attempt?.status==='in_progress'&&target!=='take'){location.hash='#/take';return;}
 let current=allowed.includes(target)?target:'home';
 if(!state.user&&!['home','login','register','help'].includes(current)||state.user&&['login','register'].includes(current)){current='home';history.replaceState(null,'',location.pathname+location.search+'#/home');}
 const teacherRoutes=['subjects','subject','exams','exam'],studentRoutes=['student-exams','grades','take','exam-ready'];
 if((teacherRoutes.includes(current)&&!['teacher','admin'].includes(role))||(studentRoutes.includes(current)&&role!=='student'&&!(current==='grades'&&state.user?.platform_owner))||(current==='reportbook'&&!['admin','preceptor'].includes(role))||(current==='students'&&!['admin','preceptor'].includes(role))||(current==='staff'&&role!=='admin')||(['account','directory','community'].includes(current)&&!state.user)||(['owner','owner-history'].includes(current)&&!state.user?.platform_owner)){location.hash='#/home';return;}
 const version=++state.routeVersion;
 state.route=current;state.id=id;
 const key=current+':'+id,ttl={home:20000,catalog:40000,subject:30000,subjects:45000,exams:30000,exam:15000,grades:30000,'student-exams':30000,account:90000,owner:20000,directory:45000,students:25000,reportbook:40000,staff:30000};
 const cacheIsFresh=Date.now()-(state.routeFetched[key]||0)<(ttl[current]||20000);
 const render=()=>{if(state.routeVersion!==version)return;draw();};
 if(current==='exam'&&state.exam?.exam?.id!==id){state.exam=null;state.results=[];}
 state.loadingRoute=!cacheIsFresh;
 render();
 if(cacheIsFresh){state.loadingRoute=false;return;}
 const tasks=[];
 try{
  if(['catalog','public-exam'].includes(current))tasks.push(api('catalog').then(x=>{state.catalog=x}));
  if((current==='home'&&role==='student'||studentRoutes.includes(current)&&current!=='take')&&!(current==='exam-ready'&&state.profile))tasks.push(loadProfile());
  if((current==='home'&&['admin','teacher'].includes(role))||current==='exams')tasks.push(loadAll());
  if(current==='home'&&role==='preceptor'||current==='reportbook')tasks.push(Promise.all([users('report_history'),users('students')]).then(([a,b])=>{state.report=a.grades;state.students=b.students}));
  if(current==='subjects')tasks.push(api('subjects').then(a=>{state.subjects=a.subjects}));
  if(current==='subject')tasks.push(Promise.all([api('subjects'),api('exams',{subject_id:id})]).then(([a,b])=>{state.subjects=a.subjects;state.subjectExams=(b.exams||[]).map(x=>({...x,subject_id:id}))}));
  if(current==='exam'){state.tab='questions';state.live=null;state.review=null;tasks.push(loadExam(id).then(()=>{if(state.exam?.exam?.status!=='draft'&&!state.exam?.exam?.legacy_readonly){state.tab='students';if(!state.students?.length)users('students').then(r=>{if(state.route==='exam'&&state.id===id){state.students=r.students||[];draw()}}).catch(()=>{});}else if(state.exam?.exam?.legacy_readonly)state.tab='results';}));}
  if(current==='students')tasks.push(Promise.all([users('students'),...(role==='admin'?[users('historic_unlinked')]:[])]).then(([a,b])=>{state.students=a.students;state.unlinked=b?.records||[]}));
  if(current==='staff')tasks.push(api('staff_list').then(a=>{state.staff=a.staff}));
  if(current==='account'&&state.user&&!state.myProfile)tasks.push(loadMyProfile());
  if(current==='owner')tasks.push(Promise.all([ownerAPI('overview'),ownerAPI('accounts'),ownerAPI('claims')]).then(([a,b,c])=>{state.ownerData={...a,accounts:b.accounts||[],claims:c.claims||[]}}));
  if(current==='owner-history')tasks.push(loadProfile());
  if(current==='directory'&&state.user)tasks.push(profileAPI('directory').then(a=>{state.directory=a.people}));if(current==='community')tasks.push(loadCommunity());
  await Promise.all(tasks);
  state.routeFetched[key]=Date.now();
 }catch(e){if(state.routeVersion===version)toast(e.message||'Error de carga',true)}
 finally{if(state.routeVersion===version){state.loadingRoute=false;render();window.scrollTo({top:0,behavior:'instant'})}}
}
function go(r,id=''){if(state.attempt?.status==='in_progress'&&r!=='take'){toast('Terminá la evaluación antes de salir. Las respuestas están siendo protegidas.',true);return;}const hash='#/'+r+(id?'/'+id:'');if(location.hash===hash)refresh();else location.hash=hash;}
function capturePreview(){
 const cards=$$('[data-preview]');
 if(!cards.length)return state.preview;
 const list=cards.map((node,i)=>{
  const field=n=>node.querySelector('[data-field="'+n+'"]')?.value?.trim()||'';
  const kind=field('kind'),prompt=field('prompt'),rubric=field('rubric'),points=Number(field('points'))||1;
  const options=kind==='choice'?field('options').split('\n').map(x=>x.trim()).filter(Boolean):kind==='boolean'?['Verdadero','Falso']:[];
  const correct_answer=kind==='short'?'Revisión docente':field('correct_answer');
  if(prompt.length<5)throw Error('La pregunta '+(i+1)+' necesita enunciado');
  if(kind==='choice'&&(options.length<2||options.length>6||!options.includes(correct_answer)))throw Error('Revisá opciones y respuesta de pregunta '+(i+1));
  if(kind==='boolean'&&!['Verdadero','Falso'].includes(correct_answer))throw Error('Elegí Verdadero/Falso en pregunta '+(i+1));
  if(kind==='short'&&rubric.length<5)throw Error('Agregá criterios de corrección a pregunta '+(i+1));
  if(!Number.isFinite(points)||points<=0||points>100)throw Error('Puntaje inválido en pregunta '+(i+1));
  return {prompt,kind,options,correct_answer,rubric,points,grading_mode:kind==='short'?'manual':'automatic'};
 });state.preview=list;return list;
}
function saveAttempt(){sessionStorage.setItem('aurea_attempt',JSON.stringify(state.attempt));}
async function readyForProtectedExam(resume){
 let requested=null;
 const agreed=await aureaConfirm(resume?'¿Reanudar la evaluación? El cronómetro no se detiene.':'¿Comenzar la evaluación? El cronómetro empezará ahora. La salida comprobada de pantalla completa reinicia las respuestas.',{
  onAccept:()=>{
   if(document.documentElement.requestFullscreen){
    try{requested=document.documentElement.requestFullscreen()}catch(err){requested=Promise.reject(err);}
   }
  }
 });
 if(!agreed)return false;
 if(requested){
  try{await requested;}
  catch(e){toast('Para comenzar, permití la pantalla completa en el navegador.',true);return false;}
 }else if(document.documentElement.requestFullscreen&&!document.fullscreenElement){
  toast('No se pudo entrar a pantalla completa. Reintentá.',true);return false;
 }else if(!document.documentElement.requestFullscreen){
  toast('Tu navegador no admite pantalla completa; la detección de salidas será limitada.',true);
 }
 return true;
}
async function beginExam(id,resume=false){
 const x=await users(resume?'resume_exam':'start_exam',{invite_id:id});state.expiryQueued=false;state.examFullscreenRequired=!!document.fullscreenElement;state.examResetting=false;state.attempt={...x,index:0,status:'in_progress'};for(const q of state.attempt.questions||[])q._remoteResponse=String(q.response||'');saveAttempt();go('take');
}
let answerSaveTail=Promise.resolve(),examSaving=0;
function captureExamDraft(){
 const at=state.attempt,q=at?.questions?.[at.index||0];if(!q||state.route!=='take')return null;
 const current=q.kind==='short'?$('#short-answer')?.value:$('input[name="answer"]:checked')?.value;
 if(current!==undefined&&current!==q.response){q.response=current;saveAttempt();}
 return q;
}
function persistExamQuestion(q,at){
 if(!q||!at)return answerSaveTail;
 const value=String(q.response||'');
 if(!value&&!q._remoteResponse){q._remoteResponse='';return answerSaveTail;}
 if(value===q._remoteResponse||value===q._queuedResponse)return answerSaveTail;
 q._queuedResponse=value;examSaving++;
 const attemptId=at.attempt_id,token=at.session_token;
 answerSaveTail=answerSaveTail.catch(()=>{}).then(async()=>{
  const r=await assess('save',{attempt_id:attemptId,session_token:token,question_id:q.id,response:value});
  if(r.expired)throw Error('El tiempo de la evaluación terminó.');
  q._remoteResponse=value;
  if(state.attempt?.attempt_id===attemptId&&state.route==='take'&&state.attempt.questions[state.attempt.index]?.id===q.id){
   const label=$('#save-state');if(label)label.textContent='Respuesta guardada';
  }
 }).catch(error=>{if(state.route==='take')toast('No se pudo sincronizar una respuesta. Reintentá antes de entregar.',true);throw error;}).finally(()=>{
  examSaving=Math.max(0,examSaving-1);
  if(q._queuedResponse===value)q._queuedResponse=undefined;
 });
 return answerSaveTail;
}
async function flushExamAnswers(){
 clearTimeout(answerDebounce);
 captureExamDraft();
 const at=state.attempt;if(!at)throw Error('La evaluación ya terminó');
 try{await answerSaveTail;}catch{}
 for(const q of at.questions){if(String(q.response||'')!==q._remoteResponse)await persistExamQuestion(q,at);}
 await answerSaveTail;
}
async function saveAnswer(next=false,autosave=false){
 const at=state.attempt;if(!at)return;
 const q=captureExamDraft();
 if(q)persistExamQuestion(q,at).catch(()=>{});
 if(next&&at.index<at.questions.length-1){at.index++;saveAttempt();draw();return;}
 if(next){await flushExamAnswers();const left=at.questions.filter(x=>!String(x.response||'').trim()).length;
  if(await aureaConfirm(left?'Quedan '+left+' preguntas sin responder. ¿Entregar igual?':'¿Confirmás la entrega definitiva?'))await submitAttempt();
  return;
 }
 if(!autosave){await flushExamAnswers();toast('Respuestas guardadas');}
}
async function submitAttempt(){
 if(state.submitting||!state.attempt)return;state.submitting=true;
 try{await flushExamAnswers();const a=state.attempt;const r=await assess('finish',{attempt_id:a.attempt_id,session_token:a.session_token});toast(r.grading_status==='needs_review'?'Evaluación entregada; pendiente de corrección docente.':'Examen entregado. Nota: '+grade(r.score_percent)+'/10');state.attempt=null;sessionStorage.removeItem('aurea_attempt');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});go('grades');}
 finally{state.submitting=false;}
}
function download(name,rows){
 const csv=rows.map(a=>a.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),800);
}
async function submit(form){
 const f=Object.fromEntries(new FormData(form).entries());
 switch(form.dataset.form){
 case 'login':{const r=await api('login',f);state.token=r.staff_token;state.user=r.user;state.myProfile=null;applyTheme(null);loadMyProfile().catch(()=>{});sessionStorage.setItem('aurea_auth',state.token);localStorage.setItem('aurea_known_user',r.user.username);state.knownUser=r.user.username;toast('Sesión iniciada');go(r.user?.must_change_password?'account':'home');break;}
 case 'register':{const r=await users('register',f);state.token=r.staff_token;state.user=r.user;state.myProfile=null;applyTheme(null);loadMyProfile().catch(()=>{});sessionStorage.setItem('aurea_auth',state.token);localStorage.setItem('aurea_known_user',r.user.username);state.knownUser=r.user.username;toast('Cuenta creada. Personalizá tu perfil. Administración verificará tu identidad escolar.');go('account');break;}
 case 'subject':{await api('create_subject',f);state.workspaceFetched=0;state.routeFetched['subjects:']=0;state.routeFetched['home:']=0;toast('Materia creada');await refresh();break;}
 case 'exam-create':{state.workspaceFetched=0;state.routeFetched['exams:']=0;state.routeFetched['home:']=0;state.routeFetched['subject:'+state.id]=0;if(f.starts_at)f.starts_at=new Date(f.starts_at).toISOString();if(f.ends_at)f.ends_at=new Date(f.ends_at).toISOString();if(f.starts_at&&f.ends_at&&Date.parse(f.ends_at)<=Date.parse(f.starts_at))throw Error('El cierre debe ser posterior a la apertura.');const r=await api('create_exam',{...f,subject_id:state.id});toast('Borrador creado');go('exam',r.exam.id);break;}
 case 'question':if(form.dataset.mode==='automatic'&&f.kind==='boolean'){f.options='Verdadero\nFalso';f.correct_answer=f.boolean_answer;if(!['Verdadero','Falso'].includes(f.correct_answer))throw Error('Elegí Verdadero o Falso.');}if(f.kind==='choice'){const opts=String(f.options||'').split('\n').map(x=>x.trim()).filter(Boolean);if(opts.length<2||opts.length>6)throw Error('Usá entre dos y seis opciones por pregunta.');if(new Set(opts).size!==opts.length)throw Error('No repitas opciones iguales.');if(!opts.includes(f.correct_answer))throw Error('Seleccioná la respuesta correcta.');}await assess('create_questions',{exam_id:state.id,questions:[{prompt:f.prompt,kind:f.kind,grading_mode:form.dataset.mode||'automatic',rubric:f.rubric||'',options:String(f.options||'').split('\n').map(x=>x.trim()).filter(Boolean),correct_answer:f.correct_answer||'',points:Number(f.points)||1}]});toast('Pregunta guardada');await loadExam(state.id);draw();break;
 case 'assign':{if(!f.username)throw Error('Seleccioná un alumno');await users('assign_exam',{exam_id:state.id,username:f.username});toast('Evaluación asignada');await loadExam(state.id);state.tab='students';draw();break;}
 case 'report':{const rows=window.QImporter.csv(f.csv);if(!await aureaConfirm('¿Guardar '+rows.length+' notas revisadas?'))return;const r=await users('report_upload',{rows});toast(r.imported+' notas guardadas');state.report=(await users('report_history')).grades;draw();break;}
 case 'link':if(!await aureaConfirm('¿Verificaste personalmente que corresponde al mismo alumno?'))return;await users('link_historic',f);toast('Nota histórica vinculada');state.unlinked=(await users('historic_unlinked')).records;draw();break;
 case 'staff':if(f.role==='preceptor')await users('create_preceptor',f);else await api('staff_create',f);toast('Acceso creado');state.staff=(await api('staff_list')).staff;draw();break;
 case 'incident':{await assess('review_incident',{exam_id:state.id,attempt_id:form.dataset.attempt,incident_id:form.dataset.incident,resolution:f.resolution});state.studentMonitor=await assess('monitor_student',{exam_id:state.id,attempt_id:form.dataset.attempt});draw();toast('Incidencia revisada');break;} case 'review':{await assess('review',{exam_id:state.id,attempt_id:form.dataset.attempt,question_id:form.dataset.question,points:Number(f.points),comment:f.comment||''});state.review=await assess('queue',{exam_id:state.id});draw();toast('Puntaje guardado');break;} case 'social-create':case 'social-comment':{await window.AureaSocial.submit({state,form,f,api:communityAPI,draw,toast});break;}case 'profile':{const r=await profileAPI('update',f);state.myProfile=r.profile;applyTheme(r.profile?.profile_accent||f.profile_accent,true);draw();toast('Perfil y tema actualizados');break;}case 'password':await api('change_password',f);form.reset();if(state.user)state.user.must_change_password=false;await loadMyProfile();draw();toast('Contraseña actualizada');break;
 }
}
async function action(a,el){
 const id=el.dataset.id||'';
 if(a.startsWith('goto:')){go(a.slice(5));return;}if(a==='mobile-more'){const x=$('#mobile-more-sheet');if(x){const open=x.classList.toggle('open');x.setAttribute('aria-hidden',String(!open));el.setAttribute('aria-expanded',String(open))}return;}if(a==='theme-preview'){const t=el.dataset.theme,input=$('form[data-form="profile"] input[name="profile_accent"]');if(!input)return;input.value=t;document.querySelectorAll('.theme-tile').forEach(x=>{const on=x.dataset.theme===t;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on))});if(state.myProfile)state.myProfile.profile_accent=t;applyTheme(t,true);
 clearTimeout(window.__aureaThemeSave);
 const profileUser=state.user?.username||null;
 if(profileUser&&!state.user.must_change_password)window.__aureaThemeSave=setTimeout(async()=>{
   if(state.user?.username!==profileUser)return;
   try{const result=await profileAPI('theme_update',{profile_accent:t});if(state.user?.username===profileUser&&state.myProfile?.profile_accent===t){state.myProfile={...state.myProfile,...result.profile}}}
   catch(err){toast('El tema se guardó en este dispositivo, pero no pudo sincronizarse con tu cuenta.',true)}
 },320);
 return;} if(a.startsWith('grading:')){const kind=a.slice(8);if(!['choice','boolean','manual','auto'].includes(kind))return;const mode=kind==='auto'?'choice':kind;if(state.questionType===mode)return;const form=$('form[data-form="question"]');if(form&&Array.from(form.querySelectorAll('textarea')).some(x=>x.value?.trim())&&!await aureaConfirm('Cambiar de tipo descartará el texto de esta pregunta. ¿Continuar?'))return;state.questionType=mode;state.gradingMode=mode==='manual'?'manual':'automatic';draw();return;} if(a==='live-refresh'){state.live=await assess('monitor',{exam_id:state.id});state.lastLiveFetch=Date.now();draw();return;} if(a==='review-refresh'){state.review=await assess('queue',{exam_id:state.id});draw();return;} if(a==='live-student'){state.studentMonitorAttempt=id;state.studentMonitor=await assess('monitor_student',{exam_id:state.id,attempt_id:id});draw();return;}if(a==='close-live-details'){state.studentMonitor=null;state.studentMonitorAttempt=null;draw();return;}
 if(a==='show-subject'){go('subject',id);return;}
 if(a==='show-exam'){go('exam',id);return;}
 if(a==='show-public-exam'){go('public-exam',id);return;}
 if(a==='reload-profile'){state.routeFetched['grades:']=0;state.routeFetched['student-exams:']=0;if(access()==='student'||state.user?.platform_owner)await loadProfile();await loadMyProfile();draw();return;}if(a==='request-history'){const response=await users('claim_historic');toast(response.message||'Solicitud registrada');return;}
 if(['owner-rank','owner-verify','owner-unverify','owner-disable','owner-enable','owner-sessions','owner-claim-approve','owner-claim-reject'].includes(a)){
  if(!state.user?.platform_owner)throw Error('Solo la identidad Owner puede realizar esta operación.');
  if(a==='owner-rank'){
   const role=document.querySelector('[data-owner-role="'+id+'"]')?.value;
   if(!role)throw Error('Elegí un rango institucional.');
   if(!await aureaConfirm('El rango '+role+' concede permisos reales. Se cerrarán las sesiones de la cuenta. ¿Confirmás?'))return;
   await ownerAPI('set_role',{account_id:id,role});
  }else if(a==='owner-verify'||a==='owner-unverify'){
   const verified=a==='owner-verify';
   if(!await aureaConfirm(verified?'¿Confirmás que comprobaste la identidad de esta persona?':'¿Retirar la verificación a esta cuenta?'))return;
   await ownerAPI('set_verification',{account_id:id,verified});
  }else if(a==='owner-disable'||a==='owner-enable'){
   const active=a==='owner-enable';
   if(!await aureaConfirm(active?'¿Reactivar esta cuenta?':'¿Suspender la cuenta y finalizar todas sus sesiones?'))return;
   await ownerAPI('set_active',{account_id:id,active});
  }else if(a==='owner-sessions'){
   if(!await aureaConfirm('¿Cerrar todas las sesiones de esta cuenta?'))return;
   await ownerAPI('revoke_sessions',{account_id:id});
  }else{
   const approved=a==='owner-claim-approve';
   if(!await aureaConfirm(approved?'¿Verificaste que la evaluación histórica pertenece a esta persona?':'¿Rechazar la solicitud de historial?'))return;
   await ownerAPI('resolve_claim',{claim_id:id,approved});
  }
  toast('Cambio institucional registrado.');go('owner');return;
 }if(a.startsWith('social-')){await window.AureaSocial.action({state,a,el,id,api:communityAPI,draw,toast});return;}if(a==='avatar-remove'){if(!await aureaConfirm('¿Quitar la foto de tu perfil?'))return;state.myProfile=(await profileAPI('avatar_remove')).profile;draw();toast('Fotografía eliminada');return;}
 if(a==='reload-students'){state.students=(await users('students')).students;draw();return;}
 if(a==='start-exam'){go('exam-ready',id);return;}if(a==='begin-selected'){
   const ok=await readyForProtectedExam(false);
   if(ok)await beginExam(state.id,false);
   return;
 }
 if(a==='resume-exam'){
   const ok=await readyForProtectedExam(true);
   if(ok)await beginExam(id,true);
   return;
 }
 if(a==='logout'){await api('logout').catch(()=>{});state.user=null;state.token='';state.attempt=null;state.myProfile=null;sessionStorage.removeItem('aurea_auth');localStorage.removeItem('aurea_auth');sessionStorage.removeItem('aurea_attempt');toast('Sesión cerrada');go('home');return;}
 if(a==='example-questions'){$('#questions-text').value='1. ¿Cuál es la función de un examen?\nA) Comprobar los aprendizajes\nB) Eliminar calificaciones\nRespuesta: A\n\n2. Una evaluación puede guardarse digitalmente.\nRespuesta: Verdadero';return;}
 if(a==='parse-questions'){state.importText=$('#questions-text')?.value||'';const q=window.QImporter.parse(state.importText);if(!q.length)throw Error('No se detectaron preguntas. Revisá el formato: pregunta numerada, opciones y Respuesta: B.');state.preview=q;draw();toast(q.length+' preguntas interpretadas. Revisalas y guardalas.');return;}
 if(a==='remove-preview'){capturePreview();state.preview.splice(Number(el.dataset.index),1);draw();return;}
 if(a==='save-preview'){const questions=capturePreview();if(!questions.length)throw Error('No hay preguntas');if(!await aureaConfirm('¿Guardar '+questions.length+' preguntas?'))return;const r=await assess('create_questions',{exam_id:state.id,questions});if(r.count!==questions.length)throw Error('No se guardaron todas las preguntas.');state.importText='';toast(r.count+' preguntas guardadas');await loadExam(state.id);draw();return;}
 if(a==='goto-exam-settings'){state.tab='details';draw();return;}
 if(a==='unassign-student'){
  if(!await aureaConfirm('¿Retirar esta asignación? Solo se permite antes de comenzar.'))return;
  await users('unassign_exam',{invite_id:id});await loadExam(state.id);draw();toast('Alumno retirado');return;
 }
 if(a==='owner-reset-student'||a==='owner-remove-student'){
  if(!state.user?.platform_owner)throw Error('Solo Owner');
  const mode=a==='owner-reset-student'?'reset':'remove';
  const name=(state.results||[]).find(x=>x.invite_id===id)?.student_name||'alumno';
  const message=mode==='reset'?'Se borrarán el intento y las respuestas para que vuelva a rendir.':'Se borrarán el intento, las respuestas y la asignación del alumno.';
  if(!await aureaConfirm('OWNER · '+name+'\n\n'+message+'\n\nEsta acción no se puede deshacer.'))return;
  const confirmation=await aureaPrompt('Escribí ELIMINAR PARTICIPACION para confirmar:');
  if(confirmation!=='ELIMINAR PARTICIPACION')return;
  await ownerAPI('exam_participation',{invite_id:id,mode,confirmation});
  await loadExam(state.id);state.tab='students';draw();toast(mode==='reset'?'Intento reiniciado':'Participación eliminada');return;
 }
 if(a==='owner-delete-academic'){
  if(!state.user?.platform_owner)throw Error('Solo el Owner puede eliminar evaluaciones o materias con entregas.');
  const kind=el.dataset.kind;
  if(!['exam','subject'].includes(kind))throw Error('Tipo inválido');
  const obj=kind==='subject'?(state.subjects||[]).find(x=>x.id===id):(state.exams||[]).find(x=>x.id===id)||(state.exam?.exam?.id===id?state.exam.exam:null);
  const name=obj?.title||obj?.name||'este contenido';
  const confirmed=await aureaConfirm('OWNER · '+name+'\n\nSe borrarán todas las preguntas, asignaciones y entregas de este contenido. Si eliminás una materia, se eliminarán sus evaluaciones también. Los datos históricos protegidos NO pueden borrarse.',{danger:true});
  if(!confirmed)return;
  const typed=await aureaPrompt('Para confirmar escribí exactamente:\nELIMINAR DEFINITIVAMENTE',{danger:true});
  if(typed!=='ELIMINAR DEFINITIVAMENTE')return;
  const out=await ownerAPI('delete_academic',{id,kind,confirmation:typed});
  state.workspaceFetched=0;state.routeFetched={};state.exam=null;state.subjectExams=[];
  toast('Eliminación completada: '+out.deleted_exams+' evaluaciones y '+out.deleted_attempts+' intentos.');
  go(kind==='subject'?'subjects':'exams');return;
 }
 if(a==='delete-exam'){
  const e=state.exam?.exam;if(!e||e.legacy_readonly)throw Error('No se elimina el historial');
  if(!await aureaConfirm('¿Eliminar «'+e.title+'»? Solo se permite sin entregas.'))return;
  await api('delete_exam',{exam_id:e.id});state.workspaceFetched=0;state.routeFetched={};state.exam=null;toast('Evaluación eliminada');go('exams');return;
 }
 if(a==='delete-question'){if(!await aureaConfirm('¿Eliminar esta pregunta del borrador?'))return;await api('delete_question',{exam_id:state.id,question_id:id});await loadExam(state.id);draw();return;}
 if(a==='publish'||a==='close'){if(!await aureaConfirm(a==='publish'?'¿Publicar la evaluación y bloquear la edición?':'¿Cerrar la convocatoria manteniendo las notas?'))return;await api(a==='publish'?'publish_exam':'close_exam',{exam_id:state.id});await loadExam(state.id);state.tab='details';draw();return;}
 if(a==='clone-exam'){const version=Number($('#clone-bank').value);const r=await api('clone_exam',{exam_id:state.id,version,title:'Derecho Laboral · Nueva convocatoria'});toast('Copia editable creada');go('exam',r.exam_id);return;}
 if(a==='verify'||a==='unverify'){if(!await aureaConfirm(a==='verify'?'¿Verificaste la identidad escolar de este alumno?':'¿Revocar la verificación?'))return;await users('verify_student',{student_id:id,verified:a==='verify'});state.students=(await users('students')).students;draw();return;}
 if(a==='export-results'){download('evaluacion-resultados.csv',[['Alumno','Estado','Nota / 10','Versión','Incidentes','Fecha'],...state.results.map(x=>[x.student_name,x.status,grade(x.score_percent),x.bank_version||'',x.incident_count||0,x.finished_at||''])]);return;}
 if(a==='export-grades'){download('libretas-epet6.csv',[['Alumno','Usuario','Materia','Año','Período','Nota'],...state.report.map(x=>[x.student_name,x.username,x.subject_name,x.school_year,x.term,x.score])]);return;}
 if(a==='prev'){const at=state.attempt;if(!at)return;clearTimeout(answerDebounce);const q=captureExamDraft();if(q)persistExamQuestion(q,at).catch(()=>{});if(at.index>0){at.index--;saveAttempt();draw();}return;}
 if(a==='jump-question'){const n=Number(el.dataset.index),at=state.attempt;if(!at||!Number.isInteger(n)||n<0||n>=at.questions.length)return;clearTimeout(answerDebounce);const q=captureExamDraft();if(q)persistExamQuestion(q,at).catch(()=>{});at.index=n;saveAttempt();draw();return;}
 if(a==='submit-now'){await flushExamAnswers();if(!state.attempt)return;const n=state.attempt.questions.filter(x=>!String(x.response||'').trim()).length;if(await aureaConfirm(n?`Quedan ${n} sin responder. ¿Entregar igual?`:'¿Entregar definitivamente?'))await submitAttempt();return;}
 if(a==='save'||a==='next')await saveAnswer(a==='next');
}
let workQueue=Promise.resolve();function work(fn){workQueue=workQueue.catch(()=>{}).then(async()=>{state.busy=true;try{await fn();}catch(e){toast(e.message||'Error',true);}finally{state.busy=false;}});return workQueue;}
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;if(state.tab==='students'&&['teacher','admin'].includes(access()))work(async()=>{if(!state.students?.length)state.students=(await users('students')).students;draw();});if(state.tab==='live')work(async()=>{state.live=await assess('monitor',{exam_id:state.id});state.lastLiveFetch=Date.now();draw();});else if(state.tab==='review')work(async()=>{state.review=await assess('queue',{exam_id:state.id});draw();});else draw();return;}
 const nav=e.target.closest('[data-go]');if(nav){go(nav.dataset.go);return;}
 const btn=e.target.closest('[data-action]');
 if(btn?.dataset.action==='restore-exam-fullscreen'){
   if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().then(()=>{state.examFullscreenRequired=true;draw()}).catch(()=>toast('El navegador no permitió pantalla completa. Revisá los permisos.',true));
   else{state.examFullscreenRequired=false;draw();toast('Este navegador no ofrece pantalla completa. El control de salidas será limitado.',true);}
   return;
 }
 if(btn){
  if(btn.dataset.action.startsWith('social-')||['prev','next','save','jump-question','submit-now'].includes(btn.dataset.action)){
   Promise.resolve().then(()=>action(btn.dataset.action,btn)).catch(e=>toast(e.message||'No se completó la acción',true));
  }else work(()=>action(btn.dataset.action,btn));
 }
});
document.addEventListener('submit',e=>{const form=e.target.closest('form[data-form]');if(form){e.preventDefault();const btn=form.querySelector('button[type=submit]'),original=btn?.textContent;if(btn){btn.disabled=true;btn.textContent=form.dataset.form==='register'?'Creando cuenta…':form.dataset.form==='login'?'Ingresando…':'Guardando…';}const run=form.dataset.form.startsWith('social-')?Promise.resolve().then(()=>submit(form)).catch(e=>toast(e.message||'No se pudo publicar',true)):work(()=>submit(form));
 run.finally(()=>{if(btn?.isConnected){btn.disabled=false;btn.textContent=original;}});}});
let answerDebounce=null;document.addEventListener('input',e=>{if(e.target.id==='teacher-options'){const sel=$('#teacher-correct');if(sel){const prev=sel.value;const values=[...new Set(e.target.value.split('\n').map(x=>x.trim()).filter(Boolean))];sel.replaceChildren(new Option(values.length?'Seleccioná la correcta':'Primero escribí las opciones',''));values.forEach(v=>sel.add(new Option(v,v)));if(values.includes(prev))sel.value=prev;}return;}if(state.route==='take'&&(e.target.id==='short-answer'||e.target.name==='answer')){captureExamDraft();clearTimeout(answerDebounce);const at=state.attempt,q=at?.questions?.[at.index||0];answerDebounce=setTimeout(()=>{if(state.route==='take'&&state.attempt?.attempt_id===at?.attempt_id&&q)persistExamQuestion(q,at).catch(()=>{});},e.target.name==='answer'?140:600);}if(state.route==='take'&&(e.target.id==='short-answer'||e.target.name==='answer')){const label=$('#save-state');if(label)label.textContent='Cambios por guardar…';}if(e.target.id==='catalog-filter'){state.filter=e.target.value;const matches=state.catalog.exams.filter(x=>(x.title+' '+subname(x.subject_id)).toLowerCase().includes(state.filter.toLowerCase()));$('#catalog-results').innerHTML=examRows(matches);}});
document.addEventListener('change',e=>{if(e.target.id==='question-kind'){const bool=e.target.value==='boolean';const c=$('#question-choice-fields'),a=$('#choice-answer'),b=$('#boolean-answer');if(c)c.style.display=bool?'none':'';if(a)a.style.display=bool?'none':'';if(b)b.style.display=bool?'':'none';const txt=a?.querySelector('input'),sel=b?.querySelector('select');if(txt){txt.disabled=bool;txt.required=!bool;}if(sel){sel.disabled=!bool;}return;}
 if(e.target.id==='questions-file')work(async()=>{const f=e.target.files?.[0];if(!f)return;const q=await window.QImporter.read(f);if(!q.length)throw Error('No se detectaron preguntas completas');state.preview=q;draw();toast(q.length+' preguntas interpretadas, revisalas antes de guardar');});
 if(e.target.id==='libreta-file')work(async()=>{const f=e.target.files?.[0];if(f)$('#libreta-text').value=await f.text();});
if(e.target.id==='social-image')work(()=>window.AureaSocial.photo({state,file:e.target.files?.[0]}));if(e.target.id==='avatar-file')work(async()=>{
 const f=e.target.files?.[0];if(!f)return;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>6000000)throw Error('La foto debe ser JPG, PNG o WebP y menor de 6 MB.');
 const objectURL=URL.createObjectURL(f),img=new Image();
 try{
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('No se pudo abrir la imagen.'));img.src=objectURL;});
  const max=512,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Este navegador no permite procesar la foto.');
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let b64='',quality=.82;
  do{b64=canvas.toDataURL('image/jpeg',quality).split(',')[1];quality-=.12;}while(b64.length>455000&&quality>.34);
  if(b64.length>455000)throw Error('La imagen es demasiado grande; seleccioná otra fotografía.');
  state.myProfile=(await profileAPI('avatar_upload',{base64:b64,mime:'image/jpeg'})).profile;
  draw();toast('Foto de perfil actualizada');
 }finally{URL.revokeObjectURL(objectURL);}
});
});
let examWasFullscreen=!!document.fullscreenElement,recentBackgroundAt=0,recentForegroundAt=0,backgroundGeneration=0;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){recentBackgroundAt=Date.now();backgroundGeneration++;}else recentForegroundAt=Date.now();});
async function verifiedExamExit(){
 if(state.examResetting||state.route!=='take'||!state.attempt)return;
 state.examResetting=true;clearTimeout(answerDebounce);draw();
 const at=state.attempt;
 try{
  await answerSaveTail.catch(()=>{});
  const r=await assess('restart_on_exit',{attempt_id:at.attempt_id,session_token:at.session_token});
  if(state.attempt?.attempt_id!==at.attempt_id)return;
  at.session_token=r.session_token;
  for(const q of at.questions){q.response='';q._remoteResponse='';q._queuedResponse=undefined;}
  at.index=0;saveAttempt();toast('Se detectó la salida: respuestas reiniciadas. El cronómetro continúa.',true);
 }catch(e){toast('No se pudo verificar el reinicio. Reanudá la evaluación antes de responder.',true);}
 finally{state.examResetting=false;if(state.route==='take')draw();}
}
document.addEventListener('fullscreenchange',()=>{
 const now=!!document.fullscreenElement;
 const candidate=examWasFullscreen&&!now&&state.route==='take'&&state.attempt?.status==='in_progress';
 const generation=backgroundGeneration;
 examWasFullscreen=now;
 if(now&&state.route==='take'&&state.attempt){state.examFullscreenRequired=true;draw();}
 if(candidate){
  if(state.examFullscreenRequired)draw();
  setTimeout(()=>{
   const confirmed=backgroundGeneration===generation&&state.route==='take'&&state.attempt?.status==='in_progress'&&!document.fullscreenElement&&document.visibilityState==='visible'&&document.hasFocus()&&Date.now()-recentBackgroundAt>4500&&Date.now()-recentForegroundAt>4500;
   if(confirmed)verifiedExamExit();
  },850);
 }else if(!now&&state.route==='take'&&state.attempt&&state.examFullscreenRequired)draw();
});
window.addEventListener('beforeunload',e=>{if(state.attempt?.status==='in_progress'){e.preventDefault();e.returnValue='';}});
setInterval(()=>{if(state.route!=='take'||!state.attempt)return;const left=Math.max(0,Math.floor((Date.parse(state.attempt.deadline_at)-Date.now())/1000));const clock=$('#clock');if(clock)clock.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left===0&&!state.expiryQueued&&state.attempt){state.expiryQueued=true;work(submitAttempt).finally(()=>{if(state.attempt)state.expiryQueued=false;});}},1000);
setInterval(()=>{if(state.route==='exam'&&state.tab==='live'&&!state.busy)work(async()=>{state.live=await assess('monitor',{exam_id:state.id});if(state.studentMonitorAttempt)state.studentMonitor=await assess('monitor_student',{exam_id:state.id,attempt_id:state.studentMonitorAttempt});state.lastLiveFetch=Date.now();draw()})},5000);setInterval(()=>{if(state.route==='take'&&state.attempt&&!state.busy)assess('heartbeat',{attempt_id:state.attempt.attempt_id,session_token:state.attempt.session_token}).then(r=>{if(r.expired){toast('Tiempo cumplido');state.attempt=null;sessionStorage.removeItem('aurea_attempt');go('grades')}}).catch(()=>{})},10000);window.addEventListener('hashchange',()=>refresh().catch(e=>toast(e.message,true)));
(async()=>{
 const bootStarted=Date.now();
 checkServerHealth().catch(()=>{});
 setInterval(()=>checkServerHealth().catch(()=>{}),30000);
 window.addEventListener('online',()=>checkServerHealth().catch(()=>{}));
 try{
   if(state.token){
     try{
       state.user=(await api('me')).user;
       state.knownUser=state.user.username;
       localStorage.setItem('aurea_known_user',state.user.username);
       loadMyProfile().catch(()=>{});
     }catch(e){
       state.user=null;
       if(/sesión|credencial|token|iniciá sesión|autorizad|vencid/i.test(String(e.message||''))){
         state.token='';sessionStorage.removeItem('aurea_auth');localStorage.removeItem('aurea_auth');
       }
     }
   }
 }catch(e){/* Sesión y servidor se verifican independientemente. */}
 finally{
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,820-(Date.now()-bootStarted))));
   try{await refresh();}catch(error){state.route='home';state.id='';draw();toast('No se pudo completar la carga. Volvé a intentar.',true)}
 }
})();
})();