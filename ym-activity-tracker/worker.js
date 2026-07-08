// Rushton View 7th Ward Young Men's Activity Tracker — Worker API.
// Reading is public. Writing (POST/PUT/DELETE) requires a bearer token
// obtained from POST /api/auth with the shared EDITOR_PIN.

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(message, status) {
  return json({ error: message }, status);
}

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64(new Uint8Array(sigBuffer));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function createToken(env, pin) {
  if (!env.EDITOR_PIN || pin !== env.EDITOR_PIN) return null;
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS });
  const encodedPayload = toBase64(new TextEncoder().encode(payload));
  const sig = await hmacSign(env.SESSION_SECRET, payload);
  return `${encodedPayload}.${sig}`;
}

async function verifyToken(env, token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, sig] = parts;
  let payload;
  try {
    payload = new TextDecoder().decode(fromBase64(encodedPayload));
  } catch {
    return false;
  }
  const expectedSig = await hmacSign(env.SESSION_SECRET, payload);
  if (!timingSafeEqual(sig, expectedSig)) return false;
  try {
    const { exp } = JSON.parse(payload);
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

async function requireAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return verifyToken(env, token);
}

function parseInCharge(value) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim() !== "");
  return [];
}

// ---------- Activities ----------

async function listActivities(env, url) {
  const month = url.searchParams.get("month");
  const group = url.searchParams.get("group");
  const conditions = [];
  const params = [];
  if (month) {
    conditions.push("CAST(substr(activity_date, 6, 2) AS INTEGER) = ?");
    params.push(Number(month));
  }
  if (group) {
    conditions.push("quorum_group = ?");
    params.push(group);
  }
  let query = "SELECT * FROM activities";
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY activity_date ASC, id ASC";
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return results.map(rowToActivity);
}

function rowToActivity(row) {
  let inCharge = [];
  try {
    inCharge = JSON.parse(row.in_charge || "[]");
  } catch {
    inCharge = [];
  }
  return { ...row, in_charge: inCharge };
}

async function createActivity(env, body) {
  const inCharge = JSON.stringify(parseInCharge(body.in_charge));
  const result = await env.DB.prepare(
    `INSERT INTO activities (activity_date, week_of_month, meeting_type, quorum_group, category, activity_name, needed, notes, in_charge, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      body.activity_date,
      body.week_of_month ?? null,
      body.meeting_type ?? null,
      body.quorum_group ?? null,
      body.category ?? null,
      body.activity_name ?? null,
      body.needed ?? null,
      body.notes ?? null,
      inCharge
    )
    .run();
  const row = await env.DB.prepare("SELECT * FROM activities WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
  return rowToActivity(row);
}

async function updateActivity(env, id, body) {
  const inCharge = JSON.stringify(parseInCharge(body.in_charge));
  await env.DB.prepare(
    `UPDATE activities SET activity_date = ?, week_of_month = ?, meeting_type = ?, quorum_group = ?, category = ?,
       activity_name = ?, needed = ?, notes = ?, in_charge = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.activity_date,
      body.week_of_month ?? null,
      body.meeting_type ?? null,
      body.quorum_group ?? null,
      body.category ?? null,
      body.activity_name ?? null,
      body.needed ?? null,
      body.notes ?? null,
      inCharge,
      id
    )
    .run();
  const row = await env.DB.prepare("SELECT * FROM activities WHERE id = ?").bind(id).first();
  return row ? rowToActivity(row) : null;
}

// ---------- Birthdays ----------

async function listBirthdays(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM birthdays ORDER BY birth_month ASC, birth_day ASC"
  ).all();
  return results;
}

async function createBirthday(env, body) {
  const result = await env.DB.prepare(
    `INSERT INTO birthdays (name, birth_month, birth_day, quorum_group, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(body.name, body.birth_month, body.birth_day, body.quorum_group ?? null)
    .run();
  return env.DB.prepare("SELECT * FROM birthdays WHERE id = ?").bind(result.meta.last_row_id).first();
}

async function updateBirthday(env, id, body) {
  await env.DB.prepare(
    `UPDATE birthdays SET name = ?, birth_month = ?, birth_day = ?, quorum_group = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(body.name, body.birth_month, body.birth_day, body.quorum_group ?? null, id)
    .run();
  return env.DB.prepare("SELECT * FROM birthdays WHERE id = ?").bind(id).first();
}

// ---------- Discussion Leaders ----------

async function listDiscussionLeaders(env, url) {
  const group = url.searchParams.get("group");
  let query = "SELECT * FROM discussion_leaders";
  const params = [];
  if (group) {
    query += " WHERE quorum_group = ?";
    params.push(group);
  }
  query += " ORDER BY quorum_group ASC, assignment_date ASC";
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return results;
}

async function createDiscussionLeader(env, body) {
  const result = await env.DB.prepare(
    `INSERT INTO discussion_leaders (assignment_date, quorum_group, leader_name, topic, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(body.assignment_date, body.quorum_group, body.leader_name, body.topic ?? null)
    .run();
  return env.DB.prepare("SELECT * FROM discussion_leaders WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
}

async function updateDiscussionLeader(env, id, body) {
  await env.DB.prepare(
    `UPDATE discussion_leaders SET assignment_date = ?, quorum_group = ?, leader_name = ?, topic = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(body.assignment_date, body.quorum_group, body.leader_name, body.topic ?? null, id)
    .run();
  return env.DB.prepare("SELECT * FROM discussion_leaders WHERE id = ?").bind(id).first();
}

// ---------- Router ----------

async function handleApi(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api/auth" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const token = await createToken(env, body.pin);
    if (!token) return errorResponse("Incorrect PIN", 401);
    return json({ token });
  }

  const activityIdMatch = pathname.match(/^\/api\/activities\/(\d+)$/);
  const birthdayIdMatch = pathname.match(/^\/api\/birthdays\/(\d+)$/);
  const leaderIdMatch = pathname.match(/^\/api\/discussion-leaders\/(\d+)$/);

  // Activities
  if (pathname === "/api/activities" && method === "GET") {
    return json(await listActivities(env, url));
  }
  if (pathname === "/api/activities" && method === "POST") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.activity_date) return errorResponse("activity_date is required", 400);
    return json(await createActivity(env, body), 201);
  }
  if (activityIdMatch && method === "PUT") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.activity_date) return errorResponse("activity_date is required", 400);
    const updated = await updateActivity(env, activityIdMatch[1], body);
    if (!updated) return errorResponse("Not found", 404);
    return json(updated);
  }
  if (activityIdMatch && method === "DELETE") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    await env.DB.prepare("DELETE FROM activities WHERE id = ?").bind(activityIdMatch[1]).run();
    return new Response(null, { status: 204 });
  }

  // Birthdays
  if (pathname === "/api/birthdays" && method === "GET") {
    return json(await listBirthdays(env));
  }
  if (pathname === "/api/birthdays" && method === "POST") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.birth_month || !body.birth_day)
      return errorResponse("name, birth_month, birth_day are required", 400);
    return json(await createBirthday(env, body), 201);
  }
  if (birthdayIdMatch && method === "PUT") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.birth_month || !body.birth_day)
      return errorResponse("name, birth_month, birth_day are required", 400);
    const updated = await updateBirthday(env, birthdayIdMatch[1], body);
    if (!updated) return errorResponse("Not found", 404);
    return json(updated);
  }
  if (birthdayIdMatch && method === "DELETE") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    await env.DB.prepare("DELETE FROM birthdays WHERE id = ?").bind(birthdayIdMatch[1]).run();
    return new Response(null, { status: 204 });
  }

  // Discussion leaders
  if (pathname === "/api/discussion-leaders" && method === "GET") {
    return json(await listDiscussionLeaders(env, url));
  }
  if (pathname === "/api/discussion-leaders" && method === "POST") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.assignment_date || !body.quorum_group || !body.leader_name)
      return errorResponse("assignment_date, quorum_group, leader_name are required", 400);
    return json(await createDiscussionLeader(env, body), 201);
  }
  if (leaderIdMatch && method === "PUT") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    const body = await request.json().catch(() => null);
    if (!body || !body.assignment_date || !body.quorum_group || !body.leader_name)
      return errorResponse("assignment_date, quorum_group, leader_name are required", 400);
    const updated = await updateDiscussionLeader(env, leaderIdMatch[1], body);
    if (!updated) return errorResponse("Not found", 404);
    return json(updated);
  }
  if (leaderIdMatch && method === "DELETE") {
    if (!(await requireAuth(request, env))) return errorResponse("Unauthorized", 401);
    await env.DB.prepare("DELETE FROM discussion_leaders WHERE id = ?").bind(leaderIdMatch[1]).run();
    return new Response(null, { status: 204 });
  }

  return errorResponse("Not found", 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return errorResponse(err.message || "Internal error", 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
