import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import './ChatWidget.css'; // Crearemos este archivo para los estilos

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const backendUrl = 'http://localhost:5001/api/langchain/chat'; // Asegúrate que el puerto es correcto

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Mensaje inicial del bot al abrir por primera vez
      setMessages([{ sender: 'bot', text: '¡Hola! Soy EcoAsistente. ¿En qué puedo ayudarte hoy?' }]);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const sendMessage = useCallback(async () => {
    const userMessage = inputValue.trim();
    if (!userMessage) return;

    // Log ANTES de enviar
    console.log('[ChatWidget] Enviando mensaje. Conversation ID actual:', conversationId);

    // Añadir mensaje del usuario al chat
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    // Prepara el cuerpo de la solicitud, incluyendo el conversationId si existe
    const requestBody: { message: string; conversationId?: string } = { 
      message: userMessage 
    };
    if (conversationId) {
      requestBody.conversationId = conversationId;
    }

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Intentar obtener más detalles del error si es posible
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Añadir respuesta del bot al chat
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);

      // Actualizar el conversationId con el devuelto por el backend
      if (data.conversationId) {
        console.log('[ChatWidget] Recibido/Actualizado Conversation ID desde backend:', data.conversationId);
        setConversationId(data.conversationId);
      }

    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión con el asistente.';
      setMessages(prev => [...prev, { sender: 'bot', text: `Lo siento, hubo un error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      // Enfocar input después de recibir respuesta
      inputRef.current?.focus(); 
    }
  }, [inputValue, backendUrl, conversationId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <span>EcoAsistente</span>
            <button onClick={toggleChat} className="close-button">✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} className="send-button">
              <Send />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={toggleChat} className="chat-bubble">
          💬
        </button>
      )}
    </div>
  );
};

export default ChatWidget; 