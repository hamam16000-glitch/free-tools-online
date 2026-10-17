

function generateTags(){
const title=document.getElementById('title').value.trim(),keywords=document.getElementById('keywords').value.trim(),category=document.getElementById('category').value,clean=s=>(s.normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[]).join(' ');document.getElementById('output').textContent='';document.getElementById('hashtags').textContent='';if(!clean(title)&&!clean(keywords)){document.getElementById('tagCount').textContent='0 Tags';document.getElementById('charCount').textContent='0 / 500';showMessage('Enter your title or keywords.');return;}const candidates=[clean(title),...keywords.split(/[,،\n]/).map(clean),...title.split(/\s+/).map(clean)],tags=[];let used=0;for(const tag of [...new Set(candidates.filter(Boolean))]){const cost=tag.length+(tag.includes(' ')?2:0)+(tags.length?1:0);if(used+cost<=500){tags.push(tag);used+=cost;}}document.getElementById('output').textContent=tags.join(', ');document.getElementById('hashtags').textContent=tags.slice(0,3).map(t=>'#'+t.replace(/ /g,'')).join(' ');document.getElementById('tagCount').textContent=tags.length+' Tags';document.getElementById('charCount').textContent=used+' / 500';showMessage('Suggestions from your inputs. Review relevance; rankings are not guaranteed.');
}

async function copyTags(){
try{await FTOSafety.copyText(document.getElementById('output').innerText);showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadTags(){

let text=document.getElementById("output").value;


if(!text){

return;

}


let blob=new Blob(
[text],
{type:"text/plain"}
);


let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="youtube-tags.txt";

a.click();


showMessage("TXT file downloaded ✓");


}



function clearTags(){

document.getElementById("title").value="";

document.getElementById("keywords").value="";

document.getElementById("output").value="";

document.getElementById("hashtags").innerHTML="";

document.getElementById("tagCount").innerHTML="0 Tags";

document.getElementById("charCount").innerHTML="0 Characters";

showMessage("Cleared ✓");

}



function showMessage(text){

let box=document.getElementById("success");

box.innerHTML=text;

box.style.display="block";


setTimeout(()=>{

box.style.display="none";

},3000);


}


