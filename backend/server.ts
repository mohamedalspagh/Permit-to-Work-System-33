import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with Telemetry headers
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Ensure pre-empted fallback answers for offline / keyless testing
const getFallbackRecommendations = (promptType: string, task: string) => {
  if (promptType === "HIRA_AI") {
    return `### 💡 NEBOSH AI Controls for: "${task || 'Working in Confined Area'}"

**1. Elimination & Substitution:**
* Consider if mechanical diagnostic probes can perform internal thickness checks before sending workers inside.

**2. Engineering Controls:**
* **Mechanical Pinning:** Securely wedge structural elements to stop accidental weight transfer.
* **Positive Energy Isolation:** Enforce complete Lockout/Tagout (LOTO) on primary breakers.
* **Forced Air Exchange:** Mount pneumatic blowing devices to sweep the environment of toxic clinker particulates.

**3. Administrative Controls:**
* **Continuous Multi-Gas Sensing:** Require gas testing certificates every 2 hours (O2 target 19.5%-23.5%, LEL < 10%).
* **Safety Watcher:** Station an experienced observer continuously at the manhole.

**4. Required PPE:**
* Flame-retardant welding suit, double-lanyard body harness, and calibrated personal gas monitors.`;
  } else if (promptType === "PREDICTIVE_ANALYTICS") {
    return `### 📊 Predictive EHS Risk Analysis & Forecasts

1. **Hot Spot Zones:** The **Cement Mill Shell** and **Kiln preheater towers** present elevated potential for high-severity hazards (falls, entrapment).
2. **Key Contributor:** 65% of reported Near Misses link directly to hurried shift handovers or lack of individual lock application (LOTO omissions).
3. **Preventive Directive (ISO 45001):** Advise HSE Leads to run random audits on contractor padlock boxes during the coming 48-hour mechanical maintenance sweep.`;
  } else {
    return `### 🛡️ HSE Action Plan & Recommendations

* **Review Control Suitability:** Ensure a qualified supervisor inspects physical barricades before starting work.
* **Conduct Tool-Box Talk:** Disseminate NEBOSH General Certificate lessons to all mechanical sub-contractors on the shift.
* **Confirm Isolations:** Never rely on supervisor master keys; mandate personal locks at LOTO stations.`;
  }
};

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

// AI Safety recommendations endpoint
app.post("/api/ai/recommendations", async (req, res) => {
  const { promptType, task, currentStatus } = req.body;

  try {
    const client = getGeminiClient();
    if (!client) {
      // Return high-quality preseeded fallback advice immediately to prevent crash
      const fallback = getFallbackRecommendations(promptType, task);
      return res.json({ 
        recommendation: fallback,
        source: "Local Safety Brain (No API Key set)" 
      });
    }

    let searchPrompt = "";
    if (promptType === "HIRA_AI") {
      searchPrompt = `You are a NEBOSH-certified senior safety consultant. Provide a highly professional, bilingual (English + Arabic), bullet-by-bullet list of Hazard Control measures for the task: "${task || 'Welding in Cement Mill'}". 
      Structure your suggestions strictly around the Hierarchy of Controls (Elimination, Substitution, Engineering Controls, Administrative Controls, PPE). 
      Make the suggestions specific, technical, and ready to include in a cement plant safety plan. Keep the tone humble and authoritative.`;
    } else if (promptType === "PREDICTIVE_ANALYTICS") {
      searchPrompt = `You are an EHS Lead Analyst. Provide predictive analytics and risk forecasts for a heavy industrial cement manufacturing facility. 
      Mention hot-spot zones (e.g. Raw Mills, Kiln towers), the probability of incident types like Near Misses or property damage based on recent activities under status: "${currentStatus || 'REPORTED'}". 
      Add a 3-point recommendation under ISO 45001 standard. Keep the length concise and highly scannable, in Arabic and English.`;
    } else {
      searchPrompt = `Given the safety incident or hazard task "${task || 'Working in elevated platform'}", suggest 4 immediate corrective actions (CAPA) following safety standard ISO 45001 rules. Give output in a clear bilingual (En/Ar) format.`;
    }

    // Call modern gemini-3.5-flash model
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt
    });

    const recommendationText = response.text || getFallbackRecommendations(promptType, task);

    res.json({
      recommendation: recommendationText,
      source: "Gemini 3.5 Flash Safety Assistant"
    });

  } catch (error: any) {
    console.error("Gemini API Error in safety proxy:", error);
    // Graceful error recovery fallback
    res.json({
      recommendation: getFallbackRecommendations(promptType, task),
      source: "Local EHS Recovery System (Error fallback)"
    });
  }
});

// --- SERVER STATIC FILES IN PRODUCTION ---

async function start() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res.json({ message: "EHS Plant System API Server is running" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EHS Plant System API running at http://0.0.0.0:${PORT}`);
  });
}

start();
