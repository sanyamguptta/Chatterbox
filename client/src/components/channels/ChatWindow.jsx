import { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/axios';
import styles from './ChatWindow.module.scss';

export default function ChatWindow({ channel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const { joinChannel, leaveChannel, sendMessage, onMessage } = useSocket();

  // Load history + join socket room when channel changes
  useEffect(() => {
    if (!channel) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/channels/${channel.id}/messages`);
        setMessages(res.data.messages);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
    joinChannel(channel.id);

    return () => {
      leaveChannel(channel.id);
    };
  }, [channel?.id]);

  // Listen for incoming messages
  useEffect(() => {
    const cleanup = onMessage((msg) => {
      if (Number(msg.channel_id) === Number(channel?.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return cleanup;
  }, [channel?.id, onMessage]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !channel) return;
    sendMessage(channel.id, text);
    setInput('');
  };

  if (!channel) {
    return (
      <div className={styles.empty}>
        <span>👈</span>
        <p>Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className={styles.window}>
      {/* Channel header */}
      <div className={styles.header}>
        <h2 className={styles.channelName}># {channel.name}</h2>
        <p className={styles.channelDesc}>{channel.description}</p>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {loading && <p className={styles.loadingMsg}>Loading messages…</p>}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          type="text"
          className={styles.textInput}
          placeholder={`Message #${channel.name}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={1000}
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
