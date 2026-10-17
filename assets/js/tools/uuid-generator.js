

function createUUIDv4(){

    // Best option when supported
    if(window.crypto && typeof crypto.randomUUID === "function"){
        return crypto.randomUUID();
    }

    // Secure fallback for browsers without randomUUID()
    if(window.crypto && typeof crypto.getRandomValues === "function"){

        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // UUID v4 version + variant bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(
            bytes,
            b => b.toString(16).padStart(2,"0")
        );

        return (
            hex.slice(0,4).join("") + "-" +
            hex.slice(4,6).join("") + "-" +
            hex.slice(6,8).join("") + "-" +
            hex.slice(8,10).join("") + "-" +
            hex.slice(10,16).join("")
        );
    }

    throw new Error('Secure browser randomness is unavailable. Use HTTPS and a current browser.');
}

function generateUUID(){
try{

    const uuid = createUUIDv4();

    document.getElementById("uuidOutput").value = uuid;

    document.getElementById("status").innerHTML =
        "UUID Generated Successfully";

    hideCopyMessage();
}catch(e){document.getElementById('uuidOutput').value='';document.getElementById('status').textContent=e.message;}
}

function generateMultiple(){
try{

    const list = [];

    for(let i = 0; i < 5; i++){
        list.push(createUUIDv4());
    }

    document.getElementById("uuidOutput").value =
        list.join("\n");

    document.getElementById("status").innerHTML =
        "5 UUIDs Generated Successfully";

    hideCopyMessage();
}catch(e){document.getElementById('uuidOutput').value='';document.getElementById('status').textContent=e.message;}
}

async function copyUUID(){

    const output =
        document.getElementById("uuidOutput");

    if(!output.value.trim()){
        return;
    }

    try{

        if(navigator.clipboard && window.isSecureContext){

            await navigator.clipboard.writeText(
                output.value
            );

        }else{

            output.focus();
            output.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            output.setSelectionRange(0,0);
        }

        const box =
            document.getElementById("copySuccess");

        box.style.display = "block";

        clearTimeout(window.uuidCopyTimer);

        window.uuidCopyTimer = setTimeout(() => {
            box.style.display = "none";
        },3000);

    }catch(error){

        console.error("Copy error:",error);

    }
}

function hideCopyMessage(){

    const box =
        document.getElementById("copySuccess");

    if(box){
        box.style.display = "none";
    }
}

function clearUUID(){

    document.getElementById("uuidOutput").value = "";

    document.getElementById("status").innerHTML = "";

    hideCopyMessage();
}

