import { ResourceItem } from '../types/cna';

export const CNA_RESOURCES: ResourceItem[] = [
  {
    id: 'res-ppc-manual',
    title: 'Professional Practice Committee (PPC) Field Manual',
    category: 'Manuals',
    durationOrLength: '24 pages · Offline Ready',
    updatedAt: 'Oct 2026',
    summary:
      'Step-by-step protocols for documenting unsafe staffing ratios, submitting Assignment Despite Objection (ADO) forms, and preparing monthly PPC leadership agendas.',
    thumbnailType: 'ppc',
    tags: ['PPC', 'Staffing Ratios', 'ADO Forms'],
    offlineSections: [
      {
        heading: '01. Core PPC Statutory Authority',
        points: [
          'California Title 22 nurse-to-patient ratios apply at all times, including meal and rest breaks.',
          'PPC members review clinical staffing variances, acuity tools, and unit safety logs monthly with CNO leadership.',
          'Every ADO filed creates a protected legal record of staffing conditions at the moment of shift assignment.',
        ],
      },
      {
        heading: '02. Assignment Despite Objection (ADO) Workflow',
        points: [
          'Complete the ADO form immediately when assigned beyond safe Title 22 ratios or outside unit competency.',
          'Deliver the yellow/digital copy to your charge nurse or house supervisor and retain the member copy for your Unit Rep.',
          'Log your daily participation check-in so organizers can correlate PPC meetings with unit ADO volume.',
        ],
      },
      {
        heading: '03. Monthly PPC Meeting Checklist',
        points: [
          'Bring unit-level missed break tallies and float pool deployment logs.',
          'Confirm follow-up written responses from hospital management within 14 calendar days.',
        ],
      },
    ],
  },
  {
    id: 'res-unit-rep-handbook',
    title: 'Unit Rep & Shop Steward Organizing Handbook',
    category: 'Manuals',
    durationOrLength: '32 pages · Offline Ready',
    updatedAt: 'Nov 2026',
    summary:
      'Essential reference for Unit Reps handling Weingarten rights, investigatory meetings, grievance timelines, and shift-huddle outreach across acute care units.',
    thumbnailType: 'steward',
    tags: ['Unit Rep', 'Weingarten Rights', 'Grievances'],
    offlineSections: [
      {
        heading: '01. Weingarten Rights Representation',
        points: [
          'Any RN who reasonably believes an investigatory interview could lead to discipline has the legal right to union representation.',
          'Unit Reps may clarify questions, caucus privately with the member, and take verbatim notes during the interview.',
        ],
      },
      {
        heading: '02. Grievance Filing Timelines',
        points: [
          'Step 1 informal discussion must be documented within contractual timelines (typically 14–21 days from incident awareness).',
          'Collect signed witness statements, schedule rosters, and Kronos/timecard exceptions before escalating to Step 2.',
        ],
      },
    ],
  },
  {
    id: 'res-video-ado-training',
    title: 'Training Video: Filing Digital ADOs & Protecting Licensure',
    category: 'Training Videos',
    durationOrLength: '14 min video · Transcript Cached',
    updatedAt: 'Nov 2026',
    summary:
      'Walkthrough led by CNA nurse educators demonstrating how to document clinical acuity mismatches, break-relief gaps, and escalation pathways during night and day shifts.',
    thumbnailType: 'ppc',
    videoDurationSeconds: 840,
    tags: ['Video Training', 'ADO', 'Licensure'],
    offlineSections: [
      {
        heading: 'Chapter 1 (00:00 – 04:30): Recognizing Ratio Violations Early',
        points: [
          'How to assess patient acuity triggers in ICU (1:2), Telemetry (1:4), and Med-Surg (1:5) before accepting report.',
          'Communicating objectively with Charge RNs without escalating bedside tension.',
        ],
      },
      {
        heading: 'Chapter 2 (04:30 – 10:15): Completing the ADO Record',
        points: [
          'Document exact patient census, missing break coverage, and equipment/support gaps.',
          'Never falsify or backdate staffing logs; state clinical facts concisely.',
        ],
      },
      {
        heading: 'Chapter 3 (10:15 – 14:00): Follow-Up with Your Unit Rep',
        points: [
          'Route copies to your local CNA chapter office (Sacramento, SF, LA, Irvine, or San Diego).',
        ],
      },
    ],
  },
  {
    id: 'res-shift-huddle-guide',
    title: '10-Minute Shift-Change Huddle & Member Check-In Guide',
    category: 'Guides',
    durationOrLength: '6-minute read · Offline Ready',
    updatedAt: 'Oct 2026',
    summary:
      'Practical field guide for Union Reps running rapid pre-shift and post-shift huddles at 06:45 and 18:45 without disrupting patient handoff.',
    thumbnailType: 'steward',
    tags: ['Union Rep', 'Field Huddles', 'Outreach'],
    offlineSections: [
      {
        heading: '01. Rapid Huddle Structure (10 Minutes)',
        points: [
          'Minutes 1–3: Check in all arriving RNs via mobile portal so daily participation is recorded before the 7:00 PM summary.',
          'Minutes 4–7: Share one contract update and verify meal/break relief coverage on the floor.',
          'Minutes 8–10: Collect unit safety concerns for the upcoming PPC agenda.',
        ],
      },
    ],
  },
  {
    id: 'res-video-bargaining',
    title: 'Training Video: Contract Bargaining & Strike Readiness Brief',
    category: 'Training Videos',
    durationOrLength: '19 min video · Transcript Cached',
    updatedAt: 'Sep 2026',
    summary:
      'Briefing for Union Reps and Unit Reps covering bargaining table updates, safe-staffing proposals, and picket captain coordination.',
    thumbnailType: 'steward',
    videoDurationSeconds: 1140,
    tags: ['Bargaining', 'Union Rep', 'Video Training'],
    offlineSections: [
      {
        heading: 'Chapter 1 (00:00 – 07:00): Bargaining Priorities Across California',
        points: [
          'Enforceable break-nurse staffing language, workplace violence prevention committees, and floating protections.',
        ],
      },
      {
        heading: 'Chapter 2 (07:00 – 19:00): Member Participation Tracking',
        points: [
          'Daily unit check-ins verify active steward coverage across all shifts prior to membership votes.',
        ],
      },
    ],
  },
  {
    id: 'res-cal-osha-guide',
    title: 'Workplace Violence Prevention & Cal/OSHA SB 553 Quick Guide',
    category: 'Guides',
    durationOrLength: '8-minute read · Offline Ready',
    updatedAt: 'Nov 2026',
    summary:
      'Actionable reference on California hospital workplace violence log requirements, panic-button audits, and joint labor-management safety inspections.',
    thumbnailType: 'ppc',
    tags: ['Cal/OSHA', 'Safety', 'PPC'],
    offlineSections: [
      {
        heading: '01. Mandatory Hospital Violence Log Rights',
        points: [
          'Hospitals must maintain an incident log accessible to frontline RNs and union representatives upon request.',
          'All physical and verbal threats in ED, Med-Surg, and Behavioral Health must be logged without retaliation.',
        ],
      },
    ],
  },
];
