import { useEffect, useState } from 'react';
import { Table, Container, Button } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';

export default function Users() {
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(user => user.emp_tier === 'none');
                setAllUsers(justUsers);
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });
    }, []);

    const getFullName = (user) => {
        if (!user.emp_FirstName || !user.emp_LastName) return '';
        const first = user.emp_FirstName.charAt(0).toUpperCase() + user.emp_FirstName.slice(1).toLowerCase();
        const last = user.emp_LastName.charAt(0).toUpperCase() + user.emp_LastName.slice(1).toLowerCase();
        return `${first} ${last}`;
    };

    const HandleView = (user) => {
        const params = new URLSearchParams({ id: user.user_id })
        window.location.replace(`/ticketsystem/users-view?${params.toString()}`)
    }
    const HandleRegister = () => {

        window.location.replace(`/ticketsystem/register`)
    }

    return (
        <Container
            fluid
            className="pt-100"
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                minHeight: '100vh',
                paddingTop: '100px',
            }}
        >

            <Container style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                    <h3 style={{ fontWeight: 600, marginBottom: '5px' }}>Users</h3>
                    <Button onClick={HandleRegister}>+ Register</Button>
                </div>

                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    padding: '20px',
                    overflowX: 'auto'
                }}>
                    <Table hover borderless responsive className="mb-0">
                        <thead style={{ borderBottom: '2px solid #eee', fontSize: '14px', textTransform: 'uppercase', color: '#555' }}>
                            <tr>
                                <th>User ID</th>
                                <th>Role</th>
                                <th>Full Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Local Phone</th>
                                <th>Department</th>
                                <th>Position</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '15px', color: '#333' }}>
                            {allUsers.length === 0 ? (
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td colSpan={8} style={{ textAlign: 'center' }}>No Open Ticket for now.</td>
                                </tr>
                            ) : (
                                allUsers.map((user, index) => (
                                    <tr key={index} onClick={() => HandleView(user)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td>{user.user_id}</td>
                                        <td>{user.emp_role}</td>
                                        <td>{getFullName(user)}</td>
                                        <td>{user.user_name}</td>
                                        <td>{user.emp_email}</td>
                                        <td>{user.emp_phone}</td>
                                        <td>{user.emp_department}</td>
                                        <td>{user.emp_position}</td>
                                        <td style={{ cursor: 'pointer', color: '#003006ff' }}>View</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Container>
        </Container >
    );
}
