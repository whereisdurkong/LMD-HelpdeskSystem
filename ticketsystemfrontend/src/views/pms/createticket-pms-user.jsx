import { useEffect, useState, useRef } from 'react';
import { Form, Button, Card, Row, Col, Container, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import Select from 'react-select';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';

import CreatableSelect from 'react-select/creatable';
import CreateTicketWalkthrough from '../tickets/createticket-user-walk';
import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'
export default function CreatePMSUser() {
    const containerRef = useRef(null);
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [formData, setFormData] = useState({
        ticket_subject: '',
        tag_id: '',
        Attachments: [],
        Description: '',
    });

    const [currentUser, setCurrentUser] = useState('');
    const [fullname, setFullName] = useState('');
    const [assets, setAssets] = useState([]);
    const desc = 'Issue: \nWhen did it start: \nHave you tried any troubleshooting steps: \nAdditional notes: ';

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

    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const Fullname = empInfo.user_name;
        setCurrentUser(Fullname);

        const first = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();
        const last = empInfo.emp_LastName.charAt(0).toUpperCase() + empInfo.emp_LastName.slice(1).toLowerCase();
        setFullName(first + ' ' + last);

    }, []);


    const customSelectStyles = {
        container: (provided) => ({
            ...provided,
            width: '100%',
        }),
        control: (provided, state) => ({
            ...provided,
            minHeight: '43px',
            border: state.isFocused ? '2px solid #fdc10dff' : `2px solid ${provided.borderColor}`,
            boxShadow: state.isFocused ? '1px rgba(253, 169, 13, 1)' : provided.boxShadow,
            '&:hover': { borderColor: '#fdc10dff' },
        }),
        valueContainer: (provided) => ({
            ...provided,
            paddingTop: '0px',
            paddingBottom: '0px',
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
            padding: '1px 4px',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            fontSize: '0.85rem',
            color: '#333',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#999',
            ':hover': {
                backgroundColor: '#ffcccc',
                color: '#ff0000',
            },
        }),
    };
    const subCategoryOptions = {
        hardware: [
            'Desktop',
            'Laptop',
            'Monitor',
            'Printer',
            'Scanner',
            'Printer/Scanner Combo',
            'Peripherals (Keyboard, Mouse, Webcam, External Drive)',
            'Docking Station',
            'Projector',
            'Fax Machine',
            'Telephone',
            'Server Hardware',
            'UPS (Uninterruptible Power Supply)',
            'Cabling & Ports',
            'Others'
        ],

        network: [
            'Internet Connectivity',
            'Wi-Fi',
            'LAN (Local Area Network)',
            'WAN (Wide Area Network)',
            'Server Access',
            'Network Printer/Scanner',
            'VPN Connection',
            'Firewall',
            'Router/Switch Configuration',
            'MPLS',
            'ISP',
            'Network Security (Intrusion Detection/Prevention)',
            'Bandwidth Issues',
            'Others'
        ],

        software: [
            'Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)',
            'Oracle (PROD/BIPUB)',
            'Email (Setup, Creation, Error, Backup)',
            'System Updates & Patches',
            'Active Directory (User Creation, Login, Password)',
            'Zoom / Video Conferencing Tools',
            'FoxPro (Accounting System)',
            'GEMCOM',
            'SURPAC',
            'FTP (Access Creation, Change Password)',
            'PDF (Conversion, Reduce Size, Editing)',
            'Antivirus / Security Software',
            'Operating System (Windows, macOS, Linux)',
            'Custom In-house Applications',
            'Backup & Restore Tools',
            'Cloud Services (OneDrive, Google Drive, Dropbox)',
            'Others'
        ]
    };


    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'ticket_category') {
            const updatedFormData = { ...formData, [name]: value };
            updatedFormData.ticket_SubCategory = '';

            const selectedCategory = value;

            if (
                selectedCategory === 'hardware' &&
                formData.Description.trim() === ''
            ) {
                updatedFormData.Description = desc;
            }

            setFormData(updatedFormData);
        } else if (name === 'Attachments') {
            setFormData({ ...formData, Attachments: files });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const updatedErrors = { ...prev };
                delete updatedErrors[name];
                return updatedErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');


        const empInfo = JSON.parse(localStorage.getItem('user'));

        const errors = {};
        if (!formData.tag_id.trim()) errors.tag_id = 'Tag ID is required';


        console.log(
            `tagid: ${formData.tag_id || 'empty'}, created_by: ${currentUser || 'empty'}, additional_info: ${formData.Description || 'empty'}`
        )
        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            const firstField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
            if (firstField) {
                firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        try {

            setLoading(true)
            const response = await axios.post(`${config.baseApi}/pmsticket/create-ticket-user`, {
                tag_id: formData.tag_id,
                created_by: empInfo.user_name,
                Description: formData.Description,
                assigned_location: empInfo.emp_location,
                user_id: empInfo.user_id

            });
            console.log('Ticket was created', response)
            setSuccess('Submitted ticket successfully!');
            setFormData({
                tag_id: '',
                Description: '',
                created_by: '',
            });
            setValidationErrors({});
            window.location.reload();
        } catch (error) {
            setLoading(false)
            setError('Error submitting your ticket. Please try again');
            console.error('Error submitting ticket:', error);
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
            const data = res.data || [];
            const active = data.filter(a => a.is_active === "1")

            const allAssets = active.map(e => e.tag_id);

            setAssets(active)
            console.log(allAssets)

        }
        fetch();
    }, [])
    // const options = assets.map(asset => ({ value: asset, label: asset }));
    const options = assets.map(asset => ({
        value: asset.tag_id,
        label: asset.tag_id,
        category: asset.pms_category
    }));

    const handleView = () => {
        setModalTitle("Sample PMS Ticket Walkthrough");
        setModalContent(<div style={{
            // width: "100vw",
            // height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000"
        }}>
            <video
                src="src\assets\images\pmswalkthrough.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    borderRadius: "12px",
                }}
            />
        </div>);
        setShowModal(true);
    }



    return (
        <Container fluid className="d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
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
                            <Row className="align-items-center mb-3">
                                <Col xs="auto">
                                    <div ref={containerRef} className="">
                                        <VariableProximity
                                            label={'Create PMS Ticket'}
                                            className={'variable-proximity-demo'}
                                            style={{
                                                fontSize: '1.5rem', // responsive font size
                                                color: "#2e2e2eff"
                                            }}
                                            fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                            toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                            containerRef={containerRef}
                                            radius={50}
                                            falloff="linear"
                                        />
                                    </div>
                                    <h7
                                        style={{
                                            fontStyle: "italic",
                                            color: "#2c7e36ff",
                                            cursor: "pointer",
                                            textDecoration: "none",
                                        }}
                                        onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                                        onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                        onClick={handleView}
                                    >
                                        view sample ticket
                                    </h7>
                                </Col>

                            </Row>
                            <Form onSubmit={handleSubmit}>
                                <Row >
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Tag ID
                                            </Form.Label>
                                            <CreatableSelect
                                                options={options}
                                                styles={{
                                                    ...customSelectStyles,
                                                    control: (provided, state) => ({
                                                        ...customSelectStyles.control(provided, state),
                                                        // add red outline when validation error exists
                                                        borderColor: validationErrors.tag_id ? '#eb0017ff' : (state.isFocused ? '#fdc10dff' : provided.borderColor),
                                                        boxShadow: validationErrors.tag_id ? '0 0 0 0.2rem rgba(220,53,69,.25)' : state.isFocused ? '1px rgba(253, 169, 13, 1)' : provided.boxShadow,
                                                    })
                                                }}
                                                value={
                                                    options.find(opt => opt.value === formData.tag_id) ||
                                                    (formData.tag_id ? { value: formData.tag_id, label: formData.tag_id } : null)
                                                }
                                                onChange={(selectedOption) => {
                                                    setFormData({
                                                        ...formData,
                                                        tag_id: selectedOption ? selectedOption.value : '',
                                                    });

                                                    if (validationErrors.tag_id) {
                                                        setValidationErrors(prev => {
                                                            const updated = { ...prev };
                                                            delete updated.tag_id;
                                                            return updated;
                                                        });
                                                    }
                                                }}
                                                onCreateOption={(inputValue) => {
                                                    const newOption = { value: inputValue, label: inputValue };
                                                    setFormData({ ...formData, tag_id: inputValue });
                                                }}
                                                isClearable
                                                placeholder="Type or select..."
                                                formatOptionLabel={(option, { context }) => (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        {/* Left: Tag ID */}
                                                        <span>{option.label}</span>

                                                        {/* Right: Category (only show for dropdown, not selected value) */}
                                                        {context === 'menu' && (
                                                            <span
                                                                style={{
                                                                    color: '#6c757d',
                                                                    fontSize: '0.9em',
                                                                    textAlign: 'right',
                                                                    flexShrink: 0,
                                                                    minWidth: '100px',
                                                                }}
                                                            >
                                                                {option.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                            {/* show validation message for react-select */}
                                            {validationErrors.tag_id && <div className="invalid-feedback d-block">{validationErrors.tag_id}</div>}
                                            {/* removed Form.Control.Feedback here because react-select doesn't wire into it */}

                                        </Form.Group>
                                    </Col>

                                    <Col xs={12} md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Created By</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="created_by"
                                                value={fullname}
                                                disabled
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group hidden>
                                            <Form.Label>Problem/Issue</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ticket_subject"
                                                value={formData.ticket_subject}
                                                onChange={handleChange}
                                                isInvalid={!!validationErrors.ticket_subject}
                                            />
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_subject}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>


                                </Row>

                                <Row className="mb-3" hidden>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Status</Form.Label>
                                            <Form.Control type="text" name="ticket_status" value="Open" disabled />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Urgency Level</Form.Label>
                                            <Form.Select
                                                name="ticket_urgencyLevel"
                                                value={formData.ticket_urgencyLevel}
                                                onChange={handleChange}
                                                isInvalid={!!validationErrors.ticket_urgencyLevel}
                                            >
                                                <option value="">Select</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_urgencyLevel}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3" hidden>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Category</Form.Label>
                                            <Form.Select
                                                name="ticket_category"
                                                value={formData.ticket_category}
                                                onChange={handleChange}
                                                isInvalid={!!validationErrors.ticket_category}
                                            >
                                                <option value="">Select</option>
                                                <option value="hardware">Hardware</option>
                                                <option value="network">Network</option>
                                                <option value="software">Software</option>
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_category}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Subcategory</Form.Label>
                                            <Form.Select
                                                name="ticket_SubCategory"
                                                value={formData.ticket_SubCategory}
                                                onChange={handleChange}
                                                disabled={!formData.ticket_category}
                                                isInvalid={!!validationErrors.ticket_SubCategory}
                                            >
                                                <option value="">Select</option>
                                                {subCategoryOptions[formData.ticket_category]?.map((subcat, idx) => (
                                                    <option key={idx} value={subcat}>{subcat}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_SubCategory}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" hidden>
                                    <Form.Label>Attachments <span className="fw-light">(optional)</span></Form.Label>
                                    <Form.Control
                                        type="file"
                                        name="Attachments"
                                        multiple
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group  >
                                    <Form.Label>Additional informations <span>(optional)</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="Description"
                                        value={formData.Description}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.Description}
                                    />
                                    <Form.Control.Feedback type="invalid">{validationErrors.Description}</Form.Control.Feedback>
                                </Form.Group>


                                <div className="text-end" style={{ paddingTop: '20px' }}>
                                    {/* <Button variant="primary" type="submit">Submit Ticket</Button> */}
                                    <BTN type="submit" label={'Submit Ticket'}></BTN>
                                </div>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </AnimatedContent>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="xl" // smaller than xl
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body
                    style={{
                        maxHeight: "70vh", // responsive height limit
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