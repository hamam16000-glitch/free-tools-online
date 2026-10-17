


function getText(){

return document.getElementById("text").value;

}




function uppercaseText(){

document.getElementById("result").value =
getText().toUpperCase();

}




function lowercaseText(){

document.getElementById("result").value =
getText().toLowerCase();

}




function titleCase(){

let text=getText().toLowerCase();

document.getElementById("result").value =
text.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_,before,letter)=>before+letter.toUpperCase());

}




function sentenceCase(){

let text=getText().toLowerCase();

document.getElementById("result").value =
text.replace(/(^|[.!?؟]\s+)(\p{L})/gu,(_,before,letter)=>before+letter.toUpperCase());

}




function updatePreview(){

document.getElementById("result").value =
getText();

}




async function copyText(){

    const result = document.getElementById("result");

    if(!result.value.trim()){
        return;
    }

    try{
        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(result.value);
        }else{
            result.focus();
            result.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }
        }

        const box = document.getElementById("copySuccess");

        if(box){
            box.style.display = "block";

            clearTimeout(window.caseCopyTimer);

            window.caseCopyTimer = setTimeout(() => {
                box.style.display = "none";
            }, 3000);
        }

    }catch(error){
        console.error("Copy error:", error);
    }
}




function clearText(){

document.getElementById("text").value="";

document.getElementById("result").value="";

}



