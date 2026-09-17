import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<{ scanId?: string, issueId?: string, pageId?: string }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      setContext(customEvent.detail);
      setIsOpen(true);
      
      if (customEvent.detail.initialMessage) {
        handleSendMessage(customEvent.detail.initialMessage, customEvent.detail);
      }
    };

    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, overrideContext?: any) => {
    if (!text.trim()) return;
    
    const activeContext = overrideContext || context;

    const newMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        scanId: activeContext.scanId,
        issueId: activeContext.issueId,
        pageId: activeContext.pageId,
        message: text,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      setMessages([...newMessages, { role: 'assistant', content: response.data.answer }]);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get a response';
      toast.error(errorMessage);
      setMessages([...newMessages, { role: 'assistant', content: `[Error] ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => setMessages([]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] shadow-2xl rounded-xl border border-border bg-background overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
      <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="size-5" />
          <h3 className="font-semibold">AI SEO Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 hover:bg-primary-foreground/20 text-primary-foreground" onClick={handleClear} title="Clear Chat">
            <Trash2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 hover:bg-primary-foreground/20 text-primary-foreground" onClick={() => setIsOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-muted/30 p-2 text-xs flex items-center gap-2 border-b border-border text-muted-foreground">
        <AlertCircle className="size-3 shrink-0" />
        AI Assistant provides recommendations only. It does not modify your website.
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
            <Sparkles className="size-12 text-primary/20" />
            <p>Ask me anything about your SEO audit.</p>
            <div className="flex flex-col gap-2 w-full mt-4">
              {['Why is my score low?', 'What should I fix first?', 'Explain my critical issues.', 'How can I improve my SEO?'].map((q) => (
                <Button key={q} variant="outline" size="sm" className="text-xs justify-start" onClick={() => handleSendMessage(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground whitespace-pre-wrap'}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 text-sm bg-muted text-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
