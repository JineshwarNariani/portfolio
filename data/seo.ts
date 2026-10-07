import type { FeatherId } from "./featherConfig";

/** Per-page search descriptions (≈150 characters, unique per page). */
export const pageDescriptions: Record<FeatherId | "home" | "about" | "quickView", string> = {
  home: "Jineshwar Nariani — AI engineer, researcher and founder. Multi-agent LLM systems, financial reinforcement learning, award-winning hackathon projects and Workmark.",
  about: "About Jineshwar Nariani: B.S. Computer Science & Mathematics at UMass Amherst (GPA 3.86), AI engineer, researcher and co-founder of Workmark.",
  quickView: "Jineshwar Nariani at a glance: experience, projects, research, education and honours on one page — with resume, LinkedIn and GitHub links.",
  experience: "Jineshwar Nariani’s experience: AI Software Engineer at PRISM (NSF research), Manning CICS researcher, Math & Stats REU, Sky Governance and Accurate Industrial Controls.",
  projects: "Projects by Jineshwar Nariani: Clause (Best Use of AI), Maple AI (Best AI Project with Databricks), EchoHands, GritHub, Artsee, AISH and LLM 10-K Analysis.",
  research: "Jineshwar Nariani’s research: honors thesis on strategic deception in financial markets, multi-agent LLM systems, financial RL (IEEE IDS 2025) and tariff forecasting.",
  founder: "Workmark, co-founded by Jineshwar Nariani: verified work portfolios that help CS students build credible experience and get hired.",
  achievements: "Jineshwar Nariani’s achievements: ASA DataFest 2026 Best in Group, 4 hackathon awards, Dean’s List all eight semesters, Chancellor’s Award and leadership roles.",
  writing: "Writing and speeches by Jineshwar Nariani: 2026 Manning CICS graduation student speaker, honors thesis, co-authored research paper and IEEE IDS 2025 proposal.",
  contact: "Contact Jineshwar Nariani — email, LinkedIn, GitHub, X and Devpost. Open to conversations about engineering, research and building something new.",
};
