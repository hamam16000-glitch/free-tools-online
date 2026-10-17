

const searchInput = document.getElementById("toolSearch");

if(searchInput){

searchInput.addEventListener("input", function(){

const query = this.value.toLowerCase().trim();

const cards = document.querySelectorAll(".tool-card");
const sections = document.querySelectorAll("h2");

let found = 0;

cards.forEach(card => {

const text = card.textContent.toLowerCase();

if(text.includes(query)){

card.style.display="block";
found++;

}else{

card.style.display="none";

}

});


document.querySelectorAll("h2").forEach(title=>{

title.style.display = query ? "none" : "block";

});


let noResults=document.getElementById("noResults");

if(noResults){

noResults.style.display = found ? "none" : "block";

}

});

}

