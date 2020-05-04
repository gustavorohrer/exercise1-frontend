import React, {useState, Fragment, useEffect, useRef} from "react";
import * as Stomp from "stompjs";
import * as SockJS from "sockjs-client";

const OperatorHome = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [ownSession, setOwnSession] = useState("");
  const [userName, setUserName] = useState(null);
  const sockJS = useRef(null);
  const client = useRef(null);

  const [colors] = useState([
    "#2196F3",
    "#32c787",
    "#00BCD4",
    "#ff5652",
    "#ffc107",
    "#ff85af",
    "#FF9800",
    "#39bbb0",
  ]);

  const callGetAllSessions = () => {
    fetch("http://localhost:9000/api/Session/getAll")
      .then((response) => response.json())
      .then(data => {
        const filtered = data.filter(session => session !== ownSession);
        setSessions(filtered);
      });
  };

  useEffect(() => {
    callGetAllSessions();
    const interval = setInterval(() => {
      callGetAllSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAvatarColor = (messageSender) => {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
      hash = 31 * hash + messageSender.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    const messageElement = document.createElement("li");

    if (message.text === "JOIN") {
      messageElement.classList.add("event-message");
      message.text = message.from + " ha ingresado al chat!";
    } else if (message.text === "LEAVE") {
      messageElement.classList.add("event-message");
      message.text = message.from + " left!";
    } else {
      messageElement.classList.add("chat-message");
      const avatarElement = document.createElement("i");
      const avatarText = document.createTextNode(message.from);
      avatarElement.appendChild(avatarText);
      avatarElement.style["background-color"] = getAvatarColor(message.from);

      messageElement.appendChild(avatarElement);

      const usernameElement = document.createElement("span");
      const usernameText = document.createTextNode(message.from);
      usernameElement.appendChild(usernameText);
      messageElement.appendChild(usernameElement);
    }

    const textElement = document.createElement("p");
    const messageText = document.createTextNode(message.text);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    document.querySelector("#messageArea").appendChild(messageElement);
    document.querySelector("#messageArea").scrollTop = document.querySelector(
      "#messageArea"
    ).scrollHeight;
  };

  const onConnected = () => {
    let sessionId = client.current.ws._transport.url;
    sessionId = sessionId.replace("ws://localhost:9000/room/", "");
    sessionId = sessionId.replace("/websocket", "");
    sessionId = sessionId.replace(/^[0-9]+\//, "");
    console.log("Your current session is: " + sessionId);
    setOwnSession(sessionId);
    client.current.subscribe(
      "/user/queue/specific-user-user" + selectedSession,
      onMessageReceived
    );
    // Send username to server
    const chatMessage = {
      from: userName,
      text: "JOIN",
    };
    client.current.send(
      "/user/queue/specific-user-user" + selectedSession,
      {},
      JSON.stringify(chatMessage)
    );
    document.querySelector(".connecting").classList.add("hidden");
  };

  const onError = () => {
    document.querySelector(".connecting").textContent =
      "Could not connect to WebSocket server. Please refresh this page to try again!";
    document.querySelector(".connecting").style.color = "red";
  };

  const selectSession = (event) => {
    event.preventDefault();
    const userName = event.currentTarget[0].value.trim();
    setUserName(userName);
    if (userName) {
      document.querySelector("#username-page").classList.add("hidden");
      document.querySelector("#select-session-page").classList.remove("hidden");
    }
  };

  const handleSelectedSession = (e) => {
    setSelectedSession(e.currentTarget.value);
  };

  const connect = (event) => {
    event.preventDefault();
    document.querySelector("#select-session-page").classList.add("hidden");
    document.querySelector("#chat-page").classList.remove("hidden");

    const sock = new SockJS("http://localhost:9000/room");
    sockJS.current = sock;
    client.current = Stomp.over(sock);

    client.current.connect({}, onConnected, onError);
  };

  const sendMessage = (event) => {
    const messageContent = document.querySelector("#message").value.trim();
    if (messageContent) {
      const chatMessage = {
        from: userName,
        text: messageContent,
      };
      client.current.send(
        "/user/queue/specific-user-user" + selectedSession,
        {},
        JSON.stringify(chatMessage)
      );
      document.querySelector("#message").value = "";
    }
    event.preventDefault();
  };

  return (
    <Fragment>
      <div id="username-page">
        <div className="username-page-container">
          <h1 className="title">Ingrese su nombre</h1>
          <form id="usernameForm" name="usernameForm" onSubmit={selectSession}>
            <div className="form-group">
              <input
                type="text"
                id="name"
                placeholder="Nombre"
                autoComplete="off"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <button type="submit" className="accent username-submit">
                Siguiente
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="select-session-page" className="hidden">
        <div className="username-page-container">
          <h1 className="title">Seleccione una sesión de chat</h1>
          <form id="usernameForm" name="usernameForm" onSubmit={connect}>
            <div className="form-group">
              <select
                id="select-session"
                value={selectedSession}
                onChange={handleSelectedSession}
                className="form-control"
              >
                <option defaultValue disabled value="">
                  Seleccione una sesión activa para comenzar el chat
                </option>
                {sessions.map((session, ind) => {
                  return (
                    <option key={ind} value={session}>
                      Id de sesión: {session}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <button type="submit" className="accent username-submit">
                Comenzar Chat
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="chat-page" className="hidden">
        <div className="chat-container">
          <div className="chat-header">
            <h2>Atención al cliente - Soporte técnico</h2>
          </div>
          <div className="connecting">Conectando...</div>
          <ul id="messageArea"></ul>
          <form id="messageForm" name="messageForm" onSubmit={sendMessage}>
            <div className="form-group">
              <div className="input-group clearfix">
                <input
                  type="text"
                  id="message"
                  placeholder="Escribe un mensaje..."
                  autoComplete="off"
                  className="form-control"
                />
                <button type="submit" className="primary">
                  Enviar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Fragment>
  );
};

export default OperatorHome;
