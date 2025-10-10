import axios from "axios";
import config from "config";
import Dashboardbtn from "layouts/ReactBits/dashboardbtn";
import { useEffect, useRef, useState } from "react";
import { Card, Container, Row, Col, Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";

import FeatherIcon from 'feather-icons-react';

export default function EditPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);


    const [loading, setLoading] = useState(false);
    const [successful, setSuccessful] = useState('');
    const [error, setError] = useState('');

    const newPasswordRef = useRef();
    const confirmPasswordRef = useRef();

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer)
        }
    }, [loading])



    useEffect(() => {
        if (error || successful) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessful('');
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [error, successful]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const empInfo = JSON.parse(localStorage.getItem("user"));
        if (!newPassword) {
            setError("Password is empty!");
            newPasswordRef.current.focus()
            return;
        }
        if (!confirmPassword) {
            setError("Confirm Password is empty!");
            confirmPasswordRef.current.focus()
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Password does not match!");
            return;
        }
        setLoading(true)
        try {
            await axios.post(`${config.baseApi}/authentication/edit-password`, {
                user_id: empInfo.user_id,
                new_password: newPassword
            })
            setLoading(false)
            setSuccessful('Successfullly changed your password')
            window.location.replace('/ticketsystem/profile')
        } catch (err) {
            console.log(err);
            setError('Unable to cahnge the password!')
        }



    };

    return (
        <Container
            fluid
            className="pt-100 d-flex justify-content-center align-items-center"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
            }}
        >

            <Row className="justify-content-center w-100">
                <Col xs={12} md={6} lg={4}>

                    <Card
                        className="p-3 shadow-lg border-0 rounded-5 position-relative"
                        style={{
                            maxWidth: "600px",
                            width: "100%",
                            backgroundColor: "#fffef5",
                        }}
                    >
                        <Card.Body className="position-relative">

                            {/* Centered alerts inside the card */}
                            {(error || successful) && (
                                <div
                                    className="position-absolute start-50 translate-middle"
                                    style={{
                                        zIndex: 10,
                                        width: "80%",
                                    }}
                                >
                                    {error && (
                                        <Alert
                                            variant="danger"
                                            onClose={() => setError('')}
                                            dismissible
                                            className="text-center shadow"
                                        >
                                            {error}
                                        </Alert>
                                    )}
                                    {successful && (
                                        <Alert
                                            variant="success"
                                            onClose={() => setSuccessful('')}
                                            dismissible
                                            className="text-center shadow"
                                        >
                                            {successful}
                                        </Alert>
                                    )}
                                </div>
                            )}

                            <h3 className="text-center mb-4">Change Password</h3>
                            <hr />

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label>New Password</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showNew ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            ref={newPasswordRef}
                                            style={{ borderRight: "none" }}
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowNew(!showNew)}
                                            style={{
                                                cursor: "pointer",
                                                background: "transparent",
                                                borderLeft: "none"
                                            }}
                                        >
                                            <FeatherIcon icon={showNew ? "eye-off" : "eye"} />
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            ref={confirmPasswordRef}
                                            style={{ borderRight: "none" }}
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            style={{
                                                cursor: "pointer",
                                                background: "transparent",
                                                borderLeft: "none"
                                            }}
                                        >
                                            <FeatherIcon icon={showConfirm ? "eye-off" : "eye"} />
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>

                                <Button
                                    variant="warning"
                                    type="submit"
                                    className="w-100"
                                    style={{
                                        backgroundColor: "#b8860b",
                                        border: "none",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Update Password
                                </Button>
                            </Form>

                        </Card.Body>
                    </Card>

                </Col>
            </Row>


            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)", // black transparent bg
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <Spinner animation="border" variant="light" />
                </div>
            )}
        </Container>
    );
}
