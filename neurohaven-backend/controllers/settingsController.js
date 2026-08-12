const { supabase, isMock } = require("../config/supabase");

// Mock Settings store
let mockSettings = {
  identity: {
    name: "Dr. Sarah Jenkins",
    email: "doctor@neurohaven.com",
    specialization: "Neurology & Dementia Care",
    institution: "NeuroHaven Care Portal"
  },
  alertThresholds: {
    cognitiveDrop: 15,
    missedDays: 3,
    sentimentLimit: 40
  },
  notifications: {
    emailAlerts: true,
    weeklyReports: false
  }
};

/**
 * Retrieve clinician workstation configurations
 */
const getSettings = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockSettings });
  }

  try {
    const doctorId = req.user.id;

    const { data: doctor, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", doctorId)
      .single();

    if (error || !doctor) {
      // If doctor doc doesn't exist, return a blank template
      return res.status(200).json({
        success: true,
        data: {
          identity: {
            name: req.user.user_metadata?.full_name || "Clinician",
            email: req.user.email,
            specialization: "",
            institution: ""
          },
          alertThresholds: {
            cognitiveDrop: 15,
            missedDays: 3,
            sentimentLimit: 40
          },
          notifications: {
            emailAlerts: true,
            weeklyReports: false
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        identity: {
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization,
          institution: doctor.institution
        },
        alertThresholds: doctor.alert_thresholds || {
          cognitiveDrop: 15,
          missedDays: 3,
          sentimentLimit: 40
        },
        notifications: doctor.notifications || {
          emailAlerts: true,
          weeklyReports: false
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save clinician workstation configuration updates
 */
const updateSettings = async (req, res, next) => {
  const { name, specialization, institution, alertThresholds, notifications, password } = req.body;

  if (isMock) {
    if (name) mockSettings.identity.name = name;
    if (specialization) mockSettings.identity.specialization = specialization;
    if (institution) mockSettings.identity.institution = institution;
    if (alertThresholds) mockSettings.alertThresholds = { ...mockSettings.alertThresholds, ...alertThresholds };
    if (notifications) mockSettings.notifications = { ...mockSettings.notifications, ...notifications };

    return res.status(200).json({ success: true, message: "Settings updated successfully in mock database.", data: mockSettings });
  }

  try {
    const doctorId = req.user.id;

    if (password) {
      const { createClient } = require("@supabase/supabase-js");
      const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: req.headers.authorization } }
      });
      const { error: pwdErr } = await userSupabase.auth.updateUser({ password });
      if (pwdErr) throw pwdErr;

      // If ONLY updating password, we can return early
      if (!name && !specialization && !institution && !alertThresholds && !notifications) {
        return res.status(200).json({ success: true, message: "Password updated successfully." });
      }
    }

    // Fetch existing doctor record to merge partial updates safely
    const { data: existingDoc } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", doctorId)
      .maybeSingle();

    const updatePayload = {
      id: doctorId,
      email: req.user.email || existingDoc?.email || "doctor@neurohaven.com",
      name: name !== undefined && name !== null ? name : (existingDoc?.name || "Clinician"),
      specialization: specialization !== undefined && specialization !== null ? specialization : (existingDoc?.specialization || "Cognitive Rehabilitation"),
      institution: institution !== undefined && institution !== null ? institution : (existingDoc?.institution || "NeuroHaven Affiliate Clinic"),
      alert_thresholds: alertThresholds !== undefined && alertThresholds !== null ? alertThresholds : (existingDoc?.alert_thresholds || { cognitiveDrop: 15, missedDays: 3, sentimentLimit: 40 }),
      notifications: notifications !== undefined && notifications !== null ? notifications : (existingDoc?.notifications || { emailAlerts: true, weeklyReports: false }),
      verified: existingDoc?.verified !== undefined ? existingDoc.verified : true,
      updated_at: new Date().toISOString()
    };

    const { data: updatedDoctor, error } = await supabase
      .from("doctors")
      .upsert(updatePayload)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Workstation settings updated successfully.",
      data: {
        identity: {
          name: updatedDoctor.name,
          email: updatedDoctor.email,
          specialization: updatedDoctor.specialization,
          institution: updatedDoctor.institution
        },
        alertThresholds: updatedDoctor.alert_thresholds,
        notifications: updatedDoctor.notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
