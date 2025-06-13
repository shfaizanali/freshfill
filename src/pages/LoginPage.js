import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import LoginForm from "../components/LoginForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
	return (
		<Container fluid className="auth-page">
			<Row className="justify-content-center align-items-center min-vh-100">
				<Col xs={12} sm={10} md={8} lg={6} xl={4}>
					<Card className="shadow-lg border-0">
						<Card.Body className="p-5">
							<div className="text-center mb-4">
								<FontAwesomeIcon
									icon={faComments}
									size="3x"
									className="text-primary mb-3"
								/>
								<h2 className="fw-bold">Welcome Back</h2>
								<p className="text-muted">Log in to your HR Chatbot account</p>
							</div>

							<LoginForm />
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}
