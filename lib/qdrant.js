const SIZE = 384;

const INDEXES = {
  game_posts: { sport: "keyword", is_open: "bool", member_id: "integer" },
  complaints: { status: "keyword" },
  events: { sport: "keyword" },
};

async function call(path, method = "GET", body) {
  const res = await fetch(process.env.QDRANT_API_ENDPOINT.replace(/\/$/, "") + path, {
    method,
    headers: { "api-key": process.env.QDRANT_API_KEY, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Qdrant ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function ensureCollections() {
  for (const [name, fields] of Object.entries(INDEXES)) {
    const { result } = await call(`/collections/${name}/exists`);
    if (result.exists) continue;
    await call(`/collections/${name}`, "PUT", { vectors: { size: SIZE, distance: "Cosine" } });
    for (const [field, type] of Object.entries(fields)) {
      await call(`/collections/${name}/index?wait=true`, "PUT", { field_name: field, field_schema: type });
    }
  }
}

export async function resetCollections() {
  for (const name of Object.keys(INDEXES)) await call(`/collections/${name}`, "DELETE");
  await ensureCollections();
}

export async function upsert(collection, id, vector, payload) {
  await call(`/collections/${collection}/points?wait=true`, "PUT", { points: [{ id, vector, payload }] });
}

export async function setPayload(collection, id, payload) {
  await call(`/collections/${collection}/points/payload?wait=true`, "POST", { payload, points: [id] });
}

export async function search(collection, vector, { must = [], mustNot = [], limit = 5, threshold = 0 } = {}) {
  const { result } = await call(`/collections/${collection}/points/query`, "POST", {
    query: vector,
    filter: { must, must_not: mustNot },
    limit,
    score_threshold: threshold,
    with_payload: true,
  });
  return result.points.map((p) => ({ id: p.id, score: p.score, ...p.payload }));
}

export const match = (key, value) => ({ key, match: { value } });
