/* Homepage-only dark mode toggle. Existing home.js/search is untouched. */
(function(){
  'use strict';
  var currentCategory='';
  document.querySelectorAll('body.fto-v2 > .container > h2, body.fto-v2 > .container > .tool-card').forEach(function(item){
    if(item.tagName==='H2')currentCategory=item.id;
    else if(currentCategory)item.setAttribute('data-fto-cat',currentCategory);
  });
  var button=document.getElementById('ftoV2Theme');
  if(!button)return;
  function apply(value){
    if(value==='dark')document.body.setAttribute('data-fto-theme','dark');
    else document.body.removeAttribute('data-fto-theme');
    var dark=value==='dark';
    button.setAttribute('aria-pressed',String(dark));
    button.setAttribute('aria-label',dark?'Turn off dark theme':'Turn on dark theme');
    button.textContent=dark?'☀':'☾';
  }
  var stored='light';
  try { if(localStorage.getItem('ftoHomeTheme')==='dark')stored='dark'; } catch(e) {}
  apply(stored);
  button.addEventListener('click',function(){
    var next=document.body.getAttribute('data-fto-theme')==='dark'?'light':'dark';
    apply(next);
    try{localStorage.setItem('ftoHomeTheme',next);}catch(e){}
  });
}());
