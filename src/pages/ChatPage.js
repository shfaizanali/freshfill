import React, { useState } from "react";
import {
	Container,
	Row,
	Col,
	Button,
	Form,
	Card,
	Spinner,
} from "react-bootstrap";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const N8N_WEBHOOK_URL =
	"https://freshfill.app.n8n.cloud/webhook/d4b52a6c-baec-4403-b9f3-a5acf5627dfd/chat";

// Function to implement timeout
const fetchWithTimeout = async (url, options, timeout = 60000) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
			mode: "cors",
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
};

export default function ChatPage({ session, userRole }) {
	const [chatInput, setChatInput] = useState("");
	const [chatLog, setChatLog] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate("/login");
	};

	const sendChat = async (e) => {
		e.preventDefault();
		if (!chatInput.trim() || isLoading) return;

		const userMessage = chatInput;
		setChatInput(""); // Clear input immediately

		// append user message
		setChatLog((log) => [...log, { who: "Me", text: userMessage }]);

		// Show typing indicator
		setChatLog((log) => [
			...log,
			{ who: "Annie", text: "Typing...", isTyping: true },
		]);
		setIsLoading(true);

		// Use user ID as the session identifier instead of the full JWT token
		const sessionIdentifier = session.user.id;

		const payload = {
			chatInput: userMessage,
			userId: session.user.id,
			sessionId: sessionIdentifier,
			email: session.user.email,
			timestamp: new Date().toISOString(),
		};

		try {
			const res = await fetchWithTimeout(
				N8N_WEBHOOK_URL,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.access_token}`,
					},
					body: JSON.stringify(payload),
				},
				60000 // 60 second timeout
			);

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const responseData = await res.json();
			console.log("N8N Response:", responseData);

			// Handle both direct string responses and json.reply format
			const reply =
				typeof responseData === "string"
					? responseData
					: responseData.reply ||
					  responseData.output ||
					  responseData.message ||
					  "I encountered an error. Please try again.";

			// Remove typing indicator and add actual response
			setChatLog((log) => {
				const newLog = log.filter((msg) => !msg.isTyping);
				return [...newLog, { who: "Annie", text: reply }];
			});
		} catch (error) {
			console.error("Chat error:", error);
			// Remove typing indicator and add error message
			setChatLog((log) => {
				const newLog = log.filter((msg) => !msg.isTyping);
				return [
					...newLog,
					{
						who: "Annie",
						text:
							error.name === "AbortError"
								? "I'm still processing your request. Please wait a moment and try again."
								: "Sorry, I encountered a connection error. Please try again.",
					},
				];
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Container fluid className="py-4">
			<Row className="justify-content-center">
				<Col xs={12} md={10} lg={8} xl={6}>
					<Card className="shadow-sm">
						<Card.Header className="bg-white py-3">
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h4 className="mb-0">HR Chatbot</h4>
									<small className="text-muted">
										Logged in as <strong>{session.user.email}</strong> (
										{userRole})
									</small>
								</div>
								<Button
									variant="outline-danger"
									onClick={handleLogout}
									size="sm">
									<FontAwesomeIcon icon={faSignOutAlt} /> Logout
								</Button>
							</div>
						</Card.Header>

						<Card.Body
							className="chat-container p-4"
							style={{ height: "60vh", overflowY: "auto" }}>
							{chatLog.map((msg, i) => (
								<div
									key={i}
									className={`chat-message ${
										msg.who === "Me" ? "text-end" : ""
									} mb-3`}>
									<div
										className={`d-inline-block p-3 rounded-3 ${
											msg.who === "Me" ? "bg-primary text-white" : "bg-light"
										}`}
										style={{ maxWidth: "75%", textAlign: "left" }}>
										<div className="small mb-1 text-muted">{msg.who}</div>
										{msg.isTyping ? (
											<div className="d-flex align-items-center">
												<Spinner animation="grow" size="sm" />
												<span className="ms-2">{msg.text}</span>
											</div>
										) : (
											msg.text
										)}
									</div>
								</div>
							))}
						</Card.Body>

						<Card.Footer className="bg-white p-3">
							<Form onSubmit={sendChat}>
								<div className="d-flex gap-2">
									<Form.Control
										type="text"
										placeholder="Ask Annie..."
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										disabled={isLoading}
									/>
									<Button type="submit" variant="primary" disabled={isLoading}>
										{isLoading ? (
											<Spinner animation="border" size="sm" />
										) : (
											<FontAwesomeIcon icon={faPaperPlane} />
										)}
									</Button>
								</div>
							</Form>
						</Card.Footer>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}
