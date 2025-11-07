// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import {
  connectToFoxglove,
  sendToFoxglove,
  disconnectFoxglove,
} from "./foxgloveConnection";
const speak = (text) => {
  if ("speechSynthesis" in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  } else {
    console.warn("Speech synthesis not supported in this browser");
  }
};

const CleaningBotInterface = () => {
  // 🔌 States
  // ✅ Read from environment variable
const defaultURL = import.meta.env.VITE_FOXGLOVE_URL || "";
const [ipAddress, setIpAddress] = useState(defaultURL);
const [userURL, setUserURL] = useState("");

  
  const [isFoxgloveConnected, setIsFoxgloveConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [waterLevel, setWaterLevel] = useState(null);
  const [dustLevel, setDustLevel] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("");
  const [cleaningStatus, setCleaningStatus] = useState("idle");
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [cleanedArea, setCleanedArea] = useState(0);
  const [currentMode, setCurrentMode] = useState("auto");
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const handleConnect = () => {
  let url = userURL.trim();

  // 🧠 Auto-upgrade to wss:// if site is https
  if (window.location.protocol === "https:" && url.startsWith("ws://")) {
    url = url.replace("ws://", "wss://");
  }

  console.log("🧠 Connecting to Foxglove Bridge:", url);

  try {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("✅ Connected to Foxglove Bridge!");
      setIsFoxgloveConnected(true);
    };

    socket.onclose = () => {
      console.log("❌ Disconnected");
      setIsFoxgloveConnected(false);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      setIsFoxgloveConnected(false);
    };
  } catch (err) {
    console.error("Error creating WebSocket:", err);
  }
};

<div style={{ textAlign: "center", marginTop: 20 }}>
  <input
    type="text"
    value={userURL}
    onChange={(e) => setUserURL(e.target.value)}
    placeholder="Enter WSS or WS URL (e.g., ws://192.168.1.10:8765)"
    style={{ padding: "8px", width: "80%", borderRadius: "8px" }}
  />
  <button
    onClick={handleConnect}
    style={{ marginLeft: "10px", padding: "8px 16px", borderRadius: "8px" }}
  >
    Connect
  </button>
</div>

  // 🧠 Foxglove Bridge
  const handleFoxgloveMessage = useCallback((msg) => {
    try {
      if (msg.topic === "/battery") setBatteryLevel(msg.data.level);
      if (msg.topic === "/status") setCleaningStatus(msg.data.state);
      if (msg.topic === "/odom") {
        setCurrentRoom(msg.data.room || "Unknown");
        setCleaningProgress(msg.data.progress || 0);
        setTotalArea(msg.data.total || 0);
        setCleanedArea(msg.data.cleaned || 0);
      }
    } catch (err) {
      console.warn("Bad message:", err);
    }
  }, []);

  useEffect(() => {
    if (userURL && isFoxgloveConnected) {
      connectToFoxglove(userURL, handleFoxgloveMessage);
    }
    return () => disconnectFoxglove();
  }, [userURL, handleFoxgloveMessage, isFoxgloveConnected]);

  // 🕹️ Control Handlers
  const handleCleaningControl = (action) => {
  const ok = sendToFoxglove("/clean_control", { action });
  if (ok) {
    const voiceMsg = {
      start: "Starting cleaning process",
      pause: "Pausing cleaning",
      stop: "Stopping cleaning",
      resume: "Resuming cleaning",
    }[action] || `Executing ${action}`;
    speak(voiceMsg);
  }
};

  const handleModeSelection = (mode) => {
    setCurrentMode(mode);
    sendToFoxglove("/set_mode", { mode });
  };

  const handleManualDrive = (dir) =>
    sendToFoxglove("/cmd_vel", {
      linear: { x: dir === "forward" ? 0.2 : dir === "backward" ? -0.2 : 0 },
      angular: { z: dir === "left" ? 0.5 : dir === "right" ? -0.5 : 0 },
    });

  const getStatusColor = (v) =>
    v === null ? "#95a5a6" : v > 70 ? "#2ecc71" : v > 40 ? "#f39c12" : "#e74c3c";
  const formatValue = (v, unit = "%") => (v == null ? "--" : `${v}${unit}`);

  // ========================
  // 🖼️ MAIN RETURN
  // ========================
  return (
    <div className="container">
      <div className="app-container">
        {/* HEADER */}
        <div className="app-header glass" style={{ borderRadius: 20, padding: 20 }}>
          <div className="app-title">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-button">
              ☰
            </button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "32px",
                  background: "linear-gradient(45deg,#fff,#f1c40f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                }}
              >
                CleanD ROS 2
              </h1>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "14px",
                }}
              >
                {cleaningStatus === "idle"
                  ? "Ready to Clean"
                  : cleaningStatus === "cleaning"
                  ? "Cleaning in Progress"
                  : cleaningStatus === "paused"
                  ? "Paused"
                  : cleaningStatus}
              </p>
            </div>
            {isFoxgloveConnected && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#2ecc71",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span style={{ color: "#2ecc71", fontSize: 12 }}>Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* ========= DASHBOARD SCREEN ========= */}
        {currentScreen === "dashboard" && (
          <>
            {/* FOXGLOVE CONNECTION */}
            <div className="glass hover" style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>🧠</div>
                <h3 style={{ fontSize: 18, color: "#fff", marginBottom: 10 }}>
                  Connect to ROS 2 (Foxglove)
                </h3>

                {/* Input for IP/URL */}
                {!isFoxgloveConnected && (
                  <input
                    type="text"
                    placeholder="Enter IP or URL (e.g. ws://10.75.114.230:8765)"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    style={{
                      padding: "10px 15px",
                      borderRadius: 15,
                      width: "80%",
                      border: "none",
                      outline: "none",
                      marginBottom: 10,
                      textAlign: "center",
                    }}
                  />
                )}

                {!isFoxgloveConnected ? (
                  <button
                    onClick={() => {
                      if (!ipAddress) {
                        alert("Please enter the IP address or WebSocket URL first!");
                        return;
                      }
                      setUserURL(ipAddress);
                      setIsFoxgloveConnected(true);
                      connectToFoxglove(ipAddress, handleFoxgloveMessage);
                    }}
                    style={{
                      background: "linear-gradient(45deg,#48dbfb,#0abde3)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 25,
                      fontWeight: 600,
                    }}
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      disconnectFoxglove();
                      setIsFoxgloveConnected(false);
                      setUserURL("");
                      setIpAddress("");
                    }}
                    style={{
                      background: "linear-gradient(45deg,#e74c3c,#c0392b)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 25,
                      fontWeight: 600,
                    }}
                  >
                    Disconnect
                  </button>
                )}

                <p
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: isFoxgloveConnected ? "#2ecc71" : "#95a5a6",
                  }}
                >
                  {isFoxgloveConnected
                    ? `Connected to ${userURL} ✅`
                    : "Not Connected ❌"}
                </p>
              </div>
            </div>

            {/* STATUS CARDS */}
            <div className="status-grid">
              {[{ label: "Battery", value: batteryLevel, icon: "🔋" },
              { label: "Water", value: waterLevel, icon: "💧" },
              { label: "Dust Bin", value: dustLevel, icon: "🗑️" }].map((item, i) => (
                <div key={i} className="glass hover status-card">
                  <div className="status-icon">{item.icon}</div>
                  <div className="status-label">{item.label}</div>
                  <div className="status-value">{formatValue(item.value)}</div>
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${item.value || 0}%`,
                        height: "100%",
                        background: getStatusColor(item.value),
                        borderRadius: 3,
                        transition: "width 1s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CONTROL SECTION */}
            <div
              className="glass hover control-section"
              style={{ borderRadius: 25, textAlign: "center", marginTop: 20 }}
            >
              {cleaningStatus === "idle" && (
                <button
                  onClick={() => handleCleaningControl("start")}
                  style={{
                    background: "linear-gradient(45deg,#2ecc71,#27ae60)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 100,
                    height: 100,
                    fontSize: 32,
                    cursor: "pointer",
                  }}
                >
                  ▶️
                </button>
              )}
              {cleaningStatus === "cleaning" && (
                <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                  <button
                    onClick={() => handleCleaningControl("pause")}
                    style={{
                      background: "linear-gradient(45deg,#f39c12,#e67e22)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 20,
                    }}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    onClick={() => handleCleaningControl("stop")}
                    style={{
                      background: "linear-gradient(45deg,#e74c3c,#c0392b)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 20,
                    }}
                  >
                    ⏹️ Stop
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {currentScreen === "modes" && (
  <div className="glass hover" style={{ borderRadius: 25, padding: 40 }}>
    <h2 style={{ color: "#fff", textAlign: "center", marginBottom: 30 }}>
      Cleaning Modes
    </h2>

    {/* === MODE CARDS === */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 20,
      }}
    >
      {[
        { id: "auto", name: "Auto Clean", icon: "🧹", desc: "Full room cleaning", time: "45 min" },
        { id: "spot", name: "Spot Clean", icon: "🎯", desc: "Clean specific area", time: "5-10 min" },
        { id: "edge", name: "Edge Clean", icon: "📐", desc: "Corners & walls only", time: "20 min" },
        { id: "mopping", name: "Mopping", icon: "🧽", desc: "Wet mopping mode", time: "40 min" },
        { id: "dock", name: "Dock Station", icon: "🏠", desc: "Return & charge", time: "2-5 min" },
        { id: "manual", name: "Manual Drive", icon: "🎮", desc: "Full manual control", time: "User controlled" },
      ].map((mode) => (
        <div
          key={mode.id}
          onClick={() => handleModeSelection(mode.id)}
          className={`hover glass ${
            currentMode === mode.id ? "active-mode" : ""
          }`}
          style={{
            borderRadius: 20,
            padding: "20px 15px",
            textAlign: "center",
            cursor: "pointer",
            background:
              currentMode === mode.id
                ? "linear-gradient(45deg, #ff9ff3, #f368e0)"
                : "rgba(255, 255, 255, 0.1)",
            boxShadow:
              currentMode === mode.id
                ? "0 0 15px rgba(255, 200, 255, 0.6)"
                : "0 0 5px rgba(0,0,0,0.2)",
            transition: "0.3s ease",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>{mode.icon}</div>
          <h3 style={{ color: "#fff", marginBottom: 5 }}>{mode.name}</h3>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
            {mode.desc}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              marginTop: 8,
            }}
          >
            ⏱ {mode.time}
          </p>
        </div>
      ))}
    </div>

    {/* === SUCTION POWER === */}
    <div style={{ marginTop: 40, textAlign: "center" }}>
      <h3 style={{ color: "#fff", marginBottom: 15 }}>Suction Power</h3>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {[
          { level: "low", icon: "🍃", label: "Low" },
          { level: "medium", icon: "⚡", label: "Medium" },
          { level: "turbo", icon: "🚀", label: "Turbo" },
        ].map((s) => (
          <button
            key={s.level}
            onClick={() => sendToFoxglove("/set_suction", { level: s.level })}
            style={{
              background:
                currentMode === s.level
                  ? "linear-gradient(45deg,#74b9ff,#0984e3)"
                  : "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 15,
              padding: "10px 25px",
              fontWeight: 600,
              transition: "0.3s",
              cursor: "pointer",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>
    </div>

    {/* === MANUAL CONTROL (Only shows when Manual Drive is selected) === */}
    {currentMode === "manual" && (
      <div
        className="glass hover"
        style={{
          borderRadius: 20,
          padding: 20,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "#fff" }}>Manual Control</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,60px)",
            justifyContent: "center",
            gap: 10,
            marginTop: 10,
          }}
        >
          <div></div>
          <button onClick={() => handleManualDrive("forward")}>⬆️</button>
          <div></div>
          <button onClick={() => handleManualDrive("left")}>⬅️</button>
          <button onClick={() => handleManualDrive("stop")}>⏹️</button>
          <button onClick={() => handleManualDrive("right")}>➡️</button>
          <div></div>
          <button onClick={() => handleManualDrive("backward")}>⬇️</button>
        </div>
      </div>
    )}
  </div>
)}

        {/* ========= MAP SCREEN ========= */}
        {currentScreen === "map" && (
          <div className="glass hover" style={{ borderRadius: 25, padding: 30, textAlign: "center" }}>
            <h2 style={{ color: "#fff", marginBottom: 20 }}>Map View</h2>
            <p style={{ color: "rgba(255,255,255,0.8)" }}>
              Current Room: {currentRoom || "Unknown"} <br />
              Progress: {cleaningProgress}% <br />
              Cleaned Area: {cleanedArea} / {totalArea} m²
            </p>
            <p style={{ color: "#95a5a6", fontSize: 14 }}>
              (Map visualization coming soon — showing data from /odom)
            </p>
          </div>
        )}

        {/* ========= HISTORY SCREEN ========= */}
        {currentScreen === "history" && (
          <div className="glass hover" style={{ borderRadius: 25, padding: 30 }}>
            <h2 style={{ color: "#fff", textAlign: "center", marginBottom: 20 }}>
              Cleaning History
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
              History data will appear here once cleaning sessions are recorded.
            </p>
          </div>
        )}

        {/* ========= SIDEBAR ========= */}
        {isMenuOpen && (
          <div className="glass menu-overlay">
            <button onClick={() => setIsMenuOpen(false)} className="menu-close">
              ×
            </button>
            <div className="menu-items">
              {[{ id: "dashboard", icon: "🏠", label: "Home" },
              { id: "modes", icon: "🎮", label: "Modes" },
              { id: "map", icon: "🗺️", label: "Map" },
              { id: "history", icon: "📊", label: "History" }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentScreen(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`menu-item ${currentScreen === tab.id ? "active" : ""}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleaningBotInterface;
