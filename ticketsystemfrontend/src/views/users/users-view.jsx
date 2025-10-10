import { useEffect, useState, useRef } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    InputGroup,
    Form,
    Container,
    Alert,
    Modal
} from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import FeatherIcon from 'feather-icons-react';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import Spinner from 'react-bootstrap/Spinner';

export default function UsersView() {
    const user_id = new URLSearchParams(window.location.search).get('id');

    const [userInfo, setUserInfo] = useState({});
    const [firstName, setFirstName] = useState('');
    const [lastname, setLastName] = useState('');
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [tier, setTier] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [createdAt, setCreatedAt] = useState('');

    const firstNameRef = useRef();
    const lastNameRef = useRef();
    const userNameRef = useRef();
    const emailRef = useRef();
    const tierRef = useRef();
    const phoneRef = useRef();
    const roleRef = useRef();
    const locationRef = useRef();
    const departmentRef = useRef();
    const positionRef = useRef();

    const [error, setError] = useState('');
    const [successful, setSuccessful] = useState('');

    const [perror, setPError] = useState('');
    const [psuccessful, setPSuccessful] = useState('');

    const [loading, setLoading] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [showchangePassword, setShowChangePassword] = useState(false)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const newPasswordRef = useRef();
    const confirmPasswordRef = useRef();

    const departmentOptions = {
        lmd: ['MISD', 'HR', 'IOSD', 'SMED', 'Mill', 'IMD', 'PCES', 'MOG', 'Accounting', 'Expolartion', 'Assay'],
        corp: ['Legal', 'Accounting', 'Executive', 'HRAD', 'Treasury', 'MISD']
    };

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
            }, 3000);
            return () => clearTimeout(timer);
        }

        if (perror || psuccessful) {
            const timer = setTimeout(() => {
                setPError('');
                setPSuccessful('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successful, perror, psuccessful]);

    useEffect(() => {
        const current_user = JSON.parse(localStorage.getItem('user'));
        console.log(current_user.user_name)
        const fetchUserInfo = async () => {
            try {
                const response = await axios.get(`${config.baseApi}/authentication/get-by-id`, {
                    params: { user_id }
                });
                const data = response.data;
                setUserInfo(data);

                // Pre-fill form fields
                setFirstName(data.emp_FirstName || '');
                setLastName(data.emp_LastName || '');
                setUserName(data.user_name || '');
                setEmail(data.emp_email || '');
                setTier(data.emp_tier || '');
                setPhone(data.emp_phone || '');
                setRole(data.emp_role || '');
                setLocation(data.emp_location || '');
                setDepartment(data.emp_department || '');
                setPosition(data.emp_position || '');
                setCreatedAt(data.created_at || '');
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        fetchUserInfo();
    }, [user_id]);

    const UpdateForm = async (e) => {
        e.preventDefault();

        const current_user = JSON.parse(localStorage.getItem('user'));

        const updatedUser = {
            user_id: user_id, // make sure this is coming from URL or state
            emp_FirstName: firstName,
            emp_LastName: lastname,
            user_name: username,
            emp_email: email,
            emp_tier: tier,
            emp_phone: phone,
            emp_role: role,
            emp_location: location,
            emp_department: department,
            emp_position: position,
            updated_by: current_user.user_name
        };

        try {
            setLoading(true)
            const response = await axios.post(`${config.baseApi}/authentication/update-user`, updatedUser);
            console.log("Update response:", response.data);

            setSuccessful('User updated successfully!');
            window.location.reload();



        } catch (error) {
            console.error("Error updating user:", error);
            setLoading(false)
            setError('Failed to update user. Please try again.');
        }
    };

    const DeleteUser = async () => {
        const current_user = JSON.parse(localStorage.getItem('user'));
        try {
            setLoading(true)
            await axios.post(`${config.baseApi}/authentication/delete-user`, {
                user_id: user_id,
                deleted_by: current_user.user_name
            });
            setSuccessful('User deleted successfully!');
            window.location.replace('/ticketsystem/users');
        } catch (err) {
            console.error("Error deleting user:", err);
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!newPassword) {
            setPError('Password is empty!');
            newPasswordRef.current.focus()
            return;
        }
        if (!confirmPassword) {
            setPError("Confirm Password is empty!");
            confirmPasswordRef.current.focus()
            return;
        }
        if (newPassword !== confirmPassword) {
            setPError("Password does not match!");
            return;
        }
        setLoading(true)

        try {
            await axios.post(`${config.baseApi}/authentication/edit-password`, {
                user_id: user_id,
                new_password: newPassword
            })

            setShowChangePassword(false)
            setPSuccessful('Successfullly changed your password')
            window.location.replace(`/ticketsystem/users-view?id=${user_id}`)
        } catch (err) {
            console.log(err);
            setShowChangePassword(false)
            setPError('Unable to change the password!')
        }

    }


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
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                                        <div className="text-center">
                                            <h4 className="fw-bold">User Details</h4>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
                                            <div title="Delete User" style={{ cursor: 'pointer', color: '#dc3545', alignItems: 'center', paddingRight: '10px' }} onClick={() => setShowDeleteModal(true)}>
                                                <FeatherIcon icon="trash-2" />
                                            </div>
                                            <div title="Change Password" style={{ cursor: 'pointer', color: '#005a14ff', alignItems: 'center' }} onClick={() => setShowChangePassword(true)}>
                                                <FeatherIcon icon="lock" />
                                            </div>
                                        </div>

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

                                    <Form onSubmit={UpdateForm}>
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
                                                        value={firstName}
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
                                                        <option value="">Select Tier</option>
                                                        <option value="helpdesk">Help desk</option>
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
                                        <Form.Label>Created At</Form.Label>
                                        <InputGroup className="mb-3">
                                            <InputGroup.Text>
                                                <FeatherIcon icon="clock" />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Created At"
                                                value={new Date(createdAt).toLocaleString()}
                                                disabled
                                            />
                                        </InputGroup>

                                        <Button type="submit" className="btn btn-block btn-primary mt-4 w-100 mb-3">
                                            Update
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>

            </AnimatedContent>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this user? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant='danger' onClick={DeleteUser}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showchangePassword} onHide={() => setShowChangePassword(false)} centered>
                {perror && (
                    <div
                        className="position-fixed start-50 l translate-middle-x"
                        style={{ top: '200px', zIndex: 9999, minWidth: '300px' }}
                    >
                        <Alert variant="danger" onClose={() => setPError('')} dismissible>
                            {perror}
                        </Alert>
                    </div>
                )}
                {psuccessful && (
                    <div
                        className="position-fixed start-50 l translate-middle-x"
                        style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                    >
                        <Alert variant="success" onClose={() => setPSuccessful('')} dismissible>
                            {psuccessful}
                        </Alert>
                    </div>
                )}
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
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
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowChangePassword(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleChangePassword}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>




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
