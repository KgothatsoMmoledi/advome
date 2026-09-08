// ===============================
// ADVOME CCMA ASSISTANT
// Version 1.0
// ===============================

const Case = {

    employer: "",

    employee: "",

    salary: 0,

    province: "",

    dismissalType: "",

    dismissalDate: "",

    yearsWorked: 0,

    evidence: [],

    witnesses: [],

    compensation: 0,

    strength: 0

};


// ===============================
// Progress Bar
// ===============================

let currentStep = 1;

const totalSteps = 6;

function nextStep() {

    if (currentStep >= totalSteps)
        return;

    currentStep++;

    updateProgress();

}

function previousStep() {

    if (currentStep <= 1)
        return;

    currentStep--;

    updateProgress();

}

function updateProgress() {

    const pills = document.querySelectorAll(".adv-progress__pill");

    pills.forEach((pill,index)=>{

        pill.classList.remove(
            "adv-progress__pill--completed",
            "adv-progress__pill--active",
            "adv-progress__pill--pending"
        );

        if(index+1<currentStep){

            pill.classList.add("adv-progress__pill--completed");

        }

        else if(index+1===currentStep){

            pill.classList.add("adv-progress__pill--active");

        }

        else{

            pill.classList.add("adv-progress__pill--pending");

        }

    });

}



// ===============================
// Compensation Calculator
// ===============================

function calculateCompensation(){

    let months = 0;

    switch(Case.dismissalType){

        case "misconduct":
            months = 6;
            break;

        case "incapacity":
            months = 8;
            break;

        case "retrenchment":
            months = 12;
            break;

        case "constructive":
            months = 12;
            break;

        case "automatic":
            months = 24;
            break;

        default:
            months = 0;

    }

    Case.compensation = Case.salary * months;

    updateCompensationCard();

}



function updateCompensationCard(){

    const amount=document.getElementById("compensationAmount");

    if(!amount)
        return;

    amount.innerHTML="R "+
    Number(Case.compensation).toLocaleString();

}



// ===============================
// Case Strength
// ===============================

function calculateStrength(){

    let score=0;

    if(Case.evidence.length>0)
        score+=20;

    if(Case.evidence.length>=3)
        score+=20;

    if(Case.witnesses.length>0)
        score+=20;

    if(Case.salary>0)
        score+=10;

    if(Case.dismissalType!=="")
        score+=15;

    if(Case.dismissalDate!=="")
        score+=15;

    Case.strength=score;

    updateStrength();

}



function updateStrength(){

    const bar=document.getElementById("strengthBar");

    const percent=document.getElementById("strengthPercent");

    if(!bar)
        return;

    bar.style.width=Case.strength+"%";

    percent.innerHTML=Case.strength+"%";

}



// ===============================
// Evidence
// ===============================

function addEvidence(type){

    if(Case.evidence.includes(type))
        return;

    Case.evidence.push(type);

    calculateStrength();

    renderEvidence();

}



function renderEvidence(){

    const list=document.getElementById("evidenceList");

    if(!list)
        return;

    list.innerHTML="";

    Case.evidence.forEach(item=>{

        list.innerHTML+=`

        <li class="adv-checklist__item adv-checklist__item--checked">

        <div class="adv-checklist__checkbox">

        ✓

        </div>

        <div>

        <div class="adv-checklist__text">

        ${item}

        </div>

        </div>

        </li>

        `;

    });

}



// ===============================
// Witnesses
// ===============================

function addWitness(){

    const name=document.getElementById("witnessName");

    if(!name)
        return;

    if(name.value==="")
        return;

    Case.witnesses.push(name.value);

    name.value="";

    calculateStrength();

}



// ===============================
// Deadline Calculator
// ===============================

function calculateDeadline(){

    if(Case.dismissalDate==="")
        return;

    const dismissal=new Date(Case.dismissalDate);

    const deadline=new Date(dismissal);

    deadline.setDate(deadline.getDate()+30);

    const output=document.getElementById("deadline");

    if(output){

        output.innerHTML=
        deadline.toLocaleDateString();

    }

}



// ===============================
// Save
// ===============================

function saveCase(){

    localStorage.setItem(

        "advomeCCMA",

        JSON.stringify(Case)

    );

}



// ===============================
// Load
// ===============================

function loadCase(){

    const saved=localStorage.getItem("advomeCCMA");

    if(saved){

        Object.assign(

            Case,

            JSON.parse(saved)

        );

        calculateCompensation();

        calculateStrength();

        renderEvidence();

    }

}



// ===============================
// AI Recommendation
// ===============================

function getRecommendation(){

    if(Case.strength>=90){

        return "Excellent case. Strong evidence available.";

    }

    if(Case.strength>=70){

        return "Good case. Consider obtaining additional documents.";

    }

    if(Case.strength>=50){

        return "Moderate case. Additional witnesses recommended.";

    }

    return "Weak case. Upload supporting evidence.";

}



// ===============================
// Auto Save
// ===============================

setInterval(saveCase,5000);

window.onload=()=>{

    loadCase();

    updateProgress();

};
