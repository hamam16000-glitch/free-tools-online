
pdfjsLib.GlobalWorkerOptions.workerSrc =
"../vendor/pdfjs/pdf.worker.min.js";

let originalFile = null;
let pdfDocument = null;
let pageCount = 0;
let outputImages = [];
let objectURLs = [];
let processing = false;

const maxFileSize = 50 * 1024 * 1024;
const maxOutputPages = 200;

const pdfInput = document.getElementById("pdfFile");
const dropZone = document.getElementById("dropZone");
const pageRange = document.getElementById("pageRange");
const outputFormat = document.getElementById("outputFormat");
const resolution = document.getElementById("resolution");
const quality = document.getElementById("quality");

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

document.querySelectorAll('input[name="pageMode"]').forEach(input => {
    input.addEventListener("change", () => {
        clearResults();

        const customMode =
            getPageMode() === "custom";

        document.getElementById("rangeBlock").style.display =
            customMode
            ? "block"
            : "none";

        pageRange.disabled = processing;

        updatePlan();
    });
});

pageRange.addEventListener("input", () => {
    clearResults();
    updatePlan();
});

outputFormat.addEventListener("change", () => {
    clearResults();
    updateFormatUI();
    updatePlan();
});

resolution.addEventListener("change", () => {
    clearResults();
    updatePlan();
});

quality.addEventListener("input", () => {
    document.getElementById("qualityValue").textContent =
        quality.value + "%";

    clearResults();
});

function getFormatConfig(){
    const format = outputFormat.value;

    if(format === "png"){
        return {
            value:"png",
            label:"PNG",
            extension:"png",
            mime:"image/png",
            qualityEnabled:false,
            zipSuffix:"png-pages"
        };
    }

    if(format === "webp"){
        return {
            value:"webp",
            label:"WebP",
            extension:"webp",
            mime:"image/webp",
            qualityEnabled:true,
            zipSuffix:"webp-pages"
        };
    }

    return {
        value:"jpg",
        label:"JPG",
        extension:"jpg",
        mime:"image/jpeg",
        qualityEnabled:true,
        zipSuffix:"jpg-pages"
    };
}

function updateFormatUI(){
    const config = getFormatConfig();
    const qualityBlock = document.getElementById("qualityBlock");
    const qualityLabel = document.getElementById("qualityLabel");
    const convertBtn = document.getElementById("convertBtn");

    if(config.qualityEnabled){
        qualityBlock.style.display = "block";
        qualityLabel.textContent = config.label + " quality";
        quality.disabled = !originalFile || processing;
    }else{
        qualityBlock.style.display = "none";
        quality.disabled = true;
    }

    if(!processing && convertBtn.textContent !== "Completed"){
        convertBtn.textContent = "Convert to " + config.label;
    }
}

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

    document.getElementById("info").textContent =
        "Reading PDF information...";

    pdfInput.disabled = true;

    try{
        const bytes = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument(FTOSafety.pdfOptions({
            data:bytes
        })).promise;

        originalFile = file;
        pdfDocument = pdf;
        pageCount = pdf.numPages;

        if(pageCount < 1){
            throw new Error("PDF contains no pages.");
        }

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileName").textContent =
            file.name;

        document.getElementById("fileMeta").textContent =
            formatSize(file.size) +
            " • " +
            pageCount +
            (pageCount === 1 ? " page" : " pages");

        setControlsDisabled(false);
        updateFormatUI();

        document.getElementById("modeAll").checked = true;
        document.getElementById("rangeBlock").style.display =
            "none";

        pageRange.value = "";
        pageRange.placeholder =
            "Example: 1-3, 5, " + pageCount;

        updatePlan();

        document.getElementById("info").innerHTML =
            "Ready to convert" +
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
    const selected = document.querySelector(
        'input[name="pageMode"]:checked'
    );

    return selected ? selected.value : "all";
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
    const parts = text.split(",");

    for(const rawPart of parts){
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

        const match = part.match(/^(\d+)\s*-\s*(\d+)$/);

        if(!match){
            return [];
        }

        let start = Number(match[1]);
        let end = Number(match[2]);

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
    const convertBtn = document.getElementById("convertBtn");

    if(pages.length === 0){
        convertBtn.disabled = true;

        if(getPageMode() === "custom"){
            document.getElementById("planBox").style.display =
                "block";

            document.getElementById("planBox").textContent =
                "Enter a valid page range between 1 and " +
                pageCount +
                ".";

            document.getElementById("info").innerHTML =
                "Enter valid pages to continue" +
                "<br>Available pages: 1-" +
                pageCount;
        }else{
            hidePlan();
            document.getElementById("info").textContent = "";
        }

        return;
    }

    document.getElementById("planBox").style.display =
        "block";

    const previewLimit = 20;

    const preview = pages
        .slice(0, previewLimit)
        .join(", ");

    document.getElementById("planBox").innerHTML =
        "Output: " +
        pages.length +
        (
            pages.length === 1
            ? " " + getFormatConfig().label + " image"
            : " " + getFormatConfig().label + " images"
        ) +
        "<br>Pages: " +
        preview +
        (
            pages.length > previewLimit
            ? " ... +" + (pages.length - previewLimit) + " more"
            : ""
        );

    if(pages.length > maxOutputPages){
        convertBtn.disabled = true;

        document.getElementById("info").innerHTML =
            "This selection contains " +
            pages.length +
            " pages.<br>Maximum conversion per run: " +
            maxOutputPages +
            " pages.";

        return;
    }

    convertBtn.disabled = false;

    if(!processing){
        document.getElementById("info").innerHTML =
            "Ready to convert" +
            "<br>Pages: " + pageCount +
            "<br>Size: " + formatSize(originalFile.size);
    }
}

async function convertPDF(){
    if(!pdfDocument || !originalFile || processing){
        return;
    }

    const pages = getSelectedPages();

    if(pages.length === 0){
        alert("Please select valid PDF pages.");
        return;
    }

    if(pages.length > maxOutputPages){
        alert(
            "Too many pages selected. Maximum: " +
            maxOutputPages
        );
        return;
    }

    clearResults();

    processing = true;
    setProcessingState(true);

    const convertBtn = document.getElementById("convertBtn");

    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";

    showProgress(0, "Preparing conversion...");

    try{
        const scale = Number(resolution.value);
        const imageQuality = Number(quality.value) / 100;
        const formatConfig = getFormatConfig();

        const baseName =
            originalFile.name.replace(/\.pdf$/i, "") ||
            "document";

        const pageNumberWidth =
            Math.max(2, String(pageCount).length);

        for(let index = 0; index < pages.length; index++){
            const pageNumber = pages[index];

            showProgress(
                Math.round((index / pages.length) * 100),
                "Converting page " +
                pageNumber +
                " (" +
                (index + 1) +
                " of " +
                pages.length +
                ")"
            );

            const page =
                await pdfDocument.getPage(pageNumber);

            const viewport =
                page.getViewport({scale});

            FTOSafety.checkImage(Math.ceil(viewport.width),Math.ceil(viewport.height));
            const canvas =
                document.createElement("canvas");

            const context =
                canvas.getContext("2d", {
                    alpha:false
                });

            canvas.width =
                Math.ceil(viewport.width);

            canvas.height =
                Math.ceil(viewport.height);

            context.fillStyle = "#ffffff";
            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            await page.render({
                canvasContext:context,
                viewport
            }).promise;

            const blob =
                await canvasToBlob(
                    canvas,
                    formatConfig.mime,
                    formatConfig.qualityEnabled
                        ? imageQuality
                        : undefined
                );

            if(!blob){
                throw new Error(
                    "Could not create " +
                    formatConfig.label +
                    " for page " +
                    pageNumber
                );
            }

            if(
                formatConfig.value === "webp" &&
                blob.type !== "image/webp"
            ){
                throw new Error(
                    "WebP export is not supported by this browser."
                );
            }

            const fileName =
                baseName +
                "-page-" +
                String(pageNumber).padStart(
                    pageNumberWidth,
                    "0"
                ) +
                "." +
                formatConfig.extension;

            const previewURL =
                URL.createObjectURL(blob);

            objectURLs.push(previewURL);

            outputImages.push({
                pageNumber,
                blob,
                fileName,
                previewURL,
                width:canvas.width,
                height:canvas.height,
                formatLabel:formatConfig.label
            });

            canvas.width = 1;
            canvas.height = 1;

            await allowBrowserPaint();
        }

        renderResults();

        showProgress(
            100,
            "Completed - " +
            outputImages.length +
            (
                outputImages.length === 1
                ? " image created"
                : " images created"
            )
        );

        convertBtn.textContent = "Completed";
        convertBtn.disabled = true;

        document.getElementById("downloadAll").style.display =
            outputImages.length > 1
            ? "block"
            : "none";

        const totalSize =
            outputImages.reduce(
                (sum, item) => sum + item.blob.size,
                0
            );

        document.getElementById("info").innerHTML =
            "Conversion Successful" +
            "<br>Images: " + outputImages.length +
            "<br>Total Size: " + formatSize(totalSize);

    }catch(error){
        console.error("PDF conversion error:", error);

        clearResults();
        hideProgress();

        convertBtn.textContent =
            "Convert to " + getFormatConfig().label;
        convertBtn.disabled = false;

        document.getElementById("info").innerHTML =
            "Could not convert this PDF.<br>Please try another file or lower the resolution.";

    }finally{
        processing = false;
        setProcessingState(false);
    }
}

function renderResults(){
    const results =
        document.getElementById("results");

    results.innerHTML = "";

    const heading =
        document.createElement("h3");

    heading.textContent =
        "Converted Images";

    results.appendChild(heading);

    outputImages.forEach((item, index) => {
        const card =
            document.createElement("div");

        card.className = "result-card";

        const img =
            document.createElement("img");

        img.className = "preview";
        img.src = item.previewURL;
        img.alt =
            "Preview of PDF page " +
            item.pageNumber;

        const details =
            document.createElement("div");

        const name =
            document.createElement("div");

        name.className = "result-name";
        name.textContent = item.fileName;

        const meta =
            document.createElement("div");

        meta.className = "result-meta";

        meta.textContent =
            "Page " +
            item.pageNumber +
            " • " +
            item.width +
            "×" +
            item.height +
            " px • " +
            formatSize(item.blob.size);

        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent =
            "Download " + item.formatLabel;
        button.onclick = () =>
            downloadImage(index);

        details.appendChild(name);
        details.appendChild(meta);
        details.appendChild(button);

        card.appendChild(img);
        card.appendChild(details);

        results.appendChild(card);
    });
}

function downloadImage(index){
    const item = outputImages[index];

    if(!item){
        return;
    }

    downloadBlob(
        item.blob,
        item.fileName
    );
}

async function downloadAllZIP(){
    if(outputImages.length < 2){
        return;
    }

    if(typeof JSZip === "undefined"){
        alert(
            "ZIP library could not be loaded. Please download images individually."
        );
        return;
    }

    const button =
        document.getElementById("downloadAllBtn");

    button.disabled = true;
    button.textContent = "Creating ZIP...";

    try{
        const zip = new JSZip();

        outputImages.forEach(item => {
            zip.file(
                item.fileName,
                item.blob
            );
        });

        const zipBlob =
            await zip.generateAsync(
                {type:"blob"},
                metadata => {
                    button.textContent =
                        "Creating ZIP... " +
                        Math.round(metadata.percent) +
                        "%";
                }
            );

        const baseName =
            originalFile.name.replace(/\.pdf$/i, "") ||
            "document";

        downloadBlob(
            zipBlob,
            baseName +
            "-" +
            getFormatConfig().zipSuffix +
            ".zip"
        );

        button.textContent = "Download All as ZIP";

    }catch(error){
        console.error("ZIP error:", error);

        alert(
            "Could not create ZIP. You can still download each image individually."
        );

        button.textContent = "Download All as ZIP";

    }finally{
        button.disabled = false;
    }
}

function downloadBlob(blob, fileName){
    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const successBox =
        document.getElementById("downloadSuccess");

    successBox.textContent =
        fileName.toLowerCase().endsWith(".zip")
        ? "ZIP downloaded successfully."
        : "Image downloaded successfully.";

    successBox.style.display = "block";

    clearTimeout(window.pdfJpgDownloadTimer);

    window.pdfJpgDownloadTimer =
        setTimeout(() => {
            successBox.style.display = "none";
        },4000);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    },1500);
}

function clearResults(){
    const successBox =
        document.getElementById("downloadSuccess");

    if(successBox){
        successBox.style.display = "none";
    }

    outputImages = [];

    objectURLs.forEach(url => {
        URL.revokeObjectURL(url);
    });

    objectURLs = [];

    document.getElementById("results").innerHTML = "";
    document.getElementById("downloadAll").style.display =
        "none";

    hideProgress();

    if(originalFile && !processing){
        document.getElementById("convertBtn").textContent =
            "Convert to " + getFormatConfig().label;
    }
}

function clearAll(){
    if(processing){
        return;
    }

    resetAll();
}

function resetAll(){
    processing = false;

    clearResults();

    originalFile = null;
    pdfDocument = null;
    pageCount = 0;

    pdfInput.value = "";

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("fileName").textContent = "";
    document.getElementById("fileMeta").textContent = "";

    document.getElementById("modeAll").checked = true;

    document.getElementById("rangeBlock").style.display =
        "none";

    pageRange.value = "";

    outputFormat.value = "jpg";
    resolution.value = "1.5";
    quality.value = "90";

    document.getElementById("qualityValue").textContent =
        "90%";

    updateFormatUI();
    setControlsDisabled(true);

    document.getElementById("convertBtn").disabled = true;
    document.getElementById("convertBtn").textContent =
        "Convert to " + getFormatConfig().label;

    document.getElementById("info").textContent = "";

    hidePlan();
    hideProgress();
}

function setControlsDisabled(disabled){
    document
        .querySelectorAll('input[name="pageMode"]')
        .forEach(input => {
            input.disabled = disabled;
        });

    outputFormat.disabled = disabled;
    resolution.disabled = disabled;
    quality.disabled =
        disabled || !getFormatConfig().qualityEnabled;

    pageRange.disabled = disabled;
}

function setProcessingState(isProcessing){
    pdfInput.disabled = isProcessing;
    outputFormat.disabled = isProcessing;
    resolution.disabled = isProcessing;
    quality.disabled =
        isProcessing || !getFormatConfig().qualityEnabled;
    pageRange.disabled = isProcessing;

    document
        .querySelectorAll('input[name="pageMode"]')
        .forEach(input => {
            input.disabled = isProcessing;
        });

    document.getElementById("clearBtn").disabled =
        isProcessing;
}

function showProgress(percent, text){
    document.getElementById("progressWrap").style.display =
        "block";

    document.getElementById("progressBar").style.width =
        percent + "%";

    document.getElementById("progressText").textContent =
        text;
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

    document.getElementById("planBox").textContent =
        "";
}

function canvasToBlob(canvas, type, qualityValue){
return FTOSafety.imageBlob(canvas,type,qualityValue);
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
