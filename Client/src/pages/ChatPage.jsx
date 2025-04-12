import React, { useEffect } from 'react';
import Chat from '../components/Chat/Chat';
import '../assets/Css/Chat.css';

const ChatPage = () => {
  useEffect(() => {
    document.title = 'Chat | ASTREE';
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Messages</h1>
      <Chat />
    </div>
  );
};

export default ChatPage;