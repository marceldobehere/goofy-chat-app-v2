import {updateUser} from "./userInterface.js";
import {thingExists, writeFileSync} from "../other/utils.js";
import webPush from 'npm:web-push';

let io;
let userInterface;
let socketSessionManager;

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

    console.log(`> Sending push notification to ${userId} (${user["push-subcriptions"].length} subscribers)`);
    for (let sub of user["push-subcriptions"])
    {
        console.log(" > Sending push notification to: ", sub);
        webPush.sendNotification(sub, undefined).then(() => { // deno cant send non-empty payload
            console.log(" > Push notification sent");
        }).catch(error => {
            console.error(" > Error sending push notification: ", error);
            //user["push-subcriptions"] = user["push-subcriptions"].filter(subA => JSON.stringify(subA) !== JSON.stringify(sub));
        });
    }

    // Clear push subscribers
    user["push-subcriptions"] = [];
    await updateUser(userId, user);
    console.log("> Push notification sent");
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

        // generate keys
        const vapidKeys = webPush.generateVAPIDKeys();
        console.log(vapidKeys);
        writeFileSync("./data/vapid/priv.txt", vapidKeys.privateKey);
        writeFileSync("./data/vapid/pub.txt", vapidKeys.publicKey);
    }
    let vapidPrivKey = Deno.readTextFileSync("./data/vapid/priv.txt");
    vapidPubKey = Deno.readTextFileSync("./data/vapid/pub.txt");

    webPush.setVapidDetails(
        "https://marceldobehere.github.io/",
        vapidPubKey,
        vapidPrivKey
    );

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

            webPush

            console.log("> Subscribed to push");
            user["push-subcriptions"].push(subscription);
            await userInterface.updateUser(userIdSub, user);
            socket.emit('push-subscribe', {});
        });

        socket.on('get-server-pub-key', (obj) => {
            console.log("> Sending server pub key");
            socket.emit('get-server-pub-key', {"public-key": vapidPubKey});
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