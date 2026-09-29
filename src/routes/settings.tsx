import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useUserProfile, useUpdateProfile, useSubscriptionStatus, useUpgradeSubscription } from "@/hooks/use-api";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <AppShell
      title="Settings"
      description="Manage your account, billing, and workspace preferences."
    >
      <SettingsContent />
    </AppShell>
  );
}

function SettingsContent() {
  const { data: profile, isLoading } = useUserProfile();
  const { data: subscription } = useSubscriptionStatus();
  const updateProfile = useUpdateProfile();
  const upgradeSubscription = useUpgradeSubscription();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.fullName || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const handleUpdateProfile = () => {
    updateProfile.mutate({ fullName: name, email }, {
      onSuccess: () => toast.success("Profile updated successfully")
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 bg-muted/50 border border-border flex-wrap h-auto p-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  This is how others will see you on the site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="max-w-md" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="max-w-md" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-[80px] w-full max-w-md rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us a little bit about yourself"
                  ></textarea>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border px-6 py-4">
                <Button 
                  className="shadow-sm" 
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Updating..." : "Update profile"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Manage your team and billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace Name</Label>
                  <Input id="workspace" defaultValue="Acme Corp" className="max-w-md" />
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-4">Subscription Plan</h4>
                  <div className="rounded-lg border border-border p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {subscription?.tier === 'PRO' ? 'Pro Plan (High Prediction Engine Enabled)' : 'Free Plan (Basic Engine)'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subscription?.tier === 'PRO' 
                            ? 'You have unlimited access to deep crawling and advanced AI.' 
                            : 'Standard performance. Upgrade to unlock deeper crawling and more favorable SEO scoring.'}
                        </p>
                      </div>
                      {subscription?.tier !== 'PRO' && (
                        <Button 
                          onClick={() => upgradeSubscription.mutate()}
                          disabled={upgradeSubscription.isPending}
                        >
                          {upgradeSubscription.isPending ? "Upgrading..." : "Upgrade to Pro ($49/mo)"}
                        </Button>
                      )}
                      {subscription?.tier === 'PRO' && (
                        <Button variant="outline" disabled>
                          Active
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how SEO Intelligence looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
                    </div>
                    {/* The ThemeToggle component handles this globally, but we'll show a mockup switch here */}
                    <Switch 
                      defaultChecked 
                      onCheckedChange={(checked) => toast(`Dark mode ${checked ? 'enabled' : 'disabled'}`)}
                    />
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure when you receive alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your projects' health.</p>
                  </div>
                  <Switch 
                    defaultChecked 
                    onCheckedChange={(c) => toast(`Weekly digest ${c ? 'enabled' : 'disabled'}`)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Critical Issue Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified immediately when a new critical issue is found.</p>
                  </div>
                  <Switch 
                    defaultChecked 
                    onCheckedChange={(c) => toast(`Critical alerts ${c ? 'enabled' : 'disabled'}`)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about new features and SEO tips.</p>
                  </div>
                  <Switch 
                    onCheckedChange={(c) => toast(`Marketing emails ${c ? 'enabled' : 'disabled'}`)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage organization members and their roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sameena (You)</Label>
                    <p className="text-sm text-muted-foreground">sameena@example.com</p>
                  </div>
                  <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                    OWNER
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Invite Member
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your plan, invoices, and payment methods.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">Pro Plan</h4>
                      <p className="text-sm text-muted-foreground">$49/month • Renews Oct 29, 2026</p>
                    </div>
                    <div className="text-sm font-medium px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                      ACTIVE
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Manage Subscription</Button>
                    <Button variant="ghost" size="sm">View Invoices</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>
                  Track your organization's resource consumption against plan limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Projects</Label>
                    <span className="text-muted-foreground">3 / 10</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[30%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Scans per month</Label>
                    <span className="text-muted-foreground">21 / 100</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[21%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Pages crawled</Label>
                    <span className="text-muted-foreground">14,520 / 50,000</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[29%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>AI Requests</Label>
                    <span className="text-muted-foreground">87 / 500</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[17%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
