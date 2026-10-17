


function generateRobots(){
const a=document.getElementById('agent').value.trim(),rule=document.getElementById('rule').value,path=document.getElementById('path').value.trim(),map=document.getElementById('sitemap').value.trim(),out=document.getElementById('output');out.value='';try{if(!/^[A-Za-z0-9_.*-]+$/.test(a)||!['Allow','Disallow'].includes(rule)||/[\r\n]/.test(path)||path&&!path.startsWith('/'))throw Error('Use one user-agent and a root-relative path beginning with /.');let s='User-agent: '+a+'\n'+rule+': '+path+'\n';if(map){const u=new URL(map);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use a public HTTP(S) sitemap URL.');s+='\nSitemap: '+u.href+'\n';}out.value=s;document.getElementById('status').textContent='Created. Install robots.txt at your hostname root. This does not guarantee indexing.';}catch(e){document.getElementById('status').textContent=e.message;}
}



async function copyRobots(){

    const output = document.getElementById("output");

    if(!output.value.trim()){
        return;
    }

    try{
        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(output.value);
        }else{
            output.focus();
            output.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            output.setSelectionRange(0,0);
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.robotsCopyTimer);

        window.robotsCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);
    }
}function clearRobots(){

document.getElementById("agent").value="*";

document.getElementById("rule").value="Allow";

document.getElementById("path").value="/";

document.getElementById("sitemap").value="";

document.getElementById("output").value="";

document.getElementById("status").innerHTML="";

const box=document.getElementById("copySuccess");
if(box) box.style.display="none";

}


