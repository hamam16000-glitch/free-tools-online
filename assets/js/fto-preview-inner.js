/* Only a preview-only theme toggle: no tool functions or form handlers touched. */
(function(){
  'use strict';
  var b=document.getElementById('ftoV2Theme');
  if(!b)return;
  function setTheme(mode){
    if(mode==='dark')document.body.setAttribute('data-fto-theme','dark');
    else document.body.removeAttribute('data-fto-theme');
    b.textContent=mode==='dark'?'☀':'☾';
    b.setAttribute('aria-pressed',String(mode==='dark'));
    b.setAttribute('aria-label',mode==='dark'?'Use light theme':'Use dark theme');
  }
  var mode='light';
  try{if(localStorage.getItem('ftoHomeTheme')==='dark')mode='dark';}catch(e){}
  setTheme(mode);
  b.addEventListener('click',function(){
    mode=document.body.getAttribute('data-fto-theme')==='dark'?'light':'dark';
    setTheme(mode);
    try{localStorage.setItem('ftoHomeTheme',mode);}catch(e){}
  });
}());
