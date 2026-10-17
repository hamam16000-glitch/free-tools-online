


const daySelect =
    document.getElementById("birthDay");

const monthSelect =
    document.getElementById("birthMonth");

const yearSelect =
    document.getElementById("birthYear");

for(let day = 1; day <= 31; day++){
    const option =
        document.createElement("option");

    option.value = day;
    option.textContent = day;

    daySelect.appendChild(option);
}

const currentYear =
    new Date().getFullYear();

for(let year = currentYear; year >= 1900; year--){
    const option =
        document.createElement("option");

    option.value = year;
    option.textContent = year;

    yearSelect.appendChild(option);
}

function calculateAge(){
 document.getElementById("result").textContent="";

    const day =
        Number(daySelect.value);

    const month =
        Number(monthSelect.value);

    const year =
        Number(yearSelect.value);

    if(!day || !month || !year){
        alert("Please select your complete birth date");
        return;
    }

    const birthDate =
        new Date(
            year,
            month - 1,
            day
        );

    if(
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
    ){
        alert("Please select a valid birth date");
        return;
    }

    const today =
        new Date();

    today.setHours(0,0,0,0);
    birthDate.setHours(0,0,0,0);

    if(birthDate > today){
        alert("Birth date cannot be in the future");
        return;
    }

    function anniversary(count){const x=new Date(birthDate);x.setDate(1);x.setMonth(birthDate.getMonth()+count);const last=new Date(x);last.setMonth(last.getMonth()+1);last.setDate(0);x.setDate(Math.min(day,last.getDate()));return x;}
    let completeMonths=(today.getFullYear()-year)*12+today.getMonth()-(month-1);
    if(anniversary(completeMonths)>today)completeMonths--;
    let years=Math.floor(completeMonths/12),months=completeMonths%12;
    let anchor=anniversary(completeMonths),days=Math.round((Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())-Date.UTC(anchor.getFullYear(),anchor.getMonth(),anchor.getDate()))/86400000);
    document.getElementById("result").innerHTML =
        "Your Age: " +
        years + (years===1?" Year, ":" Years, ") +
        months + (months===1?" Month, ":" Months, ") +
        days + (days===1?" Day":" Days");
}

function clearAge(){
    daySelect.value = "";
    monthSelect.value = "";
    yearSelect.value = "";

    document.getElementById("result").innerHTML =
        "";
}

