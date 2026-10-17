
const words = [
"lorem","ipsum","dolor","sit","amet",
"consectetur","adipiscing","elit",
"sed","do","eiusmod","tempor",
"incididunt","ut","labore","et",
"dolore","magna","aliqua"
];

function generateSentence(){
let sentence="";
for(let i=0;i<12;i++){
sentence += words[Math.floor(Math.random()*words.length)] + " ";
}
return sentence.charAt(0).toUpperCase()+sentence.slice(1).trimEnd()+". ";
}

function generateLorem(){
let count=Number(document.getElementById("paragraphs").value);if(!Number.isInteger(count)||count<1||count>100){document.getElementById("result").value="";alert("Choose 1–100 paragraphs.");return;}
let text="";
for(let i=0;i<count;i++){
let paragraph="";
for(let j=0;j<5;j++){
paragraph += generateSentence();
}
text += paragraph.trim()+"\n\n";
}
document.getElementById("result").value=text;
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

            result.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.loremCopyTimer);

        window.loremCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);
    }
}

function clearText(){
    document.getElementById("result").value="";

    const box=document.getElementById("copySuccess");
    if(box) box.style.display="none";
}
