const { supabase, isMock } = require("../config/supabase");

// Helper to validate UUID strings for PostgreSQL queries
const isUuid = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Helper to resolve all linked patient identifiers (id, user_id, email) safely
const resolveCandidateIds = async (db, patientId) => {
  let searchTargets = [patientId];
  if (!db || !patientId) return searchTargets;

  try {
    if (isUuid(patientId)) {
      const { data: pProfiles } = await db
        .from("user_profiles")
        .select("id, user_id, email")
        .or(`id.eq.${patientId},user_id.eq.${patientId}`);

      if (pProfiles && pProfiles.length > 0) {
        for (const p of pProfiles) {
          if (p.id) searchTargets.push(p.id);
          if (p.user_id) searchTargets.push(p.user_id);
          if (p.email) searchTargets.push(p.email);
        }
      }
    } else {
      const { data: pProfiles } = await db
        .from("user_profiles")
        .select("id, user_id, email")
        .eq("email", patientId);

      if (pProfiles && pProfiles.length > 0) {
        for (const p of pProfiles) {
          if (p.id) searchTargets.push(p.id);
          if (p.user_id) searchTargets.push(p.user_id);
          if (p.email) searchTargets.push(p.email);
        }
      }
    }
  } catch (e) {
    console.warn("Error resolving candidate IDs for chat:", e.message);
  }
  return Array.from(new Set(searchTargets.filter(Boolean)));
};

// Mock conversation history log for local developers
const mockChatDatastore = {
  "pat-1": [
    { id: "msg-11", sender_id: "doc-98210", receiver_id: "pat-1", patient_id: "pat-1", content: "Hello Arthur, I noticed your spatial memory score increased this week. Good job!", created_at: "2026-07-12T10:00:00Z", read: true },
    { id: "msg-12", sender_id: "pat-1", receiver_id: "doc-98210", patient_id: "pat-1", content: "Thank you Dr. Jenkins. Puzzles are getting easier to focus on.", created_at: "2026-07-12T11:30:00Z", read: true }
  ],
  "pat-2": [
    { id: "msg-21", sender_id: "doc-98210", receiver_id: "pat-2", patient_id: "pat-2", content: "Hi Eleanor, how did you feel during the daily attention games?", created_at: "2026-07-12T09:15:00Z", read: true },
    { id: "msg-22", sender_id: "pat-2", receiver_id: "doc-98210", patient_id: "pat-2", content: "Hello Doctor, Eleanor experienced slight frustration with reaction trials, but completed the sessions.", created_at: "2026-07-12T09:40:00Z", read: true },
    { id: "msg-23", sender_id: "doc-98210", receiver_id: "pat-2", patient_id: "pat-2", content: "Understood. Advise taking regular breaks between cognitive tests. Let's monitor her speech indices.", created_at: "2026-07-12T10:15:00Z", read: true }
  ]
};

/**
 * Retrieve message logs for a patient specific conversation thread
 */
const getChatMessages = async (req, res, next) => {
  const rawId = req.params.patientId || req.query?.patientId || "pat-1";
  const patientId = decodeURIComponent(rawId);

  if (isMock) {
    const messages = mockChatDatastore[patientId] || mockChatDatastore["pat-1"] || [];
    return res.status(200).json({ success: true, data: messages });
  }

  const db = req.supabase || supabase;

  try {
    if (!db) {
      const messages = mockChatDatastore[patientId] || [];
      return res.status(200).json({ success: true, data: messages });
    }

    // Safely gather all candidate IDs for patient (id, user_id, email)
    const candidateIds = await resolveCandidateIds(db, patientId);
    const uuidTargets = candidateIds.filter(isUuid);
    const nonUuidTargets = candidateIds.filter(id => !isUuid(id));

    // Mark unread messages as read
    try {
      if (uuidTargets.length > 0) {
        await db
          .from("chat_messages")
          .update({ read: true })
          .in("patient_id", uuidTargets)
          .eq("read", false);
      }
    } catch (e) {
      console.warn("Failed to mark read:", e.message);
    }

    let messages = [];

    if (uuidTargets.length > 0) {
      const orClauses = [
        `patient_id.in.(${uuidTargets.join(",")})`,
        `sender_id.in.(${uuidTargets.join(",")})`,
        `receiver_id.in.(${uuidTargets.join(",")})`
      ];
      const { data: mainMsgs, error } = await db
        .from("chat_messages")
        .select("*")
        .or(orClauses.join(","))
        .order("created_at", { ascending: true });

      if (!error && mainMsgs) {
        messages = mainMsgs;
      } else if (error) {
        console.error("Error fetching chat messages with OR clauses:", error.message);
      }
    }

    if (nonUuidTargets.length > 0) {
      const { data: emailMsgs } = await db
        .from("chat_messages")
        .select("*")
        .in("patient_id", nonUuidTargets)
        .order("created_at", { ascending: true });

      if (emailMsgs && emailMsgs.length > 0) {
        const msgMap = new Map();
        messages.forEach(m => msgMap.set(m.id, m));
        emailMsgs.forEach(m => msgMap.set(m.id, m));
        messages = Array.from(msgMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    }

    res.status(200).json({ success: true, data: messages || [] });
  } catch (err) {
    console.warn("Exception fetching chat messages:", err.message);
    res.status(200).json({ success: true, data: [] });
  }
};

/**
 * Clear / Delete all messages in a chat thread
 */
const clearChatMessages = async (req, res, next) => {
  const rawId = req.params.patientId || req.query.patientId || req.body?.patientId || "pat-1";
  const patientId = decodeURIComponent(rawId);

  mockChatDatastore[patientId] = [];

  const db = req.supabase || supabase;
  if (!isMock && db) {
    try {
      const candidateIds = await resolveCandidateIds(db, patientId);
      const uuidTargets = candidateIds.filter(isUuid);
      const nonUuidTargets = candidateIds.filter(id => !isUuid(id));

      if (uuidTargets.length > 0) {
        const orClauses = [
          `patient_id.in.(${uuidTargets.join(",")})`,
          `sender_id.in.(${uuidTargets.join(",")})`,
          `receiver_id.in.(${uuidTargets.join(",")})`
        ];
        await db
          .from("chat_messages")
          .delete()
          .or(orClauses.join(","));
      }

      if (nonUuidTargets.length > 0) {
        await db
          .from("chat_messages")
          .delete()
          .in("patient_id", nonUuidTargets);
      }
    } catch (e) {
      console.warn("DB delete error in clearChatMessages:", e.message);
    }
  }

  res.status(200).json({ success: true, message: "Chat history cleared successfully." });
};

/**
 * Send / Append message via REST
 */
const sendMessage = async (req, res, next) => {
  const rawId = req.params.patientId || req.body?.patientId || req.body?.receiverId || "pat-1";
  const patientId = decodeURIComponent(rawId);
  const { content, type, receiverId, duration } = req.body;
  const senderId = req.user?.id || "doc-98210";

  const newMsg = {
    id: "msg-" + Date.now(),
    sender_id: senderId,
    receiver_id: receiverId || patientId,
    patient_id: patientId,
    content: content || "",
    type: type || "text",
    duration: duration || null,
    created_at: new Date().toISOString(),
    read: false
  };

  if (!mockChatDatastore[patientId]) {
    mockChatDatastore[patientId] = [];
  }
  mockChatDatastore[patientId].push(newMsg);

  const db = req.supabase || supabase;
  if (!isMock && db) {
    try {
      await db.from("chat_messages").insert([{
        patient_id: patientId,
        sender_id: senderId,
        receiver_id: receiverId || patientId,
        content: content || "",
        type: type || "text",
        duration: duration || null,
        read: false
      }]);
    } catch (e) {
      console.warn("Failed to insert message to DB:", e.message);
    }
  }

  res.status(201).json({ success: true, data: newMsg });
};

module.exports = {
  getChatMessages,
  clearChatMessages,
  sendMessage,
  mockChatDatastore
};
