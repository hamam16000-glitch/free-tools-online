
const maxFiles = 50;
const maxFileSize = 25 * 1024 * 1024;

let items = [];
let results = [];
let processing = false;
let nextId = 1;

const input = document.getElementById("imageFiles");
const dropZone = document.getElementById("dropZone");
const quality = document.getElementById("quality");

input.addEventListener("change", event => {
    addFiles(Array.from(event.target.files));
    input.value = "";
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

    addFiles(Array.from(event.dataTransfer.files));
});

quality.addEventListener("input", () => {
    document.getElementById("qualityValue").textContent =
        quality.value + "%";

    invalidateResults();
    updatePlan();
});

document
    .querySelectorAll('input[name="outputFormat"]')
    .forEach(inputElement => {
        inputElement.addEventListener("change", () => {
            invalidateResults();
            updateSettingsVisibility();
            updatePlan();
        });
    });

document
    .getElementById("backgroundColor")
    .addEventListener("input", () => {
        invalidateResults();
    });

async function addFiles(files){
    if(processing || !files.length){
        return;
    }

    const remaining = maxFiles - items.length;

    if(remaining <= 0){
        alert("Maximum 50 images per batch.");
        return;
    }

    const candidates = files.slice(0, remaining);
    let rejected = 0;

    document.getElementById("info").textContent =
        "Reading images...";

    for(const file of candidates){
        const validType =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/webp" ||
            /\.(jpe?g|png|webp)$/i.test(file.name);

        if(!validType || file.size > maxFileSize){
            rejected++;
            continue;
        }

        try{
            const dimensions = await readImageDimensions(file);

            items.push({
                id:nextId++,
                file,
                width:dimensions.width,
                height:dimensions.height,
                previewURL:URL.createObjectURL(file)
            });

        }catch(error){
            console.error("Image read error:", error);
            rejected++;
        }
    }

    if(files.length > remaining){
        rejected += files.length - remaining;
    }

    invalidateResults();
    renderFiles();
    updatePlan();

    if(items.length){
        document.getElementById("info").textContent =
            rejected
            ? "Images ready. " + rejected + " file(s) skipped."
            : "Images ready to convert.";
    }else{
        document.getElementById("info").textContent =
            "No supported images were added.";
    }
}

function readImageDimensions(file){
return FTOSafety.loadImage(file).then(image=>({width:image.naturalWidth,height:image.naturalHeight}));
}

function renderFiles(){
    const list = document.getElementById("filesList");
    const head = document.getElementById("filesHead");

    list.innerHTML = "";

    if(!items.length){
        head.style.display = "none";
        document.getElementById("convertBtn").disabled = true;
        return;
    }

    head.style.display = "flex";

    document.getElementById("filesCount").textContent =
        items.length +
        (items.length === 1 ? " image" : " images");

    for(const item of items){
        const card = document.createElement("div");
        card.className = "file-card";

        const thumb = document.createElement("div");
        thumb.className = "thumb";

        const image = document.createElement("img");
        image.src = item.previewURL;
        image.alt = "";
        thumb.appendChild(image);

        const details = document.createElement("div");

        const name = document.createElement("div");
        name.className = "file-name";
        name.textContent = item.file.name;

        const meta = document.createElement("div");
        meta.className = "file-meta";
        meta.textContent =
            item.width + " × " + item.height +
            " • " + formatSize(item.file.size) +
            " • " + sourceFormat(item.file);

        details.appendChild(name);
        details.appendChild(meta);

        const remove = document.createElement("button");
        remove.className = "remove-btn";
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Remove image";

        remove.addEventListener("click", () => {
            removeItem(item.id);
        });

        card.appendChild(thumb);
        card.appendChild(details);
        card.appendChild(remove);

        list.appendChild(card);
    }

    document.getElementById("convertBtn").disabled =
        processing;
}

function removeItem(id){
    if(processing){
        return;
    }

    const index = items.findIndex(item => item.id === id);

    if(index === -1){
        return;
    }

    URL.revokeObjectURL(items[index].previewURL);
    items.splice(index, 1);

    invalidateResults();
    renderFiles();
    updatePlan();

    document.getElementById("info").textContent =
        items.length
        ? "Image removed."
        : "";
}

function getOutputFormat(){
    return document
        .querySelector('input[name="outputFormat"]:checked')
        .value;
}

function sourceFormat(file){
    if(file.type === "image/png" || /\.png$/i.test(file.name)){
        return "PNG";
    }

    if(file.type === "image/webp" || /\.webp$/i.test(file.name)){
        return "WebP";
    }

    return "JPG";
}

function outputLabel(){
    const format = getOutputFormat();

    if(format === "png"){
        return "PNG";
    }

    if(format === "webp"){
        return "WebP";
    }

    return "JPG";
}

function updateSettingsVisibility(){
    const format = getOutputFormat();

    document.getElementById("qualityCard").style.display =
        format === "png" ? "none" : "block";

    document.getElementById("backgroundCard").style.display =
        format === "jpg" ? "block" : "none";
}

function updatePlan(){
    const plan = document.getElementById("planBox");

    if(!items.length){
        plan.style.display = "none";
        return;
    }

    plan.style.display = "block";

    const format = getOutputFormat();

    let details =
        "Convert " +
        items.length +
        (items.length === 1 ? " image" : " images") +
        " to " +
        outputLabel();

    if(format !== "png"){
        details +=
            "<br>Quality: " +
            quality.value +
            "%";
    }

    if(format === "jpg"){
        details +=
            "<br>Transparency background: " +
            document.getElementById("backgroundColor").value.toUpperCase();
    }

    plan.innerHTML = details;
}

async function convertImages(){
    if(processing || !items.length){
        return;
    }

    invalidateResults();

    processing = true;
    setControlsDisabled(true);

    const button = document.getElementById("convertBtn");
    button.textContent = "Converting...";

    showProgress(0, "Starting conversion...");

    const format = getOutputFormat();

    try{
        for(let index = 0; index < items.length; index++){
            const item = items[index];

            showProgress(
                Math.round((index / items.length) * 90),
                "Converting " + (index + 1) + " of " + items.length + "..."
            );

            const result = await convertOne(item, format);

            results.push(result);

            await allowBrowserPaint();
        }

        renderResults();

        showProgress(100, "Completed");

        document.getElementById("downloadAllBtn").disabled =
            results.length === 0;

        const totalOriginal =
            items.reduce((sum, item) => sum + item.file.size, 0);

        const totalOutput =
            results.reduce((sum, result) => sum + result.blob.size, 0);

        const difference =
            totalOriginal > 0
            ? Math.round(((totalOriginal - totalOutput) / totalOriginal) * 100)
            : 0;

        const changeText =
            difference >= 0
            ? difference + "% smaller"
            : Math.abs(difference) + "% larger";

        document.getElementById("info").innerHTML =
            "Conversion completed successfully." +
            "<br>Original total: " + formatSize(totalOriginal) +
            "<br>Converted total: " + formatSize(totalOutput) +
            "<br>Size change: " + changeText;

    }catch(error){
        console.error("Conversion error:", error);

        document.getElementById("info").textContent =
            error.message || "Could not convert the images.";

        hideProgress();

    }finally{
        processing = false;
        setControlsDisabled(false);

        button.textContent = "Convert Images";
        button.disabled = !items.length;
    }
}

async function convertOne(item, format){
    const bitmapURL = URL.createObjectURL(item.file);
    const image = new Image();

    try{
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = bitmapURL;
        });

        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext("2d", {
            alpha:format !== "jpg"
        });

        if(!ctx){
            throw new Error("Canvas is not supported in this browser.");
        }

        if(format === "jpg"){
            ctx.fillStyle =
                document.getElementById("backgroundColor").value;

            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }else{
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(image, 0, 0);

        const mime =
            format === "png"
            ? "image/png"
            : format === "webp"
            ? "image/webp"
            : "image/jpeg";

        const qualityValue =
            format === "png"
            ? undefined
            : Number(quality.value) / 100;

        const blob =
            await canvasToBlob(canvas, mime, qualityValue);

        if(!blob){
            throw new Error("Could not create converted image.");
        }

        if(format === "webp" && blob.type !== "image/webp"){
            throw new Error("WebP export is not supported by this browser.");
        }

        const baseName =
            item.file.name.replace(/\.(jpe?g|png|webp)$/i, "") ||
            "image";

        const extension =
            format === "jpg" ? "jpg" : format;

        return {
            id:item.id,
            name:baseName + "-converted." + extension,
            blob,
            width:item.width,
            height:item.height,
            originalSize:item.file.size,
            previewURL:URL.createObjectURL(blob),
            format:outputLabel()
        };

    }finally{
        URL.revokeObjectURL(bitmapURL);
    }
}

function canvasToBlob(canvas, type, qualityValue){
return FTOSafety.imageBlob(canvas,type,qualityValue);
}

function renderResults(){
    const container = document.getElementById("results");
    container.innerHTML = "";

    for(const result of results){
        const card = document.createElement("div");
        card.className = "result-card";

        const thumb = document.createElement("div");
        thumb.className = "thumb";

        const image = document.createElement("img");
        image.src = result.previewURL;
        image.alt = "";
        thumb.appendChild(image);

        const details = document.createElement("div");

        const name = document.createElement("div");
        name.className = "file-name";
        name.textContent = result.name;

        const meta = document.createElement("div");
        meta.className = "file-meta";

        const saved =
            result.originalSize > 0
            ? Math.round(
                ((result.originalSize - result.blob.size) /
                result.originalSize) * 100
            )
            : 0;

        const sizeChange =
            saved >= 0
            ? saved + "% smaller"
            : Math.abs(saved) + "% larger";

        meta.innerHTML =
            result.width + " × " + result.height +
            " • " + result.format +
            "<br>" +
            formatSize(result.originalSize) +
            " → " +
            formatSize(result.blob.size) +
            " • " +
            sizeChange;

        details.appendChild(name);
        details.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "result-actions";

        const download = document.createElement("button");
        download.type = "button";
        download.textContent = "Download";

        download.addEventListener("click", () => {
            downloadBlob(result.blob, result.name);
        });

        actions.appendChild(download);

        card.appendChild(thumb);
        card.appendChild(details);
        card.appendChild(actions);

        container.appendChild(card);
    }
}

async function downloadAll(){
    if(!results.length || processing){
        return;
    }

    if(results.length === 1){
        downloadBlob(results[0].blob, results[0].name);
        return;
    }

    const button = document.getElementById("downloadAllBtn");

    button.disabled = true;
    button.textContent = "Creating ZIP...";

    try{
        const zip = new JSZip();

        for(const result of results){
            zip.file(result.name, result.blob);
        }

        const zipBlob =
            await zip.generateAsync({
                type:"blob",
                compression:"DEFLATE",
                compressionOptions:{level:6}
            });

        downloadBlob(
            zipBlob,
            "converted-" +
            outputLabel().toLowerCase() +
            "-images.zip"
        );

    }catch(error){
        console.error("ZIP error:", error);
        alert("Could not create ZIP file.");

    }finally{
        button.textContent = "Download All ZIP";
        button.disabled = false;
    }
}

function downloadBlob(blob, name){
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const status = document.getElementById("downloadStatus");

    if(status){
        status.textContent = "Download completed successfully.";
        status.style.display = "block";

        clearTimeout(window.downloadStatusTimer);

        window.downloadStatusTimer = setTimeout(() => {
            status.style.display = "none";
        }, 3000);
    }

    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function invalidateResults(){
    for(const result of results){
        URL.revokeObjectURL(result.previewURL);
    }

    results = [];

    document.getElementById("results").innerHTML = "";
    document.getElementById("downloadAllBtn").disabled = true;

    hideProgress();
}

function clearAll(){
    if(processing){
        return;
    }

    for(const item of items){
        URL.revokeObjectURL(item.previewURL);
    }

    items = [];
    nextId = 1;

    invalidateResults();

    input.value = "";

    document.getElementById("filesList").innerHTML = "";
    document.getElementById("filesHead").style.display = "none";
    document.getElementById("planBox").style.display = "none";
    document.getElementById("convertBtn").disabled = true;
    document.getElementById("info").textContent = "";

    hideProgress();
}

function setControlsDisabled(disabled){
    input.disabled = disabled;

    document
        .querySelectorAll('input[name="outputFormat"]')
        .forEach(element => {
            element.disabled = disabled;
        });

    quality.disabled = disabled;
    document.getElementById("backgroundColor").disabled = disabled;
    document.getElementById("clearBtn").disabled = disabled;
    document.getElementById("removeAllBtn").disabled = disabled;

    document
        .querySelectorAll(".remove-btn")
        .forEach(button => {
            button.disabled = disabled;
        });
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

    document.getElementById("progressBar").style.width = "0%";
    document.getElementById("progressText").textContent = "";
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

function allowBrowserPaint(){
    return new Promise(resolve => setTimeout(resolve, 0));
}

updateSettingsVisibility();
