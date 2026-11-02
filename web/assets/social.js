(function(){
const img=(p,e)=>p.avatar_url?'<img class="social-avatar" src="'+e(p.avatar_url)+'" loading="lazy" alt="">':'<span class="social-avatar">'+e((p.nickname||p.display_name||'?')[0])+'</span>';
const datetime=x=>{try{return new Date(x).toLocaleString('es-AR',{dateStyle:'medium',timeStyle:'short'})}catch{return ''}};
function view({state:s,esc:e,roleSeal:badge,title,panel,button,empty}){
 const c=s.community,verified=s.user?.identity_verified===true||s.myProfile?.identity_verified===true,staff=verified&&['teacher','admin','preceptor'].includes(s.user?.role);
 const avatar=p=>p?.avatar_url?`<img class="social-avatar" loading="lazy" alt="" src="${e(p.avatar_url)}">`:`<span class="social-avatar">${e((p?.nickname||p?.display_name||'?')[0].toUpperCase())}</span>`;
 const date=x=>{try{return new Date(x).toLocaleString('es-AR',{dateStyle:'medium',timeStyle:'short'})}catch{return ''}};
 const tabs=[['posts','Publicaciones'],['announcements','Avisos oficiales'],['people','Personas']];
 const head=`<div class="social-hero"><div class="social-overline">EPET N.º 6 · CAMPUS DIGITAL</div><h1>La comunidad <em>también es escuela.</em></h1><p>Compartí proyectos, experiencias y todo lo que sucede en nuestra institución.</p><span class="social-hero-mark" aria-hidden="true">✦</span></div><div class="social-toolbar"><nav class="social-tabs" aria-label="Explorar comunidad">${tabs.map(([k,t])=>`<button class="${c.tab===k?'selected':''}" data-action="social-tab" data-value="${k}">${t}</button>`).join('')}</nav><div class="social-search"><span aria-hidden="true">⌕</span><input id="social-search" aria-label="Buscar" placeholder="Buscar publicaciones o personas…" value="${e(c.query||'')}"><button class="social-search-button" data-action="social-search">Buscar</button></div></div>`;
 if(c.tab==='people')return head+`<div class="social-directory"><h2>Personas de la escuela</h2><p>Perfiles e identidades verificadas por la institución.</p><div class="social-people-grid">${c.people.length?c.people.map(p=>`<article class="social-person-card"><div class="social-person-cover"></div><div class="social-person-body">${avatar(p)}<strong>${e(p.nickname||p.display_name)}</strong><small>${e(p.display_name)}</small>${badge(p)}<p>${e(p.biography||'Parte de nuestra comunidad educativa.')}</p></div></article>`).join(''):empty('Sin coincidencias','Probá buscar otro nombre.')}</div></div>`;
 const composer=verified?`<details class="social-composer"><summary class="social-composer-trigger">${avatar({display_name:s.user?.display_name||'Yo'})}<span>¿Qué querés compartir con la escuela?</span><span class="social-composer-photo">▧ Foto</span></summary><form data-form="social-create"><label for="social-write">Nueva publicación</label><textarea id="social-write" name="body" rows="4" maxlength="1800" required placeholder="Contá una novedad o mostrá un proyecto de clase…"></textarea><div class="social-composer-controls"><label class="social-upload">▧ Agregar fotografía<input id="social-image" type="file" accept="image/jpeg,image/png,image/webp"></label><small id="social-file-state">JPG, PNG o WebP</small>${staff?'<select name="kind" aria-label="Tipo de publicación"><option value="publication">Publicación</option><option value="announcement">Aviso institucional</option></select>':''}<button class="btn primary" type="submit">Publicar</button></div></form></details>`:
 `<div class="social-readonly"><strong>La comunidad es para todos</strong><p>Podés leer publicaciones. Para participar, solicitá a la institución la verificación de tu cuenta.</p></div>`;
 const posts=(c.posts||[]).map(p=>{
  const comments=c.comments[p.id],reactions=(verified?button((p.liked?'♥ ':'♡ ')+p.likes,'social-like','social-action',`data-id="${e(p.id)}"`):`<span class="social-stat">♡ ${p.likes}</span>`)+button('◯ '+p.comments+' comentarios','social-comments','social-action',`data-id="${e(p.id)}"`);
  const actions=(p.own||p.can_moderate?button('Ocultar','social-hide','social-action danger',`data-id="${e(p.id)}"`):'')+(staff?button(p.pinned?'Desfijar':'Destacar','social-pin','social-action',`data-id="${e(p.id)}" data-pin="${!p.pinned}"`):'');
  const thread=comments?`<div class="social-thread"><strong>Comentarios</strong>${comments.map(x=>`<div class="social-comment"><strong>${e(x.author.nickname||x.author.display_name)}</strong><p>${e(x.body)}</p></div>`).join('')}${verified?`<form data-form="social-comment" data-post="${e(p.id)}"><input name="body" required maxlength="500" placeholder="Escribí un comentario"><button class="btn primary" type="submit">Enviar</button></form>`:''}</div>`:'';
  return `<article class="social-feed-post"><header><div class="social-post-person">${avatar(p.author)}<div><strong>${e(p.author.nickname||p.author.display_name)}</strong><small>${date(p.created_at)}</small></div></div><div class="social-post-seals">${badge(p.author)}${p.kind==='announcement'?'<span class="social-official">AVISO OFICIAL</span>':''}</div></header>${p.pinned?'<div class="social-pinned">✦ Destacado por la institución</div>':''}<div class="social-post-body">${e(p.body)}</div>${p.image_url?`<img class="social-feed-photo" loading="lazy" src="${e(p.image_url)}" alt="Fotografía de la publicación">`:''}<footer>${reactions}<span class="social-post-spacer"></span>${actions}</footer>${thread}</article>`;
 }).join('');
 const emptyBlock=`<div class="social-empty"><div class="social-empty-art">✦</div><h3>${c.tab==='announcements'?'Todavía no hay avisos':'Todavía no hay publicaciones'}</h3><p>${c.tab==='announcements'?'Los avisos aparecerán cuando los publique la institución.':'Las noticias, proyectos y fotografías de la escuela aparecerán aquí.'}</p></div>`;
 return head+`<div class="social-feed-layout"><main class="social-feed-main">${c.tab==='posts'?composer:''}${c.loaded?(posts||emptyBlock):'<div class="social-empty">Cargando novedades…</div>'}${c.more?button('Ver más','social-more','secondary'):''}</main><aside class="social-aside"><section class="social-side-card"><span>✦</span><h3>Lo que nos conecta</h3><p>Compartí actividades, proyectos, ferias, aprendizajes y logros que hacen parte de la EPET N.º 6.</p></section><section class="social-side-card"><strong>Un espacio cuidado</strong><p>Respeto entre compañeros. Los avisos institucionales solo los publica personal autorizado.</p></section></aside></div>`;
}

function setLikeLabel(button,p){
 if(!button)return;
 button.textContent=(p.liked?'♥ ':'♡ ')+Math.max(0,p.likes);
 button.setAttribute('aria-pressed',String(!!p.liked));
 button.classList.toggle('social-liked',!!p.liked);
}
function makeComment(item){
 const row=document.createElement('div');row.className='social-comment';
 const name=document.createElement('strong');name.textContent=item.author?.nickname||item.author?.display_name||'Miembro';
 const body=document.createElement('p');body.textContent=item.body||'';
 row.append(name,body);return row;
}
function makeThread(postId,items,allowComment){
 const root=document.createElement('div');root.className='social-thread';
 const heading=document.createElement('strong');heading.textContent='Comentarios';root.appendChild(heading);
 for(const item of items)root.appendChild(makeComment(item));
 if(allowComment){
  const form=document.createElement('form');form.dataset.form='social-comment';form.dataset.post=postId;
  const input=document.createElement('input');input.name='body';input.required=true;input.maxLength=500;input.placeholder='Escribí un comentario';input.setAttribute('aria-label','Escribí un comentario');
  const btn=document.createElement('button');btn.type='submit';btn.className='btn primary';btn.textContent='Enviar';
  form.append(input,btn);root.appendChild(form);
 }
 return root;
}
async function load({state:s,api,draw},more=false,force=false){
 const c=s.community,key=c.tab+'|'+(c.query||'');
 if(!force&&!more&&c.loaded&&c.lastKey===key&&Date.now()-(c.lastFetched||0)<45000)return;
 const number=(c.serial||0)+1;c.serial=number;
 if(c.tab==='people'){
  const r=await api('people',{search:c.query});
  if(c.serial!==number)return;c.people=r.people||[];
 }else{
  const page=more?c.page:0;
  const r=await api('feed',{page,search:c.query,kind:c.tab==='announcements'?'announcement':'all'});
  if(c.serial!==number)return;
  c.posts=more?c.posts.concat(r.posts||[]):r.posts||[];
  c.page=page+1;c.more=!!r.has_more;
 }
 c.loaded=true;c.lastKey=key;c.lastFetched=Date.now();
 if(s.route==='community')draw();
}
async function action({state:s,a,el,id,api,draw,toast}){
 const c=s.community;
 if(a==='social-tab'){
  if(!['posts','announcements','people'].includes(el.dataset.value))return;
  c.tab=el.dataset.value;c.query='';c.loaded=false;c.posts=[];c.people=[];
  draw();await load({state:s,api,draw});return;
 }
 if(a==='social-search'){
  c.query=document.querySelector('#social-search')?.value.trim()||'';
  c.loaded=false;await load({state:s,api,draw},false,true);return;
 }
 if(a==='social-refresh')return load({state:s,api,draw},false,true);
 if(a==='social-more')return load({state:s,api,draw},true);
 if(a==='social-comments'){
  const card=el.closest('.social-feed-post');
  const versions=c.commentVersions||(c.commentVersions={});versions[id]=(versions[id]||0)+1;const version=versions[id];
  if(c.comments[id]){delete c.comments[id];card?.querySelector('.social-thread')?.remove();return;}
  c.comments[id]=[];
  const loading=document.createElement('div');loading.className='social-thread';loading.textContent='Cargando comentarios…';
  card?.appendChild(loading);
  try{
   const r=await api('comments',{post_id:id});
   if(versions[id]!==version||!c.comments[id])return;
   c.comments[id]=r.comments||[];
   if(loading.isConnected){
    const verified=s.user?.identity_verified===true||s.myProfile?.identity_verified===true;
    loading.replaceWith(makeThread(id,c.comments[id],verified));
   }
  }catch(error){if(versions[id]===version)delete c.comments[id];loading.remove();throw error;}
  return;
 }
 if(a==='social-like'){
  const p=c.posts.find(x=>x.id===id);
  if(!p)return;
  const locks=c.pendingLikes||(c.pendingLikes=new Set());
  if(locks.has(id))return;
  locks.add(id);
  const oldLiked=!!p.liked,oldCount=Number(p.likes)||0;
  p.liked=!oldLiked;p.likes=Math.max(0,oldCount+(p.liked?1:-1));
  setLikeLabel(el,p);
  try{
   const r=await api('like',{post_id:id});
   if(typeof r.liked==='boolean'&&r.liked!==p.liked){
    p.liked=r.liked;p.likes=Math.max(0,oldCount+(r.liked&&!oldLiked?1:!r.liked&&oldLiked?-1:0));
   }
   setLikeLabel(el,p);
  }catch(error){
   p.liked=oldLiked;p.likes=oldCount;setLikeLabel(el,p);throw error;
  }finally{locks.delete(id);}
  return;
 }
 if(a==='social-hide'){
  if(!confirm('¿Ocultar esta publicación?'))return;
  const p=c.posts.find(x=>x.id===id),card=el.closest('.social-feed-post');
  if(card)card.style.opacity='.5';
  try{await api('remove',{post_id:id});c.posts=c.posts.filter(x=>x.id!==id);card?.remove();toast('Publicación oculta');}
  catch(error){if(card)card.style.opacity='';throw error;}
  return;
 }
 if(a==='social-pin'){
  const p=c.posts.find(x=>x.id===id);
  const value=el.dataset.pin==='true';
  el.disabled=true;
  try{await api('pin',{post_id:id,pinned:value});if(p)p.pinned=value;await load({state:s,api,draw},false,true);}
  finally{if(el.isConnected)el.disabled=false;}
 }
}
async function submit({state:s,form,f,api,draw,toast}){
 const c=s.community;
 if(form.dataset.form==='social-create'){
  const r=await api('new_post',{body:f.body,kind:f.kind||'publication',...(s.communityImage||{})});
  s.communityImage=null;
  if(r.post&&c.tab==='posts'&&!(c.query||'')){
   c.posts.unshift(r.post);
   c.lastFetched=Date.now();
   if(s.route==='community')draw();
  }else await load({state:s,api,draw},false,true);
  toast('Publicación compartida');return;
 }
 const postId=form.dataset.post;
 const post=c.posts.find(x=>x.id===postId),text=String(f.body||'').trim();
 if(!text)return;
 const temporary={id:'temporary-'+Date.now(),body:text,author:{display_name:s.user?.display_name||'Yo',nickname:s.myProfile?.nickname||''}};
 const existing=c.comments[postId]||(c.comments[postId]=[]);
 existing.push(temporary);
 const node=makeComment(temporary);node.classList.add('social-comment-pending');
 form.parentElement?.insertBefore(node,form);
 const input=form.querySelector('[name="body"]');
 if(input)input.value='';
 try{
  await api('comment',{post_id:postId,body:text});
  node.classList.remove('social-comment-pending');
  if(post)post.comments=(Number(post.comments)||0)+1;
  const footer=form.closest('.social-feed-post')?.querySelector('[data-action="social-comments"]');
  if(footer&&post)footer.textContent='◯ '+post.comments+' comentarios';
  toast('Comentario publicado');
 }catch(error){
  const index=existing.indexOf(temporary);if(index>=0)existing.splice(index,1);
  node.remove();if(input&&input.isConnected)input.value=text;
  throw error;
 }
}
async function photo({state:s,file:f}){
 if(!f){s.communityImage=null;return}if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>6000000)throw Error('Elegí JPG, PNG o WebP, hasta 6 MB');
 const url=URL.createObjectURL(f),im=new Image();
 try{await new Promise((ok,bad)=>{im.onload=ok;im.onerror=()=>bad(new Error('Imagen no válida'));im.src=url});
 const cv=document.createElement('canvas'),ratio=Math.min(1,900/Math.max(im.width,im.height));cv.width=Math.max(1,Math.round(im.width*ratio));cv.height=Math.max(1,Math.round(im.height*ratio));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
 let b64='',quality=.8;do{b64=cv.toDataURL('image/jpeg',quality).split(',')[1];quality-=.14}while(b64.length>640000&&quality>.25);
 if(b64.length>640000)throw Error('La foto supera el límite, elegí otra');s.communityImage={image_base64:b64,mime:'image/jpeg'};const label=document.querySelector('#social-file-state');if(label)label.textContent='Imagen preparada';
 }finally{URL.revokeObjectURL(url)}
}
window.AureaSocial={view,load,action,submit,photo};
})();