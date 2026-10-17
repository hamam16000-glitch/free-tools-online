
function getLines(){
return document.getElementById("text").value.split("\n");
}

function sortAZ(){
let lines=getLines();
lines.sort((a,b)=>a.localeCompare(b));
document.getElementById("result").value = lines.join("\n");
}

function sortZA(){
let lines=getLines();
lines.sort((a,b)=>b.localeCompare(a));
document.getElementById("result").value = lines.join("\n");
}

function removeEmpty(){
let lines=getLines().filter(line=>line.trim()!=="");
document.getElementById("result").value = lines.join("\n");
}

function countLines(){
let text=document.getElementById("text").value;
let lines=text===""?0:text.split("\n").length;
document.getElementById("info").innerHTML = "Lines: " + lines;
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

        clearTimeout(window.textSorterCopyTimer);

        window.textSorterCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){

        console.error("Copy error:", error);

    }
}

function clearText(){
document.getElementById("text").value="";
document.getElementById("result").value="";
document.getElementById("info").innerHTML="Lines: 0";

const box=document.getElementById("copySuccess");
if(box) box.style.display="none";
}
