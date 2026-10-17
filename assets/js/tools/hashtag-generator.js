

function generateHashtags(){
const topic=document.getElementById('topic').value.normalize('NFKC').trim(),amount=Number(document.getElementById('amount').value),words=topic.match(/[\p{L}\p{N}]+/gu)||[];document.getElementById('output').textContent='';document.getElementById('count').textContent='0 Hashtags';if(!words.length||![10,20,30].includes(amount)){showMessage('Enter a topic and choose 10, 20 or 30 tags.');return;}const root=words.join(''),set=new Set([root,...words]),suffixes=['Tips','Guide','Ideas','Basics','Examples','Learning','Community','Resources','Projects','HowTo','Tools','Practice','Explained','Questions','Tutorial','Support','Daily','Updates','Help','Planning','Inspiration','Skills','Discussion','Stories','Review','Checklist','Methods','Advice','Insights','Notes'];for(const suffix of suffixes){if(set.size>=amount)break;set.add(root+suffix);}const tags=[...set].slice(0,amount).map(t=>'#'+t);document.getElementById('output').textContent=tags.join(' ');document.getElementById('count').textContent=tags.length+' Hashtags';showMessage('Rule-based suggestions created. Relevance and popularity are not measured.');
}



async function copyHashtags(){
try{await FTOSafety.copyText(document.getElementById('output').innerText);showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadHashtags(){

let text=document.getElementById("output").innerText;


if(!text){

return;

}


let blob=new Blob(

[text],

{type:"text/plain"}

);


let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="hashtags.txt";

a.click();


showMessage("Downloaded ✓");


}



function clearHashtags(){

document.getElementById("topic").value="";

document.getElementById("output").style.display="none";

document.getElementById("count").innerHTML="0 Hashtags";


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


