import {startServer, app, server} from './minServer.js';
import nodeCleanup from "./other/nodeCleanup.js";

startServer();

app.get("/", (req, res) => {
    res.redirect("https://marceldobehere.github.io/goofy-chat-app-v2-client/client/");
});


import {Server} from "npm:socket.io@4.7.2";
const io = new Server(server);

io.setMaxListeners(1000);

import * as socketSessionManager from "./lib/socketSessionManager.js";
import * as userInterface from "./lib/userInterface.js";
import * as messageManager from "./lib/messageManager.js";
import * as pushManager from "./lib/pushManager.js";

await userInterface.initApp();
await socketSessionManager.initApp(io, userInterface);
await pushManager.initApp(io, userInterface, socketSessionManager);
await messageManager.initApp(io, userInterface, socketSessionManager, pushManager);


nodeCleanup(function (exitCode, signal) {
    messageManager.backUpMessages();
});