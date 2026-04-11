export interface WaiverTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const WAIVER_TEMPLATES: WaiverTemplate[] = [
  {
    id: "first_contact",
    name: "Primo contatto",
    subject: "Waiver Code Request — {distributorName} Film Catalogue",
    body: `Dear {festivalName} Programming Team,

My name is {distributorName}, and I represent a curated catalogue of {catalogueCount} short films currently in active festival distribution.

We have identified {festivalName} as an excellent match for one or more of our titles, and we would like to inquire whether you offer submission fee waivers or discount codes for established distribution companies.

Our catalogue includes award-winning shorts that have screened at festivals worldwide. We believe our films align well with your programming vision and selection criteria.

If a waiver code or discounted rate is available, we would be grateful to receive it, as it would allow us to submit multiple titles from our catalogue.

Thank you for your time and consideration. We look forward to hearing from you.

Best regards,
{distributorName}
{distributorEmail}
{distributorWebsite}`,
  },
  {
    id: "follow_up",
    name: "Follow-up",
    subject: "Follow-up: Waiver Code Request — {distributorName}",
    body: `Dear {festivalName} Team,

I am writing to follow up on my previous email regarding a submission fee waiver for our film distribution catalogue.

We are very interested in submitting to {festivalName} {editionYear} and wanted to check if there are any waiver codes available for distribution companies.

Our deadline to submit is approaching, so any information you could share would be greatly appreciated.

Thank you again for your consideration.

Best regards,
{distributorName}
{distributorEmail}`,
  },
  {
    id: "thank_you",
    name: "Ringraziamento",
    subject: "Thank You — Waiver Code Received — {distributorName}",
    body: `Dear {festivalName} Team,

Thank you so much for providing us with the waiver code for {festivalName} {editionYear}. We truly appreciate your support.

We will be reviewing our catalogue and submitting the most suitable titles shortly.

We look forward to a productive collaboration and hope to see our films as part of your official selection.

Best regards,
{distributorName}
{distributorEmail}
{distributorWebsite}`,
  },
];

export function fillTemplate(
  template: WaiverTemplate,
  vars: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{${key}}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }
  return { subject, body };
}
