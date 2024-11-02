const express = require('express')
const { createServer } = require('node:http')
const mongoose = require('mongoose')
const validator = require('validator')
const { Server } = require('socket.io')

const User = require('./models/userModel')
const Convo = require('./models/conversations')

const app = express()
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(express.json())
app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Credentials', true)
    next()
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            throw new Error("User not registered")
        }

        if (user.password != password) {
            throw new Error("Wrong Password")
        }

        res.status(200).json({ user })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

app.post('/signup', async (req, res) => {
    const { email, password, username } = req.body

    try {
        const match = await User.findOne({ email })

        if (match) {
            throw new Error("User already registered")
        }

        if (!validator.isEmail(email)) {
            throw new Error("Invalid Email")
        }

        const user = await User.create({ email, password, username })

        res.status(200).json({ user })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

app.get('/users', async (_, res) => {
    try {
        const users = await User.find({}).select('username email')

        res.status(200).json({ users })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

const getConvo = async (from, to) => {
    let conversations = await Convo.findOne({ from, to })

    if (!conversations) {
        conversations = await Convo.create({ from, to })
        await Convo.create({ from: to, to: from })
    }

    return conversations.messages
}

const addMessage = async (from, to, message) => {
    let { messages } = await Convo.findOne({ from, to })

    messages.length > 100 && messages.shift()
    messages.push({ from: from, message })

    await Convo.findOneAndUpdate({ from, to }, { messages })
    await Convo.findOneAndUpdate({ from: to, to: from }, { messages })

    return messages
}

io.on('connection', (socket) => {
    console.log("a user connected")

    socket.on('start', async ({ from, to }) => {
        socket.emit(`${from}${to}`, await getConvo(from, to))

        socket.on(`${from}${to}`, async (message) => {
            const messages = await addMessage(from, to, message)

            io.emit(`${from}${to}`, messages)
            io.emit(`${to}${from}`, messages)
        })
    })

    socket.on('end', async ({ from, to }) => {
        socket.off(`${from}${to}`, (message) => {
            io.emit(`${from}${to}`, message)
            io.emit(`${to}${from}`, message)
        })
    })

    socket.on('disconnect', () => {
        console.log("user disconnected")
    })
})

mongoose.connect("mongodb+srv://johnthomasalog:Thomas%40121323@honey-messenger.kwayu.mongodb.net/Honey")
    .then(() => {
        server.listen(8000, () => {
            console.log('server running at port 8000')
        })
    })
