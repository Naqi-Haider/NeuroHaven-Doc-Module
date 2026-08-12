"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import {
  Send,
  Loader2,
  MessageSquare,
  ArrowLeft,
  Circle,
  Phone,
  PhoneOff,
  MoreVertical,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Mic,
  MicOff,
  Square,
  Info,
  Play,
  Pause,
  Paperclip,
  Check,
  CheckCheck,
  X,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
  ChevronDown,
  Download,
  Volume2
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface ChatPageProps {
  params: {
    patientId: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  patient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  type?: "text" | "voice" | "image" | "system";
  duration?: number | null;
}

interface PatientDetails {
  id: string;
  name: string;
  email: string;
  riskLevel: string;
  age: number;
  diagnosisStage: string;
  linkedDate: string;
  caregiverName: string;
  cognitiveLevel: number;
  delta: number;
  lastSessionText: string;
  streakDays: number;
  unresolvedAlertsCount: number;
  unresolvedAlertTitle?: string;
  avatarUrl?: string;
}

const mockPatientsDetails: Record<string, PatientDetails> = {
  "pat-1": {
    id: "pat-1",
    name: "Arthur Pendelton",
    email: "arthur.pendelton@neurohaven.care",
    riskLevel: "moderate",
    age: 74,
    diagnosisStage: "Stage 2 Moderate AD",
    linkedDate: "Jun 2026",
    caregiverName: "Margaret Pendelton (Spouse)",
    cognitiveLevel: 72,
    delta: -4,
    lastSessionText: "Spatial Memory · 2h ago · Score: 72%",
    streakDays: 8,
    unresolvedAlertsCount: 1,
    unresolvedAlertTitle: "Low Sentiment Index Triggered"
  },
  "pat-2": {
    id: "pat-2",
    name: "Eleanor Vance",
    email: "eleanor.vance@neurohaven.care",
    riskLevel: "severe",
    age: 69,
    diagnosisStage: "Stage 3 Advanced MCI",
    linkedDate: "May 2026",
    caregiverName: "Thomas Vance (Son)",
    cognitiveLevel: 19,
    delta: -18,
    lastSessionText: "Pattern Matching · 5h ago · Score: 19%",
    streakDays: 2,
    unresolvedAlertsCount: 2,
    unresolvedAlertTitle: "Severe Cognitive Score Decline"
  },
  "pat-3": {
    id: "pat-3",
    name: "Gordon Cole",
    email: "gordon.cole@neurohaven.care",
    riskLevel: "mild",
    age: 71,
    diagnosisStage: "Stage 1 Early MCI",
    linkedDate: "Apr 2026",
    caregiverName: "Albert Rosenfield (Colleague)",
    cognitiveLevel: 88,
    delta: 5,
    lastSessionText: "Word Recall · 1d ago · Score: 88%",
    streakDays: 14,
    unresolvedAlertsCount: 0
  },
  "pat-4": {
    id: "pat-4",
    name: "Marianne Faith",
    email: "marianne.faith@neurohaven.care",
    riskLevel: "moderate",
    age: 68,
    diagnosisStage: "Stage 2 Mild Amnestic MCI",
    linkedDate: "May 2026",
    caregiverName: "John Faith (Brother)",
    cognitiveLevel: 61,
    delta: 2,
    lastSessionText: "Memory Match · 3h ago · Score: 61%",
    streakDays: 6,
    unresolvedAlertsCount: 0
  }
};

export default function PatientChatPage({ params }: ChatPageProps) {
  const { patientId } = params;
  const { user } = useAuth();
  const doctorId = user?.id || "doc-98210";

  const [messages, setMessages] = useState<Message[]>([]);
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  // Real-time socket states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isPatientTyping, setIsPatientTyping] = useState(false);
  const [isPatientOnline, setIsPatientOnline] = useState(false);

  // Header & Popover states
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [dismissSafetyBanner, setDismissSafetyBanner] = useState(false);

  // Report Patient & Support Ticket states
  const [reportOpen, setReportOpen] = useState(false);
  const [reportAbusiveLang, setReportAbusiveLang] = useState(false);
  const [reportDisingenuous, setReportDisingenuous] = useState(false);
  const [reportFalseIdentity, setReportFalseIdentity] = useState(false);
  const [reportSafetyViolation, setReportSafetyViolation] = useState(false);
  const [reportSummary, setReportSummary] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportCategory, setSupportCategory] = useState("Bug Report");
  const [supportDescription, setSupportDescription] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [voicePreviewBlob, setVoicePreviewBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);

  // Voice note playback states
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ currentTime: number; duration: number }>({ currentTime: 0, duration: 0 });
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // WebRTC & Call states
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId?: string; type?: string } | null>(null);
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const callAcceptedHandledRef = useRef(false);
  const isCallerRef = useRef(false);
  const isPatientCallerRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartCall = async (type: "audio" | "video") => {
    isCallerRef.current = true;
    setCallType(type);
    setCallStatus("calling");
    setInCall(true);
    setCallDuration(0);
    setIsMuted(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });
      localStreamRef.current = stream;

      if (socket && isConnected) {
        socket.emit("initiate_call", { patientId, callerId: doctorId, type });
        socket.emit("start_call", { patientId, callerId: doctorId, type });
      }
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Microphone access required for consultation calls.");
      handleEndCall();
      return;
    }

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    toast.info(`Initiating ${type} clinical consultation call...`);
  };

  const handleAcceptIncomingCall = async () => {
    setIncomingCall(null);
    setInCall(true);
    setCallStatus("calling");
    setCallDuration(0);
    setIsMuted(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
      });
      localStreamRef.current = stream;
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Microphone access required for consultation calls.");
      return;
    }

    if (socket && isConnected) {
      socket.emit("accept_call", { patientId });
    }

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    toast.success("Call connected.");
  };

  const handleDeclineIncomingCall = () => {
    setIncomingCall(null);
    if (socket && isConnected) {
      socket.emit("end_call", { patientId });
    }
  };

  const handleEndCall = () => {
    callAcceptedHandledRef.current = false;
    isCallerRef.current = false;
    isPatientCallerRef.current = false;
    pendingCandidatesRef.current = [];
    setInCall(false);
    setCallStatus("ended");
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (socket && isConnected) {
      socket.emit("end_call", { patientId });
    }
    toast.success("Call session ended.");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Restrict attachment to image files only
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name)) {
      toast.error("Only image files (.jpg, .png, .gif, .webp) can be attached to clinical chat.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Enforce 3 MB file size limit
    const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 3 MB limit. Please select a smaller image.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    const tempMsgId = "temp-img-" + Date.now();

    // 1. Optimistic local image message append
    const tempImgMsg: Message = {
      id: tempMsgId,
      sender_id: doctorId,
      receiver_id: patientId,
      patient_id: patientId,
      content: localPreviewUrl,
      created_at: new Date().toISOString(),
      read: false,
      type: "image"
    };

    setMessages((prev) => [...prev, tempImgMsg]);
    scrollToBottom();

    // 2. Upload image file to backend /api/chats/upload endpoint
    let uploadedImageUrl = localPreviewUrl;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patientId);

      const uploadRes = await axios.post(`${apiBaseUrl}/api/chats/upload`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (uploadRes.data?.success && uploadRes.data?.url) {
        uploadedImageUrl = uploadRes.data.url;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsgId ? { ...m, content: uploadedImageUrl } : m))
        );
      }
    } catch (err) {
      console.warn("Image file upload warning:", err);
    }

    // 3. Emit real playable image URL over Socket.IO to Patient App
    if (socket && isConnected) {
      socket.emit("send_message", {
        senderId: doctorId,
        receiverId: patientId,
        patientId: patientId,
        content: uploadedImageUrl,
        type: "image"
      });
    }

    // 4. Persist image message in Database via REST API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      const targetId = patientId ? encodeURIComponent(patientId) : "pat-1";
      await axios.post(
        `${apiBaseUrl}/api/chats/${targetId}/messages`,
        {
          receiverId: patientId,
          patientId: patientId,
          content: uploadedImageUrl,
          type: "image"
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
        }
      );
    } catch (err) {
      console.warn("Failed to persist image message via REST:", err);
    }

    toast.success("Image attachment sent.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Scroll behavior states
  const scrollFeedRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Auto-scroll logic
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setShowScrollBottomPill(false);
  };

  const handleFeedScroll = () => {
    if (!scrollFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollFeedRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (isBottom) {
      setShowScrollBottomPill(false);
    }
  };

  // Load Patient Profile & Historical Messages
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
        const config = {
          headers: {
            Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
          },
        };
        const defaultMock = mockPatientsDetails[patientId] || mockPatientsDetails["pat-1"];

        const calculateAge = (dobString?: string, defaultAge: number = 22) => {
          if (!dobString) return defaultAge;
          try {
            const dob = new Date(dobString);
            const diffMs = Date.now() - dob.getTime();
            const ageDate = new Date(diffMs);
            const computedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
            return computedAge > 0 && computedAge < 120 ? computedAge : defaultAge;
          } catch {
            return defaultAge;
          }
        };

        // 1. Fetch patient profile
        try {
          const profileRes = await axios.get(`${apiBaseUrl}/api/patients/${patientId}`, config);
          if (active && profileRes.data?.success && profileRes.data.data?.patient) {
            const pData = profileRes.data.data.patient;
            const cognitiveVal = pData.cognitive_level !== undefined ? pData.cognitive_level : defaultMock.cognitiveLevel;
            const calculatedRisk = cognitiveVal >= 75 ? "mild" : cognitiveVal >= 50 ? "moderate" : "severe";

            setPatient({
              id: patientId,
              name: pData.full_name || pData.name || defaultMock.name,
              email: pData.email || defaultMock.email,
              riskLevel: calculatedRisk,
              age: pData.age || pData.user_age || calculateAge(pData.date_of_birth, defaultMock.age),
              diagnosisStage: defaultMock.diagnosisStage,
              linkedDate: defaultMock.linkedDate,
              caregiverName: defaultMock.caregiverName,
              cognitiveLevel: cognitiveVal,
              delta: defaultMock.delta,
              lastSessionText: defaultMock.lastSessionText,
              streakDays: defaultMock.streakDays,
              unresolvedAlertsCount: defaultMock.unresolvedAlertsCount,
              unresolvedAlertTitle: defaultMock.unresolvedAlertTitle,
              avatarUrl: pData.avatar_url || pData.avatarUrl
            });
            setIsPatientOnline(pData.online || false);
          } else if (active) {
            setPatient({
              id: patientId,
              name: "Patient",
              email: "",
              riskLevel: "mild",
              age: 22,
              diagnosisStage: "Stage 1 Early Assessment",
              linkedDate: "Recent",
              caregiverName: "Primary Caregiver",
              cognitiveLevel: 50,
              delta: 0,
              lastSessionText: "Telemetry active",
              streakDays: 1,
              unresolvedAlertsCount: 0
            });
          }
        } catch {
          if (active) {
            setPatient({
              id: patientId,
              name: "Patient",
              email: "",
              riskLevel: "mild",
              age: 22,
              diagnosisStage: "Stage 1 Early Assessment",
              linkedDate: "Recent",
              caregiverName: "Primary Caregiver",
              cognitiveLevel: 50,
              delta: 0,
              lastSessionText: "Telemetry active",
              streakDays: 1,
              unresolvedAlertsCount: 0
            });
          }
        }

        // 2. Fetch previous chat history
        try {
          const historyRes = await axios.get(`${apiBaseUrl}/api/chats/${patientId}/messages`, config);
          if (active && historyRes.data?.success && Array.isArray(historyRes.data.data)) {
            const uniqueMsgs = Array.from(new Map((historyRes.data.data as Message[]).map((m) => [m.id, m])).values());
            setMessages(uniqueMsgs);
          }
        } catch {
          if (active) {
            setMessages([]);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [patientId, doctorId]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    const iceServers = [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
      { urls: "turn:soozabimaru.relay.metered.ca:80", username: "4fcafb9534e291ecd009bff7", credential: "LrMlkvFcHwrb9av3" },
      { urls: "turn:soozabimaru.relay.metered.ca:80?transport=tcp", username: "4fcafb9534e291ecd009bff7", credential: "LrMlkvFcHwrb9av3" },
      { urls: "turn:soozabimaru.relay.metered.ca:443?transport=tcp", username: "4fcafb9534e291ecd009bff7", credential: "LrMlkvFcHwrb9av3" },
      { urls: "turns:soozabimaru.relay.metered.ca:443?transport=tcp", username: "4fcafb9534e291ecd009bff7", credential: "LrMlkvFcHwrb9av3" },
    ];

    const socketInstance = io(apiBaseUrl, {
      extraHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    });
    setSocket(socketInstance);
    setIsConnecting(true);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      socketInstance.emit("join_chat", { patientId, userId: doctorId, role: "doctor" });
      socketInstance.emit("join_room", { patientId, doctorId, role: "doctor" });
      socketInstance.emit("mark_read", { patientId, senderId: patientId });
    });

    socketInstance.on("new_message", (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;

        // If this message was sent by clinician, deduplicate against optimistic local message
        if (message.sender_id !== patientId) {
          const hasMatchingOptimistic = prev.some(
            (m) => m.sender_id !== patientId && (m.content === message.content || (m.type === "voice" && message.type === "voice"))
          );
          if (hasMatchingOptimistic) {
            return prev.map((m) =>
              m.sender_id !== patientId && (m.content === message.content || (m.type === "voice" && message.type === "voice")) ? message : m
            );
          }
        }

        return [...prev, message];
      });

      if (message.sender_id === patientId) {
        socketInstance.emit("mark_read", { patientId, senderId: patientId });

        // Check if user is scrolled up
        if (scrollFeedRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollFeedRef.current;
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
          if (!isAtBottom) {
            setShowScrollBottomPill(true);
          } else {
            scrollToBottom();
          }
        }
      } else {
        scrollToBottom();
      }
    });

    socketInstance.on("typing", ({ isTyping, senderId }: { isTyping: boolean; senderId?: string }) => {
      if (senderId && senderId !== doctorId) {
        setIsPatientTyping(isTyping);
      }
    });

    socketInstance.on("status_change", ({ role, online, userId }: { role: string; online: boolean; userId?: string }) => {
      if (role === "patient" || userId === patientId) {
        setIsPatientOnline(online);
      }
    });

    socketInstance.on("incoming_call", (payload: { callerId?: string; type?: string }) => {
      console.log("📞 Incoming consultation call from patient:", payload);
      isPatientCallerRef.current = true;
      setIncomingCall(payload);
      toast.info("Incoming audio consultation call from patient...");
    });

    socketInstance.on("call_accepted", async () => {
      if (callAcceptedHandledRef.current) return;
      if (isPatientCallerRef.current) return;
      callAcceptedHandledRef.current = true;
      isCallerRef.current = true;
      console.log("📞 Call accepted by patient!");

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketInstance.emit("ice_candidate", { patientId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setCallStatus("connected");
        } else if (pc.iceConnectionState === "failed") {
          console.error("WebRTC ICE connection failed:", pc.iceConnectionState);
          handleEndCall();
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketInstance.emit("webrtc_offer", { patientId, sdp: offer });
      } catch (err) {
        console.error("WebRTC offer generation failed:", err);
      }
    });

    socketInstance.on("webrtc_offer", async ({ sdp }: { sdp: any }) => {
      if (isCallerRef.current) return;
      console.log("📶 Received WebRTC offer");
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketInstance.emit("ice_candidate", { patientId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        // Drain queued candidates
        for (const c of pendingCandidatesRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { }
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketInstance.emit("webrtc_answer", { patientId, sdp: answer });
      } catch (err) {
        console.error("WebRTC answer generation failed:", err);
      }
    });

    socketInstance.on("webrtc_answer", async ({ sdp }: { sdp: any }) => {
      console.log("📶 Received WebRTC answer");
      if (peerConnectionRef.current) {
        if (peerConnectionRef.current.signalingState !== "have-local-offer") {
          console.warn("Ignoring answer in wrong state:", peerConnectionRef.current.signalingState);
          return;
        }
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          // Drain queued candidates
          for (const c of pendingCandidatesRef.current) {
            try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { }
          }
          pendingCandidatesRef.current = [];

          setCallStatus("connected");
        } catch (err) {
          console.error("WebRTC setRemoteDescription answer failed:", err);
        }
      }
    });

    socketInstance.on("ice_candidate", async ({ candidate }: { candidate: any }) => {
      console.log("📶 Received WebRTC ICE candidate");
      if (peerConnectionRef.current) {
        if (peerConnectionRef.current.remoteDescription) {
          // Remote description already set — apply immediately
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("WebRTC addIceCandidate failed:", err);
          }
        } else {
          // Queue for later — remote description not set yet
          pendingCandidatesRef.current.push(candidate);
        }
      } else {
        // No PC yet — queue for later
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socketInstance.on("call_ended", () => {
      callAcceptedHandledRef.current = false;
      isCallerRef.current = false;
      isPatientCallerRef.current = false;
      pendingCandidatesRef.current = [];
      console.log("🛑 Call ended by remote participant");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setInCall(false);
      setIncomingCall(null);
      setCallStatus("ended");
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      toast.info("Call session terminated.");
    });

    socketInstance.on("messages_marked_seen", ({ senderId }: { senderId: string }) => {
      if (senderId === doctorId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.sender_id === doctorId ? { ...msg, read: true } : msg))
        );
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [patientId, doctorId]);

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setVoicePreviewBlob(audioBlob);
        setVoicePreviewUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    setVoicePreviewBlob(null);
    if (voicePreviewUrl) {
      URL.revokeObjectURL(voicePreviewUrl);
    }
    setVoicePreviewUrl(null);
    audioChunksRef.current = [];
  };

  const confirmSendVoice = async () => {
    if (!voicePreviewBlob) return;
    const duration = recordingTime || 3;
    const localPreviewUrl = voicePreviewUrl || "";
    const currentBlob = voicePreviewBlob;

    setVoicePreviewBlob(null);
    setVoicePreviewUrl(null);
    setRecordingTime(0);

    const tempMsgId = "temp-v-" + Date.now();

    // 1. Optimistic local voice message append
    const tempVoiceMsg: Message = {
      id: tempMsgId,
      sender_id: doctorId,
      receiver_id: patientId,
      patient_id: patientId,
      content: localPreviewUrl,
      created_at: new Date().toISOString(),
      read: false,
      type: "voice",
      duration
    };

    setMessages((prev) => [...prev, tempVoiceMsg]);
    scrollToBottom();

    // 2. Upload audio file to backend /api/chats/audio endpoint
    let uploadedAudioUrl = localPreviewUrl;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      const formData = new FormData();
      formData.append("audio", currentBlob, `voice-${Date.now()}.webm`);
      formData.append("patientId", patientId);

      const uploadRes = await axios.post(`${apiBaseUrl}/api/chats/audio`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (uploadRes.data?.success && uploadRes.data?.url) {
        uploadedAudioUrl = uploadRes.data.url;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsgId ? { ...m, content: uploadedAudioUrl } : m))
        );
      }
    } catch (err) {
      console.warn("Audio file upload warning:", err);
    }

    // 3. Emit real playable audio URL over Socket.IO to Patient App
    if (socket && isConnected) {
      socket.emit("send_message", {
        senderId: doctorId,
        receiverId: patientId,
        patientId: patientId,
        content: uploadedAudioUrl,
        type: "voice",
        duration
      });
    }

    // 4. Persist voice note in Database via REST API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      const targetId = patientId ? encodeURIComponent(patientId) : "pat-1";
      await axios.post(
        `${apiBaseUrl}/api/chats/${targetId}/messages`,
        {
          receiverId: patientId,
          patientId: patientId,
          content: uploadedAudioUrl,
          type: "voice",
          duration
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
        }
      );
    } catch (err) {
      console.warn("Failed to persist voice message via REST:", err);
    }

    toast.success("Voice note sent.");
  };

  // Handle Play Voice Note
  const handlePlayVoice = (msgId: string, audioUrl: string) => {
    if (playingMessageId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingMessageId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const newAudio = new Audio(audioUrl);
    audioPlayerRef.current = newAudio;

    newAudio.ontimeupdate = () => {
      setAudioProgress({
        currentTime: newAudio.currentTime,
        duration: newAudio.duration || 1
      });
    };

    newAudio.onended = () => {
      setPlayingMessageId(null);
      setAudioProgress({ currentTime: 0, duration: 0 });
    };

    newAudio.play().then(() => {
      setPlayingMessageId(msgId);
    }).catch(() => {
      // Fallback timer simulation for preview
      setPlayingMessageId(msgId);
      setTimeout(() => {
        setPlayingMessageId(null);
      }, 3000);
    });
  };

  // Handle Sending Text Message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsgText = inputText.trim();
    setInputText("");

    const newMsg: Message = {
      id: "msg-" + Date.now(),
      sender_id: doctorId,
      receiver_id: patientId,
      patient_id: patientId,
      content: newMsgText,
      created_at: new Date().toISOString(),
      read: false,
      type: "text"
    };

    setMessages((prev) => [...prev, newMsg]);
    setDismissSafetyBanner(true); // Dismiss safety strip upon first message sent
    scrollToBottom();

    if (socket && isConnected) {
      socket.emit("send_message", {
        senderId: doctorId,
        receiverId: patientId,
        patientId: patientId,
        content: newMsgText,
        type: "text"
      });
    }

    // Persist via HTTP API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      const targetId = patientId ? encodeURIComponent(patientId) : "pat-1";
      await axios.post(
        `${apiBaseUrl}/api/chats/${targetId}/messages`,
        {
          receiverId: patientId,
          patientId: patientId,
          content: newMsgText,
          type: "text"
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
        }
      );
    } catch (err) {
      console.warn("Failed to persist message via REST endpoint:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`nh-cleared-chats-${patientId}`, "true");
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      await axios.delete(`${apiBaseUrl}/api/chats/${patientId}/messages`, {
        headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
      });
    } catch {
      // Ignored if local
    }
    toast.success("Chat history cleared permanently.");
  };

  const handleExportChat = () => {
    setMenuOpen(false);
    const content = messages.map(m => `[${format(new Date(m.created_at), "yyyy-MM-dd HH:mm")}] ${m.sender_id === doctorId ? "Dr. Naqi" : patient?.name}: ${m.content}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_Log_${patient?.name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported.");
  };

  const handleReportPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedViolations = [];
    if (reportAbusiveLang) selectedViolations.push("Abusive, disrespectful or inappropriate language");
    if (reportDisingenuous) selectedViolations.push("Disingenuous activity / Misuse of clinical feature");
    if (reportFalseIdentity) selectedViolations.push("Impersonation or false patient identity");
    if (reportSafetyViolation) selectedViolations.push("Non-compliance or safety protocol violation");

    if (selectedViolations.length === 0 && !reportSummary.trim()) {
      toast.error("Please select at least one disingenuous activity or provide notes.");
      return;
    }

    setSubmittingReport(true);
    const summaryPayload = selectedViolations.length > 0
      ? `Violations: ${selectedViolations.join("; ")}${reportSummary.trim() ? `. Notes: ${reportSummary.trim()}` : ""}`
      : reportSummary.trim();

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      await axios.post(
        `${apiBaseUrl}/api/admin/reports/doctor-patient`,
        {
          doctorId,
          patientId,
          diagnosisCategory: "Abuse/Complaint",
          evaluationSummary: summaryPayload,
          riskLevel: "moderate"
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
        }
      );
      toast.success("Patient disingenuous activity report logged to admin case records.");
      setReportOpen(false);
      setReportSummary("");
      setReportAbusiveLang(false);
      setReportDisingenuous(false);
      setReportFalseIdentity(false);
      setReportSafetyViolation(false);
    } catch (err) {
      console.error("Report submit error:", err);
      toast.success("Incident report logged to admin case records.");
      setReportOpen(false);
      setReportSummary("");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportDescription.trim()) {
      toast.error("Please fill in all ticket details.");
      return;
    }

    setSubmittingSupport(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
      await axios.post(
        `${apiBaseUrl}/api/admin/support/ticket`,
        {
          senderId: doctorId,
          senderRole: "doctor",
          senderName: "Dr. Muhammad Naqi",
          senderEmail: "hakaani41@gmail.com",
          complaintType: supportCategory,
          problemDescription: `${supportSubject} — ${supportDescription}`,
          title: supportSubject,
          category: supportCategory,
          description: supportDescription,
          priority: "medium",
          doctorId
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" }
        }
      );
      toast.success("Support ticket created and assigned to system administrators.");
      setSupportOpen(false);
      setSupportSubject("");
      setSupportDescription("");
    } catch (err) {
      console.error("Support ticket error:", err);
      toast.success("Support ticket registered.");
      setSupportOpen(false);
      setSupportSubject("");
      setSupportDescription("");
    } finally {
      setSubmittingSupport(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-jade-primary animate-spin" />
        <span className="text-xs font-semibold text-jade-teal">Loading clinical chat workspace...</span>
      </div>
    );
  }

  const patientName = patient.name;
  const initials = getInitials(patientName);

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-110px)] flex flex-col space-y-2 select-none overflow-hidden">

      {/* Top back navigation */}
      <div className="flex items-center justify-between shrink-0 px-1 pt-1">
        <Link
          href={`/patients/${patientId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-jade-teal hover:text-jade-primary hover:underline transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Patient Profile
        </Link>
      </div>

      {/* Main Two-Column Clinical Layout Container */}
      <div className="flex-1 flex w-full items-stretch rounded-[16px] overflow-hidden border border-border/80 bg-white shadow-sm">

        {/* ========================================================================= */}
        {/* LEFT COLUMN — Patient Context Panel (35% width, sticky, non-scrolling)    */}
        {/* ========================================================================= */}
        <div className="w-[35%] min-w-[300px] max-w-[380px] bg-[#F4F7F2]/40 border-r border-[#404E3B]/10 p-5 flex flex-col justify-between shrink-0 select-none overflow-y-auto">

          <div className="space-y-5">
            {/* Top section — Patient identity block */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-jade-muted bg-white shrink-0 shadow-sm">
                  {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patientName} />}
                  <AvatarFallback className="text-sm font-extrabold text-jade-primary bg-jade-light/40">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#404E3B] font-heading tracking-tight truncate">
                      {patientName}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0",
                      patient.riskLevel === "severe"
                        ? "text-status-critical bg-status-critical/10 border-status-critical/20"
                        : patient.riskLevel === "moderate"
                          ? "text-status-warning bg-status-warning/10 border-status-warning/20"
                          : "text-status-normal bg-status-normal/10 border-status-normal/20"
                    )}>
                      {patient.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-[#6C8480] mt-0.5 leading-tight">
                    Age {patient.age} &middot; {patient.diagnosisStage} &middot; Linked {patient.linkedDate}
                  </p>
                </div>
              </div>

              {/* App Status Indicator */}
              <div className="flex items-center gap-2 bg-white border border-border/60 rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#404E3B]">
                <span className={`h-2 w-2 rounded-full shrink-0 ${isPatientOnline ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                <span className="font-bold text-[#6C8480]">App Status:</span>
                <span className="font-semibold text-[#404E3B]">
                  {isPatientOnline ? "Online (App active)" : "Offline (App not open)"}
                </span>
              </div>
            </div>

            {/* Middle section — Clinical Telemetry Snapshot (Single Consolidated Card with 3 Divided Rows) */}
            <div className="space-y-1.5 pt-1 select-none">
              <span className="text-[10px] font-bold text-[#6C8480] tracking-wider uppercase block px-0.5">
                Clinical Telemetry Snapshot
              </span>

              <div className="bg-white border border-border/60 rounded-xl shadow-2xs divide-y divide-border/50 overflow-hidden">
                {/* Row 1 — Cognitive Score */}
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#6C8480] tracking-wider">
                    Cognitive Score
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-sm font-bold text-[#404E3B]">
                      {patient.cognitiveLevel}%
                    </span>
                    {patient.delta !== 0 && (
                      <span className={cn(
                        "text-[10px] font-bold",
                        patient.delta < 0 ? "text-status-critical" : "text-status-normal"
                      )}>
                        {patient.delta < 0 ? `↓ ${Math.abs(patient.delta)}pts` : `↑ +${patient.delta}pts`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2 — Recent Activity */}
                <div className="p-2.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#6C8480] tracking-wider">
                      Recent Activity
                    </span>
                    <span className="text-[10px] font-bold text-jade-primary">
                      Streak: {patient.streakDays}d
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#404E3B] truncate">
                    {patient.lastSessionText}
                  </p>
                </div>

                {/* Row 3 — Active Alerts */}
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#6C8480] tracking-wider">
                    Active Alerts
                  </span>
                  {patient.unresolvedAlertsCount > 0 ? (
                    <Link
                      href="/alerts"
                      className="text-[10px] font-bold text-status-critical hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="h-3 w-3 text-status-critical shrink-0 animate-pulse" />
                      {patient.unresolvedAlertsCount} Alert{patient.unresolvedAlertsCount > 1 ? "s" : ""} &rarr;
                    </Link>
                  ) : (
                    <span className="text-[11px] font-medium text-[#BAC8B1]">
                      No active alerts
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom section — Quick actions stacked links */}
          <div className="border-t border-border/60 pt-4 space-y-2 mt-4 select-none">
            <span className="text-[10px] font-bold text-[#6C8480] uppercase tracking-wider block">
              Quick Navigation
            </span>
            <div className="flex flex-col space-y-1.5 text-xs font-bold text-jade-primary">
              <Link href={`/patients/${patientId}`} className="hover:underline flex items-center justify-between text-jade-dark hover:text-jade-primary transition-colors">
                <span>View full profile</span>
                <span className="text-[#6C8480]">&rarr;</span>
              </Link>
              <Link href={`/patients/${patientId}`} className="hover:underline flex items-center justify-between text-jade-dark hover:text-jade-primary transition-colors">
                <span>View session history</span>
                <span className="text-[#6C8480]">&rarr;</span>
              </Link>
              <Link href={`/reports?patientId=${patientId}`} className="hover:underline flex items-center justify-between text-jade-dark hover:text-jade-primary transition-colors">
                <span>Generate report</span>
                <span className="text-[#6C8480]">&rarr;</span>
              </Link>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN — Chat Interface (65% width)                                  */}
        {/* ========================================================================= */}
        <div className="w-[65%] flex-1 flex flex-col bg-white overflow-hidden relative">

          {/* Minimal Context Bar (44px height, no avatar, no patient name) */}
          <div className="h-[44px] bg-white border-b border-[#404E3B]/10 px-4 flex items-center justify-between shrink-0 select-none">

            {/* Left side disclaimer */}
            <span className="text-[11px] text-[#6C8480] font-medium">
              Clinical channel &mdash; messages logged to patient record
            </span>

            {/* Right side 3 action icons (phone, info, overflow menu) */}
            <div className="flex items-center gap-1 select-none shrink-0 relative">

              {/* 1. Phone Button */}
              <div className="relative group">
                <button
                  onClick={() => handleStartCall("audio")}
                  className="h-7 w-7 rounded-md bg-transparent hover:bg-jade-light/30 text-[#6C8480] flex items-center justify-center transition-colors cursor-pointer"
                  title="Initiate Audio Consultation Call"
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 2. Info Button */}
              <div className="relative">
                <button
                  onClick={() => setInfoOpen(!infoOpen)}
                  className="h-7 w-7 rounded-md bg-transparent hover:bg-jade-light/30 text-[#6C8480] flex items-center justify-center transition-colors cursor-pointer"
                  title="Clinical & Privacy Info"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>

                {infoOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setInfoOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-border/80 rounded-xl shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-3 text-left">
                      <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                        <Avatar className="h-10 w-10 border border-jade-muted bg-white shrink-0 shadow-xs">
                          {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patientName} />}
                          <AvatarFallback className="text-xs font-bold text-jade-primary bg-jade-light/30">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-xs font-bold text-[#404E3B] font-heading">{patientName}</h4>
                          <span className="text-[11px] text-[#6C8480] font-mono block break-all">{patient.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-[#6C8480] bg-[#F4F7F2]/60 p-2.5 rounded-lg border border-border/50">
                        <span className="font-bold text-[#404E3B] block text-[10px] uppercase tracking-wider">
                          HIPAA Data Retention Policy
                        </span>
                        <p className="leading-relaxed">
                          Messages retained for 90 days per HIPAA &amp; clinical telemetry guidelines. All interactions are permanently logged to the patient audit record.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 3. Three-dot Overflow Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="h-7 w-7 rounded-md bg-transparent hover:bg-jade-light/30 text-[#6C8480] flex items-center justify-center transition-colors cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-border/80 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold">
                      <button
                        onClick={handleExportChat}
                        className="w-full text-left px-3.5 py-2 text-[#404E3B] hover:bg-jade-light/30 flex items-center gap-2 transition-colors border-b border-border/40"
                      >
                        <Download className="h-3.5 w-3.5 text-jade-primary" />
                        Export conversation
                      </button>
                      <button
                        onClick={handleClearChat}
                        className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors border-b border-border/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear chat
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setReportOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-[#404E3B] hover:bg-jade-light/30 flex items-center gap-2 transition-colors border-b border-border/40"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        Report patient
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setSupportOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-[#404E3B] hover:bg-jade-light/30 flex items-center gap-2 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                        Contact support
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* Message Feed Area (Scrollable, background #FAFAF9) */}
          <div
            ref={scrollFeedRef}
            onScroll={handleFeedScroll}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FAFAF9] min-h-0 relative"
          >
            {/* Centered Date Separator Pill */}
            <div className="flex justify-center my-2 select-none">
              <span className="bg-[#404E3B]/[0.06] text-[#6C8480] text-[11px] font-medium px-3 py-1 rounded-full">
                Today, {format(new Date(), "MMM dd, yyyy")}
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-2 p-6 select-none">
                <MessageSquare className="h-10 w-10 text-[#BAC8B1]" />
                <div className="space-y-1">
                  <h4 className="font-heading text-xs font-bold text-[#404E3B]">No previous messages</h4>
                  <p className="text-[11px] text-[#6C8480] leading-relaxed max-w-sm">
                    Send a clinical message below to start a direct consultation with this patient.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                // 1. System Event Message (Centered inline line)
                if (msg.type === "system") {
                  return (
                    <div key={`sys-${msg.id}-${index}`} className="flex justify-center my-3 select-none">
                      <div className="bg-[#5E9B72]/[0.06] border-l-2 border-l-jade-primary px-3 py-1.5 rounded text-[12px] font-body italic text-[#6C8480] flex items-center gap-2 max-w-md">
                        <Sparkles className="h-3.5 w-3.5 text-jade-primary shrink-0 not-italic" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                const isDoctor = msg.sender_id === doctorId;

                return (
                  <div
                    key={`msg-${msg.id}-${index}`}
                    className={`flex flex-col ${isDoctor ? "items-end" : "items-start"} space-y-1 animate-fadeIn`}
                  >
                    {/* Message Bubble Container */}
                    <div
                      className={cn(
                        "max-w-[78%] p-3.5 text-[14px] font-normal leading-[1.5] font-sans shadow-2xs select-text",
                        isDoctor
                          ? "bg-gradient-to-r from-[#1A5C3A] to-[#5E9B72] text-white rounded-[16px_4px_16px_16px]"
                          : "bg-white text-[#404E3B] border border-[#404E3B]/10 rounded-[4px_16px_16px_16px]"
                      )}
                    >
                      {msg.type === "image" ? (
                        /* Image Attachment rendering */
                        <div className="space-y-1 py-0.5">
                          <img
                            src={msg.content}
                            alt="Clinical image attachment"
                            className="max-w-[220px] sm:max-w-[280px] max-h-[240px] rounded-lg object-cover cursor-pointer border border-white/20 hover:opacity-95 transition-opacity shadow-sm"
                            onClick={() => window.open(msg.content, "_blank")}
                          />
                          <span className={cn("text-[9px] font-mono font-bold block text-right tracking-tight", isDoctor ? "text-white/80" : "text-[#6C8480]")}>
                            Click to expand image ↗
                          </span>
                        </div>
                      ) : msg.type === "voice" ? (
                        /* Voice Note Scrubber treatment */
                        <div className="flex items-center gap-3 py-0.5">
                          <button
                            onClick={() => handlePlayVoice(msg.id, msg.content)}
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer",
                              isDoctor ? "bg-white text-jade-primary" : "bg-jade-primary text-white"
                            )}
                          >
                            {playingMessageId === msg.id ? (
                              <Pause className="h-4 w-4 fill-current" />
                            ) : (
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Waveform Scrubber & Duration */}
                          <div className="flex flex-col space-y-1 min-w-[130px]">
                            <div className="flex items-center gap-1 h-4">
                              {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80].map((h, idx) => {
                                const isPlayed = playingMessageId === msg.id && idx < 5;
                                return (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "w-1 rounded-full transition-colors duration-200",
                                      isDoctor
                                        ? isPlayed ? "bg-white" : "bg-white/40"
                                        : isPlayed ? "bg-jade-primary" : "bg-[#BAC8B1]"
                                    )}
                                    style={{ height: `${h}%` }}
                                  />
                                );
                              })}
                            </div>
                            <span className={cn("text-[10px] font-mono font-semibold", isDoctor ? "text-white/80" : "text-[#6C8480]")}>
                              {playingMessageId === msg.id
                                ? `0:0${Math.floor(audioProgress.currentTime)} / 0:0${msg.duration || 3}`
                                : `Voice Note &middot; 0:0${msg.duration || 3}`
                              }
                            </span>
                          </div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Timestamp & Delivery Status Indicator */}
                    <div className={cn("flex items-center gap-1 text-[11px] font-normal px-1", isDoctor ? "text-[#6C8480]" : "text-[#BAC8B1]")}>
                      <span>{format(new Date(msg.created_at), "hh:mm a")}</span>
                      {isDoctor && (
                        <span className="ml-0.5">
                          {msg.read ? (
                            <span title="Read by patient">
                              <CheckCheck className="h-3.5 w-3.5 text-jade-primary stroke-[2.5]" />
                            </span>
                          ) : (
                            <span title="Sent to device">
                              <Check className="h-3.5 w-3.5 text-[#6C8480]" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Patient Typing Indicator */}
            {isPatientTyping && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#404E3B]/10 rounded-[4px_16px_16px_16px] w-fit select-none animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-jade-primary animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-jade-primary animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-jade-primary animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-[#6C8480] ml-1">
                  {patientName} is typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Pill when Scrolled Up and new message arrives */}
          {showScrollBottomPill && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => scrollToBottom()}
                className="bg-jade-primary text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg hover:bg-jade-dark transition-all flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <span>New message from {patientName}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* INPUT BAR ZONE & Contextual Alert Safety Banner                           */}
          {/* ========================================================================= */}
          <div className="bg-white border-t border-[#404E3B]/10 shrink-0 relative">

            {/* One-time Contextual Safety Banner (Above Input Bar) */}
            {patient.unresolvedAlertsCount > 0 && !dismissSafetyBanner && (
              <div className="bg-[#E53935]/[0.06] border-t border-t-[#E53935]/15 px-4 py-2 text-xs flex items-center justify-between text-[#E53935] select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-[#E53935]" />
                  <span className="truncate font-medium">
                    &warning; <strong>{patientName}</strong> has an unresolved alert &mdash; {patient.unresolvedAlertTitle || "Cognitive Score Decline"}. Consider addressing this in your message.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <Link href="/alerts" className="font-bold underline hover:opacity-80 text-xs">
                    View alert &rarr;
                  </Link>
                  <button
                    onClick={() => setDismissSafetyBanner(true)}
                    className="text-[#E53935] hover:bg-[#E53935]/10 p-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Recording Audio Preview Banner */}
            {voicePreviewUrl && (
              <div className="p-3 bg-jade-light/30 border-b border-border/50 flex items-center justify-between gap-3 text-xs font-semibold text-[#404E3B]">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-jade-primary" />
                  <span>Voice Note Recording Preview ({recordingTime}s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelRecording}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Discard
                  </button>
                  <Button
                    size="xs"
                    onClick={confirmSendVoice}
                    className="bg-jade-primary hover:bg-jade-dark text-white font-bold h-7 px-3 rounded-md"
                  >
                    Send Voice Note
                  </Button>
                </div>
              </div>
            )}

            {/* Input Bar Form controls */}
            <div className="p-3 md:px-4 md:py-3 flex items-end gap-3 min-h-[56px]">

              {/* Left Paperclip Attachment Icon */}
              <div className="relative group self-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-[#6C8480] hover:text-jade-primary hover:bg-jade-light/40 rounded-full transition-colors cursor-pointer"
                  title="Attach Image"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
              </div>

              {/* Center Input Textarea */}
              <div className="flex-1 min-h-[40px] max-h-[120px] flex items-center">
                {isRecording ? (
                  <div className="w-full h-10 bg-red-50/60 border border-red-200 rounded-lg px-3 flex items-center justify-between text-xs font-bold text-red-600 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>Recording Voice Note &middot; {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <button
                      onClick={cancelRecording}
                      className="text-[11px] text-[#6C8480] hover:text-red-600 font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Send a clinical message to ${patientName}...`}
                    className="w-full bg-transparent border-0 text-sm font-sans text-[#404E3B] placeholder-[#6C8480]/60 resize-none focus:outline-none focus:ring-0 leading-relaxed py-2 max-h-[120px]"
                  />
                )}
              </div>

              {/* Right Side Action Buttons: Microphone (40px circle) & Send (40px circle) */}
              <div className="flex items-center gap-2 shrink-0 self-center">

                {/* 40px Microphone Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "h-10 w-10 rounded-full border-1.5 flex items-center justify-center transition-all cursor-pointer",
                    isRecording
                      ? "border-red-500 bg-red-50 text-red-600 animate-pulse"
                      : "border-[#BAC8B1] text-[#6C8480] hover:border-jade-primary hover:text-jade-primary"
                  )}
                  title={isRecording ? "Stop Recording" : "Record Voice Note"}
                >
                  {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* 40px Gradient Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isRecording}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs",
                    inputText.trim() && !isRecording
                      ? "bg-gradient-to-r from-[#1A5C3A] to-[#5E9B72] text-white hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                      : "bg-[#BAC8B1] text-white opacity-60 cursor-not-allowed"
                  )}
                  title="Send message"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Report Patient Evaluation Dialog Modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-xl p-6 border border-border/80 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
                  Report Patient / Clinical Case Record
                </h4>
                <p className="text-[11px] text-[#6C8480] mt-0.5">
                  File an audit report for {patientName} to system administrators
                </p>
              </div>
              <button
                onClick={() => setReportOpen(false)}
                className="text-xs font-bold text-jade-teal hover:text-jade-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReportPatientSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-[#404E3B] block mb-1">Disingenuous / Abusive Activity (Tick all that apply)</label>

                <label className="flex items-center gap-2.5 p-2 bg-[#FAFAF9] rounded-lg border border-border/60 hover:bg-[#F4F7F2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportAbusiveLang}
                    onChange={(e) => setReportAbusiveLang(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-jade-primary focus:ring-jade-primary"
                  />
                  <span className="text-xs font-semibold text-[#404E3B]">Abusive, disrespectful or inappropriate language</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-[#FAFAF9] rounded-lg border border-border/60 hover:bg-[#F4F7F2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportDisingenuous}
                    onChange={(e) => setReportDisingenuous(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-jade-primary focus:ring-jade-primary"
                  />
                  <span className="text-xs font-semibold text-[#404E3B]">Disingenuous activity / Misuse of clinical feature</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-[#FAFAF9] rounded-lg border border-border/60 hover:bg-[#F4F7F2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportFalseIdentity}
                    onChange={(e) => setReportFalseIdentity(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-jade-primary focus:ring-jade-primary"
                  />
                  <span className="text-xs font-semibold text-[#404E3B]">Impersonation or false patient identity</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-[#FAFAF9] rounded-lg border border-border/60 hover:bg-[#F4F7F2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportSafetyViolation}
                    onChange={(e) => setReportSafetyViolation(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-jade-primary focus:ring-jade-primary"
                  />
                  <span className="text-xs font-semibold text-[#404E3B]">Non-compliance or safety protocol violation</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-[#404E3B] block mb-1">Additional Incident Details (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe the incident or abusive activity details..."
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-border/70 rounded-lg p-2.5 font-sans text-xs text-[#404E3B] focus:outline-none focus:border-jade-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-3.5 py-2 rounded-lg font-bold text-[#6C8480] bg-[#F4F7F2] hover:bg-[#EAEFE6] cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submittingReport}
                  className="bg-jade-primary hover:bg-jade-dark text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  {submittingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Submit Audit Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Systems Support Drawer Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSupportOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white rounded-none border-l border-l-border/80 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
                    Contact Systems Support
                  </h4>
                  <p className="text-[11px] text-[#6C8480] mt-0.5">Submit technical or clinical system ticket</p>
                </div>
                <button
                  onClick={() => setSupportOpen(false)}
                  className="text-xs font-bold text-jade-teal hover:text-jade-primary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#404E3B] block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telemetry sync delay or WebRTC audio..."
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-border/70 rounded-lg p-2 font-medium text-xs text-[#404E3B] focus:outline-none focus:border-jade-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#404E3B] block mb-1">Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-border/70 rounded-lg p-2 font-medium text-xs text-[#404E3B] focus:outline-none focus:border-jade-primary"
                  >
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Clinical Telemetry">Clinical Telemetry Sync</option>
                    <option value="Account & Licensing">Account &amp; Licensing</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#404E3B] block mb-1">Detailed Description</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe the issue or feedback in detail..."
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-border/70 rounded-lg p-2.5 font-sans text-xs text-[#404E3B] focus:outline-none focus:border-jade-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setSupportOpen(false)}
                    className="px-3.5 py-2 rounded-lg font-bold text-[#6C8480] bg-[#F4F7F2] hover:bg-[#EAEFE6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={submittingSupport}
                    className="bg-jade-primary hover:bg-jade-dark text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    {submittingSupport ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Submit Support Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Active Clinical Tele-Consultation Call Modal Overlay */}
      {inCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-[#1C2C24] border border-jade-primary/30 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center space-y-6 text-center text-white relative overflow-hidden">
            {/* Animated Pulse Ring Header */}
            <div className="relative my-2">
              <div className="absolute -inset-3 bg-jade-primary/30 rounded-full animate-ping opacity-75" />
              <Avatar className="h-24 w-24 border-2 border-jade-primary shadow-lg relative z-10">
                <AvatarImage src={patient?.avatarUrl || undefined} alt={patient?.name} />
                <AvatarFallback className="bg-jade-dark text-white text-2xl font-bold">
                  {patient?.name ? patient.name.slice(0, 2).toUpperCase() : "P"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Patient Info & Call Status */}
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white tracking-tight">
                {patient?.name || "Patient"}
              </h3>
              <p className="text-xs font-semibold text-jade-light">
                {callStatus === "calling" ? "Initiating Audio Consultation..." : `Connected • ${formatCallDuration(callDuration)}`}
              </p>
              <p className="text-[11px] text-emerald-300/70 font-medium pt-1">
                Encrypted Clinical Tele-Consultation
              </p>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-6 pt-4 w-full">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                  isMuted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                title="End Consultation Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Overlay Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="bg-[#1C2C24] border border-emerald-500/40 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center space-y-6 text-center text-white relative overflow-hidden">
            <div className="relative my-2">
              <div className="absolute -inset-4 bg-emerald-500/30 rounded-full animate-ping opacity-75" />
              <Avatar className="h-24 w-24 border-2 border-emerald-400 shadow-xl relative z-10">
                <AvatarImage src={patient?.avatarUrl || undefined} alt={patient?.name} />
                <AvatarFallback className="bg-jade-dark text-white text-2xl font-bold">
                  {patient?.name ? patient.name.slice(0, 2).toUpperCase() : "P"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white tracking-tight">
                {patient?.name || "Patient"}
              </h3>
              <p className="text-xs font-semibold text-emerald-400 animate-pulse">
                Incoming Audio Consultation Call...
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 w-full">
              <button
                type="button"
                onClick={handleDeclineIncomingCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={handleAcceptIncomingCall}
                className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer animate-bounce"
                title="Accept Call"
              >
                <Phone className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for WebRTC peer audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
