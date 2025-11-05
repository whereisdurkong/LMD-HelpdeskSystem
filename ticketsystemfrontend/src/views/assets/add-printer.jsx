import { useEffect, useRef, useState } from 'react';
import { Form, Button, Card, Row, Col, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddPrinter() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [location, setLocation] = useState('lmd')
    const [userOptions, setUserOptions] = useState([])

    const [tag_id, setTagID] = useState('');
    const [department, setDepartment] = useState('');
    const [assign_to, setAssignTo] = useState('');
    const [ip_address, setIpAddress] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');

    const [pms_date, setPMSDate] = useState('');
    const [description, setDescription] = useState('');


    const tagidRef = useRef();
    const deparmentRef = useRef();
    const assigntoRef = useRef();
    const ipaddressRef = useRef();
    const modelRef = useRef();
    const serialRef = useRef();
    const descriptionRef = useRef();


    const [currentUser, setCurrentUser] = useState('');
    const [fullname, setFullName] = useState('');

    const tag = 'LMD.PRT'

    const departmentOptions = {
        lmd: ['ACC', 'ASY', 'CLB', 'DEV', 'ENGR', 'ESD', 'EXP', 'GEO', 'GMS', 'HRD', 'IAD', 'IMD', 'IOSD', 'LPS', 'LSD', 'MED', 'MEG', 'MEGG', 'MES', 'MET', 'MGS', 'MIL', 'MIS', 'MME', 'MMS', 'MMT', 'MOG-PRO & DEV', 'MROR', 'MV', 'MWS', 'ORM', 'PCES', 'PED', 'PRO', 'SDD', 'SLC', 'SMED', 'SMED-ENERGY', 'SMED-TRANSPORTATION', 'TSF 5A', 'TSG'],
        corp: ['AVI', 'BLCN', 'CFA', 'CHA', 'CLS', 'CMC', 'CPD', 'ISD', 'TRE']
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
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    //HD full name
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const Fullname = empInfo.user_name;
        setCurrentUser(Fullname);
        setLocation(empInfo.emp_location);


        const first = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();
        const last = empInfo.emp_LastName.charAt(0).toUpperCase() + empInfo.emp_LastName.slice(1).toLowerCase();
        setFullName(first + ' ' + last);

        setTagID(tag)

    }, []);

    //Fetch All users
    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get(`${config.baseApi}/authentication/get-all-users`);
            const data = res.data || [];

            const allUser = data.filter(s => s.emp_tier === 'user')

            const allUsernames = allUser.map(u => {
                const fname = u.emp_FirstName;
                const lname = u.emp_LastName;
                const first = fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
                const last = lname.charAt(0).toUpperCase() + lname.slice(1).toLowerCase();
                return first + ' ' + last
            });
            setUserOptions(allUsernames)
        }
        fetch();
    }, [])





    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true)

        const empInfo = JSON.parse(localStorage.getItem('user'));

        if (!tag_id && !model && !serial && !ip_address) {
            setLoading(false)
            setError('All Fields are required! please try again! ')
            return
        }

        if (!tag_id) {
            setLoading(false);
            tagidRef.current.focus();
            setError('Tag ID is required');
            return;
        }

        if (tag_id === tag) {
            setLoading(false);
            tagidRef.current.focus();
            setError('Tag ID is required');
            return;
        }


        if (!ip_address) {
            setLoading(false);
            ipaddressRef.current.focus();
            setError('IP Address is required');
            return;
        }
        if (!model) {
            setLoading(false);
            modelRef.current.focus();
            setError('Model is required');
            return;
        }
        if (!serial) {
            setLoading(false);
            serialRef.current.focus();
            setError('Serial is required');
            return;
        }

        console.log(tag_id, department, assign_to, ip_address, model, serial, pms_date, description);

        try {
            await axios.post(`${config.baseApi}/pms/add-printer`, {
                tag_id: tag_id,
                department: department || '',
                assign_to: assign_to || '',
                ip_address: ip_address,
                model: model,
                serial: serial,
                pms_date: pms_date || '',
                description: description || '',
                created_by: currentUser,
                assigned_location: empInfo.emp_location
            })

            setSuccess('Laptop added successfully!');
            setTagID('');
            setDepartment('');
            setAssignTo('');

            setIpAddress('');
            setModel('');
            setSerial('');
            setPMSDate('');
            setDescription('');
            setLoading(false)

            window.location.replace('/ticketsystem/assets')
        } catch (err) {
            console.log(err);
            setError('An error occurred while submitting the form. Please try again.');
            setLoading(false);
            return;
        }





    };

    return (
        <Container fluid className="pt-100" style={{ background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
            {error && (
                <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
                    <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>
                </div>
            )}
            {success && (
                <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
                    <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>
                </div>
            )}

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

                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        <Card className="p-4 shadow-sm">
                            <h4 className="mb-3">Add Printer</h4>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col xs={12} md={6}>
                                        {/* Tag ID */}
                                        <Form.Group>
                                            <Form.Label>Tag ID</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="tag_id"
                                                value={tag_id}
                                                onChange={(e) => setTagID(e.target.value)}
                                                ref={tagidRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Department</Form.Label>
                                            <Form.Select
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                ref={deparmentRef}
                                            >
                                                <option value="">Select Department</option>
                                                {departmentOptions[location]?.map((dept, idx) => (
                                                    <option key={idx} value={dept}>{dept}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-3" >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Assign to</Form.Label>
                                            <Form.Select
                                                type="text"
                                                name="assign_to"
                                                value={assign_to}
                                                onChange={(e) => setAssignTo(e.target.value)}
                                                ref={assigntoRef}
                                            >
                                                <option value="">Select User</option>
                                                {userOptions.map((user, idx) => (
                                                    <option key={idx} value={user}>{user}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                </Row>

                                <Row className="mb-3" >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>IP Address</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ip_address"
                                                value={ip_address}
                                                onChange={(e) => setIpAddress(e.target.value)}
                                                ref={ipaddressRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Model</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="model"
                                                value={model}
                                                onChange={(e) => setModel(e.target.value)}
                                                ref={modelRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3" >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Serial</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="serial"
                                                value={serial}
                                                onChange={(e) => setSerial(e.target.value)}
                                                ref={serialRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group className="mb-3" style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Form.Label
                                                style={{

                                                    fontSize: '14px',
                                                    marginBottom: '6px'
                                                }}
                                            >
                                                PMS Date
                                            </Form.Label>
                                            <DatePicker
                                                selected={pms_date}
                                                onChange={(date) => setPMSDate(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className="form-control"
                                                placeholderText="Select date"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>


                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        ref={descriptionRef}
                                    />

                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Created By</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="created_by"
                                        value={fullname}
                                        disabled
                                    />
                                </Form.Group>

                                <div className="text-end">
                                    {/* <Button variant="primary" type="submit">Submit Ticket</Button> */}
                                    <BTN type="submit" label={'Submit Ticket'}></BTN>
                                </div>
                            </Form>
                        </Card>
                    </Col>
                </Row>
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
        </Container>
    );
}

