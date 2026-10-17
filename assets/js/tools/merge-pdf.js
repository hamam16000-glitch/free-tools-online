
let selectedFiles = [];
let mergedPDF = null;
let mergedFileName = "merged.pdf";
let objectURL = null;

const maxFileSize = 50 * 1024 * 1024;

document.getElementById("pdfFiles").addEventListener("change", selectPDFs);

const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", event => {
    event.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");

    const files = Array.from(event.dataTransfer.files || []);

    if(files.length){
        addPDFFiles(files);
    }
});

async function selectPDFs(event){
    const incomingFiles =
        Array.from(event.target.files || []);

    event.target.value = "";

    await addPDFFiles(incomingFiles);
}

async function addPDFFiles(incomingFiles){
    if(incomingFiles.length === 0){
        return;
    }

    mergedPDF = null;
    resetDownload();
    hideDownloadSuccess();

    let rejected = [];
    let acceptedCount = 0;

    document.getElementById("info").textContent =
        "Reading PDF files...";

    for(const file of incomingFiles){
        const isPDF =
            file.type === "application/pdf" ||
            /\.pdf$/i.test(file.name);

        if(!isPDF){
            rejected.push(
                file.name + " - not a PDF file"
            );
            continue;
        }

        if(file.size > maxFileSize){
            rejected.push(
                file.name + " - larger than 50 MB"
            );
            continue;
        }

        try{
            const bytes =
                await file.arrayBuffer();

            const pdf =
                await PDFLib.PDFDocument.load(
                    bytes,
                    {ignoreEncryption:false}
                );

            selectedFiles.push({
                file:file,
                pages:pdf.getPageCount()
            });

            acceptedCount++;

        }catch(error){
            console.error("PDF read error:", error);

            rejected.push(
                file.name + " - could not be read"
            );
        }
    }

    renderFileList();
    updateState();

    if(rejected.length > 0){
        alert(
            "Some files were not added:\n\n" +
            rejected.join("\n")
        );
    }

    if(
        acceptedCount === 0 &&
        selectedFiles.length === 0
    ){
        document.getElementById("info").textContent =
            "";
    }
}

function renderFileList(){
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    selectedFiles.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "file-item";

        const details = document.createElement("div");
        details.className = "file-details";

        const name = document.createElement("div");
        name.className = "file-name";
        name.textContent = (index + 1) + ". " + item.file.name;

        const meta = document.createElement("div");
        meta.className = "file-meta";
        meta.textContent =
            formatSize(item.file.size) +
            " • " +
            item.pages +
            (item.pages === 1 ? " page" : " pages");

        details.appendChild(name);
        details.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "file-actions";

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.textContent = "↑";
        upBtn.title = "Move up";
        upBtn.disabled = index === 0;
        upBtn.onclick = () => moveFile(index, -1);

        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.textContent = "↓";
        downBtn.title = "Move down";
        downBtn.disabled = index === selectedFiles.length - 1;
        downBtn.onclick = () => moveFile(index, 1);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove";
        removeBtn.onclick = () => removeFile(index);

        actions.appendChild(upBtn);
        actions.appendChild(downBtn);
        actions.appendChild(removeBtn);

        row.appendChild(details);
        row.appendChild(actions);

        list.appendChild(row);
    });
}

function moveFile(index, direction){
    const newIndex = index + direction;

    if(newIndex < 0 || newIndex >= selectedFiles.length){
        return;
    }

    const temp = selectedFiles[index];
    selectedFiles[index] = selectedFiles[newIndex];
    selectedFiles[newIndex] = temp;

    mergedPDF = null;
    resetDownload();
    renderFileList();
    updateState();
}

function removeFile(index){
    selectedFiles.splice(index, 1);

    mergedPDF = null;
    resetDownload();
    renderFileList();
    updateState();
}

function updateState(){
    const mergeBtn = document.getElementById("mergeBtn");
    const pickerText = document.getElementById("filePickerText");
    const info = document.getElementById("info");

    if(selectedFiles.length === 0){
        pickerText.textContent = "No files selected";
        mergeBtn.disabled = true;
        mergeBtn.textContent = "Merge PDF";
        info.textContent = "";
        return;
    }

    pickerText.textContent =
        selectedFiles.length +
        (selectedFiles.length === 1 ? " file selected" : " files selected");

    mergeBtn.disabled = selectedFiles.length < 2;
    mergeBtn.textContent = "Merge PDF";

    const totalPages = selectedFiles.reduce(
        (sum, item) => sum + item.pages,
        0
    );

    const totalSize = selectedFiles.reduce(
        (sum, item) => sum + item.file.size,
        0
    );

    info.innerHTML =
        "Files: " + selectedFiles.length +
        "<br>Total Size: " + formatSize(totalSize) +
        "<br>Total Pages: " + totalPages;

    if(selectedFiles.length === 1){
        info.innerHTML += "<br>Please add at least one more PDF.";
    }
}

async function mergePDFs(){
    if(selectedFiles.length < 2){
        alert("Please select at least two PDF files");
        return;
    }

    const btn = document.getElementById("mergeBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    btn.disabled = true;
    btn.textContent = "Merging...";
    downloadBtn.disabled = true;

    mergedPDF = null;
    revokeObjectURL();

    try{
        const outputPDF = await PDFLib.PDFDocument.create();
        let totalPages = 0;

        for(let i = 0; i < selectedFiles.length; i++){
            const percent =
                Math.round(
                    (i / selectedFiles.length) * 85
                );

            showProgress(
                percent,
                "Merging file " +
                (i + 1) +
                " of " +
                selectedFiles.length
            );

            document.getElementById("info").textContent =
                "Merging PDF files...";

            const bytes = await selectedFiles[i].file.arrayBuffer();

            const sourcePDF = await PDFLib.PDFDocument.load(bytes, {
                ignoreEncryption: false
            });

            const pageIndices = sourcePDF.getPageIndices();

            const copiedPages = await outputPDF.copyPages(
                sourcePDF,
                pageIndices
            );

            copiedPages.forEach(page => {
                outputPDF.addPage(page);
            });

            totalPages += copiedPages.length;
        }

        showProgress(
            90,
            "Creating merged PDF..."
        );

        document.getElementById("info").textContent =
            "Creating merged PDF...";

        const outputBytes = await outputPDF.save();

        mergedPDF = new Blob(
            [outputBytes],
            {type:"application/pdf"}
        );

        mergedFileName = createMergedFileName();

        const originalSize = selectedFiles.reduce(
            (sum, item) => sum + item.file.size,
            0
        );

        document.getElementById("info").innerHTML =
            "Merged Successfully" +
            "<br>Files: " + selectedFiles.length +
            "<br>Pages: " + totalPages +
            "<br>Original Total: " + formatSize(originalSize) +
            "<br>Merged Size: " + formatSize(mergedPDF.size);

        btn.disabled = true;
        btn.textContent = "Merged";
        downloadBtn.disabled = false;

        showProgress(
            100,
            "Completed"
        );

    }catch(error){
        console.error("PDF merge error:", error);

        mergedPDF = null;
        downloadBtn.disabled = true;

        document.getElementById("info").innerHTML =
            "Could not merge these PDF files.<br>" +
            "One of the files may be damaged, encrypted, or unsupported.";

        btn.disabled = false;
        btn.textContent = "Merge PDF";
    }
}

function createMergedFileName(){
    if(selectedFiles.length === 0){
        return "merged.pdf";
    }

    let baseName = selectedFiles[0].file.name.replace(/\.pdf$/i, "");

    if(!baseName){
        baseName = "document";
    }

    return baseName + "-merged.pdf";
}

function downloadPDF(){
    if(!mergedPDF){
        alert("Please merge PDF files first");
        return;
    }

    revokeObjectURL();

    objectURL =
        URL.createObjectURL(mergedPDF);

    const link =
        document.createElement("a");

    link.href = objectURL;
    link.download = mergedFileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const box =
        document.getElementById("downloadSuccess");

    box.style.display = "block";

    clearTimeout(window.mergePDFSuccessTimer);

    window.mergePDFSuccessTimer =
        setTimeout(() => {
            box.style.display = "none";
        },4000);

    setTimeout(
        revokeObjectURL,
        1500
    );
}

function clearPDFs(){
    hideDownloadSuccess();
    hideProgress();

    selectedFiles = [];
    mergedPDF = null;
    mergedFileName = "merged.pdf";

    revokeObjectURL();

    document.getElementById("pdfFiles").value = "";
    document.getElementById("filePickerText").textContent =
        "No files selected";
    document.getElementById("fileList").innerHTML = "";
    document.getElementById("info").textContent = "";

    const btn = document.getElementById("mergeBtn");
    btn.disabled = true;
    btn.textContent = "Merge PDF";

    document.getElementById("downloadBtn").disabled = true;
}

function resetDownload(){
    hideDownloadSuccess();
    hideProgress();

    mergedPDF = null;
    document.getElementById("downloadBtn").disabled = true;

    const btn = document.getElementById("mergeBtn");
    btn.textContent = "Merge PDF";
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

function hideDownloadSuccess(){
    const box =
        document.getElementById("downloadSuccess");

    if(box){
        box.style.display = "none";
    }
}

function revokeObjectURL(){
    if(objectURL){
        URL.revokeObjectURL(objectURL);
        objectURL = null;
    }
}

function formatSize(bytes){
    if(bytes >= 1024 * 1024){
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    if(bytes >= 1024){
        return Math.round(bytes / 1024) + " KB";
    }

    return bytes + " B";
}
