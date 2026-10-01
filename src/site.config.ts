import type { SiteConfig } from '@pcl/design-system';

const base = '/stamps-website';
/** Internal href with the base prefix (/stamps-website on github.io, '' on the custom domain). */
const u = (p: string) => (import.meta.env.BASE_URL ?? base).replace(/\/$/, '') + p;
const url = 'https://stamps.psychedelicsandcontemplationlab.com';

/** Feedback and contact go by e-mail — the site never collects data itself. */
export const contactEmail = 'sara.delasalle@mail.mcgill.ca';
export const feedbackMailto =
  `mailto:${contactEmail}?subject=${encodeURIComponent('StaMPS Data Framework — Website Feedback')}` +
  `&body=${encodeURIComponent(
    'Name (optional):\nEmail (optional — so we can follow up):\nYou are… (researcher / academic, clinician, policymaker, person with lived experience, other):\nYour feedback is about… (the interactive tool, the framework content (items, verdicts), something else):\n\nMessage:\n',
  )}`;
export const contactMailto = `mailto:${contactEmail}?subject=${encodeURIComponent('StaMPS Data Framework — Contact')}`;

export const site: SiteConfig & { base: string; previewUrl: string } = {
  name: 'StaMPS Data Framework',
  tagline: 'Standardizing Measures in Psychedelic Science',
  url,
  lang: 'en',
  accent: '#B5502F',
  affiliation:
    'Standardizing Measures and Practices in Psychedelic Science (StaMPS): a modified Delphi expert-consensus study (protocol 25-05-146-01), led at McGill University and the Lady Davis Institute for Medical Research, Jewish General Hospital, Montréal, in collaboration with the Psychedelic Mental Health Access Alliance.',
  base: '/stamps-website',
  previewUrl: 'https://the-psychedelics-and-contemplation-lab.github.io',
  footerLinks: [
    { label: 'Home', href: u('/') },
    { label: 'Interactive Tool', href: u('/tool/') },
    { label: 'Study Progress', href: u('/progress/') },
    { label: 'Team', href: u('/team/') },
    { label: 'Give Feedback', href: u('/feedback/') },
    { label: contactEmail, href: `mailto:${contactEmail}` },
  ],
  ogImage: `${url}/og-image.png`,
  ogImageAlt: 'StaMPS Data Framework — Standardizing Measures in Psychedelic Science',
  organizationSchema: {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: 'Psychedelics & Contemplation Lab',
    url: 'https://psychedelicsandcontemplationlab.com',
    parentOrganization: [
      { '@type': 'CollegeOrUniversity', name: 'McGill University' },
      { '@type': 'ResearchOrganization', name: 'Lady Davis Institute for Medical Research' },
    ],
  },
};

/** schema.org ResearchProject — passed as `schema` on every page. */
export const researchProjectSchema = {
  '@context': 'https://schema.org',
  '@type': 'ResearchProject',
  name: 'StaMPS Data Framework — Standardizing Measures and Practices in Psychedelic Science',
  alternateName: 'StaMPS',
  url,
  identifier: 'Protocol 25-05-146-01',
  description:
    'An international modified Delphi expert-consensus initiative developing a purpose-sensitive framework for standardized data collection in psychedelic science.',
  parentOrganization: site.organizationSchema,
  funder: [
    { '@type': 'Organization', name: 'Psychedelic Mental Health Access Alliance', url: 'https://www.pmhaa.org/' },
    { '@type': 'Organization', name: 'Fonds de recherche du Québec — Santé' },
    { '@type': 'ResearchOrganization', name: 'Lady Davis Institute for Medical Research', url: 'https://www.ladydavis.ca/' },
  ],
  member: [
    { '@type': 'Person', name: 'Kyle T. Greenway', jobTitle: 'Principal Investigator', affiliation: 'McGill University' },
    { '@type': 'Person', name: 'Sara de la Salle', jobTitle: 'Co-Investigator', affiliation: 'McGill University' },
    { '@type': 'Person', name: 'Elisabeth Irvine', jobTitle: 'Co-Investigator', affiliation: 'McGill University' },
    { '@type': 'Person', name: 'Alexandre Lehmann', jobTitle: 'Co-Investigator', affiliation: 'McGill University' },
  ],
};

const navItems = [
  { label: 'Home', href: u('/') },
  { label: 'Interactive Tool', href: u('/tool/') },
  { label: 'Study Progress', href: u('/progress/') },
  { label: 'Team', href: u('/team/') },
  { label: 'Give Feedback', href: u('/feedback/') },
];

/** Navigation with `current` set on the item whose path matches the page being rendered. */
export const navFor = (path: string) => navItems.map((n) => ({ ...n, current: n.href === u(path) }));
