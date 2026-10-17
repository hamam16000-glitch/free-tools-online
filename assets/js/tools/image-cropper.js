
const maxFileSize = 25 * 1024 * 1024;

let sourceFile = null;
let sourceImage = null;
let sourceWidth = 0;
let sourceHeight = 0;

let displayScale = 1;
let crop = {x:0,y:0,w:0,h:0};

let dragging = false;
let dragMode = "";
let startPointer = {x:0,y:0};
let startCrop = null;

let outputBlob = null;
let outputURL = null;
let outputName = "";

const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("imageFile");
const dropZone = document.getElementById("dropZone");

const cropX = document.getElementById("cropX");
const cropY = document.getElementById("cropY");
const cropW = document.getElementById("cropW");
const cropH = document.getElementById("cropH");

const quality = document.getElementById("quality");
const outputFormat = document.getElementById("outputFormat");

input.addEventListener("change", event => {
    const file = event.target.files[0];

    if(file){
        loadImage(file);
    }
});

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

    const file = event.dataTransfer.files[0];

    if(file){
        loadImage(file);
    }
});

document
    .querySelectorAll('input[name="ratio"]')
    .forEach(element => {
        element.addEventListener("change", () => {
            applySelectedRatio();
            invalidateOutput();
        });
    });

[cropX, cropY, cropW, cropH].forEach(element => {
    element.addEventListener("change", applyCoordinateInputs);
});

quality.addEventListener("input", () => {
    document.getElementById("qualityValue").textContent =
        quality.value + "%";

    invalidateOutput();
    updatePlan();
});

outputFormat.addEventListener("change", () => {
    updateOutputSettings();
    invalidateOutput();
    updatePlan();
});

document
    .getElementById("backgroundColor")
    .addEventListener("input", () => {
        invalidateOutput();
    });

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerup", pointerUp);
canvas.addEventListener("pointercancel", pointerUp);

window.addEventListener("resize", () => {
    if(sourceImage){
        setupCanvas();
        drawEditor();
    }
});

async function loadImage(file){
    const valid =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp" ||
        /\.(jpe?g|png|webp)$/i.test(file.name);

    if(!valid){
        alert("Please choose a JPG, PNG or WebP image.");
        return;
    }

    if(file.size > maxFileSize){
        alert("Image is too large. Maximum file size is 25 MB.");
        return;
    }

    clearImageObjects();

    document.getElementById("info").textContent =
        "Reading image...";

    try{
        const image=await FTOSafety.loadImage(file);
        sourceFile = file;
        sourceImage = image;
        sourceWidth = image.naturalWidth;
        sourceHeight = image.naturalHeight;

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileName").textContent =
            file.name;

        document.getElementById("fileMeta").textContent =
            sourceWidth +
            " × " +
            sourceHeight +
            " • " +
            formatSize(file.size) +
            " • " +
            sourceFormat(file);

        document.getElementById("cropControls").style.display =
            "block";

        document.getElementById("editorWrap").style.display =
            "block";

        document.getElementById("ratioFree").checked = true;

        resetCrop();

        document.getElementById("cropBtn").disabled = false;
        document.getElementById("resetBtn").disabled = false;

        document.getElementById("info").textContent =
            "Drag the crop area or resize it using the corner handles.";

    }catch(error){
        console.error("Image load error:", error);

        alert("Could not read this image.");
        clearAll();
    }
}

function setupCanvas(){
    if(!sourceImage){
        return;
    }

    const boxWidth =
        document.querySelector(".canvas-shell").clientWidth;

    const maxDisplayHeight = 620;

    const scaleByWidth =
        boxWidth / sourceWidth;

    const scaleByHeight =
        maxDisplayHeight / sourceHeight;

    displayScale =
        Math.min(
            scaleByWidth,
            scaleByHeight,
            1
        );

    canvas.width =
        Math.max(1, Math.round(sourceWidth * displayScale));

    canvas.height =
        Math.max(1, Math.round(sourceHeight * displayScale));

    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
}

function resetCrop(){
    if(!sourceImage){
        return;
    }

    crop = {
        x:0,
        y:0,
        w:sourceWidth,
        h:sourceHeight
    };

    document.getElementById("ratioFree").checked = true;

    setupCanvas();
    updateCoordinateInputs();
    invalidateOutput();
    drawEditor();
    updatePlan();
}

function getSelectedRatio(){
    const selected =
        document.querySelector('input[name="ratio"]:checked');

    if(!selected || selected.value === "free"){
        return null;
    }

    return Number(selected.value);
}

function applySelectedRatio(){
    if(!sourceImage){
        return;
    }

    const ratio = getSelectedRatio();

    if(!ratio){
        drawEditor();
        updatePlan();
        return;
    }

    let width = sourceWidth;
    let height = width / ratio;

    if(height > sourceHeight){
        height = sourceHeight;
        width = height * ratio;
    }

    crop.w = Math.max(1, Math.round(width));
    crop.h = Math.max(1, Math.round(height));

    crop.x = Math.round((sourceWidth - crop.w) / 2);
    crop.y = Math.round((sourceHeight - crop.h) / 2);

    clampCrop();
    updateCoordinateInputs();
    drawEditor();
    updatePlan();
}

function pointerDown(event){
    if(!sourceImage){
        return;
    }

    canvas.setPointerCapture(event.pointerId);

    const point = getPointerPosition(event);
    const cropDisplay = getDisplayCrop();

    const handle = getHandleAt(point, cropDisplay);

    startPointer = point;
    startCrop = {...crop};

    if(handle){
        dragMode = handle;
    }else if(
        point.x >= cropDisplay.x &&
        point.x <= cropDisplay.x + cropDisplay.w &&
        point.y >= cropDisplay.y &&
        point.y <= cropDisplay.y + cropDisplay.h
    ){
        dragMode = "move";
    }else{
        return;
    }

    dragging = true;
    event.preventDefault();
}

function pointerMove(event){
    if(!dragging || !startCrop){
        return;
    }

    const point = getPointerPosition(event);

    const dx =
        (point.x - startPointer.x) / displayScale;

    const dy =
        (point.y - startPointer.y) / displayScale;

    if(dragMode === "move"){
        crop.x = startCrop.x + dx;
        crop.y = startCrop.y + dy;

        clampCrop();
    }else{
        resizeCrop(dx, dy);
    }

    crop.x = Math.round(crop.x);
    crop.y = Math.round(crop.y);
    crop.w = Math.round(crop.w);
    crop.h = Math.round(crop.h);

    updateCoordinateInputs();
    invalidateOutput();
    drawEditor();
    updatePlan();

    event.preventDefault();
}

function pointerUp(event){
    if(!dragging){
        return;
    }

    dragging = false;
    dragMode = "";
    startCrop = null;

    try{
        canvas.releasePointerCapture(event.pointerId);
    }catch(error){}
}

function resizeCrop(dx, dy){
    const minSize = Math.max(
        10,
        Math.round(20 / Math.max(displayScale, .01))
    );

    const ratio = getSelectedRatio();

    let left = startCrop.x;
    let top = startCrop.y;
    let right = startCrop.x + startCrop.w;
    let bottom = startCrop.y + startCrop.h;

    if(dragMode.includes("w")){
        left += dx;
    }

    if(dragMode.includes("e")){
        right += dx;
    }

    if(dragMode.includes("n")){
        top += dy;
    }

    if(dragMode.includes("s")){
        bottom += dy;
    }

    if(ratio){
        let width = Math.max(minSize, right - left);
        let height = Math.max(minSize, bottom - top);

        if(
            dragMode === "se" ||
            dragMode === "ne" ||
            dragMode === "sw" ||
            dragMode === "nw"
        ){
            height = width / ratio;

            if(dragMode.includes("w")){
                left = right - width;
            }else{
                right = left + width;
            }

            if(dragMode.includes("n")){
                top = bottom - height;
            }else{
                bottom = top + height;
            }
        }
    }

    if(right - left < minSize){
        if(dragMode.includes("w")){
            left = right - minSize;
        }else{
            right = left + minSize;
        }
    }

    if(bottom - top < minSize){
        if(dragMode.includes("n")){
            top = bottom - minSize;
        }else{
            bottom = top + minSize;
        }
    }

    crop.x = left;
    crop.y = top;
    crop.w = right - left;
    crop.h = bottom - top;

    if(ratio){
        enforceRatio(ratio, dragMode);
    }

    clampCrop();
}

function enforceRatio(ratio, mode){
    if(!ratio){
        return;
    }

    let width = crop.w;
    let height = width / ratio;

    if(height > sourceHeight){
        height = sourceHeight;
        width = height * ratio;
    }

    if(mode.includes("w")){
        crop.x += crop.w - width;
    }

    if(mode.includes("n")){
        crop.y += crop.h - height;
    }

    crop.w = width;
    crop.h = height;
}

function clampCrop(){
    crop.w = Math.max(1, Math.min(crop.w, sourceWidth));
    crop.h = Math.max(1, Math.min(crop.h, sourceHeight));

    crop.x = Math.max(0, Math.min(crop.x, sourceWidth - crop.w));
    crop.y = Math.max(0, Math.min(crop.y, sourceHeight - crop.h));
}

function getPointerPosition(event){
    const rect = canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left) *
            (canvas.width / rect.width),
        y:
            (event.clientY - rect.top) *
            (canvas.height / rect.height)
    };
}

function getDisplayCrop(){
    return {
        x:crop.x * displayScale,
        y:crop.y * displayScale,
        w:crop.w * displayScale,
        h:crop.h * displayScale
    };
}

function getHandleAt(point, displayCrop){
    const radius = 18;

    const handles = {
        nw:{
            x:displayCrop.x,
            y:displayCrop.y
        },
        ne:{
            x:displayCrop.x + displayCrop.w,
            y:displayCrop.y
        },
        sw:{
            x:displayCrop.x,
            y:displayCrop.y + displayCrop.h
        },
        se:{
            x:displayCrop.x + displayCrop.w,
            y:displayCrop.y + displayCrop.h
        }
    };

    for(const [name, handle] of Object.entries(handles)){
        const dx = point.x - handle.x;
        const dy = point.y - handle.y;

        if(Math.sqrt(dx * dx + dy * dy) <= radius){
            return name;
        }
    }

    return "";
}

function drawEditor(){
    if(!sourceImage){
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
        sourceImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const d = getDisplayCrop();

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,.55)";

    ctx.fillRect(0, 0, canvas.width, d.y);
    ctx.fillRect(
        0,
        d.y + d.h,
        canvas.width,
        canvas.height - d.y - d.h
    );
    ctx.fillRect(0, d.y, d.x, d.h);
    ctx.fillRect(
        d.x + d.w,
        d.y,
        canvas.width - d.x - d.w,
        d.h
    );

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);

    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1;

    ctx.beginPath();

    for(let i = 1; i <= 2; i++){
        const gx = d.x + (d.w / 3) * i;
        const gy = d.y + (d.h / 3) * i;

        ctx.moveTo(gx, d.y);
        ctx.lineTo(gx, d.y + d.h);

        ctx.moveTo(d.x, gy);
        ctx.lineTo(d.x + d.w, gy);
    }

    ctx.stroke();

    drawHandle(d.x, d.y);
    drawHandle(d.x + d.w, d.y);
    drawHandle(d.x, d.y + d.h);
    drawHandle(d.x + d.w, d.y + d.h);

    ctx.restore();
}

function drawHandle(x, y){
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function updateCoordinateInputs(){
    cropX.value = Math.round(crop.x);
    cropY.value = Math.round(crop.y);
    cropW.value = Math.round(crop.w);
    cropH.value = Math.round(crop.h);
}

function applyCoordinateInputs(){
    if(!sourceImage){
        return;
    }

    let x = Number(cropX.value);
    let y = Number(cropY.value);
    let w = Number(cropW.value);
    let h = Number(cropH.value);

    if(
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(w) ||
        !Number.isFinite(h)
    ){
        updateCoordinateInputs();
        return;
    }

    x = Math.max(0, Math.round(x));
    y = Math.max(0, Math.round(y));
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));

    const ratio = getSelectedRatio();

    if(ratio){
        h = Math.max(1, Math.round(w / ratio));
    }

    crop = {x,y,w,h};

    clampCrop();

    updateCoordinateInputs();
    invalidateOutput();
    drawEditor();
    updatePlan();
}

function updateOutputSettings(){
    const format = outputFormat.value;

    document.getElementById("qualityCard").style.display =
        format === "png"
        ? "none"
        : "block";

    document.getElementById("backgroundCard").style.display =
        format === "jpg"
        ? "block"
        : "none";
}

function updatePlan(){
    if(!sourceImage){
        document.getElementById("planBox").style.display =
            "none";
        return;
    }

    const format = outputFormat.value;

    const ratioLabel =
        document.querySelector('input[name="ratio"]:checked')
        .nextElementSibling.textContent;

    let html =
        "Crop area: " +
        Math.round(crop.w) +
        " × " +
        Math.round(crop.h) +
        " px" +
        "<br>Position: X " +
        Math.round(crop.x) +
        ", Y " +
        Math.round(crop.y) +
        "<br>Aspect ratio: " +
        ratioLabel +
        "<br>Output: " +
        format.toUpperCase();

    if(format !== "png"){
        html +=
            "<br>Quality: " +
            quality.value +
            "%";
    }

    document.getElementById("planBox").style.display =
        "block";

    document.getElementById("planBox").innerHTML = html;
}

async function createCrop(){
    if(!sourceImage){
        return;
    }

    invalidateOutput();

    const width = Math.max(1, Math.round(crop.w));
    const height = Math.max(1, Math.round(crop.h));

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = width;
    outputCanvas.height = height;

    const outputContext =
        outputCanvas.getContext(
            "2d",
            {
                alpha:outputFormat.value !== "jpg"
            }
        );

    if(!outputContext){
        alert("Canvas is not supported in this browser.");
        return;
    }

    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = "high";

    if(outputFormat.value === "jpg"){
        outputContext.fillStyle =
            document.getElementById("backgroundColor").value;

        outputContext.fillRect(
            0,
            0,
            width,
            height
        );
    }else{
        outputContext.clearRect(
            0,
            0,
            width,
            height
        );
    }

    outputContext.drawImage(
        sourceImage,
        Math.round(crop.x),
        Math.round(crop.y),
        width,
        height,
        0,
        0,
        width,
        height
    );

    const format = outputFormat.value;

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

    outputBlob =
        await canvasToBlob(
            outputCanvas,
            mime,
            qualityValue
        );

    if(!outputBlob){
        alert("Could not create cropped image.");
        return;
    }

    if(
        format === "webp" &&
        outputBlob.type !== "image/webp"
    ){
        outputBlob = null;
        alert("WebP export is not supported by this browser.");
        return;
    }

    const baseName =
        sourceFile.name.replace(
            /\.(jpe?g|png|webp)$/i,
            ""
        ) || "image";

    const extension =
        format === "jpg"
        ? "jpg"
        : format;

    outputName =
        baseName +
        "-cropped." +
        extension;

    outputURL =
        URL.createObjectURL(outputBlob);

    document.getElementById("resultPreview").src =
        outputURL;

    document.getElementById("previewBox").style.display =
        "block";

    const sizeDifference =
        sourceFile.size > 0
        ? Math.round(
            ((sourceFile.size - outputBlob.size) /
            sourceFile.size) * 100
        )
        : 0;

    let sizeText;

    if(sizeDifference >= 0){
        sizeText =
            sizeDifference + "% smaller";
    }else{
        sizeText =
            Math.abs(sizeDifference) + "% larger";
    }

    document.getElementById("resultMeta").innerHTML =
        "Output: " +
        width +
        " × " +
        height +
        " px" +
        "<br>Format: " +
        format.toUpperCase() +
        "<br>Size: " +
        formatSize(outputBlob.size) +
        " • " +
        sizeText;

    document.getElementById("downloadBtn").disabled =
        false;

    document.getElementById("info").textContent =
        "Image cropped successfully.";
}

function canvasToBlob(canvasElement, type, qualityValue){
return FTOSafety.imageBlob(canvasElement,type,qualityValue);
}

function downloadResult(){
    if(!outputBlob || !outputURL){
        return;
    }

    const link = document.createElement("a");
    link.href = outputURL;
    link.download = outputName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const status = document.getElementById("downloadStatus");

    if(status){
        status.textContent = "✓ Download completed successfully.";
        status.style.display = "block";

        clearTimeout(window.downloadStatusTimer);

        window.downloadStatusTimer = setTimeout(() => {
            status.style.display = "none";
        }, 4000);
    }
}

function invalidateOutput(){
    if(outputURL){
        URL.revokeObjectURL(outputURL);
        outputURL = null;
    }

    outputBlob = null;
    outputName = "";

    document.getElementById("downloadBtn").disabled =
        true;

    document.getElementById("previewBox").style.display =
        "none";

    document.getElementById("resultPreview").removeAttribute(
        "src"
    );

    document.getElementById("resultMeta").textContent =
        "";
}

function clearImageObjects(){
    invalidateOutput();

    if(sourceImage && sourceImage.src){
        try{
            URL.revokeObjectURL(sourceImage.src);
        }catch(error){}
    }

    sourceFile = null;
    sourceImage = null;
    sourceWidth = 0;
    sourceHeight = 0;
}

function clearAll(){
    clearImageObjects();

    input.value = "";

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("cropControls").style.display =
        "none";

    document.getElementById("cropBtn").disabled = true;
    document.getElementById("downloadBtn").disabled = true;
    document.getElementById("resetBtn").disabled = true;

    document.getElementById("planBox").style.display =
        "none";

    document.getElementById("info").textContent = "";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

updateOutputSettings();
