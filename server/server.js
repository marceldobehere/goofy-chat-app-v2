import {startServer} from './minServer.js';
import nodeCleanup from "./other/nodeCleanup.js";

startServer();

nodeCleanup(function (exitCode, signal) {
    console.log("> EXIT");
});