/**
 * East Coast Trip 2026 — AI Day Planner Worker
 * Deploy this to Cloudflare Workers.
 * Set secret: ANTHROPIC_API_KEY = your key from console.anthropic.com
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { city = "unknown city", date = "", activities = [], suggestion = null, currentPlan = null } = body;

    if (!activities.length && !suggestion) {
      return new Response(JSON.stringify({ error: "No activities provided" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Build transit guidance based on city
    let transitGuide;
    if (city === "NYC" || city.includes("NYC")) {
      transitGuide =
        "Use specific NYC subway directions between each stop: include the line (e.g. A/C/E, 2/3, N/R/W), direction (Uptown/Downtown/Queens-bound), and the station name to board and exit. Also note walking distances where relevant. Use OMNY tap-to-pay (no MetroCard needed).";
    } else if (city === "Philly" || city.includes("Philly")) {
      transitGuide =
        "The family has a car. Include driving directions between stops (streets/highways), parking tips near each attraction, and walking distances once parked.";
    } else {
      transitGuide =
        "The family has a car or is using rideshare. Include driving directions, approximate drive times between stops, and any parking or access tips.";
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

    try {
      // Resolve secret: handles plain string (env var) and Secrets Store binding (object with .get())
      async function resolveSecret(binding) {
        if (!binding) return null;
        if (typeof binding === "string") return binding;
        if (typeof binding.get === "function") return await binding.get();
        return null;
      }
      const apiKey = await resolveSecret(env.ANTHROPIC_API_KEY) || await resolveSecret(env["Anthropic-Key"]);
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY secret not found — check Bindings in Cloudflare dashboard" }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error("Anthropic error:", errText);
        return new Response(JSON.stringify({ error: "AI request failed", detail: errText }), {
          status: 502, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      const plan = aiData?.content?.[0]?.text;

      if (!plan) {
        return new Response(JSON.stringify({ error: "No plan returned from AI" }), {
          status: 502, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ plan }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });

    } catch (err) {
      console.error("Worker error:", err);
      return new Response(JSON.stringify({ error: "Internal error", detail: err.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  },
};
