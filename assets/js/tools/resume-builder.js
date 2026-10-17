
let expCount=0;
let eduCount=0;

function esc(value){
    return String(value || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function value(id){
    return document.getElementById(id)?.value.trim() || "";
}

function addExperience(data={}){
    expCount++;

    const box=document.createElement("div");
    box.className="entry";
    box.innerHTML=`
        <label>Job Title</label>
        <input class="exp-role" placeholder="Software Engineer" value="${esc(data.role||"")}" oninput="updatePreview()">

        <label>Company</label>
        <input class="exp-company" placeholder="Company Name" value="${esc(data.company||"")}" oninput="updatePreview()">

        <div class="two">
            <div>
                <label>Start Date</label>
                <input class="exp-start" placeholder="Jan 2023" value="${esc(data.start||"")}" oninput="updatePreview()">
            </div>
            <div>
                <label>End Date</label>
                <input class="exp-end" placeholder="Present" value="${esc(data.end||"")}" oninput="updatePreview()">
            </div>
        </div>

        <label>Description</label>
        <textarea class="exp-desc" placeholder="Describe your responsibilities and achievements..." oninput="updatePreview()">${esc(data.desc||"")}</textarea>

        <button class="danger remove-btn" type="button" onclick="this.parentElement.remove();updatePreview()">Remove</button>
    `;

    document.getElementById("experienceList").appendChild(box);
    updatePreview();
}

function addEducation(data={}){
    eduCount++;

    const box=document.createElement("div");
    box.className="entry";
    box.innerHTML=`
        <label>Degree / Qualification</label>
        <input class="edu-degree" placeholder="Bachelor of Science" value="${esc(data.degree||"")}" oninput="updatePreview()">

        <label>School / University</label>
        <input class="edu-school" placeholder="University Name" value="${esc(data.school||"")}" oninput="updatePreview()">

        <div class="two">
            <div>
                <label>Start Date</label>
                <input class="edu-start" placeholder="2018" value="${esc(data.start||"")}" oninput="updatePreview()">
            </div>
            <div>
                <label>End Date</label>
                <input class="edu-end" placeholder="2022" value="${esc(data.end||"")}" oninput="updatePreview()">
            </div>
        </div>

        <button class="danger remove-btn" type="button" onclick="this.parentElement.remove();updatePreview()">Remove</button>
    `;

    document.getElementById("educationList").appendChild(box);
    updatePreview();
}

function updatePreview(){

    const resume=document.getElementById("resume");
    resume.className="resume template-"+value("template");

    document.getElementById("pName").textContent=value("fullName") || "Your Name";
    document.getElementById("pTitle").textContent=value("jobTitle") || "Professional Title";

    const contact=[
        value("email"),
        value("phone"),
        value("location"),
        value("website")
    ].filter(Boolean);

    document.getElementById("pContact").textContent=
        contact.length ? contact.join(" · ") : "Email · Phone · Location";

    const summary=value("summary");
    const ps=document.getElementById("pSummary");

    ps.textContent=summary || "Your professional summary will appear here.";
    ps.classList.toggle("empty",!summary);

    const expOut=document.getElementById("pExperience");
    expOut.innerHTML="";

    document.querySelectorAll("#experienceList .entry").forEach(entry=>{
        const role=entry.querySelector(".exp-role").value.trim();
        const company=entry.querySelector(".exp-company").value.trim();
        const start=entry.querySelector(".exp-start").value.trim();
        const end=entry.querySelector(".exp-end").value.trim();
        const desc=entry.querySelector(".exp-desc").value.trim();

        if(role || company || start || end || desc){
            const item=document.createElement("div");
            item.className="cv-item";

            if(role){
                const d=document.createElement("div");
                d.className="cv-item-title";
                d.textContent=role;
                item.appendChild(d);
            }

            if(company){
                const d=document.createElement("div");
                d.className="cv-item-sub";
                d.textContent=company;
                item.appendChild(d);
            }

            if(start || end){
                const d=document.createElement("div");
                d.className="cv-date";
                d.textContent=[start,end].filter(Boolean).join(" - ");
                item.appendChild(d);
            }

            if(desc){
                const d=document.createElement("div");
                d.className="cv-text";
                d.textContent=desc;
                item.appendChild(d);
            }

            expOut.appendChild(item);
        }
    });

    if(!expOut.children.length){
        expOut.innerHTML='<div class="empty cv-text">Your work experience will appear here.</div>';
    }

    const eduOut=document.getElementById("pEducation");
    eduOut.innerHTML="";

    document.querySelectorAll("#educationList .entry").forEach(entry=>{
        const degree=entry.querySelector(".edu-degree").value.trim();
        const school=entry.querySelector(".edu-school").value.trim();
        const start=entry.querySelector(".edu-start").value.trim();
        const end=entry.querySelector(".edu-end").value.trim();

        if(degree || school || start || end){
            const item=document.createElement("div");
            item.className="cv-item";

            if(degree){
                const d=document.createElement("div");
                d.className="cv-item-title";
                d.textContent=degree;
                item.appendChild(d);
            }

            if(school){
                const d=document.createElement("div");
                d.className="cv-item-sub";
                d.textContent=school;
                item.appendChild(d);
            }

            if(start || end){
                const d=document.createElement("div");
                d.className="cv-date";
                d.textContent=[start,end].filter(Boolean).join(" - ");
                item.appendChild(d);
            }

            eduOut.appendChild(item);
        }
    });

    if(!eduOut.children.length){
        eduOut.innerHTML='<div class="empty cv-text">Your education will appear here.</div>';
    }

    const skills=value("skills")
        .split(",")
        .map(s=>s.trim())
        .filter(Boolean);

    const skillsOut=document.getElementById("pSkills");
    skillsOut.innerHTML="";

    if(skills.length){
        skills.forEach(skill=>{
            const el=document.createElement("span");
            el.className="skill";
            el.textContent=skill;
            skillsOut.appendChild(el);
        });
    }else{
        skillsOut.innerHTML='<span class="empty cv-text">Your skills will appear here.</span>';
    }
}

function showStatus(message){
    const box=document.getElementById("status");
    box.textContent=message;
    box.style.display="block";

    clearTimeout(window.statusTimer);
    window.statusTimer=setTimeout(()=>{
        box.style.display="none";
    },4000);
}

async function downloadPDF(){
try{updatePreview();showStatus('Creating PDF…');const pdf=new jspdf.jsPDF({unit:'pt',format:'a4'});await FTOSafety.pdfFonts(pdf);let y=50;const add=(text,size=11,bold=false)=>{text=String(text||'');if(!text.trim())return;if(bold&&y>740){pdf.addPage();y=50;}pdf.setFont('FTOSans',bold?'bold':'normal');pdf.setFontSize(size);for(const line of pdf.splitTextToSize(text,495)){if(y>785){pdf.addPage();y=50;}const rtl=/[\u0600-\u06ff]/.test(line);pdf.text(line,rtl?545:50,y,{align:rtl?'right':'left'});y+=size*1.4;}y+=6;};
pdf.setTextColor(value('template')==='modern'?30:25,value('template')==='modern'?64:25,value('template')==='modern'?175:25);add(value('fullName')||'Your Name',22,true);pdf.setTextColor(25,25,25);add(value('jobTitle'),13,true);add(['email','phone','location','website'].map(value).filter(Boolean).join(' · '),10);
const section=(label,body)=>{if(!body.trim())return;add(label,14,true);add(body);};section('Summary',value('summary'));
for(const [id,label]of [['pExperience','Experience'],['pEducation','Education']]){const items=[...document.getElementById(id).querySelectorAll('.cv-item')];if(items.length)add(label,14,true);for(const item of items){for(const node of item.children)add(node.textContent,node.classList.contains('cv-item-title')?12:11,node.classList.contains('cv-item-title'));y+=6;}}
section('Skills',value('skills'));FTOSafety.downloadBlob(pdf.output('blob'),FTOSafety.fileName(value('fullName'),'resume','.pdf'));showStatus('PDF download requested. Review text and page breaks.');}catch(e){showStatus('Cannot create PDF: '+e.message);}
}

function clearResume(){

    document.querySelectorAll(
        '#fullName,#jobTitle,#email,#phone,#location,#website,#summary,#skills'
    ).forEach(el=>el.value="");

    document.getElementById("template").value="modern";
    document.getElementById("experienceList").innerHTML="";
    document.getElementById("educationList").innerHTML="";

    addExperience();
    addEducation();

    updatePreview();
}

addExperience();
addEducation();
updatePreview();
