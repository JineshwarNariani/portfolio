import type { FeatherId } from "./featherConfig";

/**
 * All portfolio copy. Sourced from Jineshwar's resumes, project write-ups and
 * Devpost. Placeholders are marked — never invent metrics or honours.
 */
const RESUME = "https://docs.google.com/document/d/1dtZfoyv4x7eW4ZH8KnJQKlh082ax5ydx96Eq-vC6KV4/edit?usp=sharing";

export const profile = {
  name: "Jineshwar Nariani",
  roles: ["AI Engineer", "Researcher", "Builder", "Founder"],
  summary:
    "I work across applied AI, multi-agent systems, financial research, and entrepreneurship — building systems where models, data, and real-world workflows meet.",
  education: {
    school: "University of Massachusetts Amherst",
    degree: "B.S. Computer Science & Mathematics (Statistics concentration)",
    honours: ["Chancellor’s Award", "Dean’s Merit Scholarship", "Dean’s International Scholarship"],
    detail: "GPA 3.86 · Dean’s List All Eight Semesters · Commonwealth Honors College · 2026",
  },
  /** Shown behind "Read more…" in About. */
  about: [
    "My work sits where AI meets messy real workflows: multi-agent LLM systems for research labs, reinforcement learning for markets, and products that make hard things usable — legal rights, sign language, learning. I care about systems people can check: retrieval-grounded answers, benchmarks over vibes, and technology that serves the public interest.",
    "Outside of code, I’ve been a Resident Assistant for four years, help run Hindu YUVA, and have built at 10+ hackathons.",
  ],
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jineshwar-nariani/" },
    { label: "GitHub", href: "https://github.com/JineshwarNariani" },
    { label: "X / Twitter", href: "https://x.com/thejinu22" },
    { label: "Devpost", href: "https://devpost.com/JineshwarNariani" },
    { label: "Resume", href: RESUME },
    { label: "Email", href: "mailto:jineshwarkn@gmail.com" },
  ],
  resumeHref: RESUME,
};

export interface Entry {
  title: string;
  /** Role / organisation / dates line. */
  meta?: string;
  body?: string;
  /** Short tags rendered as a dotted line. */
  tags?: string[];
  /** Project links (Devpost, GitHub, demo). */
  links?: { label: string; href: string }[];
  placeholder?: boolean;
}

export interface SectionContent {
  intro?: string;
  /** Closing line under the entries. */
  note?: string;
  entries: Entry[];
  links?: { label: string; href: string }[];
}

export const sections: Record<FeatherId, SectionContent> = {
  experience: {
    entries: [
      {
        title: "PRISM — NSF Research",
        meta: "AI Software Engineer · Jan 2025 – Jun 2026 · Amherst, MA",
        body: "Worked in a near forward-deployed role across a gene lab, a biotech lab, a photonics lab and the campus library’s resource office, building one multi-agent research framework re-pointed at each. Role-specialised agents (retrieval, analysis, synthesis) ran inside LangGraph graphs for branching and retries; each lab’s data came in through its own MCP server, so onboarding a new lab meant a new tool server, not new orchestration. Answers were retrieval-grounded, and retrieval strategies shipped only after winning feature-flagged benchmarks. The specifics differed lab to lab, but the underlying mechanism was common — each new lab went faster than the last.",
        tags: ["Agents", "LangGraph", "n8n", "MCP", "RAG", "Evals", "Docker"],
      },
      {
        title: "Manning College of Information & Computer Sciences",
        meta: "Undergraduate Researcher · Jan 2025 – May 2026 · Amherst, MA",
        body: "Designed a financial reinforcement-learning architecture combining multi-agent RL with large language models for personalised portfolio optimisation — paper proposal accepted at IEEE IDS 2025. Implemented adversarial inverse reinforcement learning (AIRL) for market-making simulations.",
        tags: ["Multi-agent RL", "AIRL", "PyTorch", "LLMs", "Finance"],
      },
      {
        title: "UMass Amherst Mathematics & Statistics",
        meta: "Summer REU · Jun – Aug 2025 · Cambridge, MA",
        body: "Analysed 22 years of U.S. tariff policy against trade flows and macro indicators (correlation, mutual information, Granger causality, random forests). Built a hybrid VMD-LSTM forecaster that beat LSTM, BiLSTM and GRU baselines by 27%; co-authored the resulting paper.",
        tags: ["Time series", "Statistics", "Economics", "Machine Learning", "Data Science"],
      },
      {
        title: "Sky Governance",
        meta: "Backend Engineer · Jun – Aug 2024 · Berkeley, CA",
        body: "Designed a microservices architecture integrating SQL databases across AWS, Azure and GCP, with retrieval-augmented fine-tuning (RAFT) for anomaly detection and compliance monitoring — real-time alerts and automated remediation of governance breaches.",
        tags: ["Microservices", "Databases", "AWS", "Azure", "GCP", "RAFT"],
      },
      {
        title: "Accurate Industrial Controls",
        meta: "Machine Learning Intern · Jun – Aug 2023 · Pune, India",
        body: "Trained decision-tree and CNN models on real-time sensor data from industrial robots that manufacture electrical transformers, and modelled the robots’ physics in MATLAB and Python — improving robotic-arm efficiency by 20%.",
        tags: ["TensorFlow", "Keras", "MATLAB", "SciPy", "NumPy", "Machine Learning", "Robotics"],
      },
    ],
  },
  projects: {
    intro: "Mostly built at hackathons — 10+ so far, several of them winners.",
    entries: [
      {
        title: "Clause",
        meta: "AI Legal-Enforcement Platform · Best Use of AI Winner",
        body: "Upload a lease, medical bill or contract; Clause finds violations, calculates damages and drafts demand letters citing Massachusetts statutes. It drops any claim it can’t trace to a retrieved statute rather than let the model guess, keeps personal data local behind a leak-free redaction pipeline, flags illegal clauses live on Airbnb via a Chrome extension, and timestamps evidence on Solana.",
        tags: ["Snowflake Cortex RAG", "Gemini", "FastAPI", "MCP", "Solana"],
        links: [
          { label: "Devpost", href: "https://devpost.com/software/clause-bu9l74" },
          { label: "Demo", href: "https://youtu.be/FwFLnbPbcfw" },
        ],
      },
      {
        title: "Maple AI",
        meta: "Emotionally Intelligent Learning Companion · Best AI Project with Databricks Winner",
        body: "Breaks hard topics into steps and notices when a student is frustrated or confused — Hume EVI reads emotion in voice — then adapts its guidance. A Databricks RAG stack (DBRX, LanceDB, LlamaIndex) keeps answers grounded.",
        tags: ["Hume EVI", "Databricks", "LangChain", "Next.js", "Flask"],
        links: [
          { label: "Devpost", href: "https://devpost.com/software/maple-ai" },
          { label: "GitHub", href: "https://github.com/lonexreb/Maple" },
          { label: "Demo", href: "https://www.youtube.com/watch?v=VAXf0UCmKZ8" },
        ],
      },
      {
        title: "EchoHands",
        meta: "Real-Time ASL Learning · Two Awards at HackHer",
        body: "Duolingo doesn’t teach American Sign Language, so I built something that does: MediaPipe pose estimation gives instant feedback on each sign, with custom PyTorch recognition models and AI tutoring. Drew interest from venture investors.",
        tags: ["MediaPipe", "PyTorch", "TensorFlow", "RAG", "Next.js"],
        links: [{ label: "Devpost", href: "https://devpost.com/software/echohands" }],
      },
      {
        title: "GritHub",
        meta: "GenAI Personal Sports Coach",
        body: "A 10-step training regime built on Amazon Bedrock, form feedback from a vision-language model (UForm-Gen2 on Cloudflare) analysing training video, and emotionally aware 1:1 voice coaching through Hume EVI 2 — with progress tracked in MongoDB Atlas.",
        tags: ["Amazon Bedrock", "VLM", "Hume EVI 2", "FastAPI", "MongoDB"],
        links: [
          { label: "Devpost", href: "https://devpost.com/software/grithub" },
          { label: "Demo", href: "https://youtu.be/uLYyqw6vg40" },
        ],
      },
      {
        title: "Artsee",
        meta: "Agentic Creative Collaboration",
        body: "Each artist gets an autonomous Fetch.ai uAgent that holds their creative profile and, by design, finds collaborators and negotiates terms on their behalf. Computer vision and vision-language models (VLMs) read the artwork itself to understand each artist’s style; Claude handles agent-to-agent conversation and Groq provides fast inference.",
        tags: ["Fetch.ai uAgents", "Agentverse", "Computer Vision", "VLMs", "Claude", "Groq"],
        links: [
          { label: "Devpost", href: "https://devpost.com/software/artsee-ptek75" },
          { label: "Demo", href: "https://youtu.be/kdlt0cKnx4k" },
        ],
      },
      {
        title: "AISH",
        meta: "AI-Powered Terminal · CUhackit 2025",
        body: "A terminal that thinks, speaks and automates: voice interaction, web search through Perplexity, AI reasoning with DeepSeek and Qwen, and one-command GPU environment setup (CUDA, cuDNN).",
        tags: ["LangChain", "Hume AI", "Perplexity", "CUDA", "Flask"],
        links: [
          { label: "Devpost", href: "https://devpost.com/software/aish" },
          { label: "Demo", href: "https://youtu.be/yVKeL9_7uik" },
        ],
      },
      {
        title: "LLM 10-K Analysis",
        meta: "Automated SEC Filing Analysis",
        body: "Reading 10-K filings reveals a company’s risks, financial health and strategic direction — but doing it by hand is slow. This pipeline downloads the 10-Ks for selected companies from 1995–2023 with sec-edgar-downloader (handling companies with fewer filings), cleans and chunks the text, and uses GPT to extract trends in risk factors, management discussion and sentiment. The results are shown as word clouds, trend graphs and sentiment charts in an interactive web app: a React/Vue front end over a Flask/FastAPI back end, with Plotly and D3 visualisations.",
        tags: ["Python", "sec-edgar-downloader", "OpenAI GPT", "Chunking", "Flask", "FastAPI", "React", "Plotly", "D3"],
        links: [
          { label: "Project outline", href: "https://docs.google.com/document/d/1_0kBgNxHMhC94vATykttsl-RDwLNLvJ0mrh16XBolfA/edit?usp=sharing" },
          { label: "Colab", href: "https://colab.research.google.com/drive/1yKWXCGV2SDIrba1RADtK16EAcWiqpa4Z?usp=sharing" },
        ],
      },
      {
        title: "Workmark",
        meta: "Co-Founder · See the Founder Feather",
        body: "A platform where CS students build verified work experience through collaborative GitHub projects and micro-internships with startups, SMBs and nonprofits.",
        tags: ["Founder"],
      },
    ],
  },
  research: {
    entries: [
      {
        title: "Strategic Deception in Financial Markets",
        meta: "Honors Thesis · Commonwealth Honors College · Advised by Prof. Patrick Flaherty & Prof. Hedyeh Beyhaghi",
        body: "Decoy Trading and the Limits of Adversarial Detection. Can an investor hide a real trade among decoy orders well enough to fool an adversary watching the market? I built a multi-agent reinforcement-learning system to find out, pitting the investor against four detectors: deep RL, Bayesian inference, maximum likelihood and an urgency-based heuristic. I expected the deep-RL adversary to dominate. It didn’t: against a naive investor, the simple structural Bayesian detector won with 99.5% detection. Once the investor was allowed to adapt, it drove every detector towards a near-random equilibrium. Next steps are limit order books and latency, and reframing the adversary as inverse RL under strategic resistance.",
        tags: [
          "Multi-agent RL",
          "Adversarial Detection",
          "Market Microstructure",
          "Bayesian Inference",
          "Maximum Likelihood",
          "Game Theory",
          "Portfolio Allocation",
          "Statistical Modelling",
          "Signal Extraction",
        ],
      },
      {
        title: "PRISM",
        meta: "NSF Research · Multi-Agent LLM Systems",
        body: "Agentic research workflows over long documents for four very different groups — a gene lab, a biotech lab, a photonics lab and the campus library’s resource office. Role-specialised agents for retrieval, analysis and synthesis run inside LangGraph graphs that handle branching and retries, and each lab’s data comes in through its own MCP server, so a new lab needs a new tool server rather than new orchestration. Every answer is retrieval-grounded, so researchers can check it against the source. Retrieval and modelling choices ship only after winning feature-flagged benchmarks, with models evaluated end to end (including H2O AutoML) before they reach researchers.",
        tags: ["Agentic Systems", "LangGraph", "MCP", "RAG", "Evals", "Feature-flagged Experiments", "H2O AutoML"],
      },
      {
        title: "Financial RL for Portfolio Optimisation",
        meta: "Manning CICS · Paper Proposal Accepted at IEEE IDS 2025",
        body: "An architecture that combines multi-agent reinforcement learning with large language models to personalise portfolio optimisation. I backtested and validated trading-strategy models under uncertainty with PyTorch and scikit-learn, judging them on statistical metrics so they generalise across volatile, data-sparse markets. I also implemented adversarial inverse reinforcement learning (AIRL) to model adaptive market makers from incomplete and noisy data.",
        tags: ["MARL", "AIRL", "LLMs", "Portfolio Optimization", "Backtesting", "PyTorch", "Scikit-learn"],
      },
      {
        title: "Tariff-Policy Forecasting",
        meta: "UMass Math & Stats Summer REU · 2025 · Co-Authored Paper",
        body: "What did 22 years of U.S. tariff policy (2000–2022) actually do to trade flows? I cleaned and restructured large tariff, trade-flow and macroeconomic datasets, then measured the relationships with Pearson and Spearman correlation, mutual information, Granger causality tests and random forests. On top of that analysis I engineered a hybrid forecaster: variational mode decomposition splits each series into signals, which an LSTM combines with macroeconomic indicators. It beat LSTM, BiLSTM and GRU baselines by 27%. I co-authored the resulting paper and presented the findings to academic stakeholders and project leads.",
        tags: ["VMD-LSTM", "Granger Causality", "Time Series", "Mutual Information", "Random Forest", "Econometrics", "Forecasting"],
      },
      {
        title: "Program Synthesis vs. LLMs",
        meta: "Undergraduate Research Volunteer · UMass Amherst · Dec 2023 – Jan 2024",
        body: "Can a classical program synthesiser still compete with a large language model? I built program synthesisers with Rosette, a solver-aided language, and evaluated them against LLMs on the same programming tasks.",
        tags: ["Program Synthesis", "Rosette", "Formal Methods", "LLM Evaluation"],
      },
    ],
  },
  founder: {
    intro: "Building a better bridge between CS students and their first jobs.",
    entries: [
      {
        title: "Workmark",
        meta: "Co-Founder · workmark.org",
        body: "Workmark helps CS students build skills and credible work experience. Students team up on collaborative GitHub projects, and take on micro-internships and contract work with startups, SMBs and nonprofits.",
        links: [{ label: "workmark.org", href: "https://workmark.org" }],
      },
      {
        title: "The Problem",
        body: "We saw it constantly as students ourselves: the college-to-job pipeline in CS has become incredibly hard to navigate. You need experience to get an internship, but an internship to get experience. Meanwhile, employers sort enormous applicant pools using noisy signals — resumes, GPA, school name and self-reported skills.",
      },
      {
        title: "The Product",
        body: "The work students do on Workmark, together with their existing experience, becomes a Workmark portfolio. It holds richer, verified information about their skills, proficiencies, contributions and actual work. It is evidence of what someone has built, rather than a resume an employer has to read between the lines of.",
      },
      {
        title: "Progress",
        body: "Over the summer we built the platform and secured initial funding, and Workmark is about to be established as a C-Corp. We have already begun bringing on students from UMass and other Massachusetts universities.",
      },
      {
        title: "The Vision",
        body: "Work with employers so that verified Workmark portfolios become a stronger signal for internships and entry-level roles. The goal is to give talented students a real chance to show what they can do, especially those without the connections or traditional credentials that catch a recruiter’s eye.",
      },
    ],
  },
  achievements: {
    entries: [
      {
        title: "ASA DataFest 2026 — Best in Group",
        meta: "American Statistical Association · Team of Four",
        body: "Across 7.7M patient encounters we set out to show that patients facing social risks (transport, food, housing, money) had longer gaps in care — and found they weren’t disengaging, they were redirecting to the emergency department: 3+ social needs meant 3.3× the ED rate (18.4% vs 5.6%), with a tipping point between two and three needs.",
      },
      {
        title: "Hackathons",
        meta: "10+ Hackathons · 4 Awards",
        body: "Winners on Devpost: Clause, Maple AI and EchoHands — EchoHands took two awards at HackHer.",
      },
      {
        title: "Academic",
        meta: "UMass Amherst",
        body: "GPA 3.86 · Dean’s List All Eight Semesters · Recipient of the UMass Amherst Chancellor’s Award, Dean’s Merit Scholarship and Dean’s International Scholarship · Commonwealth Honors College Thesis · Paper Proposal Accepted at IEEE IDS 2025.",
      },
      {
        title: "Leadership",
        body: "Resident Assistant @ UMass Amherst · Treasurer @ Residence Hall Association, administering a $130,000 budget and redrafting its constitution · Secretary & Treasurer @ Hindu YUVA · Undergraduate Course Assistant @ Manning CICS · Student President @ Birla Public School.",
      },
    ],
  },
  writing: {
    intro: "Papers, a thesis and talks so far — essays and notes to follow.",
    entries: [
      {
        title: "Student Speaker, 2026 Graduation Ceremony",
        meta: "Manning College of Information & Computer Sciences · Senior Celebration",
        links: [{ label: "Ceremony", href: "https://www.cics.umass.edu/academics/commencement/senior-celebration" }],
      },
      {
        title: "Strategic Deception in Financial Markets: Decoy Trading and the Limits of Adversarial Detection",
        meta: "Honors Thesis · Commonwealth Honors College",
      },
      { title: "Trade-Policy Forecasting with Hybrid VMD-LSTM Models", meta: "Co-authored Research Paper · UMass Math & Stats REU, 2025" },
      { title: "Financial RL for Personalised Portfolio Optimisation", meta: "Paper Proposal · Accepted at IEEE IDS 2025" },
      { title: "Social Needs and Emergency-Department Use", meta: "Findings Talk to the Judges · ASA DataFest 2026" },
      { title: "Essays and Technical Notes", body: "In progress.", placeholder: true },
    ],
  },
  contact: {
    intro: "Open to conversations about engineering, research, life and building something new.",
    entries: [],
    links: profile.links,
  },
};

/**
 * Recruiter Quick View — everything important in ~20 seconds.
 */
export const quickView = {
  groups: [
    {
      title: "Selected Experience",
      items: [
        { name: "PRISM — NSF Research", detail: "AI Software Engineer · 2025–2026 · Agents, LangGraph, n8n, MCP, RAG, Evals" },
        { name: "Manning CICS", detail: "Undergraduate Researcher · 2025–2026 · Multi-Agent RL, AIRL, PyTorch, LLMs, Finance" },
        { name: "UMass Math & Stats REU", detail: "Summer 2025 · Time Series, Statistics, Economics, Machine Learning, Data Science" },
        { name: "Sky Governance", detail: "Backend Engineer · Summer 2024 · Microservices, Databases, AWS, Azure, GCP, RAFT" },
        { name: "Accurate Industrial Controls", detail: "ML Intern · Summer 2023 · TensorFlow, MATLAB, SciPy, NumPy, Machine Learning, Robotics" },
        { name: "Workmark", detail: "Co-Founder · Verified Work Portfolios for CS Students" },
      ],
    },
    {
      title: "Selected Projects",
      items: [
        { name: "Clause", detail: "Best Use of AI Winner · Snowflake Cortex RAG, Gemini, FastAPI, MCP, Solana" },
        { name: "Maple AI", detail: "Best AI Project with Databricks Winner · Hume EVI, Databricks, LangChain, Next.js" },
        { name: "EchoHands", detail: "Two Awards at HackHer · MediaPipe, PyTorch, TensorFlow, RAG, Next.js" },
        { name: "GritHub", detail: "Amazon Bedrock, VLM, Hume EVI 2, FastAPI, MongoDB" },
        { name: "Artsee", detail: "Fetch.ai uAgents, Agentverse, Computer Vision, VLMs, Claude, Groq" },
        { name: "AISH", detail: "CUhackit 2025 · LangChain, Hume AI, Perplexity, CUDA, Flask" },
        { name: "LLM 10-K Analysis", detail: "OpenAI GPT, Chunking, sec-edgar-downloader, FastAPI, Plotly, D3" },
      ],
    },
    {
      title: "Research",
      items: [
        { name: "Honors Thesis", detail: "Multi-Agent RL, Adversarial Detection, Market Microstructure, Bayesian Inference" },
        { name: "PRISM", detail: "Agentic Systems, LangGraph, MCP, RAG, Evals" },
        { name: "Financial RL", detail: "Paper Proposal Accepted at IEEE IDS 2025 · MARL, AIRL, Portfolio Optimization" },
        { name: "Tariff-Policy Forecasting", detail: "Co-Authored Paper · VMD-LSTM, Granger Causality, Time Series, Forecasting" },
        { name: "Program Synthesis vs. LLMs", detail: "Program Synthesis, Rosette, LLM Evaluation" },
      ],
    },
    {
      title: "Education & Honours",
      items: [
        { name: "UMass Amherst", detail: "B.S. Computer Science & Mathematics (Statistics) · GPA 3.86 · 2026" },
        { name: "Dean’s List", detail: "All Eight Semesters · Commonwealth Honors College" },
        { name: "Scholarships", detail: "Chancellor’s Award · Dean’s Merit Scholarship · Dean’s International Scholarship" },
        { name: "Student Speaker", detail: "Manning CICS 2026 Graduation Ceremony" },
        { name: "ASA DataFest 2026", detail: "Best in Group" },
        { name: "Hackathons", detail: "10+ Hackathons · 4 Awards" },
      ],
    },
  ],
  links: [profile.links.find((l) => l.label === "Resume")!, ...profile.links.filter((l) => l.label !== "Resume")],
};
