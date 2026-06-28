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

        const prompt = `Parse this packing list command for the Coleman family trip (members: Chris, McKenna, Sawyer, Pierce, Bennett).

Command: "${command}"

Return ONLY valid JSON — no markdown, no explanation, no code fences. Exactly this structure:
{"actions":[{"type":"add","person":"Chris|McKenna|Sawyer|Pierce|Bennett|everyone","item":"item text","category":"👕 Clothes & Personal Care|🔌 Electronics & Chargers|🏖️ Beach & Outdoor Gear|👦 Kids' Stuff|📄 Documents & Travel Info"},{"type":"remove","person":"Chris|McKenna|Sawyer|Pierce|Bennett|everyone","item":"item text"}]}

Rules:
- "everyone" adds/removes from all 5 individuals (never the General/shared list)
- Choose the most fitting category for each added item
- Keep item text natural and concise
- For removes, keep item text close to what the user said`;

        const text = await callAnthropic(apiKey, prompt, 512);
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "AI returned no JSON", raw: text }, 502);
        return json(JSON.parse(match[0]));
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
