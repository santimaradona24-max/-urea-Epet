'use strict';
const { ipcRenderer } = require('electron');
const elementId = 'aurea-native-update';
let current = null;

function inAssessment() {
  return location.hash.startsWith('#/take') && sessionStorage.getItem('aurea_attempt') !== null;
}

function render(update) {
  current = update;
  const old = document.getElementById(elementId);
  if (inAssessment()) { if (old) old.remove(); return; }
  if (!document.body) return;
  if (!update || update.status === 'none') { if (old) old.remove(); return; }
  const host = old || document.createElement('aside');
  host.id = elementId;
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live','polite');
  host.style.cssText = 'position:fixed;right:19px;bottom:19px;max-width:min(390px,calc(100vw - 38px));z-index:2147483500;padding:17px 18px;background:var(--white,#fffdfa);border:1px solid var(--line,#eae0d2);box-shadow:0 12px 42px rgba(60,39,14,.16);border-radius:16px;color:var(--ink,#302c29);font:13px/1.5 system-ui,Segoe UI,sans-serif;';
  const title = document.createElement('div');
  title.textContent = 'Áurea · Actualización disponible';
  title.style.cssText = 'font:500 21px Georgia,serif;color:var(--copper,#923f20);margin-bottom:7px;';
  const description = document.createElement('p');
  description.style.cssText = 'font-size:12px;line-height:1.5;color:var(--muted,#81796f);margin:0 0 13px;';
  const action = document.createElement('button');
  action.type='button';
  action.style.cssText='display:inline-block;border:0;border-radius:10px;background:var(--orange,#b95c2b);padding:10px 14px;color:white;font-size:12px;font-weight:700;cursor:pointer;';
  if(update.status==='available'){
    description.textContent = 'Hay una versión nueva de la aplicación de Windows. Podés descargarla sin cerrar tu sesión.';
    action.textContent = 'Descargar versión '+String(update.detail||'nueva');
    action.addEventListener('click',()=>ipcRenderer.send('aurea:update:download'));
  }else if(update.status==='progress'){
    description.textContent = 'Descargando actualización de Áurea: '+(Number(update.detail)||0)+' %. Podés seguir usando el campus.';
    action.textContent = 'Descargando…'; action.disabled=true; action.style.opacity='.6';
  }else if(update.status==='ready'){
    title.textContent='Áurea · Lista para instalar';
    description.textContent='La actualización está descargada. Reiniciá la app para aplicarla; no se interrumpirá una evaluación.';
    action.textContent='Actualizar y reiniciar';
    action.addEventListener('click',()=>ipcRenderer.send('aurea:update:install'));
  }else if(update.status==='error'){
    title.textContent='Áurea · Actualización pendiente';
    description.textContent='No se pudo completar la descarga. Volvé a intentar cuando tengas conexión.';
    action.textContent='Reintentar';
    action.addEventListener('click',()=>ipcRenderer.send('aurea:update:download'));
  }else{return;}
  host.replaceChildren(title,description,action);
  if (!old) document.body.appendChild(host);
}
ipcRenderer.on('aurea:native-update',(_event,update)=>render(update));
window.addEventListener('hashchange',()=>render(current));
window.addEventListener('DOMContentLoaded',()=>render(current));
