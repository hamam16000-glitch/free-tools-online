
pdfjsLib.GlobalWorkerOptions.workerSrc =
"../vendor/pdfjs/pdf.worker.min.js";

let originalFile = null;
let pdfPreviewDocument = null;
let pageCount = 0;
let selectedPages = new Set();
let outputPDF = null;
let outputFileName = "";
let processing = false;
let downloadURL = null;
let pageObserver = null;

const maxFileSize = 50 * 1024 * 1024;
const maxPreviewPages = 200;

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
    .querySelectorAll('input[name="actionMode"]')
    .forEach(input => {
        input.addEventListener("change", () => {
            invalidateOutput();
            updateActionUI();
            updateState();
        });
    });

pageRange.addEventListener("input", () => {
    if(!originalFile || processing){
        return;
    }

    const result = parsePageRange(pageRange.value);

    if(result.valid){
        selectedPages = new Set(result.pages);
        updatePageSelectionVisuals();
    }

    invalidateOutput();
    updateState();
});

async function loadPDF(file){
    if(processing){
        return;
    }

    resetDocumentState();

    const isPDF =
        file.type === "application/pdf" ||
        /\.pdf$/i.test(file.name);

    if(!isPDF){
        alert("Please select a PDF file only.");
        return;
    }

    if(file.size > maxFileSize){
        alert("PDF is too large. Maximum file size is 50 MB.");
        return;
    }

    document.getElementById("info").textContent =
        "Reading PDF information...";

    pdfInput.disabled = true;

    try{
        const bytes = await file.arrayBuffer();

        const previewPDF =
            await pdfjsLib.getDocument(FTOSafety.pdfOptions({
                data:bytes.slice(0)
            })).promise;

        const validationPDF =
            await PDFLib.PDFDocument.load(
                bytes.slice(0),
                {ignoreEncryption:false}
            );

        pageCount = validationPDF.getPageCount();

        if(
            pageCount < 1 ||
            pageCount !== previewPDF.numPages
        ){
            throw new Error("Could not validate PDF pages.");
        }

        originalFile = file;
        pdfPreviewDocument = previewPDF;

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileName").textContent =
            file.name;

        document.getElementById("fileMeta").textContent =
            formatSize(file.size) +
            " • " +
            pageCount +
            (pageCount === 1 ? " page" : " pages");

        document.getElementById("modeExtract").checked = true;

        selectedPages.clear();
        pageRange.value = "";

        setControlsDisabled(false);
        updateActionUI();
        buildPageGrid();
        updateState();

        document.getElementById("info").innerHTML =
            "Ready" +
            "<br>Select the pages you want to extract.";

    }catch(error){
        console.error("PDF read error:", error);

        alert(
            "Could not read this PDF. It may be damaged, encrypted, or unsupported."
        );

        resetDocumentState();

    }finally{
        pdfInput.disabled = false;
    }
}

function getActionMode(){
    const selected =
        document.querySelector(
            'input[name="actionMode"]:checked'
        );

    return selected
        ? selected.value
        : "extract";
}

function updateActionUI(){
    const mode = getActionMode();

    document.getElementById("processBtn").textContent =
        mode === "extract"
        ? "Extract Pages"
        : "Delete Pages";
}

function parsePageRange(value){
    const text = value.trim();

    if(!text){
        return {
            valid:true,
            pages:[]
        };
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
                return {
                    valid:false,
                    pages:[]
                };
            }

            pages.add(page);
            continue;
        }

        const match =
            part.match(/^(\d+)\s*-\s*(\d+)$/);

        if(!match){
            return {
                valid:false,
                pages:[]
            };
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
            return {
                valid:false,
                pages:[]
            };
        }

        for(let page = start; page <= end; page++){
            pages.add(page);
        }
    }

    return {
        valid:true,
        pages:Array.from(pages).sort((a,b) => a-b)
    };
}

function buildPageGrid(){
    const grid = document.getElementById("pagesGrid");
    grid.innerHTML = "";

    if(pageObserver){
        pageObserver.disconnect();
    }

    pageObserver = new (window.IntersectionObserver || class{observe(){} unobserve(){} disconnect(){}})(
        entries => {
            entries.forEach(entry => {
                if(entry.isIntersecting){
                    const card = entry.target;

                    if(!card.dataset.rendered){
                        card.dataset.rendered = "1";

                        renderThumbnail(
                            Number(card.dataset.page),
                            card
                        );
                    }

                    pageObserver.unobserve(card);
                }
            });
        },
        {
            rootMargin:"250px"
        }
    );

    const previewCount =
        Math.min(pageCount, maxPreviewPages);

    for(let page = 1; page <= previewCount; page++){
        const card = document.createElement("div");
        card.className = "page-card";
        card.dataset.page = String(page);

        const check = document.createElement("div");
        check.className = "check-mark";
        check.textContent = "✓";

        const preview = document.createElement("div");
        preview.className = "page-preview";

        const loading = document.createElement("div");
        loading.className = "page-loading";
        loading.textContent = "Loading...";

        preview.appendChild(loading);

        const number = document.createElement("div");
        number.className = "page-number";
        number.textContent = "Page " + page;

        card.appendChild(check);
        card.appendChild(preview);
        card.appendChild(number);

        card.addEventListener("click", () => {
            togglePage(page);
        });

        grid.appendChild(card);
        pageObserver.observe(card);
    }

    if(pageCount > maxPreviewPages){
        const note = document.createElement("div");
        note.style.gridColumn = "1 / -1";
        note.style.padding = "12px";
        note.style.textAlign = "center";
        note.style.opacity = ".7";

        note.textContent =
            "Preview shows the first " +
            maxPreviewPages +
            " pages. You can still select later pages using the page range field.";

        grid.appendChild(note);
    }
}

async function renderThumbnail(pageNumber, card){
    if(!pdfPreviewDocument){
        return;
    }

    try{
        const page =
            await pdfPreviewDocument.getPage(pageNumber);

        const viewport =
            page.getViewport({scale:.28});

        const canvas =
            document.createElement("canvas");

        const context =
            canvas.getContext("2d");

        canvas.width =
            Math.ceil(viewport.width);

        canvas.height =
            Math.ceil(viewport.height);

        await page.render({
            canvasContext:context,
            viewport
        }).promise;

        const preview =
            card.querySelector(".page-preview");

        preview.innerHTML = "";
        preview.appendChild(canvas);

    }catch(error){
        console.error(
            "Thumbnail error for page",
            pageNumber,
            error
        );

        const preview =
            card.querySelector(".page-preview");

        preview.textContent = "Preview unavailable";
    }
}

function togglePage(page){
    if(processing){
        return;
    }

    if(selectedPages.has(page)){
        selectedPages.delete(page);
    }else{
        selectedPages.add(page);
    }

    syncRangeFromSelection();
    updatePageSelectionVisuals();
    invalidateOutput();
    updateState();
}

function selectAllPages(){
    if(!originalFile || processing){
        return;
    }

    selectedPages =
        new Set(
            Array.from(
                {length:pageCount},
                (_, index) => index + 1
            )
        );

    syncRangeFromSelection();
    updatePageSelectionVisuals();
    invalidateOutput();
    updateState();
}

function clearSelection(){
    if(processing){
        return;
    }

    selectedPages.clear();

    syncRangeFromSelection();
    updatePageSelectionVisuals();
    invalidateOutput();
    updateState();
}

function invertSelection(){
    if(!originalFile || processing){
        return;
    }

    const inverted = new Set();

    for(let page = 1; page <= pageCount; page++){
        if(!selectedPages.has(page)){
            inverted.add(page);
        }
    }

    selectedPages = inverted;

    syncRangeFromSelection();
    updatePageSelectionVisuals();
    invalidateOutput();
    updateState();
}

function syncRangeFromSelection(){
    const sorted =
        Array.from(selectedPages).sort((a,b) => a-b);

    pageRange.value =
        compressPageNumbers(sorted);
}

function compressPageNumbers(pages){
    if(!pages.length){
        return "";
    }

    const parts = [];
    let start = pages[0];
    let previous = pages[0];

    for(let index = 1; index <= pages.length; index++){
        const current = pages[index];

        if(current === previous + 1){
            previous = current;
            continue;
        }

        if(start === previous){
            parts.push(String(start));
        }else{
            parts.push(start + "-" + previous);
        }

        start = current;
        previous = current;
    }

    return parts.join(", ");
}

function updatePageSelectionVisuals(){
    document
        .querySelectorAll(".page-card")
        .forEach(card => {
            const page =
                Number(card.dataset.page);

            card.classList.toggle(
                "selected",
                selectedPages.has(page)
            );
        });
}

function updateState(){
    if(!originalFile){
        return;
    }

    const parseResult =
        parsePageRange(pageRange.value);

    const mode = getActionMode();
    const selectedCount = selectedPages.size;
    const processBtn =
        document.getElementById("processBtn");

    document.getElementById("selectionSummary").style.display =
        "block";

    document.getElementById("selectionSummary").innerHTML =
        "Selected: " +
        selectedCount +
        (selectedCount === 1 ? " page" : " pages") +
        "<br>Total PDF pages: " +
        pageCount;

    if(!parseResult.valid){
        processBtn.disabled = true;

        document.getElementById("planBox").style.display =
            "block";

        document.getElementById("planBox").textContent =
            "Enter a valid page range between 1 and " +
            pageCount +
            ".";

        document.getElementById("info").textContent =
            "Invalid page range.";

        return;
    }

    if(selectedCount === 0){
        processBtn.disabled = true;

        document.getElementById("planBox").style.display =
            "none";

        document.getElementById("info").textContent =
            "Select at least one page.";

        return;
    }

    if(
        mode === "delete" &&
        selectedCount === pageCount
    ){
        processBtn.disabled = true;

        document.getElementById("planBox").style.display =
            "block";

        document.getElementById("planBox").innerHTML =
            "You cannot delete every page.<br>" +
            "At least one page must remain.";

        document.getElementById("info").textContent =
            "Select fewer pages to delete.";

        return;
    }

    const outputPages =
        mode === "extract"
        ? selectedCount
        : pageCount - selectedCount;

    document.getElementById("planBox").style.display =
        "block";

    document.getElementById("planBox").innerHTML =
        (
            mode === "extract"
            ? "Extract "
            : "Delete "
        ) +
        selectedCount +
        (selectedCount === 1 ? " page" : " pages") +
        "<br>Output PDF: " +
        outputPages +
        (outputPages === 1 ? " page" : " pages");

    processBtn.disabled = false;

    document.getElementById("info").textContent =
        "Ready to process.";
}

async function processPDF(){
    if(
        !originalFile ||
        processing ||
        selectedPages.size === 0
    ){
        return;
    }

    const mode = getActionMode();

    if(
        mode === "delete" &&
        selectedPages.size === pageCount
    ){
        alert("At least one PDF page must remain.");
        return;
    }

    invalidateOutput();

    processing = true;
    setProcessingState(true);

    const processBtn =
        document.getElementById("processBtn");

    processBtn.disabled = true;
    processBtn.textContent =
        mode === "extract"
        ? "Extracting..."
        : "Deleting...";

    showProgress(0, "Reading PDF...");

    try{
        const bytes =
            await originalFile.arrayBuffer();

        const sourcePDF =
            await PDFLib.PDFDocument.load(
                bytes,
                {ignoreEncryption:false}
            );

        const destinationPDF =
            await PDFLib.PDFDocument.create();

        const selected =
            Array.from(selectedPages)
                .sort((a,b) => a-b);

        let pagesToKeep;

        if(mode === "extract"){
            pagesToKeep = selected;
        }else{
            pagesToKeep =
                Array.from(
                    {length:pageCount},
                    (_, index) => index + 1
                )
                .filter(page => !selectedPages.has(page));
        }

        const indices =
            pagesToKeep.map(page => page - 1);

        showProgress(
            35,
            "Copying selected pages..."
        );

        const copiedPages =
            await destinationPDF.copyPages(
                sourcePDF,
                indices
            );

        copiedPages.forEach(page => {
            destinationPDF.addPage(page);
        });

        showProgress(
            80,
            "Creating PDF..."
        );

        await allowBrowserPaint();

        const outputBytes =
            await destinationPDF.save();

        outputPDF =
            new Blob(
                [outputBytes],
                {type:"application/pdf"}
            );

        const baseName =
            originalFile.name.replace(
                /\.pdf$/i,
                ""
            ) || "document";

        outputFileName =
            baseName +
            (
                mode === "extract"
                ? "-extracted-pages.pdf"
                : "-pages-removed.pdf"
            );

        document.getElementById("downloadBtn").disabled =
            false;

        processBtn.textContent =
            mode === "extract"
            ? "Extracted"
            : "Deleted";

        showProgress(
            100,
            "Completed"
        );

        document.getElementById("info").innerHTML =
            (
                mode === "extract"
                ? "Pages Extracted Successfully"
                : "Pages Deleted Successfully"
            ) +
            "<br>Output Pages: " +
            pagesToKeep.length +
            "<br>Output Size: " +
            formatSize(outputPDF.size);

    }catch(error){
        console.error("PDF pages error:", error);

        outputPDF = null;

        document.getElementById("downloadBtn").disabled =
            true;

        processBtn.disabled = false;

        updateActionUI();

        hideProgress();

        document.getElementById("info").innerHTML =
            "Could not process this PDF.<br>" +
            "The file may be damaged, encrypted, or unsupported.";

    }finally{
        processing = false;
        setProcessingState(false);
    }
}

function downloadPDF(){
    if(!outputPDF){
        alert("Please process the PDF first.");
        return;
    }

    revokeDownloadURL();

    downloadURL =
        URL.createObjectURL(outputPDF);

    const link =
        document.createElement("a");

    link.href = downloadURL;
    link.download = outputFileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const successBox =
        document.getElementById("downloadSuccess");

    successBox.style.display = "block";

    clearTimeout(window.pdfPagesSuccessTimer);

    window.pdfPagesSuccessTimer =
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

    outputPDF = null;
    outputFileName = "";

    revokeDownloadURL();

    document.getElementById("downloadBtn").disabled =
        true;

    if(!processing){
        updateActionUI();
    }

    hideProgress();
}

function setControlsDisabled(disabled){
    document
        .querySelectorAll(
            'input[name="actionMode"]'
        )
        .forEach(input => {
            input.disabled = disabled;
        });

    pageRange.disabled = disabled;

    document.getElementById("selectAllBtn").disabled =
        disabled;

    document.getElementById("clearSelectionBtn").disabled =
        disabled;

    document.getElementById("invertBtn").disabled =
        disabled;
}

function setProcessingState(isProcessing){
    pdfInput.disabled = isProcessing;

    setControlsDisabled(isProcessing);

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

function resetDocumentState(){
    document.getElementById("downloadSuccess").style.display =
        "none";

    originalFile = null;
    pdfPreviewDocument = null;
    pageCount = 0;
    selectedPages.clear();
    outputPDF = null;
    outputFileName = "";

    revokeDownloadURL();

    if(pageObserver){
        pageObserver.disconnect();
        pageObserver = null;
    }

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("fileName").textContent =
        "";

    document.getElementById("fileMeta").textContent =
        "";

    document.getElementById("pagesGrid").innerHTML =
        "";

    document.getElementById("selectionSummary").style.display =
        "none";

    document.getElementById("selectionSummary").textContent =
        "";

    document.getElementById("planBox").style.display =
        "none";

    document.getElementById("planBox").textContent =
        "";

    pageRange.value = "";

    document.getElementById("modeExtract").checked = true;

    setControlsDisabled(true);

    document.getElementById("processBtn").disabled =
        true;

    document.getElementById("processBtn").textContent =
        "Extract Pages";

    document.getElementById("downloadBtn").disabled =
        true;

    document.getElementById("info").textContent =
        "";

    hideProgress();
}

function clearAll(){
    if(processing){
        return;
    }

    pdfInput.value = "";
    resetDocumentState();
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
