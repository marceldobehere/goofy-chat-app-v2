import {updateUser} from "./userInterface.js";
import {thingExists, writeFileSync} from "../other/utils.js";

import * as mod from "https://jsr.io/@negrel/webpush/0.3.0/mod.ts";
import { encodeBase64Url } from "jsr:@std/encoding@0.224.0/base64url";

let io;
let userInterface;
let socketSessionManager;

let pushServer;

export async function notifyUserIfNeeded(userId) {
    // Check if user is online
    let user = await userInterface.getUser(userId);
    if (user === undefined)
        return;
    let sockets = socketSessionManager.getSocketsForUser(userId);
    if (sockets !== undefined)
        return;

    // If not, send notification to all push subscribers
    if (user["push-subcriptions"] === undefined || user["push-subcriptions"].length == 0)
        return;

    console.log(`> Sending push notification(s) to ${userId} (${user["push-subcriptions"].length} subscribers)`);
    for (let sub of user["push-subcriptions"])
    {
        console.log(" > Sending push notification to: ", sub);
        try {
            const newSub  = pushServer.subscribe(sub);
            console.log(newSub);

            let res =  await newSub.pushTextMessage(
                JSON.stringify({ title: "Hello from application server!" }),
                {},
            );
            console.log(` > Sent Push: ${res}`);
        } catch (error) {
            console.error(" > Error sending push notification: ", error);
        }
    }

    // Clear push subscribers
    user["push-subcriptions"] = [];
    await updateUser(userId, user);
    console.log("> Push notification(s) sent");
}

let vapidPubKey;
export async function initKeys()
{
    console.log("> Initializing VAPID keys");
    if (!thingExists("./data/vapid") ||
        !thingExists("./data/vapid/priv.txt") ||
        !thingExists("./data/vapid/pub.txt"))
    {
        if (!thingExists("./data/vapid"))
            Deno.mkdirSync("./data/vapid", { recursive: true });


        const oldVapidKeys = await mod.generateVapidKeys({ extractable: true });
        console.log(oldVapidKeys);

        let vapidKeys = await mod.exportVapidKeys(oldVapidKeys);
        console.log(vapidKeys);


        writeFileSync("./data/vapid/priv.txt", JSON.stringify(vapidKeys.privateKey));
        writeFileSync("./data/vapid/pub.txt", JSON.stringify(vapidKeys.publicKey));
    }

    {
        let privKey = JSON.parse(Deno.readTextFileSync("./data/vapid/priv.txt"));
        let pubKey = JSON.parse(Deno.readTextFileSync("./data/vapid/pub.txt"));

        let vapidKeys = await mod.importVapidKeys({ privateKey: privKey, publicKey: pubKey });
        console.log(vapidKeys);

        vapidPubKey = vapidKeys.publicKey;
        let vapidPrivKey = vapidKeys.privateKey;

        pushServer = await mod.ApplicationServer.new({
            contactInformation: "https://marceldobehere.com/",
            vapidKeys,
        });
        console.log(pushServer);
    }

    console.log("> VAPID keys initialized");
}

export async function initApp(_io, _userInterface, _socketSessionManager)
{
    io = _io;
    userInterface = _userInterface;
    socketSessionManager = _socketSessionManager;
    await initKeys();

    io.on('connection', (socket) => {

        socket.on('disconnect', () => {

        });

        socket.on('push-subscribe', async (obj) => {
            let userIdSub = obj["userId"];
            let subscription = obj["subscription"];
            if (userIdSub === undefined || subscription === undefined)
                return socket.emit('push-subscribe', {error: "Missing data"});
            if (!socketSessionManager.socketBelongsToUser(socket, userIdSub))
                return socket.emit('push-subscribe', {error: "Invalid user"});

            let user = await userInterface.getUser(userIdSub);
            if (user === undefined)
                return socket.emit('push-subscribe', {error: "User not found"});

            console.log("> Subscribed to push");
            user["push-subcriptions"].push(subscription);
            await userInterface.updateUser(userIdSub, user);
            socket.emit('push-subscribe', {});
        });

        socket.on('get-server-pub-key', async (obj) => {
            console.log("> Sending server pub key");
            const publicKey = encodeBase64Url(
                await crypto.subtle.exportKey(
                    "raw",
                    vapidPubKey,
                ),
            );

            socket.emit('get-server-pub-key', {"public-key": publicKey});
        });


        socket.on('push-unsubscribe', async (obj) => {
            let userIdSub = obj["userId"];
            let subscription = obj["subscription"];
            if (userIdSub === undefined || subscription === undefined)
                return socket.emit('push-unsubscribe', {error: "Missing data"});
            if (!socketSessionManager.socketBelongsToUser(socket, userIdSub))
                return socket.emit('push-unsubscribe', {error: "Invalid user"});

            let user = await userInterface.getUser(userIdSub);
            if (user === undefined)
                return socket.emit('push-unsubscribe', {error: "User not found"});

            user["push-subcriptions"] = user["push-subcriptions"].filter(sub => JSON.stringify(sub) !== JSON.stringify(subscription));

            console.log("> Unsubscribed from push");
            await userInterface.updateUser(userIdSub, user);
            socket.emit('push-unsubscribe', {});
        });
    });

    console.log("> Push manager initialized");
}