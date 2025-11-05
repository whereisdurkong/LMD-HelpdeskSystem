import { useEffect, useRef, useState } from 'react';
import { Form, Button, Card, Row, Col, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddComputer() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [location, setLocation] = useState('lmd')
    const [userOptions, setUserOptions] = useState([])
    const [alluser, setAllUser] = useState([]);

    const [tag_id, setTagID] = useState('');
    const [department, setDepartment] = useState('');
    const [assign_to, setAssignTo] = useState('');
    const [password, setPassword] = useState('');
    const [ip_address, setIpAddress] = useState('');
    const [processor, setProcessor] = useState('');
    const [memory, setMemory] = useState('');
    const [storage, setStorage] = useState('');
    const [monitorBrandModel, setMonitorBrandModel] = useState('');
    const [monitorSerial, setMonitorSerial] = useState('');
    const [pms_date, setPMSDate] = useState('');
    const [description, setDescription] = useState('');


    const tagidRef = useRef();
    const deparmentRef = useRef();
    const assigntoRef = useRef();
    const passwordRef = useRef();
    const ipaddressRef = useRef();
    const processorRef = useRef();
    const memoryRef = useRef();
    const storageRef = useRef();
    const monitorBMRef = useRef();
    const monitorSerialRef = useRef();
    const pmsdateRef = useRef();
    const descriptionRef = useRef();


    const [currentUser, setCurrentUser] = useState('');
    const [fullname, setFullName] = useState('');
    const desc = 'Issue: \nWhen did it start: \nHave you tried any troubleshooting steps: \nAdditional notes: ';
    const tag = 'LMD.PC'

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
            setAllUser(allUser)

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

        if (!tag_id && !password && !ip_address && !processor && !memory && !storage && !monitorBrandModel && !monitorSerial) {
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

        if (!password) {
            setLoading(false);
            passwordRef.current.focus();
            setError('Password is required');
            return;
        }

        if (!ip_address) {
            setLoading(false);
            ipaddressRef.current.focus();
            setError('IP Address is required');
            return;
        }

        if (!processor.trim()) {
            setLoading(false);
            processorRef.current.focus();
            setError('Processor is required');
            return;
        }

        if (!memory) {
            setLoading(false);
            memoryRef.current.focus();
            setError('Memory is required');
            return;
        }

        if (!storage) {
            setLoading(false);
            storageRef.current.focus();
            setError('Storage is required');
            return;
        }
        if (!monitorBrandModel) {
            setLoading(false);
            monitorBMRef.current.focus();
            setError('Monitor Brand Model is required');
            return;
        }
        if (!monitorSerial) {
            setLoading(false);
            monitorSerialRef.current.focus();
            setError('Monitor Brand Model is required');
            return;
        }

        try {
            await axios.post(`${config.baseApi}/pms/add-computer`, {
                tag_id: tag_id,
                department: department || '',
                assign_to: assign_to || '',
                pass_word: password,
                ip_address: ip_address,
                processor: processor,
                memory: memory,
                storage: storage,
                monitor_model: monitorBrandModel,
                monitor_serial: monitorSerial,
                pms_date: pms_date || '',
                description: description || '',
                created_by: currentUser,
                assigned_location: empInfo.emp_location
            })

            setSuccess('Computer added successfully!');
            setTagID('');
            setDepartment('');
            setAssignTo('');
            setPassword('');
            setIpAddress('');
            setProcessor('');
            setMemory('');
            setStorage('');
            setMonitorBrandModel('');
            setMonitorSerial('')
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
                            <h4 className="mb-3">Add Computer</h4>
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
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Assign to</Form.Label>
                                            <Form.Select
                                                name="assign_to"
                                                value={assign_to}
                                                onChange={(e) => setAssignTo(e.target.value)}
                                                ref={assigntoRef}
                                            >
                                                <option value="">Select User</option>
                                                {alluser.map((user, idx) => (
                                                    <option key={idx} value={user.user_name}>
                                                        {`${user.emp_FirstName.charAt(0).toUpperCase() + user.emp_FirstName.slice(1).toLowerCase()} ${user.emp_LastName.charAt(0).toUpperCase() + user.emp_LastName.slice(1).toLowerCase()}`}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                ref={passwordRef}
                                            />
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
                                            <Form.Label>Proccessor</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="processor"
                                                value={processor}
                                                onChange={(e) => setProcessor(e.target.value)}
                                                ref={processorRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3" >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Memory</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="memory"
                                                value={memory}
                                                onChange={(e) => setMemory(e.target.value)}
                                                ref={memoryRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Storage</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="storage"
                                                value={storage}
                                                onChange={(e) => setStorage(e.target.value)}
                                                ref={storageRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3" >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Monitor Brand Model</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="monitor-brand-model"
                                                value={monitorBrandModel}
                                                onChange={(e) => setMonitorBrandModel(e.target.value)}
                                                ref={monitorBMRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Monitor Serial Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="monitor-serial-number"
                                                value={monitorSerial}
                                                onChange={(e) => setMonitorSerial(e.target.value)}
                                                ref={monitorSerialRef}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3" >
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

