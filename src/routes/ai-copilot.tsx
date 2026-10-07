import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, User, Sparkles, AlertCircle, RefreshCw, Copy, Check, Pencil, ImageIcon, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ReactMarkdown from 'react-markdown';

import { useActiveProject } from "@/hooks/use-active-project";

export const Route = createFileRoute("/ai-copilot")({
  component: AICopilotRoute,
});

function AICopilotRoute() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, image?: string }[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("Image must be smaller than 15MB");
        return;
      }
      const compressed = await compressImage(file);
      setSelectedImage(compressed);
    }
  };

  const { activeProject } = useActiveProject();
  const latestProjectId = activeProject?.id;

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            alert("Image must be smaller than 15MB");
            return;
          }
          const compressed = await compressImage(file);
          setSelectedImage(compressed);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const text = typeof e === 'string' ? e : input;
    if (!text.trim() && !selectedImage) return;

    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', content: text, image: imageToSend || undefined }]);
    setIsLoading(true);

    try {
      const baseURL = api.defaults.baseURL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectId: latestProjectId,
          message: text,
          image: imageToSend,
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
                  newMsgs[newMsgs.length - 1]!.content = aiResponse;
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
                  <div className={`group relative rounded-2xl px-4 py-3 max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                    {m.role === 'user' ? (
                      <div className="flex flex-col items-end gap-2">
                        {m.image && (
                          <img src={m.image} alt="User uploaded" className="max-w-full max-h-60 rounded-lg object-contain bg-white/10" />
                        )}
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-1 whitespace-pre-wrap">{m.content}</div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20 shrink-0 -mr-2" 
                            onClick={() => setInput(m.content)}
                            title="Edit Question"
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground pb-6">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -bottom-1 -right-2 h-6 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(m.content, i)}
                        >
                          {copiedIndex === i ? <Check className="size-3 mr-1 text-success" /> : <Copy className="size-3 mr-1" />}
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </Button>
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
          <div className="p-4 bg-background border-t flex flex-col gap-2">
            {selectedImage && (
              <div className="relative inline-block w-fit">
                <img src={selectedImage} alt="Preview" className="h-20 rounded-md border shadow-sm object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute -top-2 -right-2 size-5 rounded-full"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <label className="shrink-0">
                <Input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <div className="h-10 px-3 py-2 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground transition-colors" title="Upload Image">
                  <ImageIcon className="size-4" />
                </div>
              </label>
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onPaste={handlePaste}
                placeholder="Ask anything about your website... (You can also paste screenshots here)" 
                className="flex-1 h-10"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} className="h-10">
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
                    {activeProject?.domain || 'Website'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    Connected to backend
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-success"></div>
                    Ready to analyze
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
