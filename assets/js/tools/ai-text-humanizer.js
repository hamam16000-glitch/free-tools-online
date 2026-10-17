


function humanizeText(){

let text=document.getElementById("inputText").value.trim();

let level=document.getElementById("level").value;


document.getElementById("originalPreview").value=text;


if(!text){document.getElementById('output').value='';updateStats('');

showMessage("Please enter text first.");

return;

}


let result=text;


// remove extra spaces

result=result.replace(/\s+/g," ").trim();


// improve common words

let replacements={

"utilize":"use",

"utilizes":"uses",

"very important":"essential",

"very good":"effective",

"very bad":"poor",

"a lot of":"many",

"in order to":"to",

"due to the fact that":"because",

"at this point in time":"currently"

};


Object.keys(replacements).forEach(word=>{

let regex=new RegExp("\\b"+word+"\\b","gi");

result=result.replace(regex,replacements[word]);

});



// improve punctuation

result=result
.replace(/ ,/g,",")
.replace(/ \./g,".")
.replace(/\. +/g,". ");



if(level==="medium" || level==="strong"){

result=result
.split(". ")
.map(sentence=>{

sentence=sentence.trim();

if(sentence.length>0){

return sentence.charAt(0).toUpperCase()+sentence.slice(1);

}

return sentence;

})
.join(". ");

}



if(level==="strong"){

result=result
.replace(/\bI think\b/gi,"I believe")
.replace(/\bbut\b/gi,"however")
.replace(/\balso\b/gi,"additionally");

}



document.getElementById("output").value=result;


updateStats(result);


let words=result.split(/\s+/).length;

let minutes=Math.ceil(words/200);


showMessage("Rule-based edits applied. Review the wording before use.");


}

function addSpacing(text){

return text
.split(". ")
.map(sentence=>{

return sentence.trim();

})
.join(". ");

}



function updateStats(text){

let words=text.trim()
? text.trim().split(/\s+/).length
:0;


document.getElementById("wordCount").innerHTML=
words+" Words";


document.getElementById("charCount").innerHTML=
Array.from(text).length+" Characters";


let reading=Math.max(1,Math.ceil(words/200));


document.getElementById("readingTime").innerHTML=
reading+" min read";


}



async function copyResult(){
try{await FTOSafety.copyText(document.getElementById('output').value);showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadText(){

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

a.download="humanized-text.txt";

a.click();


showMessage("TXT file downloaded ✓");


}



function clearText(){
document.getElementById('originalPreview').value='';updateStats('');

document.getElementById("inputText").value="";

document.getElementById("output").value="";


document.getElementById("wordCount").innerHTML="0 Words";

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


