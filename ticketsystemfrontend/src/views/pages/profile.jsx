import { useEffect, useState } from "react";
import { Card, Container, Row, Col, Spinner, Button } from "react-bootstrap";

export default function Profile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const empInfo = JSON.parse(localStorage.getItem("user"));
    setUserData(empInfo);
  }, []);

  if (!userData) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{
        background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "50px",
      }}
    >
      <Card
        className="p-5 shadow-lg border-0 rounded-5"
        style={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: "#fffef5",
        }}
      >
        <h2 className="text-center mb-4" style={{ fontWeight: "bold" }}>
          My Profile
        </h2>
        <hr />

        <div className="px-2">
          <Row className="mb-3">
            <Col sm={4} className="fw-semibold text-secondary">
              Full Name:
            </Col>
            <Col sm={8}>
              {userData.emp_FirstName} {userData.emp_LastName}
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4} className="fw-semibold text-secondary">
              Username:
            </Col>
            <Col sm={8}>{userData.user_name}</Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4} className="fw-semibold text-secondary">
              Email:
            </Col>
            <Col sm={8}>{userData.emp_email}</Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4} className="fw-semibold text-secondary">
              Role:
            </Col>
            <Col sm={8} className="text-capitalize">
              {userData.emp_role}
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4} className="fw-semibold text-secondary">
              Department:
            </Col>
            <Col sm={8}>{userData.emp_department}</Col>
          </Row>
          <Row className="mb-4">
            <Col sm={4} className="fw-semibold text-secondary">
              Position:
            </Col>
            <Col sm={8}>{userData.emp_position}</Col>
          </Row>
        </div>

        <div className="text-center mt-4">
          <Button
            variant="warning"
            className="px-4 py-2 fw-semibold rounded-4 shadow-sm"
            style={{
              backgroundColor: "#ffcc00",
              border: "none",
              color: "#333",
            }}
            onClick={() => window.location.replace("/ticketsystem/edit-password")}
          >
            Change Password
          </Button>
        </div>
      </Card>
    </Container>
  );
}
