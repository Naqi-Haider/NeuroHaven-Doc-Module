const { supabase, isMock } = require("../config/supabase");

// Mock generated PDF report logs
const mockReports = [
  {
    id: "rep-1",
    patientName: "Eleanor Vance",
    riskLevel: "severe",
    period: "May 20 - Jun 20, 2026",
    generatedAt: "2026-06-20T10:30:00Z",
    averageScore: 48,
  },
  {
    id: "rep-2",
    patientName: "Arthur Pendelton",
    riskLevel: "moderate",
    period: "May 15 - Jun 15, 2026",
    generatedAt: "2026-06-15T14:15:00Z",
    averageScore: 71,
  },
  {
    id: "rep-3",
    patientName: "Gordon Cole",
    riskLevel: "mild",
    period: "Apr 01 - Apr 30, 2026",
    generatedAt: "2026-04-30T16:00:00Z",
    averageScore: 85,
  },
];

const fs = require("fs");
const path = require("path");
const localReportsFilePath = path.join(__dirname, "../data/reports.json");

const readLocalReports = () => {
  try {
    if (!fs.existsSync(path.dirname(localReportsFilePath))) {
      fs.mkdirSync(path.dirname(localReportsFilePath), { recursive: true });
    }
    if (!fs.existsSync(localReportsFilePath)) {
      fs.writeFileSync(localReportsFilePath, JSON.stringify([]));
      return [];
    }
    const raw = fs.readFileSync(localReportsFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read local reports.json:", err);
    return [];
  }
};

const writeLocalReports = (reports) => {
  try {
    if (!fs.existsSync(path.dirname(localReportsFilePath))) {
      fs.mkdirSync(path.dirname(localReportsFilePath), { recursive: true });
    }
    fs.writeFileSync(localReportsFilePath, JSON.stringify(reports, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write local reports.json:", err);
  }
};

/**
 * Retrieve list of generated PDF report portfolios
 */
const getReports = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockReports });
  }

  try {
    const doctorId = req.user.id;

    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("generated_at", { ascending: false });

    if (error) {
      console.warn("Reports database query error, falling back to local JSON cache:", error.message);
      const allLocal = readLocalReports();
      const filtered = allLocal
        .filter((r) => r.doctor_id === doctorId)
        .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));

      return res.status(200).json({
        success: true,
        data: filtered.map((r) => ({
          id: r.id,
          patientName: r.patient_name,
          riskLevel: r.risk_level,
          period: r.period,
          generatedAt: r.generated_at,
          averageScore: r.average_score
        }))
      });
    }

    res.status(200).json({
      success: true,
      data: reports.map((r) => ({
        id: r.id,
        patientName: r.patient_name,
        riskLevel: r.risk_level,
        period: r.period,
        generatedAt: r.generated_at,
        averageScore: r.average_score
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compile a new patient report portfolio
 */
const generateReport = async (req, res, next) => {
  const { patientId, periodDays } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, message: "Missing parameter: patientId" });
  }

  if (isMock) {
    // Generate a mock report based on patient ID parameters
    const mockNames = { "pat-1": "Arthur Pendelton", "pat-2": "Eleanor Vance", "pat-3": "Gordon Cole", "pat-4": "Marianne Faith" };
    const mockScores = { "pat-1": 72, "pat-2": 45, "pat-3": 88, "pat-4": 61 };
    const mockRisks = { "pat-1": "moderate", "pat-2": "severe", "pat-3": "mild", "pat-4": "moderate" };

    const name = mockNames[patientId] || "Patient Record";
    const score = mockScores[patientId] || 70;
    const risk = mockRisks[patientId] || "moderate";

    const compiledReport = {
      id: "rep-" + Math.floor(Math.random() * 10000),
      patientId,
      patientName: name,
      period: {
        from: new Date(Date.now() - (periodDays || 30) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
      metrics: {
        averageScore: score,
        totalSessions: patientId === "pat-2" ? 18 : 28,
        averageDifficulty: patientId === "pat-2" ? 3.4 : 5.8,
        reminderAdherence: patientId === "pat-2" ? 68 : 82,
        aiInteractionCount: patientId === "pat-2" ? 42 : 19,
      },
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: compiledReport });
  }

  try {
    const doctorId = req.user.id;

    // Fetch patient record
    const { data: patient, error: errPat } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", patientId)
      .single();

    if (errPat || !patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    // Fetch from exercise_scores using the user UUID (patient.user_id)
    const { data: sessions, error: errSess } = await supabase
      .from("exercise_scores")
      .select("score, level, completed")
      .eq("patient_id", patient.user_id);

    let completedSessions = [];
    if (!errSess && sessions) {
      completedSessions = sessions.filter(s => s.completed === true || s.completed === 1);
    }

    const totalSessions = completedSessions.length;
    const avgScore = totalSessions > 0 ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions) : (patient.cognitive_level || 70);
    const avgDifficulty = totalSessions > 0 ? Number((completedSessions.reduce((acc, s) => acc + (s.level || 0), 0) / totalSessions).toFixed(1)) : 4.0;

    let computedRisk = "mild";
    if (avgScore < 25) computedRisk = "severe";
    else if (avgScore < 50) computedRisk = "severe";
    else if (avgScore < 75) computedRisk = "moderate";

    const newReport = {
      id: "rep-" + Math.floor(Math.random() * 1000000000).toString(),
      doctor_id: doctorId,
      patient_id: patientId,
      patient_name: patient.full_name || patient.name || "Patient",
      risk_level: (patient.risk_level && patient.risk_level !== "unknown") ? patient.risk_level : computedRisk,
      period: `${new Date(Date.now() - (periodDays || 30) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} to ${new Date().toISOString().split("T")[0]}`,
      average_score: avgScore,
      total_sessions: totalSessions,
      average_difficulty: avgDifficulty,
      generated_at: new Date().toISOString()
    };

    let report = null;
    let errInsert = null;

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("reports")
        .insert(newReport)
        .select()
        .single();
      
      if (insertError) {
        errInsert = insertError;
      } else {
        report = inserted;
      }
    } catch (e) {
      errInsert = e;
    }

    // Local JSON cache fallback if database table insert fails
    if (errInsert) {
      console.warn("Reports database insert error, writing to local JSON cache:", errInsert.message);
      const allLocal = readLocalReports();
      allLocal.push(newReport);
      writeLocalReports(allLocal);
      report = newReport;
    }

    res.status(201).json({
      success: true,
      data: {
        id: report.id,
        patientId: report.patient_id,
        patientName: report.patient_name,
        period: {
          from: report.period.split(" to ")[0],
          to: report.period.split(" to ")[1]
        },
        metrics: {
          averageScore: report.average_score,
          totalSessions: report.total_sessions,
          averageDifficulty: report.average_difficulty,
          reminderAdherence: patient.adherence_rate || 80,
          aiInteractionCount: 15
        },
        generatedAt: report.generated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  generateReport
};
