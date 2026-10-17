
let originalPDF = null;
let pageCount = 0;
let outputFiles = [];
let objectURLs = [];
let processing = false;

const maxFileSize = 50 * 1024 * 1024;
const maxOutputFiles = 200;

const pdfInput = document.getElementById("pdfFile");
const dropZone = document.getElementById("dropZone");
const splitValue = document.getElementById("splitValue");

pdfInput.addEventListener("change", event => {
    const file = event.target.files[0];

    if(file){
        loadPDF(file);
    }
});

dropZone.addEventListener("dragover", event => {
    event.preventDefault();

    if(processing){
        return;
    }

    dropZone.classList.add("dragover");
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

document.querySelectorAll('input[name="splitMode"]').forEach(input => {
    input.addEventListener("change", () => {
        clearResults();
        configureMode();
        updatePlan();
    });
});

splitValue.addEventListener("input", () => {
    clearResults();
    updatePlan();
});

async function loadPDF(file){
    if(processing){
        return;
    }

    clearResults();

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

    setLoadingState(true);

    document.getElementById("info").textContent =
        "Reading PDF information...";

    try{
        const bytes = await file.arrayBuffer();

        const pdf = await PDFLib.PDFDocument.load(bytes, {
            ignoreEncryption:false
        });

        const pages = pdf.getPageCount();

        if(pages < 2){
            alert(
                "This PDF contains only one page and does not need splitting."
            );

            resetAll();
            return;
        }

        originalPDF = file;
        pageCount = pages;

        document.getElementById("fileCard").style.display = "block";
        document.getElementById("fileName").textContent = file.name;

        document.getElementById("fileMeta").textContent =
            formatSize(file.size) +
            " • " +
            pageCount +
            (pageCount === 1 ? " page" : " pages");

        setModeControlsDisabled(false);

        document.getElementById("modeAfter").checked = true;

        configureMode();
        updatePlan();

        document.getElementById("info").innerHTML =
            "Ready to split" +
            "<br>Pages: " + pageCount +
            "<br>Size: " + formatSize(file.size);

    }catch(error){
        console.error("PDF read error:", error);

        alert(
            "Could not read this PDF. It may be damaged, encrypted, or unsupported."
        );

        resetAll();

    }finally{
        setLoadingState(false);
    }
}

function getMode(){
    const selected = document.querySelector(
        'input[name="splitMode"]:checked'
    );

    return selected ? selected.value : "after";
}

function configureMode(){
    if(!originalPDF){
        return;
    }

    const mode = getMode();

    if(mode === "after"){
        document.getElementById("splitControl").style.display = "block";
        document.getElementById("splitInputLabel").textContent =
            "Split after page";

        splitValue.disabled = false;
        splitValue.min = 1;
        splitValue.max = pageCount - 1;

        if(
            !Number.isInteger(Number(splitValue.value)) ||
            Number(splitValue.value) < 1 ||
            Number(splitValue.value) >= pageCount
        ){
            splitValue.value = Math.max(
                1,
                Math.floor(pageCount / 2)
            );
        }

        document.getElementById("splitHelp").textContent =
            "Choose a page from 1 to " +
            (pageCount - 1) +
            ". The document will be split after that page.";
    }

    if(mode === "every"){
        document.getElementById("splitControl").style.display = "block";
        document.getElementById("splitInputLabel").textContent =
            "Pages per file";

        splitValue.disabled = false;
        splitValue.min = 1;
        splitValue.max = pageCount;

        const current = Number(splitValue.value);

        if(
            !Number.isInteger(current) ||
            current < 1 ||
            current > pageCount
        ){
            splitValue.value = Math.min(5, pageCount);
        }

        document.getElementById("splitHelp").textContent =
            "Example: enter 5 to create a new PDF every 5 pages.";
    }

    if(mode === "single"){
        document.getElementById("splitControl").style.display = "none";
        splitValue.disabled = true;
    }
}

function buildRanges(){
    if(!originalPDF || pageCount < 2){
        return [];
    }

    const mode = getMode();

    if(mode === "after"){
        const page = Number(splitValue.value);

        if(
            !Number.isInteger(page) ||
            page < 1 ||
            page >= pageCount
        ){
            return [];
        }

        return [
            [1, page],
            [page + 1, pageCount]
        ];
    }

    if(mode === "every"){
        const amount = Number(splitValue.value);

        if(
            !Number.isInteger(amount) ||
            amount < 1 ||
            amount > pageCount
        ){
            return [];
        }

        const ranges = [];

        for(let start = 1; start <= pageCount; start += amount){
            const end = Math.min(
                start + amount - 1,
                pageCount
            );

            ranges.push([start, end]);
        }

        return ranges;
    }

    if(mode === "single"){
        return Array.from(
            {length:pageCount},
            (_, index) => [index + 1, index + 1]
        );
    }

    return [];
}

function updatePlan(){
    if(!originalPDF){
        hidePlan();
        return;
    }

    const ranges = buildRanges();
    const splitBtn = document.getElementById("splitBtn");

    if(ranges.length === 0){
        hidePlan();
        splitBtn.disabled = true;
        return;
    }

    document.getElementById("planBox").style.display = "block";

    document.getElementById("planSummary").textContent =
        "Output: " +
        ranges.length +
        (ranges.length === 1 ? " PDF file" : " PDF files");

    const previewLimit = 12;

    const preview = ranges
        .slice(0, previewLimit)
        .map(range => formatRange(range[0], range[1]))
        .join(", ");

    document.getElementById("planRanges").textContent =
        "Pages: " +
        preview +
        (
            ranges.length > previewLimit
                ? " ... +" + (ranges.length - previewLimit) + " more"
                : ""
        );

    if(ranges.length > maxOutputFiles){
        splitBtn.disabled = true;

        document.getElementById("info").innerHTML =
            "This setting would create " +
            ranges.length +
            " files.<br>" +
            "For reliable mobile performance, the maximum is " +
            maxOutputFiles +
            " output files.";
    }else{
        splitBtn.disabled = false;

        if(!processing){
            document.getElementById("info").innerHTML =
                "Ready to split" +
                "<br>Pages: " + pageCount +
                "<br>Size: " + formatSize(originalPDF.size);
        }
    }
}

async function splitPDF(){
    if(!originalPDF || processing){
        return;
    }

    const ranges = buildRanges();

    if(ranges.length === 0){
        alert("Please enter a valid split setting.");
        return;
    }

    if(ranges.length > maxOutputFiles){
        alert(
            "This setting would create too many files. Maximum: " +
            maxOutputFiles
        );
        return;
    }

    clearResults();

    processing = true;
    setProcessingUI(true);

    const splitBtn = document.getElementById("splitBtn");

    splitBtn.disabled = true;
    splitBtn.textContent = "Splitting...";

    showProgress(0, "Preparing PDF...");

    try{
        const sourceBytes = await originalPDF.arrayBuffer();

        const sourcePDF = await PDFLib.PDFDocument.load(
            sourceBytes,
            {ignoreEncryption:false}
        );

        const baseName =
            originalPDF.name.replace(/\.pdf$/i, "") ||
            "document";

        const numberWidth = Math.max(
            2,
            String(ranges.length).length
        );

        for(let i = 0; i < ranges.length; i++){
            const [startPage, endPage] = ranges[i];

            const outputPDF =
                await PDFLib.PDFDocument.create();

            const indices = Array.from(
                {length:endPage - startPage + 1},
                (_, index) => startPage - 1 + index
            );

            const copiedPages =
                await outputPDF.copyPages(
                    sourcePDF,
                    indices
                );

            copiedPages.forEach(page => {
                outputPDF.addPage(page);
            });

            const outputBytes =
                await outputPDF.save();

            const blob = new Blob(
                [outputBytes],
                {type:"application/pdf"}
            );

            const fileName = createOutputName(
                baseName,
                i + 1,
                numberWidth,
                startPage,
                endPage,
                ranges.length
            );

            outputFiles.push({
                blob,
                fileName,
                startPage,
                endPage
            });

            const percent =
                Math.round(
                    ((i + 1) / ranges.length) * 100
                );

            showProgress(
                percent,
                "Creating file " +
                (i + 1) +
                " of " +
                ranges.length
            );

            await allowBrowserPaint();
        }

        renderResults();

        splitBtn.disabled = true;
        splitBtn.textContent = "Completed";

        showProgress(
            100,
            "Completed - " +
            outputFiles.length +
            (outputFiles.length === 1
                ? " file created"
                : " files created")
        );

        const totalOutputSize =
            outputFiles.reduce(
                (sum, item) => sum + item.blob.size,
                0
            );

        document.getElementById("info").innerHTML =
            "Split Successfully" +
            "<br>Output Files: " + outputFiles.length +
            "<br>Total Output Size: " +
            formatSize(totalOutputSize);

    }catch(error){
        console.error("PDF split error:", error);

        clearResults();

        splitBtn.disabled = false;
        splitBtn.textContent = "Split PDF";

        hideProgress();

        document.getElementById("info").innerHTML =
            "Could not split this PDF.<br>" +
            "The file may be damaged, encrypted, or unsupported.";

    }finally{
        processing = false;
        setProcessingUI(false);
    }
}

function createOutputName(
    baseName,
    partNumber,
    numberWidth,
    startPage,
    endPage,
    totalParts
){
    const paddedPart =
        String(partNumber).padStart(numberWidth, "0");

    if(startPage === endPage){
        const pageWidth =
            Math.max(2, String(pageCount).length);

        return (
            baseName +
            "-page-" +
            String(startPage).padStart(pageWidth, "0") +
            ".pdf"
        );
    }

    if(totalParts === 2 && getMode() === "after"){
        return (
            baseName +
            "-part-" +
            paddedPart +
            "-pages-" +
            startPage +
            "-" +
            endPage +
            ".pdf"
        );
    }

    return (
        baseName +
        "-part-" +
        paddedPart +
        "-pages-" +
        startPage +
        "-" +
        endPage +
        ".pdf"
    );
}

function renderResults(){
    const results = document.getElementById("results");
    results.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "Split Results";
    results.appendChild(heading);

    outputFiles.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "result-card";

        const details = document.createElement("div");
        details.className = "result-details";

        const name = document.createElement("div");
        name.className = "result-name";
        name.textContent = item.fileName;

        const meta = document.createElement("div");
        meta.className = "result-meta";

        const pagesText =
            item.startPage === item.endPage
                ? "Page " + item.startPage
                : "Pages " +
                  item.startPage +
                  "-" +
                  item.endPage;

        meta.textContent =
            pagesText +
            " • " +
            formatSize(item.blob.size);

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Download";
        button.onclick = () => downloadOutput(index);

        details.appendChild(name);
        details.appendChild(meta);

        card.appendChild(details);
        card.appendChild(button);

        results.appendChild(card);
    });
}

function downloadOutput(index){
    const item = outputFiles[index];

    if(!item){
        return;
    }

    const url = URL.createObjectURL(item.blob);
    objectURLs.push(url);

    const link = document.createElement("a");
    link.href = url;
    link.download = item.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const successBox =
        document.getElementById("downloadSuccess");

    successBox.textContent =
        "✓ " + item.fileName + " downloaded successfully.";

    successBox.style.display = "block";

    clearTimeout(window.splitDownloadSuccessTimer);

    window.splitDownloadSuccessTimer =
        setTimeout(() => {
            successBox.style.display = "none";
        }, 4000);

    setTimeout(() => {
        URL.revokeObjectURL(url);

        objectURLs =
            objectURLs.filter(itemURL => itemURL !== url);
    }, 1500);
}

function clearResults(){
    const successBox =
        document.getElementById("downloadSuccess");

    if(successBox){
        successBox.style.display = "none";
    }

    outputFiles = [];

    objectURLs.forEach(url => {
        URL.revokeObjectURL(url);
    });

    objectURLs = [];

    document.getElementById("results").innerHTML = "";

    const splitBtn = document.getElementById("splitBtn");

    if(originalPDF && !processing){
        splitBtn.textContent = "Split PDF";
    }

    hideProgress();
}

function clearPDF(){
    if(processing){
        return;
    }

    resetAll();
}

function resetAll(){
    originalPDF = null;
    pageCount = 0;
    processing = false;

    clearResults();

    pdfInput.value = "";

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("fileName").textContent = "";
    document.getElementById("fileMeta").textContent = "";

    document.getElementById("modeAfter").checked = true;

    setModeControlsDisabled(true);

    splitValue.value = "";
    splitValue.disabled = true;
    splitValue.removeAttribute("max");
    splitValue.placeholder = "Select a PDF first";

    document.getElementById("splitControl").style.display =
        "block";

    document.getElementById("splitInputLabel").textContent =
        "Split after page";

    document.getElementById("splitHelp").textContent =
        "Choose a PDF to configure splitting.";

    document.getElementById("splitBtn").disabled = true;
    document.getElementById("splitBtn").textContent =
        "Split PDF";

    document.getElementById("info").textContent = "";

    hidePlan();
    hideProgress();
}

function setModeControlsDisabled(disabled){
    document
        .querySelectorAll('input[name="splitMode"]')
        .forEach(input => {
            input.disabled = disabled;
        });
}

function setLoadingState(isLoading){
    pdfInput.disabled = isLoading;

    if(isLoading){
        document.getElementById("splitBtn").disabled = true;
    }
}

function setProcessingUI(isProcessing){
    pdfInput.disabled = isProcessing;
    splitValue.disabled =
        isProcessing ||
        getMode() === "single";

    setModeControlsDisabled(isProcessing);

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

    document.getElementById("planRanges").textContent =
        "";
}

function formatRange(start, end){
    if(start === end){
        return String(start);
    }

    return start + "-" + end;
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
