const HUBSPOT_BASE = "https://api.hubapi.com";

export type HubSpotDealFetchResult = {
  hubspot_deal_id: string;
  deal_name: string | null;
  stage: string | null;
  /** ID brut HubSpot du stage (dealstage) */
  stage_id: string | null;
  close_date: string | null;
  hubspot_owner_id: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_company: string | null;
  raw: Record<string, unknown>;
};

function getToken(): string {
  const key = process.env.HUBSPOT_API_KEY;
  if (!key) throw new Error("HUBSPOT_API_KEY manquant");
  return key;
}

/** Cache pipelineId → (stageId → label) */
const pipelineStageCache = new Map<string, Map<string, string>>();
let allStagesCache: Map<string, string> | null = null;

type HubSpotPipeline = {
  id: string;
  label?: string;
  stages?: { id: string; label: string }[];
};

async function fetchPipelineStageMap(pipelineId: string): Promise<Map<string, string>> {
  const cached = pipelineStageCache.get(pipelineId);
  if (cached) return cached;

  const res = await fetch(
    `${HUBSPOT_BASE}/crm/v3/pipelines/deals/${pipelineId}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
      next: { revalidate: 0 },
    }
  );
  const map = new Map<string, string>();
  if (res.ok) {
    const p = (await res.json()) as HubSpotPipeline;
    for (const s of p.stages ?? []) {
      map.set(s.id, s.label);
    }
  }
  pipelineStageCache.set(pipelineId, map);
  return map;
}

async function fetchAllDealStagesMap(): Promise<Map<string, string>> {
  if (allStagesCache) return allStagesCache;

  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/pipelines/deals`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    next: { revalidate: 0 },
  });
  const map = new Map<string, string>();
  if (res.ok) {
    const data = (await res.json()) as { results?: HubSpotPipeline[] };
    for (const p of data.results ?? []) {
      for (const s of p.stages ?? []) {
        map.set(s.id, s.label);
      }
    }
  }
  allStagesCache = map;
  return map;
}

/**
 * Résout un dealstage (ID interne) en libellé lisible pour le Kanban / UI.
 * Si pipelineId est fourni, interroge ce pipeline ; sinon fusionne tous les pipelines deals.
 */
export async function resolveStageName(
  stageId: string | null | undefined,
  pipelineId?: string | null
): Promise<string | null> {
  if (!stageId?.trim()) return null;
  const sid = stageId.trim();

  if (pipelineId?.trim()) {
    const m = await fetchPipelineStageMap(pipelineId.trim());
    return m.get(sid) ?? null;
  }

  const all = await fetchAllDealStagesMap();
  return all.get(sid) ?? null;
}

export async function fetchDealWithContact(
  dealId: string
): Promise<HubSpotDealFetchResult> {
  const token = getToken();
  const props = [
    "dealname",
    "dealstage",
    "pipeline",
    "closedate",
    "hubspot_owner_id",
  ].join(",");

  const dealRes = await fetch(
    `${HUBSPOT_BASE}/crm/v3/objects/deals/${dealId}?properties=${props}&associations=contacts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    }
  );

  if (dealRes.status === 404) {
    throw new Error(`Deal introuvable : ${dealId}`);
  }
  if (!dealRes.ok) {
    const t = await dealRes.text();
    throw new Error(`HubSpot deals: ${dealRes.status} ${t}`);
  }

  const deal = (await dealRes.json()) as {
    id: string;
    properties: Record<string, string | null>;
    associations?: { contacts?: { results: { id: string }[] } };
  };

  let contact_email: string | null = null;
  let contact_name: string | null = null;
  let contact_company: string | null = null;

  const contactAssoc = deal.associations?.contacts?.results?.[0];
  if (contactAssoc?.id) {
    const cRes = await fetch(
      `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactAssoc.id}?properties=email,firstname,lastname,company`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      }
    );
    if (cRes.ok) {
      const c = (await cRes.json()) as {
        properties: Record<string, string | null>;
      };
      const p = c.properties;
      contact_email = p.email ?? null;
      const fn = p.firstname ?? "";
      const ln = p.lastname ?? "";
      contact_name = [fn, ln].filter(Boolean).join(" ").trim() || null;
      contact_company = p.company ?? null;
    }
  }

  const propsDeal = deal.properties;
  const rawStageId = propsDeal.dealstage ?? null;
  const pipelineId = propsDeal.pipeline ?? null;

  let stageLabel: string | null = null;
  if (rawStageId) {
    stageLabel = await resolveStageName(rawStageId, pipelineId);
  }

  return {
    hubspot_deal_id: deal.id,
    deal_name: propsDeal.dealname ?? null,
    stage: stageLabel ?? rawStageId,
    stage_id: rawStageId,
    close_date: propsDeal.closedate ?? null,
    hubspot_owner_id: propsDeal.hubspot_owner_id ?? null,
    contact_email,
    contact_name,
    contact_company,
    raw: deal as unknown as Record<string, unknown>,
  };
}

/**
 * Lit uniquement `hubspot_owner_id` sur le deal — pour la sync MRR Stripe
 * (évite associations contact + résolution des libellés de stage).
 */
export async function fetchDealHubspotOwnerId(
  dealId: string
): Promise<string | null> {
  const token = getToken();
  const res = await fetch(
    `${HUBSPOT_BASE}/crm/v3/objects/deals/${dealId}?properties=hubspot_owner_id`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  const deal = (await res.json()) as {
    properties?: Record<string, string | null>;
  };
  const v = deal.properties?.hubspot_owner_id;
  return v != null && v !== "" ? String(v) : null;
}

/** Associations deals depuis un contact HubSpot */
export async function fetchDealIdsForContact(
  contactId: string
): Promise<string[]> {
  const token = getToken();
  const res = await fetch(
    `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: { id: string }[];
  };
  return (data.results ?? []).map((r) => r.id);
}

/** Recherche contact par email (pour attribution MRR) */
export async function findContactIdByEmail(
  email: string
): Promise<string | null> {
  const token = getToken();
  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: "email",
            operator: "EQ",
            value: email.toLowerCase().trim(),
          },
        ],
      },
    ],
    properties: ["email"],
    limit: 1,
  };
  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: { id: string }[] };
  return data.results?.[0]?.id ?? null;
}
