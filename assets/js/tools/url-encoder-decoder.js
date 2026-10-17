


function encodeURL(){

let text=document.getElementById("urlInput").value;

let result=encodeURIComponent(text);


document.getElementById("urlInput").value=result;

document.getElementById("status").innerHTML=
"URL Encoded Successfully";

}



function decodeURL(){

let text=document.getElementById("urlInput").value;


try{

let result=decodeURIComponent(text);


document.getElementById("urlInput").value=result;

document.getElementById("status").innerHTML=
"URL Decoded Successfully";

}

catch(e){

document.getElementById("status").innerHTML=
"Invalid URL Encoding";

}

}async function copyURL(){

    const output = document.getElementById("urlInput");

    if(!output.value.trim()){
        return;
    }

    try{

        if(navigator.clipboard && window.isSecureContext){

            await navigator.clipboard.writeText(output.value);

        }else{

            output.focus();
            output.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            output.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.urlCopyTimer);

        window.urlCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){

        console.error("Copy error:", error);

    }
}



function clearURL(){

document.getElementById("urlInput").value="";

document.getElementById("status").innerHTML="";

const box=document.getElementById("copySuccess");
if(box) box.style.display="none";

}


