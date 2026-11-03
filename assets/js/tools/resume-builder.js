
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


async function downloadPDF() {
    const button = document.querySelector(".actions .primary");
    const originalText = button ? button.textContent : "Download PDF";

    try {
        updatePreview();

        const fullName = value("fullName");

        if (!fullName) {
            document.getElementById("fullName").focus();
            throw Error("Enter your full name before downloading.");
        }

        const api = window.jspdf ||
            (typeof jspdf !== "undefined" ? jspdf : null);

        if (!api || typeof api.jsPDF !== "function") {
            throw Error("PDF library unavailable. Reload and try again.");
        }

        const safety = window.FTOSafety;

        if (!safety || !safety.pdfFonts || !safety.downloadBlob) {
            throw Error("PDF engine unavailable. Reload and try again.");
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Creating PDF...";
        }

        showStatus("Preparing your resume PDF...");

        const pdf = new api.jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
            compress: true
        });

        await safety.pdfFonts(pdf);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 48;
        const contentWidth = pageWidth - margin * 2;
        const bottom = pageHeight - margin;

        const template = value("template");

        const accents = {
            modern: [30, 58, 95],
            classic: [31, 41, 55],
            minimal: [71, 85, 105]
        };

        const accent = accents[template] || accents.modern;

        let y = margin;

        function newPage() {
            pdf.addPage();
            y = margin;

            pdf.setFont("FTOSans", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(120, 130, 145);
            pdf.text(fullName + " | Resume", margin, 28);

            pdf.setDrawColor(220, 225, 232);
            pdf.line(margin, 36, pageWidth - margin, 36);

            y = margin + 8;
        }

        function addText(text, options = {}) {
            const content = String(text ?? "")
                .replace(/\r\n?/g, "\n")
                .trim();

            if (!content) return;

            const size = options.size || 10;
            const bold = options.bold || false;
            const indent = options.indent || 0;
            const after = options.after ?? 5;
            const color = options.color || [55, 65, 81];

            const lines = pdf.splitTextToSize(
                content,
                contentWidth - indent
            );

            const lineHeight = size * 1.45;

            for (const line of lines) {
                if (y + lineHeight > bottom) {
                    newPage();
                }

                pdf.setFont(
                    "FTOSans",
                    bold ? "bold" : "normal"
                );

                pdf.setFontSize(size);
                pdf.setTextColor(...color);

                pdf.text(line, margin + indent, y);
                y += lineHeight;
            }

            y += after;
        }

        function addSection(title) {
            y += 8;

            if (y + 32 > bottom) {
                newPage();
            }

            pdf.setFont("FTOSans", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(...accent);

            pdf.text(title.toUpperCase(), margin, y);

            y += 7;

            pdf.setDrawColor(...accent);
            pdf.setLineWidth(1);
            pdf.line(margin, y, pageWidth - margin, y);

            y += 15;
        }

        // Resume header
        pdf.setFillColor(...accent);
        pdf.rect(0, 0, pageWidth, 7, "F");

        addText(fullName, {
            size: 25,
            bold: true,
            color: accent,
            after: 5
        });

        addText(value("jobTitle"), {
            size: 13,
            bold: true,
            after: 7
        });

        const contact = [
            value("email"),
            value("phone"),
            value("location"),
            value("website")
        ].filter(Boolean);

        if (contact.length) {
            addText(contact.join(" | "), {
                size: 9,
                color: [90, 100, 115],
                after: 10
            });
        }

        pdf.setDrawColor(210, 215, 225);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 12;

        // Professional summary
        const summary = value("summary");

        if (summary) {
            addSection("Professional Summary");
            addText(summary);
        }

        // Work experience
        const experiences = [
            ...document.querySelectorAll("#experienceList .entry")
        ];

        const experienceData = experiences.map(entry => ({
            role: entry.querySelector(".exp-role").value.trim(),
            company: entry.querySelector(".exp-company").value.trim(),
            start: entry.querySelector(".exp-start").value.trim(),
            end: entry.querySelector(".exp-end").value.trim(),
            description: entry.querySelector(".exp-desc").value.trim()
        })).filter(item =>
            item.role || item.company || item.start ||
            item.end || item.description
        );

        if (experienceData.length) {
            addSection("Work Experience");

            for (const item of experienceData) {
                addText(
                    [item.role, item.company]
                        .filter(Boolean)
                        .join(" | "),
                    {
                        size: 11,
                        bold: true,
                        color: [35, 45, 60],
                        after: 3
                    }
                );

                const dates = [item.start, item.end]
                    .filter(Boolean)
                    .join(" - ");

                if (dates) {
                    addText(dates, {
                        size: 9,
                        color: [105, 115, 130],
                        after: 4
                    });
                }

                if (item.description) {
                    addText(item.description, {
                        size: 9,
                        indent: 10,
                        after: 12
                    });
                } else {
                    y += 8;
                }
            }
        }

        // Education
        const education = [
            ...document.querySelectorAll("#educationList .entry")
        ];

        const educationData = education.map(entry => ({
            degree: entry.querySelector(".edu-degree").value.trim(),
            school: entry.querySelector(".edu-school").value.trim(),
            start: entry.querySelector(".edu-start").value.trim(),
            end: entry.querySelector(".edu-end").value.trim()
        })).filter(item =>
            item.degree || item.school || item.start || item.end
        );

        if (educationData.length) {
            addSection("Education");

            for (const item of educationData) {
                addText(
                    [item.degree, item.school]
                        .filter(Boolean)
                        .join(" | "),
                    {
                        size: 11,
                        bold: true,
                        after: 3
                    }
                );

                const dates = [item.start, item.end]
                    .filter(Boolean)
                    .join(" - ");

                if (dates) {
                    addText(dates, {
                        size: 9,
                        color: [105, 115, 130],
                        after: 10
                    });
                }
            }
        }

        // Skills
        const skills = value("skills")
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean);

        if (skills.length) {
            addSection("Skills");
            addText(skills.join("  | "), {
                size: 10,
                after: 8
            });
        }

        // Page numbers
        const totalPages = pdf.internal.getNumberOfPages();

        for (let page = 1; page <= totalPages; page++) {
            pdf.setPage(page);
            pdf.setFont("FTOSans", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(130, 140, 150);

            pdf.text(
                "Page " + page + " of " + totalPages,
                pageWidth - margin,
                pageHeight - 24,
                { align: "right" }
            );
        }

        const filename = safety.fileName
            ? safety.fileName(fullName, "resume", ".pdf")
            : "resume.pdf";

        safety.downloadBlob(pdf.output("blob"), filename);

        showStatus("PDF created successfully. Review your downloaded resume.");

    } catch (error) {
        showStatus("Cannot create PDF: " + error.message);

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
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
