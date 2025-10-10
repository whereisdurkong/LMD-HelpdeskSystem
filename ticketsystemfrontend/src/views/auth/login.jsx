import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from 'config';
import Spinner from 'react-bootstrap/Spinner';
// react-bootstrap
import { Card, Row, Col, Button, Form, InputGroup, Alert, Stack } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';

// assets
import logoDark from 'assets/images/logo-dark.svg';
import newLogo from 'assets/images/new-logo.png'
import lmdblack from 'assets/images/lmdlogo/lmd-white.png';
import Waves from 'layouts/ReactBits/Paticles';
import FadeContent from 'layouts/ReactBits/FadeContent';
import RoundedSlideButton from 'layouts/ReactBits/RoundedSlideButton';

export default function SignIn1() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [show, setShow] = useState(false);
  //Snack bar timeout after 3s
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setLoginError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loginError]);

  //Loading state after 3s
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Function to handle authentication
  const Auth = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Password is required!');
      return;
    }
    if (!username.trim()) {
      setLoginError('Username is required!');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${config.baseApi}/authentication/login`, {
        params: {
          user_name: username,
          pass_word: password,
        },
      });
      if (!response.data.error) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('status', JSON.stringify([{ id: 0, value: 'Login' }]));
        window.location.replace(`ticketsystem/dashboard`);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setLoginError('Incorrect password! Try again...');
        } else if (err.response.status === 404) {
          setLoginError('Invalid username or password. Please try again.');
        } else {
          setLoginError('Invalid username or password. Please try again.');
        }
      } else {
        setLoginError('Unable to connect to server. Please check your internet or try again later.');
      }
    }
  };

  return (
    <div
      className="auth-wrapper"
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* PARTICLES BACKGROUND */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Waves
          lineColor="#eac002ff"
          backgroundColor="rgba(86, 86, 86, 1)"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <FadeContent blur={false} duration={200} easing="ease-out" initialOpacity={0} style={{ flex: 1 }}>
        {/* MAIN LOGIN CONTENT */}
        <div
          className="auth-content text-center"
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '11rem 0',

          }}
        >
          <Card className="borderless" style={{ boxShadow: '0px 2px 8px 2px rgba(0, 20, 9, 1), 0 6px 20px 0 rgba(28, 28, 28, 0.86)' }}>
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">
                  <img src={lmdblack} alt="" className="img-fluid mb-4" />
                  <h4 className="mb-3 f-w-400"><b>Log in</b></h4>

                  {loading && (
                    <div
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                      }}
                    >
                      <Spinner animation="border" variant="light" />
                    </div>
                  )}

                  {loginError && (
                    <div
                      className="position-fixed top-0 start-50 translate-middle-x mt-3"
                      style={{ zIndex: 9999, minWidth: '300px' }}
                    >
                      <Alert variant="danger" onClose={() => setLoginError('')} dismissible>
                        {loginError}
                      </Alert>
                    </div>
                  )}

                  <Form onSubmit={Auth}>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="mail" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </InputGroup>

                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="lock" />
                      </InputGroup.Text>

                      <Form.Control
                        type={show ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ borderRight: "none" }}
                      />

                      <InputGroup.Text >
                        <FeatherIcon onClick={() => setShow(!show)} style={{ cursor: "pointer" }} icon={show ? "eye-off" : "eye"} />
                      </InputGroup.Text>
                    </InputGroup>
                    <RoundedSlideButton type="submit">Signin</RoundedSlideButton>
                  </Form>
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </FadeContent>

      {/* FOOTER */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={2}
        className="text-center"
        style={{
          justifyContent: 'center',
          alignItems: 'center',

          color: '#aaa',
          zIndex: 2,
        }}
      >
        <small>
          by{' '}
          <a
            href="https://github.com/VenturaAdrian/LMD-HelpdeskSystem"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}
          >
            adriankurtventura
          </a>
        </small>

        <small>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://lepantomining.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}
          >
            lepantomining.com
          </a>
        </small>
      </Stack>
    </div>
  );
}
