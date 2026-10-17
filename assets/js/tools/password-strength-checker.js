

function setCheck(id, ok, text){

let el=document.getElementById(id);

if(ok){

el.innerHTML="✅ "+text;
el.className="good";

}else{

el.innerHTML="❌ "+text;
el.className="bad";

}

}




function checkPassword(){
const s=document.getElementById('password').value,checks=[Array.from(s).length>=12,/\p{Lu}/u.test(s),/\p{Ll}/u.test(s),/\p{N}/u.test(s),/[^\p{L}\p{N}\s]/u.test(s)],ids=['length','upper','lower','number','symbol'];ids.forEach((id,i)=>{const e=document.getElementById(id);e.textContent=(checks[i]?'✓ ':'○ ')+['At least 12 characters','Uppercase letter','Lowercase letter','Number','Symbol'][i];});const score=checks.filter(Boolean).length;document.getElementById('bar').style.width=score*20+'%';document.getElementById('result').textContent=score+' of 5 character checks';document.getElementById('time').textContent=/^(password|qwerty|123456|letmein)/i.test(s)||/^(.)\1{3,}$/u.test(s)?'Common or repeated pattern detected. This checklist cannot estimate cracking time.':'This checklist does not check breaches or measure password security.';
}



function togglePassword(){

let input=document.getElementById("password");

if(input.type==="password"){
input.type="text";
}else{
input.type="password";
}

}



function copyPassword(){

let input=document.getElementById("password");

if(!input.value) return;

navigator.clipboard.writeText(input.value);


let msg=document.getElementById("copyMessage");
if(msg){
msg.style.display="block";
setTimeout(()=>{
msg.style.display="none";
},2500);
}


}



function generateStrongPassword(){try{document.getElementById('password').value=window.FTOSafety.password(16,['ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz','0123456789','!@#$%^&*']);checkPassword();}catch(error){document.getElementById('result').textContent=error.message;}}

