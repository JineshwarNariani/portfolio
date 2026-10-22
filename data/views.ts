/**
 * Audience views for Quick View: the same entries, filtered and described for
 * a particular reader, each at its own shareable URL (/for/<id>).
 *
 * To switch the whole feature off, set VIEWS_ENABLED to false: Quick View goes
 * back to its single list and /for/* pages return 404. (The pre-views site is
 * also tagged in git as `before-views`.)
 */
export const VIEWS_ENABLED = true;

export const VIEW_IDS = ["research", "engineering", "fde"] as const;
export type ViewId = (typeof VIEW_IDS)[number];

export const views: Record<ViewId, { label: string; summary: string; description: string }> = {
  research: {
    label: "AI Research",
    summary:
      "Research in multi-agent reinforcement learning, LLM systems and model evaluation — an honors thesis, a co-authored paper and a paper proposal accepted at IEEE IDS 2025.",
    description:
      "Jineshwar Nariani’s AI research: honors thesis on strategic deception in markets, financial RL (IEEE IDS 2025), tariff forecasting, Kan extensions and VLM evaluation.",
  },
  engineering: {
    label: "Software Engineering",
    summary:
      "I build full-stack AI products — grounded LLM pipelines, secure multi-tenant backends, and evals that show the system actually works.",
    description:
      "Jineshwar Nariani’s software engineering: full-stack AI products, LLM pipelines, multi-tenant backends, multi-cloud microservices and award-winning hackathon builds.",
  },
  fde: {
    label: "GTM / Forward-Deployed",
    summary:
      "I take an AI system into very different environments and make it work there — four research labs at PRISM — and I build tools that keep a company’s technical claims accurate.",
    description:
      "Jineshwar Nariani’s forward-deployed and GTM work: AI systems deployed across four labs, a claim-accuracy tool for GTM teams, Workmark, and public speaking.",
  },
};

export const isViewId = (v: string): v is ViewId => (VIEW_IDS as readonly string[]).includes(v);
