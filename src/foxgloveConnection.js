// src/foxgloveConnection.js
// Handles WebSocket connection between React app and Foxglove Bridge (ROS 2)

let socket = null;
let reconnectTimer = null;

/**
 * Connect to the Foxglove Bridge via WebSocket
 * @param {string} url - The WebSocket URL entered by the user (e.g. ws://10.75.114.230:8765 or wss://cleandbot-ros2.ngrok.io)
 * @param {function} onMessage - Callback when a new ROS message is received
 */
export function connectToFoxglove(url, onMessage) {
  if (!url) {
    console.error("❌ WebSocket URL not provided!");
    alert("Please enter your Foxglove Bridge IP or URL first!");
    return;
  }

  // If already connected, close old socket
  if (socket) {
    try {
      socket.close();
    } catch (err) {
      console.warn("⚠️ Error closing old socket:", err);
    }
  }

  console.log("🧠 Connecting to Foxglove Bridge:", url);
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ Connected to Foxglove Bridge");
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch (err) {
      console.warn("⚠️ Error parsing message:", err);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ Foxglove error:", error);
    if (socket && socket.readyState !== WebSocket.OPEN) {
      attemptReconnect(url, onMessage);
    }
  };

  socket.onclose = () => {
    console.log("🔴 Disconnected from Foxglove Bridge");
    attemptReconnect(url, onMessage);
  };
}

/**
 * Attempt automatic reconnection every 5 seconds
 */
function attemptReconnect(url, onMessage) {
  if (reconnectTimer) return; // Prevent duplicate timers
  console.log("🔄 Attempting to reconnect in 5 seconds...");
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToFoxglove(url, onMessage);
  }, 5000);
}

/**
 * Send a JSON message to ROS 2 through Foxglove Bridge
 */
export function sendToFoxglove(topic, data) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ Cannot send, socket not open.");
    return false;
  }
  const msg = JSON.stringify({ topic, data });
  socket.send(msg);
  console.log("📤 Sent message:", msg);
  return true;
}

/**
 * Disconnect cleanly from Foxglove Bridge
 */
export function disconnectFoxglove() {
  if (socket) {
    console.log("🔌 Closing Foxglove connection manually");
    socket.close();
    socket = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
