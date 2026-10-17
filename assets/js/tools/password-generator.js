


function generatePassword(){const definitions=[['upper','ABCDEFGHIJKLMNOPQRSTUVWXYZ'],['lower','abcdefghijklmnopqrstuvwxyz'],['numbers','0123456789'],['symbols','!@#$%^&*()_+']],groups=definitions.filter(([id])=>document.getElementById(id).checked).map(([,chars])=>chars);try{const password=window.FTOSafety.password(Number(document.getElementById('length').value),groups);document.getElementById('password').value=password;checkStrength(password);}catch(error){document.getElementById('password').value='';document.getElementById('strength').textContent=error.message;}}



function checkStrength(password){document.getElementById('strength').textContent='Generated '+password.length+' characters using secure browser randomness. Every selected character group is included.';}



async function copyPassword(){

    const password = document.getElementById("password");

    if(!password.value){
        return;
    }

    try{
        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(password.value);
        }else{
            password.focus();
            password.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            password.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.passwordCopyTimer);

        window.passwordCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);
    }
}function clearPassword(){

document.getElementById("password").value="";

document.getElementById("strength").innerHTML="";
const box=document.getElementById("copySuccess");
if(box) box.style.display="none";

}


