const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");
const MENU_IMAGE_URL =
  "https://raw.githubusercontent.com/sanju-MD547/sanju-md-whatsapp-bot/17e3fa5e9d678b08d05052d40edba56d2024ce1a/file_00000000179c820792196fe2ca2e70cd.png";
async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Scan this QR code with WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("SANJU MD MINI BOT connected!");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

    if (statusCode !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        console.log("Logged out. Pair again to reconnect.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();
    const jid = msg.key.remoteJid;

    // ALIVE COMMAND
    if (command === ".alive") {
      await sock.sendMessage(jid, {
        text: "🤖 SANJU MD MINI BOT is alive!"
      });
    }

    // MENU COMMAND
    if (command === ".menu") {
      const caption = `
╭━━━〔 👑 SANJU MD MINI BOT 〕━━━╮
┃
┃ 🤖 BOT STATUS: ONLINE
┃ 👤 OWNER: Podi Sanju
┃ ⚙️ VERSION: 1.0
┃
┣━━━〔 📌 GENERAL 〕━━━
┃ • .alive
┃ • .menu
┃
┣━━━〔 ❤️ THANK YOU 〕━━━
┃ Thanks for using SANJU MD!
┃ Stay Connected ✨
╰━━━━━━━━━━━━━━━━━━━━╯
      `.trim();

      try {
        await sock.sendMessage(jid, {
          image: { url: MENU_IMAGE_URL },
          caption
        });
      } catch (error) {
        console.error("Menu image error:", error);

        await sock.sendMessage(jid, {
          text: caption
        });
      }
    }
  });

}

startBot().catch(console.error);
