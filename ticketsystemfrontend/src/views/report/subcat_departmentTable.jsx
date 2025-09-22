import React, { useEffect, useState } from "react";
import { Table, Form } from "react-bootstrap";
import axios from "axios";
import config from "config";

const subCategoryOptions = {
    incident: {
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
            "Others",
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
            "Others",
        ],
        software: [
            "Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)",
            "Oracle (PROD/BIPUB)",
            "Email (Setup, Creation, Error, Backup)",
            "System Updates & Patches",
            "Active Directory (User Creation, Login, Password)",
            "Zoom / Video Conferencing Tools",
            "FoxPro (Accounting System)",
            "GEMCOM",
            "SURPAC",
            "FTP (Access Creation, Change Password)",
            "PDF (Conversion, Reduce Size, Editing)",
            "Antivirus / Security Software",
            "Operating System (Windows, macOS, Linux)",
            "Custom In-house Applications",
            "Backup & Restore Tools",
            "Cloud Services (OneDrive, Google Drive, Dropbox)",
            "Others",
        ],
    },
};

const TicketSummaryTable = ({ filterType }) => {
    const [filter, setFilter] = useState("ALL");
    const [departments, setDepartments] = useState([]);
    const [deptSubcatCount, setDeptSubcatCount] = useState({});

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                // 🔹 Apply filterType here
                const now = new Date();
                if (filterType === "today") {
                    tickets = tickets.filter(t =>
                        new Date(t.created_at).toDateString() === now.toDateString()
                    );
                } else if (filterType === "thisWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay());
                    tickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= now;
                    });
                } else if (filterType === "lastWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay() - 7);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    tickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= end;
                    });
                } else if (filterType === "thisMonth") {
                    tickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return (
                            d.getMonth() === now.getMonth() &&
                            d.getFullYear() === now.getFullYear()
                        );
                    });
                } else if (filterType === "perYear") {
                    tickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getFullYear() === now.getFullYear();
                    });
                }

                // (rest of your aggregation logic stays the same)
                const uniqueUsernames = [...new Set(tickets.map(ticket => ticket.ticket_for))];
                const userRequests = uniqueUsernames.map(username =>
                    axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: username },
                    })
                );
                const responses = await Promise.all(userRequests);
                const userDataArray = responses.map(res => res.data);

                const userDeptMap = {};
                userDataArray.forEach(user => {
                    userDeptMap[user.user_name] = user.emp_department;
                });

                const deptSubcatCountTemp = {};
                tickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.ticket_for];
                    const subcat = ticket.ticket_SubCategory;
                    if (dept && subcat) {
                        if (!deptSubcatCountTemp[dept]) {
                            deptSubcatCountTemp[dept] = {};
                        }
                        deptSubcatCountTemp[dept][subcat] =
                            (deptSubcatCountTemp[dept][subcat] || 0) + 1;
                    }
                });

                setDeptSubcatCount(deptSubcatCountTemp);
                setDepartments(Object.keys(deptSubcatCountTemp));
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, [filterType]); // 🔹 re-run when filterType changes

    useEffect(() => {
        departments.map(dept => {
            const deptTotal = filteredSubcategories.reduce(
                (sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0),
                0
            );
        })

    }, [departments])

    // Flatten all subcategories
    const allSubcategories = Object.values(subCategoryOptions.incident).flat();

    // Apply category filter
    let filteredSubcategories = [];
    if (filter === "ALL") {
        filteredSubcategories = allSubcategories;
    } else {
        filteredSubcategories = subCategoryOptions.incident[filter] || [];
    }

    return (
        <div>
            {/* Filter */}
            <Form.Group className="mb-3" style={{ maxWidth: "300px" }}>
                <Form.Label>Filter by Category</Form.Label>
                <Form.Select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="ALL">All</option>
                    <option value="hardware">Hardware</option>
                    <option value="network">Network</option>
                    <option value="software">Software</option>
                </Form.Select>
            </Form.Group>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Subcategory</th>
                        {departments.map(dept => (
                            <th key={dept}>{dept}</th>
                        ))}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Totals Row */}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                        <td>Total</td>
                        {departments.map(dept => {
                            const deptTotal = filteredSubcategories.reduce(
                                (sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0),
                                0
                            );
                            return <td key={`total-${dept}`}>{deptTotal}</td>;
                        })}
                        <td>
                            {filteredSubcategories.reduce((grandTotal, subcat) => {
                                return (
                                    grandTotal +
                                    departments.reduce(
                                        (sum, dept) => sum + (deptSubcatCount[dept]?.[subcat] || 0),
                                        0
                                    )
                                );
                            }, 0)}
                        </td>
                    </tr>
                    {filteredSubcategories.map((subcat, idx) => {
                        let rowTotal = 0;
                        return (
                            <tr key={`${subcat}-${idx}`}>
                                <td>{subcat}</td>
                                {departments.map(dept => {
                                    const count = deptSubcatCount[dept]?.[subcat] || 0;
                                    rowTotal += count;
                                    return <td key={`${dept}-${subcat}`}>{count}</td>;
                                })}
                                <td>{rowTotal}</td>
                            </tr>
                        );
                    })}


                </tbody>

            </Table>
        </div>
    );
};

export default TicketSummaryTable;
