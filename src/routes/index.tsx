import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BarChart, Check, FileText, Search, Shield, Zap, AlertTriangle, XCircle, Info } from "lucide-react";
import { usePublicAnalyze } from "@/hooks/use-api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("");
  const analyzeMutation = usePublicAnalyze();
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a URL to analyze");
      return;
    }
    
    // Ensure protocol
    let target = url;
    if (!target.startsWith('http')) target = 'https://' + target;
    
    try {
      const res = await analyzeMutation.mutateAsync(target);
      if (res && res.success) {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-display">
                AI-Powered SEO Audits That Tell You What to Fix
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Stop guessing what's holding back your rankings. Our AI analyzes your entire website and provides prioritized, actionable recommendations to improve your SEO performance instantly.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <form onSubmit={handleAnalyze} className="flex w-full max-w-md items-center space-x-2">
                  <Input 
                    type="url" 
                    placeholder="https://yourwebsite.com" 
                    className="h-12 bg-background/50" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={analyzeMutation.isPending}
                  />
                  <Button type="submit" size="lg" className="h-12 px-8 shadow-lg shadow-primary/25" disabled={analyzeMutation.isPending}>
                    {analyzeMutation.isPending ? "Analyzing..." : "Analyze Website"}
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Conditional Result or Dashboard Preview */}
            {result ? (
              <div className="mt-16 flow-root sm:mt-24 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                <Card className="border-border shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-shrink-0 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 ring-8 ring-primary/5">
                          <BarChart className="size-10 text-primary" />
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight">{result.score}<span className="text-2xl text-muted-foreground">/100</span></h3>
                        <p className="text-sm font-medium text-muted-foreground mt-1">Basic Prediction</p>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <h4 className="text-xl font-semibold">We found {result.totalIssuesDetected} potential issues on {result.url.replace(/^https?:\/\//, '')}</h4>
                        <div className="space-y-2">
                          {result.issues.map((issue: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                              {issue.severity === 'CRITICAL' ? <XCircle className="size-5 text-destructive" /> : 
                               issue.severity === 'HIGH' ? <AlertTriangle className="size-5 text-orange-500" /> : 
                               <Info className="size-5 text-blue-500" />}
                              <span className="font-medium text-sm">{issue.title}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            This is just a quick check of your homepage. To find all technical issues, broken links, and get AI-powered step-by-step fix methods, you need a full deep-crawl audit.
                          </p>
                          <Button size="lg" className="w-full sm:w-auto font-semibold shadow-md" asChild>
                            <Link to="/register">Unlock Full Audit & AI Fixes <ArrowRight className="ml-2 size-4" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mt-16 flow-root sm:mt-24">
                <div className="-m-2 rounded-xl bg-muted/50 p-2 ring-1 ring-inset ring-foreground/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <div className="rounded-md bg-background shadow-2xl ring-1 ring-foreground/10 flex items-center justify-center aspect-[16/9] overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5"></div>
                     <div className="text-center space-y-4 relative z-10">
                        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                          <BarChart className="size-12 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold">SEO Score: 92/100</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">Your website is performing well, but there are 3 critical issues affecting your mobile rankings.</p>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">Actionable Insights, Not Just Data</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                We go beyond standard audits by telling you exactly how to fix the issues we find.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col bg-card p-8 rounded-2xl border border-border shadow-sm">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-foreground">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Search className="size-5 text-primary" />
                    </div>
                    Deep Crawling
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">Our crawler goes through every page of your site, checking for over 100+ technical SEO factors that affect rankings.</p>
                  </dd>
                </div>
                <div className="flex flex-col bg-card p-8 rounded-2xl border border-border shadow-sm">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-foreground">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="size-5 text-primary" />
                    </div>
                    AI Recommendations
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">Don't just get an error code. Get a step-by-step AI-generated guide on how to fix each issue for your specific CMS.</p>
                  </dd>
                </div>
                <div className="flex flex-col bg-card p-8 rounded-2xl border border-border shadow-sm">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-foreground">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="size-5 text-primary" />
                    </div>
                    Continuous Monitoring
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">Schedule weekly audits and get alerted immediately if your SEO health drops or new critical issues appear.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">Simple, Transparent Pricing</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Choose the plan that fits your needs. No hidden fees.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8 lg:gap-y-0">
              {/* Pro Plan */}
              <div className="rounded-3xl p-8 ring-1 ring-border xl:p-10 bg-card">
                <h3 className="text-lg font-semibold leading-8 text-foreground">Pro</h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">For solo founders and small teams.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">$49</span>
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">/month</span>
                </p>
                <Button className="mt-6 w-full" variant="outline">Get started today</Button>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                  {['Up to 5 projects', '10,000 pages crawled per month', 'Weekly automated audits', 'Basic AI recommendations'].map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Agency Plan */}
              <div className="rounded-3xl p-8 ring-2 ring-primary xl:p-10 bg-card relative shadow-xl">
                <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</div>
                <h3 className="text-lg font-semibold leading-8 text-foreground">Agency</h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">For growing agencies and larger teams.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">$149</span>
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">/month</span>
                </p>
                <Button className="mt-6 w-full shadow-md shadow-primary/20">Get started today</Button>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                  {['Unlimited projects', '100,000 pages crawled per month', 'Daily automated audits', 'Advanced AI recommendations', 'White-label PDF reports'].map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">About SEO Intelligence</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                We are a team of passionate SEO experts and engineers dedicated to making search engine optimization accessible and actionable for everyone. Our AI-driven platform eliminates the guesswork, helping businesses grow their organic traffic efficiently and effectively.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 py-24 sm:py-32 border-t border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
                Ready to improve your rankings?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Start your 14-day free trial today. No credit card required.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" className="h-12 px-8" asChild>
                   <Link to="/register">Get started for free <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

