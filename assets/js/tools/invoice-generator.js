

let logoData="";
let itemCounter=0,logoJob=0;

function val(id){
    return document.getElementById(id)?.value.trim() || "";
}

function num(value){
    const n=parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}

function money(value){
    return val("currency") + Number(value).toFixed(2);
}

function formatDate(value){
    if(!value) return "-";

    const parts=value.split("-");
    if(parts.length!==3) return value;

    const d=new Date(
        Number(parts[0]),
        Number(parts[1])-1,
        Number(parts[2])
    );

    return d.toLocaleDateString("en-US",{
        year:"numeric",
        month:"short",
        day:"numeric"
    });
}

function loadLogo(event){
const job=++logoJob,file=event.target.files[0];logoData='';updatePreview();if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){showStatus('Choose a PNG, JPEG or WebP logo up to 2 MB.');event.target.value='';return;}const reader=new FileReader();reader.onload=e=>{if(job!==logoJob)return;logoData=e.target.result;updatePreview();};reader.onerror=()=>showStatus('Logo could not be read.');reader.readAsDataURL(file);
}

function addItem(data={}){

    itemCounter++;

    const card=document.createElement("div");
    card.className="item-card";

    card.innerHTML=`
        <label>Item Description</label>
        <input class="item-desc" placeholder="Website Design" value="${escapeHTML(data.description || "")}" oninput="updatePreview()">

        <div class="three">

            <div>
                <label>Quantity</label>
                <input class="item-qty" type="number" min="0" step="1" value="${data.quantity ?? 1}" oninput="updatePreview()">
            </div>

            <div>
                <label>Rate</label>
                <input class="item-rate" type="number" min="0" step="0.01" value="${data.rate ?? 0}" oninput="updatePreview()">
            </div>

            <div>
                <label>Amount</label>
                <input class="item-total" value="0.00" readonly>
            </div>

        </div>

        <button type="button" class="danger remove-btn"
        onclick="this.parentElement.remove();updatePreview()">
        Remove
        </button>
    `;

    document.getElementById("itemsList").appendChild(card);

    updatePreview();
}

function escapeHTML(text){
    return String(text)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function updatePreview(){

    document.getElementById("pBusinessName").textContent=
        val("businessName") || "Your Company";

    document.getElementById("pBusinessDetails").textContent=
        val("businessDetails") || "Business details";

    document.getElementById("pClientName").textContent=
        val("clientName") || "Client Name";

    document.getElementById("pClientDetails").textContent=
        val("clientDetails") || "Client details";

    document.getElementById("pInvoiceNumber").textContent=
        val("invoiceNumber") || "INV-001";

    document.getElementById("pInvoiceDate").textContent=
        formatDate(val("invoiceDate"));

    document.getElementById("pDueDate").textContent=
        formatDate(val("dueDate"));

    document.getElementById("pNotes").textContent=
        val("notes") || "Thank you for your business.";

    const logo=document.getElementById("previewLogo");

    if(logoData){
        logo.src=logoData;
        logo.style.display="block";
    }else{
        logo.removeAttribute("src");
        logo.style.display="none";
    }

    const tbody=document.getElementById("pItems");
    tbody.innerHTML="";

    let subtotal=0;

    document.querySelectorAll("#itemsList .item-card").forEach(card=>{

        const description=
            card.querySelector(".item-desc").value.trim() || "Item";

        const quantity=
            Math.max(0,num(card.querySelector(".item-qty").value));

        const rate=
            Math.max(0,num(card.querySelector(".item-rate").value));

        const amount=Math.round(quantity*rate*100)/100;

        subtotal+=amount;

        card.querySelector(".item-total").value=
            amount.toFixed(2);

        const tr=document.createElement("tr");

        [description,quantity,money(rate),money(amount)]
        .forEach(text=>{
            const td=document.createElement("td");
            td.textContent=text;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    if(!tbody.children.length){
        const tr=document.createElement("tr");
        tr.innerHTML='<td>Item</td><td>1</td><td>'+money(0)+'</td><td>'+money(0)+'</td>';
        tbody.appendChild(tr);
    }

    const taxPercent=
        Math.max(0,num(val("tax")));

    const discountValue=
        Math.max(0,num(val("discount")));

    const discountType =
        document.getElementById("discountType").value;



    let discountAmount=0;

    if(discountType==="percent"){

        discountAmount=
            subtotal*(Math.min(100,discountValue)/100);

    }else{

        discountAmount=
            Math.min(subtotal,discountValue);

    }

    const taxAmount=Math.round((subtotal-discountAmount)*(taxPercent/100)*100)/100;
    const total=Math.max(0,subtotal+taxAmount-discountAmount);

    document.getElementById("pSubtotal").textContent=
        money(subtotal);

    document.getElementById("pTaxLabel").textContent=
        "Tax ("+taxPercent+"%)";

    document.getElementById("pTax").textContent=
        money(taxAmount);

    let discountLabel="";

    if(discountType==="percent"){

        discountLabel=
            "Discount ("+Math.min(100,discountValue)+"%)";

    }else{

        discountLabel=
            "Discount ("+money(discountValue)+")";

    }


    document.getElementById("pDiscountLabel").textContent=
        discountLabel;

    document.getElementById("pDiscount").textContent=
        "-"+money(discountAmount);

    document.getElementById("pTotal").textContent=
        money(total);
}

function showStatus(message){

    const box=document.getElementById("status");

    box.textContent=message;
    box.style.display="block";

    clearTimeout(window.invoiceStatusTimer);

    window.invoiceStatusTimer=setTimeout(()=>{
        box.style.display="none";
    },4000);
}

async function downloadPDF(){
try{updatePreview();showStatus('Creating PDF…');const pdf=new jspdf.jsPDF({unit:'pt',format:'a4'});await FTOSafety.pdfFonts(pdf);let y=50;const add=(text,size=11,bold=false)=>{text=String(text||'');if(!text.trim())return;if(bold&&y>740){pdf.addPage();y=50;}pdf.setFont('FTOSans',bold?'bold':'normal');pdf.setFontSize(size);for(const line of pdf.splitTextToSize(text,495)){if(y>785){pdf.addPage();y=50;}const rtl=/[\u0600-\u06ff]/.test(line);pdf.text(line,rtl?545:50,y,{align:rtl?'right':'left'});y+=size*1.4;}y+=6;};
add(val('businessName')||'Business',20,true);add(val('businessDetails'));if(logoData){try{const p=pdf.getImageProperties(logoData),w=60,h=Math.min(60,w*p.height/p.width);if(y+h>780){pdf.addPage();y=50;}pdf.addImage(logoData,undefined,50,y,w,h);y+=h+12;}catch(e){throw Error('Logo cannot be included. Remove it or choose a PNG/JPEG image.');}}
add('INVOICE '+(val('invoiceNumber')||''),16,true);add('Invoice date: '+formatDate(val('invoiceDate'))+'    Due date: '+formatDate(val('dueDate')));add('Bill to: '+(val('clientName')||'Client'),12,true);add(val('clientDetails'));
const rows=[...document.querySelectorAll('#itemsList .item-card')].map(card=>{const qty=Math.max(0,num(card.querySelector('.item-qty').value)),rate=Math.max(0,num(card.querySelector('.item-rate').value)),amount=Math.round(qty*rate*100)/100;if(!Number.isFinite(amount))throw Error('An item amount is too large.');return[card.querySelector('.item-desc').value.trim()||'Item',String(qty),money(rate),money(amount)];});if(rows.length>1000)throw Error('Use up to 1,000 invoice items.');
pdf.autoTable({startY:y,head:[['Description','Quantity','Rate','Amount']],body:rows.length?rows:[['Item','1',money(0),money(0)]],styles:{font:'FTOSans',fontSize:10,overflow:'linebreak',cellPadding:6},headStyles:{fontStyle:'bold',fillColor:[30,64,175]},margin:{left:50,right:50,top:50,bottom:50},columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right'}}});y=pdf.lastAutoTable.finalY+24;
for(const [label,id]of [['Subtotal','pSubtotal'],[document.getElementById('pDiscountLabel').textContent,'pDiscount'],[document.getElementById('pTaxLabel').textContent,'pTax'],['Total','pTotal']])add(label+': '+document.getElementById(id).textContent,12,id==='pTotal');add('Method: discount before tax. Check applicable invoice and tax requirements.',9);add(val('notes'));FTOSafety.downloadBlob(pdf.output('blob'),FTOSafety.fileName(val('invoiceNumber'),'invoice','.pdf'));showStatus('PDF download requested. Review totals and page breaks.');}catch(e){showStatus('Cannot create PDF: '+e.message);}
}

function clearInvoice(){
    logoJob++;

    document.getElementById("businessName").value="";
    document.getElementById("businessDetails").value="";
    document.getElementById("clientName").value="";
    document.getElementById("clientDetails").value="";
    document.getElementById("invoiceNumber").value="INV-001";
    document.getElementById("tax").value="0";
    document.getElementById("discount").value="0";
    document.getElementById("notes").value="";
    document.getElementById("currency").value="$";
    document.getElementById("logoInput").value="";

    logoData="";

    setDefaultDates();

    document.getElementById("itemsList").innerHTML="";

    addItem();

    updatePreview();
}

function localISODate(date){

    const year=date.getFullYear();

    const month=
        String(date.getMonth()+1).padStart(2,"0");

    const day=
        String(date.getDate()).padStart(2,"0");

    return `${year}-${month}-${day}`;
}

function setDefaultDates(){

    const today=new Date();

    const due=new Date(today);

    due.setDate(due.getDate()+30);

    document.getElementById("invoiceDate").value=
        localISODate(today);

    document.getElementById("dueDate").value=
        localISODate(due);
}

setDefaultDates();

addItem({
    description:"",
    quantity:1,
    rate:0
});

updatePreview();

