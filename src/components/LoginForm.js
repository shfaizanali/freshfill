// src/components/LoginForm.js
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Form, Button, FloatingLabel } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import "../styles/forms.css";

export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
		} catch (error) {
			alert(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-form-container">
			<Form onSubmit={handleSubmit} className="auth-form">
				<h3>Welcome Back</h3>

				<FloatingLabel controlId="email" label="Email address">
					<Form.Control
						type="email"
						placeholder="name@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</FloatingLabel>

				<FloatingLabel controlId="password" label="Password">
					<Form.Control
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</FloatingLabel>

				<Button type="submit" variant="primary" disabled={loading}>
					{loading ? "Logging in..." : "Log In"}
				</Button>
			</Form>
		</div>
	);
}
