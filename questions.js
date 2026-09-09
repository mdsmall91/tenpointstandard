'use strict';

/* =============================================================
   THE FORTY QUESTIONS — the single source, for every surface
   =============================================================

   Order, titles, weights, documents and question wording per Field
   Guide v2 (July 2026). Copy verbatim from the design handoff.

   This file exists on its own because more than one interface now
   asks these questions: the Full Assessment at /standard/, the card
   board at /standard/play/, and the scorecard, which reads the titles
   back out of a shared link. The board shipped with its own copied
   snapshot of this array. It matched on the day it arrived, and it
   would have gone on matching right up until somebody edited one
   question in one place, at which point two interfaces would quietly
   be running different assessments and the scores would stop meaning
   the same thing.

   So there is one array and everything reads it. Load this file
   BEFORE app.js on any page that needs either.
   ============================================================= */

var POINTS = [
  { n: '01', title: 'Property Details', pts: 3, max: 12, docs: 'Survey & Basemap · Site Constraints Documented · Infrastructure Master Plan · Site Analysis Plan',
    qs: ['Do you have a legal boundary and a plan of current site conditions?',
         'Do you know the challenges: wetlands, easements, soils, access?',
         'Is there a plan for water, sanitary, power, and stormwater?',
         'Do you know what makes the site special, and how weather, seasons, and access shape it?'] },
  { n: '02', title: 'Capital Strategy', pts: 4, max: 16, docs: 'Funding Strategy · Land Strategy · Cash Flow Model · Financial Partner Review',
    qs: ['Do you know whether you need outside investment, and do you have the required equity?',
         'Do you control the land, and do you know what is time-critical about your position?',
         'Have you modeled cash flow for every phase, and stress-tested the variables?',
         'Have lending partners or outside financial representatives reviewed the plan?'] },
  { n: '03', title: 'Regulatory Approvals', pts: 3, max: 12, docs: 'Zoning Review · Entitlement Strategy · Development Approval Matrix · Permit Checklist',
    qs: ['Do you know the zoning, and do you have use-by-right?',
         'If the use is non-conforming, do you know what compliance requires, and how long?',
         'Do you know what approvals govern site development and construction on the property?',
         'Do you know which permits you anticipate, and the process to obtain them?'] },
  { n: '04', title: 'Guest Experience', pts: 3, max: 12, docs: 'Target Market Analysis · Competition Analysis · Experience Framework Plan · Guest Experience Framework Plan',
    qs: ['Do you know your target guest, and do they already come to the area?',
         'Do you know why they will choose you over options they already have?',
         'Do you know which experiences are must-haves for your guests?',
         'Do you know how your planned amenities map to the guest experience?'] },
  { n: '05', title: 'Design', pts: 2, max: 8, docs: 'Subconsultant Alignment · Brand Strategy · Construction Documents & Specifications · Safety, Code Compliance & Constructability Review',
    qs: ['Do you know which design professionals you need for regulatory compliance?',
         'Does the design champion the brand and the guest experience?',
         'Are the drawings detailed enough to build from, and to hold construction to?',
         'Is the design constructable, safe, cost-effective, and code-compliant?'] },
  { n: '06', title: 'Procurement', pts: 2, max: 8, docs: 'Long-lead Procurement Plan · Vendor Prequalification · Site Logistics Matrix · Responsibility Matrix',
    qs: ['Is every long-lead item identified, and locked in with deposits?',
         'Are vendors vetted for capacity, financial stability, and track record on resorts like yours?',
         'Do you know where materials are staged, and how delivery is sequenced against installation?',
         'Do you know what you buy direct versus through the contractor, with handoffs documented?'] },
  { n: '07', title: 'Schedule', pts: 2, max: 8, docs: 'CMP Baseline Schedule · Schedule Risk Analysis · Integrated Procurement Schedule · Float Analysis & Schedule Compression',
    qs: ['Do you have milestones, and are they tied to funding or closing?',
         'Do you know what else sits on the critical path: approvals, construction, commissioning?',
         'Do you know which materials, supplies, and units carry long lead times?',
         'Does the build duration reconcile with lead times, weather windows, and opening day?'] },
  { n: '08', title: 'Cost Certainty', pts: 2, max: 8, docs: 'Budget Analysis · Independent Cost Validation · Contingency & Risk Allocation · Cost Reporting & Variance Tracking',
    qs: ['Is the budget a detailed breakdown of hard and soft costs, including regulatory fees?',
         'Has a third party validated how the budget was built and its assumptions?',
         'Are you carrying a contingency, and do you know your biggest risks in the model?',
         'Is the budget updated regularly, tracking projected against actual?'] },
  { n: '09', title: 'Quality Assurance', pts: 1, max: 4, docs: 'Dedicated Project Management · Site Walk & Verification · Quality Assurance Standard-of-Care · Quality Guarantee',
    qs: ['Is someone on site every day, walking the work and holding the contract?',
         'Are punch items tracked, with a named owner who closes them?',
         'Is the quality standard written down, and is it owner-written rather than contractor-written?',
         'Do you have written assurance from the contractor and their subcontractors that problems will be made right?'] },
  { n: '10', title: 'Opening Readiness', pts: 3, max: 12, docs: 'Management Structure · Staffing & Service Model · Revenue Center P&L · Lifecycle Maintenance Plan',
    qs: ['Do you know who runs the resort day one: your team, a third party, or a flag not yet signed?',
         'Does the space plan support the staffing model, back of house included?',
         'Do you know which revenue centers carry the P&L, and is the design costed to their margin?',
         'Do you know what year-three maintenance looks like, and who signs off on that cost?'] }
];
