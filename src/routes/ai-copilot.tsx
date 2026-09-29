import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, User, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ReactMarkdown from 'react-markdown';

export const Route = createFileRoute("/ai-copilot")({
  component: AICopilotRoute,
});

function AICopilotRoute() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Assume user wants the context of the latest project
  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  });

  const latestProject = Array.isArray(projectsRes) ? projectsRes[0] : projectsRes?.data?.[0];
  const latestScanId = latestProject?.scans?.[0]?.id;

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const text = typeof e === 'string' ? e : input;
    if (!text.trim()) return;

    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          scanId: latestScanId,
          message: text,
          history: messages
        })
      });

      if (!response.ok) throw new Error("Failed to connect to AI.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                aiResponse += data.text;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = aiResponse;
                  return newMsgs;
                });
              } else if (data.error) {
                aiResponse += `\n\n**Error**: ${data.error}`;
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "AI analysis is temporarily unavailable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are my biggest SEO problems?",
    "What should I fix first?",
    "Which pages need attention?",
    "Why is my SEO score low?",
    "Explain my technical SEO issues.",
    "Find my biggest SEO opportunities."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bot className="size-8 text-primary" />
          AI SEO Copilot
        </h1>
        <p className="text-muted-foreground mt-2">
          Your professional SEO analyst assistant. Grounded in your actual website data.
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-sm">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">How can I help you improve your SEO?</h3>
                <p className="text-muted-foreground mb-8">
                  I can analyze your latest scan, explain complex issues, and help you prioritize your work.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {suggestedQuestions.map(q => (
                    <Button key={q} variant="outline" className="h-auto py-3 justify-start text-left whitespace-normal" onClick={() => handleSubmit(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'model' && (
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="size-5 text-primary" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-5 text-primary animate-pulse" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-background border shadow-sm flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Analyzing data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 bg-background border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask anything about your website..." 
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="size-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </Card>

        {/* Context Sidebar */}
        <div className="w-80 hidden lg:flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4" />
                AI Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-xs font-medium text-primary mb-1">Analyzing Data:</p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    Latest SEO Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    {latestProject?.scans?.[0]?.issuesFound || 0} issues
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    {latestProject?.scans?.[0]?.pagesCrawled || 0} crawled pages
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    Overall SEO Score: {latestProject?.scans?.[0]?.siteScore?.overallScore || 'N/A'}
                  </li>
                </ul>
              </div>
              <div className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>AI responses are strictly grounded in your actual website data. The AI cannot invent metrics or audit findings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
