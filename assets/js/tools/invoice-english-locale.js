/* Invoice-only English UI locale patch. Does not modify invoice calculation/PDF logic. */
(function () {
  'use strict';
  const englishMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const numericSelector = '#itemsList input.item-qty, #itemsList input.item-rate, #tax, #discount';
  const ascii = (str) => String(str).replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0)-0x0660))
    .replace(/[\u06F0-\u06F9]/g, c => String(c.charCodeAt(0)-0x06F0))
    .replace(/[\u066B]/g, '.').replace(/[\u066C\u060C]/g,'');
  function decimalOnly(value) {
    const raw = ascii(value).replace(/[^0-9.]/g, '');
    const dot = raw.indexOf('.');
    return dot < 0 ? raw : raw.slice(0,dot+1)+raw.slice(dot+1).replace(/\./g,'');
  }
  function makeNumericEnglish(input) {
    if (input.dataset.ftoEnglishDigits === '1') return;
    const oldValue = input.value;
    input.type = 'text'; // Native Android number inputs follow OS digit shaping.
    input.setAttribute('inputmode','decimal');
    input.setAttribute('lang','en-US');
    input.setAttribute('dir','ltr');
    input.setAttribute('autocomplete','off');
    input.setAttribute('data-fto-english-digits','1');
    input.value = decimalOnly(oldValue);
    input.addEventListener('input', function() {
      const normalized = decimalOnly(input.value);
      if (normalized !== input.value) {
        const end = input.selectionStart;
        input.value = normalized;
        if (end !== null) try {input.setSelectionRange(Math.min(end,normalized.length),Math.min(end,normalized.length));} catch (_) {}
      }
    },true); // Runs before the existing inline oninput="updatePreview()".
  }
  function updateNumeric() { document.querySelectorAll(numericSelector).forEach(makeNumericEnglish); }
  updateNumeric();
  const items = document.getElementById('itemsList');
  if (items) new MutationObserver(updateNumeric).observe(items,{childList:true,subtree:true});

  const iso = (y,m,d) => String(y).padStart(4,'0')+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  const parseISO = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = +m[1], mm=+m[2]-1, d=+m[3];
    const date = new Date(y,mm,d);
    return date.getFullYear()===y && date.getMonth()===mm && date.getDate()===d ? date : null;
  };
  let activeCalendar = null;
  function setupDate(input) {
    if (!input || input.dataset.ftoEnglishDate === '1') return;
    input.type='text';
    input.readOnly=true;
    input.setAttribute('inputmode','none');
    input.setAttribute('dir','ltr');
    input.setAttribute('lang','en-US');
    input.setAttribute('autocomplete','off');
    input.setAttribute('placeholder','YYYY-MM-DD');
    input.setAttribute('aria-haspopup','dialog');
    input.setAttribute('data-fto-english-date','1');
    const label = document.querySelector('label[for="'+input.id+'"]');
    const title = label ? label.textContent.trim() : 'Date';
    const holder=document.createElement('div');holder.className='fto-en-date-control';
    input.parentNode.insertBefore(holder,input);holder.appendChild(input);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='fto-en-date-toggle';
    toggle.setAttribute('aria-label','Choose '+title);
    toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
    holder.appendChild(toggle);
    const pop=document.createElement('div');pop.className='fto-en-calendar';pop.hidden=true;
    pop.setAttribute('role','dialog');pop.setAttribute('aria-label',title+' calendar');
    holder.appendChild(pop);
    let year=0,month=0;
    function close(){ pop.hidden=true;if(activeCalendar===close)activeCalendar=null; }
    function choose(y,m,d){input.value=iso(y,m,d);input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();}
    function render(){
      pop.replaceChildren();
      const header=document.createElement('div');header.className='fto-en-cal-head';
      const back=document.createElement('button');back.type='button';back.textContent='‹';back.setAttribute('aria-label','Previous month');
      const headline=document.createElement('strong');headline.textContent=englishMonths[month]+' '+String(year);
      const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Next month');
      back.addEventListener('click',()=>{const d=new Date(year,month-1,1);year=d.getFullYear();month=d.getMonth();render();});
      next.addEventListener('click',()=>{const d=new Date(year,month+1,1);year=d.getFullYear();month=d.getMonth();render();});
      header.append(back,headline,next);pop.append(header);
      const grid=document.createElement('div');grid.className='fto-en-cal-grid';
      weekdays.forEach(w=>{const h=document.createElement('span');h.className='fto-en-cal-weekday';h.textContent=w;grid.append(h);});
      const offset=new Date(year,month,1).getDay();
      const days=new Date(year,month+1,0).getDate();
      for(let i=0;i<offset;i++){const e=document.createElement('span');grid.append(e);}
      const selected=input.value;
      for(let day=1;day<=days;day++){
        const b=document.createElement('button');b.type='button';b.textContent=String(day);
        b.className='fto-en-cal-day';
        if(iso(year,month,day)===selected){b.setAttribute('aria-current','date');b.classList.add('is-selected');}
        b.setAttribute('aria-label',englishMonths[month]+' '+day+', '+year);
        b.addEventListener('click',()=>choose(year,month,day));grid.append(b);
      }
      pop.append(grid);
      const footer=document.createElement('div');footer.className='fto-en-cal-footer';
      const today=document.createElement('button');today.type='button';today.textContent='Today';
      today.addEventListener('click',()=>{const d=new Date();choose(d.getFullYear(),d.getMonth(),d.getDate());});
      const clear=document.createElement('button');clear.type='button';clear.textContent='Clear';
      clear.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();});
      footer.append(today,clear);pop.append(footer);
    }
    function open(){
      if(activeCalendar && activeCalendar!==close)activeCalendar();
      const selected=parseISO(input.value)||new Date();year=selected.getFullYear();month=selected.getMonth();
      render();pop.hidden=false;activeCalendar=close;
    }
    toggle.addEventListener('click',()=>pop.hidden?open():close());
    input.addEventListener('click',open);
    input.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown'].includes(e.key)){e.preventDefault();open();}});
    document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!holder.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){close();toggle.focus();}});
  }
  setupDate(document.getElementById('invoiceDate'));
  setupDate(document.getElementById('dueDate'));
})();
