"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, User, Award, ShieldAlert, Building2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  licenseNumber: z.string().min(4, "Please enter a valid medical license number."),
  specialization: z.string().min(2, "Specialization is required (e.g. Neurology)."),
  institution: z.string().min(2, "Institution/Hospital is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      licenseNumber: "",
      specialization: "",
      institution: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      await signUp({
        email: values.email,
        name: values.name,
        licenseNumber: values.licenseNumber,
        specialization: values.specialization,
        institution: values.institution,
        password: values.password,
      });
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to create account. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-jade-dark">
          Create Clinical Account
        </h2>
        <p className="text-sm text-jade-teal">
          Register with your professional details to establish your care workstation
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-jade-dark font-medium">Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                    <Input
                      placeholder="Dr. Sarah Jenkins"
                      className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-jade-dark font-medium">Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                    <Input
                      placeholder="s.jenkins@medical.org"
                      className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-jade-dark font-medium">License ID</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                      <Input
                        placeholder="MD-98210"
                        className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-jade-dark font-medium">Specialization</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                      <Input
                        placeholder="Neurology"
                        className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-jade-dark font-medium">Institution / Hospital</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                    <Input
                      placeholder="St. Jude Cognitive Center"
                      className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-jade-dark font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-jade-dark font-medium">Confirm</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-jade-teal/60" />
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="pl-9 bg-white border-border focus-visible:ring-jade-primary focus-visible:border-jade-primary"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-10 shadow-sm transition-all duration-300 flex items-center justify-center gap-2 mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-jade-teal">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-jade-primary hover:underline hover:text-jade-dark transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
