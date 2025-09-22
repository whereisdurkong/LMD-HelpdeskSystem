import { useEffect, useState } from 'react';
import { Table, Container, Button, Row, Col, Form, Pagination } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';

export default function UsersCORP() {
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(user => user.emp_location === 'corp');
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

    const fiteredUsers = allUsers.filter((user) => {
        const matchedSearch = (
            user.emp_FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.emp_LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.emp_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.emp_department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.emp_position?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchedSearch;

    });

    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = fiteredUsers.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(fiteredUsers.length / ticketsPerPage);

    return (
        <Container style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            overflowX: 'auto'
        }}>
            <Row className="align-items-center g-3 mb-4">
                <Col >
                    <Form.Group controlId="search" style={{ width: '100%' }}>
                        <Form.Control
                            type="text"
                            placeholder={" Search by Name, Email, Phone Number etc."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        />
                    </Form.Group>
                </Col>
            </Row>
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
                        <th>Created at</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '15px', color: '#333' }}>
                    {currentTickets.length === 0 ? (
                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td colSpan={8} style={{ textAlign: 'center' }}>No Open Ticket for now.</td>
                        </tr>
                    ) : (
                        currentTickets.map((user, index) => (
                            <tr key={index} onClick={() => HandleView(user)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td>{user.user_id}</td>
                                <td>{user.emp_role} - {user.emp_tier}</td>
                                <td>{getFullName(user)}</td>
                                <td>{user.user_name}</td>
                                <td>{user.emp_email}</td>
                                <td>{user.emp_phone}</td>
                                <td>{user.emp_department}</td>
                                <td>{user.emp_position}</td>
                                <td>{new Date(user.created_at).toLocaleString()}</td>
                                <td style={{ cursor: 'pointer', color: '#003006ff' }}>View</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index + 1}
                                active={index + 1 === currentPage}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </Pagination.Item>
                        ))}

                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            )}
        </Container>
    );
}
