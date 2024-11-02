import { useEffect, useRef, useState } from 'react'
import './styles/App.css'
import { socket } from './socket'

const url = "https://honeymessenger-api.onrender.com"

// https://honeymessenger-api.onrender.com
// http://localhost:3000

function App() {
    const [user, setUser] = useState(null)
    const [isLoginPage, setIsLoginPage] = useState(true)
    const [isUsersTogg, setIsUsersTogg] = useState(true)

    const [newMessage, setNewMessage] = useState("")
    const [to, setTo] = useState("")
    const [toName, setToName] = useState("")
    const [messages, setMessages] = useState([])
    const [error, setError] = useState("")
    const [users, setUsers] = useState([])
    const [login, setLogin] = useState({
        email: "",
        password: "",
        username: ""
    })

    const bottomRef = useRef(null)

    useEffect(() => {
        const storage = localStorage.getItem('honeyUser')
        storage && setUser(JSON.parse(storage))
    }, [])

    useEffect(() => {
        user && getUsers()
    }, [user])

    const getUsers = async () => {
        const res = await fetch(`${url}/users`)
        const json = await res.json()

        setUsers(json.users.filter(userr => userr.username != user.username))
    }

    const submitLogin = async (e) => {
        e.preventDefault()

        const res = await fetch(`${url}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: login.email,
                password: login.password
            })
        })

        const json = await res.json()

        if (json.error) {
            setError(json.error)
        } else {
            setUser(json.user)
            localStorage.setItem('honeyUser', JSON.stringify(json.user))
        }
    }

    const submitSignUp = async (e) => {
        e.preventDefault()

        const res = await fetch(`${url}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: login.email,
                password: login.password,
                username: login.username
            })
        })

        const json = await res.json()

        if (json.error) {
            setError(json.error)
        } else {
            setUser(json.user)
            localStorage.setItem('honeyUser', JSON.stringify(json.user))
        }
    }

    const logout = () => {
        localStorage.clear('honeyUser')
        setUser(null)
        setIsUsersTogg(true)
    }

    const handleConvo = (to) => {
        setIsUsersTogg(false)
        setTo(to.email)
        setToName(to.username)
        socket.connect()
        socket.emit('start', { from: user.email, to: to.email })

        socket.on(`${user.email}${to.email}`, (messages) => {
            setMessages(messages)
            setTimeout(() => {
                bottomRef.current.scrollIntoView({ behavior: "smooth" })
            }, 50)
        })
    }

    const handleBackConvo = () => {
        setIsUsersTogg(true)
        socket.off(`${user.email}${to}`, (messages) => {
            setMessages(messages)
        })
        socket.emit('end', { from: user.email, to })
        socket.disconnect()
        setMessages([])
        setTo("")
        setToName("")
    }

    const sendMessage = () => {
        if (!newMessage.trim()) {
            setNewMessage("")
            return
        }

        socket.emit(`${user.email}${to}`, newMessage)
        setNewMessage("")
    }

    return (
        <>
            <div className="header">
                <h1>Honey Messenger</h1>
                {user && <i onClick={logout} className="fa-solid fa-right-from-bracket" />}
            </div>
            {user &&
                <>
                    <div className='profile'>
                        <h1>Logged in as: <b>{user.username}</b></h1>
                        {!isUsersTogg &&
                            <>
                                <h1>Chatting with: <b>{toName}</b></h1>
                                <button onClick={handleBackConvo}>back</button>
                            </>
                        }
                    </div>
                    {isUsersTogg ?
                        <div className='convos'>
                            {users?.map(user => (
                                <div onClick={() => handleConvo(user)} key={user._id} className='user'>
                                    <h1>{user.username}</h1>
                                </div>
                            ))}
                        </div>
                        :
                        <div className='user-convo'>
                            <div className='messages'>
                                {messages.map((mssg, i) => (
                                    <h1 style={mssg.from == user.email ? { alignSelf: "flex-end", backgroundColor: "#75f8ff" } : null} key={i}>{mssg.message}</h1>
                                ))}
                                <div ref={bottomRef}></div>
                            </div>
                            <div className='inputs'>
                                <input onChange={e => setNewMessage(e.target.value)} value={newMessage} type="text" />
                                <button onClick={sendMessage}>Send</button>
                            </div>
                        </div>
                    }
                </>
            }
            <div className='body'>
                {!user && isLoginPage &&
                    <form onSubmit={submitLogin} className='login'>
                        <h1>Login</h1>
                        {error && <h3>{error}</h3>}
                        <div className='wrapper'>
                            <label htmlFor="email">Email:</label>
                            <input onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} value={login.email} id='email' type="text" />
                        </div>
                        <div className='wrapper'>
                            <label htmlFor="pass">Password:</label>
                            <input onChange={e => setLogin(p => ({ ...p, password: e.target.value }))} value={login.password} id='pass' type="password" />
                        </div>
                        <button type='submit'>Submit</button>
                        <h2 onClick={() => setIsLoginPage(false)}>sign up?</h2>
                    </form>
                }
                {!user && !isLoginPage &&
                    <form onSubmit={submitSignUp} className='login'>
                        <h1>Sign up</h1>
                        {error && <h3>{error}</h3>}
                        <div className='wrapper'>
                            <label htmlFor="username">Username:</label>
                            <input onChange={e => setLogin(p => ({ ...p, username: e.target.value }))} value={login.username} id='username' type="text" />
                        </div>
                        <div className='wrapper'>
                            <label htmlFor="email">Email:</label>
                            <input onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} value={login.email} id='email' type="text" />
                        </div>
                        <div className='wrapper'>
                            <label htmlFor="pass">Password:</label>
                            <input onChange={e => setLogin(p => ({ ...p, password: e.target.value }))} value={login.password} id='pass' type="password" />
                        </div>
                        <button type='submit'>Submit</button>
                        <h2 onClick={() => setIsLoginPage(true)}>login?</h2>
                    </form>
                }
            </div>
        </>
    )
}

export default App
