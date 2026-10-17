
let selectedImages = [];
let createdPDF = null;
let createdPDFName = "images-to-pdf.pdf";
let processing = false;
let downloadURL = null;

const maxImageSize = 25 * 1024 * 1024;
const maxTotalSize = 100 * 1024 * 1024;
const maxImages = 100;

const imageInput = document.getElementById("imageFiles");
const dropZone = document.getElementById("dropZone");
const pageSizeSelect = document.getElementById("pageSize");
const orientationSelect = document.getElementById("orientation");
const marginSelect = document.getElementById("margin");
const fitModeSelect = document.getElementById("fitMode");

imageInput.addEventListener("change", async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if(files.length){
        await addImages(files);
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

dropZone.addEventListener("drop", async event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");

    if(processing){
        return;
    }

    const files = Array.from(event.dataTransfer.files || []);

    if(files.length){
        await addImages(files);
    }
});

[
    pageSizeSelect,
    orientationSelect,
    marginSelect,
    fitModeSelect
].forEach(control => {
    control.addEventListener("change", () => {
        invalidateOutput();
        updatePlan();
    });
});

async function addImages(files){
    if(processing){
        return;
    }

    invalidateOutput();

    const availableSlots = maxImages - selectedImages.length;

    if(availableSlots <= 0){
        alert("Maximum number of images reached: " + maxImages);
        return;
    }

    const candidates = files.slice(0, availableSlots);
    const rejected = [];

    document.getElementById("info").textContent =
        "Reading images...";

    for(const file of candidates){
        const validType =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/webp" ||
            /\.(jpe?g|png|webp)$/i.test(file.name);

        if(!validType){
            rejected.push(file.name + " - unsupported format");
            continue;
        }

        if(file.size > maxImageSize){
            rejected.push(file.name + " - larger than 25 MB");
            continue;
        }

        const currentTotal =
            selectedImages.reduce(
                (sum, item) => sum + item.file.size,
                0
            );

        if(currentTotal + file.size > maxTotalSize){
            rejected.push(
                file.name + " - total selection would exceed 100 MB"
            );
            continue;
        }

        try{
            const meta = await readImageMeta(file);

            selectedImages.push({
                file,
                width:meta.width,
                height:meta.height,
                previewURL:meta.previewURL
            });

        }catch(error){
            console.error("Image read error:", error);
            rejected.push(file.name + " - could not be read");
        }
    }

    renderImageList();
    updateState();

    if(files.length > availableSlots){
        rejected.push(
            "Only the first " +
            availableSlots +
            " additional images were considered."
        );
    }

    if(rejected.length){
        alert(
            "Some images were not added:\n\n" +
            rejected.join("\n")
        );
    }
}

function readImageMeta(file){
return FTOSafety.loadImage(file).then(img=>({width:img.naturalWidth,height:img.naturalHeight,previewURL:URL.createObjectURL(file)}));
}

function renderImageList(){
    const list = document.getElementById("imageList");
    list.innerHTML = "";

    selectedImages.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "image-item";

        const preview = document.createElement("img");
        preview.className = "image-preview";
        preview.src = item.previewURL;
        preview.alt = "Preview of " + item.file.name;

        const details = document.createElement("div");
        details.className = "image-details";

        const name = document.createElement("div");
        name.className = "image-name";
        name.textContent =
            (index + 1) + ". " + item.file.name;

        const meta = document.createElement("div");
        meta.className = "image-meta";
        meta.textContent =
            item.width +
            "×" +
            item.height +
            " px • " +
            formatSize(item.file.size);

        details.appendChild(name);
        details.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "image-actions";

        const up = document.createElement("button");
        up.type = "button";
        up.textContent = "↑";
        up.title = "Move up";
        up.disabled = index === 0 || processing;
        up.onclick = () => moveImage(index, -1);

        const down = document.createElement("button");
        down.type = "button";
        down.textContent = "↓";
        down.title = "Move down";
        down.disabled =
            index === selectedImages.length - 1 ||
            processing;
        down.onclick = () => moveImage(index, 1);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Remove";
        remove.disabled = processing;
        remove.onclick = () => removeImage(index);

        actions.appendChild(up);
        actions.appendChild(down);
        actions.appendChild(remove);

        row.appendChild(preview);
        row.appendChild(details);
        row.appendChild(actions);

        list.appendChild(row);
    });
}

function moveImage(index, direction){
    const newIndex = index + direction;

    if(
        processing ||
        newIndex < 0 ||
        newIndex >= selectedImages.length
    ){
        return;
    }

    const temp = selectedImages[index];
    selectedImages[index] = selectedImages[newIndex];
    selectedImages[newIndex] = temp;

    invalidateOutput();
    renderImageList();
    updateState();
}

function removeImage(index){
    if(processing){
        return;
    }

    const item = selectedImages[index];

    if(item && item.previewURL){
        URL.revokeObjectURL(item.previewURL);
    }

    selectedImages.splice(index, 1);

    invalidateOutput();
    renderImageList();
    updateState();
}

function updateState(){
    const hasImages = selectedImages.length > 0;

    setSettingsDisabled(!hasImages);

    document.getElementById("createBtn").disabled =
        !hasImages || processing;

    const summary =
        document.getElementById("summaryCard");

    if(!hasImages){
        summary.style.display = "none";
        summary.textContent = "";

        document.getElementById("info").textContent = "";
        hidePlan();
        return;
    }

    const totalSize =
        selectedImages.reduce(
            (sum, item) => sum + item.file.size,
            0
        );

    summary.style.display = "block";
    summary.innerHTML =
        "Images: " + selectedImages.length +
        "<br>Total Size: " + formatSize(totalSize);

    document.getElementById("info").innerHTML =
        "Ready to create PDF" +
        "<br>Pages: " + selectedImages.length;

    updatePlan();
}

function updatePlan(){
    if(selectedImages.length === 0){
        hidePlan();
        return;
    }

    const pageSizeLabel =
        pageSizeSelect.options[
            pageSizeSelect.selectedIndex
        ].text;

    const orientationLabel =
        orientationSelect.options[
            orientationSelect.selectedIndex
        ].text;

    const marginLabel =
        marginSelect.options[
            marginSelect.selectedIndex
        ].text;

    const fitLabel =
        fitModeSelect.options[
            fitModeSelect.selectedIndex
        ].text;

    const box = document.getElementById("planBox");
    box.style.display = "block";

    box.innerHTML =
        "Output: " +
        selectedImages.length +
        (selectedImages.length === 1
            ? " PDF page"
            : " PDF pages") +
        "<br>Page Size: " + pageSizeLabel +
        "<br>Orientation: " + orientationLabel +
        "<br>Margin: " + marginLabel +
        "<br>Fit: " + fitLabel;
}

async function createPDF(){
    if(
        processing ||
        selectedImages.length === 0
    ){
        return;
    }

    invalidateOutput();

    processing = true;
    setProcessingState(true);

    const createBtn =
        document.getElementById("createBtn");

    createBtn.disabled = true;
    createBtn.textContent = "Creating...";

    showProgress(0, "Preparing PDF...");

    try{
        const pdf =
            await PDFLib.PDFDocument.create();

        pdf.setTitle("Images to PDF");
        pdf.setCreator("FreeToolsOnline");
        pdf.setProducer("FreeToolsOnline");

        const margin =
            Number(marginSelect.value);

        const fitMode =
            fitModeSelect.value;

        for(
            let index = 0;
            index < selectedImages.length;
            index++
        ){
            const item = selectedImages[index];

            showProgress(
                Math.round(
                    (index / selectedImages.length) * 100
                ),
                "Processing image " +
                (index + 1) +
                " of " +
                selectedImages.length
            );

            const embedded =
                await embedImage(pdf, item);

            const pageDimensions =
                getPageDimensions(item);

            const page =
                pdf.addPage(pageDimensions);

            const pageWidth = page.getWidth();
            const pageHeight = page.getHeight();

            const availableWidth =
                Math.max(1, pageWidth - margin * 2);

            const availableHeight =
                Math.max(1, pageHeight - margin * 2);

            const imageWidth = embedded.width;
            const imageHeight = embedded.height;

            let drawWidth;
            let drawHeight;

            if(fitMode === "cover"){
                const scale = Math.max(
                    availableWidth / imageWidth,
                    availableHeight / imageHeight
                );

                drawWidth = imageWidth * scale;
                drawHeight = imageHeight * scale;

            }else{
                const scale = Math.min(
                    availableWidth / imageWidth,
                    availableHeight / imageHeight
                );

                drawWidth = imageWidth * scale;
                drawHeight = imageHeight * scale;
            }

            const x =
                (pageWidth - drawWidth) / 2;

            const y =
                (pageHeight - drawHeight) / 2;

            if(fitMode === "cover")page.pushOperators(PDFLib.pushGraphicsState(),PDFLib.rectangle(margin,margin,pageWidth-margin*2,pageHeight-margin*2),PDFLib.clip(),PDFLib.endPath());
            page.drawImage(
                embedded.image,
                {
                    x,
                    y,
                    width:drawWidth,
                    height:drawHeight
                }
            );

            if(fitMode === "cover")page.pushOperators(PDFLib.popGraphicsState());
            await allowBrowserPaint();
        }

        showProgress(
            95,
            "Finalizing PDF..."
        );

        const bytes =
            await pdf.save();

        createdPDF =
            new Blob(
                [bytes],
                {type:"application/pdf"}
            );

        createdPDFName =
            createOutputFileName();

        document.getElementById("downloadBtn").disabled =
            false;

        createBtn.disabled = true;
        createBtn.textContent = "Created";

        showProgress(
            100,
            "Completed - " +
            selectedImages.length +
            (selectedImages.length === 1
                ? " page"
                : " pages")
        );

        document.getElementById("info").innerHTML =
            "PDF Created Successfully" +
            "<br>Pages: " + selectedImages.length +
            "<br>PDF Size: " +
            formatSize(createdPDF.size);

    }catch(error){
        console.error("Images to PDF error:", error);

        createdPDF = null;

        document.getElementById("downloadBtn").disabled =
            true;

        createBtn.disabled = false;
        createBtn.textContent = "Create PDF";

        hideProgress();

        document.getElementById("info").innerHTML =
            "Could not create the PDF.<br>" +
            "One of the images may be unsupported or too large.";

    }finally{
        processing = false;
        setProcessingState(false);
    }
}

async function embedImage(pdf, item){
    const type =
        getImageType(item.file);

    if(type === "jpg"){
        const bytes =
            await item.file.arrayBuffer();

        const image =
            await pdf.embedJpg(bytes);

        return {
            image,
            width:item.width,
            height:item.height
        };
    }

    if(type === "png"){
        const bytes =
            await item.file.arrayBuffer();

        const image =
            await pdf.embedPng(bytes);

        return {
            image,
            width:item.width,
            height:item.height
        };
    }

    if(type === "webp"){
        const pngBlob =
            await convertImageToPNG(item.file);

        const bytes =
            await pngBlob.arrayBuffer();

        const image =
            await pdf.embedPng(bytes);

        return {
            image,
            width:item.width,
            height:item.height
        };
    }

    throw new Error(
        "Unsupported image format: " +
        item.file.name
    );
}

function getImageType(file){
    if(
        file.type === "image/jpeg" ||
        /\.jpe?g$/i.test(file.name)
    ){
        return "jpg";
    }

    if(
        file.type === "image/png" ||
        /\.png$/i.test(file.name)
    ){
        return "png";
    }

    if(
        file.type === "image/webp" ||
        /\.webp$/i.test(file.name)
    ){
        return "webp";
    }

    return "";
}

function convertImageToPNG(file){
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const canvas =
                document.createElement("canvas");

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const context =
                canvas.getContext("2d");

            context.drawImage(
                img,
                0,
                0
            );

            canvas.toBlob(
                blob => {
                    URL.revokeObjectURL(url);

                    canvas.width = 1;
                    canvas.height = 1;

                    if(blob){
                        resolve(blob);
                    }else{
                        reject(
                            new Error(
                                "Could not convert WebP image."
                            )
                        );
                    }
                },
                "image/png"
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
                new Error(
                    "Could not decode WebP image."
                )
            );
        };

        img.src = url;
    });
}

function getPageDimensions(item){
    const pageSize =
        pageSizeSelect.value;

    let width;
    let height;

    if(pageSize === "a4"){
        width = 595.28;
        height = 841.89;

    }else if(pageSize === "letter"){
        width = 612;
        height = 792;

    }else{
        const maxAutoSide = 1440;
        const pxToPt = 0.75;

        width =
            item.width * pxToPt;

        height =
            item.height * pxToPt;

        const longest =
            Math.max(width, height);

        if(longest > maxAutoSide){
            const scale =
                maxAutoSide / longest;

            width *= scale;
            height *= scale;
        }

        const extraMargin=Number(marginSelect.value)*2;
        width = Math.max(72,width+extraMargin);
        height = Math.max(72,height+extraMargin);
    }

    const orientation =
        orientationSelect.value;

    if(orientation === "portrait" && width > height){
        [width, height] = [height, width];
    }

    if(orientation === "landscape" && height > width){
        [width, height] = [height, width];
    }

    if(
        orientation === "auto" &&
        pageSize !== "auto"
    ){
        const imageLandscape =
            item.width > item.height;

        if(
            imageLandscape &&
            height > width
        ){
            [width, height] =
                [height, width];
        }

        if(
            !imageLandscape &&
            width > height
        ){
            [width, height] =
                [height, width];
        }
    }

    return [width, height];
}

function createOutputFileName(){
    if(selectedImages.length === 0){
        return "images-to-pdf.pdf";
    }

    let baseName =
        selectedImages[0].file.name.replace(
            /\.(jpe?g|png|webp)$/i,
            ""
        );

    if(!baseName){
        baseName = "images";
    }

    return baseName + "-images-to-pdf.pdf";
}

function downloadPDF(){
    if(!createdPDF){
        alert("Please create the PDF first.");
        return;
    }

    revokeDownloadURL();

    downloadURL = URL.createObjectURL(createdPDF);

    const link = document.createElement("a");
    link.href = downloadURL;
    link.download = createdPDFName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    const successBox =
        document.getElementById("downloadSuccess");

    successBox.style.display = "block";
    successBox.textContent =
        "✓ PDF downloaded successfully.";

    successBox.scrollIntoView({
        behavior:"smooth",
        block:"nearest"
    });

    clearTimeout(window.imagesPdfSuccessTimer);

    window.imagesPdfSuccessTimer = setTimeout(() => {
        successBox.style.display = "none";
    }, 4000);

    setTimeout(revokeDownloadURL, 1500);
}

function invalidateOutput(){
    createdPDF = null;
    createdPDFName = "images-to-pdf.pdf";

    revokeDownloadURL();

    document.getElementById("downloadBtn").disabled =
        true;

    const createBtn =
        document.getElementById("createBtn");

    if(
        selectedImages.length &&
        !processing
    ){
        createBtn.disabled = false;
        createBtn.textContent = "Create PDF";
    }

    hideProgress();
}

function setSettingsDisabled(disabled){
    pageSizeSelect.disabled = disabled;
    orientationSelect.disabled = disabled;
    marginSelect.disabled = disabled;
    fitModeSelect.disabled = disabled;
}

function setProcessingState(isProcessing){
    imageInput.disabled = isProcessing;

    setSettingsDisabled(isProcessing);

    document.getElementById("clearBtn").disabled =
        isProcessing;

    renderImageList();
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

    document.getElementById("planBox").textContent =
        "";
}

function clearAll(){
    if(processing){
        return;
    }

    const successBox = document.getElementById("downloadSuccess");
    if(successBox){
        successBox.style.display = "none";
    }

    selectedImages.forEach(item => {
        if(item.previewURL){
            URL.revokeObjectURL(item.previewURL);
        }
    });

    selectedImages = [];
    createdPDF = null;
    createdPDFName = "images-to-pdf.pdf";

    revokeDownloadURL();

    imageInput.value = "";

    document.getElementById("imageList").innerHTML = "";

    document.getElementById("summaryCard").style.display =
        "none";

    document.getElementById("summaryCard").textContent = "";

    pageSizeSelect.value = "auto";
    orientationSelect.value = "auto";
    marginSelect.value = "36";
    fitModeSelect.value = "contain";

    setSettingsDisabled(true);

    document.getElementById("createBtn").disabled = true;
    document.getElementById("createBtn").textContent =
        "Create PDF";

    document.getElementById("downloadBtn").disabled =
        true;

    document.getElementById("info").textContent = "";

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
