import { io } from 'socket.io-client'

// https://honeymessenger-api.onrender.com
// http://localhost:8000

export const socket = io('https://honeymessenger-api.onrender.com', { autoConnect: false })