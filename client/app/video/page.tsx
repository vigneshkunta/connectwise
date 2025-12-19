"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API, getToken } from "@/lib/auth";

export default function VideoPage() {
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const strangerVideoRef = useRef<HTMLVideoElement>(null);
  const chatWrapperRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const typeRef = useRef<"p1" | "p2" | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const remoteSocketRef = useRef<string | null>(null);
  const incomingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API}/api/auth/video-access`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) window.location.href = "/login";
    });
  }, []);

  /* ---------------- MAIN FLOW ---------------- */
  useEffect(() => {
    let socket: Socket;

    (async () => {
      /* 1️⃣ Get user media */
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.play().catch(() => {});
      }

      /* 2️⃣ Fresh socket connection */
      socket = io(API, {
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      /* Redirect on partner disconnect */
      socket.on("disconnected", () => {
        window.location.href = "/?disconnect";
      });

      /* 3️⃣ Start matchmaking */
      socket.emit("start", (assignedType: "p1" | "p2") => {
        typeRef.current = assignedType;
      });

      /* Receive room id */
      socket.on("roomid", (id: string) => {
        roomIdRef.current = id;
      });

      /* 4️⃣ When partner found */
      socket.on("remote-socket", async (id: string) => {
        remoteSocketRef.current = id;
        createPeer(socket);

        localStreamRef.current!.getTracks().forEach((track) => {
          peerRef.current!.addTrack(track, localStreamRef.current!);
        });

        if (typeRef.current === "p1") {
          const offer = await peerRef.current!.createOffer();
          await peerRef.current!.setLocalDescription(offer);
          await waitForIceComplete(peerRef.current!);
          socket.emit("sdp:send", {
            sdp: peerRef.current!.localDescription,
          });
        }
      });

      /* SDP exchange */
      socket.on("sdp:reply", async ({ sdp }) => {
        await peerRef.current!.setRemoteDescription(sdp);

        for (const c of incomingCandidatesRef.current) {
          await peerRef.current!.addIceCandidate(c);
        }
        incomingCandidatesRef.current = [];

        if (typeRef.current === "p2") {
          const answer = await peerRef.current!.createAnswer();
          await peerRef.current!.setLocalDescription(answer);
          await waitForIceComplete(peerRef.current!);
          socket.emit("sdp:send", {
            sdp: peerRef.current!.localDescription,
          });
        }
      });

      /* ICE exchange */
      socket.on("ice:reply", async ({ candidate }) => {
        if (!candidate) return;

        if (
          peerRef.current?.remoteDescription &&
          peerRef.current.remoteDescription.type
        ) {
          await peerRef.current.addIceCandidate(candidate);
        } else {
          incomingCandidatesRef.current.push(candidate);
        }
      });

      /* Chat receive */
      socket.on("get-message", (input: string) => {
        if (!chatWrapperRef.current) return;

        const div = document.createElement("div");
        div.className = "msg";
        div.innerHTML = `<b>Stranger: </b><span>${input}</span>`;
        chatWrapperRef.current.appendChild(div);
      });
    })();

    /* FULL RESET ON UNMOUNT (HTML BEHAVIOR) */
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());

      socketRef.current = null;
      peerRef.current = null;
      localStreamRef.current = null;
      typeRef.current = null;
      roomIdRef.current = null;
      remoteSocketRef.current = null;
      incomingCandidatesRef.current = [];
    };
  }, []);

  /* ---------------- PEER CREATION ---------------- */
  function createPeer(socket: Socket) {
    if (peerRef.current) {
      peerRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;
    incomingCandidatesRef.current = [];

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice:send", {
          candidate: e.candidate,
          to: remoteSocketRef.current,
        });
      }
    };

    pc.ontrack = (e) => {
      if (strangerVideoRef.current) {
        strangerVideoRef.current.srcObject = e.streams[0];
        strangerVideoRef.current.play().catch(() => {});
      }
    };
  }

  function waitForIceComplete(pc: RTCPeerConnection) {
    return new Promise<void>((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      pc.addEventListener("icegatheringstatechange", function check() {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      });
    });
  }

  return (
    <div className="h-screen w-full bg-[#0D0A13] flex flex-col md:flex-row overflow-hidden">
      {/* LEFT: VIDEO AREA */}
      <div className="relative flex-1 bg-[#1A1523] flex items-center justify-center">
        {/* Stranger video */}
        <video
          ref={strangerVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-none md:rounded-r-2xl"
        />

        {/* Your video (overlay) */}
        <video
          ref={myVideoRef}
          autoPlay
          muted
          playsInline
          className="
      absolute bottom-6 right-6
      w-36 h-36 md:w-52 md:h-52
      object-cover
      rounded-2xl
      border-2 border-[#A78BFA]/30
      shadow-2xl shadow-black/50
      bg-[#0D0A13]
      backdrop-blur-md
    "
        />

        {/* Status overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-[#0D0A13]/60 backdrop-blur-md text-[#EDE9FE] text-xs font-medium px-4 py-2 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          Connecting…
        </div>
      </div>

      {/* RIGHT: CHAT AREA */}
      <div
        className="
    w-full md:w-[400px]
    bg-[#FDFBFF] dark:bg-[#15121C]
    border-l border-purple-100 dark:border-purple-900/20
    flex flex-col
    shadow-[-10px_0_30px_rgba(0,0,0,0.05)]
  "
      >
        {/* Chat header */}
        <div className="px-6 py-5 border-b border-purple-100 dark:border-purple-900/20 flex items-center justify-between">
          <span className="font-bold text-[#2E1065] dark:text-[#EDE9FE] tracking-tight">
            Messages
          </span>
          <div className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest">
            Secure
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatWrapperRef}
          className="
      flex-1
      overflow-y-auto
      px-6 py-4
      space-y-4
      scrollbar-thin scrollbar-thumb-purple-200 dark:scroll-bar-purple-900
    "
        />

        {/* Input */}
        <div className="p-6 bg-white dark:bg-[#1A1625] border-t border-purple-100 dark:border-purple-900/20">
          <div className="relative group">
            <input
              placeholder="Send a message..."
              className="
          w-full
          bg-[#F5F3FF] dark:bg-[#0D0A13]
          border border-purple-100 dark:border-purple-900/30
          rounded-2xl
          pl-5 pr-12 py-4
          text-sm
          text-[#2E1065] dark:text-[#EDE9FE]
          placeholder:text-purple-300 dark:placeholder:text-purple-800
          outline-none
          focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]
          transition-all
        "
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const input = e.currentTarget.value.trim();
                if (!input) return;
                if (!roomIdRef.current || !typeRef.current) return;

                socketRef.current!.emit(
                  "send-message",
                  input,
                  typeRef.current,
                  roomIdRef.current
                );

                const div = document.createElement("div");
                div.className = "flex justify-end";
                div.innerHTML = `
            <div class="inline-block bg-[#7C3AED] text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-md shadow-purple-500/10 text-sm leading-relaxed">
              ${input}
            </div>
          `;
                chatWrapperRef.current!.appendChild(div);
                chatWrapperRef.current!.scrollTop =
                  chatWrapperRef.current!.scrollHeight;

                e.currentTarget.value = "";
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 group-focus-within:text-purple-600 transition-colors">
              <svg
                xmlns="www.w3.org"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
