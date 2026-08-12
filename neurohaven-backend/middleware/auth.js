const { supabase, isMock } = require("../config/supabase");

const verifyAuthToken = async (req, res, next) => {
  // Extract token from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isMock) {
      // Dev bypass: if no token is sent, assign mock credentials automatically
      req.user = {
        id: "doc-98210",
        email: "doctor@neurohaven.com",
        name: "Dr. Sarah Jenkins"
      };
      return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized. Missing authorization header." });
  }

  const token = authHeader.split(" ")[1];

  // Dev bypass: if the token is the default fallback, automatically associate it with the active doctor account
  if (token === "mock-dev-token" || token === "dummy-jwt-token-xyz" || isMock) {
    req.user = {
      id: "d12c03f6-bb2f-47d2-90a6-a3e7e7f53e4f",
      email: "hakaani41@gmail.com",
      name: "Muhammad Naqi"
    };
    return next();
  }

  try {
    // Verify token with Supabase Client auth module
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Invalid session or token." });
    }

    // Instantiate a request-specific client forwarding the auth header so RLS checks succeed
    const { createClient } = require("@supabase/supabase-js");
    req.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    req.user = user;

    // Reject blocked accounts
    if (!isMock) {
      try {
        const { data: doc } = await supabase
          .from("doctors")
          .select("account_status")
          .eq("id", user.id)
          .maybeSingle();

        if (doc && doc.account_status === "blocked") {
          return res.status(403).json({ success: false, message: "Forbidden. Your account has been blocked by the administrator." });
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("account_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile && profile.account_status === "blocked") {
          return res.status(403).json({ success: false, message: "Forbidden. Your account has been blocked by the administrator." });
        }
      } catch (e) {
        console.warn("Could not query account blocking status (migration may be missing):", e.message);
      }
    }

    next();
  } catch (error) {
    console.error("Supabase Token verification failed:", error.message);
    res.status(401).json({ success: false, message: "Unauthorized. Invalid token." });
  }
};

module.exports = {
  verifyAuthToken,
};
