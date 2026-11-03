


function formatCSS(){
const input=document.getElementById('cssInput').value;document.getElementById('cssInput').value=window.FTOSafety.protectedCSS(input,text=>text.replace(/\s*{\s*/g,' {\n    ').replace(/;\s*/g,';\n    ').replace(/\s*}\s*/g,'\n}\n'));document.getElementById('status').textContent='CSS formatted; quoted strings and URLs are preserved.';
}



function minifyCSS(){
const input=document.getElementById('cssInput').value;document.getElementById('cssInput').value=window.FTOSafety.protectedCSS(input,text=>text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,])\s*/g,'$1').trim());document.getElementById('status').textContent='CSS minified; quoted strings and URLs are preserved.';
}

async function copyCSS() {
    const input = document.getElementById('cssInput');
    const status = document.getElementById('status');
    const text = input.value;

    if (!text.trim()) {
        status.textContent = 'Enter CSS before copying.';
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

        await safety.copyText(text);

        status.textContent = 'CSS copied successfully.';

    } catch (error) {
        status.textContent =
            'Copy failed: ' +
            (error.message || 'Clipboard unavailable.');
    }
}

function clearCSS(){

document.getElementById("cssInput").value="";

document.getElementById("status").innerHTML="";

}


