import { io } from 'socket.io-client'

export const socket = io('https://honeymessenger-api.onrender.com', { autoConnect: false })