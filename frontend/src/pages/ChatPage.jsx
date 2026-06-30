import React from "react";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { useChat } from "../context/ChatContext";
import "../styles/chat.css";

export default function ChatPage() {
  const { activeConversation } = useChat();

  return (
    <div className="chat-layout">
      <Sidebar />
      <main className="chat-main">
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">⚡</div>
            <h2>Welcome to NexChat</h2>
            <p>Select a conversation or search for someone to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}