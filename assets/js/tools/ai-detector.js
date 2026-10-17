

function analyzeText(){
const text=document.getElementById('inputText').value.trim();if(!text){clearText();showMessage('Enter text first.');return;}const words=text.split(/\s+/),sentences=text.split(/[.!?؟]+/).filter(x=>x.trim()),diversity=new Set(words.map(x=>x.toLowerCase())).size/words.length*100,avg=words.length/Math.max(sentences.length,1),repetition=100-diversity;let score=35+(diversity<50?20:diversity<70?10:0)+(avg>25?20:avg>15?10:0)+(repetition>50?20:repetition>30?10:0);score=Math.min(95,score);document.getElementById('wordCount').textContent=words.length+' Words';document.getElementById('charCount').textContent=Array.from(text).length+' Characters';document.getElementById('sentenceCount').textContent=sentences.length+' Sentences';document.getElementById('score').textContent=score+' / 100';document.getElementById('levelText').textContent='Repetition and sentence-length index';document.getElementById('details').textContent='Distinct whitespace-separated words: '+diversity.toFixed(1)+'%. Average words per sentence: '+avg.toFixed(1)+'. Repetition: '+repetition.toFixed(1)+'%. This rule-based index cannot identify an author, detect AI use, or establish misconduct.';document.getElementById('result').style.display='block';showMessage('Statistics calculated.');
}



function getReport(){
return document.getElementById('result').style.display==='none'?'':document.getElementById('result').innerText;
}



async function copyReport(){
try{await FTOSafety.copyText(getReport());showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadReport(){

let report=getReport();


if(!report){

return;

}


let blob=new Blob(
[report],
{type:"text/plain"}
);


let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="ai-analysis-report.txt";

a.click();


showMessage("Report downloaded ✓");


}



function clearText(){

document.getElementById("inputText").value="";

document.getElementById("result").style.display="none";


document.getElementById("wordCount").innerHTML="0 Words";

document.getElementById("charCount").innerHTML="0 Characters";

document.getElementById("sentenceCount").innerHTML="0 Sentences";


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


