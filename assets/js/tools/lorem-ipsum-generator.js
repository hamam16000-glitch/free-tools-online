
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


async function copyText() {
    const result = document.getElementById('result');
    const box = document.getElementById('copySuccess');

    clearTimeout(window.loremCopyTimer);

    function showMessage(message, failed) {
        if (!box) return;

        box.textContent = message;
        box.style.display = 'block';

        box.style.color = failed ? '#b91c1c' : '';
        box.style.backgroundColor =
            failed ? '#fef2f2' : '';
    }

    if (!result.value.trim()) {
        showMessage(
            'Generate text before copying.',
            true
        );
        return;
    }

    try {
        const safety = window.FTOSafety;

        if (!safety ||
            typeof safety.copyText !== 'function') {
            throw new Error(
                'Clipboard service unavailable.'
            );
        }

        await safety.copyText(result.value);

        showMessage('Copied successfully.', false);

        window.loremCopyTimer = setTimeout(() => {
            if (box) box.style.display = 'none';
        }, 3000);

    } catch (error) {
        showMessage(
            'Copy failed. Select and copy the text manually.',
            true
        );
    }
}

function clearText(){
    document.getElementById("result").value="";

    const box=document.getElementById("copySuccess");
    if(box) box.style.display="none";
}
