import type { ToolPricing } from "../../types/tool";

export const PRICING_DATA_VERSION = "1.0.0";

export const PRICING_DATA: ToolPricing[] = [
  {
    tool: "ChatGPT",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Plus",       pricePerSeat: 20  },
      { name: "Team",       pricePerSeat: 25  },
      { name: "Enterprise", pricePerSeat: 60  },
    ],
  },
  {
    tool: "Claude",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Pro",        pricePerSeat: 20  },
      { name: "Team",       pricePerSeat: 25  },
      { name: "Enterprise", pricePerSeat: 60  },
    ],
  },
  {
    tool: "Cursor",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Pro",        pricePerSeat: 20  },
      { name: "Business",   pricePerSeat: 40  },
    ],
  },
  {
    tool: "GitHub Copilot",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Individual", pricePerSeat: 10  },
      { name: "Business",   pricePerSeat: 19  },
      { name: "Enterprise", pricePerSeat: 39  },
    ],
  },
  {
    tool: "Gemini",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Business",   pricePerSeat: 20  },
      { name: "Enterprise", pricePerSeat: 30  },
    ],
  },
  {
    tool: "Windsurf",
    plans: [
      { name: "Free",       pricePerSeat: 0   },
      { name: "Pro",        pricePerSeat: 15  },
      { name: "Teams",      pricePerSeat: 35  },
    ],
  },
];
