const socketIo = require("socket.io");
const { supabase, isMock } = require("./supabase");
const { initFirebase, sendMessagePush, sendCallPush } = require("./firebase");
const { mockChatDatastore } = require("../controllers/chatController");

let io = null;

// Track online users: patientId -> Set of socket IDs
const onlinePatients = new Map();
// Track online doctors: patientId -> Set of socket IDs (doctor tracking per patient room)
const onlineDoctors = new Map();

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  console.log("✔ Socket.IO server initialized successfully.");

  initFirebase();

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join patient's dedicated isolated chat room
    const handleJoinRoom = async (data) => {
      const { patientId, userId, role, userType, doctorId, doctorName, doctorAvatar, doctorInstitution } = data;
      const targetPatientId = patientId;
      if (!targetPatientId) return;

      const roomName = `room:${targetPatientId}`;
      socket.to(roomName).emit("typing", { isTyping: false }); // Reset typing state on join
      socket.join(roomName);

      // Normalize parameters (Flutter sends role/userId, dashboard sends userType/doctorId)
      const normalizedRole = role || userType || "patient";
      const normalizedUserId = userId || doctorId || targetPatientId;
      socket.role = normalizedRole;
      socket.userId = normalizedUserId;
      socket.roomName = roomName;

      // Accept doctor info directly in join payload (dashboard may send it here)
      if (normalizedRole === "doctor") {
        if (doctorId) socket.doctorId = doctorId;
        if (doctorName) socket.doctorName = doctorName;
        if (doctorAvatar) socket.doctorAvatar = doctorAvatar;
        if (doctorInstitution) socket.doctorInstitution = doctorInstitution;
      }

      console.log(`👥 Socket ${socket.id} joined room: ${roomName} (${socket.role})`);

      // Broadcast online status to the room
      io.to(roomName).emit("status_change", { role: socket.role, userId: socket.userId, online: true });

      // Persist status to Supabase (safe try-catch)
      if (!isMock) {
        try {
          if (socket.role === "doctor") {
            await supabase
              .from("doctors")
              .update({ is_online: true, last_seen: new Date().toISOString() })
              .eq("id", socket.userId);
          } else {
            await supabase
              .from("user_profiles")
              .update({ is_online: true, last_seen: new Date().toISOString() })
              .eq("id", socket.userId);
          }
        } catch (e) {
          console.warn("Status update query failed:", e.message);
        }
      }

      // Track presence and notify room based on role
      if (socket.role === "doctor") {
        if (!onlineDoctors.has(targetPatientId)) {
          onlineDoctors.set(targetPatientId, new Set());
        }
        onlineDoctors.get(targetPatientId).add(socket.id);
        console.log(`🟢 Doctor in room ${targetPatientId} is now ONLINE (${onlineDoctors.get(targetPatientId).size} sockets)`);

        // Only emit doctor_connected if this socket hasn't already for this room
        // AND we have the doctor's name (defer if name comes later via doctor_info)
        if (!socket._hasEmittedDoctorConnected) {
          const hasName = socket.doctorName && socket.doctorName !== "Doctor";
          if (hasName) {
            socket._hasEmittedDoctorConnected = true;
            io.to(roomName).emit("doctor_connected", {
              id: socket.doctorId || socket.userId,
              name: socket.doctorName,
              avatar_url: socket.doctorAvatar || null,
              institution: socket.doctorInstitution || ""
            });
          }
        }

        // If the patient is already online, notify the (just-joined) doctor
        if (onlinePatients.has(targetPatientId) && onlinePatients.get(targetPatientId).size > 0) {
          socket.emit("patient_online", { patientId: targetPatientId });
        }
      } else {
        if (!onlinePatients.has(targetPatientId)) {
          onlinePatients.set(targetPatientId, new Set());
        }
        onlinePatients.get(targetPatientId).add(socket.id);
        console.log(`🟢 Patient ${targetPatientId} is now ONLINE (${onlinePatients.get(targetPatientId).size} sockets)`);

        io.to(roomName).emit("patient_online", { patientId: targetPatientId });
      }
    };

    socket.on("join_chat", handleJoinRoom);
    socket.on("join_room", handleJoinRoom);

    // Heartbeat — keeps last_seen fresh while connected
    socket.on("heartbeat", async ({ patientId }) => {
      if (!isMock && patientId) {
        try {
          await supabase
            .from("user_profiles")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", patientId);
        } catch (e) {
          // ignore
        }
      }
    });

    // Handle doctor status query from patient
    socket.on("get_doctor_status", ({ patientId }) => {
      const isOnline = onlineDoctors.has(patientId) && onlineDoctors.get(patientId).size > 0;
      console.log(`ℹ️ Doctor status for room ${patientId}: ${isOnline ? "ONLINE" : "OFFLINE"}`);

      // Try to find doctor info from any doctor socket in this room
      let docInfo = {};
      if (isOnline) {
        for (const socketId of onlineDoctors.get(patientId)) {
          const docSocket = io.sockets.sockets.get(socketId);
          if (docSocket) {
            docInfo = {
              doctorId: docSocket.doctorId,
              name: docSocket.doctorName,
              avatar_url: docSocket.doctorAvatar,
              institution: docSocket.doctorInstitution
            };
            break;
          }
        }
      }

      socket.emit("doctor_status", { online: isOnline, ...docInfo });
    });

    // Typing indicator — forwarded to room
    socket.on("typing", ({ patientId, isTyping, senderId }) => {
      const roomName = `room:${patientId}`;
      socket.to(roomName).emit("typing", { isTyping, senderId });
    });

    // Mark messages as read
    socket.on("mark_read", async ({ patientId, senderId }) => {
      const roomName = `room:${patientId}`;
      console.log(`👁️ Messages marked as read in room ${roomName} for sender ${senderId}`);

      if (!isMock) {
        try {
          await supabase
            .from("chat_messages")
            .update({ read: true })
            .eq("patient_id", patientId)
            .eq("sender_id", senderId)
            .eq("read", false);
        } catch (e) {
          console.error("Failed to mark read in db:", e.message);
        }
      }

      socket.to(roomName).emit("messages_marked_seen", { senderId });
    });

    // Store doctor profile when doctor authenticates via chat
    socket.on("doctor_info", ({ doctorId, name, avatar_url, institution }) => {
      socket.doctorId = doctorId;
      socket.doctorName = name;
      socket.doctorAvatar = avatar_url;
      socket.doctorInstitution = institution;

      // Deferred emit — if doctor joined room before doctor_info arrived, emit now
      if (socket.roomName && name && !socket._hasEmittedDoctorConnected) {
        socket._hasEmittedDoctorConnected = true;
        io.to(socket.roomName).emit("doctor_connected", {
          id: socket.doctorId || socket.userId,
          name: socket.doctorName,
          avatar_url: socket.doctorAvatar || null,
          institution: socket.doctorInstitution || ""
        });
      }
    });

    // Handle incoming message delivery
    socket.on("send_message", async (payload) => {
      const { senderId, receiverId, patientId, content, type, duration, audioUrl, url } = payload;
      const roomName = `room:${patientId}`;

      // For voice messages, the dashboard may send a placeholder in content and the
      // actual audio URL in a separate audioUrl/url field — prefer the real URL.
      const resolvedContent =
        type === "voice" && (!content || content === "[Voice Note]")
          ? (audioUrl || url || content)
          : content;

      console.log(`💬 Message from ${senderId} to ${receiverId} in room ${roomName} (${type || "text"}): "${resolvedContent}"`);

      let savedMessage = {
        id: "msg-" + Math.floor(Math.random() * 100000),
        sender_id: senderId,
        receiver_id: receiverId,
        patient_id: patientId,
        content: resolvedContent,
        type: type || "text",
        duration: duration || null,
        created_at: new Date().toISOString(),
        read: false
      };

      if (!mockChatDatastore[patientId]) {
        mockChatDatastore[patientId] = [];
      }
      mockChatDatastore[patientId].push(savedMessage);

      if (!isMock) {
        try {
          const { data, error } = await supabase
            .from("chat_messages")
            .insert({
              sender_id: senderId,
              receiver_id: receiverId,
              patient_id: patientId,
              content: resolvedContent,
              type: type || "text",
              duration: duration || null,
              read: false
            })
            .select()
            .single();

          if (!error && data) {
            savedMessage = data;
          } else {
            console.error("❌ Supabase message insert failed:", error ? error.message : "Unknown error");
          }
        } catch (err) {
          console.error("❌ Failed to query chat_messages Supabase table:", err.message);
        }
      }

      // Broadcast to all participants in this isolated room
      io.to(roomName).emit("new_message", savedMessage);

      // Send FCM push to patient if the message is from the doctor
      const isDoctorSender = senderId !== patientId;
      if (isDoctorSender && patientId) {
        const senderName = socket.doctorName || "Doctor";
        sendMessagePush({
          patientId,
          senderName,
          body: type === "voice" ? "Voice message" : (resolvedContent || "New message"),
          messageId: savedMessage.id,
          type: type || "text",
        }).catch(() => {});
      }
    });

    // --- WebRTC Call Signaling Listeners ---
    const handleStartCall = ({ patientId, callerId, type }) => {
      const roomName = `room:${patientId}`;
      console.log(`📞 Call initiated for room: ${roomName} (${type || "audio"}) by ${callerId || socket.id}`);
      socket.to(roomName).emit("incoming_call", { room: roomName, callerId: callerId || socket.id, type: type || "audio" });

      const callerName = socket.doctorName || "Doctor";
      const cId = socket.doctorId || socket.id;
      sendCallPush({ patientId, callerName, callerId: cId }).catch(() => {});
    };

    socket.on("initiate_call", handleStartCall);

    socket.on("accept_call", ({ patientId }) => {
      const roomName = `room:${patientId}`;
      console.log(`📞 Call accepted in room: ${roomName}`);
      io.to(roomName).emit("call_accepted");
    });

    socket.on("webrtc_offer", ({ patientId, sdp }) => {
      const roomName = `room:${patientId}`;
      console.log(`📶 Forwarding WebRTC offer in room: ${roomName}`);
      socket.to(roomName).emit("webrtc_offer", { sdp });
    });

    socket.on("webrtc_answer", ({ patientId, sdp }) => {
      const roomName = `room:${patientId}`;
      console.log(`📶 Forwarding WebRTC answer in room: ${roomName}`);
      socket.to(roomName).emit("webrtc_answer", { sdp });
    });

    socket.on("ice_candidate", ({ patientId, candidate }) => {
      const roomName = `room:${patientId}`;
      console.log(`📶 Forwarding ICE candidate in room: ${roomName}`);
      socket.to(roomName).emit("ice_candidate", { candidate });
    });

    socket.on("end_call", ({ patientId }) => {
      const roomName = `room:${patientId}`;
      console.log(`🛑 Call ended in room: ${roomName}`);
      io.to(roomName).emit("call_ended");
    });

    socket.on("disconnect", async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Remove from patient tracking
      for (const [patientId, sockets] of onlinePatients.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlinePatients.delete(patientId);
            const offlineTimestamp = new Date().toISOString();
            console.log(`🔴 Patient ${patientId} is now OFFLINE at ${offlineTimestamp}`);

            if (!isMock) {
              try {
                await supabase
                  .from("user_profiles")
                  .update({ is_online: false, last_seen: new Date().toISOString() })
                  .eq("id", patientId);
              } catch (e) {
                // ignore
              }
            }
            io.to(`room:${patientId}`).emit("patient_offline", { patientId, lastSeen: offlineTimestamp });
          }
          break;
        }
      }

      // Remove from doctor tracking
      for (const [patientId, sockets] of onlineDoctors.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineDoctors.delete(patientId);
            const offlineTimestamp = new Date().toISOString();

            if (!isMock && socket.doctorId) {
              try {
                await supabase
                  .from("doctors")
                  .update({ is_online: false, last_seen: new Date().toISOString() })
                  .eq("id", socket.doctorId);
              } catch (e) {
                // ignore
              }
            }
            io.to(`room:${patientId}`).emit("doctor_disconnected", { patientId });
          }
          break;
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
};

// Return set of patient IDs that are currently online
const getOnlinePatientIds = () => {
  return new Set(onlinePatients.keys());
};

// Check if a specific patient is online
const isPatientOnline = (patientId) => {
  return onlinePatients.has(patientId) && onlinePatients.get(patientId).size > 0;
};

// Check if a doctor is online in a patient's room
const isDoctorOnline = (patientId) => {
  return onlineDoctors.has(patientId) && onlineDoctors.get(patientId).size > 0;
};

module.exports = {
  initSocket,
  getIo,
  getOnlinePatientIds,
  isPatientOnline,
  isDoctorOnline
};
