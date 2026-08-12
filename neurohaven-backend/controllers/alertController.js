const { supabase, isMock } = require("../config/supabase");

// Mock clinical alerts list
const mockAlerts = [
  {
    id: "a-101",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    type: "cognitive_decline",
    severity: "critical",
    message: "Cognitive performance dropped by 18% below baseline over the last 3 game sessions.",
    timestamp: "2026-07-13T09:12:00Z",
    resolved: false
  },
  {
    id: "a-102",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    type: "missed_medication",
    severity: "critical",
    message: "Missed Donepezil medication intake response alert flagged by caregiver interface.",
    timestamp: "2026-07-12T20:00:00Z",
    resolved: false
  },
  {
    id: "a-103",
    patientId: "pat-4",
    patientName: "Marianne Faith",
    type: "missed_exercise",
    severity: "warning",
    message: "Cognitive puzzles daily session omitted for 2 consecutive days.",
    timestamp: "2026-07-12T16:30:00Z",
    resolved: false
  }
];

/**
 * Retrieve unresolved warning alerts
 */
const getAlerts = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockAlerts });
  }

  try {
    const doctorId = req.user.id;

    // Fetch alerts where patient is linked to this doctor
    const { data: links, error: errLink } = await supabase
      .from("patient_links")
      .select("patient_id")
      .eq("doctor_id", doctorId)
      .eq("status", "active");

    if (errLink) throw errLink;

    if (!links || links.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const patientIds = links.map((l) => l.patient_id);

    const { data: alerts, error } = await supabase
      .from("clinical_alerts")
      .select("*")
      .in("patient_id", patientIds)
      .eq("resolved", false)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a specific clinical warning alert
 */
const resolveAlert = async (req, res, next) => {
  const { alertId } = req.params;

  if (isMock) {
    const alert = mockAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
    return res.status(200).json({ success: true, message: `Alert ${alertId} resolved.` });
  }

  try {
    const { error } = await supabase
      .from("clinical_alerts")
      .update({ resolved: true })
      .eq("id", alertId);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Alert marked as resolved." });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk resolve all active warning alerts for doctor's cohort
 */
const resolveAllAlerts = async (req, res, next) => {
  if (isMock) {
    mockAlerts.forEach((a) => {
      a.resolved = true;
    });
    return res.status(200).json({ success: true, message: "All alerts resolved.", count: mockAlerts.length });
  }

  try {
    const doctorId = req.user.id;

    // Fetch doctor's linked patient IDs
    const { data: links, error: errLink } = await supabase
      .from("patient_links")
      .select("patient_id")
      .eq("doctor_id", doctorId)
      .eq("status", "active");

    if (errLink) throw errLink;

    if (!links || links.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const patientIds = links.map((l) => l.patient_id);

    const { error, data } = await supabase
      .from("clinical_alerts")
      .update({ resolved: true })
      .in("patient_id", patientIds)
      .eq("resolved", false)
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "All alerts marked as resolved.",
      count: data ? data.length : 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  resolveAlert,
  resolveAllAlerts
};
