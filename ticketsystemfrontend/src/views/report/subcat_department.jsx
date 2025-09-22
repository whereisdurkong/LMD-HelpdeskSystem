import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import axios from "axios";
import config from "config";

const SubCatDepartment = ({ filterType }) => {
    const [departments, setDepartments] = useState([]);
    const [deptCount, setDeptCount] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                // 🔹 Apply filterType
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

                // 🔹 Map tickets to departments
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

                const deptCountTemp = {};
                let total = 0;

                tickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.ticket_for];
                    if (dept) {
                        deptCountTemp[dept] = (deptCountTemp[dept] || 0) + 1;
                        total++;
                    }
                });

                setDeptCount(deptCountTemp);
                setDepartments(Object.keys(deptCountTemp));
                setGrandTotal(total);

            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, [filterType]);

    return (
        <div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Total Tickets</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(dept => (
                        <tr key={dept}>
                            <td>{dept}</td>
                            <td>{deptCount[dept]}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                        <td>Total</td>
                        <td>{grandTotal}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    );
};

export default SubCatDepartment;
