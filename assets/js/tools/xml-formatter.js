


function formatXML(){
const input=document.getElementById('xmlInput'),s=input.value,t=new DOMParser().parseFromString(s,'application/xml');if(t.querySelector('parsererror')){document.getElementById('status').textContent='Invalid XML. Input unchanged.';return;}const mixed=[...t.querySelectorAll('*')].some(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim())&&e.children.length);if(mixed||/xml:space\s*=\s*['"]preserve/.test(s)){document.getElementById('status').textContent='Valid XML. Mixed content and preserved whitespace left unchanged.';return;}let depth=0;input.value=s.replace(/>\s*</g,'>\n<').split('\n').map(line=>{if(/^<\//.test(line))depth=Math.max(0,depth-1);const result='  '.repeat(depth)+line;if(/^<[^!?/]/.test(line)&&!/<\//.test(line)&&!(/\/\s*>$/.test(line)))depth++;return result;}).join('\n');document.getElementById('status').textContent='Valid XML formatted.';
}



function validateXML(){

let xml=document.getElementById("xmlInput").value;

let parser=new DOMParser();

let result=parser.parseFromString(xml,"text/xml");


if(result.getElementsByTagName("parsererror").length){

document.getElementById("status").innerHTML=
"Invalid XML ERROR";

}else{

document.getElementById("status").innerHTML=
"Valid XML OK";

}

}function copyXML(){

let output=document.getElementById("xmlInput");

output.select();

document.execCommand("copy");

alert("XML copied successfully");

}



function clearXML(){

document.getElementById("xmlInput").value="";

document.getElementById("status").innerHTML="";

}


