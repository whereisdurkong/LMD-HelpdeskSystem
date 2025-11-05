
import {
  Card,
  Row,
  Col,
  Button,
  InputGroup,
  Form,
  Container,
  Alert
} from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import config from 'config';
import Spinner from 'react-bootstrap/Spinner';

import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import { Medium } from 'react-bootstrap-icons';

export default function SignUp1() {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmpassword, setConfirmPassword] = useState('');
  const [tier, setTier] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [successful, setSuccessful] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  const [loading, setLoading] = useState(false);

  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const userNameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const tierRef = useRef();
  const roleRef = useRef();
  const phoneRef = useRef();
  const locationRef = useRef();
  const departmentRef = useRef();
  const positionRef = useRef();

  const departmentOptions = {
    lmd: ['ACC', 'ASY', 'CLB', 'DEV', 'ENGR', 'ESD', 'EXP', 'GEO', 'GMS', 'HRD', 'IAD', 'IMD', 'IOSD', 'LPS', 'LSD', 'MED', 'MEG', 'MEGG', 'MES', 'MET', 'MGS', 'MIL', 'MIS', 'MME', 'MMS', 'MMT', 'MOG-PRO & DEV', 'MROR', 'MV', 'MWS', 'ORM', 'PCES', 'PED', 'PRO', 'SDD', 'SLC', 'SMED', 'SMED-ENERGY', 'SMED-TRANSPORTATION', 'TSF 5A', 'TSG'],
    corp: ['AVI', 'BLCN', 'CFA', 'CHA', 'CLS', 'CMC', 'CPD', 'ISD', 'TRE']
  };

  //loading state 2s
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Clear error and success messages after 3 seconds
  useEffect(() => {
    if (error || successful) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessful('');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, successful]);

  // Fetch user from localStorage
  useEffect(() => {
    const empInfo = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(empInfo?.user_name);
  })



  const Register = async (e) => {
    e.preventDefault();

    if (
      !firstname.trim() &&
      !lastname.trim() &&
      !username.trim() &&
      !email.trim() &&
      !password &&
      !confirmpassword &&
      !tier &&
      !role &&
      !phone &&
      !location &&
      !department &&
      !position) {
      setError('All fields are required!')
    }

    if (!firstname.trim()) {
      setError('First Name is required!');
      firstNameRef.current.focus();
      return;
    }
    if (!lastname.trim()) {
      setError('Last Name is required!');
      lastNameRef.current.focus();
      return;
    }
    if (!username.trim()) {
      setError('Username is required!');
      userNameRef.current.focus();
      return;
    }
    if (!email.trim()) {
      setError('Email is required!');
      emailRef.current.focus();
      return;
    }
    const lepantoEmailPattern = /^[a-zA-Z0-9._%+-]+@lepantomining\.com$/;
    if (!lepantoEmailPattern.test(email)) {
      setError('Email must end with @lepantomining.com');
      emailRef.current.focus();
      return;
    }

    if (!password) {
      setError('Password is required!');
      passwordRef.current.focus();
      return;
    }
    if (!confirmpassword) {
      setError('Confirm Password is required!');
      confirmPasswordRef.current.focus();
      return;
    }
    if (password !== confirmpassword) {
      setError('Passwords do not match!');
      confirmPasswordRef.current.focus();
      return;
    }
    if (!tier) {
      setError('Tier is required!');
      tierRef.current.focus();
      return;
    }
    if (!phone) {
      setError('Phone Number is required!');
      phoneRef.current.focus();
      return;
    }
    if (!role) {
      setError('Role is required!');
      roleRef.current.focus();
      return;
    }
    if (!location.trim()) {
      setError('Location is required!');
      locationRef.current.focus();
      return;
    }
    if (!department.trim()) {
      setError('Department is required!');
      departmentRef.current.focus();
      return;
    }
    if (!position.trim()) {
      setError('Position is required!');
      positionRef.current.focus();
      return;
    }

    setLoading(true);



    await axios.post(`${config.baseApi}/authentication/register`, {
      emp_firstname: firstname,
      emp_lastname: lastname,
      user_name: username,
      emp_email: email,
      pass_word: password,
      emp_tier: tier,
      emp_role: role,
      emp_phone: phone,
      emp_location: location,
      emp_department: department,
      emp_position: position,
      current_user: currentUser
    })
      .then((res) => {
        setSuccessful(
          'Registered ' +
          `${username.charAt(0).toUpperCase() +
          username.slice(1).toLowerCase()}` + ' successfully!'
        );

        try {
          if (tier === 'user') {
            e.preventDefault();

            axios.post(`${config.baseApi}/authentication/register-email`, {
              user_name: username,
              emp_email: email,
              pass_word: password,
              current_user: currentUser
            })

          }
        } catch (err) {
          console.log(err);
          setError('An error occurred. Please try again.');
          setLoading(false);
          return;
        }

        setFirstName('');
        setLastName('');
        setUserName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTier('')
        setRole('');
        setPhone('');
        setLocation('')
        setDepartment('');
        setPosition('');

        // window.location.reload()
        console.log(`User ${username} was successfully registered`)
      })
      .catch((err) => {
        if (err === 404) {
          setError('Unable to register user! Please try again.');
          console.log(`Unable to register ${username}` + err)
        } else {
          setError('Unable to register user! Please try again.');
          console.log(`Unable to register ${username}` + err)
        }

      });
  };


  return (
    <div
      className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
        padding: '20px',
        paddingTop: '100px'
      }}
    >
      <AnimatedContent
        distance={100}
        direction="vertical"
        reverse={true}
        duration={0.8}
        ease="power3.out"
        initialOpacity={0}
        animateOpacity
        scale={1.0}
        threshold={0.1}
        delay={0}
      >

        <Container >
          <Row className="justify-content-center">
            <Col xs={12} sm={11} md={10} lg={8} xl={7}>
              <Card className="shadow-lg border-0" style={{ borderRadius: '1rem' }}>
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h4 className="fw-bold">Create an Account</h4>
                  </div>

                  {error && (
                    <div
                      className="position-fixed start-50 l translate-middle-x"
                      style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                    >
                      <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                      </Alert>
                    </div>
                  )}
                  {successful && (
                    <div
                      className="position-fixed start-50 l translate-middle-x"
                      style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                    >
                      <Alert variant="success" onClose={() => setSuccessful('')} dismissible>
                        {successful}
                      </Alert>
                    </div>
                  )}

                  <Form onSubmit={Register}>
                    <Row>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FeatherIcon icon="user" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="First Name"
                            value={firstname}
                            onChange={(e) => setFirstName(e.target.value)}
                            ref={firstNameRef}
                          />
                        </InputGroup>
                      </Col>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FeatherIcon icon="user" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Last Name"
                            value={lastname}
                            onChange={(e) => setLastName(e.target.value)}
                            ref={lastNameRef}
                          />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Form.Label>Username</Form.Label>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="user" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                        ref={userNameRef}
                      />
                    </InputGroup>

                    <Form.Label>Email Address</Form.Label>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="mail" />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        ref={emailRef}
                      />
                    </InputGroup>

                    <Row>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FeatherIcon icon="lock" />
                          </InputGroup.Text>
                          <Form.Control
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ref={passwordRef}
                          />
                        </InputGroup>
                      </Col>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FeatherIcon icon="lock" />
                          </InputGroup.Text>
                          <Form.Control
                            type="password"
                            placeholder="Confirm"
                            value={confirmpassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            ref={confirmPasswordRef}
                          />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>Tier</Form.Label>
                        <InputGroup className="mb-3">
                          <InputGroup.Text>
                            <FeatherIcon icon="users" />
                          </InputGroup.Text>
                          <Form.Select
                            value={tier}
                            onChange={(e) => setTier(e.target.value)}
                            ref={tierRef}
                          >
                            <option value="">Select Position</option>
                            <option value="helpdesk">Help Desk</option>
                            <option value="user">User</option>
                          </Form.Select>
                        </InputGroup>
                      </Col>
                      <Col xs={12} sm={6} className="mb-3">
                        <Form.Label>Local Phone</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FeatherIcon icon="phone" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Local Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            ref={phoneRef}
                          />
                        </InputGroup>
                      </Col>
                    </Row>


                    <Form.Label>Role</Form.Label>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="users" />
                      </InputGroup.Text>
                      <Form.Select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        ref={roleRef}
                      >
                        <option value="">Select Role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </InputGroup>

                    <Row>
                      <Col xs={12} sm={6} className="mb-2">
                        <Form.Label>Location</Form.Label>
                        <InputGroup className="mb-3">
                          <InputGroup.Text>
                            <FeatherIcon icon="globe" />
                          </InputGroup.Text>
                          <Form.Select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            ref={locationRef}
                          >
                            <option value="">Select Location</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">Corp</option>
                          </Form.Select>
                        </InputGroup>
                      </Col>
                      <Col xs={12} sm={6} className="mb-2">
                        <Form.Label>Department</Form.Label>
                        <InputGroup className="mb-3">
                          <InputGroup.Text>
                            <FeatherIcon icon="briefcase" />
                          </InputGroup.Text>
                          <Form.Select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            ref={departmentRef}
                          >
                            <option value="">Select Department</option>
                            {departmentOptions[location]?.map((dept, idx) => (
                              <option key={idx} value={dept}>{dept}</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                      </Col>
                    </Row>

                    <Form.Label>Position</Form.Label>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FeatherIcon icon="activity" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        ref={positionRef}
                      />
                    </InputGroup>

                    <Button type="submit" className="btn btn-block btn-primary mt-4 w-100 mb-3">
                      Sign Up
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </AnimatedContent>
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
    </div>
  );
}


// ticket_subject: any random helpdesk concern

// ticket_status: open
// ticket_urgencyLevel: low or high or critical or medium 
// ticket_type: request or incident or inquiry
// ticket_category: Hardware, network, software, system
// ticket_SubCategory: incident: {
//   hardware: [
//     "Desktop",
//     "Laptop",
//     "Monitor",
//     "Printer",
//     "Scanner",
//     "Printer/Scanner Combo",
//     "Peripherals (Keyboard, Mouse, Webcam, External Drive)",
//     "Docking Station",
//     "Projector",
//     "Fax Machine",
//     "Telephone",
//     "Server Hardware",
//     "UPS (Uninterruptible Power Supply)",
//     "Cabling & Ports",
//     "Others",
//   ],
//     network: [
//       "Internet Connectivity",
//       "Wi-Fi",
//       "LAN (Local Area Network)",
//       "WAN (Wide Area Network)",
//       "Server Access",
//       "Network Printer/Scanner",
//       "VPN Connection",
//       "Firewall",
//       "Router/Switch Configuration",
//       "MPLS",
//       "ISP",
//       "Network Security (Intrusion Detection/Prevention)",
//       "Bandwidth Issues",
//       "Others",
//     ],
//       software: [
//         "Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)",
//         "Email (Setup, Creation, Error, Backup)",
//         "Active Directory (User Creation, Login, Password)",
//         "Zoom / Video Conferencing Tools",
//         "FoxPro (Accounting System)",
//         "GEMCOM",
//         "SURPAC",
//         "FTP (Access Creation, Change Password)",
//         "PDF (Conversion, Reduce Size, Editing)",
//         "Antivirus / Security Software",
//         "Operating System (Windows, macOS, Linux)",
//         "Cloud Services (OneDrive, Google Drive, Dropbox)",
//         "Others",
//       ],
//         system: [
//           "Oracle (PROD/BIPUB)",
//           "System Updates & Patches",
//           "Backup & Restore Tools",
//           "CCTV Incident Report System",
//           "Safety Accident Report System",
//           "Compliance Registry System",
//           "Information Management System (Comrel)",
//           "Lepanto IT Help Desk System",
//           "Others"
//         ]
// },
// request: {
//   hardware: [
//     "New Laptop Request",
//     "New Monitor Request",
//     "Printer Installation",
//     "Additional Peripherals",
//     "Hardware Upgrade",
//     "Others",
//   ],
//     network: [
//       "New VPN Access",
//       "Firewall Rule Request",
//       "New Router/Switch Setup",
//       "Bandwidth Upgrade",
//       "ISP Request",
//       "Others",
//     ],
//       software: [
//         "New Software Installation",
//         "License Renewal",
//         "User Account Creation",
//         "Database Access Request",
//         "Cloud Storage Request",
//         "Others",
//       ],
//         system: [
//           "New Account",
//           "Delete Account",
//           "Edit Account",
//           "Request Access",
//           "Others"
//         ]
// },
// inquiry: {
//   hardware: ["Warranty Inquiry", "Specs Inquiry", "Others"],
//     network: ["Network Policy Inquiry", "Coverage Inquiry", "Others"],
//       software: ["Software Policy Inquiry", "Version Inquiry", "Others"],
//         system: ["System Policy Inquiry", "Assistance", "Others"]
// },

// asset_number: random LMD - 7825
// Description: any description with three sentence
// created_at: new Date()
// is_active: 1
// assigned_location: lmd or corp

// created_by: [martin
// piper
// pong
// ruaa
// majong
// ilsa
// durkong
// johndoe
// sarah
// 12345
// liam
// sophia
// noah
// olivia
// james
// emma
// lucas
// ava
// mason
// ella
// ethan
// isabella
// benjamin
// mia
// jacob
// charlotte
// william
// amelia
// henry
// harper
// alexander
// evelyn
// sebastian
// abigail
// jack
// emily
// logan
// grace
// aiden
// scarlett
// david
// madison
// joseph
// victoria
// samuel
// hannah
// daniel
// natalie
// anthony
// chloe
// elijah
// zoe
// matthew
// layla
// wyatt
// penelope
// dylan
// luna
// nathan]


