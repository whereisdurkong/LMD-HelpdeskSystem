import React, { useState } from "react";
import { Table, ButtonGroup, Button } from "react-bootstrap";

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

const departments = ["IT", "HR", "Finance"];

const TicketSummaryTable = () => {
    const [filter, setFilter] = useState("ALL");

    // Mock data: you should replace this with real counts from backend
    const ticketCounts = {
        Desktop: { IT: 12, HR: 3, Finance: 1 },
        Laptop: { IT: 8, HR: 5, Finance: 2 },
        Monitor: { IT: 6, HR: 1, Finance: 0 },
    };

    // Collect subcategories based on filter
    let subcategories = [];
    if (filter === "ALL") {
        subcategories = [
            ...subCategoryOptions.incident.hardware,
            ...subCategoryOptions.incident.network,
            ...subCategoryOptions.incident.software,
        ];
    } else {
        subcategories = subCategoryOptions.incident[filter.toLowerCase()];
    }

    // Calculate department totals
    const departmentTotals = {};
    let grandTotal = 0;

    subcategories.forEach((sub) => {
        departments.forEach((dept) => {
            const value = ticketCounts[sub]?.[dept] || 0;
            departmentTotals[dept] = (departmentTotals[dept] || 0) + value;
            grandTotal += value;
        });
    });

    return (
        <div style={{ paddingTop: '100px' }}>
            <h3>Ticket Summary by Subcategory</h3>
            <ButtonGroup className="mb-3">
                <Button
                    variant={filter === "ALL" ? "primary" : "outline-primary"}
                    onClick={() => setFilter("ALL")}
                >
                    All
                </Button>
                <Button
                    variant={filter === "Hardware" ? "primary" : "outline-primary"}
                    onClick={() => setFilter("Hardware")}
                >
                    Hardware
                </Button>
                <Button
                    variant={filter === "Network" ? "primary" : "outline-primary"}
                    onClick={() => setFilter("Network")}
                >
                    Network
                </Button>
                <Button
                    variant={filter === "Software" ? "primary" : "outline-primary"}
                    onClick={() => setFilter("Software")}
                >
                    Software
                </Button>
            </ButtonGroup>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Subcategory</th>
                        {departments.map((dept) => (
                            <th key={dept}>{dept}</th>
                        ))}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {subcategories.map((sub) => {
                        const rowTotal = departments.reduce(
                            (sum, dept) => sum + (ticketCounts[sub]?.[dept] || 0),
                            0
                        );
                        return (
                            <tr key={sub}>
                                <td>{sub}</td>
                                {departments.map((dept) => (
                                    <td key={dept}>{ticketCounts[sub]?.[dept] || 0}</td>
                                ))}
                                <td>{rowTotal}</td>
                            </tr>
                        );
                    })}
                    <tr>
                        <td><strong>Total</strong></td>
                        {departments.map((dept) => (
                            <td key={dept}><strong>{departmentTotals[dept] || 0}</strong></td>
                        ))}
                        <td><strong>{grandTotal}</strong></td>
                    </tr>
                </tbody>
            </Table>
        </div>
    );
};

export default TicketSummaryTable;
