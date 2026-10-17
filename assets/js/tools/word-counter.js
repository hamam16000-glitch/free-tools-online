


function countText(){


let text = document.getElementById("text").value;


let words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;


let characters = Array.from(text).length;


let charactersNoSpaces = Array.from(text.replace(/\s/g,"")).length;


let sentences = text.split(/[.!?؟]+/).filter(s=>s.trim()).length;


let paragraphs = text.trim() === "" ? 0 : text.split(/\n+/).filter(p=>p.trim()).length;


let readingTime = Math.ceil(words / 200);



document.getElementById("result").innerHTML =

"Words: " + words +
"<br>Characters: " + characters +
"<br>Characters without spaces: " + charactersNoSpaces +
"<br>Sentences: " + sentences +
"<br>Paragraphs: " + paragraphs +
"<br>Reading Time: " + readingTime + " min";


}





function clearText(){

document.getElementById("text").value="";

countText();

}














async function copyResult(){try{await FTOSafety.copyText(document.getElementById('result').innerText);let e=document.getElementById('copySuccess');if(!e){e=document.createElement('p');e.id='copySuccess';document.getElementById('result').before(e);}e.textContent='Copied.';}catch(e){alert(e.message);}}
