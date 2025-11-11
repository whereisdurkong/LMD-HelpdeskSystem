import React, { useEffect, useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";

const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
];

const TicketSummaryTable = ({ filterType, location, onDataReady }) => {
    const [filter, setFilter] = useState("ALL"); // category filter
    const [month, setMonth] = useState(months[new Date().getMonth()]); // default current month
    const [year, setYear] = useState(String(new Date().getFullYear())); // default current year
    const [possibleYears, setPossibleYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [deptSubcatCount, setDeptSubcatCount] = useState({});
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [tickets, setTickets] = useState([]);

    //Getting/setting all tickets
    useEffect(() => {
        const fetch = async () => {
            try {
                // get all tickets from backend
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let rawTickets = Array.isArray(res.data) ? res.data : [];
                rawTickets = rawTickets.filter(t => t.is_active === true)

                // populate possibleYears from raw dataset so UI can pick historic years
                const yearsSet = Array.from(new Set(rawTickets.map(t => {
                    const d = t?.created_at ? new Date(t.created_at) : null;
                    return d ? d.getFullYear() : null;
                }).filter(Boolean))).sort((a, b) => b - a); // newest first
                setPossibleYears(yearsSet.map(y => String(y)));

                // 🔹 Location filter
                if (location === "lmd") {
                    rawTickets = rawTickets.filter(t => t.assigned_location === "lmd");
                } else if (location === "corp") {
                    rawTickets = rawTickets.filter(t => t.assigned_location === "corp");
                }

                const now = new Date();

                // Apply time filterType
                let filtered = [...rawTickets];
                if (filterType === "today") {
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d.toDateString() === now.toDateString();
                    });
                } else if (filterType === "thisWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay()); // sunday start
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= now;
                    });
                } else if (filterType === "lastWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay() - 7);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= end;
                    });
                } else if (filterType === "thisMonth") {
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                } else if (filterType === "perYear") {
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getFullYear() === now.getFullYear();
                    });
                } else if (filterType === "perMonth") {
                    // ensure we use selected month + year
                    const monthIndex = months.indexOf(month);
                    const yearInt = parseInt(year, 10);
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getMonth() === monthIndex && d.getFullYear() === yearInt;
                    });
                }

                setTickets(filtered);

                // 🔹 Map users -> departments (safe: individual failures won't abort)
                const uniqueUsernames = Array.from(new Set(filtered.map(t => t.ticket_for).filter(Boolean)));
                // create array of promises that resolve to { username, data? }
                const userPromises = uniqueUsernames.map(username =>
                    axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: username },
                    })
                        .then(r => ({ username, data: r.data }))
                        .catch(() => ({ username, data: null }))
                );
                const userResults = await Promise.all(userPromises);
                const userDeptMap = {};
                userResults.forEach(r => {
                    if (r && r.data && r.data.emp_department) {
                        userDeptMap[r.username] = r.data.emp_department;
                    }
                });

                // 🔹 Build counts and ensure no tickets are silently skipped
                const deptSubcatCountTemp = {};
                const dynamicSubcategories = new Set();

                filtered.forEach(ticket => {
                    const subcat = ticket.ticket_SubCategory || ticket.sub_category || "Unspecified";
                    dynamicSubcategories.add(subcat);

                    // Determine department - try username map first, then fallbacks
                    let dept = userDeptMap[ticket.ticket_for];
                    if (!dept) {
                        dept = ticket.emp_department || ticket.department || ticket.dept || ticket.requested_department || "Unknown";
                    }

                    if (!deptSubcatCountTemp[dept]) deptSubcatCountTemp[dept] = {};
                    deptSubcatCountTemp[dept][subcat] = (deptSubcatCountTemp[dept][subcat] || 0) + 1;
                });

                const deptKeys = Object.keys(deptSubcatCountTemp).sort((a, b) => a.localeCompare(b));
                const subcatArr = Array.from(dynamicSubcategories).sort((a, b) => a.localeCompare(b));

                setDeptSubcatCount(deptSubcatCountTemp);
                setDepartments(deptKeys);
                setAllSubcategories(subcatArr);

                // callback if parent needs data
                if (typeof onDataReady === "function") onDataReady({ tickets: filtered, deptSubcatCount: deptSubcatCountTemp });
            } catch (err) {
                console.error("Unable to fetch Data: ", err);
            }
        };

        fetch();
        // re-run when any of these change
    }, [filterType, location, month, year]);

    // Apply category filter to subcategories (normalize)
    const filteredSubcategories = filter === "ALL"
        ? allSubcategories
        : allSubcategories.filter(subcat =>
            tickets.some(t => {
                const cat = (t.ticket_category || t.category || "").toString().toLowerCase().trim();
                return cat === filter.toLowerCase().trim() && (t.ticket_SubCategory || t.sub_category || "") === subcat;
            })
        );

    // Export to Excel (header -> rows -> totals)
    const handleExportExcel = () => {
        const header = ["Subcategory", ...departments, "Total"];
        const rows = filteredSubcategories.map(subcat => {
            let rowTotal = 0;
            const counts = departments.map(dept => {
                const count = deptSubcatCount[dept]?.[subcat] || 0;
                rowTotal += count;
                return count;
            });
            return [subcat, ...counts, rowTotal];
        });

        // Totals row (sum per department and grand total)
        const deptSums = departments.map(dept =>
            filteredSubcategories.reduce((sum, sc) => sum + (deptSubcatCount[dept]?.[sc] || 0), 0)
        );
        const grandTotal = deptSums.reduce((a, b) => a + b, 0);
        const totalRow = ["Total", ...deptSums, grandTotal];

        const data = [header, ...rows, totalRow];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ticket Summary");
        XLSX.writeFile(wb, "TicketSummary.xlsx");
    };

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                {/* Filters Section */}
                <div className="d-flex flex-wrap align-items-end gap-3 w-100 w-md-auto">
                    <Form.Group className="flex-grow-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                        <Form.Label>Filter by Category</Form.Label>
                        <Form.Select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="ALL">All</option>
                            <option value="hardware">Hardware</option>
                            <option value="network">Network</option>
                            <option value="software">Software</option>
                            <option value="system">System</option>
                        </Form.Select>
                    </Form.Group>

                    {filterType === "perMonth" && (
                        <>
                            <Form.Group className="flex-grow-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
                                <Form.Label>Month</Form.Label>
                                <Form.Select value={month} onChange={e => setMonth(e.target.value)}>
                                    {months.map(m => (
                                        <option key={m} value={m}>
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="flex-grow-1" style={{ minWidth: "100px", maxWidth: "140px" }}>
                                <Form.Label>Year</Form.Label>
                                <Form.Select value={year} onChange={e => setYear(e.target.value)}>
                                    {possibleYears.length > 0
                                        ? possibleYears.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))
                                        : <option value={year}>{year}</option>}
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                </div>

                {/* Button Section */}
                <div className="mt-2 mt-md-0">
                    <Button
                        onClick={handleExportExcel}
                        className="w-100 w-md-auto"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        Export to Excel
                    </Button>
                </div>
            </div>

            <div className="table-responsive">
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Subcategory</th>
                            <th>Total</th>
                            {departments.map(dept => <th key={dept}>{dept}</th>)}

                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                            <td>Total</td>
                            {departments.map(dept => {
                                const deptTotal = filteredSubcategories.reduce((sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0), 0);
                                return <td key={`total-${dept}`}>{deptTotal}</td>;
                            })}
                            <td>
                                {filteredSubcategories.reduce(
                                    (grandTotal, subcat) =>
                                        grandTotal +
                                        departments.reduce((s, dept) => s + (deptSubcatCount[dept]?.[subcat] || 0), 0),
                                    0
                                )}
                            </td>
                        </tr>

                        {filteredSubcategories.map((subcat, idx) => {
                            let rowTotal = 0;
                            return (
                                <tr key={`${subcat}-${idx}`}>

                                    <td>{subcat}</td>
                                    <td>{rowTotal}</td>
                                    {departments.map(dept => {
                                        const count = deptSubcatCount[dept]?.[subcat] || 0;
                                        rowTotal += count;
                                        return <td key={`${dept}-${subcat}`}>{count}</td>;
                                    })}

                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </div>
    );

};

export default TicketSummaryTable;

