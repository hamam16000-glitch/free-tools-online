
let excelBlob=null,excelJob=0,outputFileName='converted-file.xlsx';
document.getElementById('pdfFile').addEventListener('change',function(){excelJob++;excelBlob=null;const file=this.files[0];document.getElementById('fileName').textContent=file?file.name:'No file selected';document.getElementById('status').textContent='';document.getElementById('downloadSuccess').style.display='none';outputFileName=file?(file.name.replace(/\.pdf$/i,'')||'converted-file')+'.xlsx':'converted-file.xlsx';});
async function convertExcel(){
 const file=document.getElementById('pdfFile').files[0],status=document.getElementById('status'),job=++excelJob;excelBlob=null;
 if(!file){status.textContent='Please select a PDF file.';return;}if(file.size>50*1024*1024){status.textContent='Maximum PDF size is 50 MB.';return;}
 let parsedPDF;try{
  if(typeof pdfjsLib==='undefined'||typeof XLSX==='undefined')throw new Error('Required PDF/Excel library did not load.');
  status.textContent='Extracting text fragments...';const pdf=parsedPDF=await pdfjsLib.getDocument(FTOSafety.pdfOptions({data:await file.arrayBuffer()})).promise,rows=[['Page','Text']];
  for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),content=await page.getTextContent();for(const item of content.items)if(typeof item.str==='string'&&item.str.trim())rows.push([i,item.str]);}
  if(job!==excelJob)return;if(rows.length===1){status.textContent='No embedded text found. Scanned PDFs need OCR first.';return;}
  const workbook=XLSX.utils.book_new(),sheet=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(workbook,sheet,'PDF Text');const output=XLSX.write(workbook,{bookType:'xlsx',type:'array'});excelBlob=new Blob([output],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});status.textContent='Excel created with page numbers and text fragments. Table columns are not reconstructed.';
 }catch(error){if(job===excelJob){excelBlob=null;status.textContent='Could not create Excel file: '+error.message;}}finally{if(parsedPDF)await parsedPDF.destroy();}
}
function downloadExcel(){if(!excelBlob){document.getElementById('status').textContent='Convert the current PDF successfully first.';return;}const url=URL.createObjectURL(excelBlob),a=document.createElement('a');a.href=url;a.download=outputFileName;document.body.appendChild(a);a.click();a.remove();document.getElementById('downloadSuccess').style.display='block';setTimeout(()=>URL.revokeObjectURL(url),1500);}
