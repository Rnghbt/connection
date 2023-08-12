import makeWASocket, { DisconnectReason, useMultiFileAuthState, } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

async function connectToWhatsApp() {
    console.log("mulai");
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error as Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut;
            console.log(
                "connection closed due to ",
                lastDisconnect?.error,
                ", reconnecting ",
                shouldReconnect
            );
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === "open") {
            console.log("opened connection");
        }
    });
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];

        if (!msg.key.fromMe && m.type === "notify") {
            console.log(msg);
        }
    });
}

connectToWhatsApp();
