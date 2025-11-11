import BTN from "layouts/ReactBits/BTN";
import { useEffect, useState } from "react";
import { Card, Container, Row, Col, Spinner, Button } from "react-bootstrap";
import { useNavigate } from 'react-router';
export default function Profile() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  //Get user details on localstorage
  useEffect(() => {
    const empInfo = JSON.parse(localStorage.getItem("user"));
    setUserData(empInfo);
  }, []);

  //if no data. Spin loading state
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
        <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
          <h2 className="mb-0 text-center text-md-start" style={{ fontWeight: "bold" }}>
            My Profile
          </h2>
          <BTN label={'Change Password'}
            onClick={() => navigate("/edit-password")}
            style={{ color: "#333" }}
          />
        </div>

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
      </Card>
    </Container>
  );
}
