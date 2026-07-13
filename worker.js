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
        const { city = "unknown", date = "", tasks = [], homeCare = [], weather = null, corePlan = null } = body;
        if (!tasks.length) return json({ warnings: [], weatherTips: [] });

        const taskList = tasks.map(t => `• [${t.key}] ${t.text}`).join("\n");

        const weatherLine = weather
          ? `\nWeather forecast: High ${weather.hi}°F / Low ${weather.lo}°F, ${weather.condition}.`
          : "";

        const planContext = corePlan
          ? `\nThe Core-only itinerary already planned for the day:\n${corePlan}\n\nEvaluate each optional activity against this specific schedule — check whether it can realistically slot in given the timing and locations above.`
          : `\nNo Core-only plan exists yet. Evaluate each optional activity for general logistical fit in ${city} (significant detour 30+ min, major backtracking, or time conflict).`;

        const prompt = `You are a practical family trip logistics evaluator for the Coleman family (2 adults, 3 kids ages 10-16) in ${city} on ${date}.${weatherLine}
${planContext}

Optional (non-Core) activities to evaluate:
${taskList}

For each optional activity, decide if it creates a MEANINGFUL logistical problem: significant detour (30+ extra minutes), major backtracking, or a real time conflict with the Core schedule. If it fits fine, do NOT flag it.

${weather ? `Also consider the weather. If weather is notable (heat >88°F, rain, storms), add 1–2 short weather tips. Omit if mild.` : ""}

Return ONLY valid JSON, no markdown, no explanation:
{"warnings":[{"key":"EXACT_KEY_FROM_INPUT","reason":"concise reason, under 12 words"}],"weatherTips":["tip1","tip2"]}

Use exact key strings from the brackets. Empty arrays if nothing to flag.`;

        const text = await callAnthropic(apiKey, prompt, 500);
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "AI returned no JSON", raw: text }, 502);
        try { return json(JSON.parse(match[0])); }
        catch { return json({ error: "Invalid JSON from AI", raw: text }, 502); }
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

      // ── JOURNAL GENERATOR ───────────────────────────────────────────────────
      if (body.action === "generateJournal") {
        const { completedActivities = [] } = body;
        if (!completedActivities.length) return json({ error: "No completed activities provided" }, 400);

        const dayLines = completedActivities.map(d =>
          `${d.date} — ${d.city}:\n${d.activities.map(a => `  • ${a}`).join("\n")}`
        ).join("\n\n");

        const prompt = `You are writing a warm, personal travel journal for the Coleman family's East Coast trip in July 2026. Family: Chris and McKenna (parents), Sawyer (14), Pierce (11), Bennett (10), and their dog.

Here are the activities they completed, day by day:

${dayLines}

Write a warm, narrative day-by-day journal in first-person plural ("we"). Format each day with a header like "**Thu Jul 9 — New York City**" followed by 2–4 paragraphs of engaging narrative prose. Make it personal, vivid, and readable — like a real family travel journal, not a bullet list. Capture the energy of each city, the kids' reactions, and little moments. Where activities are transport or logistics (flights, trains, hotel check-in), weave them into the story rather than listing them flatly. Write the full journal from start to finish.`;

        const journal = await callAnthropic(apiKey, prompt, 4096);
        if (!journal) return json({ error: "No journal returned from AI" }, 502);
        return json({ journal });
      }

      // ── DAY PLANNER ─────────────────────────────────────────────────────────
      const { city = "unknown city", date = "", activities = [], suggestion = null, currentPlan = null, weather = null, lodging = null } = body;

      if (!activities.length && !suggestion) return json({ error: "No activities provided" }, 400);

      let transitGuide;
      if (city === "NYC" || city.includes("NYC")) {
        transitGuide = "Use specific NYC subway directions between each stop: include the line (e.g. A/C/E, 2/3, N/R/W), direction (Uptown/Downtown/Queens-bound), and the station name to board and exit. Also note walking distances where relevant. Use OMNY tap-to-pay (no MetroCard needed).";
      } else if (city === "Philly" || city.includes("Philly")) {
        transitGuide = "The family has a car. Include driving directions between stops (streets/highways), parking tips near each attraction, and walking distances once parked.";
      } else {
        transitGuide = "The family has a car or is using rideshare. Include driving directions, approximate drive times between stops, and any parking or access tips.";
      }

      const weatherContext = weather
        ? `\nWeather forecast for ${date}: High ${weather.hi}°F / Low ${weather.lo}°F, ${weather.condition}.`
        : "";
      const lodgingLine = lodging ? `\nThe family starts and ends the day at: ${lodging}.` : "";
      const weatherInstruction = weather
        ? `\nWeather awareness: The forecast is ${weather.hi}°F high / ${weather.lo}°F low, ${weather.condition}. If this is notable (heat >88°F, rain, storms, fog), add a concise "Weather tip: ..." line directly after the relevant activity step — e.g. move outdoor activities earlier if afternoon rain expected, flag hydration on hot days, suggest an indoor alternative if severe weather. Keep tips to 1–2 sentences max, only where genuinely useful. Do not add weather tips if conditions are mild and benign.`
        : "";

      const schedulingRules = `
Scheduling rules — apply strictly in this priority order:

STEP 1 — IDENTIFY TIME ANCHORS FIRST:
Scan every activity for explicit time-of-day language. Any activity containing words like "night," "at night," "evening," "sunset," "sunrise," "morning," "midnight," "breakfast," "lunch," "dinner," "brunch," or a specific clock time (e.g. "7pm," "10am") is TIME-ANCHORED and must be placed at its appropriate time slot regardless of where it appeared in the input list. Examples:
  • "Times Square at night" → schedule late evening (8pm+)
  • "sunset sail / sunset view" → schedule to align with actual sunset
  • "breakfast at X" → first slot of the day
  • "dinner reservation" → evening meal slot
  • "lunch at Y" → midday

STEP 2 — SEQUENCE NON-ANCHORED ACTIVITIES AROUND THOSE FIXED POINTS:
For all remaining activities (no time cues), arrange them geographically to minimize backtracking and total transit time. Group nearby locations together. Fill the schedule around the anchored slots established in Step 1.

STEP 3 — APPLY OPENING-HOURS AND CROWD LOGIC:
Within the non-anchored sequence, use common sense: visit popular attractions early before crowds, hit museums/indoor spots in midday heat, schedule restaurants at natural meal windows. Arrive early for timed-entry or high-demand spots.

CRITICAL: The input activity list is an UNORDERED SET. Completely ignore the order items appear in that list. The only order that matters is the optimized schedule you produce.`;

      let prompt;
      if (suggestion && currentPlan) {
        prompt = `You are a practical family travel planner helping the Coleman family (2 adults + 3 kids ages ~10-16) plan their day in ${city} on ${date}.${weatherContext}${lodgingLine}

Here is the current day itinerary:

${currentPlan}

The family wants to make this change: "${suggestion}"

Revise the itinerary to incorporate their suggestion. Re-evaluate time anchors (any activity with "night," "evening," "sunset," "morning," "breakfast/lunch/dinner" cues must stay at its correct time slot). Minimize backtracking for non-anchored items. ${transitGuide}${weatherInstruction}

CHAIN/MULTI-LOCATION: If any item could refer to a chain or multi-location venue, pick the specific location nearest to where the family will be at that point in the schedule. Name it by neighborhood or address in the directions.

MEAL COVERAGE: Review the revised schedule for natural lunch (~12–1pm) and dinner (~6–7pm) windows. If a mealtime window has no food item planned nearby, add a brief suggestion on its own line in that slot, clearly labeled:
"→ Not on your list, but nearby: [Name] — [one-line reason it fits]"
Only suggest when genuinely missing a meal; skip if the day already has food covered.

Format the response as a clean numbered itinerary. Start immediately with "1." — no preamble. Keep it practical and concise. For weather tips, use the exact format "Weather tip: ..." on its own line directly after the relevant step.`;
      } else {
        prompt = `You are a practical family travel planner helping the Coleman family (2 adults + 3 kids ages ~10-16) plan their day in ${city} on ${date}.${weatherContext}${lodgingLine}

Activities for the day (INPUT ORDER IS IRRELEVANT — treat as an unordered set):
${activities.map(a => `• ${a}`).join("\n")}
${schedulingRules}

For each scheduled step also:
• Provide specific transit/navigation directions. ${transitGuide}
• Include a rough time estimate at each location.
• Add a brief family tip where useful (what to skip if short on time, best photo spot, etc.).
${weatherInstruction}

CHAIN/MULTI-LOCATION: If any listed activity or food item could refer to a chain or multi-location venue (e.g. "Joe's Pizza", "Shake Shack", any restaurant chain), pick the specific location nearest to where the family will be at that point in the schedule. State the specific neighborhood or address in the directions step.

MEAL COVERAGE: After scheduling the listed activities, review the day for natural lunch (~12–1pm) and dinner (~6–7pm) windows. If either window has no food item planned nearby, add a brief suggestion on its own line in that slot, clearly labeled:
"→ Not on your list, but nearby: [Name] — [one-line reason it fits]"
Only suggest when genuinely missing a meal; skip if the day already has food covered at those times.

Format the response as a clean numbered itinerary. Start immediately with "1." — no preamble. Keep it practical and concise. For weather tips, use the exact format "Weather tip: ..." on its own line directly after the relevant step.`;
      }

      const plan = await callAnthropic(apiKey, prompt, 2048);
      if (!plan) return json({ error: "No plan returned from AI" }, 502);
      return json({ plan });

    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal error", detail: err.message }, 500);
    }
  },
};
