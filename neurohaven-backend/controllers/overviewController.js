const { supabase, isMock } = require("../config/supabase");

// In-Memory mock data for developer mode
const mockOverviewStatus = {
  unresolvedCriticalCount: 2,
  complianceDeclineCount: 1,
  activeCompanionCount: 3,
  verifiedLicense: true
};

const mockCarePathways = [
  {
    id: "pat-1",
    name: "Arthur Pendelton",
    email: "arthur.p@care.com",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1965-04-12",
    cognitiveLevel: 72,
    riskLevel: "moderate",
    linkStatus: "active",
    linkedAt: "2026-03-12T10:00:00Z",
    lastActivity: "Spatial Memory Session — 2h ago",
    caregiver: {
      name: "Margaret Pendelton (Spouse)",
      phone: "+1 (555) 438-9210"
    }
  },
  {
    id: "pat-2",
    name: "Eleanor Vance",
    email: "eleanor.v@care.com",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1951-11-20",
    cognitiveLevel: 45,
    riskLevel: "severe",
    linkStatus: "active",
    linkedAt: "2026-02-18T11:00:00Z",
    lastActivity: "Reaction Time Test — 45m ago",
    caregiver: {
      name: "Thomas Vance (Son)",
      phone: "+1 (555) 902-1845"
    }
  },
  {
    id: "pat-3",
    name: "Gordon Cole",
    email: "gordon.c@care.com",
    avatar_url: null,
    dateOfBirth: "1960-08-15",
    cognitiveLevel: 88,
    riskLevel: "mild",
    linkStatus: "active",
    linkedAt: "2026-05-01T09:30:00Z",
    lastActivity: "Attention Grid Puzzle — 4h ago",
    caregiver: {
      name: "Albert Rosenfield (Colleague)",
      phone: "+1 (555) 732-8410"
    }
  },
  {
    id: "pat-4",
    name: "Marianne Faith",
    email: "marianne.f@care.com",
    avatar_url: null,
    dateOfBirth: "1958-01-10",
    cognitiveLevel: 61,
    riskLevel: "moderate",
    linkStatus: "active",
    linkedAt: "2026-04-10T14:20:00Z",
    lastActivity: "Number Recall Session — 1d ago",
    caregiver: {
      name: "John Faith (Brother)",
      phone: "+1 (555) 308-4521"
    }
  }
];

/**
 * Retrieve status metrics for situations awareness strip
 */
const getOverviewStatus = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockOverviewStatus });
  }

  try {
    const doctorId = req.user.id;

    // 1. Unresolved critical alerts count
    const { count: criticalCount, error: err1 } = await supabase
      .from("clinical_alerts")
      .select("*", { count: "exact", head: true })
      .eq("resolved", false)
      .eq("severity", "critical");

    if (err1) throw err1;
      
    // 2. Compliance warning alerts count
    const { count: warningCount, error: err2 } = await supabase
      .from("clinical_alerts")
      .select("*", { count: "exact", head: true })
      .eq("resolved", false)
      .eq("severity", "warning")
      .eq("alert_type", "omission");

    if (err2) throw err2;

    // 3. Active companion AI chat session interactions (limit count for overview)
    const { data: chats, error: err3 } = await supabase
      .from("exercise_scores")
      .select("*")
      .limit(5);

    if (err3) throw err3;

    // 4. Verify doctor license status
    const { data: doctor, error: err4 } = await supabase
      .from("doctors")
      .select("verified")
      .eq("id", doctorId)
      .single();

    const verifiedLicense = doctor ? doctor.verified : false;

    res.status(200).json({
      success: true,
      data: {
        unresolvedCriticalCount: criticalCount || 0,
        complianceDeclineCount: warningCount || 0,
        activeCompanionCount: Math.min(3, chats ? chats.length : 0),
        verifiedLicense
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve patient rounds ledger list for Active Care Pathways
 */
const getCarePathways = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockCarePathways });
  }

  try {
    const doctorId = req.user.id;

    // Fetch active links mapping to current doctor
    const { data: links, error: errLink } = await supabase
      .from("patient_links")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("status", "active");

    if (errLink) throw errLink;

    if (!links || links.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const patientIds = links.map(link => link.patient_id);

    // Fetch patient profiles in a bulk query
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*");

    // Map profiles by ID, user_id, and email for constant-time lookup
    const profileMap = {};
    const userIds = [];
    if (profiles) {
      profiles.forEach(p => {
        if (p.id) profileMap[p.id] = p;
        if (p.user_id) {
          profileMap[p.user_id] = p;
          userIds.push(p.user_id);
        }
        if (p.email) profileMap[p.email] = p;
      });
    }

    // Fetch all last telemetry sessions in a single bulk query (ordered by created_at desc)
    let sessionMap = {};
    if (userIds.length > 0) {
      const { data: sessions, error: errSess } = await supabase
        .from("exercise_scores")
        .select("patient_id, game_name, created_at")
        .in("patient_id", userIds)
        .order("created_at", { ascending: false });

      if (!errSess && sessions) {
        sessions.forEach(s => {
          // Since records are sorted descending, the first one encountered for each patient_id is the latest
          if (!sessionMap[s.patient_id]) {
            sessionMap[s.patient_id] = s;
          }
        });
      }
    }

    const carePathways = [];
    for (const link of links) {
      const patientId = link.patient_id;
      const patient = profileMap[patientId];
      
      if (patient) {
        const latestSession = patient.user_id ? sessionMap[patient.user_id] : null;
        const lastActivity = latestSession 
          ? `${(latestSession.game_name || "Memory Match").replace(/_/g, " ")} — Completed recently`
          : "No logged sessions";

        carePathways.push({
          id: patientId,
          name: patient.full_name || patient.name || "Patient",
          email: patient.email,
          avatar_url: patient.avatar_url || patient.avatarUrl || null,
          dateOfBirth: patient.date_of_birth,
          cognitiveLevel: patient.cognitive_level,
          riskLevel: patient.risk_level || "unknown",
          linkStatus: link.status,
          linkedAt: link.linked_at,
          lastActivity,
          caregiver: patient.caregiver || { name: "Not assigned", phone: "--" }
        });
      }
    }

    res.status(200).json({ success: true, data: carePathways });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStatus,
  getCarePathways
};
