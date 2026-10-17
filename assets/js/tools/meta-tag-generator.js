


function generateMeta(){

let title=document.getElementById("title").value.trim();

let description=document.getElementById("description").value.trim();

let keywords=document.getElementById("keywords").value.trim();

let author=document.getElementById("author").value.trim();

let url=document.getElementById("url").value.trim();

let ogImage=document.getElementById("ogImage").value.trim();

let twitterImage=document.getElementById("twitterImage").value.trim();

let language=document.getElementById("language").value.trim() || "en";

let themeColor=document.getElementById("themeColor").value.trim() || "#2563eb";

let robots=document.getElementById("robots").value;



if(!title || !description){

showMessage("Please enter title and description.");

return;

}



try{for(const s of [url,ogImage,twitterImage].filter(Boolean)){const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use public HTTP(S) URLs.');}}catch(e){document.getElementById('output').innerText='';document.getElementById('output').textContent='';document.getElementById('googlePreview').textContent='';showMessage(e.message);return;}
const titleLength=Array.from(title).length,descriptionLength=Array.from(description).length;
[title,description,keywords,author,url,ogImage,twitterImage,language,themeColor,robots]=[title,description,keywords,author,url,ogImage,twitterImage,language,themeColor,robots].map(window.FTOSafety.escapeHTML);
let html=`

<title>${title}</title>

<meta name="description" content="${description}">

<meta name="keywords" content="${keywords}">

<meta name="author" content="${author}">

<meta name="robots" content="${robots}">

<meta name="language" content="${language}">

<meta name="theme-color" content="${themeColor}">

<link rel="canonical" href="${url}">

<meta property="og:image" content="${ogImage}">

<meta name="twitter:image" content="${twitterImage}">


<!-- Open Graph -->

<meta property="og:title" content="${title}">

<meta property="og:description" content="${description}">

<meta property="og:url" content="${url}">

<meta property="og:type" content="website">


<!-- Twitter Card -->

<meta name="twitter:card" content="summary">

<meta name="twitter:title" content="${title}">

<meta name="twitter:description" content="${description}">

`;



document.getElementById("output").innerText=html;

document.getElementById("output").style.display="block";



document.getElementById("preview").innerHTML=

`

<h3>${title}</h3>

<p>${description}</p>

<small>${url}</small>

`;



document.getElementById("preview").style.display="block";


document.getElementById("googlePreview").innerHTML=

`

<h3 style="color:#1a0dab">
${title}
</h3>

<p style="color:#008000">
${url}
</p>

<p>
${description}
</p>

`;

document.getElementById("googlePreview").style.display="block";


let titleScore = titleLength <= 60 ? "Title length within the 60-character guideline" : "Title exceeds the 60-character guideline";

let descScore = descriptionLength <= 160 ? "Description within the 160-character guideline" : "Description exceeds the 160-character guideline";


document.getElementById("seoScore").innerHTML=

`

<h3>Length guidelines</h3>

<p>${titleScore} (${titleLength}/60)</p>

<p>${descScore} (${descriptionLength}/160)</p>

<p>Length is only a guideline. Search appearance and ranking are not guaranteed.</p>

`;

document.getElementById("seoScore").style.display="block";


showMessage("Meta tags generated successfully ✓");


}



async function copyMeta(){
try{await FTOSafety.copyText(document.getElementById('output').innerText);showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadMeta(){

let text=document.getElementById("output").innerText;


if(!text){

return;

}


let blob=new Blob(

[text],

{type:"text/html"}

);


let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="meta-tags.html";

a.click();


showMessage("HTML downloaded ✓");


}



function clearMeta(){
document.getElementById('output').innerText='';document.getElementById('output').textContent='';document.getElementById('googlePreview').textContent='';document.getElementById('seoScore').textContent='';

document.querySelectorAll("input,textarea").forEach(e=>{

e.value="";

});


document.getElementById("output").style.display="none";

document.getElementById("preview").style.display="none";


showMessage("Cleared ✓");

}



function showMessage(text){

let box=document.getElementById("success");

box.innerHTML=text;

box.style.display="block";


setTimeout(()=>{

box.style.display="none";

},3000);


}


