"use client";

import { useState, useEffect } from "react";
import {
  User,
  Sliders,
  Bell,
  ShieldAlert,
  Save,
  Lock,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Profile settings state
  const [profileName, setProfileName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [institution, setInstitution] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Thresholds config states
  const [cognitiveDrop, setCognitiveDrop] = useState(15);
  const [missedDays, setMissedDays] = useState(3);
  const [sentimentIndex, setSentimentIndex] = useState(-0.5);
  const [savingThresholds, setSavingThresholds] = useState(false);

  // Notification overrides states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("nh-token") || "mock-dev-token";
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      const res = await axios.get(`${apiBaseUrl}/api/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setProfileName(d.identity?.name || "");
        setSpecialization(d.identity?.specialization || "");
        setInstitution(d.identity?.institution || "");
        setCognitiveDrop(d.alertThresholds?.cognitiveDrop || 15);
        setMissedDays(d.alertThresholds?.missedDays || 3);
        setSentimentIndex(d.alertThresholds?.sentimentLimit || -0.5);
        setEmailAlerts(d.notifications?.emailAlerts !== false);
        setWeeklyReports(d.notifications?.weeklyReports === true);
      }
    } catch (err) {
      console.error("Failed to load workstation settings:", err);
      toast.error("Failed to load settings from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (partialUpdate: any, setLoader: (loading: boolean) => void) => {
    setLoader(true);
    try {
      const token = localStorage.getItem("nh-token") || "mock-dev-token";
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      
      const payload = {
        name: profileName,
        specialization,
        institution,
        alertThresholds: {
          cognitiveDrop,
          missedDays,
          sentimentLimit: sentimentIndex
        },
        notifications: {
          emailAlerts,
          weeklyReports
        },
        ...partialUpdate
      };

      const res = await axios.put(`${apiBaseUrl}/api/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success("Settings updated successfully.");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      toast.error("Failed to save configuration.");
    } finally {
      setLoader(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSettings({ name: profileName, specialization, institution }, setSavingProfile);
  };

  const handleSaveThresholds = () => {
    handleSaveSettings({
      alertThresholds: {
        cognitiveDrop,
        missedDays,
        sentimentLimit: sentimentIndex
      }
    }, setSavingThresholds);
  };

  const handleSaveNotifications = () => {
    handleSaveSettings({
      notifications: {
        emailAlerts,
        weeklyReports
      }
    }, setSavingNotifications);
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem("nh-token") || "mock-dev-token";
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      const res = await axios.put(
        `${apiBaseUrl}/api/settings`,
        {
          password: newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data?.success) {
        toast.success("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Error updating password:", err);
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-jade-primary animate-spin" />
        <span className="text-xs text-jade-teal font-medium">Synchronizing configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header sitting directly on the background */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-border/40 select-none">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-jade-dark">
            Workspace Settings
          </h1>
          <p className="text-[13px] text-jade-teal font-medium leading-relaxed">
            Configure your profile credentials, customize warning triggers, and adjust telemetry notification overrides.
          </p>
        </div>
      </div>

      {/* Settings framework card: A single unified card container */}
      <Card className="border border-border/60 bg-white shadow-sm rounded-[14px] overflow-hidden select-none">
        <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row min-h-[520px]">
          
          {/* Left-side Navigation Panel: A light-tinted (#F4F7F2) vertical strip spanning full height */}
          <TabsList className="bg-[#F4F7F2]/60 border-b md:border-b-0 md:border-r border-border/60 rounded-none flex flex-row md:flex-col justify-start items-stretch h-auto md:h-full w-full md:w-[240px] p-4 gap-1.5 shrink-0 overflow-x-auto md:overflow-x-visible">
            <TabsTrigger
              value="profile"
              className="text-xs font-semibold px-3.5 py-3 rounded-lg flex items-center justify-start gap-2.5 w-auto md:w-full text-left transition-all data-[state=active]:bg-jade-primary data-[state=active]:text-white data-[state=active]:shadow-sm border-l-4 border-l-transparent data-[state=active]:border-l-jade-primary"
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Clinician Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="thresholds"
              className="text-xs font-semibold px-3.5 py-3 rounded-lg flex items-center justify-start gap-2.5 w-auto md:w-full text-left transition-all data-[state=active]:bg-jade-primary data-[state=active]:text-white data-[state=active]:shadow-sm border-l-4 border-l-transparent data-[state=active]:border-l-jade-primary"
            >
              <Sliders className="h-4 w-4 shrink-0" />
              <span>Alert Thresholds</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs font-semibold px-3.5 py-3 rounded-lg flex items-center justify-start gap-2.5 w-auto md:w-full text-left transition-all data-[state=active]:bg-jade-primary data-[state=active]:text-white data-[state=active]:shadow-sm border-l-4 border-l-transparent data-[state=active]:border-l-jade-primary"
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span>Notification Defaults</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="text-xs font-semibold px-3.5 py-3 rounded-lg flex items-center justify-start gap-2.5 w-auto md:w-full text-left transition-all data-[state=active]:bg-jade-primary data-[state=active]:text-white data-[state=active]:shadow-sm border-l-4 border-l-transparent data-[state=active]:border-l-jade-primary"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>System Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Right-side Content Pane: Renders the active tab form */}
          <div className="flex-1 p-6 md:p-8">
            
            {/* Tab 1: Profile */}
            <TabsContent value="profile" className="focus-visible:outline-none mt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-jade-dark">
                  Clinician Identity
                </h3>
                <p className="text-xs font-medium text-jade-teal">
                  Verify and manage your credentials, license records, and practice details
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-jade-teal">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-9 border-border bg-white text-xs font-semibold text-jade-dark placeholder-jade-teal/40 focus-visible:ring-jade-primary/50 rounded-lg"
                      required
                    />
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-xs font-semibold text-jade-teal">Area of Speciality</Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="h-9 border-border bg-white text-xs font-semibold text-jade-dark placeholder-jade-teal/40 focus-visible:ring-jade-primary/50 rounded-lg"
                      required
                    />
                  </div>

                  {/* Institution */}
                  <div className="space-y-1.5">
                    <Label htmlFor="institution" className="text-xs font-semibold text-jade-teal">Affiliated Clinic / Hospital</Label>
                    <Input
                      id="institution"
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="h-9 border-border bg-white text-xs font-semibold text-jade-dark placeholder-jade-teal/40 focus-visible:ring-jade-primary/50 rounded-lg"
                      required
                    />
                  </div>

                  {/* Read-Only License */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-jade-teal">Medical License Number (Verified)</Label>
                    <div className="h-9 border border-border bg-[#F4F7F2]/60 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-jade-dark flex items-center">
                      {user?.licenseNumber || "MD-98210"}
                    </div>
                  </div>

                  {/* Read-Only Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-jade-teal">Verified Work Email</Label>
                    <div className="h-9 border border-border bg-[#F4F7F2]/60 rounded-lg px-3 py-1.5 text-xs font-bold text-jade-teal flex items-center font-mono">
                      {user?.email || "doctor@neurohaven.com"}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 transition-all duration-300 font-bold text-xs px-4"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab 2: Alert Thresholds */}
            <TabsContent value="thresholds" className="focus-visible:outline-none mt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-jade-dark">
                  Cognitive Deviances Warning Triggers
                </h3>
                <p className="text-xs font-medium text-jade-teal">
                  Establish numerical bounds to customize when clinical warnings are pushed to your dashboard
                </p>
              </div>

              <div className="space-y-6">
                {/* Slider 1: Cognitive drop */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-jade-dark font-semibold">Cognitive Decline Warnings</Label>
                    <span className="text-jade-primary font-bold font-mono bg-jade-light/35 px-2.5 py-0.5 rounded-md">
                      {cognitiveDrop}% drop
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={cognitiveDrop}
                    onChange={(e) => setCognitiveDrop(parseInt(e.target.value))}
                    className="w-full accent-jade-primary cursor-pointer h-1.5 bg-[#F4F7F2] rounded-lg appearance-none border border-border/60"
                  />
                  <p className="text-[11px] text-jade-teal leading-relaxed">
                    Triggers warning if a patient&apos;s game scores decline by more than this percentage in 7 days.
                  </p>
                </div>

                {/* Slider 2: Missed games */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-jade-dark font-semibold">Session Inactivity Thresholds</Label>
                    <span className="text-jade-primary font-bold font-mono bg-jade-light/35 px-2.5 py-0.5 rounded-md">
                      {missedDays} consecutive days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={missedDays}
                    onChange={(e) => setMissedDays(parseInt(e.target.value))}
                    className="w-full accent-jade-primary cursor-pointer h-1.5 bg-[#F4F7F2] rounded-lg appearance-none border border-border/60"
                  />
                  <p className="text-[11px] text-jade-teal leading-relaxed">
                    Flags informational logs if a linked patient skips daily memory training sessions.
                  </p>
                </div>

                {/* Slider 3: Sentiment distress */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-jade-dark font-semibold">Sentiment Index Distress Warnings</Label>
                    <span className="text-jade-primary font-bold font-mono bg-jade-light/35 px-2.5 py-0.5 rounded-md">
                      {sentimentIndex.toFixed(1)} index
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.9"
                    max="-0.1"
                    step="0.1"
                    value={sentimentIndex}
                    onChange={(e) => setSentimentIndex(parseFloat(e.target.value))}
                    className="w-full accent-jade-primary cursor-pointer h-1.5 bg-[#F4F7F2] rounded-lg appearance-none border border-border/60"
                  />
                  <p className="text-[11px] text-jade-teal leading-relaxed">
                    Triggers warning if emotional NLP companion index falls below this value.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 flex justify-end">
                  <Button
                    onClick={handleSaveThresholds}
                    disabled={savingThresholds}
                    className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 transition-all duration-300 font-bold text-xs px-4"
                  >
                    {savingThresholds ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Thresholds
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Notifications */}
            <TabsContent value="notifications" className="focus-visible:outline-none mt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-jade-dark">
                  Telemetry Notifications Preferences
                </h3>
                <p className="text-xs font-medium text-jade-teal">
                  Choose your alert delivery parameters and update schedules
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-4">
                  {/* Email Toggle */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/60 bg-[#F4F7F2]/30">
                    <div className="space-y-0.5 text-xs">
                      <Label htmlFor="email-alerts" className="font-bold text-jade-dark cursor-pointer block">
                        Email Overrides on Critical Events
                      </Label>
                      <span className="text-[11px] text-jade-teal leading-relaxed block">
                        Receive immediate secure notification emails when medication omissions or SOS presses occur.
                      </span>
                    </div>
                    
                    {/* Custom Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailAlerts}
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-jade-primary/50 mt-1 select-none",
                        emailAlerts ? "bg-jade-primary" : "bg-jade-teal/20"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                          emailAlerts ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Report compilation Toggle */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/60 bg-[#F4F7F2]/30">
                    <div className="space-y-0.5 text-xs">
                      <Label htmlFor="weekly-reports" className="font-bold text-jade-dark cursor-pointer block">
                        Weekly Aggregated Cognitive Logs Delivery
                      </Label>
                      <span className="text-[11px] text-jade-teal leading-relaxed block">
                        Deliver compiled cohort progress PDFs to my clinic inbox every Monday morning.
                      </span>
                    </div>

                    {/* Custom Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={weeklyReports}
                      onClick={() => setWeeklyReports(!weeklyReports)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-jade-primary/50 mt-1 select-none",
                        weeklyReports ? "bg-jade-primary" : "bg-jade-teal/20"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                          weeklyReports ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications}
                    className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 transition-all duration-300 font-bold text-xs px-4"
                  >
                    {savingNotifications ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Account Safety */}
            <TabsContent value="account" className="focus-visible:outline-none mt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-jade-dark">
                  Clinician Account Control
                </h3>
                <p className="text-xs font-medium text-jade-teal">
                  Export workspace telemetry records or modify security variables
                </p>
              </div>

              <div className="space-y-5">
                {/* Password update */}
                <div className="space-y-4 border border-border/60 p-4 rounded-xl">
                  <h4 className="font-heading text-xs font-bold text-jade-dark flex items-center gap-1.5 uppercase tracking-wider">
                    <Lock className="h-4 w-4 text-jade-primary" /> Update Password
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-jade-teal">Current Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-8 border-border bg-white text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-jade-teal">New Password</Label>
                      <Input
                        type="password"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-8 border-border bg-white text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-jade-teal">Confirm New Password</Label>
                      <Input
                        type="password"
                        placeholder="Confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-8 border-border bg-white text-xs rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePassword}
                      disabled={savingPassword}
                      className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-8 shadow-sm font-bold text-xs px-3"
                    >
                      {savingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </div>

                {/* Delete account risk trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-status-critical/20 rounded-xl bg-status-critical/5 select-none">
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-heading font-bold text-status-critical">Permanently Delete Workspace</h4>
                    <p className="text-[11px] text-jade-teal leading-relaxed">
                      Once deleted, your doctor records, patient links, and assessment logs are permanently erased.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      toast.error("Account deletion requires primary institution administrator approval.")
                    }
                    className="bg-status-critical hover:bg-status-critical/90 text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 font-bold text-xs px-4 select-none shrink-0"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </Card>
    </div>
  );
}
