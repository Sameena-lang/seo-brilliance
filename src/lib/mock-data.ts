export type Severity = "critical" | "warning" | "info";

export type Project = {
  id: string;
  name: string;
  domain: string;
  score: number;
  lastScan: string;
  pages: number;
  issues: number;
  status: "healthy" | "needs-attention" | "at-risk";
};

export const projects: Project[] = [
  {
    id: "acme-store",
    name: "Acme Store",
    domain: "acme-store.com",
    score: 82,
    lastScan: "2 hours ago",
    pages: 1284,
    issues: 59,
    status: "healthy",
  },
  {
    id: "nova-blog",
    name: "Nova Blog",
    domain: "nova-blog.io",
    score: 76,
    lastScan: "1 day ago",
    pages: 412,
    issues: 34,
    status: "needs-attention",
  },
  {
    id: "atlas-saas",
    name: "Atlas SaaS",
    domain: "atlas-saas.app",
    score: 91,
    lastScan: "3 days ago",
    pages: 867,
    issues: 18,
    status: "healthy",
  },
  {
    id: "bright-coffee",
    name: "Bright Coffee",
    domain: "bright-coffee.co",
    score: 68,
    lastScan: "5 days ago",
    pages: 229,
    issues: 71,
    status: "at-risk",
  },
  {
    id: "vela-fintech",
    name: "Vela Fintech",
    domain: "vela-fintech.com",
    score: 88,
    lastScan: "6 days ago",
    pages: 1042,
    issues: 26,
    status: "healthy",
  },
  {
    id: "harbor-legal",
    name: "Harbor Legal",
    domain: "harborlegal.co.uk",
    score: 73,
    lastScan: "1 week ago",
    pages: 318,
    issues: 44,
    status: "needs-attention",
  },
];

export const scoreTrend = [
  { label: "May 02", score: 64, issues: 121 },
  { label: "May 21", score: 68, issues: 108 },
  { label: "Jun 09", score: 67, issues: 112 },
  { label: "Jun 28", score: 72, issues: 96 },
  { label: "Jul 14", score: 71, issues: 92 },
  { label: "Jul 30", score: 76, issues: 81 },
  { label: "Aug 12", score: 78, issues: 74 },
  { label: "Aug 26", score: 82, issues: 59 },
];

export const issueDistribution = [
  { name: "Critical", value: 12, color: "var(--destructive)" },
  { name: "Warning", value: 47, color: "var(--warning)" },
  { name: "Info", value: 63, color: "var(--info)" },
  { name: "Passed", value: 214, color: "var(--success)" },
];

export const categoryScores = [
  { name: "Technical SEO", score: 88 },
  { name: "Content", score: 79 },
  { name: "Performance", score: 74 },
  { name: "Indexability", score: 91 },
  { name: "Accessibility", score: 69 },
];

export type Scan = {
  id: string;
  domain: string;
  startedAt: string;
  duration: string;
  pages: number;
  score: number;
  delta: number;
  issues: number;
  status: "completed" | "running" | "failed";
};

export const recentScans: Scan[] = [
  {
    id: "scn_8241",
    domain: "acme-store.com",
    startedAt: "Aug 26, 09:14",
    duration: "4m 12s",
    pages: 1284,
    score: 82,
    delta: 4,
    issues: 59,
    status: "completed",
  },
  {
    id: "scn_8232",
    domain: "nova-blog.io",
    startedAt: "Aug 25, 18:02",
    duration: "1m 48s",
    pages: 412,
    score: 76,
    delta: 2,
    issues: 34,
    status: "completed",
  },
  {
    id: "scn_8229",
    domain: "atlas-saas.app",
    startedAt: "Aug 23, 11:37",
    duration: "3m 05s",
    pages: 867,
    score: 91,
    delta: 1,
    issues: 18,
    status: "completed",
  },
  {
    id: "scn_8218",
    domain: "bright-coffee.co",
    startedAt: "Aug 21, 08:20",
    duration: "0m 58s",
    pages: 229,
    score: 68,
    delta: -3,
    issues: 71,
    status: "completed",
  },
  {
    id: "scn_8210",
    domain: "vela-fintech.com",
    startedAt: "Aug 20, 15:44",
    duration: "3m 41s",
    pages: 1042,
    score: 88,
    delta: 0,
    issues: 26,
    status: "failed",
  },
];

export type Issue = {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  affected: number;
  status: "open" | "in-progress" | "resolved";
  priority: "P1" | "P2" | "P3";
  description: string;
  why: string;
  fix: string;
  evidence: string;
  urls: string[];
};

export const issues: Issue[] = [
  {
    id: "missing-meta-descriptions",
    title: "Missing meta descriptions",
    severity: "critical",
    category: "Content",
    affected: 34,
    status: "open",
    priority: "P1",
    description:
      "34 indexable pages have no meta description tag, including several high-traffic category pages.",
    why: "Search engines fall back to arbitrary page copy when no description exists, which lowers click-through rate from the results page and weakens topical signals.",
    fix: "Write unique 140–160 character descriptions that lead with the primary keyword and a clear benefit. Templating is acceptable for paginated category pages as long as the variables produce distinct copy.",
    evidence: "<head> contains no <meta name=\"description\"> element on 34 of 1,284 crawled URLs.",
    urls: [
      "https://acme-store.com/collections/outdoor",
      "https://acme-store.com/collections/sale",
      "https://acme-store.com/products/trail-runner-2",
      "https://acme-store.com/blog/summer-gear-guide",
    ],
  },
  {
    id: "broken-canonical-tags",
    title: "Broken canonical tags",
    severity: "critical",
    category: "Technical SEO",
    affected: 38,
    status: "in-progress",
    priority: "P1",
    description: "Canonical URLs resolve to 404 or redirect chains on 38 product pages.",
    why: "An invalid canonical tells crawlers to consolidate signals into a page that does not exist, so the real page can drop out of the index entirely.",
    fix: "Point each canonical at the final, self-referencing 200 URL. Remove trailing-slash mismatches in the template that generates the tag.",
    evidence: "GET on canonical target returned 404 for 21 URLs and a 3-hop redirect for 17 URLs.",
    urls: [
      "https://acme-store.com/products/alpine-jacket",
      "https://acme-store.com/products/summit-pack",
      "https://acme-store.com/products/trail-runner-2",
    ],
  },
  {
    id: "slow-lcp",
    title: "Largest Contentful Paint above 4s",
    severity: "critical",
    category: "Performance",
    affected: 12,
    status: "open",
    priority: "P1",
    description: "Twelve templates render their hero image after 4 seconds on a throttled 4G profile.",
    why: "Core Web Vitals are a confirmed ranking signal and slow LCP correlates strongly with bounce on mobile commerce traffic.",
    fix: "Preload the hero image, serve AVIF/WebP at responsive widths, and drop the render-blocking font stylesheet in favour of a self-hosted subset.",
    evidence: "Median LCP 4.6s across 12 sampled templates; hero image weight averages 840 KB.",
    urls: ["https://acme-store.com/", "https://acme-store.com/collections/new"],
  },
  {
    id: "missing-h1",
    title: "Missing or duplicate H1",
    severity: "warning",
    category: "Content",
    affected: 21,
    status: "open",
    priority: "P2",
    description: "21 pages either have no H1 or repeat the same H1 across multiple templates.",
    why: "The H1 is the strongest on-page topical signal and helps assistive technology users orient themselves within the document.",
    fix: "Ensure every page renders exactly one H1 that describes the unique intent of that page.",
    evidence: "0 H1 elements on 9 URLs, 2+ H1 elements on 12 URLs.",
    urls: ["https://acme-store.com/pages/about", "https://acme-store.com/pages/shipping"],
  },
  {
    id: "images-missing-alt",
    title: "Images missing alt text",
    severity: "warning",
    category: "Accessibility",
    affected: 148,
    status: "open",
    priority: "P2",
    description: "148 content images ship without an alt attribute.",
    why: "Screen reader users lose the meaning of the image, and image search cannot associate the asset with any query.",
    fix: "Add descriptive alt text for informative images and alt=\"\" for decorative ones.",
    evidence: "148 <img> elements without an alt attribute across 63 URLs.",
    urls: ["https://acme-store.com/blog/summer-gear-guide"],
  },
  {
    id: "thin-content",
    title: "Thin content pages",
    severity: "warning",
    category: "Content",
    affected: 17,
    status: "open",
    priority: "P2",
    description: "17 indexable pages contain fewer than 150 words of unique body copy.",
    why: "Thin pages rarely satisfy search intent and can dilute crawl budget across a large catalogue.",
    fix: "Expand with genuinely useful detail, consolidate near-duplicates, or noindex the pages that exist only for navigation.",
    evidence: "Average word count 84 across the flagged set.",
    urls: ["https://acme-store.com/collections/sale"],
  },
  {
    id: "no-schema",
    title: "Product schema not detected",
    severity: "warning",
    category: "Technical SEO",
    affected: 96,
    status: "open",
    priority: "P2",
    description: "96 product pages have no Product structured data.",
    why: "Without Product schema you forfeit price, rating and availability rich results in the SERP.",
    fix: "Emit valid JSON-LD Product markup including name, image, offers and aggregateRating.",
    evidence: "No application/ld+json block of @type Product found.",
    urls: ["https://acme-store.com/products/alpine-jacket"],
  },
  {
    id: "long-titles",
    title: "Title tags longer than 60 characters",
    severity: "info",
    category: "Content",
    affected: 42,
    status: "open",
    priority: "P3",
    description: "42 titles are truncated in the desktop results page.",
    why: "Truncated titles hide the differentiating part of the message and reduce click-through.",
    fix: "Trim to 55–60 characters, front-loading the primary keyword.",
    evidence: "Longest title 94 characters.",
    urls: ["https://acme-store.com/blog/summer-gear-guide"],
  },
  {
    id: "orphan-pages",
    title: "Orphan pages with no internal links",
    severity: "info",
    category: "Indexability",
    affected: 8,
    status: "resolved",
    priority: "P3",
    description: "8 URLs appear in the sitemap but receive no internal links.",
    why: "Orphan pages are crawled rarely and accumulate almost no internal PageRank.",
    fix: "Link them from a relevant hub page or remove them from the sitemap.",
    evidence: "0 inbound internal links detected for 8 sitemap URLs.",
    urls: ["https://acme-store.com/pages/legacy-lookbook"],
  },
  {
    id: "mixed-content",
    title: "Mixed content requests",
    severity: "info",
    category: "Technical SEO",
    affected: 5,
    status: "open",
    priority: "P3",
    description: "5 pages request assets over plain HTTP.",
    why: "Browsers block or downgrade insecure subresources, which can break layout and erode trust signals.",
    fix: "Update the asset URLs to HTTPS and add an upgrade-insecure-requests directive.",
    evidence: "5 http:// asset requests observed during render.",
    urls: ["https://acme-store.com/pages/press"],
  },
];

export type PageRow = {
  url: string;
  status: number;
  indexable: boolean;
  title: string;
  meta: boolean;
  h1: boolean;
  images: number;
  links: number;
  performance: number;
  score: number;
  issues: number;
};

export const pageInventory: PageRow[] = [
  {
    url: "/",
    status: 200,
    indexable: true,
    title: "Acme Store — Outdoor gear built to last",
    meta: true,
    h1: true,
    images: 24,
    links: 68,
    performance: 71,
    score: 88,
    issues: 2,
  },
  {
    url: "/collections/outdoor",
    status: 200,
    indexable: true,
    title: "Outdoor Collection",
    meta: false,
    h1: true,
    images: 42,
    links: 94,
    performance: 64,
    score: 72,
    issues: 5,
  },
  {
    url: "/products/alpine-jacket",
    status: 200,
    indexable: true,
    title: "Alpine Jacket — 3-layer shell",
    meta: true,
    h1: true,
    images: 12,
    links: 41,
    performance: 58,
    score: 66,
    issues: 7,
  },
  {
    url: "/products/summit-pack",
    status: 200,
    indexable: true,
    title: "Summit Pack 45L",
    meta: true,
    h1: false,
    images: 9,
    links: 38,
    performance: 77,
    score: 74,
    issues: 4,
  },
  {
    url: "/blog/summer-gear-guide",
    status: 200,
    indexable: true,
    title: "The complete summer gear guide for long-distance hikers in 2026",
    meta: false,
    h1: true,
    images: 31,
    links: 57,
    performance: 69,
    score: 70,
    issues: 6,
  },
  {
    url: "/pages/legacy-lookbook",
    status: 200,
    indexable: false,
    title: "Legacy Lookbook",
    meta: true,
    h1: true,
    images: 18,
    links: 3,
    performance: 82,
    score: 61,
    issues: 3,
  },
  {
    url: "/collections/sale",
    status: 200,
    indexable: true,
    title: "Sale",
    meta: false,
    h1: true,
    images: 55,
    links: 112,
    performance: 52,
    score: 58,
    issues: 9,
  },
  {
    url: "/pages/old-contact",
    status: 404,
    indexable: false,
    title: "Not found",
    meta: false,
    h1: false,
    images: 0,
    links: 4,
    performance: 96,
    score: 12,
    issues: 1,
  },
  {
    url: "/pages/shipping",
    status: 301,
    indexable: false,
    title: "Shipping & returns",
    meta: true,
    h1: false,
    images: 1,
    links: 22,
    performance: 91,
    score: 64,
    issues: 2,
  },
  {
    url: "/pages/about",
    status: 200,
    indexable: true,
    title: "About Acme",
    meta: true,
    h1: false,
    images: 6,
    links: 27,
    performance: 85,
    score: 79,
    issues: 2,
  },
];

export const activityLog = [
  { time: "00:04", text: "Robots.txt parsed — 3 disallow rules applied" },
  { time: "00:09", text: "Sitemap discovered: /sitemap_index.xml (4 child maps)" },
  { time: "00:21", text: "Crawled /collections/outdoor — 200 OK" },
  { time: "00:26", text: "Warning: missing meta description on /collections/sale" },
  { time: "00:34", text: "Crawled /products/alpine-jacket — 200 OK" },
  { time: "00:41", text: "Critical: canonical target returned 404" },
  { time: "00:52", text: "Performance sample captured — LCP 4.6s" },
  { time: "01:03", text: "Crawled /blog/summer-gear-guide — 200 OK" },
  { time: "01:10", text: "Image audit: 148 images without alt text" },
];

export const plans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    blurb: "Audit a single site and see what is broken.",
    features: ["1 project", "250 pages per scan", "Weekly scheduled scan", "Core issue detection"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$79",
    cadence: "per month",
    blurb: "For in-house teams running continuous SEO work.",
    features: [
      "10 projects",
      "25,000 pages per scan",
      "Daily scans + change alerts",
      "AI fix recommendations",
      "PDF & CSV reporting",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Agency",
    price: "$249",
    cadence: "per month",
    blurb: "White-label reporting across an entire client roster.",
    features: [
      "Unlimited projects",
      "250,000 pages per scan",
      "White-label PDF reports",
      "Team roles & permissions",
      "API access & webhooks",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

export const faqs = [
  {
    q: "How long does an audit take?",
    a: "A 1,000-page site typically finishes in under four minutes. Larger crawls run in the background and notify you the moment results are ready.",
  },
  {
    q: "Does the crawler respect robots.txt?",
    a: "Yes. Robots directives are honoured by default, and you can optionally ignore them for staging environments you own.",
  },
  {
    q: "What makes the recommendations 'AI-powered'?",
    a: "Every detected issue is passed through a model that explains the impact in plain language and drafts a concrete fix against your actual markup.",
  },
  {
    q: "Can I export the results?",
    a: "Every audit can be exported as a branded PDF or a raw CSV of pages and issues for your own analysis.",
  },
  {
    q: "Do you support JavaScript-rendered sites?",
    a: "The crawler renders pages in a headless browser, so client-side routed applications are audited exactly as a search engine would see them.",
  },
];

export const notifications = [
  { title: "Scan completed", body: "acme-store.com scored 82 (+4)", time: "2h ago", unread: true },
  { title: "New critical issue", body: "Broken canonical tags on 38 pages", time: "2h ago", unread: true },
  { title: "Weekly digest ready", body: "4 projects improved this week", time: "1d ago", unread: false },
];
