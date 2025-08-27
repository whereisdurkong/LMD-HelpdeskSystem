import React, { useState } from "react";
import { Button, Container, Row, Col, Form } from "react-bootstrap";

export default function Slider() {
    const [value, setValue] = useState(3);

    const labels = {
        1: "Very Dissatisfied",
        2: "Dissatisfied",
        3: "Neutral",
        4: "Satisfied",
        5: "Very Satisfied",
    };

    const handleSubmit = () => {
        console.log("Selected Number:", value);
        console.log("Selected Label:", labels[value]);
    };
    // compute thumb position (percent)
    const thumbLeft = `${10 + (value - 1) * 20}%`;

    return (
        <Container
            className="mt-5 text-center"
        >
            <h4>SCALE</h4>
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6}>
                    {/* BAR + CUSTOM THUMB + INVISIBLE RANGE */}
                    <div style={{ position: "relative", width: "100%" }}>
                        {/* colored bar */}
                        <div
                            style={{
                                height: 12,
                                borderRadius: 6,
                                display: "flex",
                                overflow: "hidden",
                                width: "100%",
                            }}
                        >
                            <div style={{ flex: 1, background: "#e74c3c" }} />
                            <div style={{ flex: 1, background: "#e67e22" }} />
                            <div style={{ flex: 1, background: "#f1c40f" }} />
                            <div style={{ flex: 1, background: "#2ecc71" }} />
                            <div style={{ flex: 1, background: "#27ae60" }} />
                        </div>

                        {/* custom thumb */}
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: thumbLeft,
                                transform: "translate(-50%, -50%)",
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#333",
                                boxShadow: "0 0 0 3px rgba(0,0,0,0.08)",
                                zIndex: 2,
                                pointerEvents: "none",
                            }}
                        />

                        {/* invisible range */}
                        <Form.Range
                            min={1}
                            max={5}
                            step={1}
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            style={{
                                position: "absolute",
                                top: -12,
                                left: 0,
                                right: 0,
                                width: "100%",
                                height: 36,
                                opacity: 0,
                                cursor: "pointer",
                                zIndex: 3,
                            }}
                        />
                    </div>

                    {/* Numbers aligned */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            marginTop: 8,
                            fontSize: "clamp(0.8rem, 2vw, 1rem)", // scales with screen
                        }}
                    >
                        {["1", "2", "3", "4", "5"].map((n) => (
                            <div key={n} style={{ textAlign: "center" }}>
                                {n}
                            </div>
                        ))}
                    </div>

                    {/* Labels aligned */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            marginTop: 4,
                            fontSize: "clamp(0.7rem, 1.8vw, 0.9rem)", // responsive font
                            gap: "4px",
                        }}
                    >
                        <div style={{ textAlign: "center", color: "#e74c3c" }}>Very Dissatisfied</div>
                        <div style={{ textAlign: "center", color: "#e67e22" }}>Dissatisfied</div>
                        <div style={{ textAlign: "center", color: "#f1c40f" }}>Neutral</div>
                        <div style={{ textAlign: "center", color: "#2ecc71" }}>Satisfied</div>
                        <div style={{ textAlign: "center", color: "#27ae60" }}>Very Satisfied</div>
                    </div>

                    <Button
                        variant="success"
                        className="mt-3"
                        style={{ width: "100%", maxWidth: "200px" }}
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </Col>
            </Row>
        </Container>
    );


}
