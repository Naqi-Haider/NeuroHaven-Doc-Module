const admin = require("firebase-admin");
const { supabase, isMock } = require("./supabase");

let initialized = false;

function initFirebase() {
  if (initialized) return;
  try {
    const serviceAccount = JSON.parse(
      require("fs").readFileSync(
        require("path").join(__dirname, "../service-account.json"),
        "utf8"
      )
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("✔ Firebase Admin initialized");
  } catch (err) {
    console.warn("⚠ Firebase Admin init failed (push disabled):", err.message);
  }
}

async function getFCMTokens(userId) {
  if (!initialized || isMock) return [];
  try {
    const { data, error } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId);
    if (error || !data) return [];
    return data.map((r) => r.token).filter(Boolean);
  } catch {
    return [];
  }
}

async function sendPush({ userId, title, body, data = {}, android = {} }) {
  if (!initialized) return;
  const tokens = await getFCMTokens(userId);
  if (tokens.length === 0) return;

  const message = {
    tokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: {
      priority: "high",
      ttl: 30000,
      ...android,
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`📤 Push sent to ${tokens.length} device(s): ${response.successCount} success, ${response.failureCount} failed`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/registration-token-not-registered" ||
            resp.error?.code === "messaging/invalid-registration-token")
        ) {
          invalidTokens.push(tokens[idx]);
        }
      });
      if (invalidTokens.length > 0) {
        await supabase
          .from("fcm_tokens")
          .delete()
          .in("token", invalidTokens);
      }
    }
  } catch (err) {
    console.error("Push send error:", err.message);
  }
}

async function sendMessagePush({ patientId, senderName, body, messageId, type = "text" }) {
  await sendPush({
    userId: patientId,
    title: `🩺 ${senderName}`,
    body:
      type === "voice"
        ? "🎙 Voice message"
        : type === "image"
        ? "📷 Image"
        : body,
    data: { type: "new_message", id: String(messageId), sender_name: senderName },
  });
}

async function sendCallPush({ patientId, callerName, callerId }) {
  await sendPush({
    userId: patientId,
    title: "📞 Incoming Call",
    body: `${callerName} is calling you`,
    data: { type: "incoming_call", caller_id: callerId, caller_name: callerName },
    android: { ttl: 15000 },
  });
}

module.exports = { initFirebase, sendPush, sendMessagePush, sendCallPush };
