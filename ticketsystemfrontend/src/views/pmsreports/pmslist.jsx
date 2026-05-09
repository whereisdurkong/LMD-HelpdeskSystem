

import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
import { Card, Button, Form, Col, Row, Container, Spinner, Alert, Pagination, Modal } from 'react-bootstrap';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaFileExcel, FaDownload, FaEye, FaUser, FaCalendarAlt, FaTag, FaFolder, FaFilter, FaBuilding, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function PMSList() {
    const [ticketsData, setTicketsData] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState('');
    const [successful, setSuccessful] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    // Department filter states
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    //Alerts state 3s
    useEffect(() => {
        if (error || successful) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessful('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successful]);

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Extract unique departments from tickets data
    useEffect(() => {
        if (ticketsData.length > 0) {
            const departments = [...new Set(ticketsData.map(ticket => ticket.pmsticket_for_department).filter(dept => dept && dept !== 'N/A'))];
            setAvailableDepartments(departments.sort());
        }
    }, [ticketsData]);

    // Filter tickets based on all filters
    useEffect(() => {
        if (!ticketsData.length) {
            setFilteredTickets([]);
            return;
        }

        let filtered = [...ticketsData];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(ticket =>
                ticket.tag_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.pms_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.assigned_to_fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.pmsticket_for_fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.resolvedNote?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }



        // Apply location filter (using department as location)
        if (filterLocation !== 'All') {
            filtered = filtered.filter(ticket =>
                ticket.pmsticket_for_department?.toLowerCase() === filterLocation.toLowerCase()
            );
        }

        // Apply date filters
        if (fromDate || toDate) {
            filtered = filtered.filter(ticket => {
                const ticketDate = new Date(ticket.updated_at);
                ticketDate.setHours(0, 0, 0, 0);

                let isValid = true;

                if (fromDate) {
                    const fromDateObj = new Date(fromDate);
                    fromDateObj.setHours(0, 0, 0, 0);
                    isValid = isValid && ticketDate >= fromDateObj;
                }

                if (toDate) {
                    const toDateObj = new Date(toDate);
                    toDateObj.setHours(23, 59, 59, 999);
                    isValid = isValid && ticketDate <= toDateObj;
                }

                return isValid;
            });
        }

        // Apply department filters
        if (selectedDepartments.length > 0) {
            filtered = filtered.filter(ticket =>
                selectedDepartments.includes(ticket.pmsticket_for_department)
            );
        }

        setFilteredTickets(filtered);
    }, [ticketsData, searchTerm, filterLocation, fromDate, toDate, selectedDepartments]);

    // Sort tickets
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Pagination calculations
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

    // Handle department selection
    const handleDepartmentChange = (department) => {
        setSelectedDepartments(prev => {
            if (prev.includes(department)) {
                return prev.filter(d => d !== department);
            } else {
                return [...prev, department];
            }
        });
        setCurrentPage(1);
    };

    // Select all departments
    const selectAllDepartments = () => {
        setSelectedDepartments([...availableDepartments]);
        setCurrentPage(1);
    };

    // Clear all department filters
    const clearAllDepartments = () => {
        setSelectedDepartments([]);
        setCurrentPage(1);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');

        setFilterLocation('All');
        setFromDate(null);
        setToDate(null);
        setSelectedDepartments([]);
        setSortOrder('newest');
        setCurrentPage(1);
    };

    // Function to get the correct image URL from backend
    const getSignatureUrl = (signaturePath) => {
        if (!signaturePath) return null;
        const cleanedPath = signaturePath.replace(/\\/g, '/');
        const fileName = cleanedPath.split('/').pop() || cleanedPath;
        return `${config.baseApi}/uploads/${fileName}`;
    };

    // // Download Excel with images
    const downloadExcelWithImages = async () => {
        setDownloading(true);

        try {
            const ExcelJS = await import('exceljs');

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'PMS System';
            workbook.lastModifiedBy = 'PMS System';
            workbook.created = new Date();
            workbook.modified = new Date();

            const worksheet = workbook.addWorksheet('PMS Tickets', {
                properties: { tabColor: { argb: 'FF4CAF50' } },
                views: [{ showGridLines: true }]
            });

            worksheet.columns = [
                { header: '#', key: 'index', width: 8 },
                { header: 'Tag ID', key: 'tag_id', width: 15 },
                { header: 'PMS Category', key: 'category', width: 20 },
                { header: 'Worked By', key: 'worked_by', width: 25 },
                { header: 'PMS For', key: 'pms_for', width: 25 },
                { header: 'Department', key: 'department', width: 20 },
                { header: 'Date', key: 'date', width: 12 },
                { header: 'Resolution Note', key: 'resolution', width: 50 },
                { header: 'Signature', key: 'signature', width: 30 }
            ];

            // Style header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2196F3' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;

            let rowIndex = 2;

            for (let i = 0; i < filteredTickets.length; i++) {
                const ticket = filteredTickets[i];

                const row = worksheet.addRow({
                    index: i + 1,
                    tag_id: ticket.tag_id || '',
                    category: ticket.pms_category || 'N/A',
                    worked_by: ticket.assigned_to_fullname || '',
                    pms_for: ticket.pmsticket_for_fullname || '',
                    department: ticket.pmsticket_for_department || 'N/A',
                    date: formatDate(ticket.updated_at),
                    resolution: ticket.resolvedNote || 'No resolved note',
                    signature: ''
                });

                row.alignment = { vertical: 'top', wrapText: true };
                worksheet.getRow(rowIndex).height = 120;

                if (ticket.signature) {
                    const filePaths = ticket.signature.split(',');
                    let imageColIndex = 8;

                    for (const filePath of filePaths) {
                        const fileName = filePath.split('\\').pop().split('/').pop();
                        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);

                        if (isImage) {
                            const fileUrl = `${config.baseApi}/esignatures/${fileName}`;

                            try {
                                const response = await fetch(fileUrl, {
                                    method: 'GET',
                                    mode: 'cors',
                                    credentials: 'include',
                                    headers: { 'Accept': 'image/*' }
                                });

                                if (response.ok) {
                                    const blob = await response.blob();
                                    const base64Image = await new Promise((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => resolve(reader.result);
                                        reader.onerror = reject;
                                        reader.readAsDataURL(blob);
                                    });

                                    if (base64Image) {
                                        const imageId = workbook.addImage({
                                            base64: base64Image,
                                            extension: fileName.split('.').pop().toLowerCase(),
                                        });

                                        worksheet.addImage(imageId, {
                                            tl: { col: imageColIndex, row: rowIndex - 1 },
                                            ext: { width: 150, height: 100 }
                                        });
                                    }
                                }
                            } catch (imgError) {
                                console.error(`Error adding image ${fileName}:`, imgError);
                            }
                        } else {
                            const cell = worksheet.getCell(rowIndex, imageColIndex + 1);
                            cell.value = (cell.value ? cell.value + '\n' : '') + fileName;
                            cell.font = { italic: true, color: { argb: 'FF666666' } };
                        }
                    }
                }

                rowIndex++;
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Save file with filter information in filename
            const date = new Date();
            let fileName = `PMS_Tickets_with_Images`;

            if (searchTerm || filterLocation !== 'All' || fromDate || toDate || selectedDepartments.length > 0) {
                fileName += '_Filtered';

                if (fromDate || toDate) {
                    const fromStr = fromDate ? formatDate(fromDate).replace(/\s/g, '_') : 'start';
                    const toStr = toDate ? formatDate(toDate).replace(/\s/g, '_') : 'end';
                    fileName += `_${fromStr}_to_${toStr}`;
                }

                if (selectedDepartments.length > 0) {
                    if (selectedDepartments.length === 1) {
                        fileName += `_${selectedDepartments[0].replace(/\s/g, '_')}`;
                    } else {
                        fileName += `_${selectedDepartments.length}Departments`;
                    }
                }
            } else {
                const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                fileName += `_${dateStr}`;
            }

            saveAs(blob, `${fileName}.xlsx`);

        } catch (error) {
            console.error('Error creating Excel file:', error);
            setError('Error creating Excel file. Please try again.');
        } finally {
            setDownloading(false);
        }
    };



    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketRes, assetRes] = await Promise.all([
                    axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`),
                    axios.get(`${config.baseApi}/pms/get-all-assets`)
                ]);

                const tickets = ticketRes.data || [];
                const assets = assetRes.data || [];

                const closedTickets = tickets.filter(ticket => ticket.pms_status === 'closed');

                const allUsernames = new Set();
                closedTickets.forEach(ticket => {
                    if (ticket.assigned_to) allUsernames.add(ticket.assigned_to);
                    if (ticket.pmsticket_for) allUsernames.add(ticket.pmsticket_for);
                });

                const userDetailsPromises = Array.from(allUsernames).map(async (username) => {
                    try {
                        const userRes = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                            params: { user_name: username }
                        });
                        return { username, userData: userRes.data };
                    } catch (error) {
                        console.error(`Error fetching user ${username}:`, error.message);
                        return { username, userData: null };
                    }
                });

                const userResults = await Promise.all(userDetailsPromises);

                const userMap = {};
                userResults.forEach(result => {
                    if (result.userData) {
                        userMap[result.username] = result.userData;
                    }
                });

                const notesPromises = closedTickets.map(async (ticket) => {
                    try {
                        const noteRes = await axios.get(`${config.baseApi}/pmsticket/get-all-notes/${ticket.pmsticket_id}`);
                        return {
                            pmsticket_id: ticket.pmsticket_id,
                            notes: noteRes.data || []
                        };
                    } catch (err) {
                        console.error(`Error fetching notes for ticket ${ticket.pmsticket_id}:`, err.message);
                        return {
                            pmsticket_id: ticket.pmsticket_id,
                            notes: []
                        };
                    }
                });

                const notesResults = await Promise.all(notesPromises);

                const notesMap = {};
                notesResults.forEach(result => {
                    notesMap[result.pmsticket_id] = result.notes;
                });

                const assetsMap = {};
                assets.forEach(asset => {
                    if (asset.tag_id) {
                        assetsMap[asset.tag_id] = asset;
                    }
                });

                const ticketsWithValidAssets = closedTickets.filter(ticket => {
                    return assetsMap[ticket.tag_id] !== undefined;
                });

                const ticketsWithCategoryAndUsers = ticketsWithValidAssets.map(ticket => {
                    const matchingAsset = assetsMap[ticket.tag_id];

                    const assignedUser = userMap[ticket.assigned_to];
                    const assignedFullName = assignedUser
                        ? `${assignedUser.emp_FirstName || ''} ${assignedUser.emp_LastName || ''}`.trim()
                        : ticket.assigned_to || 'Unassigned';

                    const ticketForUser = userMap[ticket.pmsticket_for];
                    const ticketForFullName = ticketForUser
                        ? `${ticketForUser.emp_FirstName || ''} ${ticketForUser.emp_LastName || ''}`.trim()
                        : ticket.pmsticket_for || 'N/A';

                    const ticketForDepartment = ticketForUser?.emp_department || 'N/A';

                    const ticketNotes = notesMap[ticket.pmsticket_id] || [];

                    const resolvedNotes = ticketNotes.filter(note =>
                        note.note && note.note.includes('HelpDesk Resolved the ticket:')
                    );

                    const lastResolvedNote = resolvedNotes.length > 0
                        ? resolvedNotes[resolvedNotes.length - 1]
                        : null;

                    let resolvedMessage = null;
                    if (lastResolvedNote && lastResolvedNote.note) {
                        const noteText = lastResolvedNote.note;
                        if (noteText.includes('HelpDesk Resolved the ticket:')) {
                            resolvedMessage = noteText.split('HelpDesk Resolved the ticket:')[1]?.trim() || noteText;
                        } else {
                            resolvedMessage = noteText;
                        }
                    }

                    let fileName = '';
                    if (ticket.signature) {
                        const cleanedPath = ticket.signature.replace(/\\/g, '/');
                        fileName = cleanedPath.split('/').pop() || '';
                    }

                    return {
                        id: ticket.id || ticket.pmsticket_id,
                        pmsticket_id: ticket.pmsticket_id,
                        tag_id: ticket.tag_id,
                        pms_status: ticket.pms_status,
                        pmsticket_for: ticket.pmsticket_for,
                        pmsticket_for_fullname: ticketForFullName,
                        pmsticket_for_department: ticketForDepartment,
                        updated_at: ticket.updated_at,
                        assigned_to: ticket.assigned_to,
                        assigned_to_fullname: assignedFullName,
                        signature: ticket.signature,
                        signatureUrl: getSignatureUrl(ticket.signature),
                        fileName: fileName,
                        pms_category: matchingAsset.pms_category,
                        resolvedNote: resolvedMessage
                    };
                });

                setTicketsData(ticketsWithCategoryAndUsers);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError('Error loading data. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleNoteExpand = (ticketId) => {
        setExpandedNotes(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }));
    };

    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Preventive': '#4CAF50',
            'Corrective': '#F44336',
            'Emergency': '#FF9800',
            'Routine': '#2196F3'
        };
        return colors[category] || '#9E9E9E';
    };

    const renderSignature = (signature, ticketId) => {
        if (!signature) return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt style={{ fontSize: '14px', color: '#999' }} />
                <span style={{ color: '#999', fontStyle: 'italic', fontSize: '13px' }}>No signature</span>
            </div>
        );

        const filePaths = signature.split(',');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filePaths.map((filePath, idx) => {
                    const fileName = filePath.split('\\').pop().split('/').pop();
                    const fileUrl = `${config.baseApi}/${filePath.replace(/\\/g, '/')}`;
                    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);

                    if (isImage) {
                        return (
                            <div key={idx} style={{ position: 'relative' }}>
                                <div
                                    style={{
                                        position: 'relative',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        border: '1px solid #e0e0e0',
                                        width: '120px',
                                        height: '80px'
                                    }}
                                    onClick={() => openImageModal(fileUrl)}
                                >
                                    <img
                                        src={fileUrl}
                                        alt={`Signature ${idx + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            backgroundColor: '#f9f9f9'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        cursor: 'pointer'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <FaEye style={{ color: 'white', fontSize: '24px' }} />
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    marginTop: '4px',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={idx}>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 10px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '6px',
                                        border: '1px solid #e0e0e0',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#e8e8e8';
                                        e.currentTarget.style.borderColor = '#2196F3';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                    }}
                                >
                                    <FaFileAlt style={{ fontSize: '16px', color: '#666' }} />
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#333',
                                        maxWidth: '100px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
                                    </span>
                                </a>
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #2196F3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <p style={{ color: '#666', fontSize: '16px' }}>Loading PMS data...</p>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(to bottom, #ffe798, #b8860b)',
            minHeight: '100vh'
        }}>
            <Container
                className="pt-100 pb-4"
                fluid
                style={{
                    paddingTop: '100px',
                    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                    maxWidth: '1600px',
                    margin: '0 auto'
                }}
            >
                {/* Alert Components */}
                {error && (
                    <div
                        className="position-fixed start-50 translate-middle-x"
                        style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                    >
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    </div>
                )}
                {successful && (
                    <div
                        className="position-fixed start-50 translate-middle-x"
                        style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                    >
                        <Alert variant="success" onClose={() => setSuccessful('')} dismissible>
                            {successful}
                        </Alert>
                    </div>
                )}

                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '15px',



                    borderBottom: 'none'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            PMS List
                        </h1>
                        <span style={{
                            background: 'rgba(14, 184, 42, 0.53)',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '30px',
                            fontSize: '14px',
                            fontWeight: 500
                        }}>
                            {filteredTickets.length} tickets {filteredTickets.length !== ticketsData.length && `(filtered from ${ticketsData.length})`}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={downloadExcelWithImages}
                            disabled={filteredTickets.length === 0 || downloading}
                            style={{
                                backgroundColor: downloading ? '#ccc' : '#006e1c',
                                color: 'white',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 500,
                                cursor: downloading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(33, 243, 61, 0.3)'
                            }}
                            onMouseEnter={e => {
                                if (!downloading) {
                                    e.currentTarget.style.backgroundColor = '#003f08';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!downloading) {
                                    e.currentTarget.style.backgroundColor = '#006e1c';
                                }
                            }}
                        >
                            {downloading ? (
                                <>
                                    <span style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '3px solid #f3f3f3',
                                        borderTop: '3px solid #2196F3',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        display: 'inline-block'
                                    }}></span>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <FaDownload />
                                    Download Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search and Filter Section - Now part of the table container */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px 24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px 12px 0 0',

                    borderBottom: 'none',
                }}>
                    <div className="d-flex flex-wrap align-items-end gap-3" style={{ width: "100%" }}>
                        {/* Search */}
                        <div style={{ flex: "1 1 300px" }}>
                            <Form.Group controlId="search" style={{ width: "100%" }}>
                                <Form.Label style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                    color: '#333'
                                }}>
                                    Search
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by Tag ID, Category, Name, etc."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "10px 14px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        boxShadow: "none",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#2196F3";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e0e0e0";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </Form.Group>
                        </div>

                        {/* Department/Location Filter */}
                        <div style={{ flex: "0 1 200px" }}>
                            <Form.Group controlId="department-filter" style={{ width: "100%" }}>
                                <Form.Label style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                    color: '#333'
                                }}>
                                    Department
                                </Form.Label>
                                <Form.Select
                                    value={filterLocation}
                                    onChange={(e) => {
                                        setFilterLocation(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "10px 14px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        boxShadow: "none",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#2196F3";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e0e0e0";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <option value="All">All Departments</option>
                                    {availableDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>

                        {/* Date Range */}
                        <div className="d-flex align-items-end gap-2" style={{ flex: "0 1 300px" }}>
                            <Form.Group controlId="from-date" className="flex-fill">
                                <Form.Label style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                    color: '#333'
                                }}>
                                    From
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={fromDate ? fromDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        setFromDate(e.target.value ? new Date(e.target.value) : null);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "9px 14px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        boxShadow: "none",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#2196F3";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e0e0e0";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </Form.Group>

                            <Form.Group controlId="to-date" className="flex-fill">
                                <Form.Label style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                    color: '#333'
                                }}>
                                    To
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={toDate ? toDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        setToDate(e.target.value ? new Date(e.target.value) : null);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "9px 14px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        boxShadow: "none",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#2196F3";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e0e0e0";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </Form.Group>
                        </div>

                        {/* Sort Order */}
                        <div style={{ flex: "0 1 180px" }}>
                            <Form.Group controlId="sort-filter" style={{ width: "100%" }}>
                                <Form.Label style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                    color: '#333'
                                }}>
                                    Order
                                </Form.Label>
                                <Form.Select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "10px 14px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        boxShadow: "none",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#2196F3";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e0e0e0";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <option value="newest">Newest to Oldest</option>
                                    <option value="oldest">Oldest to Newest</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchTerm || filterLocation !== 'All' || fromDate || toDate) && (
                            <div style={{ flex: "0 1 auto" }}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={clearAllFilters}
                                    style={{
                                        borderRadius: "6px",
                                        padding: "10px 20px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        border: "1px solid #e0e0e0",
                                        backgroundColor: "white",
                                        color: "#666",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                                        e.currentTarget.style.borderColor = "#ccc";
                                        e.currentTarget.style.color = "#333";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = "white";
                                        e.currentTarget.style.borderColor = "#e0e0e0";
                                        e.currentTarget.style.color = "#666";
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div style={{
                    overflowX: 'auto',
                    borderRadius: '0 0 12px 12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderTop: 'none',
                    backgroundColor: 'white'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: '#f8f9fa',
                                borderBottom: '2px solid #e0e0e0'
                            }}>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#333' }}>#</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                        Tag ID
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>PMS Category</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                        Worked By
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>PMS For</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                        Department
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>

                                        Date
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Resolution Note</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#333' }}>Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTickets.map((ticket, index) => (
                                <tr
                                    key={ticket.id || index}
                                    style={{
                                        borderBottom: '1px solid #e0e0e0',
                                        transition: 'background-color 0.2s',
                                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa'}
                                >
                                    <td style={{
                                        padding: '16px',
                                        textAlign: 'center',
                                        fontWeight: 500,
                                        color: '#666'
                                    }}>
                                        {indexOfFirstTicket + index + 1}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 500,
                                            color: '#333',
                                            backgroundColor: '#f0f0f0',
                                            padding: '4px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {ticket.tag_id}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            backgroundColor: getCategoryColor(ticket.pms_category),
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            display: 'inline-block'
                                        }}>
                                            {ticket.pms_category || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#333', fontWeight: 500 }}>
                                                {ticket.assigned_to_fullname}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#333' }}>
                                                {ticket.pmsticket_for_fullname}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 500
                                        }}>
                                            {ticket.pmsticket_for_department}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            backgroundColor: '#fff3e0',
                                            color: '#f57c00',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {formatDate(ticket.updated_at)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', maxWidth: '300px' }}>
                                        {ticket.resolvedNote ? (
                                            <div>
                                                <div style={{
                                                    color: '#333',
                                                    lineHeight: '1.5',
                                                    maxHeight: expandedNotes[ticket.pmsticket_id] ? 'none' : '60px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: expandedNotes[ticket.pmsticket_id] ? 'unset' : 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {ticket.resolvedNote}
                                                </div>
                                                {ticket.resolvedNote.length > 150 && (
                                                    <button
                                                        onClick={() => toggleNoteExpand(ticket.pmsticket_id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#2196F3',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            padding: '5px 0',
                                                            marginTop: '5px'
                                                        }}
                                                    >
                                                        {expandedNotes[ticket.pmsticket_id] ? 'Show less' : 'Show more'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#999', fontStyle: 'italic' }}>No resolved note</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', minWidth: '200px' }}>
                                        {renderSignature(ticket.signature, ticket.pmsticket_id)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {filteredTickets.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px',
                        marginTop: '20px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <FaFileAlt size={48} style={{ color: '#ccc', marginBottom: '20px' }} />
                        <p style={{ color: '#999', fontSize: '16px' }}>
                            {ticketsData.length > 0 ? 'No tickets found for the selected filters' : 'No tickets found'}
                        </p>
                        {(searchTerm || filterLocation !== 'All' || fromDate || toDate) && (
                            <button
                                onClick={clearAllFilters}
                                style={{
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                )}



                {/* Image Modal */}
                {selectedImage && (
                    <Modal show={true} onHide={closeImageModal} size="lg" centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Signature Preview</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-center">
                            <img
                                src={selectedImage}
                                alt="Enlarged signature"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    objectFit: 'contain'
                                }}
                            />
                        </Modal.Body>
                    </Modal>
                )}
            </Container>
        </div>
    )
}