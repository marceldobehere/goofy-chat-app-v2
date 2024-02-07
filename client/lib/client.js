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
    logTxt(`Current User: (Main: ${currentUser["mainAccount"]["userId"]}, Listener: ${currentUser["listenerAccount"]["userId"]} (Enabled: ${currentUser["useListener"]}))`);
    if (testUser(currentUser))
        logInfo("Encryption with user works.");
    else
        logError("Encryption with user is broken!");

    serverList = loadObjectOrCreateDefault("serverList", []);
    serverList = ["http://localhost:80"];
    saveObject("serverList", serverList);
    logTxt("Server List:", serverList);

    await createSockets(serverList, currentUser);

    await initMsgSystem();
}