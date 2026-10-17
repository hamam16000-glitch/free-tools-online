


const units={

length:["Meter","Kilometer","Centimeter","Mile"],

weight:["Kilogram","Gram","Pound"],

temperature:["Celsius","Fahrenheit"]

};



function updateUnits(){

let category=document.getElementById("category").value;

let from=document.getElementById("fromUnit");

let to=document.getElementById("toUnit");


from.innerHTML="";

to.innerHTML="";


units[category].forEach(function(unit){

from.innerHTML += `<option>${unit}</option>`;

to.innerHTML += `<option>${unit}</option>`;

});

}


updateUnits();



function convertUnit(){
const category=document.getElementById('category').value,raw=document.getElementById('value').value.trim(),value=Number(raw),from=document.getElementById('fromUnit').value,to=document.getElementById('toUnit').value;if(!raw||!Number.isFinite(value)||!units[category]?.includes(from)||!units[category]?.includes(to)){document.getElementById('result').textContent='Enter a valid value and units';return;}const factors={Meter:1,Kilometer:1000,Centimeter:0.01,Mile:1609.344,Kilogram:1,Gram:0.001,Pound:0.45359237};let result=category==='temperature'?(from===to?value:from==='Celsius'?value*9/5+32:(value-32)*5/9):value*factors[from]/factors[to];document.getElementById('result').textContent=Number.isFinite(result)?'Result: '+Number(result.toPrecision(12)):'Result outside numeric range';
}async function copyResult(){

    const result = document.getElementById("result").innerText;

    if(!result.trim()){
        return;
    }

    try{

        if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(result);
        }else{
            const temp = document.createElement("textarea");
            temp.value = result;
            temp.style.position = "fixed";
            temp.style.opacity = "0";

            document.body.appendChild(temp);
            temp.select();

            if(!document.execCommand("copy")){
                throw new Error("Copy failed");
            }

            temp.remove();
        }

        const box = document.getElementById("copySuccess");
        box.style.display = "block";

        clearTimeout(window.unitCopyTimer);

        window.unitCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    }catch(error){
        console.error("Copy error:", error);
    }
}



function clearConverter(){

document.getElementById("value").value="";

document.getElementById("result").innerHTML="";

const box=document.getElementById("copySuccess");
if(box) box.style.display="none";

}



