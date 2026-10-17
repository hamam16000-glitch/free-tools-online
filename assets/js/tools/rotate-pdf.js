
let originalFile = null;
let pageCount = 0;
let rotatedPDF = null;
let rotatedFileName = "";
let downloadURL = null;
let processing = false;

const maxFileSize = 50 * 1024 * 1024;

const pdfInput = document.getElementById("pdfFile");
const dropZone = document.getElementById("dropZone");
const pageRange = document.getElementById("pageRange");

pdfInput.addEventListener("change", event => {
    const file = event.target.files[0];

    if(file){
        loadPDF(file);
    }
});

dropZone.addEventListener("dragover", event => {
    event.preventDefault();

    if(!processing){
        dropZone.classList.add("dragover");
    }
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");

    if(processing){
        return;
    }

    const file = event.dataTransfer.files[0];

    if(file){
        loadPDF(file);
    }
});

document
    .querySelectorAll('input[name="pageMode"]')
    .forEach(input => {
        input.addEventListener("change", () => {
            invalidateOutput();

            const custom =
                getPageMode() === "custom";

            document.getElementById("rangeBlock").style.display =
                custom ? "block" : "none";

            pageRange.disabled =
                processing || !originalFile || !custom;

            updatePlan();
        });
    });

document
    .querySelectorAll('input[name="rotationAngle"]')
    .forEach(input => {
        input.addEventListener("change", () => {
            invalidateOutput();
            updatePlan();
        });
    });

pageRange.addEventListener("input", () => {
    invalidateOutput();
    updatePlan();
});

async function loadPDF(file){
    if(processing){
        return;
    }

    invalidateOutput();

    const isPDF =
        file.type === "application/pdf" ||
        /\.pdf$/i.test(file.name);

    if(!isPDF){
        alert("Please select a PDF file only.");
        resetAll();
        return;
    }

    if(file.size > maxFileSize){
        alert("PDF is too large. Maximum file size is 50 MB.");
        resetAll();
        return;
    }

    document.getElementById("info").textContent =
        "Reading PDF information...";

    pdfInput.disabled = true;

    try{
        const bytes = await file.arrayBuffer();

        const pdf =
            await PDFLib.PDFDocument.load(
                bytes,
                {ignoreEncryption:false}
            );

        pageCount = pdf.getPageCount();

        if(pageCount < 1){
            throw new Error("PDF contains no pages.");
        }

        originalFile = file;

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileName").textContent =
            file.name;

        document.getElementById("fileMeta").textContent =
            formatSize(file.size) +
            " • " +
            pageCount +
            (pageCount === 1 ? " page" : " pages");

        document.getElementById("modeAll").checked = true;
        document.getElementById("rotateRight").checked = true;

        pageRange.value = "";
        pageRange.placeholder =
            "Example: 1-3, 5, " + pageCount;

        document.getElementById("rangeBlock").style.display =
            "none";

        setControlsDisabled(false);

        updatePlan();

        document.getElementById("info").innerHTML =
            "Ready to rotate" +
            "<br>Pages: " + pageCount +
            "<br>Size: " + formatSize(file.size);

    }catch(error){
        console.error("PDF read error:", error);

        alert(
            "Could not read this PDF. It may be damaged, encrypted, or unsupported."
        );

        resetAll();

    }finally{
        pdfInput.disabled = false;
    }
}

function getPageMode(){
    const selected =
        document.querySelector(
            'input[name="pageMode"]:checked'
        );

    return selected ? selected.value : "all";
}

function getRotationAmount(){
    const selected =
        document.querySelector(
            'input[name="rotationAngle"]:checked'
        );

    return selected
        ? Number(selected.value)
        : 90;
}

function getSelectedPages(){
    if(!originalFile || pageCount < 1){
        return [];
    }

    if(getPageMode() === "all"){
        return Array.from(
            {length:pageCount},
            (_, index) => index + 1
        );
    }

    return parsePageRange(pageRange.value);
}

function parsePageRange(value){
    const text = value.trim();

    if(!text){
        return [];
    }

    const pages = new Set();

    for(const rawPart of text.split(",")){
        const part = rawPart.trim();

        if(!part){
            continue;
        }

        if(/^\d+$/.test(part)){
            const page = Number(part);

            if(page < 1 || page > pageCount){
                return [];
            }

            pages.add(page);
            continue;
        }

        const match =
            part.match(/^(\d+)\s*-\s*(\d+)$/);

        if(!match){
            return [];
        }

        const start = Number(match[1]);
        const end = Number(match[2]);

        if(
            start < 1 ||
            end < 1 ||
            start > pageCount ||
            end > pageCount ||
            start > end
        ){
            return [];
        }

        for(let page = start; page <= end; page++){
            pages.add(page);
        }
    }

    return Array.from(pages).sort((a,b) => a - b);
}

function updatePlan(){
    if(!originalFile){
        hidePlan();
        return;
    }

    const pages = getSelectedPages();
    const rotateBtn =
        document.getElementById("rotateBtn");

    if(pages.length === 0){
        rotateBtn.disabled = true;

        document.getElementById("planBox").style.display =
            "block";

        document.getElementById("planSummary").textContent =
            "Enter a valid page range between 1 and " +
            pageCount +
            ".";

        document.getElementById("planPages").textContent =
            "";

        document.getElementById("info").innerHTML =
            "Enter valid pages to continue" +
            "<br>Available pages: 1-" +
            pageCount;

        return;
    }

    const angle = getRotationAmount();

    document.getElementById("planBox").style.display =
        "block";

    document.getElementById("planSummary").textContent =
        "Rotate " +
        pages.length +
        (pages.length === 1 ? " page" : " pages") +
        " by " +
        formatRotation(angle);

    const previewLimit = 20;

    const preview =
        pages.slice(0, previewLimit).join(", ");

    document.getElementById("planPages").textContent =
        "Pages: " +
        preview +
        (
            pages.length > previewLimit
                ? " ... +" +
                  (pages.length - previewLimit) +
                  " more"
                : ""
        );

    rotateBtn.disabled = false;

    if(!processing){
        document.getElementById("info").innerHTML =
            "Ready to rotate" +
            "<br>Pages: " + pageCount +
            "<br>Size: " +
            formatSize(originalFile.size);
    }
}

async function rotatePDF(){
    if(
        !originalFile ||
        processing
    ){
        return;
    }

    const selectedPages =
        getSelectedPages();

    if(selectedPages.length === 0){
        alert("Please select valid PDF pages.");
        return;
    }

    invalidateOutput();

    processing = true;
    setProcessingState(true);

    const rotateBtn =
        document.getElementById("rotateBtn");

    rotateBtn.disabled = true;
    rotateBtn.textContent = "Rotating...";

    showProgress(
        0,
        "Reading PDF..."
    );

    try{
        const bytes =
            await originalFile.arrayBuffer();

        const pdf =
            await PDFLib.PDFDocument.load(
                bytes,
                {ignoreEncryption:false}
            );

        const pages = pdf.getPages();
        const amount =
            getRotationAmount();

        for(
            let index = 0;
            index < selectedPages.length;
            index++
        ){
            const pageNumber =
                selectedPages[index];

            const page =
                pages[pageNumber - 1];

            const currentRotation =
                normalizeRotation(
                    page.getRotation().angle
                );

            const newRotation =
                normalizeRotation(
                    currentRotation + amount
                );

            page.setRotation(
                PDFLib.degrees(newRotation)
            );

            const percent =
                Math.round(
                    ((index + 1) /
                    selectedPages.length) *
                    90
                );

            showProgress(
                percent,
                "Rotating page " +
                pageNumber +
                " (" +
                (index + 1) +
                " of " +
                selectedPages.length +
                ")"
            );

            await allowBrowserPaint();
        }

        showProgress(
            95,
            "Creating PDF..."
        );

        const output =
            await pdf.save();

        rotatedPDF =
            new Blob(
                [output],
                {type:"application/pdf"}
            );

        const baseName =
            originalFile.name.replace(
                /\.pdf$/i,
                ""
            ) || "document";

        rotatedFileName =
            baseName + "-rotated.pdf";

        document.getElementById("downloadBtn").disabled =
            false;

        rotateBtn.disabled = true;
        rotateBtn.textContent = "Rotated";

        showProgress(
            100,
            "Completed"
        );

        document.getElementById("info").innerHTML =
            "Rotation Successful" +
            "<br>Rotated Pages: " +
            selectedPages.length +
            "<br>Rotation: " +
            formatRotation(amount) +
            "<br>Output Size: " +
            formatSize(rotatedPDF.size);

    }catch(error){
        console.error("PDF rotation error:", error);

        rotatedPDF = null;

        document.getElementById("downloadBtn").disabled =
            true;

        rotateBtn.disabled = false;
        rotateBtn.textContent = "Rotate PDF";

        hideProgress();

        document.getElementById("info").innerHTML =
            "Could not rotate this PDF.<br>" +
            "The file may be damaged, encrypted, or unsupported.";

    }finally{
        processing = false;
        setProcessingState(false);
    }
}

function normalizeRotation(angle){
    return ((angle % 360) + 360) % 360;
}

function formatRotation(angle){
    if(angle === 90){
        return "90° Right";
    }

    if(angle === 270){
        return "90° Left";
    }

    return "180°";
}

function downloadPDF(){
    if(!rotatedPDF){
        alert("Please rotate the PDF first.");
        return;
    }

    revokeDownloadURL();

    downloadURL =
        URL.createObjectURL(rotatedPDF);

    const link =
        document.createElement("a");

    link.href = downloadURL;
    link.download = rotatedFileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const successBox =
        document.getElementById("downloadSuccess");

    successBox.style.display = "block";

    clearTimeout(window.rotatePDFSuccessTimer);

    window.rotatePDFSuccessTimer =
        setTimeout(() => {
            successBox.style.display = "none";
        },4000);

    setTimeout(
        revokeDownloadURL,
        1500
    );
}

function invalidateOutput(){
    document.getElementById("downloadSuccess").style.display =
        "none";

    rotatedPDF = null;
    rotatedFileName = "";

    revokeDownloadURL();

    document.getElementById("downloadBtn").disabled =
        true;

    const rotateBtn =
        document.getElementById("rotateBtn");

    if(
        originalFile &&
        !processing
    ){
        rotateBtn.textContent = "Rotate PDF";
    }

    hideProgress();
}

function setControlsDisabled(disabled){
    document
        .querySelectorAll(
            'input[name="pageMode"], input[name="rotationAngle"]'
        )
        .forEach(input => {
            input.disabled = disabled;
        });

    pageRange.disabled =
        disabled ||
        getPageMode() !== "custom";
}

function setProcessingState(isProcessing){
    pdfInput.disabled = isProcessing;

    document
        .querySelectorAll(
            'input[name="pageMode"], input[name="rotationAngle"]'
        )
        .forEach(input => {
            input.disabled = isProcessing;
        });

    pageRange.disabled =
        isProcessing ||
        getPageMode() !== "custom";

    document.getElementById("clearBtn").disabled =
        isProcessing;
}

function showProgress(percent, message){
    document.getElementById("progressWrap").style.display =
        "block";

    document.getElementById("progressBar").style.width =
        percent + "%";

    document.getElementById("progressText").textContent =
        message;
}

function hideProgress(){
    document.getElementById("progressWrap").style.display =
        "none";

    document.getElementById("progressBar").style.width =
        "0%";

    document.getElementById("progressText").textContent =
        "";
}

function hidePlan(){
    document.getElementById("planBox").style.display =
        "none";

    document.getElementById("planSummary").textContent =
        "";

    document.getElementById("planPages").textContent =
        "";
}

function clearAll(){
    if(processing){
        return;
    }

    resetAll();
}

function resetAll(){
    document.getElementById("downloadSuccess").style.display =
        "none";

    originalFile = null;
    pageCount = 0;
    rotatedPDF = null;
    rotatedFileName = "";
    processing = false;

    revokeDownloadURL();

    pdfInput.value = "";

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("fileName").textContent =
        "";

    document.getElementById("fileMeta").textContent =
        "";

    document.getElementById("modeAll").checked = true;
    document.getElementById("rotateRight").checked = true;

    document.getElementById("rangeBlock").style.display =
        "none";

    pageRange.value = "";

    setControlsDisabled(true);

    document.getElementById("rotateBtn").disabled = true;
    document.getElementById("rotateBtn").textContent =
        "Rotate PDF";

    document.getElementById("downloadBtn").disabled =
        true;

    document.getElementById("info").textContent =
        "";

    hidePlan();
    hideProgress();
}

function revokeDownloadURL(){
    if(downloadURL){
        URL.revokeObjectURL(downloadURL);
        downloadURL = null;
    }
}

function formatSize(bytes){
    if(bytes >= 1024 * 1024){
        return (
            bytes / (1024 * 1024)
        ).toFixed(2) + " MB";
    }

    if(bytes >= 1024){
        return Math.round(bytes / 1024) + " KB";
    }

    return bytes + " B";
}

function allowBrowserPaint(){
    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
}
