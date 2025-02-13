export class ChatRoom {
  state: DurableObjectState;
  connections: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.connections = new Set();
  }

  async fetch(req: Request) {
    const url = new URL(req.url);

    if (req.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade();
    }

    if (req.method === "POST" && url.pathname === "/broadcast") {
      return this.broadcastMessage(req);
    }

    return new Response("Invalid request", { status: 400 });
  }

  handleWebSocketUpgrade() {
    const { 0: client, 1: server } = new WebSocketPair();
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(ws: WebSocket) {
    ws.accept();
    this.connections.add(ws);

    ws.addEventListener("message", (event) => {
      this.broadcast(event.data.toString());
    });

    ws.addEventListener("close", () => {
      this.connections.delete(ws);
    });
  }

  async broadcastMessage(req: Request) {
    const message = await req.json();
    this.broadcast(JSON.stringify(message));
    return new Response("Message broadcasted", { status: 200 });
  }

  broadcast(message: string) {
    for (const ws of this.connections) {
      ws.send(message);
    }
  }
}
