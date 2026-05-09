// import { useEffect, useState, useRef } from 'react';
// import { Form, Button, Card, Row, Col, Container, Alert } from 'react-bootstrap';
// import axios from 'axios';
// import config from 'config';
// import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

// import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'
// import CreatableSelect from 'react-select/creatable';
// export default function CreateTicketHD() {
//     const containerRef = useRef(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [validationErrors, setValidationErrors] = useState({});
//     const [assets, setAssets] = useState([]);
//     const [currentUser, setCurrentUser] = useState('');
//     const [fullname, setFullName] = useState('');
//     const [formData, setFormData] = useState({
//         ticket_subject: '',
//         ticket_status: '',
//         ticket_urgencyLevel: '',
//         ticket_category: '',
//         ticket_SubCategory: '',
//         tag_id: '',
//         Attachments: [],
//         Description: '',
//         created_by: '',
//     });

//     //Template
//     const desc = 'Issue: \nWhen did it start: \nHave you tried any troubleshooting steps: \nAdditional notes: ';

//     //All Sub-cateogry
//     const subCategoryOptions = {
//         hardware: [
//             "Desktop",
//             "Laptop",
//             "Monitor",
//             "Printer",
//             "Scanner",
//             "Printer/Scanner Combo",
//             "Peripherals (Keyboard, Mouse, Webcam, External Drive)",
//             "Docking Station",
//             "Projector",
//             "Fax Machine",
//             "Telephone",
//             "Server Hardware",
//             "UPS (Uninterruptible Power Supply)",
//             "Cabling & Ports",
//         ],
//         network: [
//             "Internet Connectivity",
//             "Wi-Fi",
//             "LAN (Local Area Network)",
//             "WAN (Wide Area Network)",
//             "Server Access",
//             "Network Printer/Scanner",
//             "VPN Connection",
//             "Firewall",
//             "Router/Switch Configuration",
//             "MPLS",
//             "ISP",
//             "Network Security (Intrusion Detection/Prevention)",
//             "Bandwidth Issues",
//         ],
//         application: [
//             "Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)",
//             "Email (Setup, Creation, Error, Backup)",
//             "Active Directory (User Creation, Login, Password)",
//             "Zoom / Video Conferencing Tools",
//             "FoxPro (Accounting System)",
//             "GEMCOM",
//             "SURPAC",
//             "FTP (Access Creation, Change Password)",
//             "PDF (Conversion, Reduce Size, Editing)",
//             "Antivirus / Security Software",
//             "Operating System (Windows, macOS, Linux)",
//             "Cloud Services (OneDrive, Google Drive, Dropbox)",
//         ],
//         system: [
//             "Oracle (PROD/BIPUB)",
//             "System Updates & Patches",
//             "Backup & Restore Tools",
//             "CCTV Incident Report System",
//             "Safety Accident Report System",
//             "Compliance Registry System",
//             "Information Management System (Comrel)",
//             "Lepanto IT Help Desk System",
//             "Bizbox",
//             "Others"
//         ]
//     };

//     //Drop down styles
//     const customSelectStyles = {
//         container: (provided) => ({
//             ...provided,
//             width: '100%',
//         }),
//         control: (provided, state) => ({
//             ...provided,
//             minHeight: '43px',
//             border: state.isFocused ? '2px solid #fdc10dff' : `2px solid ${provided.borderColor}`,
//             boxShadow: state.isFocused ? '1px rgba(253, 169, 13, 1)' : provided.boxShadow,
//             '&:hover': { borderColor: '#fdc10dff' },
//         }),
//         valueContainer: (provided) => ({
//             ...provided,
//             paddingTop: '0px',
//             paddingBottom: '0px',
//         }),
//         multiValue: (provided) => ({
//             ...provided,
//             backgroundColor: '#f1f1f1',
//             borderRadius: '4px',
//             padding: '1px 4px',
//         }),
//         multiValueLabel: (provided) => ({
//             ...provided,
//             fontSize: '0.85rem',
//             color: '#333',
//         }),
//         multiValueRemove: (provided) => ({
//             ...provided,
//             color: '#999',
//             ':hover': {
//                 backgroundColor: '#ffcccc',
//                 color: '#ff0000',
//             },
//         }),
//     };

//     //Alert state 3s
//     useEffect(() => {
//         if (error || success) {
//             const timer = setTimeout(() => {
//                 setError('');
//                 setSuccess('');
//             }, 3000);
//             return () => clearTimeout(timer);
//         }
//     }, [error, success]);

//     //Setting usernames
//     useEffect(() => {
//         const empInfo = JSON.parse(localStorage.getItem('user'));
//         const Fullname = empInfo.user_name;
//         setCurrentUser(Fullname);

//         const first = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();
//         const last = empInfo.emp_LastName.charAt(0).toUpperCase() + empInfo.emp_LastName.slice(1).toLowerCase();
//         setFullName(first + ' ' + last);
//     }, []);

//     //Changes Function
//     const handleChange = (e) => {
//         const { name, value, files } = e.target;

//         if (name === 'ticket_category') {
//             const updatedFormData = { ...formData, [name]: value, ticket_SubCategory: '' };
//             setFormData(updatedFormData);
//         } else if (name === 'Attachments') {
//             setFormData({ ...formData, Attachments: files });
//         } else {
//             setFormData({ ...formData, [name]: value });
//         }

//         if (validationErrors[name]) {
//             setValidationErrors((prev) => {
//                 const updatedErrors = { ...prev };
//                 delete updatedErrors[name];
//                 return updatedErrors;
//             });
//         }
//     };

//     //Save Function
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         setSuccess('');

//         const empInfo = JSON.parse(localStorage.getItem('user'));

//         const errors = {};
//         if (!formData.ticket_subject.trim()) errors.ticket_subject = 'Problem/Issue is required';
//         if (!formData.ticket_urgencyLevel) errors.ticket_urgencyLevel = 'Urgency level is required';
//         if (!formData.ticket_category) errors.ticket_category = 'Category is required';
//         if (!formData.ticket_SubCategory) errors.ticket_SubCategory = 'Subcategory is required';
//         if (!formData.Description.trim() || formData.Description.trim() === desc.trim())
//             errors.Description = 'Description is required';

//         setValidationErrors(errors);

//         if (Object.keys(errors).length > 0) {
//             const firstField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
//             if (firstField) {
//                 firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
//             }
//             return;
//         }

//         try {
//             const data = new FormData();

//             for (const key in formData) {
//                 if (key === 'Attachments') {
//                     for (let i = 0; i < formData.Attachments.length; i++) {
//                         data.append('Attachments', formData.Attachments[i]);
//                     }
//                 } else {
//                     data.append(key, formData[key]);
//                 }
//             }

//             data.set('created_by', currentUser);
//             data.set('assigned_location', empInfo.emp_location);
//             data.set('user_id', empInfo.user_id);

//             const response = await axios.post(`${config.baseApi}/ticket/create-ticket`, data, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data'
//                 }
//             });

//             console.log('Ticket was created', response);
//             setSuccess('Submitted ticket successfully!');
//             setFormData({
//                 ticket_subject: '',
//                 ticket_status: '',
//                 ticket_urgencyLevel: '',
//                 ticket_category: '',
//                 ticket_SubCategory: '',
//                 tag_id: '',
//                 Attachments: [],
//                 Description: '',
//                 created_by: '',
//             });
//             setValidationErrors({});
//             window.location.reload();
//         } catch (error) {
//             setError('Error submitting your ticket. Please try again');
//             console.error('Error submitting ticket:', error);
//         }
//     };

//     //Get all assets
//     useEffect(() => {
//         const fetch = async () => {
//             try {
//                 const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
//                 const data = res.data || [];
//                 const active = data.filter(a => a.is_active === "1")

//                 const allAssets = active.map(e => e.tag_id);

//                 setAssets(active)
//                 console.log(allAssets)
//             } catch (err) {
//                 console.log('Unable to get all assets: ', err)
//             }
//         }
//         fetch();
//     }, [])

//     //Drop down format
//     const options = assets.map(asset => ({
//         value: asset.tag_id,
//         label: asset.tag_id,
//         category: asset.pms_category
//     }));

//     return (
//         <Container fluid className="d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
//             {/* Alert Component */}
//             {error && (
//                 <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
//                     <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>
//                 </div>
//             )}
//             {success && (
//                 <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
//                     <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>
//                 </div>
//             )}

//             <AnimatedContent
//                 distance={100}
//                 direction="vertical"
//                 reverse={true}
//                 duration={0.8}
//                 ease="power3.out"
//                 initialOpacity={0}
//                 animateOpacity
//                 scale={1.0}
//                 threshold={0.1}
//                 delay={0}
//             >
//                 <Row className="justify-content-center">
//                     <Col xs={12} md={10} lg={8}>
//                         <Card className="p-4 shadow-sm">
//                             <div ref={containerRef} className="mb-3">
//                                 {/* <VariableProximity
//                                     label={'Create Support Ticket'}
//                                     className={'variable-proximity-demo'}
//                                     style={{
//                                         fontSize: '1.5rem', // responsive font size
//                                         color: "#2e2e2eff"
//                                     }}
//                                     fromFontVariationSettings="'wght' 800, 'opsz' 9"
//                                     toFontVariationSettings="'wght' 2000, 'opsz' 30"
//                                     containerRef={containerRef}
//                                     radius={50}
//                                     falloff="linear"
//                                 /> */}
//                                 <h3 style={{
//                                     fontSize: '1.5rem', // responsive font size
//                                     color: "#272727ff"
//                                 }}
//                                 ><b>Create Support Ticket</b>
//                                 </h3>
//                             </div>

//                             <Form onSubmit={handleSubmit}>
//                                 <Row className="mb-3">
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Problem/Issue</Form.Label>
//                                             <Form.Control
//                                                 type="text"
//                                                 name="ticket_subject"
//                                                 value={formData.ticket_subject}
//                                                 onChange={handleChange}
//                                                 isInvalid={!!validationErrors.ticket_subject}
//                                             />
//                                             <Form.Control.Feedback type="invalid">{validationErrors.ticket_subject}</Form.Control.Feedback>
//                                         </Form.Group>
//                                     </Col>
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Tag ID <span className="fw-light">(optional)</span></Form.Label>
//                                             <CreatableSelect
//                                                 options={options}
//                                                 styles={customSelectStyles}
//                                                 value={
//                                                     options.find(opt => opt.value === formData.tag_id) ||
//                                                     (formData.tag_id ? { value: formData.tag_id, label: formData.tag_id } : null)
//                                                 }
//                                                 onChange={(selectedOption) => {
//                                                     setFormData({
//                                                         ...formData,
//                                                         tag_id: selectedOption ? selectedOption.value : '',
//                                                     });

//                                                     if (validationErrors.tag_id) {
//                                                         setValidationErrors(prev => {
//                                                             const updated = { ...prev };
//                                                             delete updated.tag_id;
//                                                             return updated;
//                                                         });
//                                                     }
//                                                 }}
//                                                 onCreateOption={(inputValue) => {
//                                                     const newOption = { value: inputValue, label: inputValue };
//                                                     setFormData({ ...formData, tag_id: inputValue });
//                                                 }}
//                                                 isClearable
//                                                 placeholder="Type or select..."
//                                                 formatOptionLabel={(option, { context }) => (
//                                                     <div
//                                                         style={{
//                                                             display: 'flex',
//                                                             justifyContent: 'space-between',
//                                                             alignItems: 'center',
//                                                             width: '100%',
//                                                         }}
//                                                     >
//                                                         {/* Left: Tag ID */}
//                                                         <span>{option.label}</span>

//                                                         {/* Right: Category (only show for dropdown, not selected value) */}
//                                                         {context === 'menu' && (
//                                                             <span
//                                                                 style={{
//                                                                     color: '#6c757d',
//                                                                     fontSize: '0.9em',
//                                                                     textAlign: 'right',
//                                                                     flexShrink: 0,
//                                                                     minWidth: '100px',
//                                                                 }}
//                                                             >
//                                                                 {option.category}
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 )}
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                 </Row>

//                                 <Row className="mb-3">
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Status</Form.Label>
//                                             <Form.Control type="text" name="ticket_status" value="Open" disabled />
//                                         </Form.Group>
//                                     </Col>
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Urgency Level</Form.Label>
//                                             <Form.Select
//                                                 name="ticket_urgencyLevel"
//                                                 value={formData.ticket_urgencyLevel}
//                                                 onChange={handleChange}
//                                                 isInvalid={!!validationErrors.ticket_urgencyLevel}
//                                             >

//                                                 <option value="low">Low</option>
//                                                 <option value="medium">Medium</option>
//                                                 <option value="high">High</option>
//                                                 <option value="critical">Critical</option>
//                                             </Form.Select>
//                                             <Form.Control.Feedback type="invalid">{validationErrors.ticket_urgencyLevel}</Form.Control.Feedback>
//                                         </Form.Group>
//                                     </Col>
//                                 </Row>

//                                 <Row className="mb-3">
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Category</Form.Label>
//                                             <Form.Select
//                                                 name="ticket_category"
//                                                 value={formData.ticket_category}
//                                                 onChange={handleChange}
//                                                 isInvalid={!!validationErrors.ticket_category}
//                                             >
//                                                 <option value="">Select</option>
//                                                 <option value="hardware">Hardware</option>
//                                                 <option value="network">Network</option>
//                                                 <option value="application">Application</option>
//                                                 <option value="system">System</option>
//                                             </Form.Select>
//                                             <Form.Control.Feedback type="invalid">{validationErrors.ticket_category}</Form.Control.Feedback>
//                                         </Form.Group>
//                                     </Col>
//                                     <Col xs={12} md={6}>
//                                         <Form.Group>
//                                             <Form.Label>Subcategory</Form.Label>
//                                             <Form.Select
//                                                 name="ticket_SubCategory"
//                                                 value={formData.ticket_SubCategory}
//                                                 onChange={handleChange}
//                                                 disabled={!formData.ticket_category}
//                                                 isInvalid={!!validationErrors.ticket_SubCategory}
//                                             >
//                                                 <option value="">Select</option>
//                                                 {subCategoryOptions[formData.ticket_category]?.map(
//                                                     (subcat, idx) => (
//                                                         <option key={idx} value={subcat}>
//                                                             {subcat}
//                                                         </option>
//                                                     )
//                                                 )}
//                                             </Form.Select>
//                                             <Form.Control.Feedback type="invalid">{validationErrors.ticket_SubCategory}</Form.Control.Feedback>
//                                         </Form.Group>
//                                     </Col>
//                                 </Row>

//                                 <Form.Group className="mb-3">
//                                     <Form.Label>Attachments <span className="fw-light">(optional)</span></Form.Label>
//                                     <Form.Control
//                                         type="file"
//                                         name="Attachments"
//                                         multiple
//                                         onChange={handleChange}
//                                     />
//                                 </Form.Group>

//                                 <Form.Group className="mb-3">
//                                     <Form.Label>Description</Form.Label>
//                                     <Form.Control
//                                         as="textarea"
//                                         rows={4}
//                                         name="Description"
//                                         value={formData.Description}
//                                         onChange={handleChange}
//                                         isInvalid={!!validationErrors.Description}
//                                     />
//                                     <Form.Control.Feedback type="invalid">{validationErrors.Description}</Form.Control.Feedback>
//                                 </Form.Group>

//                                 <Form.Group className="mb-3">
//                                     <Form.Label>Created By</Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         name="created_by"
//                                         value={fullname}
//                                         disabled
//                                     />
//                                 </Form.Group>

//                                 <div className="text-end">
//                                     <Button variant="primary" type="submit">Submit Ticket</Button>
//                                 </div>
//                             </Form>
//                         </Card>
//                     </Col>
//                 </Row>
//             </AnimatedContent>
//         </Container>
//     );
// }



import { useEffect, useState, useRef } from 'react';
import { Form, Button, Card, Row, Col, Container, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'
import CreatableSelect from 'react-select/creatable';

export default function CreateTicketHD() {
    const containerRef = useRef(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [assets, setAssets] = useState([]);
    const [currentUser, setCurrentUser] = useState('');
    const [fullname, setFullName] = useState('');
    const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
    const [newSubCategory, setNewSubCategory] = useState('');
    const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
    const [customSubCategories, setCustomSubCategories] = useState({});
    const [formData, setFormData] = useState({
        ticket_subject: '',
        ticket_status: '',
        ticket_urgencyLevel: '',
        ticket_category: '',
        ticket_SubCategory: '',
        tag_id: '',
        Attachments: [],
        Description: '',
        created_by: '',
    });

    //Template
    const desc = 'Issue: \nWhen did it start: \nHave you tried any troubleshooting steps: \nAdditional notes: ';

    //All Sub-cateogry
    const subCategoryOptions = {
        hardware: [
            "Desktop",
            "Laptop",
            "Monitor",
            "Printer",
            "Scanner",
            "Printer/Scanner Combo",
            "Peripherals (Keyboard, Mouse, Webcam, External Drive)",
            "Docking Station",
            "Projector",
            "Fax Machine",
            "Telephone",
            "Server Hardware",
            "UPS (Uninterruptible Power Supply)",
            "Cabling & Ports",
        ],
        network: [
            "Internet Connectivity",
            "Wi-Fi",
            "LAN (Local Area Network)",
            "WAN (Wide Area Network)",
            "Server Access",
            "Network Printer/Scanner",
            "VPN Connection",
            "Firewall",
            "Router/Switch Configuration",
            "MPLS",
            "ISP",
            "Network Security (Intrusion Detection/Prevention)",
            "Bandwidth Issues",
        ],
        application: [
            "Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)",
            "Email (Setup, Creation, Error, Backup)",
            "Active Directory (User Creation, Login, Password)",
            "Zoom / Video Conferencing Tools",
            "FoxPro (Accounting System)",
            "GEMCOM",
            "SURPAC",
            "FTP (Access Creation, Change Password)",
            "PDF (Conversion, Reduce Size, Editing)",
            "Antivirus / Security Software",
            "Operating System (Windows, macOS, Linux)",
            "Cloud Services (OneDrive, Google Drive, Dropbox)",
        ],
        system: [
            "Oracle (PROD/BIPUB)",
            "System Updates & Patches",
            "Backup & Restore Tools",
            "CCTV Incident Report System",
            "Safety Accident Report System",
            "Compliance Registry System",
            "Information Management System (Comrel)",
            "Lepanto IT Help Desk System",
            "Bizbox",
            "Others"
        ]
    };

    //Load custom subcategories from localStorage or backend
    useEffect(() => {
        const loadCustomSubCategories = async () => {
            try {
                // Try to load from backend first
                const response = await axios.get(`${config.baseApi}/ticket/get-custom-subcategories`);
                const data = response.data;
                console.log('DAAAAAAATTTTTTTTTTTTA:', data)
                if (response.data && response.data.success) {
                    setCustomSubCategories(data.sub_category);
                    console.log(data)
                } else {
                    // Fallback to localStorage
                    const saved = localStorage.getItem('customSubCategories');
                    if (saved) {
                        setCustomSubCategories(JSON.parse(saved));
                    }
                }
            } catch (error) {
                // Fallback to localStorage if backend fails
                const saved = localStorage.getItem('customSubCategories');
                if (saved) {
                    setCustomSubCategories(JSON.parse(saved));
                }
            }
        };

        loadCustomSubCategories();
    }, []);

    //Save custom subcategories to localStorage and optionally to backend
    const saveCustomSubCategory = async (category, subCategory) => {
        const updatedCategories = {
            ...customSubCategories,
            [category]: [...(customSubCategories[category] || []), subCategory]
        };

        setCustomSubCategories(updatedCategories);

        // Save to localStorage as fallback
        localStorage.setItem('customSubCategories', JSON.stringify(updatedCategories));

        // Try to save to backend
        try {
            await axios.post(`${config.baseApi}/ticket/add-custom-subcategory`, {
                category: category,
                subcategory: subCategory
            });
        } catch (error) {
            console.error('Failed to save custom subcategory to backend:', error);
        }
    };

    //Get current subcategory options (default + custom)
    const getCurrentSubCategoryOptions = () => {
        if (!formData.ticket_category) return [];

        const defaultOptions = subCategoryOptions[formData.ticket_category] || [];
        const customOptions = customSubCategories[formData.ticket_category] || [];

        return [...defaultOptions, ...customOptions];
    };

    //Drop down styles
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

    //Alert state 3s
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    //Setting usernames 
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const Fullname = empInfo.user_name;
        setCurrentUser(Fullname);

        const first = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();
        const last = empInfo.emp_LastName.charAt(0).toUpperCase() + empInfo.emp_LastName.slice(1).toLowerCase();
        setFullName(first + ' ' + last);
    }, []);

    //Changes Function
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'ticket_category') {
            const updatedFormData = { ...formData, [name]: value, ticket_SubCategory: '' };
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

    //Handle adding new subcategory
    const handleAddSubCategory = async () => {
        if (!newSubCategory.trim()) {
            setError('Please enter a subcategory name');
            return;
        }

        if (!formData.ticket_category) {
            setError('Please select a category first');
            return;
        }

        setIsAddingSubCategory(true);

        try {
            await saveCustomSubCategory(formData.ticket_category, newSubCategory.trim());

            // Automatically select the newly added subcategory
            setFormData({
                ...formData,
                ticket_SubCategory: newSubCategory.trim()
            });

            setShowSubCategoryModal(false);
            setNewSubCategory('');
            setSuccess(`Subcategory "${newSubCategory}" added successfully!`);
        } catch (error) {
            setError('Failed to add subcategory. Please try again.');
            console.error('Error adding subcategory:', error);
        } finally {
            setIsAddingSubCategory(false);
        }
    };

    //Save Function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const empInfo = JSON.parse(localStorage.getItem('user'));

        const errors = {};
        if (!formData.ticket_subject.trim()) errors.ticket_subject = 'Problem/Issue is required';
        if (!formData.ticket_urgencyLevel) errors.ticket_urgencyLevel = 'Urgency level is required';
        if (!formData.ticket_category) errors.ticket_category = 'Category is required';
        if (!formData.ticket_SubCategory) errors.ticket_SubCategory = 'Subcategory is required';
        if (!formData.Description.trim() || formData.Description.trim() === desc.trim())
            errors.Description = 'Description is required';

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            const firstField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
            if (firstField) {
                firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        try {
            const data = new FormData();

            for (const key in formData) {
                if (key === 'Attachments') {
                    for (let i = 0; i < formData.Attachments.length; i++) {
                        data.append('Attachments', formData.Attachments[i]);
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }

            data.set('created_by', currentUser);
            data.set('assigned_location', empInfo.emp_location);
            data.set('user_id', empInfo.user_id);

            const response = await axios.post(`${config.baseApi}/ticket/create-ticket`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Ticket was created', response);
            setSuccess('Submitted ticket successfully!');
            setFormData({
                ticket_subject: '',
                ticket_status: '',
                ticket_urgencyLevel: '',
                ticket_category: '',
                ticket_SubCategory: '',
                tag_id: '',
                Attachments: [],
                Description: '',
                created_by: '',
            });
            setValidationErrors({});
            window.location.reload();
        } catch (error) {
            setError('Error submitting your ticket. Please try again');
            console.error('Error submitting ticket:', error);
        }
    };

    //Get all assets
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
                const data = res.data || [];
                const active = data.filter(a => a.is_active === "1")

                const allAssets = active.map(e => e.tag_id);

                setAssets(active)
                console.log(allAssets)
            } catch (err) {
                console.log('Unable to get all assets: ', err)
            }
        }
        fetch();
    }, [])

    //Drop down format
    const options = assets.map(asset => ({
        value: asset.tag_id,
        label: asset.tag_id,
        category: asset.pms_category
    }));

    return (
        <Container fluid className="d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Alert Component */}
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
                            <div ref={containerRef} className="mb-3">
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    color: "#272727ff"
                                }}>
                                    <b>Create Support Ticket</b>
                                </h3>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col xs={12} md={6}>
                                        <Form.Group>
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
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label>Tag ID <span className="fw-light">(optional)</span></Form.Label>
                                            <CreatableSelect
                                                options={options}
                                                styles={customSelectStyles}
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
                                                        <span>{option.label}</span>
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
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
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
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_urgencyLevel}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
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
                                                <option value="application">Application</option>
                                                <option value="system">System</option>
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_category}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <Form.Label className="mb-0">Subcategory</Form.Label>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!formData.ticket_category) {
                                                            setError('Please select a category first');
                                                            return;
                                                        }
                                                        setShowSubCategoryModal(true);
                                                    }}
                                                    style={{ textDecoration: 'none', padding: 0 }}
                                                >
                                                    + Add Option
                                                </Button>
                                            </div>
                                            <Form.Select
                                                name="ticket_SubCategory"
                                                value={formData.ticket_SubCategory}
                                                onChange={handleChange}
                                                disabled={!formData.ticket_category}
                                                isInvalid={!!validationErrors.ticket_SubCategory}
                                            >
                                                <option value="">Select</option>
                                                {getCurrentSubCategoryOptions().map((subcat, idx) => (
                                                    <option key={idx} value={subcat}>
                                                        {subcat}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{validationErrors.ticket_SubCategory}</Form.Control.Feedback>

                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Attachments <span className="fw-light">(optional)</span></Form.Label>
                                    <Form.Control
                                        type="file"
                                        name="Attachments"
                                        multiple
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
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
                                    <Button variant="primary" type="submit">Submit Ticket</Button>
                                </div>
                            </Form>
                        </Card>
                    </Col>
                </Row>
                {/* Modal for adding new subcategory */}
                <Modal show={showSubCategoryModal} onHide={() => !isAddingSubCategory && setShowSubCategoryModal(false)}>
                    <Modal.Header closeButton={!isAddingSubCategory}>
                        <Modal.Title>Add New Subcategory</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Category</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.ticket_category ? formData.ticket_category.charAt(0).toUpperCase() + formData.ticket_category.slice(1) : ''}
                                disabled
                            />
                        </Form.Group>
                        <Form.Group className="mt-3">
                            <Form.Label>New Subcategory Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter new subcategory"
                                value={newSubCategory}
                                onChange={(e) => setNewSubCategory(e.target.value)}
                                disabled={isAddingSubCategory}
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowSubCategoryModal(false)} disabled={isAddingSubCategory}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddSubCategory} disabled={isAddingSubCategory}>
                            {isAddingSubCategory ? 'Adding...' : 'Add Subcategory'}
                        </Button>
                    </Modal.Footer>
                </Modal>

            </AnimatedContent>
        </Container>
    );
}