


function formatHTML(){
const e=document.getElementById('htmlInput'),s=e.value;if(/<(pre|script|style|textarea)\b/i.test(s)){document.getElementById('status').textContent='Raw-text input preserved unchanged.';return;}const block='(?:html|head|body|div|section|article|header|footer|main|nav|ul|ol|li|table|thead|tbody|tr|td|th|p|h[1-6])';const re=new RegExp('(</?'+block+'\\b(?:"[^"]*"|\x27[^\x27]*\x27|[^\x27">])*>)[ \\t\\r\\n]*(?=</?'+block+'\\b)','gi');e.value=s.replace(re,'$1\n');document.getElementById('status').textContent='Only spacing between block tags changed. This tool does not validate HTML.';
}



function minifyHTML(){
const e=document.getElementById('htmlInput'),s=e.value;if(/<(pre|script|style|textarea)\b/i.test(s)){document.getElementById('status').textContent='Raw-text input preserved unchanged.';return;}const block='(?:html|head|body|div|section|article|header|footer|main|nav|ul|ol|li|table|thead|tbody|tr|td|th|p|h[1-6])';const re=new RegExp('(</?'+block+'\\b(?:"[^"]*"|\x27[^\x27]*\x27|[^\x27">])*>)[ \\t\\r\\n]*(?=</?'+block+'\\b)','gi');e.value=s.replace(re,'$1');document.getElementById('status').textContent='Only spacing between block tags changed. This tool does not validate HTML.';
}function copyHTML(){

let output=document.getElementById("htmlInput");

output.select();

document.execCommand("copy");

alert("HTML copied successfully");

}



function clearHTML(){

document.getElementById("htmlInput").value="";

document.getElementById("status").innerHTML="";

}


