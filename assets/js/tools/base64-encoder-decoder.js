


function encodeBase64(){
try{const s=document.getElementById('inputText').value;if(s.length>5000000)throw Error('Use up to 5 million characters.');const bytes=new TextEncoder().encode(s);let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));document.getElementById('inputText').value=btoa(raw);document.getElementById('status').textContent='UTF-8 text encoded.';}catch(e){document.getElementById('status').textContent=e.message;}
}



function decodeBase64(){
try{const s=document.getElementById('inputText').value.replace(/\s/g,'');if(s.length>7000000||!(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)))throw Error('Invalid standard Base64.');const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));document.getElementById('inputText').value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);document.getElementById('status').textContent='UTF-8 text decoded.';}catch(e){document.getElementById('status').textContent='Cannot decode as Base64 UTF-8 text: '+e.message;}
}async function copyResult(){
try{await FTOSafety.copyText(document.getElementById('inputText').value);document.getElementById('copySuccess').style.display='block';}catch(e){document.getElementById('status').textContent=e.message;}
}



function clearText(){

document.getElementById("inputText").value="";

document.getElementById("status").innerHTML="";

const copySuccess =
    document.getElementById("copySuccess");

if(copySuccess){
    copySuccess.style.display="none";
}

}


