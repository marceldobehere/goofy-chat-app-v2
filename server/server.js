import {startServer, app} from './minServer.js';
import nodeCleanup from "./other/nodeCleanup.js";

startServer();


app.get("/", (req, res) => {
    res.send("Welcome to the Dinosaur API!");
});


nodeCleanup(function (exitCode, signal) {
    console.log("> EXIT");
});