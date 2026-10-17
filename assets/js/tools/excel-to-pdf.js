
let workbook = null;
let selectedFile = null;
let generatedPDF = null;
let generatedName = "excel-to-pdf.pdf";
let processing = false;

const maxFileSize = 25 * 1024 * 1024;

const fileInput = document.getElementById("excelFile");
const dropZone = document.getElementById("dropZone");
const sheetSelect = document.getElementById("sheetSelect");
const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const fontSize = document.getElementById("fontSize");

fileInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    e.target.value = "";

    if(file){
        await loadExcel(file);
    }
});

dropZone.addEventListener("dragover", e => {
    e.preventDefault();

    if(!processing){
        dropZone.classList.add("dragover");
    }
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    if(processing){
        return;
    }

    const file = e.dataTransfer.files[0];

    if(file){
        await loadExcel(file);
    }
});

[sheetSelect,pageSize,orientation,fontSize].forEach(control => {
    control.addEventListener("change", resetOutput);
});

async function loadExcel(file){

    if(processing){
        return;
    }

    const valid =
        /\.(xlsx|xls)$/i.test(file.name);

    if(!valid){
        alert("Please choose an XLSX or XLS file.");
        return;
    }

    if(file.size > maxFileSize){
        alert("The Excel file must be 25 MB or smaller.");
        return;
    }

    clearWorkbookOnly();

    document.getElementById("info").textContent =
        "Reading Excel file...";

    try{

        const data = await file.arrayBuffer();

        workbook = XLSX.read(data,{
            type:"array",
            cellDates:true
        });

        if(!workbook.SheetNames.length){
            throw new Error("Workbook contains no worksheets.");
        }

        selectedFile = file;

        buildSheetOptions();

        document.getElementById("fileCard").style.display =
            "block";

        document.getElementById("fileCard").innerHTML =
            "<strong>" + escapeHTML(file.name) + "</strong>" +
            "<br>File Size: " + formatSize(file.size) +
            "<br>Worksheets: " + workbook.SheetNames.length;

        updateSheetInfo();
        setControlsDisabled(false);

        document.getElementById("convertBtn").disabled = false;
        document.getElementById("resetBtn").disabled = false;

        document.getElementById("info").textContent =
            "Ready to convert.";

    }catch(error){

        console.error(error);

        clearWorkbookOnly();

        document.getElementById("info").textContent =
            "Could not read this Excel file.";
    }
}

function buildSheetOptions(){

    sheetSelect.innerHTML =
        '<option value="all">All worksheets</option>';

    workbook.SheetNames.forEach((name,index) => {

        const option = document.createElement("option");

        option.value = String(index);
        option.textContent = name;

        sheetSelect.appendChild(option);
    });
}

sheetSelect.addEventListener("change", updateSheetInfo);

function updateSheetInfo(){

    if(!workbook){
        return;
    }

    const box = document.getElementById("sheetBox");
    box.style.display = "block";

    if(sheetSelect.value === "all"){

        box.innerHTML =
            "<strong>Worksheets to convert:</strong><br>" +
            workbook.SheetNames.map(escapeHTML).join("<br>");

    }else{

        const name =
            workbook.SheetNames[Number(sheetSelect.value)];

        const rows =
            XLSX.utils.sheet_to_json(
                workbook.Sheets[name],
                {
                    header:1,
                    defval:"",
                    raw:false
                }
            );

        let maxColumns = 0;

        rows.forEach(row => {
            maxColumns =
                Math.max(maxColumns,row.length);
        });

        box.innerHTML =
            "<strong>Selected worksheet:</strong> " +
            escapeHTML(name) +
            "<br>Rows: " + rows.length +
            "<br>Columns: " + maxColumns;
    }
}

async function convertPDF(){

    if(processing || !workbook){
        return;
    }

    resetOutput();

    processing = true;
    setProcessing(true);

    const convertBtn =
        document.getElementById("convertBtn");

    convertBtn.textContent = "Converting...";

    showProgress(0,"Preparing workbook...");

    try{

        const {jsPDF} = window.jspdf;

        const pdf = new jsPDF({
            orientation:orientation.value,
            unit:"pt",
            format:pageSize.value
        });
 await FTOSafety.pdfFonts(pdf);

        const selectedNames =
            sheetSelect.value === "all"
                ? workbook.SheetNames
                : [
                    workbook.SheetNames[
                        Number(sheetSelect.value)
                    ]
                ];

        let addedContent = false;

        for(let i=0;i<selectedNames.length;i++){

            const name = selectedNames[i];
            const sheet = workbook.Sheets[name];

            showProgress(
                Math.round((i / selectedNames.length) * 90),
                "Processing worksheet " +
                (i + 1) +
                " of " +
                selectedNames.length
            );

            const rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        header:1,
                        defval:"",
                        raw:false
                    }
                );

            while(
                rows.length &&
                rows[rows.length - 1].every(
                    cell => String(cell).trim() === ""
                )
            ){
                rows.pop();
            }

            if(addedContent){
                pdf.addPage();
            }

            pdf.setFontSize(14);
            pdf.text(
                sanitizeText(name),
                40,
                38
            );

            if(rows.length === 0){

                pdf.setFontSize(10);
                pdf.text(
                    "This worksheet is empty.",
                    40,
                    62
                );

            }else{

                const columnCount =
                    rows.reduce((max,row)=>Math.max(max,row.length),1);

                const normalizedRows =
                    rows.map(row => {

                        const output = [];

                        for(let c=0;c<columnCount;c++){
                            output.push(
                                sanitizeText(
                                    row[c] == null
                                        ? ""
                                        : String(row[c])
                                )
                            );
                        }

                        return output;
                    });

                const head =
                    normalizedRows.length
                        ? [normalizedRows[0]]
                        : [];

                const body =
                    normalizedRows.length > 1
                        ? normalizedRows.slice(1)
                        : [];

                pdf.autoTable({
                    startY:52,
                    head,
                    body,
                    theme:"grid",
                    styles:{
                        font:"FTOSans",
                        fontSize:Number(fontSize.value),
                        cellPadding:3,
                        overflow:"linebreak",
                        valign:"middle"
                    },
                    headStyles:{
                        fontStyle:"bold"
                    },
                    margin:{
                        left:30,
                        right:30,
                        bottom:30
                    },
                    horizontalPageBreak:true,
                    horizontalPageBreakRepeat:0,
                    showHead:"everyPage"
                });
            }

            addedContent = true;

            await allowBrowserPaint();
        }

        generatedPDF = pdf;

        generatedName =
            createOutputName(selectedFile.name);

        showProgress(100,"Conversion completed.");

        document.getElementById("downloadBtn").disabled =
            false;

        document.getElementById("info").innerHTML =
            "Excel converted to PDF successfully." +
            "<br>Worksheets: " +
            selectedNames.length +
            "<br>PDF Pages: " +
            pdf.getNumberOfPages();

        convertBtn.textContent = "Converted";

    }catch(error){

        console.error("Excel to PDF error:",error);

        generatedPDF = null;

        hideProgress();

        document.getElementById("info").textContent =
            "Could not convert this Excel file to PDF.";

        convertBtn.textContent = "Convert to PDF";

    }finally{

        processing = false;
        setProcessing(false);

        if(!generatedPDF){
            convertBtn.disabled = !workbook;
        }
    }
}

function downloadPDF(){
if(!generatedPDF){document.getElementById('info').textContent='Convert the current spreadsheet first.';return;}FTOSafety.downloadBlob(generatedPDF.output('blob'),generatedName);document.getElementById('downloadSuccess').style.display='block';document.getElementById('downloadSuccess').textContent='PDF download requested.';
}

function resetOutput(){

    generatedPDF = null;

    document.getElementById("downloadBtn").disabled =
        true;

    const success =
        document.getElementById("downloadSuccess");

    success.style.display = "none";

    hideProgress();

    const convertBtn =
        document.getElementById("convertBtn");

    convertBtn.textContent = "Convert to PDF";
    convertBtn.disabled = !workbook || processing;

    if(workbook && !processing){
        document.getElementById("info").textContent =
            "Ready to convert.";
    }
}

function clearAll(){

    if(processing){
        return;
    }

    workbook = null;
    selectedFile = null;
    generatedPDF = null;
    generatedName = "excel-to-pdf.pdf";

    fileInput.value = "";

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("fileCard").innerHTML = "";

    document.getElementById("sheetBox").style.display =
        "none";

    document.getElementById("sheetBox").innerHTML = "";

    document.getElementById("info").textContent = "";

    document.getElementById("downloadSuccess").style.display =
        "none";

    sheetSelect.innerHTML =
        '<option value="all">All worksheets</option>';

    pageSize.value = "a4";
    orientation.value = "landscape";
    fontSize.value = "8";

    setControlsDisabled(true);

    document.getElementById("convertBtn").disabled = true;
    document.getElementById("convertBtn").textContent =
        "Convert to PDF";

    document.getElementById("downloadBtn").disabled = true;
    document.getElementById("resetBtn").disabled = true;

    hideProgress();
}

function clearWorkbookOnly(){

    workbook = null;
    selectedFile = null;
    generatedPDF = null;

    document.getElementById("fileCard").style.display =
        "none";

    document.getElementById("sheetBox").style.display =
        "none";

    document.getElementById("downloadBtn").disabled =
        true;

    setControlsDisabled(true);
    hideProgress();
}

function setControlsDisabled(disabled){

    sheetSelect.disabled = disabled;
    pageSize.disabled = disabled;
    orientation.disabled = disabled;
    fontSize.disabled = disabled;
}

function setProcessing(state){

    fileInput.disabled = state;

    sheetSelect.disabled = state;
    pageSize.disabled = state;
    orientation.disabled = state;
    fontSize.disabled = state;

    document.getElementById("clearBtn").disabled = state;
    document.getElementById("resetBtn").disabled = state;

    if(state){
        document.getElementById("downloadBtn").disabled =
            true;
    }else if(workbook){
        setControlsDisabled(false);
        document.getElementById("resetBtn").disabled =
            false;
    }
}

function showProgress(percent,text){

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

function createOutputName(name){

    const base =
        name.replace(/\.(xlsx|xls)$/i,"") ||
        "excel";

    return base + "-to-pdf.pdf";
}

function sanitizeText(value){

    return String(value)
        .replace(/\u0000/g,"")
        .replace(/\r\n/g,"\n")
        .replace(/\r/g,"\n");
}

function escapeHTML(value){

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
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
    return new Promise(resolve => setTimeout(resolve,0));
}
