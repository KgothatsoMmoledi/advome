/**
 * ============================================================
 * ADVOME MATTER MANAGER
 * Version: 2.0.0
 * Author: Advome
 * ============================================================
 *
 * Central storage engine for every legal matter.
 *
 * Each matter contains:
 *
 * Applicant
 * Employer / Respondent
 * Timeline
 * Evidence
 * AI Analysis
 * Generated Documents
 * Deadlines
 * Progress
 *
 * ============================================================
 */

(function () {

"use strict";

const STORAGE_KEY = "advome_matters";
const CURRENT_KEY = "advome_current_matter";

class MatterManager {

    constructor(){

        this.matters=this.loadAll();

    }

    //----------------------------------------
    // Storage
    //----------------------------------------

    loadAll(){

        try{

            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        }

        catch{

            return [];

        }

    }

    saveAll(){

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(this.matters)

        );

    }

    //----------------------------------------
    // Matter ID
    //----------------------------------------

    generateID(){

        const year=new Date().getFullYear();

        const number=String(this.matters.length+1)

            .padStart(6,"0");

        return `ADV-${year}-${number}`;

    }

    //----------------------------------------
    // Create Matter
    //----------------------------------------

    create(type="ccma"){

        const matter={

            id:this.generateID(),

            created:new Date().toISOString(),

            updated:new Date().toISOString(),

            type:type,

            status:"Draft",

            applicant:{},

            respondent:{},

            employment:{},

            timeline:[],

            evidence:[],

            ai:{},

            documents:[],

            deadlines:[],

            progress:{

                percent:0,

                completedSteps:[]

            }

        };

        this.matters.push(matter);

        this.saveAll();

        this.setCurrent(matter.id);

        return matter;

    }

    //----------------------------------------
    // Current Matter
    //----------------------------------------

    setCurrent(id){

        localStorage.setItem(CURRENT_KEY,id);

    }

    currentID(){

        return localStorage.getItem(CURRENT_KEY);

    }

    current(){

        return this.find(

            this.currentID()

        );

    }

    //----------------------------------------
    // Find Matter
    //----------------------------------------

    find(id){

        return this.matters.find(

            m=>m.id===id

        );

    }

    //----------------------------------------
    // Save Matter
    //----------------------------------------

    save(matter){

        matter.updated=new Date().toISOString();

        const index=this.matters.findIndex(

            m=>m.id===matter.id

        );

        if(index>-1){

            this.matters[index]=matter;

            this.saveAll();

        }

    }

    //----------------------------------------
    // Applicant
    //----------------------------------------

    updateApplicant(data){

        const matter=this.current();

        if(!matter) return;

        matter.applicant={

            ...matter.applicant,

            ...data

        };

        this.save(matter);

    }

    //----------------------------------------
    // Respondent
    //----------------------------------------

    updateRespondent(data){

        const matter=this.current();

        if(!matter) return;

        matter.respondent={

            ...matter.respondent,

            ...data

        };

        this.save(matter);

    }

    //----------------------------------------
    // Employment
    //----------------------------------------

    updateEmployment(data){

        const matter=this.current();

        if(!matter) return;

        matter.employment={

            ...matter.employment,

            ...data

        };

        this.save(matter);

    }

    //----------------------------------------
    // Timeline
    //----------------------------------------

    addTimelineEvent(event){

        const matter=this.current();

        if(!matter) return;

        matter.timeline.push({

            id:Date.now(),

            ...event

        });

        matter.timeline.sort(

            (a,b)=>new Date(a.date)-new Date(b.date)

        );

        this.save(matter);

    }

    removeTimelineEvent(id){

        const matter=this.current();

        if(!matter) return;

        matter.timeline=

            matter.timeline.filter(

                e=>e.id!==id

            );

        this.save(matter);

    }

    //----------------------------------------
    // Evidence
    //----------------------------------------

    addEvidence(file){

        const matter=this.current();

        if(!matter) return;

        matter.evidence.push(file);

        this.save(matter);

    }

    //----------------------------------------
    // AI
    //----------------------------------------

    saveAnalysis(type,result){

        const matter=this.current();

        if(!matter) return;

        matter.ai[type]=result;

        this.save(matter);

    }

    //----------------------------------------
    // Documents
    //----------------------------------------

    addDocument(doc){

        const matter=this.current();

        if(!matter) return;

        matter.documents.push(doc);

        this.save(matter);

    }

    //----------------------------------------
    // Deadlines
    //----------------------------------------

    addDeadline(deadline){

        const matter=this.current();

        if(!matter) return;

        matter.deadlines.push(deadline);

        this.save(matter);

    }

    //----------------------------------------
    // Progress
    //----------------------------------------

    completeStep(step){

        const matter=this.current();

        if(!matter) return;

        if(!matter.progress.completedSteps.includes(step)){

            matter.progress.completedSteps.push(step);

        }

        matter.progress.percent=Math.round(

            (

                matter.progress.completedSteps.length

                /

                12

            )*100

        );

        this.save(matter);

    }

    //----------------------------------------
    // Delete
    //----------------------------------------

    delete(id){

        this.matters=this.matters.filter(

            m=>m.id!==id

        );

        this.saveAll();

    }

}

window.AdvomeMatter=new MatterManager();

})();
