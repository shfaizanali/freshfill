import React, { useState, useRef } from "react";
import {
	Container,
	Row,
	Col,
	Button,
	Form,
	Card,
	Spinner,
	Alert,
	Badge,
} from "react-bootstrap";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faSignOutAlt,
	faPaperPlane,
	faPaperclip,
	faTimes,
} from "@fortawesome/free-solid-svg-icons";
import {
	validateFile,
	extractTextFromFile,
	formatFileSize,
	getFileIcon,
} from "../utils/fileUtils";
import {
	extractTextFromResponse,
	splitResponseIntoParts,
} from "../utils/responseUtils";
import MarkdownMessage from "../components/MarkdownMessage";
import "../components/FileUpload.css";

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
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [fileErrors, setFileErrors] = useState([]);
	const [isProcessingFile, setIsProcessingFile] = useState(false);
	const fileInputRef = useRef(null);
	const navigate = useNavigate();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate("/login");
	};

	const handleFileUpload = async (event) => {
		const files = Array.from(event.target.files);
		setFileErrors([]);

		if (files.length === 0) return;

		const newFiles = [];
		const errors = [];

		for (const file of files) {
			const validation = validateFile(file);

			if (!validation.isValid) {
				errors.push(`${file.name}: ${validation.errors.join(", ")}`);
				continue;
			}

			try {
				setIsProcessingFile(true);

				// Show processing message for PDFs
				if (file.type === "application/pdf") {
					setChatLog((log) => [
						...log,
						{
							who: "System",
							text: `Processing PDF: ${file.name}...`,
							isProcessing: true,
						},
					]);
				}

				const extractedText = await extractTextFromFile(file);

				// Remove processing message
				setChatLog((log) => log.filter((msg) => !msg.isProcessing));

				newFiles.push({
					id: Date.now() + Math.random(),
					file,
					extractedText,
					name: file.name,
					size: file.size,
					type: file.type,
				});
			} catch (error) {
				// Remove processing message on error
				setChatLog((log) => log.filter((msg) => !msg.isProcessing));
				errors.push(`${file.name}: ${error.message}`);
			}
		}

		setIsProcessingFile(false);
		setFileErrors(errors);
		setUploadedFiles((prev) => [...prev, ...newFiles]);

		// Clear the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const removeFile = (fileId) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
	};

	const sendChat = async (e) => {
		e.preventDefault();
		if (!chatInput.trim() || isLoading) return;

		const userMessage = chatInput;
		setChatInput("");

		// Add user message to chat log
		setChatLog((log) => [...log, { who: "Me", text: userMessage }]);

		// Show typing indicator
		setChatLog((log) => [
			...log,
			{ who: "Annie", text: "Typing...", isTyping: true },
		]);
		setIsLoading(true);

		try {
			const res = await fetchWithTimeout(
				N8N_WEBHOOK_URL,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.access_token}`,
					},
					body: JSON.stringify({
						chatInput: userMessage,
						userId: session.user.id,
						sessionId: session.user.id,
						email: session.user.email,
						timestamp: new Date().toISOString(),
						fileContext: uploadedFiles
							.map(
								(file) =>
									`Document: ${file.name}\nContent:\n${file.extractedText}`
							)
							.join("\n\n"),
						attachedFiles: uploadedFiles.map((file) => ({
							name: file.name,
							size: file.size,
							type: file.type,
						})),
					}),
				},
				60000
			);

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const responseData = await res.json();
			console.log("Raw N8N Response:", responseData);

			// Process the response using the new utility
			const fullReply = extractTextFromResponse(responseData);
			console.log("Processed Full Reply:", fullReply);

			if (!fullReply) {
				throw new Error("Failed to extract a valid response.");
			}

			// Split the full reply into logical, typed parts for separate messages
			const replyParts = splitResponseIntoParts(fullReply);

			// Update chat log with the new messages
			setChatLog((log) => {
				const newLog = log.filter((msg) => !msg.isTyping);
				const newMessages = replyParts.map((part) => ({
					who: "Annie",
					text: part.text,
					type: part.type,
					timestamp: new Date().toISOString(),
				}));
				return [...newLog, ...newMessages];
			});

			setUploadedFiles([]);
		} catch (error) {
			console.error("Chat error:", error);
			setChatLog((log) => {
				const newLog = log.filter((msg) => !msg.isTyping);
				return [
					...newLog,
					{
						who: "Annie",
						text:
							error.name === "AbortError"
								? "I'm still processing your request. Please wait a moment and try again."
								: `Sorry, I encountered an error: ${error.message}`,
						timestamp: new Date().toISOString(),
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
										Logged in as <strong>{session.user.email}</strong>
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
										className={`d-inline-block p-3 rounded-3 chat-bubble ${
											msg.who === "Me"
												? "chat-bubble-me"
												: `chat-bubble-annie chat-bubble-annie-${
														msg.type || "answer"
												  }`
										}`}
										style={{ maxWidth: "75%", textAlign: "left" }}>
										{/* <div className="small mb-1 text-muted">{msg.who}</div> */}
										{msg.isTyping ? (
											<div className="d-flex align-items-center">
												<Spinner animation="grow" size="sm" />
												<span className="ms-2">{msg.text}</span>
											</div>
										) : msg.isProcessing ? (
											<div className="d-flex align-items-center">
												<Spinner animation="border" size="sm" />
												<span className="ms-2">{msg.text}</span>
											</div>
										) : (
											<MarkdownMessage text={msg.text} />
										)}
									</div>
								</div>
							))}
						</Card.Body>

						{/* File Upload Section */}
						{uploadedFiles.length > 0 && (
							<Card.Body className="border-top bg-light py-3 file-upload-container">
								<div className="mb-2">
									<small className="text-muted">Attached Files:</small>
								</div>
								<div className="d-flex flex-wrap gap-2">
									{uploadedFiles.map((file) => (
										<Badge
											key={file.id}
											bg="primary"
											className="d-flex align-items-center gap-1 p-2 file-badge">
											<span>{getFileIcon(file.type)}</span>
											<span
												className="text-truncate"
												style={{ maxWidth: "150px" }}>
												{file.name}
											</span>
											<small>({formatFileSize(file.size)})</small>
											<Button
												variant="link"
												size="sm"
												className="text-white p-0 ms-1 file-remove-btn"
												onClick={() => removeFile(file.id)}
												style={{ textDecoration: "none" }}>
												<FontAwesomeIcon icon={faTimes} />
											</Button>
										</Badge>
									))}
								</div>
							</Card.Body>
						)}

						{/* File Error Messages */}
						{fileErrors.length > 0 && (
							<Card.Body className="border-top py-2">
								{fileErrors.map((error, index) => (
									<Alert key={index} variant="danger" className="py-2 mb-2">
										<small>{error}</small>
									</Alert>
								))}
							</Card.Body>
						)}

						<Card.Footer className="bg-white p-3">
							<Form onSubmit={sendChat}>
								<div className="d-flex gap-2">
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept=".pdf,.txt,.md,.csv,.doc,.docx"
										onChange={handleFileUpload}
										style={{ display: "none" }}
									/>
									<Button
										type="button"
										variant="outline-secondary"
										onClick={() => fileInputRef.current?.click()}
										disabled={isLoading || isProcessingFile}
										title="Attach files (PDF, TXT, DOC, etc.)">
										{isProcessingFile ? (
											<Spinner
												animation="border"
												size="sm"
												className="file-processing"
											/>
										) : (
											<FontAwesomeIcon icon={faPaperclip} />
										)}
									</Button>
									<Form.Control
										type="text"
										placeholder="Ask Annie..."
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										disabled={isLoading || isProcessingFile}
									/>
									<Button
										type="submit"
										variant="primary"
										disabled={isLoading || isProcessingFile}>
										{isLoading ? (
											<Spinner animation="border" size="sm" />
										) : (
											<FontAwesomeIcon icon={faPaperPlane} />
										)}
									</Button>
								</div>
								{uploadedFiles.length > 0 && (
									<div className="mt-2">
										<small className="text-muted">
											📎 {uploadedFiles.length} file(s) attached. Text will be
											included in your question context.
										</small>
									</div>
								)}
							</Form>
						</Card.Footer>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}
