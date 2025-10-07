import React, { useEffect, useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";

const TicketSummaryTable = ({ filterType, location, onDataReady }) => {
    const [filter, setFilter] = useState("ALL");
    const [departments, setDepartments] = useState([]);
    const [deptSubcatCount, setDeptSubcatCount] = useState({});
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let fetchedTickets = res.data || [];

                // 🔹 Location filter
                if (location === "lmd") {
                    fetchedTickets = fetchedTickets.filter(t => t.assigned_location === "lmd");
                } else if (location === "corp") {
                    fetchedTickets = fetchedTickets.filter(t => t.assigned_location === "corp");
                }

                // 🔹 Date filter
                const now = new Date();
                if (filterType === "today") {
                    fetchedTickets = fetchedTickets.filter(
                        t => new Date(t.created_at).toDateString() === now.toDateString()
                    );
                } else if (filterType === "thisWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay());
                    fetchedTickets = fetchedTickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= now;
                    });
                } else if (filterType === "lastWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay() - 7);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    fetchedTickets = fetchedTickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= end;
                    });
                } else if (filterType === "thisMonth") {
                    fetchedTickets = fetchedTickets.filter(t => {
                        const d = new Date(t.created_at);
                        return (
                            d.getMonth() === now.getMonth() &&
                            d.getFullYear() === now.getFullYear()
                        );
                    });
                } else if (filterType === "perYear") {
                    fetchedTickets = fetchedTickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getFullYear() === now.getFullYear();
                    });
                }

                setTickets(fetchedTickets);

                // 🔹 Map users to departments
                const uniqueUsernames = [...new Set(fetchedTickets.map(ticket => ticket.ticket_for))];
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

                // 🔹 Count tickets per dept + subcategory
                const deptSubcatCountTemp = {};
                const dynamicSubcategories = new Set();

                fetchedTickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.ticket_for];
                    const subcat = ticket.ticket_SubCategory;

                    if (dept && subcat) {
                        dynamicSubcategories.add(subcat);

                        if (!deptSubcatCountTemp[dept]) {
                            deptSubcatCountTemp[dept] = {};
                        }
                        deptSubcatCountTemp[dept][subcat] =
                            (deptSubcatCountTemp[dept][subcat] || 0) + 1;
                    }
                });

                setDeptSubcatCount(deptSubcatCountTemp);
                setDepartments(Object.keys(deptSubcatCountTemp));
                setAllSubcategories([...dynamicSubcategories]);


            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };

        fetch();
    }, [filterType, location]);

    // 🔹 Apply filter
    let filteredSubcategories = [];
    if (filter === "ALL") {
        filteredSubcategories = allSubcategories;
    } else {
        filteredSubcategories = allSubcategories.filter(subcat =>
            tickets.some(
                t =>
                    t.ticket_SubCategory === subcat &&
                    t.ticket_category?.toLowerCase() === filter.toLowerCase()
            )
        );
    }

    // 🔹 Export to Excel
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

        // Totals row
        const totalRow = [
            "Total",
            ...departments.map(dept =>
                filteredSubcategories.reduce(
                    (sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0),
                    0
                )
            ),
            filteredSubcategories.reduce((grandTotal, subcat) => {
                return (
                    grandTotal +
                    departments.reduce(
                        (sum, dept) => sum + (deptSubcatCount[dept]?.[subcat] || 0),
                        0
                    )
                );
            }, 0),
        ];

        const data = [header, totalRow, ...rows];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ticket Summary");
        XLSX.writeFile(wb, "TicketSummary.xlsx");
    };

    return (
        <div>
            {/* Filter + Export Row */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Group style={{ maxWidth: "300px" }}>
                    <Form.Label>Filter by Category</Form.Label>
                    <Form.Select value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="ALL">All</option>
                        <option value="hardware">Hardware</option>
                        <option value="network">Network</option>
                        <option value="software">Software</option>
                        <option value="system">System</option>
                    </Form.Select>
                </Form.Group>

                <Button onClick={handleExportExcel}>
                    Export to Excel
                </Button>
            </div>

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
