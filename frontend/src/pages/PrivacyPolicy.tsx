import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  UserCheck,
  FileText,
  Database,
  Brain,
  Share2,
  Settings2,
  Clock,
  Cookie,
  RefreshCw,
  Mail,
  ArrowUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const sections = [
  { id: "introduction", label: "Introduction", icon: FileText },
  {
    id: "information-we-collect",
    label: "Information We Collect",
    icon: Database,
  },
  { id: "how-we-use", label: "How We Use Your Information", icon: Settings2 },
  { id: "ai-explainability", label: "AI & Explainability", icon: Brain },
  { id: "security", label: "Data Security", icon: Lock },
  { id: "sharing", label: "Data Sharing", icon: Share2 },
  { id: "user-rights", label: "Your Rights & Controls", icon: UserCheck },
  { id: "retention", label: "Data Retention", icon: Clock },
  { id: "cookies", label: "Cookies & Tracking", icon: Cookie },
  { id: "changes", label: "Changes to Policy", icon: RefreshCw },
  { id: "contact", label: "Contact", icon: Mail },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function PrivacyPolicy() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const lastUpdated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground scroll-pt-32">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-hero" />
        <div className="container mx-auto max-w-4xl px-4 py-20 md:py-28">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="glass inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              FynXai · Privacy Policy
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl mb-6 gradient-text">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Your data, your control — built with transparency and security in
              mind.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {["Secure", "Encrypted", "Explainable", "User-first"].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted shadow-soft px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-primary/20"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {b}
                </span>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Last Updated:{" "}
              <span className="font-semibold text-foreground">
                {lastUpdated}
              </span>
            </p>
          </motion.div>
        </div>
      </header>

      {/* Body */}
      <div className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block pt-2">
            <nav className="sticky top-24 rounded-md border border-border/60 bg-card p-5 text-sm shadow-soft">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-1.5 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      <s.icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Sections */}
          <main className="space-y-8 max-w-3xl">
            <Section id="introduction" icon={FileText} title="1. Introduction">
              <p>
                FynXai is an AI-powered loan evaluation platform that helps
                lenders make fairer, faster, and more transparent credit
                decisions. We combine document OCR, machine-learning credit
                scoring, and explainability tools (SHAP / LIME) with human
                review by trained loan officers.
              </p>
              <Highlight>
                We are committed to <strong>fair lending</strong>,{" "}
                <strong>transparent AI decisions</strong>, and{" "}
                <strong>
                  responsible use of your personal and financial data
                </strong>
                .
              </Highlight>
              <p>
                This policy follows the principles of India's{" "}
                <strong>Digital Personal Data Protection Act (DPDP)</strong> and{" "}
                <strong>GDPR-style transparency</strong> standards.
              </p>
            </Section>

            <Section
              id="information-we-collect"
              icon={Database}
              title="2. Information We Collect"
            >
              <p>
                To evaluate a loan application, we collect the following
                categories of data:
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoCard title="Personal Information">
                  Name, email address, phone number.
                </InfoCard>
                <InfoCard title="Identity Documents">
                  Aadhaar, PAN, salary slips, Form 16, and bank statements
                  (uploaded as PDFs / images).
                </InfoCard>
                <InfoCard title="Financial & OCR Data">
                  Income, transactions, employer details, and account activity
                  extracted from your documents.
                </InfoCard>
                <InfoCard title="Application Data">
                  Loan amount, tenure, and purpose of the loan.
                </InfoCard>
                <InfoCard title="Technical Data" className="sm:col-span-2">
                  Device information, browser, IP address, and usage logs — used
                  for security and service quality.
                </InfoCard>
              </div>
            </Section>

            <Section
              id="how-we-use"
              icon={Settings2}
              title="3. How We Use Your Information"
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  "Processing your loan application end-to-end",
                  "Verifying documents through OCR",
                  "Generating AI-based credit scores",
                  "Producing SHAP / LIME explanations for every decision",
                  "Detecting fraud and assessing risk",
                  "Sending status updates, approvals, and rejections",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded-lg border border-border/60 glass p-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Highlight>
                We improve our models using{" "}
                <strong>only anonymized and aggregated data</strong>. Your
                personally identifiable information is never used to train AI
                models in a way that exposes your identity.
              </Highlight>
            </Section>

            {/* Highlighted AI section */}
            <motion.section
              id="ai-explainability"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card p-7 shadow-soft hover-lift md:p-10"
            >
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
                style={{ background: "hsl(var(--primary))" }}
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Brain className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  4. AI &amp; Explainability Transparency
                </h2>
              </div>
              <p className="mt-4 text-base leading-relaxed text-foreground/90">
                FynXai's lending decisions are{" "}
                <strong>AI-assisted, not black-box</strong>. Every applicant has
                the right to understand <em>why</em> a decision was made.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <FeatureTile
                  icon={Sparkles}
                  title="Feature Contributions (SHAP)"
                  body="See exactly which factors pushed your score up or down."
                />
                <FeatureTile
                  icon={Brain}
                  title="Local Explanations (LIME)"
                  body="Understand the reasoning behind your specific application."
                />
                <FeatureTile
                  icon={UserCheck}
                  title="Human-in-the-Loop"
                  body="Loan officers review borderline and flagged cases — and you can request human review."
                />
              </div>
              <Highlight tone="strong">
                <strong>
                  No opaque automated rejection without explanation.
                </strong>{" "}
                Every decision comes with a human-readable reason, and you can
                always escalate to a human reviewer.
              </Highlight>
            </motion.section>

            <Section id="security" icon={Lock} title="5. Data Security">
              <ul className="space-y-2">
                <Bullet>
                  End-to-end encryption — both in transit (TLS) and at rest
                  (AES-256).
                </Bullet>
                <Bullet>
                  Secure document storage with restricted, access-controlled
                  buckets.
                </Bullet>
                <Bullet>
                  Role-based access — Applicant, Loan Officer, and Admin roles
                  are strictly separated.
                </Bullet>
                <Bullet>
                  Internal audit logging of every data access and decision
                  event.
                </Bullet>
              </ul>
            </Section>

            <Section id="sharing" icon={Share2} title="6. Data Sharing Policy">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-destructive">
                    <XCircle className="h-4 w-4" /> What we never do
                  </div>
                  <p className="text-sm text-foreground/80">
                    We do <strong>not sell</strong> your personal data. Ever.
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-muted/40 p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> When we may share
                  </div>
                  <ul className="space-y-1 text-sm text-foreground/80">
                    <li>• When required by law or regulators</li>
                    <li>
                      • With lending partners involved in your loan (where
                      applicable)
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Any third party we work with must follow strict{" "}
                <strong>confidentiality</strong> and{" "}
                <strong>security compliance</strong> obligations.
              </p>
            </Section>

            <Section
              id="user-rights"
              icon={UserCheck}
              title="7. Your Rights & Controls"
            >
              <p>You stay in control of your data. At any time, you can:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                <Bullet>Access the personal data we hold about you</Bullet>
                <Bullet>Edit or correct your information</Bullet>
                <Bullet>Download a copy of your data</Bullet>
                <Bullet>Request deletion of your account and data</Bullet>
              </ul>
              <Highlight>
                These controls are available in{" "}
                <strong>Profile → Data &amp; Privacy</strong>.
              </Highlight>
            </Section>

            <Section id="retention" icon={Clock} title="8. Data Retention">
              <ul className="space-y-2">
                <Bullet>
                  We retain your data only as long as necessary to provide our
                  service.
                </Bullet>
                <Bullet>
                  Data is deleted upon your request or after extended account
                  inactivity.
                </Bullet>
                <Bullet>
                  Some logs are retained for compliance and audit-trail
                  requirements.
                </Bullet>
              </ul>
            </Section>

            <Section id="cookies" icon={Cookie} title="9. Cookies & Tracking">
              <p>
                We use a minimal set of cookies, only for{" "}
                <strong>authentication</strong> and{" "}
                <strong>basic, privacy-respecting analytics</strong>. We do not
                use invasive tracking or sell behavioral data to advertisers.
              </p>
            </Section>

            <Section
              id="changes"
              icon={RefreshCw}
              title="10. Changes to This Policy"
            >
              <p>
                We will notify you about any major updates to this policy.
                Continued use of FynXai after such updates implies acceptance of
                the revised terms.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="11. Contact Information">
              <p>For privacy questions or data requests, reach out to us at:</p>
              <a
                href="mailto:support@fynxai.com"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:shadow-glow/30 hover:brightness-110"
              >
                <Mail className="h-4 w-4" />
                support@fynxai.com
              </a>
            </Section>
          </main>
        </div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:brightness-110 hover:shadow-glow/40 ${
          showTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      className="scroll-mt-24 rounded-2xl bg-card border border-border p-6 shadow-soft hover-lift md:p-8"
    >
      <h2 className="group flex items-center gap-3 text-xl font-bold tracking-tight md:text-2xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="transition-colors group-hover:text-primary">
          {title}
        </span>
      </h2>
      <div className="mt-4 space-y-3 leading-relaxed text-foreground/85">
        {children}
      </div>
    </motion.section>
  );
}

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-4 shadow-soft hover-lift transition-all ${className}`}
    >
      <p className="text-sm font-bold text-primary">{title}</p>
      <p className="mt-1.5 text-sm text-foreground/80">{children}</p>
    </div>
  );
}

function Highlight({
  children,
  tone = "soft",
}: {
  children: React.ReactNode;
  tone?: "soft" | "strong";
}) {
  return (
    <div
      className={
        tone === "strong"
          ? "mt-5 rounded-xl border border-primary bg-primary/10 p-4"
          : "mt-3 rounded-xl border border-border bg-muted p-4"
      }
    >
      {children}
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-soft p-4 backdrop-blur transition-transform hover-lift">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-foreground/75">{body}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
      <span>{children}</span>
    </li>
  );
}
