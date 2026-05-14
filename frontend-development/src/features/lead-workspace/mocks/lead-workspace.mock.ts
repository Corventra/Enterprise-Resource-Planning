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
    proposals: [
      {
        id: 'prop-001',
        title: 'Strategic Tax Advisory',
        createdAt: '2026-04-18T10:15:00.000Z',
        paymentType: 'One-time Payment',
        subcon: 'Tax Compliance Squad',
        sentAt: '2026-04-19T09:30:00.000Z',
        dealDate: '2026-04-28T00:00:00.000Z',
        proposalFee: '$42,500.00',
        dealPrice: '$40,000.00',
        notes: 'Client requested slight discount due to multi-year expansion plan.',
        detail: {
          tier: 'STRATEGIC_RETAINER',
          serviceType: 'Strategic Tax Advisory',
          status: 'WAITING_CEO_APPROVAL',
          discount: '$2,500.00',
          agreeFee: '$40,000.00',
          hasSubcon: true,
          subconPartner: 'Tax Compliance Squad',
          subconPayer: 'PARTNER',
          planMode: 'MONTHLY_RETAINER',
          billingSchedule: [],
          contractStart: '2026-05-01',
          contractEnd: '2027-04-30',
          billingTiming: 'START_OF_MONTH',
          downPayment: '-',
          successFeePercent: '-',
          successFeeBase: '-',
          attachments: ['proposal-strategic-tax-advisory.pdf', 'financial-model.xlsx']
        }
      },
      {
        id: 'prop-002',
        title: 'Transfer Pricing Review',
        createdAt: '2026-04-09T13:10:00.000Z',
        paymentType: 'Milestone',
        subcon: 'Advisory Execution Team',
        sentAt: '2026-04-11T10:45:00.000Z',
        dealDate: '2026-04-22T00:00:00.000Z',
        proposalFee: '$18,750.00',
        dealPrice: '$17,900.00',
        notes: 'Follow-up package tied with annual compliance renewal.',
        detail: {
          tier: 'PREMIUM_MODULAR',
          serviceType: 'Transfer Pricing Advisory',
          status: 'APPROVED',
          discount: '$850.00',
          agreeFee: '$17,900.00',
          hasSubcon: false,
          subconPartner: '',
          subconPayer: '',
          planMode: 'INSTALLMENTS',
          billingSchedule: [
            {
              label: 'Down Payment',
              percentage: 50,
              nominal: '$9,375.00',
              description: 'Due after proposal signing'
            },
            {
              label: 'Termin 1',
              percentage: 50,
              nominal: '$9,375.00',
              description: 'Due after final transfer pricing report delivery'
            }
          ],
          contractStart: '-',
          contractEnd: '-',
          billingTiming: 'START_OF_MONTH',
          downPayment: '-',
          successFeePercent: '-',
          successFeeBase: '-',
          attachments: ['tp-review-proposal.pdf']
        }
      }
    ],
    engagementLetter: {
      status: 'Drafting',
      lastUpdatedAt: '2026-04-21T15:10:00.000Z',
      owner: 'Laras Wijaya',
      notes: 'Preparing legal clauses based on latest proposal feedback.'
    },
    engagementLetters: [
      {
        id: 'el-001',
        engagementId: '501',
        issuerCompany: 'DSK',
        paymentMethod: 'TERMIN',
        engagementStatus: 'SIGNED',
        createdAt: '2026-04-21T15:10:00.000Z',
        agreedFee: 'Rp 1.250.000.000',
        revisionNote: null,
        createdByName: 'Laras Wijaya',
        submittedByName: 'Laras Wijaya',
        submittedAt: '2026-04-21T15:12:00.000Z',
        approvedByName: 'CEO Demo',
        approvedAt: '2026-04-21T16:00:00.000Z',
        sentToClientAt: '2026-04-21T17:00:00.000Z',
        signedAt: '2026-04-22T09:00:00.000Z',
        proposalSummary: {
          proposalId: 'prop-001',
          serviceClassName: 'Tax & Advisory',
          serviceName: 'Strategic Tax Advisory',
          proposalFee: 'Rp 1.300.000.000',
          discountAmount: 'Rp 50.000.000',
          finalProposalValue: 'Rp 1.250.000.000',
          proposalStatus: 'RESPONDED',
          proposalIssuerCompany: 'DSK',
          latestProposalDocumentName: 'proposal-strategic-tax-advisory.pdf',
          latestProposalDocumentPath: '/uploads/proposals/proposal-strategic-tax-advisory.pdf'
        },
        termins: [
          {
            termName: 'Down payment',
            termType: 'DOWN_PAYMENT',
            percentageDisplay: '30%',
            billingScheduleDate: '2026-05-01',
            description: 'Setelah penandatanganan EL'
          },
          {
            termName: 'Termin 1',
            termType: 'INSTALLMENT',
            percentageDisplay: '40%',
            billingScheduleDate: '2026-07-15',
            description: 'Setelah deliverable fase 1'
          },
          {
            termName: 'Final',
            termType: 'FINAL',
            percentageDisplay: '30%',
            billingScheduleDate: '2026-10-01',
            description: 'Setelah penyelesaian engagement'
          }
        ],
        retainer: null,
        document: {
          uploadedFileName: 'EL_Advisory_Final_v2.pdf',
          uploadedAt: '2026-04-21T15:30:00.000Z',
          uploadedSize: '2.4 MB',
          versionNo: 2,
          filePath: '/uploads/engagements/el-advisory-final-v2.pdf',
          thumbnailUrl: 'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?auto=format&fit=crop&w=120&q=80'
        }
      },
      {
        id: 'el-002',
        engagementId: '502',
        issuerCompany: 'DTAX',
        paymentMethod: 'RETAINER',
        engagementStatus: 'NEED_REVISION',
        createdAt: '2026-04-20T10:45:00.000Z',
        agreedFee: 'Rp 450.000.000',
        revisionNote: 'Mohon selaraskan pasal pembayaran dengan termin di proposal terbaru dan cantumkan PIC penagihan klien.',
        createdByName: 'Andi Setiawan',
        submittedByName: 'Andi Setiawan',
        submittedAt: '2026-04-20T11:00:00.000Z',
        approvedByName: null,
        approvedAt: null,
        sentToClientAt: null,
        signedAt: null,
        proposalSummary: {
          proposalId: 'prop-001',
          serviceClassName: 'Tax & Advisory',
          serviceName: 'Strategic Tax Advisory',
          proposalFee: 'Rp 500.000.000',
          discountAmount: 'Rp 50.000.000',
          finalProposalValue: 'Rp 450.000.000',
          proposalStatus: 'RESPONDED',
          proposalIssuerCompany: 'DTAX',
          latestProposalDocumentName: 'financial-model.xlsx',
          latestProposalDocumentPath: null
        },
        termins: [],
        retainer: {
          contractStartDate: '2026-05-01',
          contractEndDate: '2027-04-30',
          billingTiming: 'BEGINNING_OF_MONTH'
        },
        document: {
          uploadedFileName: 'EL_Retainer_Draft_v1.pdf',
          uploadedAt: '2026-04-20T10:50:00.000Z',
          uploadedSize: '1.1 MB',
          versionNo: 1
        }
      },
      {
        id: 'el-003',
        engagementId: '503',
        issuerCompany: 'DSK',
        paymentMethod: 'TERMIN',
        engagementStatus: 'REPLACED',
        createdAt: '2026-04-18T13:20:00.000Z',
        agreedFee: 'Rp 1.300.000.000',
        revisionNote: null,
        createdByName: 'Andi Setiawan',
        submittedByName: null,
        submittedAt: null,
        approvedByName: null,
        approvedAt: null,
        sentToClientAt: null,
        signedAt: null,
        proposalSummary: {
          proposalId: 'prop-001',
          serviceClassName: 'Tax & Advisory',
          serviceName: 'Strategic Tax Advisory',
          proposalFee: 'Rp 1.350.000.000',
          discountAmount: 'Rp 50.000.000',
          finalProposalValue: 'Rp 1.300.000.000',
          proposalStatus: 'RESPONDED',
          proposalIssuerCompany: 'DSK',
          latestProposalDocumentName: 'proposal-strategic-tax-advisory.pdf',
          latestProposalDocumentPath: '/uploads/proposals/proposal-strategic-tax-advisory.pdf'
        },
        termins: [
          {
            termName: 'Down payment',
            termType: 'DOWN_PAYMENT',
            percentageDisplay: '50%',
            billingScheduleDate: null,
            description: null
          },
          {
            termName: 'Final',
            termType: 'FINAL',
            percentageDisplay: '50%',
            billingScheduleDate: null,
            description: null
          }
        ],
        retainer: null,
        document: {}
      }
    ],
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
    proposals: [
      {
        id: 'prop-003',
        title: 'Infrastructure Modernization',
        createdAt: '2026-04-12T11:20:00.000Z',
        paymentType: 'Two Milestones',
        subcon: 'Cloud Migration Unit',
        sentAt: '2026-04-14T14:05:00.000Z',
        dealDate: '2026-04-30T00:00:00.000Z',
        proposalFee: '$28,000.00',
        dealPrice: '$26,500.00',
        notes: 'Awaiting client legal review before final negotiation.',
        detail: {
          tier: 'PREMIUM_MODULAR',
          serviceType: 'Infrastructure Modernization',
          status: 'DRAFT',
          discount: '$1,500.00',
          agreeFee: '$26,500.00',
          hasSubcon: true,
          subconPartner: 'Cloud Migration Unit',
          subconPayer: 'CLIENT',
          planMode: 'DISPUTE_UM_SF',
          billingSchedule: [],
          contractStart: '-',
          contractEnd: '-',
          billingTiming: 'END_OF_MONTH',
          downPayment: '$8,000.00',
          successFeePercent: '12%',
          successFeeBase: 'from total migration cost savings',
          attachments: ['infra-modernization-draft.pdf']
        }
      }
    ],
    engagementLetter: {
      status: 'Not Created',
      lastUpdatedAt: '2026-04-20T08:00:00.000Z',
      owner: 'Reza Akbar',
      notes: 'Waiting proposal approval.'
    },
    engagementLetters: [],
    nextSteps: [],
    winProbability: 61
  }
];
