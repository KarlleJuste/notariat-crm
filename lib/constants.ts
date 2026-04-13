/** Types d'organismes annuaire */
export const ORG_TYPES = [
  "instance_nationale",
  "conseil_regional",
  "chambre",
  "cridon",
  "formation",
  "organisme_social",
  "syndicat_employeur",
  "syndicat_salarie",
  "association",
  "international",
] as const;

export type OrgType = (typeof ORG_TYPES)[number];

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  instance_nationale: "Instance nationale",
  conseil_regional: "Conseil régional",
  chambre: "Chambre",
  cridon: "CRIDON",
  formation: "Formation",
  organisme_social: "Organisme social",
  syndicat_employeur: "Syndicat employeur",
  syndicat_salarie: "Syndicat salarié",
  association: "Association",
  international: "International",
};

export const ORG_TYPE_BADGE: Record<
  OrgType,
  | "default"
  | "violet"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "orange"
  | "amber"
  | "pink"
  | "rose"
> = {
  instance_nationale: "default",
  conseil_regional: "violet",
  chambre: "blue",
  cridon: "cyan",
  formation: "teal",
  organisme_social: "green",
  syndicat_employeur: "orange",
  syndicat_salarie: "amber",
  association: "pink",
  international: "rose",
};

/** Ordre Kanban — libellés HubSpot attendus (affichage ; l’API peut renvoyer un ID de stage) */
export const DEMO_STAGE_ORDER = [
  "1st demo booked",
  "Maybe - under consideration",
  "Follow-up call booked",
  "Invite sent",
  "Onboarding scheduled",
  "Closed Won",
  "Closed Lost",
  "Churned",
] as const;

export type DemoStageLabel = (typeof DEMO_STAGE_ORDER)[number];

export const DEMO_STAGE_BADGE: Record<
  DemoStageLabel,
  "blue" | "yellow" | "orange" | "violet" | "default" | "success" | "danger" | "slate"
> = {
  "1st demo booked": "blue",
  "Maybe - under consideration": "yellow",
  "Follow-up call booked": "orange",
  "Invite sent": "violet",
  "Onboarding scheduled": "default",
  "Closed Won": "success",
  "Closed Lost": "danger",
  Churned: "slate",
};

export const CRM_ORG_STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  contacted: "Contacté",
  partner: "Partenaire",
  client: "Client",
  inactive: "Inactif",
};

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  en_discussion: "En discussion",
  converti: "Converti",
  inactif: "Inactif",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  salon_congres: "Salon / Congrès",
  webinar_conference: "Webinar / Conférence en ligne",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  a_venir: "À venir",
  termine: "Terminé",
  annule: "Annulé",
};
