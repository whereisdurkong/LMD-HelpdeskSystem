// SubCatDepartment.jsx
import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import axios from "axios";
import config from "config";

const SubCatDepartment = ({ filterType, location, onDataReady }) => {
    const [departments, setDepartments] = useState([]);
    const [deptCount, setDeptCount] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [monthlyData, setMonthlyData] = useState([]);

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

                // 🔹 filter by date range
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
                } else if (filterType === "perYear" || filterType === "perMonth") {
                    tickets = tickets.filter(t => new Date(t.created_at).getFullYear() === now.getFullYear());
                }

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
                            monthSummary[month] = { deptCount: {}, grandTotal: 0 };
                        }

                        monthSummary[month].deptCount[dept] =
                            (monthSummary[month].deptCount[dept] || 0) + 1;
                        monthSummary[month].grandTotal++;
                    });

                    const allDepartments = new Set();
                    Object.values(monthSummary).forEach(m =>
                        Object.keys(m.deptCount).forEach(d => allDepartments.add(d))
                    );

                    const summary = monthLabels.map((label, idx) => {
                        const monthData = monthSummary[idx] || { deptCount: {}, grandTotal: 0 };
                        return {
                            month: label,
                            departments: [...allDepartments],
                            deptCount: monthData.deptCount,
                            grandTotal: monthData.grandTotal,
                        };
                    });

                    setMonthlyData(summary);
                    onDataReady && onDataReady(summary);
                    return; // ✅ stop here (no need to continue single summary)
                }

                // 🔹 default (non-monthly)
                const deptCountTemp = {};
                let total = 0;

                tickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.ticket_for];
                    const subcat = ticket.ticket_SubCategory;
                    if (dept && subcat) {
                        deptCountTemp[dept] = (deptCountTemp[dept] || 0) + 1;
                        total++;
                    }
                });

                setDeptCount(deptCountTemp);
                setDepartments(Object.keys(deptCountTemp));
                setGrandTotal(total);

                onDataReady &&
                    onDataReady({
                        departments: Object.keys(deptCountTemp),
                        deptCount: deptCountTemp,
                        grandTotal: total,
                    });
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, [filterType, location]);

    // 🔹 Render
    if (filterType === "perMonth") {
        return (
            <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto" }}>
                {monthlyData.map((month, idx) => (
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
                                    <th style={{ width: "50%", wordWrap: "break-word" }}>Department</th>
                                    <th style={{ width: "30%", textAlign: "center" }}>Total Tickets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {month.departments.map(dept => (
                                    <tr key={dept}>
                                        <td>{dept}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {month.deptCount[dept] || 0}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                    <td>Total</td>
                                    <td style={{ textAlign: "center" }}>{month.grandTotal}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                ))}
            </div>
        );
    }

    // 🔹 Render default table (non-monthly)
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
                        <th style={{ width: "50%", wordWrap: "break-word" }}>Department</th>
                        <th style={{ width: "30%", textAlign: "center" }}>Total Tickets</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(dept => (
                        <tr key={dept}>
                            <td>{dept}</td>
                            <td style={{ textAlign: "center" }}>{deptCount[dept]}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                        <td>Total</td>
                        <td style={{ textAlign: "center" }}>{grandTotal}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    );
};

export default SubCatDepartment;
