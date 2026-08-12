const { supabase, isMock } = require("../config/supabase");

// Local fallback mock database store
const mockDoctors = [
  { id: "doc-98210", name: "Dr. Muhammad Naqi", email: "hakaani41@gmail.com", specialization: "Neurology", institution: "Quaid's institute Karachi", verified: true, account_status: "active" },
  { id: "doc-98211", name: "Dr. Sarah Jenkins", email: "jenkins@neurohaven.com", specialization: "Cognitive Rehabilitation", institution: "Affiliate Clinic", verified: true, account_status: "active" }
];

const mockTickets = [
  { id: "t-1", sender_id: "doc-98210", sender_role: "doctor", sender_name: "Dr. Sarah Jenkins", sender_email: "jenkins@neurohaven.com", complaint_type: "Bug Report", problem_description: "Voice recorder waveform overlaps typing field in Safari browser on mobile widths.", status: "open", priority: "high", created_at: new Date().toISOString() },
  { id: "t-2", sender_id: "pat-1", sender_role: "patient", sender_name: "Arthur Dent", sender_email: "dent@caregiver.com", complaint_type: "Account Issue", problem_description: "Caregiver verification link is expired, please trigger a refresh token validation email.", status: "in_progress", priority: "medium", created_at: new Date().toISOString() }
];

const mockReviews = [
  { id: "rev-1", patient_id: "pat-1", doctor_id: "doc-98210", rating: 5, feedback_text: "Dr. Jenkins is highly cooperative and adjusts cognitive session durations according to fatigue indexes.", complaint_logged: false, created_at: new Date().toISOString() }
];

/**
 * Admin authentication
 */
const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (isMock) {
    if (email === "naqi073@gmail.com" && password === "admin123") {
      return res.status(200).json({
        success: true,
        token: "mock-admin-token-xyz",
        user: { name: "Admin", email: "naqi073@gmail.com", is_super_admin: true }
      });
    }
    return res.status(401).json({ success: false, message: "Invalid admin credentials." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { data: adminRecord, error: adminErr } = await supabase
      .from("system_admins")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (adminErr || !adminRecord) {
      return res.status(403).json({ success: false, message: "Access denied. Administrator privileges required." });
    }

    res.status(200).json({
      success: true,
      token: data.session.access_token,
      user: { name: adminRecord.name, email: adminRecord.email, is_super_admin: adminRecord.is_super_admin }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * verifyAdminToken check middleware
 */
const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isMock) {
      req.admin = { name: "Admin", email: "naqi073@gmail.com", is_super_admin: true };
      return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized. Missing authorization token." });
  }

  const token = authHeader.split(" ")[1];
  if (isMock && token === "mock-admin-token-xyz") {
    req.admin = { name: "Admin", email: "naqi073@gmail.com", is_super_admin: true };
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: "Unauthorized session." });
    }

    const { data: adminRecord } = await supabase
      .from("system_admins")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (!adminRecord) {
      return res.status(403).json({ success: false, message: "Forbidden. Access denied." });
    }

    req.admin = adminRecord;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Unauthorized token evaluation." });
  }
};

/**
 * Overview statistics cards aggregation
 */
const getOverviewStats = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({
      success: true,
      data: {
        patientsCount: 12,
        doctorsCount: 4,
        activeLinksCount: 9,
        openTicketsCount: mockTickets.filter(t => t.status === "open").length,
        resolvedTicketsCount: mockTickets.filter(t => t.status === "resolved").length
      }
    });
  }

  try {
    const { count: docs } = await supabase.from("doctors").select("*", { count: "exact", head: true });
    const { count: patients } = await supabase.from("user_profiles").select("*", { count: "exact", head: true });
    
    let links = 0;
    const { count: c1, error: le1 } = await supabase.from("patient_links").select("*", { count: "exact", head: true }).eq("status", "active");
    if (!le1) {
      links = c1;
    } else {
      const { count: c2, error: le2 } = await supabase.from("patients_links").select("*", { count: "exact", head: true }).eq("status", "active");
      if (!le2) links = c2;
    }

    const { count: openTickets } = await supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open");
    const { count: resolvedTickets } = await supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved");

    res.status(200).json({
      success: true,
      data: {
        patientsCount: patients || 0,
        doctorsCount: docs || 0,
        activeLinksCount: links || 0,
        openTicketsCount: openTickets || 0,
        resolvedTicketsCount: resolvedTickets || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Searchable Patient Directory
 */
const getPatients = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({
      success: true,
      data: [
        { id: "pat-1", user_id: "pat-1", full_name: "Arthur Dent", email: "dent@caregiver.com", cognitive_level: 65, completed_initial_test: true, account_status: "active" },
        { id: "pat-2", user_id: "pat-2", full_name: "Eleanor Vance", email: "vance@caregiver.com", cognitive_level: 48, completed_initial_test: true, account_status: "blocked" }
      ]
    });
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * Searchable Doctor Directory
 */
const getDoctors = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({
      success: true,
      data: mockDoctors
    });
  }

  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Ensure doctors default to verified unless explicitly set otherwise
    const mappedDoctors = (data || []).map(d => ({
      ...d,
      verified: (d.verified !== undefined && d.verified !== null) ? d.verified : true
    }));

    res.status(200).json({ success: true, data: mappedDoctors });
  } catch (err) {
    next(err);
  }
};

/**
 * Manage / Toggle Block user account status & verification
 */
const updateUserStatus = async (req, res, next) => {
  const { userId } = req.params;
  const { account_status, verified, role } = req.body;

  if (isMock) {
    if (role === "doctor") {
      const doc = mockDoctors.find(d => d.id === userId || d.email === userId);
      if (doc) {
        if (account_status !== undefined) doc.account_status = account_status;
        if (verified !== undefined) doc.verified = verified;
      }
    }
    return res.status(200).json({ success: true, message: `Account updated successfully.` });
  }

  try {
    const table = role === "doctor" ? "doctors" : "user_profiles";
    const updatePayload = {};
    if (account_status !== undefined) updatePayload.account_status = account_status;
    if (verified !== undefined) updatePayload.verified = verified;

    let resUpdate = await supabase.from(table).update(updatePayload).eq("id", userId).select();
    if (!resUpdate.data || resUpdate.data.length === 0) {
      resUpdate = await supabase.from(table).update(updatePayload).eq("user_id", userId).select();
    }
    if (!resUpdate.data || resUpdate.data.length === 0) {
      resUpdate = await supabase.from(table).update(updatePayload).eq("email", userId).select();
    }

    if (resUpdate.error) throw resUpdate.error;
    res.status(200).json({ success: true, message: "User status updated successfully.", data: resUpdate.data });
  } catch (err) {
    next(err);
  }
};

/**
 * Linked map audit mapping
 */
const getLinksMap = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({
      success: true,
      data: [
        { id: "link-1", patient_id: "pat-1", doctor_id: "doc-98210", status: "active", created_at: new Date().toISOString() }
      ]
    });
  }

  try {
    let links = [];
    let errLinks = null;

    // Defensive query chain supporting both patient_links and patients_links, with or without linked_at
    const tryQuery = async (tableName) => {
      // Try ordering by linked_at
      let res = await supabase.from(tableName).select("*").order("linked_at", { ascending: false });
      if (!res.error) return res.data;

      // Try ordering by created_at
      res = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
      if (!res.error) return res.data;

      // Try without ordering
      res = await supabase.from(tableName).select("*");
      if (!res.error) return res.data;

      throw res.error;
    };

    try {
      links = await tryQuery("patient_links");
    } catch (e1) {
      try {
        links = await tryQuery("patients_links");
      } catch (e2) {
        errLinks = e1 || e2;
      }
    }

    if (errLinks) throw errLinks;

    // Fetch user profiles and doctors to resolve names in memory
    const { data: profiles } = await supabase.from("user_profiles").select("id, full_name, email");
    const { data: doctors } = await supabase.from("doctors").select("id, name, email");

    const profileMap = {};
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p;
      });
    }

    const doctorMap = {};
    if (doctors) {
      doctors.forEach(d => {
        doctorMap[d.id] = d;
      });
    }

    const enrichedLinks = (links || []).map(link => {
      const patient = profileMap[link.patient_id] || { full_name: "Unknown", email: "N/A" };
      const doctor = doctorMap[link.doctor_id] || { name: "Unknown", email: "N/A" };
      const resolvedDate = link.linked_at || link.created_at || new Date().toISOString();
      return {
        ...link,
        created_at: resolvedDate,
        linked_at: resolvedDate,
        patient: { full_name: patient.full_name, email: patient.email },
        doctor: { name: doctor.name, email: doctor.email }
      };
    });

    res.status(200).json({ success: true, data: enrichedLinks });
  } catch (err) {
    next(err);
  }
};


const getFeedbackReviews = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockReviews });
  }

  try {
    const { data, error } = await supabase
      .from("patient_doctor_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.warn("patient_doctor_reports table not found, using mock fallback data:", err.message);
    res.status(200).json({ success: true, data: mockReviews });
  }
};

const getDoctorEvaluations = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({
      success: true,
      data: [
        { id: "eval-1", doctor_id: "doc-98210", patient_id: "pat-1", diagnosis_category: "Memory Retention", evaluation_summary: "Shows consistent response accuracy in daily cognitive recall trials.", risk_level: "mild", created_at: new Date().toISOString() }
      ]
    });
  }

  try {
    const { data, error } = await supabase
      .from("doctor_patient_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.warn("doctor_patient_reports table not found, using mock fallback data:", err.message);
    res.status(200).json({
      success: true,
      data: [
        { id: "eval-1", doctor_id: "doc-98210", patient_id: "pat-1", diagnosis_category: "Memory Retention", evaluation_summary: "Shows consistent response accuracy in daily cognitive recall trials.", risk_level: "mild", created_at: new Date().toISOString() }
      ]
    });
  }
};

/**
 * Support ticketing overview list
 */
const getTickets = async (req, res, next) => {
  if (isMock) {
    return res.status(200).json({ success: true, data: mockTickets });
  }

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    const map = new Map();
    (mockTickets || []).forEach(t => map.set(t.id, t));
    if (!error && data) {
      data.forEach(t => map.set(t.id, t));
    }

    const combined = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.status(200).json({ success: true, data: combined });
  } catch (err) {
    res.status(200).json({ success: true, data: mockTickets });
  }
};

/**
 * Update support ticket state details
 */
const updateTicketStatus = async (req, res, next) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  if (isMock) {
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (ticket) ticket.status = status;
    return res.status(200).json({ success: true, message: `Ticket status set to ${status}.` });
  }

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", ticketId)
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, message: "Ticket status updated successfully.", data });
  } catch (err) {
    next(err);
  }
};

/**
 * Public Endpoint: Create Support Desk Ticket (from clinician dashboard or patient settings)
 */
const createSupportTicket = async (req, res, next) => {
  const { 
    senderId, senderRole, senderName, senderEmail, 
    complaintType, problemDescription, priority,
    title, category, description, doctorId, patientId 
  } = req.body;

  // 1. Map complaint_type strictly to allowed check constraint values
  const rawCat = (complaintType || category || title || "").toString().toLowerCase();
  let mappedComplaintType = "General Query";
  if (rawCat.includes("bug") || rawCat.includes("tech") || rawCat.includes("error")) {
    mappedComplaintType = "Bug Report";
  } else if (rawCat.includes("account") || rawCat.includes("licens") || rawCat.includes("login")) {
    mappedComplaintType = "Account Issue";
  } else if (rawCat.includes("abuse") || rawCat.includes("complaint") || rawCat.includes("report")) {
    mappedComplaintType = "Abuse/Complaint";
  }

  // 2. Map priority strictly to ['low', 'medium', 'high']
  const rawPrio = (priority || "medium").toString().toLowerCase();
  let mappedPriority = "medium";
  if (rawPrio === "high" || rawPrio === "critical") mappedPriority = "high";
  else if (rawPrio === "low") mappedPriority = "low";

  // 3. Map sender_role strictly to ['doctor', 'patient']
  const rawRole = (senderRole || (doctorId ? "doctor" : "patient")).toString().toLowerCase();
  const mappedRole = rawRole === "doctor" ? "doctor" : "patient";

  const resolvedEmail = senderEmail || req.user?.email || "hakaani41@gmail.com";
  const resolvedName = senderName || req.user?.name || "Dr. Muhammad Naqi";
  const resolvedDesc = problemDescription || description || "No detailed description provided.";
  const fullDescription = (title && (problemDescription || description))
    ? `${title} — ${problemDescription || description}`
    : resolvedDesc;

  // === MOCK MODE: skip all DB calls (supabase is null in mock mode) ===
  if (isMock) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const mockSenderId = (senderId && uuidRegex.test(senderId)) ? senderId
      : (doctorId && uuidRegex.test(doctorId)) ? doctorId
      : "00000000-0000-0000-0000-000000000001";

    const mockTicket = {
      id: "t-" + Math.floor(Math.random() * 100000),
      sender_id: mockSenderId,
      sender_role: mappedRole,
      sender_name: resolvedName,
      sender_email: resolvedEmail,
      complaint_type: mappedComplaintType,
      problem_description: fullDescription,
      status: "open",
      priority: mappedPriority,
      created_at: new Date().toISOString()
    };
    mockTickets.unshift(mockTicket);
    return res.status(201).json({ success: true, message: "Support ticket registered successfully.", data: mockTicket });
  }

  // === SUPABASE MODE: resolve a valid sender UUID ===
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Priority: req.user.id (from JWT) > senderId body > email DB lookup > first doctor in system
  let validSenderId = req.user?.id || null;

  if (!validSenderId && senderId && uuidRegex.test(senderId)) {
    validSenderId = senderId;
  }

  if (!validSenderId || !uuidRegex.test(validSenderId)) {
    try {
      if (mappedRole === "doctor") {
        const { data: doc } = await supabase
          .from("doctors")
          .select("id, user_id")
          .eq("email", resolvedEmail)
          .maybeSingle();
        if (doc) {
          if (doc.user_id && uuidRegex.test(doc.user_id)) validSenderId = doc.user_id;
          else if (doc.id && uuidRegex.test(doc.id)) validSenderId = doc.id;
        }
      } else {
        const { data: pat } = await supabase
          .from("user_profiles")
          .select("id, user_id")
          .eq("email", resolvedEmail)
          .maybeSingle();
        if (pat) {
          if (pat.user_id && uuidRegex.test(pat.user_id)) validSenderId = pat.user_id;
          else if (pat.id && uuidRegex.test(pat.id)) validSenderId = pat.id;
        }
      }
    } catch (e) {
      console.warn("UUID resolution warning:", e.message);
    }
  }

  if (!validSenderId || !uuidRegex.test(validSenderId)) {
    try {
      const { data: anyDoc } = await supabase
        .from("doctors")
        .select("user_id, id")
        .not("user_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (anyDoc) {
        if (anyDoc.user_id && uuidRegex.test(anyDoc.user_id)) validSenderId = anyDoc.user_id;
        else if (anyDoc.id && uuidRegex.test(anyDoc.id)) validSenderId = anyDoc.id;
      }
    } catch (e) {
      console.warn("Fallback UUID resolution warning:", e.message);
    }
  }

  if (!validSenderId || !uuidRegex.test(validSenderId)) {
    console.error("❌ Cannot resolve a valid UUID for sender_id — ticket stored in memory only.");
    const fallbackTicket = {
      id: "t-" + Math.floor(Math.random() * 100000),
      sender_id: null,
      sender_role: mappedRole,
      sender_name: resolvedName,
      sender_email: resolvedEmail,
      complaint_type: mappedComplaintType,
      problem_description: fullDescription,
      status: "open",
      priority: mappedPriority,
      created_at: new Date().toISOString()
    };
    mockTickets.unshift(fallbackTicket);
    return res.status(201).json({ success: true, message: "Support ticket registered (local fallback).", data: fallbackTicket });
  }

  const ticketPayload = {
    sender_id: validSenderId,
    sender_role: mappedRole,
    sender_name: resolvedName,
    sender_email: resolvedEmail,
    complaint_type: mappedComplaintType,
    problem_description: fullDescription,
    status: "open",
    priority: mappedPriority
  };

  try {
    console.log("🔐 Inserting support ticket:", JSON.stringify(ticketPayload, null, 2));
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([ticketPayload])
      .select()
      .single();

    if (error) {
      console.error("❌ support_tickets insert error:", error.code, error.message, error.details, error.hint);
      const fallbackTicket = { id: "t-" + Math.floor(Math.random() * 100000), ...ticketPayload, created_at: new Date().toISOString() };
      mockTickets.unshift(fallbackTicket);
      return res.status(201).json({ success: true, message: "Support ticket registered (local fallback).", data: fallbackTicket });
    }

    console.log("✔ support_tickets insert succeeded:", data.id);
    mockTickets.unshift(data);
    res.status(201).json({ success: true, message: "Support ticket created successfully.", data });
  } catch (err) {
    console.error("❌ support_tickets exception:", err.message);
    const fallbackTicket = { id: "t-" + Math.floor(Math.random() * 100000), ...ticketPayload, created_at: new Date().toISOString() };
    mockTickets.unshift(fallbackTicket);
    res.status(201).json({ success: true, message: "Support ticket registered (local fallback).", data: fallbackTicket });
  }
};

const createFeedbackReview = async (req, res, next) => {
  const { patientId, doctorId, rating, feedbackText, complaintLogged } = req.body;

  if (isMock) {
    return res.status(201).json({
      success: true,
      message: "Feedback review recorded successfully.",
      data: { id: "rev-" + Math.floor(Math.random() * 1000), patient_id: patientId, doctor_id: doctorId, rating, feedback_text: feedbackText, complaint_logged: !!complaintLogged, created_at: new Date().toISOString() }
    });
  }

  try {
    const { data, error } = await supabase
      .from("patient_doctor_reports")
      .insert([
        {
          patient_id: patientId,
          doctor_id: doctorId,
          rating: parseInt(rating),
          feedback_text: feedbackText,
          complaint_logged: !!complaintLogged
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: "Feedback review registered successfully.", data });
  } catch (err) {
    next(err);
  }
};

const createDoctorEvaluation = async (req, res, next) => {
  const { doctorId, patientId, diagnosisCategory, evaluationSummary, riskLevel } = req.body;

  if (isMock) {
    return res.status(201).json({
      success: true,
      message: "Clinical evaluation report recorded successfully.",
      data: { id: "eval-" + Math.floor(Math.random() * 1000), doctor_id: doctorId, patient_id: patientId, diagnosis_category: diagnosisCategory, evaluation_summary: evaluationSummary, risk_level: riskLevel, created_at: new Date().toISOString() }
    });
  }

  try {
    const { data, error } = await supabase
      .from("doctor_patient_reports")
      .insert([
        {
          doctor_id: doctorId,
          patient_id: patientId,
          diagnosis_category: diagnosisCategory,
          evaluation_summary: evaluationSummary,
          risk_level: riskLevel
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: "Clinical evaluation report registered successfully.", data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLogin,
  verifyAdminToken,
  getOverviewStats,
  getPatients,
  getDoctors,
  getLinksMap,
  updateUserStatus,
  getFeedbackReviews,
  getDoctorEvaluations,
  getTickets,
  updateTicketStatus,
  createSupportTicket,
  createFeedbackReview,
  createDoctorEvaluation
};
