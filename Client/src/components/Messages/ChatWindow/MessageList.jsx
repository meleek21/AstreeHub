import React from 'react';
import Message from './Message';
import DateSeparator from './DateSeparator';
import { format } from "date-fns";

const MessageList = ({ messages, currentUser, conversation, onEditMessage, onUnsendMessage, onSoftDeleteMessage }) => {
  let lastDate = null;
  
  // Sort messages by timestamp ascending (oldest first, newest last)
  const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return sortedMessages
    .filter(message => !message.deletedForUsers || !message.deletedForUsers.includes(currentUser.id))
    .map((message) => {
      const dateObj = new Date(message.timestamp);
      const dateStr = dateObj && !isNaN(dateObj.getTime()) ? format(dateObj, 'yyyy-MM-dd') : '';
      let showDateSeparator = false;
      
      if (dateStr !== lastDate) {
        showDateSeparator = true;
        lastDate = dateStr;
      }
      
      return (
        <React.Fragment key={message.id}>
          {showDateSeparator && <DateSeparator date={dateObj} />}
          <Message 
            message={message}
            currentUser={currentUser}
            conversation={conversation}
            onEditMessage={onEditMessage}
            onUnsendMessage={onUnsendMessage}
            onSoftDeleteMessage={onSoftDeleteMessage}
          />
        </React.Fragment>
      );
    });
};

export default MessageList;