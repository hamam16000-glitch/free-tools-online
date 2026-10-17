

function formatJSON(){
try{const s=document.getElementById('jsonInput').value;JSON.parse(s);const tokens=s.match(/"(?:[^"\\]|\\.)*"|[^\s]/g)||[];let out='',indent=0,string=false;for(let i=0;i<tokens.length;i++){const t=tokens[i];if(true&&(t==='}'||t===']')){indent--;if(tokens[i-1]!=='{'&&tokens[i-1]!=='[')out+='\n'+'  '.repeat(indent);}out+=t;if(true){if(t==='{'||t==='['){indent++;if(tokens[i+1]!=='}'&&tokens[i+1]!==']')out+='\n'+'  '.repeat(indent);}else if(t===',')out+='\n'+'  '.repeat(indent);else if(t===':')out+=' ';}}document.getElementById('jsonInput').value=out;document.getElementById('status').textContent='Valid JSON. Number tokens preserved.';}catch(e){document.getElementById('status').textContent='Invalid JSON: '+e.message;}
}



function validateJSON(){

let input=document.getElementById("jsonInput").value;

let status=document.getElementById("status");


try{

JSON.parse(input);

status.innerHTML="Valid JSON OK";

}

catch(e){

status.innerHTML="Invalid JSON ERROR";

}

}




async function copyJSON(){

    const textarea = document.getElementById("jsonInput");
    const text = textarea.value;

    if(!text.trim()){
        document.getElementById("status").textContent =
            "Nothing to copy";
        return;
    }

    try{

        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(text);
        }else{
            textarea.focus();
            textarea.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            textarea.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");

        box.style.display = "block";

        clearTimeout(window.jsonCopyTimer);

        window.jsonCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);

        document.getElementById("status").textContent =
            "Could not copy JSON";
    }
}

function clearJSON(){
    document.getElementById("jsonInput").value="";
    document.getElementById("status").innerHTML="";

    const box=document.getElementById("copySuccess");
    if(box) box.style.display="none";
}

