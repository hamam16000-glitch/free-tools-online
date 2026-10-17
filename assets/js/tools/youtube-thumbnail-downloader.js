

function extractVideoId(url){
try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';let id='';if(u.hostname==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)){if(u.pathname==='/watch')id=u.searchParams.get('v');else if(/^\/(shorts|embed|live)\//.test(u.pathname))id=u.pathname.split('/')[2];}return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';}catch(e){return '';}
}



function getThumbnail(){
const id=extractVideoId(document.getElementById('videoUrl').value.trim()),box=document.getElementById('downloads'),img=document.getElementById('previewImage');box.replaceChildren();img.removeAttribute('src');img.style.display='none';if(!id){showMessage('Enter a valid YouTube watch, short, embed or youtu.be URL.');return;}const names=[['Maximum resolution (when available)','maxresdefault'],['High quality','hqdefault'],['Medium quality','mqdefault'],['Default','default']];img.onerror=()=>{img.onerror=null;img.src='https://img.youtube.com/vi/'+id+'/hqdefault.jpg';};img.src='https://img.youtube.com/vi/'+id+'/maxresdefault.jpg';img.style.display='inline-block';for(const [label,key] of names){const url='https://img.youtube.com/vi/'+id+'/'+key+'.jpg',a=document.createElement('a'),b=document.createElement('button');a.href=url;a.target='_blank';a.rel='noopener';a.textContent='Open '+label+' image';b.textContent='Download '+label;b.onclick=async()=>{try{const r=await fetch(url);if(!r.ok)throw Error('Image unavailable');const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('Image unavailable');FTOSafety.downloadBlob(blob,id+'-'+key+'.jpg');showMessage('Download requested.');}catch(e){showMessage('Direct download is unavailable. Open the image link and use Save image.');}};box.append(a,b);}showMessage('Images are requested from YouTube. Some resolutions may not exist.');
}




function showMessage(text){

let box=document.getElementById("success");

box.innerHTML=text;

box.style.display="block";


setTimeout(()=>{

box.style.display="none";

},3000);


}



