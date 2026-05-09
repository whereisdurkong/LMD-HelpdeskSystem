import { Container, Row, Col, Form, Modal, Button, Pagination, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SubCatDepartment from "../report/subcat_department";
import SubCatDepartmentTable from "../report/subcat_departmentTable";
import "../report/bento-layout-new.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import GetAllByCategory from "../report/getallbycategory";
import LocationTicketsChart from "../report/allticketbysite";
import AllTicketbyType from "../report/allticketbytype";
import AllTicketsByUser from "../report/allticketsbyuser";
import FeatherIcon from "feather-icons-react";
import PMSbyDept from "./pmsbydept";
import PMSbyHD from "./pmsbyhd";
import PmsTicketsByAsset from "./pmsticketsbyasset";
import PMSTATperCategory from "./pmstatpercategory";
import { useNavigate } from 'react-router';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

// Time-based table component for perMonth/perYear view
const TimeBasedAssetsTable = ({ data, filterType, location, allTickets }) => {
    // Group assets by time period
    const getTimePeriodData = () => {
        const groupedData = {};

        data.forEach(dept => {
            dept.assets?.forEach(asset => {
                // Use purchase_date or created_at as the date field
                // Adjust this based on your actual date field
                const dateStr = asset.purchase_date || asset.created_at;
                if (!dateStr) return; // Skip if no date

                const date = new Date(dateStr);
                let periodKey;

                if (filterType === 'perMonth') {
                    // Format: YYYY-MM
                    periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                } else {
                    // perYear - Format: YYYY
                    periodKey = date.getFullYear().toString();
                }

                if (!groupedData[periodKey]) {
                    groupedData[periodKey] = {
                        period: periodKey,
                        displayName: filterType === 'perMonth'
                            ? date.toLocaleString('default', { year: 'numeric', month: 'long' })
                            : periodKey,
                        assets: [],
                        departments: {}
                    };
                }

                groupedData[periodKey].assets.push(asset);

                // Group by department within each period
                if (!groupedData[periodKey].departments[dept.department]) {
                    groupedData[periodKey].departments[dept.department] = {
                        department: dept.department,
                        assets: []
                    };
                }
                groupedData[periodKey].departments[dept.department].assets.push(asset);
            });
        });

        // Sort periods chronologically
        return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
    };

    const timePeriods = getTimePeriodData();

    if (timePeriods.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                background: '#f5f5f5',
                borderRadius: '5px'
            }}>
                <FeatherIcon icon="calendar" size={48} color="#999" />
                <p style={{ color: '#666', marginTop: '10px' }}>
                    No assets with dates found for {filterType === 'perMonth' ? 'monthly' : 'yearly'} view
                </p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
            <table border="1" cellPadding="8" style={{
                borderCollapse: "collapse",
                width: "100%",
                height: "100%",
                border: '1px solid #ddd'
            }}>
                <thead style={{
                    background: '#053b00ff',
                    color: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                }}>
                    <tr>
                        <th style={{ width: '20%' }}>{filterType === 'perMonth' ? 'Month' : 'Year'}</th>
                        <th style={{ width: '25%' }}>Department</th>
                        <th style={{ width: '15%' }}>Total Assets</th>
                        <th style={{ width: '20%' }}>PMS</th>
                        <th style={{ width: '20%' }}>Non-PMS</th>
                    </tr>
                </thead>
                <tbody>
                    {timePeriods.map((period, periodIndex) => {
                        const departments = Object.values(period.departments);

                        return departments.map((dept, deptIndex) => {
                            const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);

                            const pmsAssets = dept.assets.filter(
                                asset => ticketTagIds.includes(asset.tag_id?.toString())
                            );

                            const nonPmsAssets = dept.assets.filter(
                                asset => !ticketTagIds.includes(asset.tag_id?.toString())
                            );

                            const pmsCount = pmsAssets.length;
                            const nonPmsCount = nonPmsAssets.length;

                            return (
                                <tr key={`${periodIndex}-${deptIndex}`} style={{
                                    background: (periodIndex + deptIndex) % 2 === 0 ? '#ffffff' : '#f9f9f9',
                                    borderBottom: '1px solid #ddd'
                                }}>
                                    {/* Show period name only for first row of each period */}
                                    <td style={{
                                        fontWeight: 'bold',
                                        backgroundColor: periodIndex % 2 === 0 ? '#f0f7f0' : '#e8f0e8'
                                    }}>
                                        {deptIndex === 0 ? period.displayName : ''}
                                    </td>

                                    <td>{dept.department}</td>

                                    {/* Total Assets cell with tooltip */}
                                    <td>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id={`tooltip-total-${periodIndex}-${deptIndex}`}>
                                                    <div style={{
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        padding: '5px',
                                                        minWidth: '200px'
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc' }}>
                                                            Assets in {period.displayName} ({dept.assets.length}):
                                                        </strong>
                                                        {dept.assets.length > 0 ? (
                                                            dept.assets.map((asset, i) => (
                                                                <div key={i} style={{
                                                                    padding: '2px 5px',
                                                                    borderBottom: i < dept.assets.length - 1 ? '1px solid #eee' : 'none',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {asset.tag_id || 'No Tag'}
                                                                    {asset.asset_name && ` - ${asset.asset_name}`}
                                                                    {asset.purchase_date && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({new Date(asset.purchase_date).toLocaleDateString()})
                                                                        </span>
                                                                    )}
                                                                    {location !== 'all' && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div>No assets found</div>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            }
                                        >
                                            <span style={{
                                                cursor: 'pointer',
                                                textDecoration: 'underline dotted',
                                                fontWeight: 'bold',
                                                color: '#053b00ff'
                                            }}>
                                                {dept.assets.length}
                                            </span>
                                        </OverlayTrigger>
                                    </td>

                                    {/* PMS cell with tooltip */}
                                    <td style={{
                                        backgroundColor: pmsCount > 0 ? '#d4edda' : 'transparent',
                                        fontWeight: pmsCount > 0 ? 'bold' : 'normal'
                                    }}>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id={`tooltip-pms-${periodIndex}-${deptIndex}`}>
                                                    <div style={{
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        padding: '5px',
                                                        minWidth: '200px'
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc', color: '#28a745' }}>
                                                            PMS Assets ({pmsCount}):
                                                        </strong>
                                                        {pmsAssets.length > 0 ? (
                                                            pmsAssets.map((asset, i) => (
                                                                <div key={i} style={{
                                                                    padding: '2px 5px',
                                                                    borderBottom: i < pmsAssets.length - 1 ? '1px solid #eee' : 'none',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {asset.tag_id || 'No Tag'}
                                                                    {asset.asset_name && ` - ${asset.asset_name}`}
                                                                    {asset.purchase_date && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({new Date(asset.purchase_date).toLocaleDateString()})
                                                                        </span>
                                                                    )}
                                                                    {location !== 'all' && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div>No PMS assets</div>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            }
                                        >
                                            <span style={{
                                                cursor: pmsCount > 0 ? 'pointer' : 'default',
                                                textDecoration: pmsCount > 0 ? 'underline dotted' : 'none'
                                            }}>
                                                {pmsCount}
                                            </span>
                                        </OverlayTrigger>
                                    </td>

                                    {/* Non-PMS cell with tooltip */}
                                    <td style={{
                                        backgroundColor: nonPmsCount > 0 ? '#fff3cd' : 'transparent',
                                        fontWeight: nonPmsCount > 0 ? 'bold' : 'normal'
                                    }}>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id={`tooltip-nonpms-${periodIndex}-${deptIndex}`}>
                                                    <div style={{
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        padding: '5px',
                                                        minWidth: '200px'
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc', color: '#856404' }}>
                                                            Non-PMS Assets ({nonPmsCount}):
                                                        </strong>
                                                        {nonPmsAssets.length > 0 ? (
                                                            nonPmsAssets.map((asset, i) => (
                                                                <div key={i} style={{
                                                                    padding: '2px 5px',
                                                                    borderBottom: i < nonPmsAssets.length - 1 ? '1px solid #eee' : 'none',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {asset.tag_id || 'No Tag'}
                                                                    {asset.asset_name && ` - ${asset.asset_name}`}
                                                                    {asset.purchase_date && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({new Date(asset.purchase_date).toLocaleDateString()})
                                                                        </span>
                                                                    )}
                                                                    {location !== 'all' && (
                                                                        <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                            {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div>No non-PMS assets</div>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            }
                                        >
                                            <span style={{
                                                cursor: nonPmsCount > 0 ? 'pointer' : 'default',
                                                textDecoration: nonPmsCount > 0 ? 'underline dotted' : 'none'
                                            }}>
                                                {nonPmsCount}
                                            </span>
                                        </OverlayTrigger>
                                    </td>
                                </tr>
                            );
                        });
                    })}

                    {/* Grand Total Row */}
                    <tr style={{
                        background: '#e9ecef',
                        fontWeight: 'bold',
                        borderTop: '2px solid #053b00ff'
                    }}>
                        <td colSpan="2"><b>GRAND TOTAL</b></td>
                        <td><b>{timePeriods.reduce((sum, period) => sum + period.assets.length, 0)}</b></td>
                        <td><b>{
                            timePeriods.reduce((sum, period) => {
                                const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);
                                return sum + period.assets.filter(
                                    asset => ticketTagIds.includes(asset.tag_id?.toString())
                                ).length;
                            }, 0)
                        }</b></td>
                        <td><b>{
                            timePeriods.reduce((sum, period) => {
                                const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);
                                const pmsCount = period.assets.filter(
                                    asset => ticketTagIds.includes(asset.tag_id?.toString())
                                ).length;
                                return sum + (period.assets.length - pmsCount);
                            }, 0)
                        }</b></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default function PMSReport() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const navigate = useNavigate();
    const [location, setLocation] = useState('all')

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [open, setOpen] = useState('');
    const [notReviewed, setNotReviewed] = useState('');
    const [closed, setClosed] = useState('');

    const [chartdata, setChartData] = useState(null);
    const [subcatSummary, setSubcatSummary] = useState(null);
    const [ticketTypeSummary, setTicketTypeSummary] = useState(null);
    const [ticketCategorySummary, setTicketCategorySummary] = useState(null);
    const [ticketUsersSummary, setTicketUsersSummary] = useState(null);

    const [locationFilteredTickets, setLocationFilteredTickets] = useState([]);

    // Asset states
    const [departmentAssets, setDepartmentAssets] = useState([]);
    const [filteredDepartmentAssets, setFilteredDepartmentAssets] = useState([]);
    const [activePMSAssets, setActivePMSAssets] = useState([]);
    const [processedDepartmentData, setProcessedDepartmentData] = useState([]);

    //Modal content
    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    //Date Calculator
    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    // table modal
    const TicketsTable = ({ tickets }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 10;

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentTickets = tickets.slice(indexOfFirstItem, indexOfLastItem);

        const totalPages = Math.ceil(tickets.length / itemsPerPage);
        console.log(currentTickets)
        return (
            <div style={{ overflowX: "auto" }}>
                <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead style={{ background: '#053b00ff', color: 'white' }}>
                        <tr>
                            <th>ID</th>
                            <th>Problem/Issue</th>
                            <th>Status</th>
                            {/* <th>Type</th> */}
                            <th>Assigned To</th>
                            <th>For</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTickets.length > 0 ? (
                            currentTickets.map(ticket => (
                                <tr key={ticket.pmsticket_id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/view-pms-hd-ticket?id=${ticket.pmsticket_id}`)}>
                                    <td>{ticket.pmsticket_id}</td>
                                    <td>{ticket.tag_id}</td>
                                    <td>{ticket.pms_status}</td>
                                    {/* <td>{ticket.ticket_type}</td> */}
                                    <td>{ticket.assigned_to}</td>
                                    <td>{ticket.pmsticket_for}</td>
                                    <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>No Tickets Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <Pagination className="tickets-pagination" style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === currentPage}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}

                            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                )}
            </div>
        );
    };

    // Fetch tickets once
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);
                const data = res.data || [];
                const activetickets = data.filter(t => t.is_active === true)
                setAllTickets(activetickets);

                console.log('ALL TICKETS: ', activetickets)
                console.log(activetickets.map(t => t.tag_id))
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

    //FETCH ALL ASSETS and process by department
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
                const data = res.data || [];
                const activePMS = data.filter(p => p.is_active === '1');

                // Store the full asset list
                setActivePMSAssets(activePMS);

                // Get unique departments from all assets (not filtered)
                const departmentMap = new Map();

                activePMS.forEach(asset => {
                    const dept = asset.department;
                    if (dept && dept !== '') {
                        if (!departmentMap.has(dept)) {
                            departmentMap.set(dept, {
                                department: dept,
                                totalAssets: 0,
                                assets: []
                            });
                        }
                        const deptData = departmentMap.get(dept);
                        deptData.totalAssets += 1;
                        deptData.assets.push(asset);
                    }
                });

                // Convert map to array and sort by department name
                const departmentList = Array.from(departmentMap.values())
                    .sort((a, b) => a.department.localeCompare(b.department));

                setDepartmentAssets(departmentList);
                console.log('Processed Department Data:', departmentList);

            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        }
        fetch()
    }, [])

    // Filter department assets based on location
    useEffect(() => {
        if (!departmentAssets.length) {
            setFilteredDepartmentAssets([]);
            return;
        }

        if (location === 'all') {
            // Show all departments
            setFilteredDepartmentAssets(departmentAssets);
        } else {
            // Filter assets by location and rebuild department structure
            const filteredDepts = departmentAssets
                .map(dept => {
                    // Filter assets in this department by location
                    const filteredAssets = dept.assets.filter(asset =>
                        asset.assigned_location?.toLowerCase() === location.toLowerCase()
                    );

                    // Only keep department if it has assets after filtering
                    if (filteredAssets.length > 0) {
                        return {
                            ...dept,
                            totalAssets: filteredAssets.length,
                            assets: filteredAssets
                        };
                    }
                    return null;
                })
                .filter(dept => dept !== null); // Remove empty departments

            setFilteredDepartmentAssets(filteredDepts);
        }
    }, [location, departmentAssets]);

    // Fetching pms ticket per site
    useEffect(() => {
        let filetered = [...allTickets];
        if (location === 'lmd') {
            filetered = allTickets.filter(t => t.assigned_location === 'lmd');
        } else if (location === 'corp') {
            filetered = allTickets.filter(t => t.assigned_location === 'corp');
        } else {
            filetered = allTickets;
        }
        setLocationFilteredTickets(filetered);
    }, [location, allTickets])

    // Apply filter + sorting whenever filterType or allTickets changes
    useEffect(() => {
        if (!locationFilteredTickets.length) {
            setFilteredTickets([])
            return;
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let filtered = [...locationFilteredTickets];

        switch (filterType) {
            case "today":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfToday);
                break;
            case "thisWeek":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfWeek);
                break;
            case "lastWeek":
                filtered = filtered.filter(t => {
                    const created = new Date(t.created_at);
                    return created >= startOfLastWeek && created < endOfLastWeek;
                });
                break;
            case "thisMonth":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfMonth);
                break;
            case "perMonth":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfYear);
                break;
            case "perYear":
                filtered = filtered.filter(t => new Date(t.created_at).getFullYear() === now.getFullYear());
                break;
            default:
                break;
        }

        // Sort by created_at (newest first)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        console.log(filtered)
        // save filtered tickets for modal usage
        setFilteredTickets(filtered);

        // Counters
        if (filterType === 'perMonth' || filterType === 'perYear') {
            setOpen(0);
            setNotReviewed(0);
            setClosed(0);
        } else {
            setOpen(filtered.filter(ticket => ticket.pms_status === 'open').length);
            setNotReviewed(filtered.filter(ticket => ticket.pms_status === 'open').length);
            setClosed(filtered.filter(ticket => ticket.is_reviewed === true && ticket.pms_status === 'closed').length);
        }

        // Group by subcategory
        const grouped = filtered.reduce((acc, ticket) => {
            const tagID = ticket.tag_id || "Unknown";
            const status = ticket.pms_status?.toLowerCase() || "unknown";

            if (!acc[tagID]) {
                acc[tagID] = {
                    subcategory: tagID,
                    total: 0,
                    resolved: 0,
                    closed: 0,
                    open: 0,
                    tatTimes: []
                };
            }

            acc[tagID].total += 1;

            if (status === "resolved") acc[tagID].resolved += 1;
            else if (status === "closed") acc[tagID].closed += 1;
            else if (status === "open") acc[tagID].open += 1;

            if (ticket.created_at && ticket.resolved_at) {
                const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                acc[tagID].tatTimes.push(tat.diffMs);
            }

            return acc;
        }, {});

        const result = Object.values(grouped).map(item => {
            if (item.tatTimes.length > 0) {
                const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
            } else {
                item.avgTAT = "N/A";
            }
            return item;
        });

        setStats(result);

        // Chart counts
        const incidentCount = filtered.filter(i => i.ticket_type === 'incident').length;
        const requestCount = filtered.filter(r => r.ticket_type === 'request').length;
        const inquiryCount = filtered.filter(q => q.ticket_type === 'inquiry').length;

        setChartData({
            labels: ['Incident', 'Request', 'Inquiry'],
            datasets: [
                {
                    label: 'Number of Tickets',
                    data: [incidentCount, requestCount, inquiryCount],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        });
    }, [filterType, locationFilteredTickets]);

    // Calculate total row
    const totalRow = stats.reduce(
        (totals, row) => {
            totals.total += row.total;
            totals.resolved += row.resolved;
            totals.closed += row.closed;
            totals.open += row.open;
            return totals;
        },
        { total: 0, resolved: 0, closed: 0, open: 0 }
    );








    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();

        // ===== SHEET 1: PMS Tickets Report (Detailed) =====
        const ticketsWorksheet = workbook.addWorksheet("PMS Tickets Report");

        // Get filtered tickets based on current location and filterType
        let ticketsToExport = [...locationFilteredTickets];

        // Apply the same filters that are used in the UI
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        switch (filterType) {
            case "today":
                ticketsToExport = ticketsToExport.filter(t => new Date(t.created_at) >= startOfToday);
                break;
            case "thisWeek":
                ticketsToExport = ticketsToExport.filter(t => new Date(t.created_at) >= startOfWeek);
                break;
            case "lastWeek":
                ticketsToExport = ticketsToExport.filter(t => {
                    const created = new Date(t.created_at);
                    return created >= startOfLastWeek && created < endOfLastWeek;
                });
                break;
            case "thisMonth":
                ticketsToExport = ticketsToExport.filter(t => new Date(t.created_at) >= startOfMonth);
                break;
            case "perMonth":
                ticketsToExport = ticketsToExport.filter(t => new Date(t.created_at) >= startOfYear);
                break;
            case "perYear":
                // FIXED: For perYear view, we want ALL years to show in the Assets by PMS Category sheet
                // So we don't apply any year filter here
                // ticketsToExport = ticketsToExport.filter(t => new Date(t.created_at).getFullYear() === now.getFullYear());
                break;
            default:
                break;
        }

        // Sort by created_at (newest first) to match UI
        ticketsToExport.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Split tickets by status
        const allTickets = ticketsToExport;
        const openTickets = ticketsToExport.filter(t => t.pms_status === 'open');
        const closedTickets = ticketsToExport.filter(t => t.is_reviewed === true && t.pms_status === 'closed');

        // Set column widths for tickets sheet
        ticketsWorksheet.columns = [
            { width: 15 }, // Ticket ID
            { width: 20 }, // Tag ID/Asset
            { width: 30 }, // Problem/Issue
            { width: 15 }, // Status
            { width: 20 }, // Assigned To
            { width: 15 }, // For
            { width: 15 }, // Location
            { width: 20 }, // Created At
            { width: 20 }, // Resolved At
            { width: 15 }  // TAT
        ];

        // Helper function to add a section to tickets sheet
        const addTicketSection = (title, tickets) => {
            // Add section title
            const titleRow = ticketsWorksheet.addRow([`${title} (${tickets.length} tickets)`]);
            titleRow.font = { bold: true, size: 14 };
            titleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '053b00ff' }
            };
            titleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            ticketsWorksheet.mergeCells(`A${titleRow.number}:J${titleRow.number}`);

            // Add empty row for spacing
            ticketsWorksheet.addRow([]);

            // Add headers
            const headers = [
                "Ticket ID",
                "Tag ID/Asset",
                "Problem/Issue",
                "Status",
                "Assigned To",
                "For",
                "Location",
                "Created At",
                "Resolved At",
                "TAT"
            ];

            const headerRow = ticketsWorksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '053b00ff' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Add data rows
            tickets.forEach(ticket => {
                const tat = ticket.created_at && ticket.resolved_at
                    ? calcTAT(ticket.created_at, ticket.resolved_at).text
                    : 'N/A';

                const row = ticketsWorksheet.addRow([
                    ticket.pmsticket_id || '',
                    ticket.tag_id || '',
                    ticket.issue || ticket.problem || '',
                    ticket.pms_status || '',
                    ticket.assigned_to || '',
                    ticket.pmsticket_for || '',
                    ticket.assigned_location?.toUpperCase() || 'N/A',
                    ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '',
                    ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : '',
                    tat
                ]);

                // Style data rows
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                });

                // Color code based on status
                if (ticket.pms_status === 'open') {
                    row.getCell(4).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE4B5' } // Light orange for open
                    };
                } else if (ticket.pms_status === 'closed') {
                    row.getCell(4).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '90EE90' } // Light green for closed
                    };
                }
            });

            // Add empty rows after section for spacing
            ticketsWorksheet.addRow([]);
            ticketsWorksheet.addRow([]);
        };

        // Add filter information at the top of tickets sheet
        const infoRow = ticketsWorksheet.addRow([`PMS Report - Generated on: ${new Date().toLocaleString()}`]);
        infoRow.font = { bold: true };
        ticketsWorksheet.mergeCells(`A${infoRow.number}:J${infoRow.number}`);

        const filterRow = ticketsWorksheet.addRow([`Filters: Location = ${location === 'all' ? 'LMD & CORP' : location.toUpperCase()}, Time Period = ${filterType === 'all' ? 'All Time' : filterType}`]);
        ticketsWorksheet.mergeCells(`A${filterRow.number}:J${filterRow.number}`);

        ticketsWorksheet.addRow([]);
        ticketsWorksheet.addRow([]);

        // Add ALL TICKETS section
        addTicketSection("ALL PMS TICKETS", allTickets);

        // Add OPEN TICKETS section
        addTicketSection("OPEN PMS TICKETS", openTickets);

        // Add CLOSED TICKETS section
        addTicketSection("CLOSED PMS TICKETS", closedTickets);

        // Add summary at the bottom of tickets sheet
        ticketsWorksheet.addRow([]);
        ticketsWorksheet.addRow(['SUMMARY']);
        ticketsWorksheet.getRow(ticketsWorksheet.lastRow.number).font = { bold: true, size: 12 };

        ticketsWorksheet.addRow(['Total Tickets:', allTickets.length]);
        ticketsWorksheet.addRow(['Open Tickets:', openTickets.length]);
        ticketsWorksheet.addRow(['Closed Tickets:', closedTickets.length]);

        // Style the summary rows
        for (let i = ticketsWorksheet.lastRow.number - 3; i <= ticketsWorksheet.lastRow.number; i++) {
            const row = ticketsWorksheet.getRow(i);
            row.getCell(1).font = { bold: true };
        }

        // ===== SHEET 2: Assets PMS by Department (Time-based) =====
        const assetsWorksheet = workbook.addWorksheet("Assets PMS by Department");

        // Check if we need time-based view (perMonth or perYear)
        if (filterType === 'perMonth' || filterType === 'perYear') {
            // ===== TIME-BASED VIEW FOR ASSETS =====

            // Set column widths for time-based assets sheet
            assetsWorksheet.columns = [
                { width: 20 }, // Time Period (Month/Year)
                { width: 25 }, // Department
                { width: 15 }, // Total Assets
                { width: 15 }, // PMS
                { width: 15 }, // Non-PMS
                { width: 15 }, // PMS %
                { width: 50 }  // Asset Details
            ];

            // Add title with filter info
            const assetsTitleRow = assetsWorksheet.addRow([`Assets PMS by Department - ${filterType === 'perMonth' ? 'Monthly View' : 'Yearly View'} - ${location === 'all' ? 'All Locations' : location.toUpperCase()}`]);
            assetsTitleRow.font = { bold: true, size: 14 };
            assetsTitleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '053b00ff' }
            };
            assetsTitleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            assetsWorksheet.mergeCells(`A${assetsTitleRow.number}:G${assetsTitleRow.number}`);

            assetsWorksheet.addRow([]);

            // Add headers
            const assetsHeaders = [
                filterType === 'perMonth' ? 'Month' : 'Year',
                "Department",
                "Total Assets",
                "PMS",
                "Non-PMS",
                "PMS %",
                "Asset Details (Tag ID - Asset Name - Location - Date)"
            ];

            const assetsHeaderRow = assetsWorksheet.addRow(assetsHeaders);
            assetsHeaderRow.font = { bold: true };
            assetsHeaderRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '053b00ff' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Get all ticket tag_ids from filtered tickets
            const ticketTagIds = ticketsToExport.map(t => t.tag_id?.toString()).filter(Boolean);

            // Group assets by time period (same logic as TimeBasedAssetsTable component)
            const getTimePeriodData = () => {
                const groupedData = {};

                filteredDepartmentAssets.forEach(dept => {
                    dept.assets?.forEach(asset => {
                        // Use purchase_date or created_at as the date field
                        const dateStr = asset.purchase_date || asset.created_at;
                        if (!dateStr) return; // Skip if no date

                        const date = new Date(dateStr);
                        let periodKey;

                        if (filterType === 'perMonth') {
                            // Format: YYYY-MM
                            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        } else {
                            // perYear - Format: YYYY
                            periodKey = date.getFullYear().toString();
                        }

                        if (!groupedData[periodKey]) {
                            groupedData[periodKey] = {
                                period: periodKey,
                                displayName: filterType === 'perMonth'
                                    ? date.toLocaleString('default', { year: 'numeric', month: 'long' })
                                    : periodKey,
                                assets: [],
                                departments: {}
                            };
                        }

                        groupedData[periodKey].assets.push(asset);

                        // Group by department within each period
                        if (!groupedData[periodKey].departments[dept.department]) {
                            groupedData[periodKey].departments[dept.department] = {
                                department: dept.department,
                                assets: []
                            };
                        }
                        groupedData[periodKey].departments[dept.department].assets.push(asset);
                    });
                });

                // Sort periods chronologically
                return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
            };

            const timePeriods = getTimePeriodData();

            if (timePeriods.length === 0) {
                assetsWorksheet.addRow(['No assets with dates found for this time period']);
            } else {
                // Add data rows grouped by time period
                timePeriods.forEach((period, periodIndex) => {
                    const departments = Object.values(period.departments);

                    departments.forEach((dept, deptIndex) => {
                        // Separate PMS and Non-PMS assets for this department in this period
                        const pmsAssets = dept.assets.filter(
                            asset => ticketTagIds.includes(asset.tag_id?.toString())
                        );
                        const nonPmsAssets = dept.assets.filter(
                            asset => !ticketTagIds.includes(asset.tag_id?.toString())
                        );

                        // Calculate PMS percentage
                        const pmsPercentage = dept.assets.length > 0
                            ? ((pmsAssets.length / dept.assets.length) * 100).toFixed(1) + '%'
                            : '0%';

                        // Create detailed asset list
                        const assetDetails = dept.assets.map(asset => {
                            const isPMS = ticketTagIds.includes(asset.tag_id?.toString());
                            const locationInfo = asset.assigned_location ? ` [${asset.assigned_location.toUpperCase()}]` : '';
                            const dateInfo = asset.purchase_date ? ` (${new Date(asset.purchase_date).toLocaleDateString()})` : '';
                            return `${asset.tag_id || 'No Tag'} - ${asset.asset_name || 'No Name'}${locationInfo}${dateInfo} ${isPMS ? '(PMS)' : '(Non-PMS)'}`;
                        }).join('\n');

                        const row = assetsWorksheet.addRow([
                            deptIndex === 0 ? period.displayName : '', // Show period only for first row of each period
                            dept.department,
                            dept.assets.length,
                            pmsAssets.length,
                            nonPmsAssets.length,
                            pmsPercentage,
                            assetDetails
                        ]);

                        // Style data row
                        row.eachCell((cell, colNumber) => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            cell.alignment = { vertical: 'top', wrapText: true };

                            // Make period cell bold
                            if (colNumber === 1 && deptIndex === 0) {
                                cell.font = { bold: true };
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: periodIndex % 2 === 0 ? 'F0F7F0' : 'E8F0E8' }
                                };
                            }
                        });

                        // Color code PMS percentage cell
                        const pmsPercent = parseFloat(pmsPercentage);
                        if (pmsPercent >= 75) {
                            row.getCell(6).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: '90EE90' } // Green for high PMS
                            };
                        } else if (pmsPercent >= 50) {
                            row.getCell(6).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFE4B5' } // Orange for medium PMS
                            };
                        } else {
                            row.getCell(6).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFCDD2' } // Red for low PMS
                            };
                        }
                    });

                    // Add period summary row
                    assetsWorksheet.addRow([]);
                    const periodTotalAssets = period.assets.length;
                    const periodPMSAssets = period.assets.filter(
                        asset => ticketTagIds.includes(asset.tag_id?.toString())
                    ).length;
                    const periodNonPMSAssets = periodTotalAssets - periodPMSAssets;
                    const periodPMSPercentage = periodTotalAssets > 0
                        ? ((periodPMSAssets / periodTotalAssets) * 100).toFixed(1) + '%'
                        : '0%';

                    const periodSummaryRow = assetsWorksheet.addRow([
                        `SUBTOTAL for ${period.displayName}`,
                        '',
                        periodTotalAssets,
                        periodPMSAssets,
                        periodNonPMSAssets,
                        periodPMSPercentage,
                        ''
                    ]);

                    periodSummaryRow.font = { bold: true, italic: true };
                    periodSummaryRow.eachCell((cell, colNumber) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'E6E6FA' }
                        };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        if (colNumber === 1) {
                            cell.alignment = { horizontal: 'right' };
                        }
                    });

                    assetsWorksheet.addRow([]); // Empty row between periods
                });

                // Add grand total row
                assetsWorksheet.addRow([]);

                // Calculate grand totals
                const totalAssets = timePeriods.reduce((sum, period) => sum + period.assets.length, 0);
                const totalPMS = timePeriods.reduce((sum, period) => {
                    return sum + period.assets.filter(
                        asset => ticketTagIds.includes(asset.tag_id?.toString())
                    ).length;
                }, 0);
                const totalNonPMS = totalAssets - totalPMS;
                const totalPMSPercentage = totalAssets > 0
                    ? ((totalPMS / totalAssets) * 100).toFixed(1) + '%'
                    : '0%';

                const grandTotalRow = assetsWorksheet.addRow([
                    'GRAND TOTAL',
                    '',
                    totalAssets,
                    totalPMS,
                    totalNonPMS,
                    totalPMSPercentage,
                    ''
                ]);

                grandTotalRow.font = { bold: true };
                grandTotalRow.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'e9ecef' }
                    };
                    if (colNumber === 1) {
                        cell.alignment = { horizontal: 'right' };
                    }
                });

                // Add summary statistics
                assetsWorksheet.addRow([]);
                assetsWorksheet.addRow(['SUMMARY STATISTICS']);
                assetsWorksheet.getRow(assetsWorksheet.lastRow.number).font = { bold: true, size: 12 };

                assetsWorksheet.addRow(['Total Assets:', totalAssets]);
                assetsWorksheet.addRow(['Total PMS Assets:', totalPMS]);
                assetsWorksheet.addRow(['Total Non-PMS Assets:', totalNonPMS]);
                assetsWorksheet.addRow(['Overall PMS Coverage:', totalPMSPercentage]);
                assetsWorksheet.addRow(['Number of Time Periods:', timePeriods.length]);
            }

        } else {
            // ===== REGULAR DEPARTMENT VIEW (for other filter types) =====

            // Set column widths for assets sheet
            assetsWorksheet.columns = [
                { width: 30 }, // Department
                { width: 15 }, // Total Assets
                { width: 15 }, // PMS
                { width: 15 }, // Non-PMS
                { width: 15 }, // PMS %
                { width: 50 }  // Asset Details
            ];

            // Add title with filter info
            const assetsTitleRow = assetsWorksheet.addRow([`Assets PMS by Department - ${location === 'all' ? 'All Locations' : location.toUpperCase()}`]);
            assetsTitleRow.font = { bold: true, size: 14 };
            assetsTitleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '053b00ff' }
            };
            assetsTitleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            assetsWorksheet.mergeCells(`A${assetsTitleRow.number}:F${assetsTitleRow.number}`);

            assetsWorksheet.addRow([]);

            // Add headers
            const assetsHeaders = [
                "Department",
                "Total Assets",
                "PMS",
                "Non-PMS",
                "PMS %",
                "Asset Details (Tag ID - Asset Name - Location)"
            ];

            const assetsHeaderRow = assetsWorksheet.addRow(assetsHeaders);
            assetsHeaderRow.font = { bold: true };
            assetsHeaderRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '053b00ff' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Get all ticket tag_ids from filtered tickets
            const ticketTagIds = ticketsToExport.map(t => t.tag_id?.toString()).filter(Boolean);

            // Add department data rows
            filteredDepartmentAssets.forEach((dept, index) => {
                const departmentAssetList = dept.assets || [];

                // Separate PMS and Non-PMS assets
                const pmsAssets = departmentAssetList.filter(
                    asset => ticketTagIds.includes(asset.tag_id?.toString())
                );

                const nonPmsAssets = departmentAssetList.filter(
                    asset => !ticketTagIds.includes(asset.tag_id?.toString())
                );

                // Calculate PMS percentage
                const pmsPercentage = dept.totalAssets > 0
                    ? ((pmsAssets.length / dept.totalAssets) * 100).toFixed(1) + '%'
                    : '0%';

                // Create a detailed list of assets for the details column
                const assetDetails = departmentAssetList.map(asset => {
                    const isPMS = ticketTagIds.includes(asset.tag_id?.toString());
                    const locationInfo = asset.assigned_location ? ` [${asset.assigned_location.toUpperCase()}]` : '';
                    return `${asset.tag_id || 'No Tag'} - ${asset.asset_name || 'No Name'}${locationInfo} ${isPMS ? '(PMS)' : '(Non-PMS)'}`;
                }).join('\n');

                const row = assetsWorksheet.addRow([
                    dept.department,
                    dept.totalAssets,
                    pmsAssets.length,
                    nonPmsAssets.length,
                    pmsPercentage,
                    assetDetails
                ]);

                // Style data row
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { vertical: 'top', wrapText: true };
                });

                // Color code based on PMS percentage
                const pmsPercent = parseFloat(pmsPercentage);
                if (pmsPercent >= 75) {
                    row.getCell(5).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '90EE90' } // Green for high PMS
                    };
                } else if (pmsPercent >= 50) {
                    row.getCell(5).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE4B5' } // Orange for medium PMS
                    };
                } else {
                    row.getCell(5).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFCDD2' } // Red for low PMS
                    };
                }
            });

            // Add total row
            assetsWorksheet.addRow([]);
            const totalAssets = filteredDepartmentAssets.reduce((sum, dept) => sum + dept.totalAssets, 0);
            const totalPMS = filteredDepartmentAssets.reduce((sum, dept) => {
                return sum + (dept.assets?.filter(
                    asset => ticketTagIds.includes(asset.tag_id?.toString())
                ).length || 0);
            }, 0);
            const totalNonPMS = totalAssets - totalPMS;
            const totalPMSPercentage = totalAssets > 0
                ? ((totalPMS / totalAssets) * 100).toFixed(1) + '%'
                : '0%';

            const totalRowAssets = assetsWorksheet.addRow([
                'TOTAL',
                totalAssets,
                totalPMS,
                totalNonPMS,
                totalPMSPercentage,
                ''
            ]);

            totalRowAssets.font = { bold: true };
            totalRowAssets.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'e9ecef' }
                };
            });

            // Add summary statistics
            assetsWorksheet.addRow([]);
            assetsWorksheet.addRow(['SUMMARY STATISTICS']);
            assetsWorksheet.getRow(assetsWorksheet.lastRow.number).font = { bold: true, size: 12 };

            assetsWorksheet.addRow(['Total Assets:', totalAssets]);
            assetsWorksheet.addRow(['Total PMS Assets:', totalPMS]);
            assetsWorksheet.addRow(['Total Non-PMS Assets:', totalNonPMS]);
            assetsWorksheet.addRow(['PMS Coverage:', totalPMSPercentage]);
        }

        // ===== SHEET 3: PMS per Dept (Combined Summary & Details) =====
        const pmsPerDeptWorksheet = workbook.addWorksheet("PMS per Dept");

        // First, get department and period information for each ticket
        const ticketsWithDetails = await (async () => {
            const ticketsWithDetails = [];
            for (const ticket of ticketsToExport) {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: ticket.pmsticket_for }
                    });

                    const createdDate = new Date(ticket.created_at);
                    ticketsWithDetails.push({
                        ...ticket,
                        department: response.data.emp_department || 'Unassigned',
                        month: createdDate.getMonth(),
                        monthName: createdDate.toLocaleString('default', { month: 'long' }),
                        year: createdDate.getFullYear(),
                        periodKey: filterType === 'perMonth'
                            ? `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
                            : filterType === 'perYear'
                                ? createdDate.getFullYear().toString()
                                : 'all',
                        periodDisplay: filterType === 'perMonth'
                            ? createdDate.toLocaleString('default', { year: 'numeric', month: 'long' })
                            : filterType === 'perYear'
                                ? createdDate.getFullYear().toString()
                                : 'All Periods',
                        sortDate: createdDate.getTime() // For sorting
                    });
                } catch (error) {
                    const createdDate = new Date(ticket.created_at);
                    ticketsWithDetails.push({
                        ...ticket,
                        department: 'Unassigned',
                        month: createdDate.getMonth(),
                        monthName: createdDate.toLocaleString('default', { month: 'long' }),
                        year: createdDate.getFullYear(),
                        periodKey: filterType === 'perMonth'
                            ? `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
                            : filterType === 'perYear'
                                ? createdDate.getFullYear().toString()
                                : 'all',
                        periodDisplay: filterType === 'perMonth'
                            ? createdDate.toLocaleString('default', { year: 'numeric', month: 'long' })
                            : filterType === 'perYear'
                                ? createdDate.getFullYear().toString()
                                : 'All Periods',
                        sortDate: createdDate.getTime() // For sorting
                    });
                }
            }
            return ticketsWithDetails;
        })();

        // Group by department for summary
        const deptSummary = {};
        const deptTickets = {};

        ticketsWithDetails.forEach(ticket => {
            const dept = ticket.department;

            if (!deptSummary[dept]) {
                deptSummary[dept] = {
                    open: 0,
                    inprogress: 0,
                    assigned: 0,
                    resolved: 0,
                    closed: 0,
                    total: 0
                };
                deptTickets[dept] = [];
            }

            // Increment counters based on status
            const status = ticket.pms_status?.toLowerCase() || '';
            if (status.includes('open')) {
                deptSummary[dept].open++;
            } else if (status.includes('progress')) {
                deptSummary[dept].inprogress++;
            } else if (status.includes('assigned')) {
                deptSummary[dept].assigned++;
            } else if (status.includes('resolved')) {
                deptSummary[dept].resolved++;
            } else if (status.includes('closed')) {
                deptSummary[dept].closed++;
            }

            deptSummary[dept].total++;
            deptTickets[dept].push(ticket);
        });

        // Sort departments alphabetically
        const sortedDepartments = Object.keys(deptSummary).sort();

        // Set column widths based on filter type
        if (filterType === 'perMonth' || filterType === 'perYear') {
            pmsPerDeptWorksheet.columns = [
                { width: 20 }, // Period (Month/Year)
                { width: 25 }, // Department
                { width: 10 }, // Open
                { width: 12 }, // In Progress
                { width: 10 }, // Assigned
                { width: 10 }, // Resolved
                { width: 10 }, // Closed
                { width: 10 }, // Total
                { width: 15 }, // Resolution Rate
                { width: 20 }, // Tag ID
                { width: 20 }, // Ticket ID
                { width: 15 }, // Status
                { width: 20 }, // Assigned To
                { width: 20 }, // Requested By
                { width: 20 }, // Created At
                { width: 15 }  // Location
            ];
        } else {
            pmsPerDeptWorksheet.columns = [
                { width: 25 }, // Department
                { width: 10 }, // Open
                { width: 12 }, // In Progress
                { width: 10 }, // Assigned
                { width: 10 }, // Resolved
                { width: 10 }, // Closed
                { width: 10 }, // Total
                { width: 15 }, // Resolution Rate
                { width: 20 }, // Tag ID
                { width: 20 }, // Ticket ID
                { width: 15 }, // Status
                { width: 20 }, // Assigned To
                { width: 20 }, // Requested By
                { width: 20 }, // Created At
                { width: 15 }  // Location
            ];
        }

        // Add title with filter info
        const titleRow = pmsPerDeptWorksheet.addRow([`PMS per Department - ${location === 'all' ? 'All Locations' : location.toUpperCase()}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '053b00ff' }
        };
        titleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
        pmsPerDeptWorksheet.mergeCells(`A${titleRow.number}:O${titleRow.number}`);

        pmsPerDeptWorksheet.addRow([`Time Period: ${filterType === 'all' ? 'All Time' : filterType}`]);
        pmsPerDeptWorksheet.addRow([]);

        // Add period information for perMonth/perYear
        if (filterType === 'perMonth' || filterType === 'perYear') {
            const periodInfo = pmsPerDeptWorksheet.addRow([`View: ${filterType === 'perMonth' ? 'Monthly Breakdown' : 'Yearly Breakdown'} - Tickets are grouped by ${filterType === 'perMonth' ? 'month' : 'year'} in the details section`]);
            periodInfo.font = { italic: true };
            pmsPerDeptWorksheet.mergeCells(`A${periodInfo.number}:O${periodInfo.number}`);
            pmsPerDeptWorksheet.addRow([]);
        }

        // ===== SUMMARY TABLE SECTION =====
        const summaryHeaderRow = pmsPerDeptWorksheet.addRow([
            'SUMMARY TABLE',
            '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ]);
        summaryHeaderRow.font = { bold: true, size: 12 };
        summaryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E6E6FA' }
        };
        pmsPerDeptWorksheet.mergeCells(`A${summaryHeaderRow.number}:O${summaryHeaderRow.number}`);

        pmsPerDeptWorksheet.addRow([]);

        // Add summary headers based on filter type
        let summaryHeaders;
        if (filterType === 'perMonth' || filterType === 'perYear') {
            summaryHeaders = [
                "Department",
                "Open",
                "In Progress",
                "Assigned",
                "Resolved",
                "Closed",
                "Total",
                "Resolution Rate",
                "", "", "", "", "", "", "" // Empty cells for spacing
            ];
        } else {
            summaryHeaders = [
                "Department",
                "Open",
                "In Progress",
                "Assigned",
                "Resolved",
                "Closed",
                "Total",
                "Resolution Rate",
                "", "", "", "", "", "", "" // Empty cells for spacing
            ];
        }

        const summaryHeaderRow2 = pmsPerDeptWorksheet.addRow(summaryHeaders);
        summaryHeaderRow2.font = { bold: true };
        summaryHeaderRow2.eachCell((cell, colNumber) => {
            if (colNumber <= 8) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '053b00ff' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        });

        // Add summary data rows
        let grandTotal = { open: 0, inprogress: 0, assigned: 0, resolved: 0, closed: 0, total: 0 };

        sortedDepartments.forEach(dept => {
            const stats = deptSummary[dept];
            const resolutionRate = stats.total > 0
                ? ((stats.closed / stats.total) * 100).toFixed(1) + '%'
                : '0%';

            const row = pmsPerDeptWorksheet.addRow([
                dept,
                stats.open,
                stats.inprogress,
                stats.assigned,
                stats.resolved,
                stats.closed,
                stats.total,
                resolutionRate,
                '', '', '', '', '', '', ''
            ]);

            // Style summary row
            row.eachCell((cell, colNumber) => {
                if (colNumber <= 8) {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'center' };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'F5F5F5' }
                    };
                }
            });

            // Add to grand totals
            grandTotal.open += stats.open;
            grandTotal.inprogress += stats.inprogress;
            grandTotal.assigned += stats.assigned;
            grandTotal.resolved += stats.resolved;
            grandTotal.closed += stats.closed;
            grandTotal.total += stats.total;
        });

        // Add grand total row for summary
        const grandTotalResolutionRate = grandTotal.total > 0
            ? ((grandTotal.closed / grandTotal.total) * 100).toFixed(1) + '%'
            : '0%';

        const grandTotalRow = pmsPerDeptWorksheet.addRow([
            'GRAND TOTAL',
            grandTotal.open,
            grandTotal.inprogress,
            grandTotal.assigned,
            grandTotal.resolved,
            grandTotal.closed,
            grandTotal.total,
            grandTotalResolutionRate,
            '', '', '', '', '', '', ''
        ]);

        grandTotalRow.font = { bold: true };
        grandTotalRow.eachCell((cell, colNumber) => {
            if (colNumber <= 8) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'e9ecef' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'center' };
            }
        });

        // Add spacing before details section
        pmsPerDeptWorksheet.addRow([]);
        pmsPerDeptWorksheet.addRow([]);

        // ===== DETAILS SECTION =====
        const detailsHeaderRow = pmsPerDeptWorksheet.addRow([
            'DETAILED TICKETS BY DEPARTMENT',
            '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ]);
        detailsHeaderRow.font = { bold: true, size: 12 };
        detailsHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E6E6FA' }
        };
        pmsPerDeptWorksheet.mergeCells(`A${detailsHeaderRow.number}:O${detailsHeaderRow.number}`);

        pmsPerDeptWorksheet.addRow([]);

        // Add details headers based on filter type
        let detailHeaders;
        if (filterType === 'perMonth') {
            detailHeaders = [
                "Month",
                "Department",
                "Open",
                "In Progress",
                "Assigned",
                "Resolved",
                "Closed",
                "Total",
                "Tag ID",
                "Ticket ID",
                "Status",
                "Assigned To",
                "Requested By",
                "Created At",
                "Location"
            ];
        } else if (filterType === 'perYear') {
            detailHeaders = [
                "Year",
                "Department",
                "Open",
                "In Progress",
                "Assigned",
                "Resolved",
                "Closed",
                "Total",
                "Tag ID",
                "Ticket ID",
                "Status",
                "Assigned To",
                "Requested By",
                "Created At",
                "Location"
            ];
        } else {
            detailHeaders = [
                "Department",
                "Open",
                "In Progress",
                "Assigned",
                "Resolved",
                "Closed",
                "Total",
                "Resolution Rate",
                "Tag ID",
                "Ticket ID",
                "Status",
                "Assigned To",
                "Requested By",
                "Created At",
                "Location"
            ];
        }

        const detailHeaderRow2 = pmsPerDeptWorksheet.addRow(detailHeaders);
        detailHeaderRow2.font = { bold: true };
        detailHeaderRow2.eachCell((cell, colNumber) => {
            // Style all columns in the details section
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '053b00ff' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        if (filterType === 'perMonth' || filterType === 'perYear') {
            // For perMonth/perYear view - group by period first, then by department
            // First, group tickets by period
            const ticketsByPeriod = {};

            ticketsWithDetails.forEach(ticket => {
                const periodKey = ticket.periodKey;
                if (!ticketsByPeriod[periodKey]) {
                    ticketsByPeriod[periodKey] = {
                        displayName: ticket.periodDisplay,
                        departments: {}
                    };
                }

                const dept = ticket.department;
                if (!ticketsByPeriod[periodKey].departments[dept]) {
                    ticketsByPeriod[periodKey].departments[dept] = [];
                }

                ticketsByPeriod[periodKey].departments[dept].push(ticket);
            });

            // Sort periods chronologically
            const sortedPeriods = Object.keys(ticketsByPeriod).sort();

            // For each period, add department sections
            sortedPeriods.forEach(periodKey => {
                const period = ticketsByPeriod[periodKey];
                const departmentsInPeriod = Object.keys(period.departments).sort();

                // For each department in this period
                departmentsInPeriod.forEach(dept => {
                    const deptTicketsInPeriod = period.departments[dept];

                    // Sort tickets by date (newest first)
                    deptTicketsInPeriod.sort((a, b) => b.sortDate - a.sortDate);

                    // Calculate period totals for this department
                    const periodStats = {
                        open: 0,
                        inprogress: 0,
                        assigned: 0,
                        resolved: 0,
                        closed: 0,
                        total: deptTicketsInPeriod.length
                    };

                    deptTicketsInPeriod.forEach(ticket => {
                        const status = ticket.pms_status?.toLowerCase() || '';
                        if (status.includes('open')) periodStats.open++;
                        else if (status.includes('progress')) periodStats.inprogress++;
                        else if (status.includes('assigned')) periodStats.assigned++;
                        else if (status.includes('resolved')) periodStats.resolved++;
                        else if (status.includes('closed')) periodStats.closed++;
                    });

                    // Add department header with stats
                    const deptHeaderValues = Array(15).fill('');
                    deptHeaderValues[0] = period.displayName; // Period
                    deptHeaderValues[1] = dept; // Department
                    deptHeaderValues[2] = periodStats.open;
                    deptHeaderValues[3] = periodStats.inprogress;
                    deptHeaderValues[4] = periodStats.assigned;
                    deptHeaderValues[5] = periodStats.resolved;
                    deptHeaderValues[6] = periodStats.closed;
                    deptHeaderValues[7] = periodStats.total;

                    const deptHeaderRow = pmsPerDeptWorksheet.addRow(deptHeaderValues);
                    deptHeaderRow.font = { bold: true, size: 11 };
                    deptHeaderRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E6E6FA' }
                    };

                    // Add tickets for this department in this period
                    deptTicketsInPeriod.forEach(ticket => {
                        const rowValues = Array(15).fill('');
                        rowValues[0] = ''; // Period (blank for detail rows)
                        rowValues[1] = ''; // Department (blank for detail rows)
                        rowValues[2] = ''; // Open
                        rowValues[3] = ''; // In Progress
                        rowValues[4] = ''; // Assigned
                        rowValues[5] = ''; // Resolved
                        rowValues[6] = ''; // Closed
                        rowValues[7] = ''; // Total
                        rowValues[8] = ticket.tag_id || ''; // Tag ID (col 9)
                        rowValues[9] = ticket.pmsticket_id || ''; // Ticket ID (col 10)
                        rowValues[10] = ticket.pms_status || ''; // Status (col 11)
                        rowValues[11] = ticket.assigned_to || ''; // Assigned To (col 12)
                        rowValues[12] = ticket.pmsticket_for || ''; // Requested By (col 13)
                        rowValues[13] = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ''; // Created At (col 14)
                        rowValues[14] = ticket.assigned_location?.toUpperCase() || 'N/A'; // Location (col 15)

                        const row = pmsPerDeptWorksheet.addRow(rowValues);

                        // Style detail row
                        row.eachCell((cell, colNumber) => {
                            if (colNumber >= 9 && colNumber <= 15) {
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                                cell.alignment = { vertical: 'middle' };

                                // Color code based on status (for Status column - col 11)
                                if (colNumber === 11) {
                                    if (ticket.pms_status === 'open') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4B5' } };
                                    } else if (ticket.pms_status === 'inprogress') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
                                    } else if (ticket.pms_status === 'assigned') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '87CEEB' } };
                                    } else if (ticket.pms_status === 'resolved') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '98FB98' } };
                                    } else if (ticket.pms_status === 'closed') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
                                    }
                                }
                            }
                        });
                    });

                    // Add empty row after each department in the period
                    pmsPerDeptWorksheet.addRow([]);
                });

                // Add empty row after each period
                pmsPerDeptWorksheet.addRow([]);
            });

        } else {
            // For non-perMonth/perYear view - group by department only
            sortedDepartments.forEach(dept => {
                const deptTicketList = deptTickets[dept] || [];

                if (deptTicketList.length > 0) {
                    // Sort tickets by date (newest first)
                    deptTicketList.sort((a, b) => b.sortDate - a.sortDate);

                    // Add department header with stats
                    const stats = deptSummary[dept];
                    const resolutionRate = stats.total > 0
                        ? ((stats.closed / stats.total) * 100).toFixed(1) + '%'
                        : '0%';

                    const deptHeaderValues = Array(15).fill('');
                    deptHeaderValues[0] = dept; // Department
                    deptHeaderValues[1] = stats.open;
                    deptHeaderValues[2] = stats.inprogress;
                    deptHeaderValues[3] = stats.assigned;
                    deptHeaderValues[4] = stats.resolved;
                    deptHeaderValues[5] = stats.closed;
                    deptHeaderValues[6] = stats.total;
                    deptHeaderValues[7] = resolutionRate;

                    const deptHeaderRow = pmsPerDeptWorksheet.addRow(deptHeaderValues);
                    deptHeaderRow.font = { bold: true, size: 11 };
                    deptHeaderRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E6E6FA' }
                    };

                    // Add tickets for this department
                    deptTicketList.forEach(ticket => {
                        const rowValues = Array(15).fill('');
                        rowValues[0] = ''; // Department (blank for detail rows)
                        rowValues[1] = ''; // Open
                        rowValues[2] = ''; // In Progress
                        rowValues[3] = ''; // Assigned
                        rowValues[4] = ''; // Resolved
                        rowValues[5] = ''; // Closed
                        rowValues[6] = ''; // Total
                        rowValues[7] = ''; // Resolution Rate
                        rowValues[8] = ticket.tag_id || ''; // Tag ID (col 9)
                        rowValues[9] = ticket.pmsticket_id || ''; // Ticket ID (col 10)
                        rowValues[10] = ticket.pms_status || ''; // Status (col 11)
                        rowValues[11] = ticket.assigned_to || ''; // Assigned To (col 12)
                        rowValues[12] = ticket.pmsticket_for || ''; // Requested By (col 13)
                        rowValues[13] = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ''; // Created At (col 14)
                        rowValues[14] = ticket.assigned_location?.toUpperCase() || 'N/A'; // Location (col 15)

                        const row = pmsPerDeptWorksheet.addRow(rowValues);

                        // Style detail row
                        row.eachCell((cell, colNumber) => {
                            if (colNumber >= 9 && colNumber <= 15) {
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                                cell.alignment = { vertical: 'middle' };

                                // Color code based on status (for Status column - col 11)
                                if (colNumber === 11) {
                                    if (ticket.pms_status === 'open') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4B5' } };
                                    } else if (ticket.pms_status === 'inprogress') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
                                    } else if (ticket.pms_status === 'assigned') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '87CEEB' } };
                                    } else if (ticket.pms_status === 'resolved') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '98FB98' } };
                                    } else if (ticket.pms_status === 'closed') {
                                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
                                    }
                                }
                            }
                        });
                    });

                    // Add empty row after each department
                    pmsPerDeptWorksheet.addRow([]);
                }
            });
        }

        // Add final grand total for details
        pmsPerDeptWorksheet.addRow([]);
        const finalTotalRow = pmsPerDeptWorksheet.addRow([
            'TOTAL TICKETS:', '', '', '', '', '', '',
            '', '', '', '', '', ticketsToExport.length.toString(), '', ''
        ]);
        finalTotalRow.font = { bold: true };
        finalTotalRow.getCell(13).font = { bold: true };

        // ===== SHEET 4: Assets by PMS Category =====
        const categoryWorksheet = workbook.addWorksheet("Assets by PMS Category");

        // Set column widths for category sheet
        categoryWorksheet.columns = [
            { width: 20 }, // Period/Category
            { width: 15 }, // Tag ID
            { width: 25 }, // Asset Name
            { width: 30 }, // Description
            { width: 15 }, // Model
            { width: 15 }, // Serial No
            { width: 15 }, // Location
            { width: 15 }, // Department
            { width: 15 }  // Status
        ];

        // Add title with filter info - FIXED to show correct time period text
        const getDateRangeText = () => {
            const now = new Date();
            switch (filterType) {
                case 'today':
                    return `Today (${now.toLocaleDateString()})`;
                case 'thisWeek':
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    return `This Week (${startOfWeek.toLocaleDateString()} - ${now.toLocaleDateString()})`;
                case 'lastWeek':
                    const lastWeekStart = new Date(now);
                    lastWeekStart.setDate(now.getDate() - now.getDay() - 6);
                    const lastWeekEnd = new Date(now);
                    lastWeekEnd.setDate(now.getDate() - now.getDay());
                    return `Last Week (${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()})`;
                case 'thisMonth':
                    return `This Month (${new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString()} - ${now.toLocaleDateString()})`;
                case 'perMonth':
                    return `Year ${now.getFullYear()} (Jan - Dec)`;
                case 'perYear':
                    return `All Years (All available years)`;
                default:
                    return 'All Time';
            }
        };

        const categoryTitleRow = categoryWorksheet.addRow([`Assets by PMS Category - ${location === 'all' ? 'All Locations' : location.toUpperCase()}`]);
        categoryTitleRow.font = { bold: true, size: 14 };
        categoryTitleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '053b00ff' }
        };
        categoryTitleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
        categoryWorksheet.mergeCells(`A${categoryTitleRow.number}:I${categoryTitleRow.number}`);

        categoryWorksheet.addRow([`Time Period: ${getDateRangeText()}`]);
        categoryWorksheet.addRow([]);

        // Get all tag_ids from filtered tickets
        const tagIDs = ticketsToExport.map(t => t.tag_id).filter(id => id);

        // Fetch all assets (including inactive for unregistered check)
        try {
            const res = await axios.get(`${config.baseApi}/pms/get-all-assets`);
            const allAssets = res.data || [];

            // Get all active assets for registered check
            let allActiveAssets = allAssets.filter(a => a.is_active === '1');

            // Create a Set of ALL active tag_ids for missing tag ID calculation
            const allActiveTagIds = new Set(allActiveAssets.map(a => a.tag_id));

            // Find tag_ids that are in filtered tickets but not in ALL active assets
            const missingTagIds = tagIDs.filter(tagId => !allActiveTagIds.has(tagId));

            // Apply location filtering to active_assets for the display
            let activeAssets = [...allActiveAssets];

            if (location && location !== 'all') {
                if (location.toLowerCase() === 'all') {
                    activeAssets = activeAssets.filter(a => {
                        return a.assigned_location &&
                            (a.assigned_location.toLowerCase() === 'lmd' ||
                                a.assigned_location.toLowerCase() === 'corp');
                    });
                } else if (location.toLowerCase() === 'lmd') {
                    activeAssets = activeAssets.filter(a => {
                        return a.assigned_location && a.assigned_location.toLowerCase() === 'lmd';
                    });
                } else if (location.toLowerCase() === 'corp') {
                    activeAssets = activeAssets.filter(a => {
                        return a.assigned_location && a.assigned_location.toLowerCase() === 'corp';
                    });
                } else {
                    activeAssets = activeAssets.filter(a => {
                        return a.assigned_location && a.assigned_location.toLowerCase() === location.toLowerCase();
                    });
                }
            }

            // Filter assets that have matching tag_ids from filtered tickets
            const assetsWithMatchingTagIds = activeAssets.filter(asset =>
                tagIDs.includes(asset.tag_id)
            );

            // Handle time-based views (perMonth/perYear) differently
            if (filterType === 'perMonth') {
                // Initialize months
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // Create monthly data structure
                const monthlyAssets = {};
                months.forEach(month => {
                    monthlyAssets[month] = {};
                });

                // Helper function to get month name
                const getMonthName = (dateStr) => {
                    try {
                        const date = new Date(dateStr);
                        return date.toLocaleString('default', { month: 'short' });
                    } catch (error) {
                        return 'Unknown';
                    }
                };

                // Process each ticket and group by month
                ticketsToExport.forEach(ticket => {
                    const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                    if (!ticketDate) return;

                    const month = getMonthName(ticketDate);

                    // Find matching asset for this ticket
                    const matchingAsset = assetsWithMatchingTagIds.find(a => a.tag_id === ticket.tag_id);

                    if (matchingAsset) {
                        const category = matchingAsset.pms_category || 'Uncategorized';

                        // Update assets for table
                        if (!monthlyAssets[month][category]) {
                            monthlyAssets[month][category] = [];
                        }

                        // Check if asset already added to this month/category
                        const assetExists = monthlyAssets[month][category].some(
                            a => a.tag_id === matchingAsset.tag_id
                        );

                        if (!assetExists) {
                            monthlyAssets[month][category].push(matchingAsset);
                        }
                    }
                });

                // Handle unregistered assets per month
                if (missingTagIds.length > 0) {
                    const unregisteredCategory = 'Unregistered Assets';

                    ticketsToExport.forEach(ticket => {
                        if (missingTagIds.includes(ticket.tag_id)) {
                            const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                            if (!ticketDate) return;

                            const month = getMonthName(ticketDate);

                            // Create placeholder asset
                            const placeholderAsset = {
                                tag_id: ticket.tag_id,
                                asset_name: 'Not Registered',
                                description: 'Asset tag ID exists in tickets but not registered in asset system',
                                model: '-',
                                serial_no: '-',
                                assigned_location: '-',
                                department: '-',
                                is_active: '0',
                                id: `unregistered-${ticket.tag_id}-${month}`
                            };

                            // Add to monthly assets
                            if (!monthlyAssets[month][unregisteredCategory]) {
                                monthlyAssets[month][unregisteredCategory] = [];
                            }

                            const assetExists = monthlyAssets[month][unregisteredCategory].some(
                                a => a.tag_id === ticket.tag_id
                            );

                            if (!assetExists) {
                                monthlyAssets[month][unregisteredCategory].push(placeholderAsset);
                            }
                        }
                    });
                }

                // Add headers for perMonth view
                const perMonthHeaders = [
                    "Month",
                    "Tag ID",
                    "Asset Name",
                    "Description",
                    "Model",
                    "Serial No",
                    "Location",
                    "Department",
                    "Status"
                ];

                const perMonthHeaderRow = categoryWorksheet.addRow(perMonthHeaders);
                perMonthHeaderRow.font = { bold: true };
                perMonthHeaderRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Add data rows grouped by month and category
                months.forEach(month => {
                    const categories = monthlyAssets[month];
                    const hasAssets = Object.keys(categories).length > 0;

                    if (hasAssets) {
                        // Add month header
                        const monthHeaderRow = categoryWorksheet.addRow([`${month}`]);
                        monthHeaderRow.font = { bold: true, size: 12 };
                        monthHeaderRow.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'E6E6FA' }
                        };
                        categoryWorksheet.mergeCells(`A${monthHeaderRow.number}:I${monthHeaderRow.number}`);

                        // Add assets for this month
                        Object.entries(categories).forEach(([category, assets]) => {
                            // Add category sub-header
                            const categorySubHeaderRow = categoryWorksheet.addRow([`  ${category} (${assets.length} assets)`]);
                            categorySubHeaderRow.font = { bold: true, italic: true };
                            categorySubHeaderRow.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'F0F8FF' }
                            };
                            categoryWorksheet.mergeCells(`A${categorySubHeaderRow.number}:I${categorySubHeaderRow.number}`);

                            // Add assets
                            assets.forEach(asset => {
                                const isUnregistered = asset.asset_name === 'Not Registered';

                                const row = categoryWorksheet.addRow([
                                    month,
                                    asset.tag_id || '',
                                    asset.asset_name || '-',
                                    asset.description || '-',
                                    asset.model || '-',
                                    asset.serial_no || '-',
                                    asset.assigned_location || '-',
                                    asset.department || '-',
                                    isUnregistered ? 'Unregistered' : (asset.is_active === '1' ? 'Active' : 'Inactive')
                                ]);

                                // Style the row
                                row.eachCell(cell => {
                                    cell.border = {
                                        top: { style: 'thin' },
                                        left: { style: 'thin' },
                                        bottom: { style: 'thin' },
                                        right: { style: 'thin' }
                                    };
                                    cell.alignment = { vertical: 'middle', wrapText: true };
                                });

                                // Color code based on status
                                if (isUnregistered) {
                                    row.getCell(9).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'FFCDD2' }
                                    };
                                } else if (asset.is_active === '1') {
                                    row.getCell(9).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'C8E6C9' }
                                    };
                                }
                            });
                        });

                        // Add empty row after each month
                        categoryWorksheet.addRow([]);
                    }
                });

            } else if (filterType === 'perYear') {
                // ===== PER YEAR VIEW =====
                // This will now show ALL years because ticketsToExport contains all years

                // Create yearly data structure
                const yearlyAssets = {};

                // Helper function to get year
                const getYear = (dateStr) => {
                    try {
                        const date = new Date(dateStr);
                        return date.getFullYear().toString();
                    } catch (error) {
                        return 'Unknown';
                    }
                };

                // Process each ticket and group by year
                ticketsToExport.forEach(ticket => {
                    const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                    if (!ticketDate) return;

                    const year = getYear(ticketDate);

                    // Find matching asset for this ticket
                    const matchingAsset = assetsWithMatchingTagIds.find(a => a.tag_id === ticket.tag_id);

                    if (matchingAsset) {
                        const category = matchingAsset.pms_category || 'Uncategorized';

                        // Update assets for table
                        if (!yearlyAssets[year]) {
                            yearlyAssets[year] = {};
                        }

                        if (!yearlyAssets[year][category]) {
                            yearlyAssets[year][category] = [];
                        }

                        // Check if asset already added to this year/category
                        const assetExists = yearlyAssets[year][category].some(
                            a => a.tag_id === matchingAsset.tag_id
                        );

                        if (!assetExists) {
                            yearlyAssets[year][category].push(matchingAsset);
                        }
                    }
                });

                // Handle unregistered assets per year
                if (missingTagIds.length > 0) {
                    const unregisteredCategory = 'Unregistered Assets';

                    ticketsToExport.forEach(ticket => {
                        if (missingTagIds.includes(ticket.tag_id)) {
                            const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                            if (!ticketDate) return;

                            const year = getYear(ticketDate);

                            // Create placeholder asset
                            const placeholderAsset = {
                                tag_id: ticket.tag_id,
                                asset_name: 'Not Registered',
                                description: 'Asset tag ID exists in tickets but not registered in asset system',
                                model: '-',
                                serial_no: '-',
                                assigned_location: '-',
                                department: '-',
                                is_active: '0',
                                id: `unregistered-${ticket.tag_id}-${year}`
                            };

                            // Add to yearly assets
                            if (!yearlyAssets[year]) {
                                yearlyAssets[year] = {};
                            }

                            if (!yearlyAssets[year][unregisteredCategory]) {
                                yearlyAssets[year][unregisteredCategory] = [];
                            }

                            const assetExists = yearlyAssets[year][unregisteredCategory].some(
                                a => a.tag_id === ticket.tag_id
                            );

                            if (!assetExists) {
                                yearlyAssets[year][unregisteredCategory].push(placeholderAsset);
                            }
                        }
                    });
                }

                // Add headers for perYear view
                const perYearHeaders = [
                    "Year",
                    "Tag ID",
                    "Asset Name",
                    "Description",
                    "Model",
                    "Serial No",
                    "Location",
                    "Department",
                    "Status"
                ];

                const perYearHeaderRow = categoryWorksheet.addRow(perYearHeaders);
                perYearHeaderRow.font = { bold: true };
                perYearHeaderRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Sort years chronologically
                const sortedYears = Object.keys(yearlyAssets).sort();

                // Add data rows grouped by year and category
                sortedYears.forEach(year => {
                    const categories = yearlyAssets[year];
                    const hasAssets = Object.keys(categories).length > 0;

                    if (hasAssets) {
                        // Add year header
                        const yearHeaderRow = categoryWorksheet.addRow([`${year}`]);
                        yearHeaderRow.font = { bold: true, size: 12 };
                        yearHeaderRow.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'E6E6FA' }
                        };
                        categoryWorksheet.mergeCells(`A${yearHeaderRow.number}:I${yearHeaderRow.number}`);

                        // Add assets for this year
                        Object.entries(categories).forEach(([category, assets]) => {
                            // Add category sub-header
                            const categorySubHeaderRow = categoryWorksheet.addRow([`  ${category} (${assets.length} assets)`]);
                            categorySubHeaderRow.font = { bold: true, italic: true };
                            categorySubHeaderRow.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'F0F8FF' }
                            };
                            categoryWorksheet.mergeCells(`A${categorySubHeaderRow.number}:I${categorySubHeaderRow.number}`);

                            // Add assets
                            assets.forEach(asset => {
                                const isUnregistered = asset.asset_name === 'Not Registered';

                                const row = categoryWorksheet.addRow([
                                    year,
                                    asset.tag_id || '',
                                    asset.asset_name || '-',
                                    asset.description || '-',
                                    asset.model || '-',
                                    asset.serial_no || '-',
                                    asset.assigned_location || '-',
                                    asset.department || '-',
                                    isUnregistered ? 'Unregistered' : (asset.is_active === '1' ? 'Active' : 'Inactive')
                                ]);

                                // Style the row
                                row.eachCell(cell => {
                                    cell.border = {
                                        top: { style: 'thin' },
                                        left: { style: 'thin' },
                                        bottom: { style: 'thin' },
                                        right: { style: 'thin' }
                                    };
                                    cell.alignment = { vertical: 'middle', wrapText: true };
                                });

                                // Color code based on status
                                if (isUnregistered) {
                                    row.getCell(9).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'FFCDD2' }
                                    };
                                } else if (asset.is_active === '1') {
                                    row.getCell(9).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'C8E6C9' }
                                    };
                                }
                            });
                        });

                        // Add empty row after each year
                        categoryWorksheet.addRow([]);
                    }
                });

            } else {
                // Non-time-based view - group by category only
                const categoryAssetsMap = {};

                // Add existing assets to their categories
                assetsWithMatchingTagIds.forEach(asset => {
                    const category = asset.pms_category || 'Uncategorized';
                    if (!categoryAssetsMap[category]) {
                        categoryAssetsMap[category] = [];
                    }
                    categoryAssetsMap[category].push(asset);
                });

                // Add "Unregistered Assets" category for missing tag_ids
                if (missingTagIds.length > 0) {
                    const unregisteredCategory = 'Unregistered Assets';
                    if (!categoryAssetsMap[unregisteredCategory]) {
                        categoryAssetsMap[unregisteredCategory] = [];
                    }

                    missingTagIds.forEach(tagId => {
                        categoryAssetsMap[unregisteredCategory].push({
                            tag_id: tagId,
                            asset_name: 'Not Registered',
                            description: 'Asset tag ID exists in tickets but not registered in asset system',
                            model: '-',
                            serial_no: '-',
                            assigned_location: '-',
                            department: '-',
                            is_active: '0',
                            id: `unregistered-${tagId}`
                        });
                    });
                }

                // Sort categories alphabetically
                const sortedCategories = Object.keys(categoryAssetsMap).sort();

                // Add headers
                const categoryHeaders = [
                    "PMS Category",
                    "Tag ID",
                    "Asset Name",
                    "Description",
                    "Model",
                    "Serial No",
                    "Location",
                    "Department",
                    "Status"
                ];

                const categoryHeaderRow = categoryWorksheet.addRow(categoryHeaders);
                categoryHeaderRow.font = { bold: true };
                categoryHeaderRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Add data rows grouped by category
                sortedCategories.forEach(category => {
                    const assets = categoryAssetsMap[category];

                    // Add category header row
                    const categoryHeaderRow = categoryWorksheet.addRow([`${category} (${assets.length} assets)`]);
                    categoryHeaderRow.font = { bold: true, size: 12 };
                    categoryHeaderRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E6E6FA' }
                    };
                    categoryWorksheet.mergeCells(`A${categoryHeaderRow.number}:I${categoryHeaderRow.number}`);

                    // Add assets for this category
                    assets.forEach(asset => {
                        const isUnregistered = asset.asset_name === 'Not Registered';

                        const row = categoryWorksheet.addRow([
                            category,
                            asset.tag_id || '',
                            asset.asset_name || '-',
                            asset.description || '-',
                            asset.model || '-',
                            asset.serial_no || '-',
                            asset.assigned_location || '-',
                            asset.department || '-',
                            isUnregistered ? 'Unregistered' : (asset.is_active === '1' ? 'Active' : 'Inactive')
                        ]);

                        // Style the row
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            cell.alignment = { vertical: 'middle', wrapText: true };
                        });

                        // Color code based on status
                        if (isUnregistered) {
                            row.getCell(9).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFCDD2' }
                            };
                        } else if (asset.is_active === '1') {
                            row.getCell(9).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'C8E6C9' }
                            };
                        }
                    });

                    // Add empty row after each category
                    categoryWorksheet.addRow([]);
                });

                // Add summary statistics
                categoryWorksheet.addRow([]);
                categoryWorksheet.addRow(['SUMMARY STATISTICS']);
                categoryWorksheet.getRow(categoryWorksheet.lastRow.number).font = { bold: true, size: 12 };

                const totalCategories = sortedCategories.length;
                const totalAssetsCat = Object.values(categoryAssetsMap).reduce((sum, assets) => sum + assets.length, 0);
                const totalUnregistered = categoryAssetsMap['Unregistered Assets']?.length || 0;
                const totalRegistered = totalAssetsCat - totalUnregistered;

                categoryWorksheet.addRow(['Total Categories:', totalCategories]);
                categoryWorksheet.addRow(['Total Assets:', totalAssetsCat]);
                categoryWorksheet.addRow(['Registered Assets:', totalRegistered]);
                categoryWorksheet.addRow(['Unregistered Assets:', totalUnregistered]);

                if (totalAssetsCat > 0) {
                    const registeredPercentage = ((totalRegistered / totalAssetsCat) * 100).toFixed(2);
                    categoryWorksheet.addRow(['Registration Rate:', `${registeredPercentage}%`]);
                }
            }

        } catch (error) {
            console.error('Error fetching assets for Excel:', error);
            categoryWorksheet.addRow(['Error loading asset data']);
        }

        // ===== SHEET 5: TAT Statistics =====
        const tatWorksheet = workbook.addWorksheet("TAT Statistics");

        // Set column widths for TAT sheet
        tatWorksheet.columns = [
            { width: 20 }, // Category/Month/Year
            { width: 10 }, // 30m
            { width: 10 }, // 1h
            { width: 10 }, // 2h
            { width: 10 }, // 1d
            { width: 10 }, // 2d
            { width: 10 }, // 3d
            { width: 12 }  // Total
        ];

        // Add title with filter info
        const tatTitleRow = tatWorksheet.addRow([`TAT Statistics by ${filterType === 'perMonth' ? 'Month' : filterType === 'perYear' ? 'Year' : 'Category'} - ${location === 'all' ? 'All Locations' : location.toUpperCase()}`]);
        tatTitleRow.font = { bold: true, size: 14 };
        tatTitleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '053b00ff' }
        };
        tatTitleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
        tatWorksheet.mergeCells(`A${tatTitleRow.number}:H${tatTitleRow.number}`);

        tatWorksheet.addRow([`Time Period: ${filterType === 'all' ? 'All Time' : filterType}`]);
        tatWorksheet.addRow([]);

        // Fetch TAT data
        try {
            const tatRes = await axios.get(`${config.baseApi}/tat/get-all-pms-tat`);
            let tatData = tatRes.data || [];

            // Apply location filter
            if (location && location !== 'all') {
                tatData = tatData.filter(item => {
                    const itemLocation = item.assigned_location || item.location || '';
                    return itemLocation.toLowerCase() === location.toLowerCase();
                });
            }

            // Apply date filter based on filterType
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (filterType !== 'all') {
                tatData = tatData.filter(item => {
                    const itemDate = new Date(item.created_at || item.date || item.timestamp);

                    switch (filterType) {
                        case 'today':
                            return itemDate >= today;
                        case 'thisWeek': {
                            const startOfWeek = new Date(today);
                            const day = today.getDay();
                            const diff = day === 0 ? 6 : day - 1;
                            startOfWeek.setDate(today.getDate() - diff);
                            return itemDate >= startOfWeek;
                        }
                        case 'lastWeek': {
                            const startOfLastWeek = new Date(today);
                            const day = today.getDay();
                            const diff = day === 0 ? 6 : day - 1;
                            startOfLastWeek.setDate(today.getDate() - diff - 7);
                            const endOfLastWeek = new Date(startOfLastWeek);
                            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
                            return itemDate >= startOfLastWeek && itemDate <= endOfLastWeek;
                        }
                        case 'perMonth':
                        case 'perYear':
                            // For perYear, we want ALL TAT data, not just current year
                            return true;
                        default:
                            return true;
                    }
                });
            }

            // Process data based on filterType
            if (filterType === 'perMonth') {
                // Month names
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                // Create monthly map
                const monthlyMap = new Map();
                monthNames.forEach(month => {
                    monthlyMap.set(month, {
                        name: month,
                        '30m': 0,
                        '1h': 0,
                        '2h': 0,
                        '1d': 0,
                        '2d': 0,
                        '3d': 0,
                        total: 0
                    });
                });

                // Aggregate data by month
                tatData.forEach(item => {
                    const itemDate = new Date(item.created_at || item.date || item.timestamp);
                    const monthIndex = itemDate.getMonth();
                    const month = monthNames[monthIndex];
                    const tat = item.tat || item.tat_category;

                    const monthData = monthlyMap.get(month);
                    if (monthData) {
                        monthData.total++;
                        if (tat === '1h') monthData['1h']++;
                        else if (tat === '30m') monthData['30m']++;
                        else if (tat === '2h') monthData['2h']++;
                        else if (tat === '1d') monthData['1d']++;
                        else if (tat === '2d') monthData['2d']++;
                        else if (tat === '3d') monthData['3d']++;
                    }
                });

                // Add headers
                const headers = [
                    "Month",
                    "30m",
                    "1h",
                    "2h",
                    "1d",
                    "2d",
                    "3d",
                    "Total"
                ];

                const headerRow = tatWorksheet.addRow(headers);
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Add data rows
                let grandTotal = 0;
                const tatTotals = { '30m': 0, '1h': 0, '2h': 0, '1d': 0, '2d': 0, '3d': 0 };

                monthNames.forEach(month => {
                    const monthData = monthlyMap.get(month);

                    const row = tatWorksheet.addRow([
                        month,
                        monthData['30m'],
                        monthData['1h'],
                        monthData['2h'],
                        monthData['1d'],
                        monthData['2d'],
                        monthData['3d'],
                        monthData.total
                    ]);

                    // Style the row
                    row.eachCell((cell, colNumber) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
                    });

                    // Add to grand totals
                    grandTotal += monthData.total;
                    tatTotals['30m'] += monthData['30m'];
                    tatTotals['1h'] += monthData['1h'];
                    tatTotals['2h'] += monthData['2h'];
                    tatTotals['1d'] += monthData['1d'];
                    tatTotals['2d'] += monthData['2d'];
                    tatTotals['3d'] += monthData['3d'];
                });

                // Add total row
                tatWorksheet.addRow([]);
                const totalRow = tatWorksheet.addRow([
                    'TOTAL',
                    tatTotals['30m'],
                    tatTotals['1h'],
                    tatTotals['2h'],
                    tatTotals['1d'],
                    tatTotals['2d'],
                    tatTotals['3d'],
                    grandTotal
                ]);

                totalRow.font = { bold: true };
                totalRow.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'e9ecef' }
                    };
                    cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center' };
                });

            } else if (filterType === 'perYear') {
                // Group by year - now showing ALL years
                const yearlyMap = new Map();

                tatData.forEach(item => {
                    const itemDate = new Date(item.created_at || item.date || item.timestamp);
                    const year = itemDate.getFullYear();
                    const tat = item.tat || item.tat_category;

                    if (!yearlyMap.has(year)) {
                        yearlyMap.set(year, {
                            year: year,
                            '30m': 0,
                            '1h': 0,
                            '2h': 0,
                            '1d': 0,
                            '2d': 0,
                            '3d': 0,
                            total: 0
                        });
                    }

                    const yearData = yearlyMap.get(year);
                    yearData.total++;

                    if (tat === '1h') yearData['1h']++;
                    else if (tat === '30m') yearData['30m']++;
                    else if (tat === '2h') yearData['2h']++;
                    else if (tat === '1d') yearData['1d']++;
                    else if (tat === '2d') yearData['2d']++;
                    else if (tat === '3d') yearData['3d']++;
                });

                // Sort years ascending
                const sortedYears = Array.from(yearlyMap.keys()).sort((a, b) => a - b);

                // Add headers
                const headers = [
                    "Year",
                    "30m",
                    "1h",
                    "2h",
                    "1d",
                    "2d",
                    "3d",
                    "Total"
                ];

                const headerRow = tatWorksheet.addRow(headers);
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Add data rows
                let grandTotal = 0;
                const tatTotals = { '30m': 0, '1h': 0, '2h': 0, '1d': 0, '2d': 0, '3d': 0 };

                sortedYears.forEach(year => {
                    const yearData = yearlyMap.get(year);

                    const row = tatWorksheet.addRow([
                        year,
                        yearData['30m'],
                        yearData['1h'],
                        yearData['2h'],
                        yearData['1d'],
                        yearData['2d'],
                        yearData['3d'],
                        yearData.total
                    ]);

                    // Style the row
                    row.eachCell((cell, colNumber) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
                    });

                    // Add to grand totals
                    grandTotal += yearData.total;
                    tatTotals['30m'] += yearData['30m'];
                    tatTotals['1h'] += yearData['1h'];
                    tatTotals['2h'] += yearData['2h'];
                    tatTotals['1d'] += yearData['1d'];
                    tatTotals['2d'] += yearData['2d'];
                    tatTotals['3d'] += yearData['3d'];
                });

                // Add total row
                tatWorksheet.addRow([]);
                const totalRow = tatWorksheet.addRow([
                    'TOTAL',
                    tatTotals['30m'],
                    tatTotals['1h'],
                    tatTotals['2h'],
                    tatTotals['1d'],
                    tatTotals['2d'],
                    tatTotals['3d'],
                    grandTotal
                ]);

                totalRow.font = { bold: true };
                totalRow.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'e9ecef' }
                    };
                    cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center' };
                });

            } else {
                // Default view - group by category
                const categoryMap = new Map();

                tatData.forEach(item => {
                    const category = item.pms_category || 'Uncategorized';
                    const tat = item.tat || item.tat_category;

                    if (!categoryMap.has(category)) {
                        categoryMap.set(category, {
                            category: category,
                            '30m': 0,
                            '1h': 0,
                            '2h': 0,
                            '1d': 0,
                            '2d': 0,
                            '3d': 0,
                            total: 0
                        });
                    }

                    const categoryData = categoryMap.get(category);
                    categoryData.total++;

                    if (tat === '1h') categoryData['1h']++;
                    else if (tat === '30m') categoryData['30m']++;
                    else if (tat === '2h') categoryData['2h']++;
                    else if (tat === '1d') categoryData['1d']++;
                    else if (tat === '2d') categoryData['2d']++;
                    else if (tat === '3d') categoryData['3d']++;
                });

                // Sort categories alphabetically
                const sortedCategories = Array.from(categoryMap.keys()).sort();

                // Add headers
                const headers = [
                    "PMS Category",
                    "30m",
                    "1h",
                    "2h",
                    "1d",
                    "2d",
                    "3d",
                    "Total"
                ];

                const headerRow = tatWorksheet.addRow(headers);
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '053b00ff' }
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Add data rows
                let grandTotal = 0;
                const tatTotals = { '30m': 0, '1h': 0, '2h': 0, '1d': 0, '2d': 0, '3d': 0 };

                sortedCategories.forEach(category => {
                    const categoryData = categoryMap.get(category);

                    const row = tatWorksheet.addRow([
                        category,
                        categoryData['30m'],
                        categoryData['1h'],
                        categoryData['2h'],
                        categoryData['1d'],
                        categoryData['2d'],
                        categoryData['3d'],
                        categoryData.total
                    ]);

                    // Style the row
                    row.eachCell((cell, colNumber) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
                    });

                    // Add to grand totals
                    grandTotal += categoryData.total;
                    tatTotals['30m'] += categoryData['30m'];
                    tatTotals['1h'] += categoryData['1h'];
                    tatTotals['2h'] += categoryData['2h'];
                    tatTotals['1d'] += categoryData['1d'];
                    tatTotals['2d'] += categoryData['2d'];
                    tatTotals['3d'] += categoryData['3d'];
                });

                // Add total row
                tatWorksheet.addRow([]);
                const totalRow = tatWorksheet.addRow([
                    'TOTAL',
                    tatTotals['30m'],
                    tatTotals['1h'],
                    tatTotals['2h'],
                    tatTotals['1d'],
                    tatTotals['2d'],
                    tatTotals['3d'],
                    grandTotal
                ]);

                totalRow.font = { bold: true };
                totalRow.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'e9ecef' }
                    };
                    cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center' };
                });
            }

            // Add summary statistics
            tatWorksheet.addRow([]);
            tatWorksheet.addRow(['SUMMARY STATISTICS']);
            tatWorksheet.getRow(tatWorksheet.lastRow.number).font = { bold: true, size: 12 };

            tatWorksheet.addRow(['Total Records:', tatData.length]);

            // Calculate percentages
            const total30m = tatData.filter(item => (item.tat || item.tat_category) === '30m').length;
            const total1h = tatData.filter(item => (item.tat || item.tat_category) === '1h').length;
            const total2h = tatData.filter(item => (item.tat || item.tat_category) === '2h').length;
            const total1d = tatData.filter(item => (item.tat || item.tat_category) === '1d').length;
            const total2d = tatData.filter(item => (item.tat || item.tat_category) === '2d').length;
            const total3d = tatData.filter(item => (item.tat || item.tat_category) === '3d').length;

            if (tatData.length > 0) {
                tatWorksheet.addRow(['30m Percentage:', `${((total30m / tatData.length) * 100).toFixed(2)}%`]);
                tatWorksheet.addRow(['1h Percentage:', `${((total1h / tatData.length) * 100).toFixed(2)}%`]);
                tatWorksheet.addRow(['2h Percentage:', `${((total2h / tatData.length) * 100).toFixed(2)}%`]);
                tatWorksheet.addRow(['1d Percentage:', `${((total1d / tatData.length) * 100).toFixed(2)}%`]);
                tatWorksheet.addRow(['2d Percentage:', `${((total2d / tatData.length) * 100).toFixed(2)}%`]);
                tatWorksheet.addRow(['3d Percentage:', `${((total3d / tatData.length) * 100).toFixed(2)}%`]);
            }

        } catch (error) {
            console.error('Error fetching TAT data for Excel:', error);
            tatWorksheet.addRow(['Error loading TAT data']);
        }

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `PMS_Report_${location === 'all' ? 'AllSites' : location}_${filterType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(new Blob([buffer]), fileName);
    };


    const handleDownloadPMSList = async () => {
        try {
            navigate('/pmslist');
        } catch (err) {
            console.log('Error downloading PMS List:', err);
        }
    }
    return (
        <Container fluid className="pt-100 px-3 px-md-5"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
                paddingBottom: "20px",
            }}>
            <Row className="align-items-center g-3 mb-4">
                {/* Left side - Title */}
                <Col xs="auto">
                    <h2 className="mb-0"><b>PMS Report Tickets</b></h2>
                </Col>

                {/* Filters */}
                <Col className="d-flex justify-content-end gap-2">
                    {/* Site Filter */}
                    <Form.Group controlId="status-filter-1">
                        <Form.Select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ maxWidth: "200px" }}
                        >
                            <option value="all">LMD & CORP</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">CORP</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Status Filter */}
                    <Form.Group controlId="status-filter-2">
                        <Form.Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ maxWidth: "250px" }}
                        >
                            <option value="all">All</option>
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="lastWeek">Last Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="perMonth">Per Month</option>
                            <option value="perYear">Per Year</option>
                        </Form.Select>
                    </Form.Group>
                    {/* PMS LIST*/}
                    <Button variant="success" onClick={() => handleDownloadPMSList()}>
                        View PMS List
                    </Button>

                    {/* Download Excel Filter */}
                    <Button variant="success" onClick={handleDownloadExcel}>
                        Excel <FeatherIcon icon="download" />
                    </Button>


                </Col>
            </Row>

            {/* Clickable Open / Not Reviewed / Closed cards */}
            <Row style={{ paddingBottom: '20px' }}>
                {/* Open  */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "All Open Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.pms_status === 'open')} />

                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All PMS Tickets</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{open}</h1>
                        </div>
                    </div>
                </Col>
                {/* Not reviewed */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Not Reviewed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.pms_status === 'open')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All Open PMS Ticket</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{notReviewed}</h1>
                        </div>
                    </div>
                </Col>
                {/* Closed */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Closed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === true && t.pms_status === 'closed')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All Closed PMS</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{closed}</h1>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Table and Subcategory Chart */}
            <Row style={{ paddingBottom: '20px' }}>
                <Col xs={6}>
                    <div className="bento-item bento-users" style={{ padding: '15px' }}>
                        <h4 style={{ marginBottom: '5px' }}>
                            Assets PMS by Department
                            {location !== 'all' && (
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 'normal',
                                    marginLeft: '10px',
                                    color: '#666',
                                    backgroundColor: '#f0f0f0',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                }}>
                                    Location: {location.toUpperCase()}
                                </span>
                            )}
                        </h4>

                        {filteredDepartmentAssets.length > 0 ? (
                            <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
                                {filterType === 'perMonth' || filterType === 'perYear' ? (
                                    // Time-based view for perMonth/perYear
                                    <TimeBasedAssetsTable
                                        data={filteredDepartmentAssets}
                                        filterType={filterType}
                                        location={location}
                                        allTickets={allTickets}
                                    />
                                ) : (
                                    // Original department view for other filter types
                                    <table border="1" cellPadding="8" style={{
                                        borderCollapse: "collapse",
                                        width: "100%",
                                        height: "100%",
                                        border: '1px solid #ddd'
                                    }}>
                                        <thead style={{
                                            background: '#053b00ff',
                                            color: 'white',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 1
                                        }}>
                                            <tr>
                                                <th style={{ width: '30%' }}>Department</th>
                                                <th style={{ width: '20%' }}>Total Assets</th>
                                                <th style={{ width: '20%' }}>PMS</th>
                                                <th style={{ width: '20%' }}>Non-PMS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDepartmentAssets.map((dept, index) => {
                                                // Get all ticket tag_ids from allTickets
                                                const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);

                                                // Get all assets for this department
                                                const departmentAssetList = dept.assets || [];

                                                // Separate PMS and Non-PMS assets
                                                const pmsAssets = departmentAssetList.filter(
                                                    asset => ticketTagIds.includes(asset.tag_id?.toString())
                                                );

                                                const nonPmsAssets = departmentAssetList.filter(
                                                    asset => !ticketTagIds.includes(asset.tag_id?.toString())
                                                );

                                                const pmsCount = pmsAssets.length;
                                                const nonPmsCount = nonPmsAssets.length;

                                                return (
                                                    <tr key={index} style={{
                                                        background: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                                                        borderBottom: '1px solid #ddd'
                                                    }}>
                                                        <td>{dept.department}</td>

                                                        {/* Total Assets cell with tooltip */}
                                                        <td>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip id={`tooltip-total-${index}`}>
                                                                        <div style={{
                                                                            maxHeight: '200px',
                                                                            overflowY: 'auto',
                                                                            padding: '5px',
                                                                            minWidth: '200px'
                                                                        }}>
                                                                            <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc' }}>
                                                                                All Assets ({dept.totalAssets}):
                                                                            </strong>
                                                                            {departmentAssetList.length > 0 ? (
                                                                                departmentAssetList.map((asset, i) => (
                                                                                    <div key={i} style={{
                                                                                        padding: '2px 5px',
                                                                                        borderBottom: i < departmentAssetList.length - 1 ? '1px solid #eee' : 'none',
                                                                                        whiteSpace: 'nowrap'
                                                                                    }}>
                                                                                        {asset.tag_id || 'No Tag'}
                                                                                        {asset.asset_name && ` - ${asset.asset_name}`}
                                                                                        {location !== 'all' && (
                                                                                            <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                                                {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div>No assets found</div>
                                                                            )}
                                                                        </div>
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span style={{
                                                                    cursor: 'pointer',
                                                                    textDecoration: 'underline dotted',
                                                                    fontWeight: 'bold',
                                                                    color: '#053b00ff'
                                                                }}>
                                                                    {dept.totalAssets}
                                                                </span>
                                                            </OverlayTrigger>
                                                        </td>

                                                        {/* PMS cell with tooltip */}
                                                        <td style={{
                                                            backgroundColor: pmsCount > 0 ? '#d4edda' : 'transparent',
                                                            fontWeight: pmsCount > 0 ? 'bold' : 'normal'
                                                        }}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip id={`tooltip-pms-${index}`}>
                                                                        <div style={{
                                                                            maxHeight: '200px',
                                                                            overflowY: 'auto',
                                                                            padding: '5px',
                                                                            minWidth: '200px'
                                                                        }}>
                                                                            <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc', color: '#28a745' }}>
                                                                                PMS Assets ({pmsCount}):
                                                                            </strong>
                                                                            {pmsAssets.length > 0 ? (
                                                                                pmsAssets.map((asset, i) => (
                                                                                    <div key={i} style={{
                                                                                        padding: '2px 5px',
                                                                                        borderBottom: i < pmsAssets.length - 1 ? '1px solid #eee' : 'none',
                                                                                        whiteSpace: 'nowrap'
                                                                                    }}>
                                                                                        {asset.tag_id || 'No Tag'}
                                                                                        {asset.asset_name && ` - ${asset.asset_name}`}
                                                                                        {location !== 'all' && (
                                                                                            <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                                                {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div>No PMS assets</div>
                                                                            )}
                                                                        </div>
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span style={{
                                                                    cursor: pmsCount > 0 ? 'pointer' : 'default',
                                                                    textDecoration: pmsCount > 0 ? 'underline dotted' : 'none'
                                                                }}>
                                                                    {pmsCount}
                                                                </span>
                                                            </OverlayTrigger>
                                                        </td>

                                                        {/* Non-PMS cell with tooltip */}
                                                        <td style={{
                                                            backgroundColor: nonPmsCount > 0 ? '#fff3cd' : 'transparent',
                                                            fontWeight: nonPmsCount > 0 ? 'bold' : 'normal'
                                                        }}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip id={`tooltip-nonpms-${index}`}>
                                                                        <div style={{
                                                                            maxHeight: '200px',
                                                                            overflowY: 'auto',
                                                                            padding: '5px',
                                                                            minWidth: '200px'
                                                                        }}>
                                                                            <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #ccc', color: '#856404' }}>
                                                                                Non-PMS Assets ({nonPmsCount}):
                                                                            </strong>
                                                                            {nonPmsAssets.length > 0 ? (
                                                                                nonPmsAssets.map((asset, i) => (
                                                                                    <div key={i} style={{
                                                                                        padding: '2px 5px',
                                                                                        borderBottom: i < nonPmsAssets.length - 1 ? '1px solid #eee' : 'none',
                                                                                        whiteSpace: 'nowrap'
                                                                                    }}>
                                                                                        {asset.tag_id || 'No Tag'}
                                                                                        {asset.asset_name && ` - ${asset.asset_name}`}
                                                                                        {location !== 'all' && (
                                                                                            <span style={{ color: '#666', fontSize: '0.85em' }}>
                                                                                                {' '}({asset.assigned_location?.toUpperCase() || 'N/A'})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div>No non-PMS assets</div>
                                                                            )}
                                                                        </div>
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span style={{
                                                                    cursor: nonPmsCount > 0 ? 'pointer' : 'default',
                                                                    textDecoration: nonPmsCount > 0 ? 'underline dotted' : 'none'
                                                                }}>
                                                                    {nonPmsCount}
                                                                </span>
                                                            </OverlayTrigger>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Add total row */}
                                            <tr style={{
                                                background: '#e9ecef',
                                                fontWeight: 'bold',
                                                borderTop: '2px solid #053b00ff'
                                            }}>
                                                <td><b>TOTAL</b></td>
                                                <td><b>{filteredDepartmentAssets.reduce((sum, dept) => sum + dept.totalAssets, 0)}</b></td>
                                                <td><b>{
                                                    filteredDepartmentAssets.reduce((sum, dept) => {
                                                        const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);
                                                        return sum + (dept.assets?.filter(
                                                            asset => ticketTagIds.includes(asset.tag_id?.toString())
                                                        ).length || 0);
                                                    }, 0)
                                                }</b></td>
                                                <td><b>{
                                                    filteredDepartmentAssets.reduce((sum, dept) => {
                                                        const ticketTagIds = allTickets.map(t => t.tag_id?.toString()).filter(Boolean);
                                                        const pmsCount = dept.assets?.filter(
                                                            asset => ticketTagIds.includes(asset.tag_id?.toString())
                                                        ).length || 0;
                                                        return sum + (dept.totalAssets - pmsCount);
                                                    }, 0)
                                                }</b></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                background: '#f5f5f5',
                                borderRadius: '5px'
                            }}>
                                <FeatherIcon icon="package" size={48} color="#999" />
                                <p style={{ color: '#666', marginTop: '10px' }}>
                                    {location === 'all'
                                        ? 'No assets found with department assignments'
                                        : `No assets found for ${location.toUpperCase()} location`}
                                </p>
                            </div>
                        )}
                    </div>
                </Col>
                {/* ticket Summary */}
                <Col>
                    <div className="bento-item bento-users"
                        onClick={() => openModal("Ticket Summary", <PMSbyDept showChart={false} filterType={filterType} location={location} onDataReady={setSubcatSummary} />)}>
                        <h4>Summary</h4>
                        <div
                            className="bento-chart-wrapper"
                            style={{
                                width: "100%",

                                overflowX: "auto",

                            }}>
                            <div style={{ width: "100%", height: "100%" }}>
                                <PMSbyDept
                                    filterType={filterType}
                                    location={location}
                                    onDataReady={setSubcatSummary}
                                    showChart={true}
                                />
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Other Charts */}
            <Row className="g-2">
                {/* category  */}
                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "All Tickets by Category",
                                <PmsTicketsByAsset filterType={filterType} showChart={false} location={location} />
                            )}>
                        <PmsTicketsByAsset filterType={filterType} showChart={true} location={location} />
                    </div>
                </Col>

                <Col xs={12} md={8}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets per Help Desk",
                                <PMSTATperCategory filterType={filterType} showChart={false} location={location} />
                            )}>
                        <PMSTATperCategory filterType={filterType} showChart={true} location={location} />
                    </div>
                </Col>
            </Row>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalContent}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}