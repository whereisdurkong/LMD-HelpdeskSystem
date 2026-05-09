import React, { useEffect, useState } from "react";
import { Table, Form, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";

const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
];

const TicketSummaryTable = ({ filterType, location, onDataReady }) => {
    const [filter, setFilter] = useState("ALL"); // category filter
    const [departmentFilter, setDepartmentFilter] = useState("ALL"); // department filter
    const [month, setMonth] = useState(months[new Date().getMonth()]); // default current month
    const [year, setYear] = useState(String(new Date().getFullYear())); // default current year
    const [possibleYears, setPossibleYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [deptSubcatCount, setDeptSubcatCount] = useState({});
    const [deptCategoryCount, setDeptCategoryCount] = useState({}); // New state for category counts per department
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false); // New state for toggling view

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
                    // Use selected year instead of current year
                    const yearInt = parseInt(year, 10);
                    filtered = filtered.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getFullYear() === yearInt;
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

                // 🔹 Get all unique categories from filtered tickets
                const categoriesSet = new Set();
                filtered.forEach(ticket => {
                    const cat = ticket.ticket_category || ticket.category || "";
                    if (cat) {
                        categoriesSet.add(cat.toString().toLowerCase().trim());
                    }
                });
                setAllCategories(Array.from(categoriesSet).sort());

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

                // 🔹 Build counts for subcategories
                const deptSubcatCountTemp = {};
                const dynamicSubcategories = new Set();

                // 🔹 Build counts for categories
                const deptCategoryCountTemp = {};

                filtered.forEach(ticket => {
                    const subcat = ticket.ticket_SubCategory || ticket.sub_category || "Unspecified";
                    dynamicSubcategories.add(subcat);

                    const category = ticket.ticket_category || ticket.category || "Uncategorized";
                    const normalizedCategory = category.toString().toLowerCase().trim();

                    // Determine department - try username map first, then fallbacks
                    let dept = userDeptMap[ticket.ticket_for];
                    if (!dept) {
                        dept = ticket.emp_department || ticket.department || ticket.dept || ticket.requested_department || "Unknown";
                    }

                    // Count subcategories
                    if (!deptSubcatCountTemp[dept]) deptSubcatCountTemp[dept] = {};
                    deptSubcatCountTemp[dept][subcat] = (deptSubcatCountTemp[dept][subcat] || 0) + 1;

                    // Count categories
                    if (!deptCategoryCountTemp[dept]) deptCategoryCountTemp[dept] = {};
                    deptCategoryCountTemp[dept][normalizedCategory] = (deptCategoryCountTemp[dept][normalizedCategory] || 0) + 1;
                });

                // 🔥 FILTER OUT DEPARTMENTS WITH ZERO TOTAL COUNTS
                const deptKeys = Object.keys(deptSubcatCountTemp)
                    .filter(dept => {
                        // Only keep departments that have at least one ticket across all subcategories
                        const totalForDept = Object.values(deptSubcatCountTemp[dept]).reduce((sum, count) => sum + count, 0);
                        return totalForDept > 0;
                    })
                    .sort((a, b) => a.localeCompare(b));

                // 🔥 FILTER OUT SUBCATEGORIES WITH ZERO TOTAL COUNTS
                const subcatArr = Array.from(dynamicSubcategories)
                    .filter(subcat => {
                        // Only keep subcategories that have at least one ticket across all departments
                        const totalForSubcat = deptKeys.reduce((sum, dept) =>
                            sum + (deptSubcatCountTemp[dept]?.[subcat] || 0), 0);
                        return totalForSubcat > 0;
                    })
                    .sort((a, b) => a.localeCompare(b));

                setDeptSubcatCount(deptSubcatCountTemp);
                setDeptCategoryCount(deptCategoryCountTemp);
                setDepartments(deptKeys);
                setAllSubcategories(subcatArr);

                // callback if parent needs data
                if (typeof onDataReady === "function") onDataReady({
                    tickets: filtered,
                    deptSubcatCount: deptSubcatCountTemp,
                    deptCategoryCount: deptCategoryCountTemp
                });
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
                // Check if the ticket's category matches the selected filter
                // AND the subcategory matches
                return cat === filter.toLowerCase().trim() &&
                    (t.ticket_SubCategory || t.sub_category || "") === subcat;
            })
        );

    // Apply department filter
    const filteredDepartments = departmentFilter === "ALL"
        ? departments
        : departments.filter(dept => dept === departmentFilter);

    // Get sorted categories for display
    const sortedCategories = allCategories.sort();

    // Export to Excel (header -> rows -> totals)
    const handleExportExcel = () => {
        let data;

        if (showCategoryBreakdown) {
            // Export Category Breakdown
            const header = ["Department", "Total", ...sortedCategories];

            const rows = filteredDepartments.map(dept => {
                let rowTotal = 0;
                const counts = sortedCategories.map(category => {
                    const count = deptCategoryCount[dept]?.[category] || 0;
                    rowTotal += count;
                    return count;
                });
                return [dept, rowTotal, ...counts];
            });

            const deptSums = filteredDepartments.map(dept =>
                sortedCategories.reduce((sum, category) => sum + (deptCategoryCount[dept]?.[category] || 0), 0)
            );
            const grandTotal = deptSums.reduce((a, b) => a + b, 0);
            const categorySums = sortedCategories.map(category =>
                filteredDepartments.reduce((sum, dept) => sum + (deptCategoryCount[dept]?.[category] || 0), 0)
            );

            const totalRow = ["Total", grandTotal, ...categorySums];
            data = [header, ...rows, totalRow];
        } else {
            // Export Subcategory Breakdown (existing)
            const header = ["Department", "Total", ...filteredSubcategories];

            const rows = filteredDepartments.map(dept => {
                let rowTotal = 0;
                const counts = filteredSubcategories.map(subcat => {
                    const count = deptSubcatCount[dept]?.[subcat] || 0;
                    rowTotal += count;
                    return count;
                });
                return [dept, rowTotal, ...counts];
            });

            const deptSums = filteredDepartments.map(dept =>
                filteredSubcategories.reduce((sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0), 0)
            );
            const grandTotal = deptSums.reduce((a, b) => a + b, 0);
            const subcatSums = filteredSubcategories.map(subcat =>
                filteredDepartments.reduce((sum, dept) => sum + (deptSubcatCount[dept]?.[subcat] || 0), 0)
            );

            const totalRow = ["Total", grandTotal, ...subcatSums];
            data = [header, ...rows, totalRow];
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Ticket Summary - ${showCategoryBreakdown ? 'Categories' : 'Subcategories'}`);
        XLSX.writeFile(wb, `TicketSummary_${showCategoryBreakdown ? 'Categories' : 'Subcategories'}.xlsx`);
    };

    // Calculate totals for summary cards
    const totalTickets = filteredDepartments.reduce((total, dept) => {
        return total + (showCategoryBreakdown
            ? sortedCategories.reduce((sum, category) => sum + (deptCategoryCount[dept]?.[category] || 0), 0)
            : filteredSubcategories.reduce((sum, subcat) => sum + (deptSubcatCount[dept]?.[subcat] || 0), 0)
        );
    }, 0);

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                {/* Filters Section */}
                <div className="d-flex flex-wrap align-items-end gap-3 w-100 w-md-auto">
                    <Form.Group className="flex-grow-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                        <Form.Label>Filter by Category</Form.Label>
                        <Form.Select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="ALL">All Categories</option>
                            {allCategories.map(category => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="flex-grow-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                        <Form.Label>Filter by Department</Form.Label>
                        <Form.Select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                            <option value="ALL">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {(filterType === "perMonth" || filterType === "perYear") && (
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
                    )}

                    {filterType === "perMonth" && (
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
                    )}

                    {/* Button Section */}
                    <div className="d-flex gap-2 mt-2 mt-md-0">
                        <Button
                            variant={showCategoryBreakdown ? "primary" : "outline-primary"}
                            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                            className="w-100 w-md-auto"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {showCategoryBreakdown ? "Show Subcategories" : "Show Categories"}
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            variant="success"
                            className="w-100 w-md-auto"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            Export to Excel
                        </Button>
                    </div>
                </div>

            </div>


            <div className="table-responsive">
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Total</th>
                            {showCategoryBreakdown
                                ? sortedCategories.map(category => (
                                    <th key={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </th>
                                ))
                                : filteredSubcategories.map(subcat => (
                                    <th key={subcat}>{subcat}</th>
                                ))
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {/* Totals Row - only show if more than one department is selected */}
                        {filteredDepartments.length > 1 && (
                            <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                <td>Total</td>
                                <td>
                                    {filteredDepartments.reduce((grandTotal, dept) => {
                                        return grandTotal + (showCategoryBreakdown
                                            ? sortedCategories.reduce((sum, category) =>
                                                sum + (deptCategoryCount[dept]?.[category] || 0), 0)
                                            : filteredSubcategories.reduce((sum, subcat) =>
                                                sum + (deptSubcatCount[dept]?.[subcat] || 0), 0)
                                        );
                                    }, 0)}
                                </td>
                                {showCategoryBreakdown
                                    ? sortedCategories.map(category => {
                                        const categoryTotal = filteredDepartments.reduce((sum, dept) =>
                                            sum + (deptCategoryCount[dept]?.[category] || 0), 0);
                                        return <td key={`total-${category}`}>{categoryTotal}</td>;
                                    })
                                    : filteredSubcategories.map(subcat => {
                                        const subcatTotal = filteredDepartments.reduce((sum, dept) =>
                                            sum + (deptSubcatCount[dept]?.[subcat] || 0), 0);
                                        return <td key={`total-${subcat}`}>{subcatTotal}</td>;
                                    })
                                }
                            </tr>
                        )}

                        {/* Department Rows */}
                        {filteredDepartments.map((dept, idx) => {
                            let rowTotal = 0;

                            if (showCategoryBreakdown) {
                                // Calculate row total for categories
                                sortedCategories.forEach(category => {
                                    rowTotal += deptCategoryCount[dept]?.[category] || 0;
                                });
                            } else {
                                // Calculate row total for subcategories
                                filteredSubcategories.forEach(subcat => {
                                    rowTotal += deptSubcatCount[dept]?.[subcat] || 0;
                                });
                            }

                            return (
                                <tr key={`${dept}-${idx}`}>
                                    <td>{dept}</td>
                                    <td>{rowTotal}</td>
                                    {showCategoryBreakdown
                                        ? sortedCategories.map(category => {
                                            const count = deptCategoryCount[dept]?.[category] || 0;
                                            return <td key={`${dept}-${category}`}>{count}</td>;
                                        })
                                        : filteredSubcategories.map(subcat => {
                                            const count = deptSubcatCount[dept]?.[subcat] || 0;
                                            return <td key={`${dept}-${subcat}`}>{count}</td>;
                                        })
                                    }
                                </tr>
                            );
                        })}

                        {/* Show message if no departments match filter */}
                        {filteredDepartments.length === 0 && (
                            <tr>
                                <td colSpan={2 + (showCategoryBreakdown ? sortedCategories.length : filteredSubcategories.length)} className="text-center">
                                    No departments match the selected filter
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default TicketSummaryTable;