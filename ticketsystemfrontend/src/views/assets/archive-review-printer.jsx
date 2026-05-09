import { useEffect, useRef, useState } from 'react';
import { Form, Card, Row, Col, Container, Alert, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FeatherIcon from 'feather-icons-react';
import AssetLogs from './asset-logs';

export default function ArchiveReviewPrinter() {
    const pms_id = new URLSearchParams(window.location.search).get('id');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [location, setLocation] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    const [userOptions, setUserOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [tag_id, setTagID] = useState('');
    const [department, setDepartment] = useState('');
    const [assign_to, setAssignTo] = useState('');
    const [ip_address, setIpAddress] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [pms_date, setPMSDate] = useState('');
    const [date_purchased, setDatePurchased] = useState('');
    const [description, setDescription] = useState('');
    const [originalData, setOriginalData] = useState({});
    const [changedFields, setChangedFields] = useState({});
    const empInfo = JSON.parse(localStorage.getItem('user'));
    const [lockModal, setLockModal] = useState(false)
    const [lockError, setLockError] = useState('')

    const tagidRef = useRef();
    const deparmentRef = useRef();
    const assigntoRef = useRef();
    const ipaddressRef = useRef();
    const pmsdateRef = useRef();
    const descriptionRef = useRef();
    const datepurchasedRef = useRef();
    const [currentUser, setCurrentUser] = useState('');
    const [fullname, setFullName] = useState('');

    //All Departments
   const departmentOptions = {
    lmd: ['ACC', 'ASY', 'CLB', 'DEV', 'ENGR', 'ESD', 'EXP', 'GEO', 'GMS', 'HRD', 'IAD', 'IMD', 'IOSD', 'LPS', 'LSD', 'MED', 'MEG', 'MEGG', 'MES', 'MET', 'MGS', 'MIL', 'MIS', 'MME', 'MMS', 'MMT', 'MOG-PRO & DEV', 'MROR', 'MV', 'MWS', 'ORM', 'PCES', 'PED', 'PRO', 'RND', 'SDD', 'SLC', 'SMED', 'SMED-ENERGY', 'SMED-TRANSPORTATION', 'TSF 5A', 'TSG'],
    corp: ['AVI', 'BLCN', 'CFA', 'CHA', 'CLS', 'CMC', 'CPD', 'ISD', 'TRE']
  };


    //Loading state 2s
    // useEffect(() => {
    //     if (loading) {
    //         const timer = setTimeout(() => {
    //             setLoading(false);
    //         }, 2000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [loading]);

    //Allert State 3s
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Fetch Desktop Details
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
                const data = res.data;

                setTagID(data.tag_id || '');
                setDepartment(data.department || '');
                setAssignTo(data.assign_to || '');
                setIpAddress(data.ip_address || '');
                setModel(data.model || '');
                setSerial(data.serial || '');
                setPMSDate(data.pms_date ? new Date(data.pms_date).toLocaleString() : '');
                setDatePurchased(data.date_purchased ? new Date(data.date_purchased).toLocaleString() : '');
                setDescription(data.description || '');
                setCurrentUser(data.created_by || '');
                setLocation(data.assigned_location || '');

                // Store original data
                setOriginalData({
                    tag_id: data.tag_id || '',
                    department: data.department || '',
                    assign_to: data.assign_to || '',

                    ip_address: data.ip_address || '',
                    model: data.model || '',
                    serial: data.serial || '',
                    date_purchased: data.date_purchased ? new Date(data.date_purchased).toLocaleString() : '',
                    pms_date: data.pms_date ? new Date(data.pms_date).toLocaleString() : '',
                    description: data.description || '',
                    assigned_location: data.assigned_location || ''
                });
            } catch (err) {
                console.log(err);
                setError('An error occurred while fetching the printer details. Please try again.');
            }
        };
        fetch();
    }, [pms_id]);

    // Fetch all users
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/authentication/get-all-users`);
                const data = res.data || [];
                const allUser = data.filter(s => s.emp_tier === 'user');

                const allUsernames = allUser.map(u => {
                    const fname = u.emp_FirstName;
                    const lname = u.emp_LastName;
                    const first = fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
                    const last = lname.charAt(0).toUpperCase() + lname.slice(1).toLowerCase();
                    return first + ' ' + last;
                });
                setUserOptions(allUsernames);
            } catch (err) {
                console.log('Unable to get all users: ', err)
            }
        };
        fetch();
    }, []);

    // HD full name
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/authentication/get-by-username`, { params: { user_name: currentUser } });
                const user = res.data?.data || res.data || {};

                const first = user.emp_FirstName
                    ? user.emp_FirstName.charAt(0).toUpperCase() + user.emp_FirstName.slice(1).toLowerCase()
                    : "";
                const last = user.emp_LastName
                    ? user.emp_LastName.charAt(0).toUpperCase() + user.emp_LastName.slice(1).toLowerCase()
                    : "";
                setFullName(first + ' ' + last);
            } catch (err) {
                console.log(err);
                setError('An error occurred while fetching the user details. Please try again.');
            }
        };
        if (currentUser) fetch();
    }, [currentUser]);

    // Compare function to detect changed fields
    const getChangedFields = () => {
        const currentData = {
            tag_id,
            department,
            assign_to,
            ip_address,
            model,
            serial,
            date_purchased,
            pms_date,
            description,
            assigned_location: location
        };

        const changed = {};
        for (const key in currentData) {
            if (currentData[key] !== originalData[key]) {
                changed[key] = {
                    old: originalData[key],
                    new: currentData[key]
                };
            }
        }
        return changed;
    };

    //Before update check lock
    const updateBTNChecker = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
            const asset = res.data;

            if (asset.is_lock === "1" && asset.lock_by !== empInfo.user_name) {
                console.log('!!!!!!!!!!')
                setError('Unable to update! Someone is working on this asset, please try again later.')
                return

            } else if (asset.is_lock === "0" || asset.is_lock === null) {
                console.log('????????????')
                handleUpdate();
                return;
            } else {
                console.log('????????????')
                handleUpdate(e);
                return;
            }
        } catch (err) {
            console.log('Unable fetch printer details: ', err)
        }

    }

    //Update Function
    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const empInfo = JSON.parse(localStorage.getItem('user'));
        const detectedChanges = getChangedFields();

        setChangedFields(detectedChanges);

        const changeSentences = Object.entries(detectedChanges).map(([key, value]) => {
            return `${key.replace(/_/g, ' ')} changed from "${value.old || 'empty'}" to "${value.new || 'empty'}" by ${empInfo.user_name}`;
        });

        const changeSummary = changeSentences.join(', ');
        console.log(`Changes made: ${changeSummary}`);

        //check empty fields
        if (!tag_id || !ip_address || !location) {
            setLoading(false);
            setError('Please fill in all required fields.');
            return;
        }

        if (Object.keys(detectedChanges).length === 0) {
            setLoading(false);
            setError('No fields have been changed.');
            return;
        }

        const updateDesktop = {
            pms_id,
            tag_id,
            department,
            assign_to,
            ip_address,
            model,
            serial,
            pms_date,
            date_purchased,
            description,
            assigned_location: location,
            updated_by: empInfo.user_name,
            changes_made: changeSummary
        };

        try {
            await axios.post(`${config.baseApi}/pms/update-laptop`, updateDesktop);
            setSuccess('User updated successfully!');
            window.location.replace('/ticketsystem/assets');
        } catch (err) {
            console.log(err);
            setLoading(false);
            setError('An error occurred while updating the printer. Please try again.');
            return;
        }


    };

    //Before delete check lock
    const showDeleteModalChecker = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        try {
            const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
            const asset = res.data;

            if (asset.is_lock === "1" && asset.lock_by !== empInfo.user_name) {
                console.log('!!!!!!!!!!')
                setError('Unable to delete! Someone is working on this asset, please try again later.')
                setShowDeleteModal(false)
            } else if (asset.is_lock === "0" || asset.is_lock === null) {
                console.log('????????????')
                setShowDeleteModal(true)
            } else {
                console.log('????????????')
                setShowDeleteModal(true)
            }
        } catch (err) {
            console.log('Unable fetch printer details: ', err)
        }
    }

    //Delete Function
    const handleDelete = async () => {
        const current_user = JSON.parse(localStorage.getItem('user'));

        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/pms/delete-computer`, {
                pms_id: pms_id,
                tag_id: tag_id,
                created_by: current_user.user_name
            });

            setSuccess('Printer deleted successfully!');
            setShowDeleteModal(false);
            window.location.replace('/ticketsystem/assets');
        } catch (err) {
            console.log(err);
            setLoading(false);
            setError('An error occurred while deleting the printer. Please try again.');
            return;
        }
    }

    //Before archive check lock
    const showArhciveModalChecker = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        try {
            const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
            const asset = res.data;

            if (asset.is_lock === "1" && asset.lock_by !== empInfo.user_name) {
                console.log('!!!!!!!!!!')
                setError('Unable to archive! Someone is working on this asset, please try again later.')
                setShowArchiveModal(false)
            } else if (asset.is_lock === "0" || asset.is_lock === null) {
                console.log('????????????')
                setShowArchiveModal(true)
            } else {
                console.log('????????????')
                setShowArchiveModal(true)
            }
        } catch (err) {
            console.log('unable to fetch printer details: ', err)
        }
    }

    //Archive Function
    const handleArchive = async () => {
        const current_user = JSON.parse(localStorage.getItem('user'));

        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/pms/un-archive-device`, {
                pms_id,
                updated_by: current_user.user_name,
            })

            setSuccess('Successfully Archived asset')
            window.location.replace('/ticketsystem/assets')
        } catch (err) {
            console.log(err);
            setLoading(false);
            setError('An error occurred while deleting the printer. Please try again.');
            return;
        }
    }

    //Before logs check lock
    const HandleLogs = async () => {
        try {
            const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
            const asset = res.data;

            if (asset.is_lock === "1" && asset.lock_by !== empInfo.user_name) {
                console.log('!!!!!!!!!!')
                setError('Unable to view! Someone is working on this asset, please try again later.')

            } else if (asset.is_lock === "0" || asset.is_lock === null) {
                console.log('????????????')
                setModalTitle('Pms Logs');
                setModalContent(<AssetLogs pms_id={pms_id} />);
                setShowModal(true)
            } else {
                console.log('????????????')
                setModalTitle('Pms Logs');
                setModalContent(<AssetLogs pms_id={pms_id} />);
                setShowModal(true)
            }
        } catch (err) {
            console.log('Unable to fetch printer details: ', err);
        }


    }

    // Lock / unlock feature
    useEffect(() => {
        if (!pms_id || !empInfo?.user_name) return;

        const currentUser = empInfo.user_name;
        const currentTicketId = pms_id;
        // Try to lock the asset
        const tryLock = async () => {
            try {
                const res = await axios.post(`${config.baseApi}/pms/lock`, {
                    pms_id: currentTicketId,
                    lock_by: currentUser
                });
                console.log(res.data.message);
            } catch (err) {
                setTimeout(() => {
                    setLockModal(true);
                }, 10000);

                const message = err.response?.data?.message || "Asset locked by another user.";
                setLockError(message);
                // setLockModal(true);
            }
        };

        tryLock();

        // Unlock on close / refresh
        const handleUnload = () => {
            const payload = JSON.stringify({
                pms_id: currentTicketId,
                lock_by: currentUser
            });
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(`${config.baseApi}/pms/unlock`, blob);
        };

        window.addEventListener("beforeunload", handleUnload);

        // Periodically check the lock status (every 5 seconds)
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id } });
                const asset = res.data;
                if (asset.is_lock === '1' && asset.lock_by !== currentUser) {
                    setLockModal(true);
                    setLockError(`${asset.lock_by} is currently reviewing this asset.`);
                } else {
                    setLockModal(false);
                    setClose(true);
                }
            } catch (err) {
                console.log('Unable to update lock: ', err)
            }

        }, 1000);


        // Cleanup
        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleUnload);
            axios.post(`${config.baseApi}/pms/unlock`, { pms_id: currentTicketId, lock_by: currentUser }).catch(() => { });
        };
    }, [pms_id, empInfo]);

    //once page was open it will check if assets is lock or no
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-printer-by-id`, { params: { pms_id: pms_id } });
                // const assets = res.data;

                const assets = Array.isArray(res.data) ? res.data[0] : res.data;

                if (assets.is_lock === '0' || assets.lock_by === currentUser || assets.lock_by === null) {
                    setLockModal(false)
                }
                else {
                    console.log("LOCKED")
                    setLockModal(true)
                }
            } catch (err) {
                console.log('Unable to fetch printer details: ', err);
            }

        }
        fetch();
    }, [])

    return (
        <Container fluid className="pt-100" style={{ background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Alert Components */}
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
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: '10px',
                                }}>
                                <div className="text-start">
                                    <h4 style={{ margin: 0 }}>Archive Review Printer</h4>
                                    <h6
                                        title='asset logs'
                                        style={{
                                            margin: 0,
                                            cursor: 'pointer',
                                            textDecoration: "underline",
                                            color: '#005300ff',
                                            textDecorationColor: "#005300ff",
                                        }}
                                        onClick={HandleLogs}
                                    >
                                        view {tag_id} logs
                                    </h6>
                                </div>
                                {/* Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
                                    <div
                                        title="Unarchive"
                                        style={{
                                            cursor: 'pointer',
                                            color: '#005300ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingRight: '10px',
                                        }}
                                        onClick={() => showArhciveModalChecker()}
                                    >
                                        <FeatherIcon icon="archive" />
                                    </div>

                                    <div
                                        title="Delete"
                                        style={{
                                            cursor: 'pointer',
                                            color: '#dc3545',
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingRight: '10px',
                                        }}
                                        onClick={() => showDeleteModalChecker()}
                                    >
                                        <FeatherIcon icon="trash-2" />
                                    </div>
                                </div>
                            </div>


                            <Form onSubmit={updateBTNChecker}>
                                <Row className="mb-3">
                                    <h6 className="text-muted fw-semibold mt-4 mb-2">Basic Asset Information</h6>

                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Tag ID</Form.Label>
                                            <Form.Control type="text" value={tag_id} onChange={(e) => setTagID(e.target.value)} ref={tagidRef} disabled={!close} />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Department</Form.Label>
                                            <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)} ref={deparmentRef} disabled={!close}>
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
                                            <Form.Select value={assign_to} onChange={(e) => setAssignTo(e.target.value)} ref={assigntoRef} disabled={!close}>
                                                <option value="">Select User</option>
                                                {userOptions.map((user, idx) => (
                                                    <option key={idx} value={user}>{user}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Location</Form.Label>
                                            <Form.Select value={location} onChange={(e) => setLocation(e.target.value)} disabled={!close}>
                                                <option value="">Select Location</option>
                                                <option value="lmd">LMD</option>
                                                <option value="corp">CORP</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <h6 className="text-muted fw-semibold mt-4 mb-2">Hardware Specifications</h6>

                                <Row className="mb-3">
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>IP Address</Form.Label>
                                            <Form.Control type="text" value={ip_address} onChange={(e) => setIpAddress(e.target.value)} ref={ipaddressRef} disabled={!close} />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Brand Model</Form.Label>
                                            <Form.Control type="text" value={model} onChange={(e) => setModel(e.target.value)} disabled={!close} />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Serial Number</Form.Label>
                                            <Form.Control type="text" value={serial} onChange={(e) => setSerial(e.target.value)} disabled={!close} />
                                        </Form.Group>
                                    </Col>

                                </Row>
                                <h6 className="text-muted fw-semibold mt-4 mb-2">Purchase & Maintenance Details</h6>

                                <Row className="mb-3">
                                    <Col xs={12} md={6}>
                                        <Form.Group className="mb-3" style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Form.Label style={{ fontSize: '14px', marginBottom: '6px' }}>
                                                PMS Date
                                            </Form.Label>
                                            <DatePicker
                                                selected={pms_date ? new Date(pms_date) : null}
                                                onChange={(date) => setPMSDate(date?.toLocaleString())}
                                                dateFormat="yyyy-MM-dd"
                                                className="form-control"
                                                disabled={!close}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Form.Label style={{ fontSize: '14px', marginBottom: '6px' }}>
                                                Date Purchased
                                            </Form.Label>
                                            <DatePicker
                                                placeholderText='Pick date'
                                                selected={date_purchased ? new Date(date_purchased) : null}
                                                onChange={(date) => setDatePurchased(date?.toLocaleString())}
                                                dateFormat="yyyy-MM-dd"
                                                className="form-control"
                                                disabled={!close}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control as="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} ref={descriptionRef} disabled={!close} />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Created By</Form.Label>
                                    <Form.Control type="text" value={fullname} disabled />
                                </Form.Group>

                                <div className="text-end">
                                    <BTN type="submit" label={'Update Printer'} />
                                </div>

                                {/* display of changed fields */}
                                {/* {Object.keys(changedFields).length > 0 && (
                                    <div className="mt-3">
                                        <h6>Changed Fields:</h6>
                                        <ul>
                                            {Object.entries(changedFields).map(([key, value]) => (
                                                <li key={key}>
                                                    <strong>{key}:</strong>{' '}
                                                    <span style={{ color: 'red' }}>{value.old || '—'}</span> →{' '}
                                                    <span style={{ color: 'green' }}>{value.new || '—'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )} */}
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </AnimatedContent>

            {/* Lock Modal */}
            <Modal show={lockModal} onHide={() => setLockModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Attention! </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="userResolution">
                        <Form.Label>{lockError}</Form.Label>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setLockModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setLockModal(false)}
                    >
                        Ok
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this desktop? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant='danger' onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Archive Modal */}
            <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Unarchive</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to un-archive this printer?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowArchiveModal(false)}>
                        Cancel
                    </Button>
                    <Button variant='primary' onClick={handleArchive}>
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Logs Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body
                    style={{
                        maxHeight: "50vh", // responsive height limit
                        overflowY: "auto", // scroll if content is long
                        padding: "20px",
                    }}
                >
                    {modalContent}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* loading component */}
            {loading && (
                <div style={{
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
                }}>
                    <Spinner animation="border" variant="light" />
                </div>
            )
            }
        </Container >
    );
}
