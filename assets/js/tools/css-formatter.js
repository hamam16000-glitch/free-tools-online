


function formatCSS(){
const input=document.getElementById('cssInput').value;document.getElementById('cssInput').value=window.FTOSafety.protectedCSS(input,text=>text.replace(/\s*{\s*/g,' {\n    ').replace(/;\s*/g,';\n    ').replace(/\s*}\s*/g,'\n}\n'));document.getElementById('status').textContent='CSS formatted; quoted strings and URLs are preserved.';
}



function minifyCSS(){
const input=document.getElementById('cssInput').value;document.getElementById('cssInput').value=window.FTOSafety.protectedCSS(input,text=>text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,])\s*/g,'$1').trim());document.getElementById('status').textContent='CSS minified; quoted strings and URLs are preserved.';
}function copyCSS(){

let output=document.getElementById("cssInput");

output.select();

document.execCommand("copy");

alert("CSS copied successfully");

}



function clearCSS(){

document.getElementById("cssInput").value="";

document.getElementById("status").innerHTML="";

}


