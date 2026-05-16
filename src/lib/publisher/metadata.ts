import type { StorDestination, StorDocument } from '$lib/content/stor/types';

export const COMMITTEE_OPTIONS = [
  'Business Committee',
  'Committee of Public Accounts',
  'Committee of Selection (Seanad Éireann)',
  'Committee on Agriculture and Food',
  'Committee on Artificial Intelligence',
  'Committee on Arts, Media, Communications, Culture and Sport',
  'Committee on Budgetary Oversight',
  'Committee on Children and Equality',
  'Committee on Climate, Environment and Energy',
  'Committee on Defence and National Security',
  'Committee on Disability Matters',
  'Committee on Drugs Use',
  'Committee on Education and Youth',
  'Committee on Enterprise, Tourism and Employment',
  'Committee on European Union Affairs',
  'Committee on Finance, Public Expenditure, Public Service Reform and Digitalisation, and Taoiseach',
  'Committee on Fisheries and Maritime Affairs',
  'Committee on Foreign Affairs and Trade',
  'Committee on Further and Higher Education, Research, Innovation and Science',
  'Committee on Health',
  'Committee on Housing, Local Government and Heritage',
  'Committee on Infrastructure and National Development Plan Delivery',
  'Committee on Justice, Home Affairs and Migration',
  "Committee on Key Issues affecting the Traveller Community",
  "Committee on Members' Interests of Dáil Éireann",
  'Committee on Members’ Interests of Seanad Éireann',
  'Committee on Parliamentary Privileges and Oversight (Dáil Éireann)',
  'Committee on Parliamentary Privileges and Oversight (Seanad Éireann)',
  'Committee on Public Petitions and the Ombudsmen',
  'Committee on Social Protection, Rural and Community Development',
  'Committee on Standing Orders and Dáil Reform',
  'Committee on the Implementation of the Good Friday Agreement',
  'Committee on the Irish Language, Gaeltacht and the Irish-speaking Community',
  'Committee on Transport',
  'Seanad Public Consultation Committee',
  'Seanad Select Committee on EU Scrutiny and Transparency',
  'Working Group of Committee Cathaoirligh',
] as const;

export const DESTINATION_OPTIONS: Array<{
  value: StorDestination;
  label: string;
}> = [
  { value: 'committee-reports', label: 'Committee reports' },
  { value: 'library-research-service', label: 'Library & Research Service' },
  {
    value: 'parliamentary-budget-office',
    label: 'Parliamentary Budget Office',
  },
];

export const TYPE_OPTIONS: Record<
  StorDestination,
  Array<{ value: StorDocument['type']; label: string }>
> = {
  'committee-reports': [{ value: 'committee-report', label: 'Committee report' }],
  'library-research-service': [
    { value: 'article', label: 'Article' },
    { value: 'briefing', label: 'Briefing' },
  ],
  'parliamentary-budget-office': [
    { value: 'article', label: 'Article' },
    { value: 'briefing', label: 'Briefing' },
  ],
};

export const STATUS_OPTIONS: Array<{
  value: NonNullable<StorDocument['status']>;
  label: string;
}> = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];
