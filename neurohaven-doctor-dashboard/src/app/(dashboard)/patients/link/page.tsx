"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Link2,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// Schema for linking patients
const linkPatientSchema = z.object({
  patientEmail: z
    .string()
    .min(1, { message: "Email address is required." })
    .email({ message: "Please input a valid email address." }),
  priority: z.enum(["mild", "moderate", "severe"]),
  sendEmailNotification: z.boolean(),
});

type LinkPatientFormValues = z.infer<typeof linkPatientSchema>;

export default function LinkPatientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [linkedPatient, setLinkedPatient] = useState<{
    id: string;
    patientId: string;
    linkedAt: string;
  } | null>(null);

  const form = useForm<LinkPatientFormValues>({
    resolver: zodResolver(linkPatientSchema),
    defaultValues: {
      patientEmail: "",
      priority: "moderate",
      sendEmailNotification: true,
    },
  });

  const onSubmit = async (values: LinkPatientFormValues) => {
    setSubmitting(true);
    setLinkedPatient(null);

    try {
      // In local environment, check if a token exists or use authorization bypass
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      
      const response = await axios.post(
        `${apiBaseUrl}/api/patients/link`,
        {
          patientEmail: values.patientEmail,
          priority: values.priority,
          sendEmailNotification: values.sendEmailNotification,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
          },
        }
      );

      if (response.data?.success) {
        setLinkedPatient(response.data.data);
        toast.success("Patient link successfully established!");
        form.reset();
        
        // Timeout redirect back to directory
        setTimeout(() => {
          router.push("/patients");
        }, 2500);
      } else {
        toast.error(response.data?.message || "Failed to establish patient connection link.");
      }
    } catch (error: unknown) {
      console.error("Linking error:", error);
      const err = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || "Error connecting to the backend API services.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Top Navigation */}
      <div className="select-none">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-jade-teal hover:text-jade-primary hover:underline transition-all"
        >
          ← Back to Patient Directory
        </Link>
      </div>

      {/* Header Info */}
      <div className="space-y-2 select-none">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-jade-dark">
          Link New Patient
        </h2>
        <p className="text-[13px] text-jade-teal font-medium leading-relaxed">
          Connect a patient or primary caregiver telemetry feed to your clinician workstation using their registered email address.
        </p>
      </div>

      {linkedPatient ? (
        <Card className="border border-status-normal/30 bg-[#1B8A5A]/5 shadow-md p-6 rounded-[14px] animate-fadeIn select-none">
          <CardContent className="p-0 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-status-normal animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-jade-dark">
                Connection Link Established
              </h3>
              <p className="text-xs text-jade-teal leading-relaxed font-body">
                The connection has been authorized. Telemetry feeds for this patient are now synced to your care workstation. Redirecting back to the directory...
              </p>
            </div>
            <div className="border border-border/40 p-3 bg-white rounded-lg text-[11px] text-jade-dark font-mono w-full max-w-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-jade-teal font-sans">Link ID:</span>
                <span>{linkedPatient.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jade-teal font-sans">Patient ID:</span>
                <span>{linkedPatient.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jade-teal font-sans">Linked Date:</span>
                <span>{format(new Date(linkedPatient.linkedAt), "yyyy-MM-dd HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/60 bg-white shadow-md rounded-[14px] overflow-hidden">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="patientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-jade-dark">
                        Patient or Caregiver Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                          <Input
                            placeholder="patient@email.com"
                            className="pl-9 h-9 text-xs border-border bg-white text-jade-dark focus-visible:ring-jade-primary/50"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-jade-teal">
                        Enter the exact email used by the patient or caregiver during signup on the NeuroHaven app.
                      </FormDescription>
                      <FormMessage className="text-[10px] font-bold text-status-critical" />
                    </FormItem>
                  )}
                />

                {/* Priority Selector */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-jade-dark">
                        Initial Care Pathway Priority
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-9 border border-border bg-white text-xs font-semibold text-jade-dark focus:ring-jade-primary/50">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-border">
                          <SelectItem
                            value="mild"
                            className="text-xs text-jade-dark font-medium focus:bg-jade-light/30"
                          >
                            Mild Risk (Standard monitoring)
                          </SelectItem>
                          <SelectItem
                            value="moderate"
                            className="text-xs text-jade-dark font-medium focus:bg-jade-light/30"
                          >
                            Moderate Risk (Enhanced telemetry checks)
                          </SelectItem>
                          <SelectItem
                            value="severe"
                            className="text-xs text-jade-dark font-medium focus:bg-jade-light/30"
                          >
                            Severe Risk (Critical warning alarms active)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px] text-jade-teal">
                        Configures default telemetry warnings and notification frequencies.
                      </FormDescription>
                      <FormMessage className="text-[10px] font-bold text-status-critical" />
                    </FormItem>
                  )}
                />

                {/* Send Notification Checkbox */}
                <FormField
                  control={form.control}
                  name="sendEmailNotification"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 bg-[#F4F7F2]/40 p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-jade-teal text-jade-primary focus:ring-jade-primary/50 cursor-pointer accent-[#7B9669]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none select-none">
                        <FormLabel className="text-xs font-bold text-jade-dark block">
                          Send Connection Notification
                        </FormLabel>
                        <FormDescription className="text-[10px] text-jade-teal font-medium">
                          Sends an email confirmation to the patient/caregiver notifying them that their profile is now linked to your clinical dashboard.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Informational Alert Box */}
                <div className="flex gap-3 bg-amber-500/5 border border-status-warning/20 p-4 rounded-lg select-none">
                  <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
                  <div className="text-[11px] text-jade-dark leading-relaxed font-body">
                    <strong className="font-heading font-bold text-status-warning block mb-0.5">Clinical Authorization Notice</strong>
                    Linking a patient profile grants authorization to inspect private daily cognitive scores, lexical sentiment telemetries, and caregiver logs. Ensure that verbal or institutional caregiver consent has been verified before completing.
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 select-none">
                  <Link href="/patients" passHref>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border text-jade-teal hover:bg-jade-light/40 font-bold text-xs h-9 rounded-btn"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 font-bold text-xs px-4"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Establishing Link...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Establish Connection Link
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
