import type { LeadWorkspace } from '../types/lead-workspace.types';

export const leadWorkspaceMock: LeadWorkspace[] = [
  {
    id: 'lead-001',
    leadCode: 'LD-2026-0001',
    companyName: 'PT Sinar Logistik Nusantara',
    address: 'Jl. Gatot Subroto No. 88, Jakarta Selatan, DKI Jakarta',
    industry: 'Logistics & Distribution',
    companyPicName: 'Sarah Connor',
    companyPicRole: 'Director of Finance',
    companyPicPhone: '+62 812-7788-9102',
    companyPicEmail: 'sarah.connor@sinarnusantara.co.id',
    leadSource: 'Inbound Referral',
    processedAt: '2026-04-10T14:20:00.000Z',
    processedBy: 'Andi Setiawan',
    currentStage: 'Proposal',
    archiveLabel: 'Archive Lead',
    minutesHighlight:
      'Client agreed on phased implementation model and requested revised fee structure for Q3 onboarding window.',
    meetings: [
      {
        id: 'mtg-001',
        title: 'Project Scope Alignment',
        mode: 'Zoom',
        platformOrLocation: 'https://zoom.us/j/987654321',
        date: '2026-04-20T09:00:00.000Z',
        duration: '1h 20m',
        status: 'Done',
        notes: 'Kickoff alignment for scope and implementation phases with client PM and finance PIC.',
        minutesSummary:
          'Client approved revised scope for cross-region operations and requested legal review before final sign-off.',
        minutesDetail: {
          participants: {
            internal: ['Andi Setiawan', 'Laras Wijaya'],
            client: ['Sarah Connor', 'Michael Tan']
          },
          objectives: 'Align final scope, timeline, and commercial baseline before proposal finalization.',
          discussionSummary: {
            background: 'Client plans multi-region operational expansion in Q3 and needs stable process migration.',
            issuesDiscussed: 'Data migration ownership, timeline dependencies, and legal review turnaround.',
            clientInfo: 'Client shared current SOP gaps and target operational KPI for first 90 days.',
            firmInfo: 'We proposed phased implementation with governance checkpoints per milestone.',
            risks: 'Potential schedule slippage if legal feedback exceeds 5 business days.'
          },
          agreements: [
            {
              item: 'Implementation Model',
              details: 'Phased rollout with two-week validation between phases.'
            },
            {
              item: 'Commercial Baseline',
              details: 'Fee structure accepted pending legal clause confirmation.'
            }
          ],
          actionItems: [
            {
              action: 'Share revised timeline document',
              pic: 'Andi Setiawan',
              deadline: '22 Apr 2026'
            },
            {
              action: 'Confirm legal approver list',
              pic: 'Sarah Connor',
              deadline: '23 Apr 2026'
            }
          ],
          nextSteps: 'Run legal review sync, then proceed to proposal sign-off session.',
          followUpNotes: 'Client requested concise executive summary for CFO briefing.'
        }
      },
      {
        id: 'mtg-002',
        title: 'Initial Discovery Call',
        mode: 'Google Meet',
        platformOrLocation: 'Meeting Room 12B, HQ Bandung',
        date: '2026-04-12T10:30:00.000Z',
        duration: '55m',
        status: 'Done',
        notes: 'Hybrid session: onsite stakeholders with remote engineering team from Jakarta.',
        minutesSummary: 'Validated key pain points and integration constraints.',
        minutesDetail: {
          participants: {
            internal: ['Andi Setiawan'],
            client: ['Bima Prakoso', 'Rani Kusuma']
          },
          objectives: 'Capture current process issues and define discovery scope.',
          discussionSummary: {
            background: 'Client is transitioning from manual approval workflow to centralized operations.',
            issuesDiscussed: 'Duplicate data entry, unclear ownership, and delayed reporting.',
            clientInfo: 'Client provided current workflow map and issue priority list.',
            firmInfo: 'We explained proposed discovery framework and output artifacts.',
            risks: 'Data inconsistency may affect baseline analysis quality.'
          },
          agreements: [
            {
              item: 'Discovery Scope',
              details: 'Focus on finance and operations approval workflow.'
            }
          ],
          actionItems: [
            {
              action: 'Submit current workflow template',
              pic: 'Bima Prakoso',
              deadline: '15 Apr 2026'
            }
          ],
          nextSteps: 'Prepare discovery recap and schedule scope alignment meeting.',
          followUpNotes: 'Need additional access to monthly approval logs.'
        }
      }
    ],
    minutes: [
      {
        id: 'min-001',
        title: 'Scope Alignment Minutes',
        createdAt: '2026-04-20T11:00:00.000Z',
        createdBy: 'Andi Setiawan',
        status: 'Submitted',
        summary: 'Scope, responsibilities, and milestone timeline captured and shared to client.'
      },
      {
        id: 'min-002',
        title: 'Discovery Minutes',
        createdAt: '2026-04-12T13:00:00.000Z',
        createdBy: 'Andi Setiawan',
        status: 'Submitted',
        summary: 'Initial requirements and stakeholders confirmed.'
      }
    ],
    proposal: {
      title: 'Strategic Tax Advisory',
      serviceType: 'Standard Compliance & Strategy',
      estimatedFee: '$42,500.00',
      paymentTerms: 'One-time payment · Net 30',
      status: 'Client Reviewing'
    },
    engagementLetter: {
      status: 'Drafting',
      lastUpdatedAt: '2026-04-21T15:10:00.000Z',
      owner: 'Laras Wijaya',
      notes: 'Preparing legal clauses based on latest proposal feedback.'
    },
    nextSteps: [
      {
        id: 'step-001',
        title: 'Review Strategic Proposal',
        description: 'Pending approval from legal team.',
        isDone: true,
        assignee: 'Maria V.'
      },
      {
        id: 'step-002',
        title: 'Generate Engagement Letter',
        description: 'Ready to draft once proposal approved.',
        isDone: false,
        assignee: 'Laras W.'
      },
      {
        id: 'step-003',
        title: 'KYC Verification',
        description: 'Check anti-money laundering databases.',
        isDone: false,
        assignee: 'Risk Team'
      }
    ],
    winProbability: 82
  },
  {
    id: 'lead-002',
    leadCode: 'LD-2026-0002',
    companyName: 'CV Prima Tekno',
    address: 'Jl. Ir. H. Juanda No. 21, Bandung, Jawa Barat',
    industry: 'Software Services',
    companyPicName: 'Bima Prakoso',
    companyPicRole: 'COO',
    companyPicPhone: '+62 811-2233-4455',
    companyPicEmail: 'bima.prakoso@primatekno.id',
    leadSource: 'LinkedIn Outreach',
    processedAt: '2026-04-11T09:00:00.000Z',
    processedBy: 'Laras Wijaya',
    currentStage: 'Meeting',
    archiveLabel: 'Archive Lead',
    minutesHighlight: 'Need revision on deployment scope.',
    meetings: [],
    minutes: [],
    proposal: {
      title: 'Infrastructure Modernization',
      serviceType: 'Advisory + Enablement',
      estimatedFee: '$28,000.00',
      paymentTerms: 'Two milestones',
      status: 'Drafting'
    },
    engagementLetter: {
      status: 'Not Created',
      lastUpdatedAt: '2026-04-20T08:00:00.000Z',
      owner: 'Reza Akbar',
      notes: 'Waiting proposal approval.'
    },
    nextSteps: [],
    winProbability: 61
  }
];
