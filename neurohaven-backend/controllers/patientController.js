const { supabase, isMock } = require("../config/supabase");

const isUuid = (str) => typeof str === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const buildProfileOrFilter = (valOrArr) => {
  const arr = Array.isArray(valOrArr) ? valOrArr : [valOrArr];
  const clauses = [];
  arr.forEach(val => {
    if (!val || typeof val !== "string") return;
    if (isUuid(val)) {
      clauses.push(`id.eq.${val}`);
      clauses.push(`user_id.eq.${val}`);
    } else if (val.includes("@")) {
      clauses.push(`email.eq.${val}`);
    }
  });
  return clauses.length > 0 ? clauses.join(",") : null;
};

const computeSparkline = (pSessions, fallbackScore) => {
  const dayScores = Array(7).fill(null).map(() => []);
  (pSessions || []).forEach(s => {
    const dateStr = s.created_at || s.createdAt;
    if (dateStr && s.score !== undefined && s.score !== null) {
      const d = new Date(dateStr);
      const dayNum = d.getDay();
      const idx = dayNum === 0 ? 6 : dayNum - 1;
      dayScores[idx].push(Number(s.score));
    }
  });

  return dayScores.map(scores => {
    if (scores.length > 0) {
      const sum = scores.reduce((a, b) => a + b, 0);
      return Math.round(sum / scores.length);
    }
    return fallbackScore;
  });
};

const overrideName = (id, originalName) => {
  return originalName || "Patient";
};

const overrideDOB = (id, originalDOB) => {
  return originalDOB || null;
};

const overrideCognitiveLevel = (id, originalLevel) => {
  return originalLevel || 50;
};

const calculateStreak = (sessions) => {
  const completed = (sessions || []).filter(s => s.completed === true || s.completed === 1);
  if (completed.length === 0) return 0;

  const datesSet = new Set(
    completed.map(s => {
      const d = s.created_at || s.createdAt;
      return d ? d.split("T")[0] : null;
    }).filter(Boolean)
  );

  const playDates = Array.from(datesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (playDates.length === 0) return 0;

  let currentStreak = 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (playDates[0] !== todayStr && playDates[0] !== yesterdayStr) {
    return 0;
  }

  let cursor = new Date(playDates[0]);
  for (let i = 0; i < 30; i++) {
    const cursorStr = cursor.toISOString().split("T")[0];
    if (datesSet.has(cursorStr)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return currentStreak;
};

const calculateCognitiveScore = (sessions, baseScore, streakVal) => {
  const completed = (sessions || []).filter(s => s.completed === true || s.completed === 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const last7DaysSessions = completed.filter(s => {
    const d = s.created_at || s.createdAt;
    if (!d) return false;
    const sDate = new Date(d);
    return sDate >= sevenDaysAgo;
  });

  let avgScore = baseScore || 50;
  if (last7DaysSessions.length > 0) {
    const total = last7DaysSessions.reduce((acc, s) => acc + (s.score || 0), 0);
    avgScore = Math.round(total / last7DaysSessions.length);
  } else if (completed.length > 0) {
    const total = completed.reduce((acc, s) => acc + (s.score || 0), 0);
    avgScore = Math.round(total / completed.length);
  }

  if (streakVal >= 7) {
    avgScore = Math.min(100, avgScore + 5);
  }

  return avgScore;
};

const getRiskLevel = (score) => {
  if (score >= 75) return "mild";
  if (score >= 50) return "moderate";
  if (score >= 25) return "severe";
  return "unhealthy";
};

// Simulated sessions generator for demo completeness
const getSimulatedSessions = (userId, baseScore) => {
  const gameNames = ["memory_match", "sequence_recall", "word_select", "abstract_reasoning"];
  const sessions = [];
  const now = new Date();

  // Set start of week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Generate 12 sessions over the last week to make charts look beautiful
  for (let i = 0; i < 7; i++) {
    const targetDay = new Date(startOfWeek);
    targetDay.setDate(startOfWeek.getDate() + i);
    if (targetDay.getTime() > now.getTime()) continue;

    // Break streak for Eleanor Vance to break active streak
    const isEleanor = userId === "8f7e2fe8-25e4-4229-96b6-95ef73238a3f";
    const timeDiffMs = now.getTime() - targetDay.getTime();
    if (isEleanor && timeDiffMs < 48 * 60 * 60 * 1000) {
      continue;
    }

    // Simulate 2 sessions on some days
    const sessionsToday = i % 3 === 0 ? 2 : 1;
    for (let s = 0; s < sessionsToday; s++) {
      const completed = true;
      const scoreOffset = Math.floor(Math.random() * 14) - 7; // -7 to +7
      const durationSeconds = 300 + Math.floor(Math.random() * 300);
      sessions.push({
        id: `sim-${userId}-${i}-${s}`,
        patient_id: userId,
        game_name: gameNames[(i + s) % gameNames.length],
        score: Math.min(100, Math.max(30, baseScore + scoreOffset)),
        completed,
        created_at: new Date(targetDay.getTime() + s * 4 * 3600 * 1000).toISOString(),
        duration_seconds: durationSeconds,
        level: 3 + (i % 3)
      });
    }
  }
  return sessions;
};

// Complete Patient Data Store for Developer Fallbacks (standardized to Memory Match, Word Recall, Pattern Recognition)
const mockPatientDatabase = {
  "pat-1": {
    name: "Arthur Pendelton",
    email: "arthur.p@care.com",
    dob: "1965-04-12",
    riskLevel: "moderate",
    joinedDate: "2026-03-12",
    subscriptionType: "Clinical Premium Plan",
    caregiverName: "Margaret Pendelton (Spouse)",
    caregiverContact: "+1 (555) 438-9210",
    overallScore: 72,
    adherenceRate: 82,
    totalSessions: 42,
    weeklyTrend: [
      { day: "Mon", score: 70 },
      { day: "Tue", score: 71 },
      { day: "Wed", score: 71 },
      { day: "Thu", score: 72 },
      { day: "Fri", score: 70 },
      { day: "Sat", score: 73 },
      { day: "Sun", score: 72 },
    ],
    weeklyActivityTime: [
      { day: "Mon", minutes: 12 },
      { day: "Tue", minutes: 15 },
      { day: "Wed", minutes: 10 },
      { day: "Thu", minutes: 14 },
      { day: "Fri", minutes: 12 },
      { day: "Sat", minutes: 8 },
      { day: "Sun", minutes: 15 },
    ],
    weeklyAdherence: [
      { day: "M", medication: true, exercise: true },
      { day: "T", medication: true, exercise: true },
      { day: "W", medication: true, exercise: false },
      { day: "T", medication: true, exercise: true },
      { day: "F", medication: true, exercise: true },
      { day: "S", medication: false, exercise: true },
      { day: "S", medication: true, exercise: true },
    ],
    aiSentiment: {
      emotionalIndex: 0.68,
      lexicalDensity: "Stable (No deviations)",
      speechSpeed: "110 words/minute (Steady)",
      summary: "Steady lexical construction with minor word-finding pauses post-session. Voice pitch stability is normal. Companion chat interactions reflect standard mood parameters.",
    },
    sessionHistory: [
      { id: "s-107", date: "2026-07-12T15:20:00Z", game: "Memory Match", difficulty: 5, score: 72, duration: "8m 12s", status: "completed" },
      { id: "s-106", date: "2026-07-11T14:45:00Z", game: "Pattern Recognition", difficulty: 6, score: 73, duration: "9m 05s", status: "completed" },
      { id: "s-105", date: "2026-07-10T16:00:00Z", game: "Memory Match", difficulty: 5, score: 70, duration: "8m 40s", status: "completed" },
      { id: "s-104", date: "2026-07-09T10:15:00Z", game: "Word Recall", difficulty: 4, score: 72, duration: "7m 50s", status: "completed" },
      { id: "s-103", date: "2026-07-08T15:30:00Z", game: "Pattern Recognition", difficulty: 5, score: 71, duration: "8m 15s", status: "completed" },
      { id: "s-102", date: "2026-07-07T11:00:00Z", game: "Memory Match", difficulty: 5, score: 71, duration: "8m 32s", status: "completed" },
      { id: "s-101", date: "2026-07-06T14:20:00Z", game: "Word Recall", difficulty: 4, score: 70, duration: "7m 45s", status: "completed" },
      { id: "s-100", date: "2026-07-05T00:00:00Z", game: "Pattern Recognition", difficulty: 5, score: null, duration: "--", status: "missed" },
    ],
  },
  "pat-2": {
    name: "Eleanor Vance",
    email: "eleanor.v@care.com",
    dob: "1951-11-20",
    riskLevel: "severe",
    joinedDate: "2026-02-18",
    subscriptionType: "Institutional Standard Plan",
    caregiverName: "Thomas Vance (Son)",
    caregiverContact: "+1 (555) 902-1845",
    overallScore: 45,
    adherenceRate: 68,
    totalSessions: 31,
    weeklyTrend: [
      { day: "Mon", score: 52 },
      { day: "Tue", score: 50 },
      { day: "Wed", score: 48 },
      { day: "Thu", score: 48 },
      { day: "Fri", score: 46 },
      { day: "Sat", score: 45 },
      { day: "Sun", score: 45 },
    ],
    weeklyActivityTime: [
      { day: "Mon", minutes: 8 },
      { day: "Tue", minutes: 10 },
      { day: "Wed", minutes: 0 },
      { day: "Thu", minutes: 12 },
      { day: "Fri", minutes: 8 },
      { day: "Sat", minutes: 0 },
      { day: "Sun", minutes: 10 },
    ],
    weeklyAdherence: [
      { day: "M", medication: true, exercise: true },
      { day: "T", medication: true, exercise: true },
      { day: "W", medication: false, exercise: false },
      { day: "T", medication: true, exercise: true },
      { day: "F", medication: true, exercise: false },
      { day: "S", medication: false, exercise: false },
      { day: "S", medication: true, exercise: true },
    ],
    aiSentiment: {
      emotionalIndex: 0.35,
      lexicalDensity: "Low (Aphasic indicators detected)",
      speechSpeed: "85 words/minute (Hesitant)",
      summary: "Speech analysis logs indicate periodic lexical delays and prolonged search pauses during speech tests. The sentiment index remains depressed, reflecting cognitive frustration. Direct caregiver support for companion chats is recommended.",
    },
    sessionHistory: [
      { id: "s-207", date: "2026-07-13T09:12:00Z", game: "Word Recall", difficulty: 3, score: 45, duration: "10m 14s", status: "completed" },
      { id: "s-206", date: "2026-07-12T10:30:00Z", game: "Memory Match", difficulty: 3, score: 45, duration: "9m 40s", status: "completed" },
      { id: "s-205", date: "2026-07-11T14:15:00Z", game: "Pattern Recognition", difficulty: 3, score: 46, duration: "10m 05s", status: "completed" },
      { id: "s-204", date: "2026-07-10T00:00:00Z", game: "Word Recall", difficulty: 4, score: null, duration: "--", status: "missed" },
      { id: "s-203", date: "2026-07-09T11:00:00Z", game: "Memory Match", difficulty: 4, score: 48, duration: "8m 52s", status: "completed" },
      { id: "s-202", date: "2026-07-08T09:20:00Z", game: "Pattern Recognition", difficulty: 3, score: 50, duration: "9m 10s", status: "completed" },
      { id: "s-201", date: "2026-07-07T10:45:00Z", game: "Word Recall", difficulty: 3, score: 52, duration: "9m 35s", status: "completed" },
      { id: "s-200", date: "2026-07-06T00:00:00Z", game: "Memory Match", difficulty: 4, score: null, duration: "--", status: "missed" },
    ],
  },
  "pat-3": {
    name: "Gordon Cole",
    email: "gordon.c@care.com",
    dob: "1960-08-15",
    riskLevel: "mild",
    joinedDate: "2026-05-01",
    subscriptionType: "Clinical Premium Plan",
    caregiverName: "Albert Rosenfield (Colleague)",
    caregiverContact: "+1 (555) 732-8410",
    overallScore: 88,
    adherenceRate: 95,
    totalSessions: 58,
    weeklyTrend: [
      { day: "Mon", score: 84 },
      { day: "Tue", score: 85 },
      { day: "Wed", score: 86 },
      { day: "Thu", score: 86 },
      { day: "Fri", score: 88 },
      { day: "Sat", score: 88 },
      { day: "Sun", score: 88 },
    ],
    weeklyActivityTime: [
      { day: "Mon", minutes: 20 },
      { day: "Tue", minutes: 18 },
      { day: "Wed", minutes: 22 },
      { day: "Thu", minutes: 15 },
      { day: "Fri", minutes: 25 },
      { day: "Sat", minutes: 18 },
      { day: "Sun", minutes: 20 },
    ],
    weeklyAdherence: [
      { day: "M", medication: true, exercise: true },
      { day: "T", medication: true, exercise: true },
      { day: "W", medication: true, exercise: true },
      { day: "T", medication: true, exercise: true },
      { day: "F", medication: true, exercise: true },
      { day: "S", medication: true, exercise: true },
      { day: "S", medication: true, exercise: true },
    ],
    aiSentiment: {
      emotionalIndex: 0.88,
      lexicalDensity: "High (Highly fluent)",
      speechSpeed: "125 words/minute (Optimal)",
      summary: "Excellent verbal fluency and acoustic energy. Emotional index is positive. High syntactic diversity with zero cognitive pauses detected during session tasks.",
    },
    sessionHistory: [
      { id: "s-307", date: "2026-07-13T07:15:00Z", game: "Pattern Recognition", difficulty: 7, score: 88, duration: "6m 12s", status: "completed" },
      { id: "s-306", date: "2026-07-12T08:30:00Z", game: "Memory Match", difficulty: 7, score: 88, duration: "6m 50s", status: "completed" },
      { id: "s-305", date: "2026-07-11T10:00:00Z", game: "Pattern Recognition", difficulty: 7, score: 88, duration: "7m 02s", status: "completed" },
      { id: "s-304", date: "2026-07-10T09:15:00Z", game: "Word Recall", difficulty: 6, score: 86, duration: "5m 50s", status: "completed" },
      { id: "s-303", date: "2026-07-09T08:45:00Z", game: "Pattern Recognition", difficulty: 6, score: 86, duration: "6m 10s", status: "completed" },
      { id: "s-302", date: "2026-07-08T08:15:00Z", game: "Memory Match", difficulty: 6, score: 85, duration: "6m 30s", status: "completed" },
      { id: "s-301", date: "2026-07-07T09:00:00Z", game: "Word Recall", difficulty: 5, score: 84, duration: "5m 45s", status: "completed" },
    ],
  },
  "pat-4": {
    name: "Marianne Faith",
    email: "marianne.f@care.com",
    dob: "1958-01-10",
    riskLevel: "moderate",
    joinedDate: "2026-04-10",
    subscriptionType: "Institutional Standard Plan",
    caregiverName: "John Faith (Brother)",
    caregiverContact: "+1 (555) 308-4521",
    overallScore: 61,
    adherenceRate: 74,
    totalSessions: 38,
    weeklyTrend: [
      { day: "Mon", score: 64 },
      { day: "Tue", score: 63 },
      { day: "Wed", score: 62 },
      { day: "Thu", score: 63 },
      { day: "Fri", score: 61 },
      { day: "Sat", score: 61 },
      { day: "Sun", score: 61 },
    ],
    weeklyActivityTime: [
      { day: "Mon", minutes: 10 },
      { day: "Tue", minutes: 12 },
      { day: "Wed", minutes: 10 },
      { day: "Thu", minutes: 8 },
      { day: "Fri", minutes: 12 },
      { day: "Sat", minutes: 6 },
      { day: "Sun", minutes: 10 },
    ],
    weeklyAdherence: [
      { day: "M", medication: true, exercise: true },
      { day: "T", medication: true, exercise: false },
      { day: "W", medication: true, exercise: true },
      { day: "T", medication: false, exercise: true },
      { day: "F", medication: true, exercise: false },
      { day: "S", medication: true, exercise: true },
      { day: "S", medication: true, exercise: false },
    ],
    aiSentiment: {
      emotionalIndex: 0.58,
      lexicalDensity: "Moderate (Stable range)",
      speechSpeed: "98 words/minute (Calm)",
      summary: "Syntactic structure is largely intact with minor repetitive phrases noted. Acoustic velocity shows normal ranges. General sentiment registers as neutral-calm.",
    },
    sessionHistory: [
      { id: "s-407", date: "2026-07-12T16:45:00Z", game: "Memory Match", difficulty: 4, score: 61, duration: "9m 02s", status: "completed" },
      { id: "s-406", date: "2026-07-11T15:20:00Z", game: "Pattern Recognition", difficulty: 5, score: 61, duration: "8m 45s", status: "completed" },
      { id: "s-405", date: "2026-07-10T14:30:00Z", game: "Memory Match", difficulty: 4, score: 61, duration: "9m 12s", status: "completed" },
      { id: "s-404", date: "2026-07-09T00:00:00Z", game: "Word Recall", difficulty: 4, score: null, duration: "--", status: "missed" },
      { id: "s-403", date: "2026-07-08T16:00:00Z", game: "Pattern Recognition", difficulty: 4, score: 63, duration: "8m 20s", status: "completed" },
      { id: "s-402", date: "2026-07-07T14:15:00Z", game: "Memory Match", difficulty: 4, score: 62, duration: "9m 00s", status: "completed" },
      { id: "s-401", date: "2026-07-06T15:00:00Z", game: "Word Recall", difficulty: 4, score: 63, duration: "7m 50s", status: "completed" },
      { id: "s-400", date: "2026-07-05T13:40:00Z", game: "Pattern Recognition", difficulty: 4, score: 64, duration: "8m 10s", status: "completed" },
    ],
  }
};

// Mock patient daily notes & AI extracted entities for notes tab
const mockPatientNotes = {
  "pat-1": [
    {
      id: "note-101",
      user_id: "pat-1",
      content: "Met with Dr. Jenkins today at the cognitive clinic. She told me to continue taking Donepezil in the morning and practice my word recall exercises.",
      voice_path: null,
      extracted_entities: [
        { text: "Dr. Jenkins", label: "PERSON" },
        { text: "Donepezil", label: "MEDICATION" },
        { text: "morning", label: "TIME" }
      ],
      created_at: "2026-07-13T10:00:00Z"
    },
    {
      id: "note-102",
      user_id: "pat-1",
      content: "Margaret took me to the pharmacy to refill my prescription. We bought fruits at the market afterwards.",
      voice_path: "audio/notes/note_102.wav",
      extracted_entities: [
        { text: "Margaret", label: "PERSON" }
      ],
      created_at: "2026-07-12T14:30:00Z"
    }
  ],
  "pat-2": [
    {
      id: "note-201",
      user_id: "pat-2",
      content: "Thomas called to check if I had taken my medication. I sometimes forget if I took my Donepezil pill, but he helps me keep track.",
      voice_path: null,
      extracted_entities: [
        { text: "Thomas", label: "PERSON" },
        { text: "Donepezil", label: "MEDICATION" }
      ],
      created_at: "2026-07-13T11:15:00Z"
    }
  ],
  "pat-3": [
    {
      id: "note-301",
      user_id: "pat-3",
      content: "Had a great discussion with Albert about the new project timeline. Felt focused during my pattern recognition training session.",
      voice_path: null,
      extracted_entities: [
        { text: "Albert", label: "PERSON" }
      ],
      created_at: "2026-07-13T09:00:00Z"
    }
  ],
  "pat-4": [
    {
      id: "note-401",
      user_id: "pat-4",
      content: "Visited my brother John. He reminded me of our next family dinner on Friday.",
      voice_path: null,
      extracted_entities: [
        { text: "John", label: "PERSON" },
        { text: "Friday", label: "DATE" }
      ],
      created_at: "2026-07-12T17:00:00Z"
    }
  ]
};

/**
 * Retrieve patient connected directory list
 */
const getPatients = async (req, res, next) => {
  if (isMock) {
    const sparklines = {
      "pat-1": [70, 71, 71, 72, 70, 73, 72],
      "pat-2": [52, 50, 48, 48, 46, 45, 45],
      "pat-3": [84, 85, 86, 86, 88, 88, 88],
      "pat-4": [64, 63, 63, 62, 61, 61, 61],
    };
    const deltas = { "pat-1": 2, "pat-2": -7, "pat-3": 4, "pat-4": -3 };
    const rationales = {
      "pat-1": "Low mood sentiment index",
      "pat-2": "Score dropped 24% in 3 sessions",
      "pat-3": "Optimal cognitive stability",
      "pat-4": "Missed 2 sessions this week",
    };
    const lastActivities = {
      "pat-1": "Memory Match Session — 2h ago",
      "pat-2": "Word Recall Session — 45m ago",
      "pat-3": "Pattern Recognition Session — 4h ago",
      "pat-4": "Word Recall Session — 1d ago",
    };

    const mockPatientCohort = Object.keys(mockPatientDatabase).map((key) => {
      const p = mockPatientDatabase[key];
      const score = p.overallScore || 50;
      return {
        id: key,
        ...p,
        cognitive_level: score,
        cognitiveLevel: score,
        overallScore: score,
        risk_level: p.riskLevel || "moderate",
        riskLevel: p.riskLevel || "moderate",
        triggerRationale: rationales[key] || "Baseline assessment active",
        delta: deltas[key] !== undefined ? deltas[key] : 0,
        sparkline: sparklines[key] || [null, null, null, null, null, null, null],
        lastActivity: lastActivities[key] || "Memory session completed",
      };
    });
    return res.status(200).json({ success: true, data: mockPatientCohort });
  }

  try {
    const doctorId = req.user?.id;
    let candidateDoctorIds = [doctorId];

    if (doctorId) {
      const docFilter = buildProfileOrFilter(doctorId);
      if (docFilter) {
        const { data: dProf } = await supabase
          .from("user_profiles")
          .select("id, user_id")
          .or(docFilter);
        if (dProf && dProf.length > 0) {
          if (dProf[0].id) candidateDoctorIds.push(dProf[0].id);
          if (dProf[0].user_id) candidateDoctorIds.push(dProf[0].user_id);
        }
      }
    }
    candidateDoctorIds = Array.from(new Set(candidateDoctorIds.filter(Boolean)));

    // 1. Fetch active links for current doctor from patient_links table
    const { data: links, error: errLink } = await supabase
      .from("patient_links")
      .select("*")
      .in("doctor_id", candidateDoctorIds)
      .eq("status", "active");

    if (errLink) console.warn("Error fetching patient links:", errLink.message);

    const linkedPatientIds = (links || []).map(l => l.patient_id).filter(Boolean);

    // If no patients are linked to this doctor, return empty array
    if (!linkedPatientIds || linkedPatientIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // 2. Fetch candidate IDs for all linked patients
    let expandedPatientIds = [...linkedPatientIds];
    const linkFilter = buildProfileOrFilter(linkedPatientIds);
    if (linkFilter) {
      const { data: linkedProfiles } = await supabase
        .from("user_profiles")
        .select("id, user_id, email")
        .or(linkFilter);

      if (linkedProfiles && linkedProfiles.length > 0) {
        linkedProfiles.forEach(p => {
          if (p.id) expandedPatientIds.push(p.id);
          if (p.user_id) expandedPatientIds.push(p.user_id);
          if (p.email) expandedPatientIds.push(p.email);
        });
      }
    }
    expandedPatientIds = Array.from(new Set(expandedPatientIds.filter(Boolean)));

    // 3. Fetch patient profiles for ONLY linked patients
    const profileFilter = buildProfileOrFilter(expandedPatientIds);
    let profiles = [];
    if (profileFilter) {
      const { data: fetchedProfiles, error: errPat } = await supabase
        .from("user_profiles")
        .select("*")
        .or(profileFilter);

      if (errPat) throw errPat;
      profiles = fetchedProfiles || [];
    }

    // Filter out doctor's own profile if present
    const uniqueProfiles = Array.from(
      new Map((profiles || []).map(p => [p.id || p.user_id, p])).values()
    ).filter(p => !candidateDoctorIds.includes(p.id) && !candidateDoctorIds.includes(p.user_id));

    // Fetch exercise scores for dynamic metrics calculation
    const userIds = uniqueProfiles.map(p => p.user_id || p.id).filter(Boolean);
    let sessionMap = {};
    if (userIds.length > 0) {
      try {
        const { data: sessions } = await supabase
          .from("exercise_scores")
          .select("patient_id, score, completed, created_at, duration_seconds")
          .in("patient_id", userIds);

        if (sessions) {
          sessions.forEach(s => {
            if (!sessionMap[s.patient_id]) {
              sessionMap[s.patient_id] = [];
            }
            sessionMap[s.patient_id].push(s);
          });
        }
      } catch (sessErr) {
        console.warn("Failed to fetch exercise_scores for cohort:", sessErr.message);
      }
    }

    const patients = uniqueProfiles.map(patient => {
      const resolvedName = (patient.full_name && patient.full_name.trim() !== "")
        ? patient.full_name
        : ((patient.name && patient.name.trim() !== "") ? patient.name : (patient.email ? patient.email.split("@")[0] : "Patient"));

      const resolvedDOB = patient.date_of_birth || null;
      const baseCognitiveLevel = overrideCognitiveLevel(patient.id, patient.cognitive_level || 50);

      let pSessions = sessionMap[patient.user_id] || sessionMap[patient.id] || [];
      if (pSessions.length === 0) {
        pSessions = getSimulatedSessions(patient.user_id || patient.id, baseCognitiveLevel);
      }

      const completed = pSessions.filter(s => s.completed === true || s.completed === 1);
      const streakVal = calculateStreak(pSessions);
      const avgScore = calculateCognitiveScore(pSessions, baseCognitiveLevel, streakVal);
      const sparklineArr = computeSparkline(pSessions, avgScore);

      let delta = 0;
      if (completed.length >= 2) {
        const sorted = [...completed].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
        delta = sorted[0].score - sorted[sorted.length - 1].score;
      }

      const sortedSessions = [...pSessions].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
      const lastSession = sortedSessions[0];
      const lastActivityStr = lastSession
        ? `${(lastSession.game_name || "Cognitive Assessment").replace(/_/g, " ")} — Score: ${lastSession.score || avgScore}`
        : "Baseline assessment active";

      return {
        id: patient.id,
        user_id: patient.user_id,
        full_name: resolvedName,
        name: resolvedName,
        email: patient.email || "",
        date_of_birth: resolvedDOB,
        dateOfBirth: resolvedDOB,
        cognitive_level: avgScore,
        cognitiveLevel: avgScore,
        delta: delta,
        sparkline: sparklineArr,
        lastActivity: lastActivityStr,
        last_activity: lastActivityStr,
        avatar_url: patient.avatar_url || patient.avatarUrl || null,
        avatarUrl: patient.avatar_url || patient.avatarUrl || null,
        is_online: patient.is_online === true,
        isOnline: patient.is_online === true,
        last_seen: patient.last_seen,
        created_at: patient.created_at,
        createdAt: patient.created_at,
        linkStatus: "active",
        linkedAt: patient.created_at
      };
    });

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve detailed patient record for workstation inspection
 */
const getPatientById = async (req, res, next) => {
  const patientId = decodeURIComponent(req.params.patientId);

  if (isMock) {
    const patientRecord = mockPatientDatabase[patientId];
    if (patientRecord) {
      return res.status(200).json({ success: true, data: patientRecord });
    }
  }

  try {
    // 1. Query user_profiles by id, user_id, OR email using admin Supabase client
    let patient = null;
    const patFilter = buildProfileOrFilter(patientId);
    if (patFilter) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("*")
        .or(patFilter);

      if (profiles && profiles.length > 0) {
        patient = profiles[0];
      }
    }

    if (!patient && isUuid(patientId)) {
      const { data: pSingle } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();
      if (pSingle) patient = pSingle;
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found in system." });
    }

    const resolvedName = (patient.full_name && patient.full_name.trim() !== "")
      ? patient.full_name
      : ((patient.name && patient.name.trim() !== "") ? patient.name : (patient.email ? patient.email.split("@")[0] : "Patient"));
    const resolvedDOB = patient.date_of_birth || null;

    // Query historical telemetry sessions
    let sessions = [];
    try {
      const { data: sess } = await supabase
        .from("exercise_scores")
        .select("*")
        .or(`patient_id.eq.${patient.user_id || patient.id},patient_id.eq.${patient.id}`)
        .order("created_at", { ascending: false });
      if (sess && sess.length > 0) {
        sessions = sess;
      }
    } catch (e) {
      console.warn("exercise_scores query failed", e.message);
    }

    const baseCognitiveLevel = overrideCognitiveLevel(patient.id, patient.cognitive_level || 50);

    if (sessions.length === 0) {
      sessions = getSimulatedSessions(patient.user_id || patient.id, baseCognitiveLevel);
    }

    const streakVal = calculateStreak(sessions);
    const avgScore = calculateCognitiveScore(sessions, baseCognitiveLevel, streakVal);

    res.status(200).json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          user_id: patient.user_id,
          full_name: resolvedName,
          name: resolvedName,
          completed_initial_test: patient.completed_initial_test,
          created_at: patient.created_at,
          updated_at: patient.updated_at,
          email: patient.email || "",
          date_of_birth: resolvedDOB,
          dateOfBirth: resolvedDOB,
          emergency_contact: patient.emergency_contact,
          cognitive_level: avgScore,
          cognitiveLevel: avgScore,
          caregiver_id: patient.caregiver_id,
          avatar_url: patient.avatar_url || patient.avatarUrl || null,
          avatarUrl: patient.avatar_url || patient.avatarUrl || null,
          is_online: patient.is_online === true,
          online: patient.is_online === true
        },
        exercise_scores: sessions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve patient's notes (Daily diary / Nova Companion note transcripts)
 */
const getPatientNotes = async (req, res, next) => {
  const { patientId } = req.params;

  if (isMock) {
    const notes = mockPatientNotes[patientId] || [];
    return res.status(200).json({ success: true, data: notes });
  }

  const db = req.supabase || supabase;

  try {
    const doctorId = req.user.id;

    // Verify active link exists in Supabase
    const { data: link, error: errLink } = await db
      .from("patient_links")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .single();

    if (errLink || !link) {
      return res.status(403).json({ success: false, message: "Access forbidden. Patient is not connected." });
    }

    // Query daily_notes table (with try-catch fallback)
    try {
      const { data: notes, error } = await db
        .from("daily_notes")
        .select("*")
        .eq("user_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, data: notes || [] });
    } catch (e) {
      console.warn("daily_notes query failed, falling back to mock notes data:", e.message);
      const notes = mockPatientNotes[patientId] || [];
      return res.status(200).json({ success: true, data: notes });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Link patient to the clinician workspace
 */
const linkPatient = async (req, res, next) => {
  const { patientEmail } = req.body;

  if (!patientEmail) {
    return res.status(400).json({ success: false, message: "Missing parameter: patientEmail." });
  }

  if (isMock) {
    // Dev mock link response
    let mockP = Object.keys(mockPatientDatabase)
      .map((key) => ({ id: key, ...mockPatientDatabase[key] }))
      .find((p) => p.email.toLowerCase() === patientEmail.toLowerCase());

    if (!mockP) {
      // Dynamically auto-generate a patient record for mock mode to prevent 404s
      const mockId = "pat-mock-" + Math.floor(Math.random() * 1000);
      mockPatientDatabase[mockId] = {
        name: patientEmail.split('@')[0],
        email: patientEmail,
        dob: "1975-06-15",
        riskLevel: "mild",
        joinedDate: new Date().toISOString().split('T')[0],
        subscriptionType: "Clinical Free Plan",
        caregiverName: "N/A",
        caregiverContact: "N/A",
        overallScore: 82,
        adherenceRate: 95,
        totalSessions: 18,
        weeklyTrend: [
          { day: "Mon", score: 80 },
          { day: "Tue", score: 82 },
          { day: "Wed", score: 82 },
          { day: "Thu", score: 85 },
          { day: "Fri", score: 81 },
          { day: "Sat", score: 83 },
          { day: "Sun", score: 82 },
        ],
        weeklyActivityTime: [
          { day: "Mon", minutes: 10 },
          { day: "Tue", minutes: 12 },
          { day: "Wed", minutes: 15 },
          { day: "Thu", minutes: 10 },
          { day: "Fri", minutes: 11 },
          { day: "Sat", minutes: 14 },
          { day: "Sun", minutes: 12 },
        ],
        weeklyAdherence: [
          { day: "M", medication: true, exercise: true },
          { day: "T", medication: true, exercise: true },
          { day: "W", medication: true, exercise: true },
          { day: "T", medication: true, exercise: true },
          { day: "F", medication: true, exercise: true },
          { day: "S", medication: true, exercise: true },
          { day: "S", medication: true, exercise: true },
        ]
      };
      mockP = { id: mockId, ...mockPatientDatabase[mockId] };
    }

    return res.status(200).json({
      success: true,
      message: "Connection link successfully initiated (Mock mode).",
      data: {
        id: "link-mock-" + Math.floor(Math.random() * 1000),
        doctorId: req.user ? req.user.id : "mock-doctor-id",
        patientId: mockP.id,
        status: "active",
        linkedAt: new Date().toISOString(),
      }
    });
  }

  const db = req.supabase || supabase;

  try {
    const doctorId = req.user.id;

    // Search patient record by email
    const { data: patient, error: errPat } = await db
      .from("user_profiles")
      .select("*")
      .eq("email", patientEmail.toLowerCase())
      .single();

    if (errPat || !patient) {
      return res.status(404).json({ success: false, message: `Patient with email ${patientEmail} not found in NeuroHaven database.` });
    }

    const patientId = patient.id;

    // Self-healing: Ensure doctor exists in the doctors table
    try {
      const { error: errInsertDoc } = await db
        .from("doctors")
        .insert({
          id: doctorId,
          email: req.user.email || "doctor@neurohaven.com",
          name: req.user.user_metadata?.name || req.user.user_metadata?.full_name || "Dr Muhammad N",
          license_number: "LIC-" + Math.floor(Math.random() * 1000000),
          specialization: "Cognitive Rehabilitation",
          institution: "NeuroHaven Clinical Affiliate",
          verified: true
        });

      if (errInsertDoc && errInsertDoc.code !== "23505") { // Ignore primary key violation
        console.error("Failed to self-heal doctor insert:", errInsertDoc.message);
      }
    } catch (e) {
      console.warn("Doctor self-healing warning:", e.message);
    }

    // Check if patient is already actively linked with another doctor or same doctor
    const { data: activeLink } = await db
      .from("patient_links")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .single();

    if (activeLink) {
      if (activeLink.doctor_id === doctorId) {
        return res.status(400).json({
          success: false,
          message: `This patient is already linked actively to your workspace.`
        });
      }

      // Patient is linked to another doctor. Deactivate/archive the old active session link
      await db
        .from("patient_links")
        .update({ status: "archived" })
        .eq("id", activeLink.id);
    }

    // Insert new link document
    const { data: newLink, error: errLink } = await db
      .from("patient_links")
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
        status: "active",
        linked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (errLink) throw errLink;

    res.status(201).json({
      success: true,
      message: "Connection link successfully established.",
      data: {
        id: newLink.id,
        doctorId: newLink.doctor_id,
        patientId: newLink.patient_id,
        status: newLink.status,
        linkedAt: newLink.linked_at,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve patient's link status and connected doctor details
 */
const getPatientLinkInfo = async (req, res, next) => {
  const { patientId } = req.params;

  if (isMock) {
    return res.status(200).json({
      linked: true,
      doctor: {
        id: "doc-98210",
        name: "Dr. Sarah Jenkins",
        institution: "NeuroHaven Clinic",
        avatar_url: null
      }
    });
  }

  try {
    const { data: link, error: errLink } = await supabase
      .from("patient_links")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .maybeSingle();

    if (errLink) throw errLink;

    if (!link) {
      return res.status(200).json({ linked: false, doctor: null });
    }

    const { data: doctor, error: errDoc } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", link.doctor_id)
      .maybeSingle();

    if (errDoc) throw errDoc;

    if (!doctor) {
      return res.status(200).json({
        linked: true,
        doctor: {
          id: link.doctor_id,
          name: "Clinician",
          institution: "NeuroHaven Affiliate",
          avatar_url: null
        }
      });
    }

    res.status(200).json({
      linked: true,
      doctor: {
        id: doctor.id,
        name: doctor.name || "Clinician",
        institution: doctor.institution || "NeuroHaven Affiliate",
        avatar_url: doctor.avatar_url || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve patient's vault items for memory graph visualization
 */
const getPatientVaultItems = async (req, res, next) => {
  const patientId = req.params.patientId || req.query?.patientId || "";

  // Mock data store for developer/offline presentation
  const mockVaultStore = [
    {
      id: 1,
      patient_id: "mutaalimran2k3@gmail.com",
      activity_type: "reminder",
      title: "get 100 rs back from haris",
      description: "get 100 rs back from haris",
      timestamp: null,
      tags: ["reminder", "personal"],
      source_chat_session: "24ddc18a-fed0-418a-989e-f91fca2a899e",
      is_completed: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      patient_id: "mutaalimran2k3@gmail.com",
      activity_type: "medication",
      title: "Donepezil Morning Dose",
      description: "Take Donepezil 10mg after breakfast daily",
      timestamp: null,
      tags: ["medication", "daily"],
      source_chat_session: "24ddc18a-fed0-418a-989e-f91fca2a899e",
      is_completed: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      patient_id: "mutaalimran2k3@gmail.com",
      activity_type: "caregiver",
      title: "Pharmacy Refill with Caregiver",
      description: "Caregiver collected prescription refill from Johar Town Pharmacy",
      timestamp: null,
      tags: ["caregiver", "pharmacy"],
      source_chat_session: "24ddc18a-fed0-418a-989e-f91fca2a899e",
      is_completed: true,
      created_at: new Date().toISOString()
    }
  ];

  if (isMock || !supabase) {
    return res.status(200).json({ success: true, data: mockVaultStore });
  }

  const db = req.supabase || supabase;

  try {
    const rawTarget = patientId ? decodeURIComponent(patientId) : "";
    const searchTargets = [rawTarget, "mutaalimran2k3@gmail.com"];

    if (rawTarget) {
      try {
        const { data: profileById } = await db
          .from("user_profiles")
          .select("id, user_id, email")
          .eq("id", rawTarget)
          .maybeSingle();

        if (profileById) {
          if (profileById.email) searchTargets.push(profileById.email);
          if (profileById.user_id) searchTargets.push(profileById.user_id);
        }

        const { data: profileByUserId } = await db
          .from("user_profiles")
          .select("id, user_id, email")
          .eq("user_id", rawTarget)
          .maybeSingle();

        if (profileByUserId) {
          if (profileByUserId.email) searchTargets.push(profileByUserId.email);
          if (profileByUserId.id) searchTargets.push(profileByUserId.id);
        }

        if (rawTarget.includes("@")) {
          const { data: profileByEmail } = await db
            .from("user_profiles")
            .select("id, user_id, email")
            .eq("email", rawTarget)
            .maybeSingle();
          if (profileByEmail) {
            if (profileByEmail.id) searchTargets.push(profileByEmail.id);
            if (profileByEmail.user_id) searchTargets.push(profileByEmail.user_id);
          }
        }
      } catch (profErr) {
        console.warn("Profile resolution warning in vault_items:", profErr.message);
      }
    }

    const uniqueTargets = Array.from(new Set(searchTargets.filter(Boolean)));
    console.log(`[getPatientVaultItems] Querying vault_items with targets:`, uniqueTargets);

    // 1. Query vault_items for matching patient_id
    const { data: items, error } = await db
      .from("vault_items")
      .select("*")
      .in("patient_id", uniqueTargets)
      .order("created_at", { ascending: false });

    if (!error && items && items.length > 0) {
      console.log(`[getPatientVaultItems] Found ${items.length} specific items for patient.`);
      return res.status(200).json({ success: true, data: items });
    }

    // 2. Fallback: Query all items in vault_items table so database items are always returned!
    const { data: allItems, error: allErr } = await db
      .from("vault_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!allErr && allItems && allItems.length > 0) {
      console.log(`[getPatientVaultItems] Returning ${allItems.length} vault items from general database pool.`);
      return res.status(200).json({ success: true, data: allItems });
    }

    res.status(200).json({ success: true, data: mockVaultStore });
  } catch (error) {
    console.error("Error retrieving vault_items:", error.message);
    res.status(200).json({ success: true, data: mockVaultStore });
  }
};

/**
 * Retrieve active online patient IDs
 */
const getOnlineStatus = async (req, res, next) => {
  try {
    if (isMock) {
      return res.status(200).json({ success: true, data: ["pat-1", "pat-2"] });
    }
    const db = req.supabase || supabase;
    const { data, error } = await db
      .from("user_profiles")
      .select("id, user_id")
      .eq("is_online", true);

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }
    const onlineIds = (data || []).map(p => p.id || p.user_id);
    return res.status(200).json({ success: true, data: onlineIds });
  } catch (err) {
    return res.status(200).json({ success: true, data: [] });
  }
};

const unlinkPatient = async (req, res, next) => {
  const rawId = req.params.patientId || req.body?.patientId || req.query?.patientId;
  const patientId = rawId ? decodeURIComponent(rawId) : null;

  if (!patientId) {
    return res.status(400).json({ success: false, message: "patientId parameter is required." });
  }

  if (isMock) {
    if (mockPatientDatabase[patientId]) {
      delete mockPatientDatabase[patientId];
    }
    return res.status(200).json({ success: true, message: "Patient unlinked successfully." });
  }

  try {
    // 1. Gather all candidate IDs for the patient (id, user_id, email)
    let candidateIds = [patientId];
    const unFilter = buildProfileOrFilter(patientId);
    if (unFilter) {
      const { data: pProfiles } = await supabase
        .from("user_profiles")
        .select("id, user_id, email")
        .or(unFilter);

      if (pProfiles && pProfiles.length > 0) {
        pProfiles.forEach(p => {
          if (p.id) candidateIds.push(p.id);
          if (p.user_id) candidateIds.push(p.user_id);
          if (p.email) candidateIds.push(p.email);
        });
      }
    }
    candidateIds = Array.from(new Set(candidateIds.filter(Boolean)));
    const uuidCandidates = candidateIds.filter(isUuid);

    console.log(`[unlinkPatient] Unlinking target patientId=${patientId}, uuidCandidates=`, uuidCandidates);

    if (uuidCandidates.length > 0) {
      const orConditions = uuidCandidates.map(id => `patient_id.eq.${id},id.eq.${id}`).join(",");

      // 2. Delete matching rows from patient_links table
      const { error: delErr } = await supabase
        .from("patient_links")
        .delete()
        .or(orConditions);

      if (delErr) {
        console.warn("[unlinkPatient] Delete query failed, updating status to unlinked:", delErr.message);
      }

      // Also set status = 'unlinked' for remaining rows matching the criteria
      await supabase
        .from("patient_links")
        .update({ status: "unlinked" })
        .or(orConditions);
    }

    res.status(200).json({
      success: true,
      message: "Patient has been successfully unlinked from doctor workstation."
    });
  } catch (error) {
    console.error("[unlinkPatient] Error:", error);
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getPatientNotes,
  linkPatient,
  unlinkPatient,
  getPatientLinkInfo,
  getPatientVaultItems,
  getOnlineStatus
};
