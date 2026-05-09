// SubCatDepartment.jsx
import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import axios from "axios";
import config from "config";

const SubCatDepartment = ({ filterType, location, onDataReady }) => {
    const [departments, setDepartments] = useState([]);
    const [deptCount, setDeptCount] = useState({});
    const [deptStatusCount, setDeptStatusCount] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [monthlyData, setMonthlyData] = useState([]);
    const [yearlyData, setYearlyData] = useState({});

    //Get all tickets
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                // 🔹 filter by location
                if (location === "lmd")
                    tickets = tickets.filter(t => t.assigned_location === "lmd" && t.is_active === true);
                else if (location === "corp")
                    tickets = tickets.filter(t => t.assigned_location === "corp" && t.is_active === true);
                else if (location === "all")
                    tickets = tickets.filter(t => t.is_active === true);

                const now = new Date();

                // 🔹 filter by date range for non-yearly views
                if (filterType === "today") {
                    tickets = tickets.filter(t => new Date(t.created_at).toDateString() === now.toDateString());
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
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                } else if (filterType === "perMonth") {
                    tickets = tickets.filter(t => new Date(t.created_at).getFullYear() === now.getFullYear());
                }
                // For perYear, we DON'T filter by year here - we want ALL years

                // 🔹 map user → department
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

                // 🔹 handle perMonth view
                if (filterType === "perMonth") {
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    const monthSummary = {};

                    tickets.forEach(ticket => {
                        const d = new Date(ticket.created_at);
                        const month = d.getMonth();
                        const dept = userDeptMap[ticket.ticket_for];
                        if (!dept) return;

                        if (!monthSummary[month]) {
                            monthSummary[month] = {
                                deptCount: {},
                                deptStatusCount: {},
                                grandTotal: 0
                            };
                        }

                        // Total tickets count
                        monthSummary[month].deptCount[dept] =
                            (monthSummary[month].deptCount[dept] || 0) + 1;

                        // Status-wise count
                        if (!monthSummary[month].deptStatusCount[dept]) {
                            monthSummary[month].deptStatusCount[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.ticket_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            monthSummary[month].deptStatusCount[dept].open++;
                        } else if (status.includes('progress')) {
                            monthSummary[month].deptStatusCount[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            monthSummary[month].deptStatusCount[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            monthSummary[month].deptStatusCount[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            monthSummary[month].deptStatusCount[dept].closed++;
                        }

                        monthSummary[month].grandTotal++;
                    });

                    // Get departments that actually have data in this month
                    const summary = monthLabels.map((label, idx) => {
                        const monthData = monthSummary[idx] || {
                            deptCount: {},
                            deptStatusCount: {},
                            grandTotal: 0
                        };

                        // Only include departments that have data for this month
                        const departmentsWithData = Object.keys(monthData.deptCount);

                        return {
                            month: label,
                            departments: departmentsWithData,
                            deptCount: monthData.deptCount,
                            deptStatusCount: monthData.deptStatusCount,
                            grandTotal: monthData.grandTotal,
                        };
                    });

                    setMonthlyData(summary);
                    onDataReady && onDataReady(summary);
                    return;
                }

                // 🔹 handle perYear view - Group by year and month
                if (filterType === "perYear") {
                    const yearMonthSummary = {};

                    tickets.forEach(ticket => {
                        const d = new Date(ticket.created_at);
                        const year = d.getFullYear();
                        const month = d.getMonth();
                        const dept = userDeptMap[ticket.ticket_for];
                        if (!dept) return;

                        // Initialize year
                        if (!yearMonthSummary[year]) {
                            yearMonthSummary[year] = {
                                months: {},
                                yearTotal: 0,
                                departments: new Set()
                            };
                        }

                        // Initialize month
                        if (!yearMonthSummary[year].months[month]) {
                            yearMonthSummary[year].months[month] = {
                                deptCount: {},
                                deptStatusCount: {},
                                grandTotal: 0
                            };
                        }

                        // Add department to year's department set
                        yearMonthSummary[year].departments.add(dept);

                        // Total tickets count for month
                        yearMonthSummary[year].months[month].deptCount[dept] =
                            (yearMonthSummary[year].months[month].deptCount[dept] || 0) + 1;

                        // Status-wise count for month
                        if (!yearMonthSummary[year].months[month].deptStatusCount[dept]) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.ticket_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].open++;
                        } else if (status.includes('progress')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].closed++;
                        }

                        yearMonthSummary[year].months[month].grandTotal++;
                        yearMonthSummary[year].yearTotal++;
                    });

                    // Transform the data for display
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    const transformedYearlyData = {};

                    Object.keys(yearMonthSummary).sort((a, b) => b - a).forEach(year => {
                        const yearData = yearMonthSummary[year];
                        const departmentsArray = [...yearData.departments].sort();

                        transformedYearlyData[year] = {
                            departments: departmentsArray,
                            yearTotal: yearData.yearTotal,
                            months: monthLabels.map((label, monthIdx) => {
                                const monthData = yearData.months[monthIdx] || {
                                    deptCount: {},
                                    deptStatusCount: {},
                                    grandTotal: 0
                                };

                                // Only include departments that have data for this month
                                const departmentsWithData = Object.keys(monthData.deptCount);

                                return {
                                    month: label,
                                    departments: departmentsWithData,
                                    deptCount: monthData.deptCount,
                                    deptStatusCount: monthData.deptStatusCount,
                                    grandTotal: monthData.grandTotal
                                };
                            })
                        };
                    });

                    setYearlyData(transformedYearlyData);
                    onDataReady && onDataReady(transformedYearlyData);
                    return;
                }

                // 🔹 default (non-monthly, non-yearly)
                const deptCountTemp = {};
                const deptStatusCountTemp = {};
                let total = 0;

                tickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.ticket_for];
                    const subcat = ticket.ticket_SubCategory;
                    if (dept && subcat) {
                        // Total tickets count
                        deptCountTemp[dept] = (deptCountTemp[dept] || 0) + 1;

                        // Status-wise count
                        if (!deptStatusCountTemp[dept]) {
                            deptStatusCountTemp[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.ticket_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            deptStatusCountTemp[dept].open++;
                        } else if (status.includes('progress')) {
                            deptStatusCountTemp[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            deptStatusCountTemp[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            deptStatusCountTemp[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            deptStatusCountTemp[dept].closed++;
                        }

                        total++;
                    }
                });

                setDeptCount(deptCountTemp);
                setDeptStatusCount(deptStatusCountTemp);
                setDepartments(Object.keys(deptCountTemp));
                setGrandTotal(total);

                onDataReady &&
                    onDataReady({
                        departments: Object.keys(deptCountTemp),
                        deptCount: deptCountTemp,
                        deptStatusCount: deptStatusCountTemp,
                        grandTotal: total,
                    });
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, [filterType, location]);

    // Calculate status totals for footer
    const calculateStatusTotals = (statusData) => {
        let openTotal = 0, inprogressTotal = 0, assignedTotal = 0, resolvedTotal = 0, closedTotal = 0;

        Object.values(statusData).forEach(deptStatus => {
            openTotal += deptStatus.open || 0;
            inprogressTotal += deptStatus.inprogress || 0;
            assignedTotal += deptStatus.assigned || 0;
            resolvedTotal += deptStatus.resolved || 0;
            closedTotal += deptStatus.closed || 0;
        });

        return { openTotal, inprogressTotal, assignedTotal, resolvedTotal, closedTotal };
    };

    // Calculate yearly totals for a specific year
    const calculateYearTotals = (yearData) => {
        let openTotal = 0, inprogressTotal = 0, assignedTotal = 0, resolvedTotal = 0, closedTotal = 0;

        yearData.months.forEach(month => {
            Object.values(month.deptStatusCount).forEach(deptStatus => {
                openTotal += deptStatus.open || 0;
                inprogressTotal += deptStatus.inprogress || 0;
                assignedTotal += deptStatus.assigned || 0;
                resolvedTotal += deptStatus.resolved || 0;
                closedTotal += deptStatus.closed || 0;
            });
        });

        return {
            open: openTotal,
            inprogress: inprogressTotal,
            assigned: assignedTotal,
            resolved: resolvedTotal,
            closed: closedTotal,
            total: yearData.yearTotal
        };
    };

    // Filter
    if (filterType === "perMonth") {
        // Check if there's any data at all
        const hasAnyData = monthlyData.some(month => month.departments.length > 0);

        if (!hasAnyData) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <p>No data available for the selected period</p>
                </div>
            );
        }

        return (
            <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto" }}>
                {monthlyData.map((month, idx) => {
                    // 🔹 Only show months that have at least one department with data
                    if (month.departments.length === 0) return null;

                    const totals = calculateStatusTotals(month.deptStatusCount);

                    return (
                        <div key={idx} style={{ marginBottom: "30px" }}>
                            <h6 style={{ marginBottom: "10px", fontWeight: "bold" }}>{month.month}</h6>
                            <Table
                                striped
                                bordered
                                hover
                                size="sm"
                                responsive
                                className="summary-table"
                                style={{ tableLayout: "fixed", width: "100%" }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                                        <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {month.departments.map(dept => (
                                        <tr key={dept}>
                                            <td>{dept}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.open || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.inprogress || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.assigned || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.resolved || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.closed || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptCount[dept] || 0}
                                            </td>
                                        </tr>
                                    ))}
                                    {month.grandTotal > 0 && (
                                        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{totals.openTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.inprogressTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.assignedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.resolvedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.closedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{month.grandTotal}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Handle perYear view
    if (filterType === "perYear") {
        const years = Object.keys(yearlyData).sort((a, b) => b - a); // Sort years descending

        // Check if there's any data at all
        const hasAnyData = years.length > 0;

        if (!hasAnyData) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <p>No data available for the selected period</p>
                </div>
            );
        }

        return (
            <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto" }}>
                {years.map(year => {
                    const yearData = yearlyData[year];
                    const yearTotals = calculateYearTotals(yearData);

                    return (
                        <div key={year} style={{ marginBottom: "40px", borderBottom: "2px solid #ccc", paddingBottom: "20px" }}>
                            <h5 style={{ marginBottom: "15px", fontWeight: "bold", color: "#0066cc" }}>
                                Year {year} - Total Tickets: {yearData.yearTotal}
                            </h5>

                            {yearData.months.map((month, monthIdx) => {
                                // 🔹 Only show months that have at least one department with data
                                if (month.departments.length === 0) return null;

                                const monthTotals = calculateStatusTotals(month.deptStatusCount);

                                return (
                                    <div key={monthIdx} style={{ marginBottom: "25px", marginLeft: "20px" }}>
                                        <h6 style={{ marginBottom: "8px", fontWeight: "bold", color: "#555" }}>
                                            {month.month} (Total: {month.grandTotal})
                                        </h6>
                                        <Table
                                            striped
                                            bordered
                                            hover
                                            size="sm"
                                            responsive
                                            className="summary-table"
                                            style={{ tableLayout: "fixed", width: "100%", marginBottom: "15px" }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                                                    <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {month.departments.map(dept => (
                                                    <tr key={dept}>
                                                        <td>{dept}</td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.open || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.inprogress || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.assigned || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.resolved || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.closed || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptCount[dept] || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                                    <td>Monthly Total</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.openTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.inprogressTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.assignedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.resolvedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.closedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{month.grandTotal}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                );
                            })}

                            {/* Yearly Summary for this year */}
                            <div style={{ marginTop: "15px", marginLeft: "20px", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
                                <h6 style={{ fontWeight: "bold", color: "#000" }}>Year {year} - Yearly Summary</h6>
                                <Table striped bordered size="sm" style={{ width: "auto", minWidth: "50%", marginTop: "10px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#e9ecef" }}>
                                            <th>Status</th>
                                            <th style={{ textAlign: "center" }}>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Open</td><td style={{ textAlign: "center" }}>{yearTotals.open}</td></tr>
                                        <tr><td>In Progress</td><td style={{ textAlign: "center" }}>{yearTotals.inprogress}</td></tr>
                                        <tr><td>Assigned</td><td style={{ textAlign: "center" }}>{yearTotals.assigned}</td></tr>
                                        <tr><td>Resolved</td><td style={{ textAlign: "center" }}>{yearTotals.resolved}</td></tr>
                                        <tr><td>Closed</td><td style={{ textAlign: "center" }}>{yearTotals.closed}</td></tr>
                                        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{yearTotals.total}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Default view (non-monthly, non-yearly)
    const totals = calculateStatusTotals(deptStatusCount);

    return (
        <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto", height: "100%", overflowY: "auto" }}>
            <Table
                striped
                bordered
                hover
                size="sm"
                responsive
                className="summary-table"
                style={{ tableLayout: "fixed", width: "100%" }}
            >
                <thead>
                    <tr>
                        <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                        <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(dept => (
                        <tr key={dept}>
                            <td>{dept}</td>
                            <td style={{ textAlign: "center" }}>
                                {deptStatusCount[dept]?.open || 0}
                            </td>
                            <td style={{ textAlign: "center" }}>
                                {deptStatusCount[dept]?.inprogress || 0}
                            </td>
                            <td style={{ textAlign: "center" }}>
                                {deptStatusCount[dept]?.assigned || 0}
                            </td>
                            <td style={{ textAlign: "center" }}>
                                {deptStatusCount[dept]?.resolved || 0}
                            </td>
                            <td style={{ textAlign: "center" }}>
                                {deptStatusCount[dept]?.closed || 0}
                            </td>
                            <td style={{ textAlign: "center" }}>{deptCount[dept]}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                        <td>Total</td>
                        <td style={{ textAlign: "center" }}>{totals.openTotal}</td>
                        <td style={{ textAlign: "center" }}>{totals.inprogressTotal}</td>
                        <td style={{ textAlign: "center" }}>{totals.assignedTotal}</td>
                        <td style={{ textAlign: "center" }}>{totals.resolvedTotal}</td>
                        <td style={{ textAlign: "center" }}>{totals.closedTotal}</td>
                        <td style={{ textAlign: "center" }}>{grandTotal}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    );
};

export default SubCatDepartment;