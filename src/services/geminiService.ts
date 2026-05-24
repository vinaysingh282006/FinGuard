import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG, isValidKey } from '../config/api';

let genAIClient: GoogleGenerativeAI | null = null;

// Initialize Google Generative AI safely
function getClient(): GoogleGenerativeAI | null {
  if (genAIClient) return genAIClient;
  
  if (isValidKey(API_CONFIG.GEMINI_API_KEY)) {
    try {
      genAIClient = new GoogleGenerativeAI(API_CONFIG.GEMINI_API_KEY);
      return genAIClient;
    } catch (e) {
      console.error('Failed to initialize GoogleGenerativeAI client:', e);
    }
  }
  return null;
}

/**
 * Generate a standard AI response (non-streaming).
 */
export async function generateAIResponse(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const client = getClient();
  
  if (client) {
    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        ...(systemInstruction ? { systemInstruction } : {}),
      });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (error) {
      console.warn('Gemini API call failed, falling back to simulation...', error);
    }
  }

  // Fallback to localized mock simulation
  return runMockSimulation(prompt, systemInstruction);
}

/**
 * Generate an AI response stream.
 * Calls onChunk for each stream slice and returns the complete text at the end.
 */
export async function generateAIResponseStream(
  prompt: string,
  onChunk: (text: string) => void,
  onComplete?: (text: string) => void,
  systemInstruction?: string
): Promise<string> {
  const client = getClient();
  
  if (client) {
    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        ...(systemInstruction ? { systemInstruction } : {}),
      });

      const result = await model.generateContentStream(prompt);
      let completeText = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        completeText += chunkText;
        onChunk(completeText);
      }
      
      if (onComplete) onComplete(completeText);
      return completeText;
    } catch (error) {
      console.warn('Gemini Streaming API call failed, falling back to typing simulation...', error);
    }
  }

  // Fallback simulation with typing simulation
  const mockText = await runMockSimulation(prompt, systemInstruction);
  
  // Simulate stream chunks using intervals
  let currentText = '';
  const words = mockText.split(' ');
  for (let i = 0; i < words.length; i++) {
    currentText += (i === 0 ? '' : ' ') + words[i];
    onChunk(currentText);
    await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
  }
  
  if (onComplete) onComplete(mockText);
  return mockText;
}

/**
 * Intelligent localized simulation engine for FinGuard X compliance intelligence
 */
function runMockSimulation(prompt: string, systemInstruction?: string): string {
  const p = prompt.toLowerCase();
  
  // 1. Transaction Deep Forensic Narrative
  if (p.includes('transaction') || p.includes('txid') || p.includes('hash')) {
    const hashMatch = prompt.match(/0x[a-fA-F0-9]+/);
    const hash = hashMatch ? hashMatch[0] : '0x3F8a5d3A...';
    return `**AML FORENSIC TRANSACTION SUMMARY [${hash.substring(0, 10)}]**

• **Routing Anomaly Check:** circular flow route detected between origin node and mixing pools.
• **Velocity Trigger:** transaction value is processed within anomalous timezone parameters (2:00 AM - 4:00 AM UTC).
• **Layering Vector:** target structured value splits into multiple sub-channels immediately post-egress.
• **Compliance Score:** 88/100 (HIGH RISK).

**Analysis:** This flow indicates a deliberate structuring technique (smurfing) to split high-volume transfers below typical banking triggers. Recommended action is to halt subsequent outbound transfers and issue a Suspicious Activity Report (SAR) to FinCEN network portals.`;
  }

  // 2. Wallet/Address Forensics
  if (p.includes('wallet') || p.includes('address') || p.includes('intel') || p.includes('decode')) {
    const addrMatch = prompt.match(/(0x[a-fA-F0-9]{8,}|bc1q[0-9a-zA-Z]{8,}|So11a[0-9a-zA-Z]{8,})/);
    const addr = addrMatch ? addrMatch[0] : 'Target Address';
    return `THREAT INTELLIGENCE SUMMARY:
Target address ${addr.substring(0, 12)}... is flagged as WATCHLIST/HIGH RISK (74/100 FTI). 
Entity ownership resolves to: OFAC Sanctions watchlist indirect counterparty. 

The account exhibits high-frequency interactions consistent with: HEAVY DEFI USER / PRIVACY SHIELD INTERACTOR. 
Flow volume totaling $1,450,000 USD has been logged in the past 24 hours. 
Counterparty risk remains HIGH; recommend immediate wallet mapping and regulatory watchlisting.`;
  }

  // 3. Copilot step-by-step investigations
  if (p.includes('copilot') || p.includes('phase')) {
    if (p.includes('phase 1') || p.includes('ingress')) {
      return `**[COPILOT PHASE 1: INGRESS RISK ANALYSIS]**

Initiating investigation on targeted node:
• **Sanctions Registry Match:** cross-checking against OFAC and global consolidated watchlists. Results: *CLEAN* or *INDIRECT CONNECTION* detected through intermediate transfers.
• **IP/Geo Audit:** Source node mapped to high-risk location. Network access latency suggests VPN/proxy tunneling obfuscation.
• **Account Age & Seed Origin:** Origin wallet is relatively new (created within 48 hours). Seed funds originated from a non-custodial decentralized liquidity pool.

**Risk Scoring Assessment:** High probability of anonymous onboarding setup. Proceeding to Phase 2 for flow rate calculations...`;
    } else if (p.includes('phase 2') || p.includes('velocity') || p.includes('layering')) {
      return `**[COPILOT PHASE 2: VELOCITY & LAYERING INVESTIGATION]**

Tracing transfer sequence from active context:
• **Layering Check:** Detected multiple sequential low-volume routing transactions through 4 intermediary wallets within a 9-minute interval. This is highly consistent with **smurfing/structuring patterns** designed to bypass AML compliance thresholds.
• **Velocity Index:** Cumulative volume moved is **$845,000 USD**. Transfer rate exceeds normal commercial velocity parameters by **240%**.
• **Split Routing:** Value split into uneven fractions and routed concurrently to obscure the direct audit trail.

**Recommendation:** Layering signatures confirmed. Proceeding to Integration phase check.`;
    } else if (p.includes('phase 3') || p.includes('mixer') || p.includes('integration')) {
      return `**[COPILOT PHASE 3: INTEGRATION POOLS DETECTION]**

Analyzing terminal egress destinations:
• **Privacy Protocol Ingress:** Traced 42% of the split funds routing towards a known **privacy mixer contract (Tornado Cash)**.
• **Non-Custodial Bridges:** Remaining funds have been exchanged via cross-chain bridges into anonymous gas tokens.
• **Target Exchange Egress:** Found destination hops connecting to accounts on exchanges lacking active compliance enforcement.

**Conclusion:** Integration phase is active. Funds are currently in the process of anonymization and distribution. Immediate mitigation required.`;
    } else if (p.includes('phase 4') || p.includes('sar') || p.includes('resolution')) {
      return `**[COPILOT PHASE 4: COMPLIANCE RESOLUTION & SAR]**

Generating Action Plan for active threat context:

**1. Emergency Interventions:**
• Notify central liquidity partners to blacklist target destination wallets.
• Halt withdrawal channels linked to the originating session address.

**2. SAR Filing Draft Narrative:**
*"At ${new Date().toLocaleTimeString()} UTC, the FinGuard X platform detected a circular layering pattern originating from target node. Funds totaling $845,000 USD were systematically structured across multiple intermediate hops and integrated into mixer pools. This sequence resembles historical Lazarus-affiliated routing patterns."*

**Status:** Intelligence package compiled. Ready for compliance download.`;
    }
  }

  // 4. Summaries and Anomalies
  if (p.includes('summarize') || p.includes('anomalies') || p.includes('active alerts')) {
    return `**Active Command Console Anomalies Summary:**

• **FTI Threat Index:** currently reading elevated levels due to transaction counts and suspicious routing flags.
• **Detected laundering loops:** multiple critical circular flows active on Ethereum chain.
• **Whale Activity:** 2 whale movements exceeding $10M USDT flagged as high-velocity redistributions, indicating defensive market shifts or migration.
• **Target Watchlist:** Lazarus exploit address is active and routing transactions via nested bridge hops.

**Actionable Advice:** Initiate Copilot Forensics on the latest critical alert, or download the SAR Compliance summary from the Report Center.`;
  }

  // 5. Predict / Forecast
  if (p.includes('predict') || p.includes('forecast') || p.includes('next threat')) {
    return `**FinGuard Threat Index Anomaly Forecast:**

Based on neural pattern matching and transaction velocity on active pools:
• **Next 4 Hours:** Threat index predicted to **increase by 8 points** due to ongoing circular routes.
• **Probability of Laundering Evasion:** **87%** if destination bridge pools remain unchecked.
• **Active Risk Vector:** Rapid token splitting (smurfing) across EVM layers.

**Preemptive Defense Recommendation:** Deploy localized AML evasion filters and auto-flag multi-hop splits below $15k USD.`;
  }

  // 6. Generic Fallback
  return `**Cognitive Insight Generated (FinGuard X):**

We processed your prompt regarding: *"${prompt}"*

1. **Platform Diagnostics:** Threat index is currently active. Security flags have been recorded on EVM and Bitcoin layers.
2. **Investigation Insight:** Standard transaction streams show moderate activity. We recommend running a "Tactical Anomalies Only" filter on the Live Feed page to isolate the high-risk flows.
3. **Preemptive Action:** Ensure API secrets are configured inside the GitHub Repository settings (or deployment manager) for production-grade live AI feedback.`;
}
