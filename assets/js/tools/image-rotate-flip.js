
const maxFileSize = 50 * 1024 * 1024;
const maxOutputPixels = 60000000;

let sourceFile = null;
let sourceImage = null;
let sourceURL = null;

let rotation = 0;
let flipHorizontal = false;
let flipVertical = false;

let outputBlob = null;
let outputURL = null;
let outputName = "";

const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("imageFile");
const dropZone = document.getElementById("dropZone");

const angleRange = document.getElementById("angleRange");
const angleNumber = document.getElementById("angleNumber");

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

angleRange.addEventListener("input", () => {
    setRotation(Number(angleRange.value));
});

angleNumber.addEventListener("input", () => {
    if(angleNumber.value === ""){
        return;
    }

    let value = Number(angleNumber.value);

    if(!Number.isFinite(value)){
        return;
    }

    value = Math.max(-180, Math.min(180, value));

    rotation = value;
    angleRange.value = value;

    invalidateOutput();
    drawEditor();
    updateTransformInfo();
});

angleNumber.addEventListener("change", () => {
    if(angleNumber.value === ""){
        angleNumber.value = rotation;
        return;
    }

    setRotation(Number(angleNumber.value));
});

quality.addEventListener("input", () => {
    document.getElementById("qualityValue").textContent =
        quality.value + "%";

    invalidateOutput();
});

outputFormat.addEventListener("change", () => {
    updateOutputSettings();
    invalidateOutput();
});

document
    .getElementById("backgroundColor")
    .addEventListener("input", () => {
        invalidateOutput();
    });

window.addEventListener("resize", () => {
    if(sourceImage){
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
        alert("Image is too large. Maximum file size is 50 MB.");
        return;
    }

    clearImageObjects();

    document.getElementById("info").textContent =
        "Reading image...";

    try{
        sourceURL = URL.createObjectURL(file);

        const image = new Image();

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = sourceURL;
        });

        if(!image.naturalWidth || !image.naturalHeight){
            throw new Error("Invalid image dimensions.");
        }

        FTOSafety.checkImage(image.naturalWidth,image.naturalHeight);
        sourceFile = file;
        sourceImage = image;

        rotation = 0;
        flipHorizontal = false;
        flipVertical = false;

        syncTransformControls();

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileName").textContent =
            file.name;

        document.getElementById("fileMeta").textContent =
            image.naturalWidth +
            " × " +
            image.naturalHeight +
            " • " +
            formatSize(file.size) +
            " • " +
            sourceFormat(file);

        document.getElementById("rotateControls").style.display =
            "block";

        document.getElementById("editorWrap").style.display =
            "block";

        document.getElementById("createBtn").disabled =
            false;

        document.getElementById("resetBtn").disabled =
            false;

        outputFormat.value =
            sourceFormat(file).toLowerCase();

        updateOutputSettings();
        invalidateOutput();
        drawEditor();
        updateTransformInfo();

        document.getElementById("info").textContent =
            "Image loaded. Rotate or flip it, then create the final image.";

    }catch(error){
        console.error("Image load error:", error);

        alert("Could not read this image.");
        clearAll();
    }
}

function normalizeAngle(value){
    let angle = Number(value);

    if(!Number.isFinite(angle)){
        return 0;
    }

    angle %= 360;

    if(angle > 180){
        angle -= 360;
    }

    if(angle < -180){
        angle += 360;
    }

    return Math.round(angle * 100) / 100;
}

function setRotation(value){
    if(!sourceImage){
        return;
    }

    rotation = normalizeAngle(value);

    syncTransformControls();
    invalidateOutput();
    drawEditor();
    updateTransformInfo();
}

function rotateBy(amount){
    if(!sourceImage){
        return;
    }

    setRotation(rotation + amount);
}

function toggleFlipHorizontal(){
    if(!sourceImage){
        return;
    }

    flipHorizontal = !flipHorizontal;

    syncFlipButtons();
    invalidateOutput();
    drawEditor();
    updateTransformInfo();
}

function toggleFlipVertical(){
    if(!sourceImage){
        return;
    }

    flipVertical = !flipVertical;

    syncFlipButtons();
    invalidateOutput();
    drawEditor();
    updateTransformInfo();
}

function syncTransformControls(){
    angleRange.value = rotation;
    angleNumber.value = rotation;

    syncFlipButtons();
}

function syncFlipButtons(){
    const horizontalButton =
        document.getElementById("flipHorizontalBtn");

    const verticalButton =
        document.getElementById("flipVerticalBtn");

    horizontalButton.classList.toggle(
        "active",
        flipHorizontal
    );

    verticalButton.classList.toggle(
        "active",
        flipVertical
    );

    horizontalButton.setAttribute(
        "aria-pressed",
        flipHorizontal ? "true" : "false"
    );

    verticalButton.setAttribute(
        "aria-pressed",
        flipVertical ? "true" : "false"
    );
}

function getOutputDimensions(){
    if(!sourceImage){
        return {
            width:0,
            height:0
        };
    }

    const radians =
        rotation * Math.PI / 180;

    const rawCos =
        Math.abs(Math.cos(radians));

    const rawSin =
        Math.abs(Math.sin(radians));

    const cos =
        rawCos < 1e-10
        ? 0
        : rawCos;

    const sin =
        rawSin < 1e-10
        ? 0
        : rawSin;

    return {
        width:
            Math.max(
                1,
                Math.ceil(
                    sourceImage.naturalWidth * cos +
                    sourceImage.naturalHeight * sin
                )
            ),

        height:
            Math.max(
                1,
                Math.ceil(
                    sourceImage.naturalWidth * sin +
                    sourceImage.naturalHeight * cos
                )
            )
    };
}

function drawEditor(){
    if(!sourceImage || !ctx){
        return;
    }

    const dimensions = getOutputDimensions();

    const shell =
        document.querySelector(".canvas-shell");

    const availableWidth =
        Math.max(
            1,
            shell.clientWidth - 24
        );

    const availableHeight = 596;

    const previewScale =
        Math.min(
            availableWidth / dimensions.width,
            availableHeight / dimensions.height,
            1
        );

    canvas.width =
        Math.max(
            1,
            Math.round(
                dimensions.width * previewScale
            )
        );

    canvas.height =
        Math.max(
            1,
            Math.round(
                dimensions.height * previewScale
            )
        );

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.scale(
        (flipHorizontal ? -1 : 1) * previewScale,
        (flipVertical ? -1 : 1) * previewScale
    );

    ctx.rotate(
        rotation * Math.PI / 180
    );

    ctx.drawImage(
        sourceImage,
        -sourceImage.naturalWidth / 2,
        -sourceImage.naturalHeight / 2
    );

    ctx.restore();
}

function updateTransformInfo(){
    const box =
        document.getElementById("transformInfo");

    if(!sourceImage){
        box.style.display = "none";
        box.textContent = "";
        return;
    }

    const dimensions =
        getOutputDimensions();

    let flipText = "None";

    if(flipHorizontal && flipVertical){
        flipText = "Horizontal + Vertical";
    }else if(flipHorizontal){
        flipText = "Horizontal";
    }else if(flipVertical){
        flipText = "Vertical";
    }

    box.style.display = "block";

    box.innerHTML =
        "Rotation: " +
        rotation +
        "°" +
        "<br>Flip: " +
        flipText +
        "<br>Output dimensions: " +
        dimensions.width +
        " × " +
        dimensions.height +
        " px";
}

function resetTransform(){
    if(!sourceImage){
        return;
    }

    rotation = 0;
    flipHorizontal = false;
    flipVertical = false;

    syncTransformControls();
    invalidateOutput();
    drawEditor();
    updateTransformInfo();

    document.getElementById("info").textContent =
        "Rotation and flip settings reset.";
}

function updateOutputSettings(){
    const format =
        outputFormat.value;

    document.getElementById("qualityCard").style.display =
        format === "png"
        ? "none"
        : "block";

    document.getElementById("backgroundCard").style.display =
        format === "jpg"
        ? "block"
        : "none";
}

async function createResult(){
    if(!sourceImage || !sourceFile){
        return;
    }

    invalidateOutput();

    const dimensions =
        getOutputDimensions();

    if(
        dimensions.width *
        dimensions.height >
        maxOutputPixels
    ){
        alert(
            "This output is too large for safe processing on a mobile browser. Please resize the image first."
        );
        return;
    }

    document.getElementById("createBtn").disabled =
        true;

    document.getElementById("info").textContent =
        "Creating image...";

    try{
        const outputCanvas =
            document.createElement("canvas");

        FTOSafety.checkImage(dimensions.width,dimensions.height);
        outputCanvas.width =
            dimensions.width;

        outputCanvas.height =
            dimensions.height;

        const format =
            outputFormat.value;

        const outputContext =
            outputCanvas.getContext(
                "2d",
                {
                    alpha:format !== "jpg"
                }
            );

        if(!outputContext){
            throw new Error(
                "Canvas is not supported."
            );
        }

        outputContext.imageSmoothingEnabled =
            true;

        outputContext.imageSmoothingQuality =
            "high";

        if(format === "jpg"){
            outputContext.fillStyle =
                document
                    .getElementById("backgroundColor")
                    .value;

            outputContext.fillRect(
                0,
                0,
                dimensions.width,
                dimensions.height
            );
        }

        outputContext.save();

        outputContext.translate(
            dimensions.width / 2,
            dimensions.height / 2
        );

        outputContext.scale(
            flipHorizontal ? -1 : 1,
            flipVertical ? -1 : 1
        );

        outputContext.rotate(
            rotation * Math.PI / 180
        );

        outputContext.drawImage(
            sourceImage,
            -sourceImage.naturalWidth / 2,
            -sourceImage.naturalHeight / 2
        );

        outputContext.restore();

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
            throw new Error(
                "Could not create output image."
            );
        }

        if(
            format === "webp" &&
            outputBlob.type !== "image/webp"
        ){
            outputBlob = null;

            alert(
                "WebP export is not supported by this browser."
            );

            return;
        }

        const baseName =
            sourceFile.name.replace(
                /\.(jpe?g|png|webp)$/i,
                ""
            ) || "image";

        outputName =
            baseName +
            "-rotated-flipped." +
            (
                format === "jpg"
                ? "jpg"
                : format
            );

        outputURL =
            URL.createObjectURL(outputBlob);

        document.getElementById("resultPreview").src =
            outputURL;

        document.getElementById("previewBox").style.display =
            "block";

        const sizeDifference =
            sourceFile.size > 0
            ? Math.round(
                (
                    (
                        sourceFile.size -
                        outputBlob.size
                    ) /
                    sourceFile.size
                ) * 100
            )
            : 0;

        let sizeText;

        if(sizeDifference >= 0){
            sizeText =
                sizeDifference +
                "% smaller";
        }else{
            sizeText =
                Math.abs(sizeDifference) +
                "% larger";
        }

        document.getElementById("resultMeta").innerHTML =
            "Output: " +
            dimensions.width +
            " × " +
            dimensions.height +
            " px" +
            "<br>Rotation: " +
            rotation +
            "°" +
            "<br>Format: " +
            format.toUpperCase() +
            "<br>Size: " +
            formatSize(outputBlob.size) +
            " • " +
            sizeText;

        document.getElementById("downloadBtn").disabled =
            false;

        document.getElementById("info").textContent =
            "Image created successfully.";

    }catch(error){
        console.error(
            "Image processing error:",
            error
        );

        invalidateOutput();

        alert(
            "Could not create the transformed image. The image may be too large for this browser."
        );

        document.getElementById("info").textContent =
            "Image processing failed.";

    }finally{
        document.getElementById("createBtn").disabled =
            false;
    }
}

function canvasToBlob(
    canvasElement,
    type,
    qualityValue
){
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

    document
        .getElementById("resultPreview")
        .removeAttribute("src");

    document.getElementById("resultMeta").textContent =
        "";
}

function clearImageObjects(){
    invalidateOutput();

    if(sourceURL){
        try{
            URL.revokeObjectURL(sourceURL);
        }catch(error){}

        sourceURL = null;
    }

    sourceFile = null;
    sourceImage = null;
}

function clearAll(){
    clearImageObjects();

    input.value = "";

    rotation = 0;
    flipHorizontal = false;
    flipVertical = false;

    syncTransformControls();

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("rotateControls").style.display =
        "none";

    document.getElementById("editorWrap").style.display =
        "none";

    document.getElementById("createBtn").disabled =
        true;

    document.getElementById("downloadBtn").disabled =
        true;

    document.getElementById("resetBtn").disabled =
        true;

    document.getElementById("transformInfo").style.display =
        "none";

    document.getElementById("transformInfo").textContent =
        "";

    document.getElementById("info").textContent =
        "";

    if(ctx){
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}

function sourceFormat(file){
    if(
        file.type === "image/png" ||
        /\.png$/i.test(file.name)
    ){
        return "PNG";
    }

    if(
        file.type === "image/webp" ||
        /\.webp$/i.test(file.name)
    ){
        return "WebP";
    }

    return "JPG";
}

function formatSize(bytes){
    if(bytes >= 1024 * 1024){
        return (
            bytes /
            (1024 * 1024)
        ).toFixed(2) + " MB";
    }

    if(bytes >= 1024){
        return (
            bytes / 1024
        ).toFixed(1) + " KB";
    }

    return bytes + " B";
}

updateOutputSettings();
syncTransformControls();
