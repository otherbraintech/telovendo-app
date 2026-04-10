export interface ReleaseVersion {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  type: "major" | "minor" | "patch";
}

export const CURRENT_VERSION = "1.2.0";

export const RELEASES: ReleaseVersion[] = [
  {
    version: "1.2.0",
    date: "2026-04-10",
    title: "AI Optimization & Bot Automation",
    description: "Major update focusing on stability and contact automation for Facebook Marketplace.",
    type: "minor",
    features: [
      "Automated WhatsApp contact injection in listing descriptions.",
      "Robust AI error handling to prevent production crashes (500 errors).",
      "Increased server timeouts (60s) for image generation in Vercel.",
      "Structured AI response pattern (AIActionResult) for better feedback.",
      "Bot assignment priority logic for WhatsApp-capable devices."
    ]
  },
  {
    version: "1.1.0",
    date: "2026-04-05",
    title: "Dashboard Enhancements",
    description: "UI improvements and bug fixes for the order management system.",
    type: "minor",
    features: [
      "Improved drag-and-drop image ordering.",
      "Enhanced order filtering by project.",
      "Real-time bot status monitoring (initial version).",
      "Fixed UI glitches in dark mode."
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-20",
    title: "Initial Launch",
    description: "The core platform for automated marketplace management.",
    type: "major",
    features: [
      "Multi-bot management system.",
      "Order creation and dispatch to Facebook Marketplace.",
      "AI-driven title and description generation.",
      "Product image generation using Gemini 1.5 Flash."
    ]
  }
];
