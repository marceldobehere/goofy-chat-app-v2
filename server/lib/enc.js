import * as _JSEncrypt from "npm:node-jsencrypt@1.0.0";
export const JSEncrypt = {JSEncrypt: _JSEncrypt["default"]};

export function encryptString(str, publicKey)
{
    try {
        const jsEncrypt = new JSEncrypt.JSEncrypt();
        jsEncrypt.setPublicKey(publicKey);
        return jsEncrypt.encrypt(str);
    }
    catch (e) {
        console.error(`> ERROR WHILE ENCRYPTING: ${e}`);
        return undefined;
    }
}

export function decryptString(str, privateKey)
{
    try {
        const jsEncrypt = new JSEncrypt.JSEncrypt();
        jsEncrypt.setPrivateKey(privateKey);
        return jsEncrypt.decrypt(str);
    }
    catch (e) {
        console.error(`> ERROR WHILE DECRYPTING: ${e}`);
        return undefined;
    }
}