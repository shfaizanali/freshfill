// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
// src/App.js
import React, { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL;

function App() {
	const [session, setSession] = useState(null);
	const [userRole, setUserRole] = useState(null);
	const [chatInput, setChatInput] = useState("");
	const [chatLog, setChatLog] = useState([]);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session) fetchUserRole(session.user.id);
		});

		// Listen for changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (session) {
				fetchUserRole(session.user.id);
			} else {
				setUserRole(null);
				setChatLog([]);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	async function fetchUserRole(userId) {
		const { data, error } = await supabase
			.from("users")
			.select(
				`
				role_id,
				user_roles (
					name
				)
			`
			)
			.eq("id", userId)
			.single();

		if (error) {
			console.error("Error fetching role:", error);
			return;
		}

		setUserRole(data?.user_roles?.name);
	}

	// 3) Logout handler
	const handleLogout = async () => {
		await supabase.auth.signOut();
	};

	// 4) Send chat message to n8n
	const sendChat = async (e) => {
		e.preventDefault();
		if (!chatInput.trim()) return;

		// append user message
		setChatLog((log) => [...log, { who: "Me", text: chatInput }]);

		const payload = { userId: session.user.id, chatInput };

		const res = await fetch(N8N_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const json = await res.json();
		const reply = json.reply || json.error || "🚨 Unexpected response";
		setChatLog((log) => [...log, { who: "Annie", text: reply }]);

		setChatInput("");
	};

	return (
		<Router>
			<Routes>
				<Route
					path="/login"
					element={!session ? <LoginPage /> : <Navigate to="/chat" replace />}
				/>
				<Route
					path="/chat"
					element={
						session ? (
							<ChatPage session={session} userRole={userRole} />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/"
					element={<Navigate to={session ? "/chat" : "/login"} replace />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
