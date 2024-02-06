import express from "npm:express@4.18.2";
export let app = express();
import * as https from "node:https";

import {thingExists} from "./other/utils.js";


export function startServer()
{
    // If no data folder, create
    Deno.mkdir("./data", { recursive: true });

    // If no users.json, create
    if (!thingExists("./data/users.json"))
    {
        console.log("> Creating users.json");
        Deno.writeTextFileSync("./data/users.json", "[]");
    }

    let USE_HTTPS = !!(Deno.args[0] && Deno.args[0] === '-https');
    console.log(USE_HTTPS);

    if (USE_HTTPS && (!thingExists("./data/ssl/key.pem") || !thingExists("./data/ssl/cert.pem")))
    {
        console.log("SSL FOLDER DOESNT EXIST");
        console.log("> Either host the server using http (set USE_HTTPS to false) or create the ssl keys.");
        console.log();
        console.log("To create the ssl keys, open a terminal in the data folder and run the following commands:");
        console.log("mkdir ssl");
        console.log("cd ssl");
        console.log("openssl genrsa -out key.pem");
        console.log("openssl req -new -key key.pem -out csr.pem");
        console.log("openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem");
        Deno.exit(-1);
    }

    if (USE_HTTPS)
        https.createServer(
            {
                key: Deno.readTextFileSync( "./data/ssl/key.pem"),
                cert: Deno.readTextFileSync("./data/ssl/cert.pem")
            }, app).listen(443, () => {console.log(`> Listening on port 443`);});
    else
        app.listen(80, () => {console.log(`> Listening on port 80`);});
}
