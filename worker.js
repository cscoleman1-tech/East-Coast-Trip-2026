/**
 * East Coast Trip 2026 — AI Worker
 * Deploy to Cloudflare Workers.
 * Set secret: ANTHROPIC_API_KEY = your key from console.anthropic.com
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function resolveSecret(binding) {
  if (!binding) return null;
  if (typeof binding === "string") return binding;
  if (typeof binding.get === "function") return await binding.get();
  return null;
}

async function callAnthropic(apiKey, prompt, maxTokens = 1024) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();
  return data?.content?.[0]?.text || "";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const apiKey = await resolveSecret(env.ANTHROPIC_API_KEY) || await resolveSecret(env["Anthropic-Key"]);
    if (!apiKey) return json({ error: "ANTHROPIC_API_KEY secret not found — check Bindings in Cloudflare dashboard" }, 500);

    try {
      // ── PACK COMMAND PARSER ─────────────────────────────────────────────────
      if (body.action === "parsePackCommand") {
        const { command = "" } = body;
        if (!command.trim()) return json({ error: "No command provided" }, 400);

        const prompt = `Parse this packing list command for the Coleman family trip.

People: Chris, McKenna, Sawyer, Pierce, Bennett, General (shared family list).

Command: "${command}"

Return ONLY valid JSON, no markdown, no code fences:
{"actions":[{"type":"add","person":"NAME","item":"item text","category":"CATEGORY"},{"type":"remove","person":"NAME","item":"item text"}]}

Valid person values:
- "Chris", "McKenna", "Sawyer", "Pierce", "Bennett" — that person's individual list
- "General" — the shared family packing list (sunscreen, chargers, beach gear, documents, first aid, medications, etc.)
- "everyone" — all 5 individuals ONLY (never General)

Valid categories (for add only): "👕 Clothes & Personal Care" | "🔌 Electronics & Chargers" | "🏖️ Beach & Outdoor Gear" | "👦 Kids' Stuff" | "📄 Documents & Travel Info"

Rules:
- Return ONLY the actions the user asked for — do not add extra actions
- For remove actions, omit the category field entirely
- Use "General" when the item is shared/family-wide (sunscreen, meds, documents, chargers, beach gear)
- Use a person's name when the item is personal to them
- Keep item text natural and concise; for removes, keep it close to what the user said`;

        const text = await callAnthropic(apiKey, prompt, 512);
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "AI returned no JSON", raw: text }, 502);
        return json(JSON.parse(match[0]));
      }

      // ── CHECK FIT ───────────────────────────────────────────────────────────
      if (body.action === "checkFit") {
        const { city = "unknown", date = "", tasks = [] } = body;
        if (!tasks.length) return json({ error: "No tasks provided" }, 400);

        const coreItems = tasks.filter(t => t.isCore);
        const nonCoreItems = tasks.filter(t => !t.isCore);

        if (!nonCoreItems.length) return json({ warnings: [] });

        const coreList = coreItems.length
          ? coreItems.map(t => `• ${t.text}`).join("\n")
          : "(none flagged as Core — evaluate all items against each other)";
        const nonCoreList = nonCoreItems.map(t => `• [${t.key}] ${t.text}`).join("\n");

        const prompt = `You are a practical family trip logistics evaluator for the Coleman family (2 adults, 3 kids ages 10-16) in ${city} on ${date}.

Core activities (non-negotiable anchors for the day):
${coreList}

Other activities to evaluate for fit:
${nonCoreList}

For each "other" activity, decide if it creates a MEANINGFUL logistical problem relative to the core items and city layout: significant detour (30+ extra minutes), major backtracking across the city, or a real time conflict. If it fits fine alongside the core items, do NOT flag it.

Return ONLY valid JSON, no markdown, no explanation:
{"warnings":[{"key":"EXACT_KEY_FROM_INPUT","reason":"concise reason, under 12 words"}]}

Use the exact key string from the brackets in the input (e.g. trip-2026-07-10-3). Empty warnings array if everything fits.`;

        const text = await callAnthropic(apiKey, prompt, 400);
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "AI returned no JSON", raw: text }, 502);
        return json(JSON.parse(match[0]));
      }

      // ── UNIVERSAL COMMAND PARSER ─────────────────────────────────────────────
      if (body.action === "universalCommand") {
        const { command = "", context = {} } = body;
        if (!command.trim()) return json({ error: "No command provided" }, 400);
        const { preTripTasks = [], tripTasks = [], packItems = {}, reservations = [] } = context;

        const preTripSummary = preTripTasks.length
          ? preTripTasks.map(t => `  [${t.key}] ${t.text} (${t.date}${t.done ? ", done" : ""})`).join("\n")
          : "  (none)";
        const tripSummary = tripTasks.length
          ? tripTasks.map(t => `  [${t.key}] ${t.text} — ${t.city} ${t.date}${t.done ? " ✓" : ""}${t.isCore ? " [CORE]" : ""}`).join("\n")
          : "  (none)";
        const packSummary = Object.entries(packItems).map(([person, cats]) =>
          `  ${person}: ${Object.entries(cats).map(([cat, items]) => items.map(i => `${i.text}${i.done?" ✓":""}`).join(", ")).join(" | ")}`
        ).join("\n") || "  (none)";
        const resSummary = reservations.length
          ? reservations.map(r => `  [${r.id}] ${r.title} (${r.type}) ${r.date || r.startDate || ""}${r.confirmNum ? " conf:"+r.confirmNum : ""}`).join("\n")
          : "  (none)";

        const prompt = `You are an AI assistant for the Coleman family East Coast Trip 2026 planning app.
Parse the user's command and return structured actions.

CURRENT APP STATE:
Pre-trip tasks:
${preTripSummary}

Trip day tasks:
${tripSummary}

Packing lists (person → category → items):
${packSummary}

Reservations/Travel:
${resSummary}

USER COMMAND: "${command}"

Return ONLY valid JSON, no markdown, no code fences:
{"actions":[...]}

Each action must have a "type" field. Supported types and their schemas:

taskToggle — mark a task done/undone
  {"type":"taskToggle","key":"EXACT_KEY","label":"display text","done":true|false}

taskAdd — add a new task to a specific date
  {"type":"taskAdd","date":"YYYY-MM-DD","text":"task text","taskType":"activity"|"food"|"transport"|"booking"|"reminder"}
  Use date "pretrip" for pre-trip tasks.

taskDelete — remove a task
  {"type":"taskDelete","key":"EXACT_KEY","label":"display text"}

taskEdit — edit a task's text
  {"type":"taskEdit","key":"EXACT_KEY","label":"old text","newText":"new text"}

packAdd — add item to a person's packing list
  {"type":"packAdd","person":"Chris"|"McKenna"|"Sawyer"|"Pierce"|"Bennett"|"General","item":"item text","category":"👕 Clothes & Personal Care"|"🔌 Electronics & Chargers"|"🏖️ Beach & Outdoor Gear"|"👦 Kids' Stuff"|"📄 Documents & Travel Info"}

packRemove — remove a packing item
  {"type":"packRemove","person":"NAME","item":"EXACT_ITEM_TEXT","label":"display text"}

reservationAdd — add a new reservation/travel item
  {"type":"reservationAdd","title":"name","travelType":"flight"|"hotel"|"train"|"car"|"restaurant"|"activity"|"ferry"|"bus"|"attraction"|"other","confirmNum":"","date":"YYYY-MM-DD","time":"","location":"","notes":""}

reservationEdit — edit an existing reservation
  {"type":"reservationEdit","id":"EXACT_ID","label":"display text","updates":{"field":"value"}}

coreToggle — mark a trip task as core/non-core
  {"type":"coreToggle","key":"EXACT_KEY","label":"display text","isCore":true|false}

Rules:
- Use EXACT keys/IDs from the state above when available. If uncertain, use the closest match and include a "fuzzy":true field.
- For packRemove, match exact item text from the state; if uncertain use fuzzy:true.
- Return only the actions the user asked for.
- For multi-part commands, return multiple actions.
- If no matching task/item found for an operation, still return the action with your best guess at key/text and fuzzy:true.`;

        const text = await callAnthropic(apiKey, prompt, 1500);
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "AI returned no JSON", raw: text }, 502);
        try { return json(JSON.parse(match[0])); }
        catch { return json({ error: "Invalid JSON from AI", raw: text }, 502); }
      }

      // ── DAY PLANNER ─────────────────────────────────────────────────────────
      const { city = "unknown city", date = "", activities = [], suggestion = null, currentPlan = null } = body;

      if (!activities.length && !suggestion) return json({ error: "No activities provided" }, 400);

      let transitGuide;
      if (city === "NYC" || city.includes("NYC")) {
        transitGuide = "Use specific NYC subway directions between each stop: include the line (e.g. A/C/E, 2/3, N/R/W), direction (Uptown/Downtown/Queens-bound), and the station name to board and exit. Also note walking distances where relevant. Use OMNY tap-to-pay (no MetroCard needed).";
      } else if (city === "Philly" || city.includes("Philly")) {
        transitGuide = "The family has a car. Include driving directions between stops (streets/highways), parking tips near each attraction, and walking distances once parked.";
      } else {
        transitGuide = "The family has a car or is using rideshare. Include driving directions, approximate drive times between stops, and any parking or access tips.";
      }

      let prompt;
      if (suggestion && currentPlan) {
        prompt = `You are a practical family travel planner helping the Coleman family (2 adults + 3 kids ages ~10-16) plan their day in ${city} on ${date}.

Here is the current day itinerary:

${currentPlan}

The family wants to make this change: "${suggestion}"

Revise the itinerary to incorporate their suggestion. Keep it efficient — minimize backtracking and transit time. ${transitGuide}

Format the response as a clean numbered itinerary. Start immediately with "1." — no preamble. Keep it practical and concise.`;
      } else {
        prompt = `You are a practical family travel planner helping the Coleman family (2 adults + 3 kids ages ~10-16) plan their day in ${city} on ${date}.

Their activities for the day:
${activities.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Create an optimized day plan that:
1. Orders the activities for maximum efficiency (minimize backtracking and transit time)
2. Provides specific transit/navigation directions between each stop
3. ${transitGuide}
4. Includes rough time estimates at each location
5. Notes any practical family tips (best time to arrive, what to skip if short on time, etc.)

Format the response as a clean numbered itinerary. Start immediately with "1." — no preamble. Keep it practical and concise.`;
      }

      const plan = await callAnthropic(apiKey, prompt, 1024);
      if (!plan) return json({ error: "No plan returned from AI" }, 502);
      return json({ plan });

    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal error", detail: err.message }, 500);
    }
  },
};
