
function removeDuplicates(){
let text=document.getElementById("text").value;
let lines=text===""?[]:text.split("\n");
let unique=[...new Set(lines)];
document.getElementById("result").value=unique.join("\n");
document.getElementById("info").innerHTML =
"Original Lines: " + lines.length +
"<br>Unique Lines: " + unique.length +
"<br>Removed Lines: " + (lines.length - unique.length);
}

function countLines(){
let text=document.getElementById("text").value;
let lines=text === "" ? 0 : text.split("\n").length;
document.getElementById("info").innerHTML =
"Original Lines: " + lines;
}

async function copyResult(){

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

            result.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.duplicateCopyTimer);

        window.duplicateCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);
    }
}

function clearText(){
document.getElementById("text").value="";
document.getElementById("result").value="";
document.getElementById("info").innerHTML="Original Lines: 0";

const box=document.getElementById("copySuccess");
if(box) box.style.display="none";
}
