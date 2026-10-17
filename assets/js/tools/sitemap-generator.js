

function generateSitemap(){
const baseText=document.getElementById('siteUrl').value.trim(),pages=document.getElementById('pages').value.trim(),frequency=document.getElementById('frequency').value;
document.getElementById('output').innerText='';if(!baseText||!pages){showMessage('Please enter website URL and pages.');return;}
try{const base=new URL(baseText);if(base.username||base.password||!['http:','https:'].includes(base.protocol))throw new Error('Use an HTTP or HTTPS website URL.');const urls=pages.split(/\n/).map(p=>p.trim()).filter(Boolean).map(page=>{const result=new URL(page,base.href.replace(/\/$/,'')+'/');if(result.origin!==base.origin)throw new Error('Every page must belong to the same site and protocol.');result.hash='';return result.href;});
if(urls.length>50000)throw Error('Maximum 50,000 URLs per sitemap.');const unique=[...new Set(urls)],escape=window.FTOSafety.escapeHTML;let xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';for(const url of unique)xml+='  <url><loc>'+escape(url)+'</loc><changefreq>'+escape(frequency)+'</changefreq></url>\n';xml+='</urlset>';document.getElementById('output').innerText=xml;document.getElementById('output').style.display='block';document.getElementById('pageCount').textContent=unique.length+' Pages';showMessage('Sitemap generated. Lastmod is omitted because actual page update dates are unknown.');
}catch(error){document.getElementById('pageCount').textContent='0 Pages';showMessage(error.message);}
}



async function copySitemap(){
try{await FTOSafety.copyText(document.getElementById('output').innerText);showMessage('Copied.');}catch(e){showMessage(e.message);}
}



function downloadSitemap(){

let text=document.getElementById("output").innerText;


if(!text){

return;

}


let blob=new Blob(
[text],
{type:"application/xml"}
);


let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="sitemap.xml";

a.click();


showMessage("sitemap.xml downloaded ✓");


}



function clearSitemap(){
document.getElementById('output').innerText='';document.getElementById('output').textContent='';

document.getElementById("siteUrl").value="";

document.getElementById("pages").value="";

document.getElementById("output").style.display="none";


document.getElementById("pageCount").innerHTML="0 Pages";


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


