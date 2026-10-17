


function countText(){


let text = document.getElementById("text").value;


let characters = Array.from(text).length;


let charactersNoSpaces = Array.from(text.replace(/\s/g,"")).length;


let words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;


let sentences = text.split(/[.!?؟]+/).filter(s=>s.trim()).length;


let paragraphs = text.trim() === "" ? 0 : text.split(/\n+/).filter(p=>p.trim()).length;


let readingTime = Math.ceil(words / 200);



document.getElementById("result").innerHTML =

"Characters: " + characters +
"<br>Characters without spaces: " + charactersNoSpaces +
"<br>Words: " + words +
"<br>Sentences: " + sentences +
"<br>Paragraphs: " + paragraphs +
"<br>Reading Time: " + readingTime + " min";


}



function clearText(){

document.getElementById("text").value="";

countText();

}



async function copyResult(){

    const result = document.getElementById("result").innerText;

    try{
        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(result);
        }else{
            const temp = document.createElement("textarea");
            temp.value = result;
            temp.style.position = "fixed";
            temp.style.opacity = "0";
            document.body.appendChild(temp);
            temp.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            temp.remove();
        }

        const box = document.getElementById("copySuccess");

        if(box){
            box.style.display = "block";

            clearTimeout(window.characterCopyTimer);

            window.characterCopyTimer = setTimeout(() => {
                box.style.display = "none";
            }, 3000);
        }

    }catch(error){
        console.error("Copy error:", error);
    }
}



