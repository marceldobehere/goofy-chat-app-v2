let serverList;
let currentUser;

async function initClientLib()
{
    currentUser = loadObject("currentUser");
    if (currentUser == null)
    {
        currentUser = createUser();
        saveObject("currentUser", currentUser);
    }
    console.log("Current User:", currentUser);
    if (testUser(currentUser))
        console.log("> Encryption with user works");
    else
        console.log("> Encryption with user is broken :(");

    serverList = loadObjectOrCreateDefault("serverList", []);
    serverList = ["http://localhost:80"];
    saveObject("serverList", serverList);
    console.log("Server List:", serverList);

    createSockets(serverList, currentUser);
}