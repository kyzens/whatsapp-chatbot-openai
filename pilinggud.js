// Menambahkan Dependecies
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useSingleFileAuthState 
} = require('@adiwajshing/baileys')
const { Boom } = require("@hapi/boom")
const { state, saveState } = useSingleFileAuthState('./login.json')

// Dependecies OpenAI
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

// Fungsi OpenAI ChatGPT
async function generateResponse(text) {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    return response.data.choices[0].text
}

// Fungsi Utama Pulinggud WA Bot
async function connectToWhatsApp() {

    // Koneksi baru ke WhatsApp
    const socket = await makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined
    })

    // Cek Koneksi Update
    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("Connection lost because ", lastDisconnect.error, ", reconnect: ", shouldReconnect)

            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log("Connection established")
        }
    })

    socket.ev.on('creds.update', saveState)

    // Cek Pesan Masuk
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('Tipe Pesan: ', type)
        console.log(messages)

        if (type === 'notify' && !messages[0].key.fromMe) {
            try {
                // Nomor & Pesan Pengirim
                const senderNumber = messages[0].key.remoteJid
                let incomingMessage = messages[0].message.conversation
                if (incomingMessage === "") {
                    incomingMessage = messages[0].message.extendedTextMessage.text
                }
                incomingMessage = incomingMessage.toLowerCase()

                // Info pesan dari grup
                const isMessageFromGroup = senderNumber.includes('@g.us')
                const isMessageMentionBot = incomingMessage.includes('@62895110031400')
                const isMessageOther = incomingMessage.includes('#batanyaom')

                // Cek Nomor & Pesan masuk
                console.log('Nomor Pengirim: ', senderNumber)
                console.log('Isi Pesan: ', incomingMessage)

                // Cek status pesan dari grup atau tidak
                // Cek status pesan menyebut bot atau tidak
                console.log('Apakah pesan dari grup? ', isMessageFromGroup)
                console.log('Apakah pesan menyebut bot? ', isMessageMentionBot)

                // Jika pesan dari japri
                if (!isMessageFromGroup) {

                    if (incomingMessage === 'halo om') {
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Halo juga brodi' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    } else if (incomingMessage.includes('siapa')) { 
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Ana te om pilgud!' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessage)
                            console.log(result)
                            await socket.sendMessage(
                                senderNumber, 
                                { text: result }, 
                                { quoted: messages[0] },
                                2000
                            )
                        }
                        main()
                    }

                }

                // Jika pesan dari grup
                if (isMessageFromGroup) {
                    if (incomingMessage === 'halo om pilgud') {
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Halo juga brodi!' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    }
                    
                    if (incomingMessage === 'ti om pilgud ini sapa?') { 
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Oy ana te om pilgud. Ana itu bot aba.' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    }
                }

                // Jika pesan dari grup with chatgpt
                if (isMessageFromGroup && isMessageMentionBot) {
                    if (incomingMessage.includes('om cari akan')) { 
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Pi cari sandiri. minimal berusaha lah😏' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    } else if (incomingMessage.includes('om beken akan')) {
                        // Kirim Balasan
                        await socket.sendMessage(
                            senderNumber, 
                            { text: 'Ey p sanang jo nga. beken kasana sandiri. minimal berusaha lah😏' }, 
                            { quoted: messages[0] },
                            2000
                        )
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessage)
                            console.log(result)
                            await socket.sendMessage(
                                senderNumber, 
                                { text: result }, 
                                { quoted: messages[0] },
                                2000
                            )
                        }
                        main()
                    }
                }
            } catch(error) {
                console.log(error)
            }
            console.log(messages[0])
        }
    })

    return socket
}

connectToWhatsApp().catch((err) => {
    console.log("Error: ", err)
})