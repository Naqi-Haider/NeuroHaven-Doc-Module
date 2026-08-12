import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Doctor } from "@/types/doctor";

export function useAuth() {
  const { user, token, loading, setSession, logout } = useAuthStore();

  useEffect(() => {
    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const supabaseUser = session.user;
          const doctorDetails: Doctor = {
            id: supabaseUser.id,
            email: supabaseUser.email || "",
            name: supabaseUser.user_metadata.name || "",
            licenseNumber: supabaseUser.user_metadata.licenseNumber || "",
            specialization: supabaseUser.user_metadata.specialization || "",
            institution: supabaseUser.user_metadata.institution || "",
            verified: supabaseUser.user_metadata.verified || false,
            createdAt: supabaseUser.created_at,
          };
          setSession(doctorDetails, session.access_token);
        } else {
          // Prevent logging out if we have an active offline dummy session
          const storedToken = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
          if (storedToken !== "dummy-jwt-token-xyz") {
            logout();
          }
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const supabaseUser = session.user;
        const doctorDetails: Doctor = {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: supabaseUser.user_metadata.name || "",
          licenseNumber: supabaseUser.user_metadata.licenseNumber || "",
          specialization: supabaseUser.user_metadata.specialization || "",
          institution: supabaseUser.user_metadata.institution || "",
          verified: supabaseUser.user_metadata.verified || false,
          createdAt: supabaseUser.created_at,
        };
        setSession(doctorDetails, session.access_token);
      } else {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("nh-user") : null;
        if (storedToken && storedUser) {
          try {
            setSession(JSON.parse(storedUser), storedToken);
          } catch {
            useAuthStore.getState().setLoading(false);
          }
        } else {
          useAuthStore.getState().setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, logout]);

  // Sign Up function inserting credentials into Supabase Auth & public.doctors table
  const signUp = async (
    doctorData: Omit<Doctor, "id" | "verified" | "createdAt"> & { password?: string }
  ) => {
    const isMockAuth = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-supabase-project-url");

    if (isMockAuth) {
      const dummyDoctor: Doctor = {
        id: "dummy-doc-" + Math.floor(Math.random() * 1000),
        email: doctorData.email,
        name: doctorData.name,
        licenseNumber: doctorData.licenseNumber,
        specialization: doctorData.specialization || "Neurology",
        institution: doctorData.institution || "NeuroHaven Clinic",
        verified: true,
        createdAt: new Date().toISOString(),
      };
      setSession(dummyDoctor, "dummy-jwt-token-xyz");
      return dummyDoctor;
    }

    const { data, error } = await supabase.auth.signUp({
      email: doctorData.email,
      password: doctorData.password || "",
      options: {
        data: {
          name: doctorData.name,
          licenseNumber: doctorData.licenseNumber,
          specialization: doctorData.specialization || "",
          institution: doctorData.institution || "",
          verified: false,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("Account creation failed.");

    // Insert public metadata row
    const { error: dbError } = await supabase.from("doctors").insert({
      id: data.user.id,
      email: doctorData.email,
      name: doctorData.name,
      license_number: doctorData.licenseNumber,
      specialization: doctorData.specialization || "",
      institution: doctorData.institution || "",
      verified: false,
    });

    if (dbError) throw dbError;
    return data.user;
  };

  // Sign In function using email & password credentials
  const signIn = async (email: string, password: string) => {
    const isMockAuth = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-supabase-project-url");

    if (isMockAuth) {
      const dummyDoctor: Doctor = {
        id: "dummy-doc-123",
        email: email,
        name: "Sarah Jenkins",
        licenseNumber: "MD-98210",
        specialization: "Neurology & Dementia Care",
        institution: "St. Jude Cognitive Center",
        verified: true,
        createdAt: new Date().toISOString(),
      };
      setSession(dummyDoctor, "dummy-jwt-token-xyz");
      return dummyDoctor;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  // Sign Out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Bypassed if offline or unconfigured
    }
    logout();
  };

  return {
    user,
    token,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
