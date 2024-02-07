import {thingExists} from "../other/utils.js";

let userCache = {};

function loadUsers()
{
    // If no users.json, create
    if (!thingExists("./data/users.json"))
    {
        console.log("> Creating users.json");
        Deno.writeTextFileSync("./data/users.json", "{}");
    }

    // Load users
    try
    {
        userCache = JSON.parse(Deno.readTextFileSync("./data/users.json"));
    }
    catch (e)
    {
        console.log("> Error reading users.json ", e);
        console.log("> Creating users.json");
        userCache = {};
        Deno.writeTextFileSync("./data/users.json", JSON.stringify(userCache));
        userCache = {};
    }

    console.log("> Loaded users.json");
    console.log(userCache);

    console.log("> User Interface initialized");
}

export async function initApp()
{
    loadUsers();
}

export async function getUser(userId)
{
    return userCache[userId];
}

export async function userExists(userId)
{
    return userCache[userId] !== undefined;
}

export async function addUser(userId, user)
{
    if (await userExists(userId))
        return;

    userCache[userId] = user;
    await Deno.writeTextFile("./data/users.json", JSON.stringify(userCache));
}