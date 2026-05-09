import { useEffect, useState } from "react";
import { Button, Container, Form, Pagination, Row, Col } from "react-bootstrap";
import axios from "axios";
import config from "config";
import { useNavigate } from 'react-router';

export default function ViewComputers() {
    const navigate = useNavigate()
    const [lmdpc, setLmdpc] = useState([]);
    const [corppc, setCorppc] = useState([]);
    const [allpc, setAllpc] = useState([]);
    const [filterStatus, setFilterStatus] = useState("lmd & corp");
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");
    const [uniqueDepartments, setUniqueDepartments] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    //Get all desktop/computer
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pms/get-computers`);
                const data = res.data || [];


                const allactive = data.filter(e => e.is_active === '1');
                setAllpc(allactive);

                const lmd = data.filter((pc) => pc.assigned_location === "lmd" && pc.pms_category === "desktop" && pc.is_active === '1');
                setLmdpc(lmd);

                const corp = data.filter((pc) => pc.assigned_location === "corp" && pc.pms_category === "desktop" && pc.is_active === '1');
                setCorppc(corp);

                // Extract unique departments from all active computers
                const departments = [...new Set(allactive.map(pc => pc.department).filter(dept => dept))];
                setUniqueDepartments(departments);
            } catch (err) {
                console.log('Unable to get all desktops: ', err)
            }
        };
        fetch();
    }, []);

    // Determine which data to show based on filter
    const displayedPCs =
        filterStatus === "lmd & corp"
            ? allpc
            : filterStatus === "lmd"
                ? lmdpc
                : corppc;

    // Filter data based on search input and department
    const filteredPCs = displayedPCs.filter((pc) => {
        const search = searchTerm.toLowerCase();

        // First apply search filter
        const matchesSearch = (
            pc.assign_to?.toLowerCase().includes(search) ||
            pc.tag_id?.toLowerCase().includes(search) ||
            pc.department?.toLowerCase().includes(search) ||
            pc.ip_address?.toLowerCase().includes(search) ||
            pc.created_by?.toLowerCase().includes(search)
        );

        // Then apply department filter
        const matchesDepartment = departmentFilter === "all" || pc.department === departmentFilter;

        return matchesSearch && matchesDepartment;
    });

    // Sort data based on date_purchased (newest to oldest or oldest to newest)
    const sortedPCs = [...filteredPCs].sort((a, b) => {
        const dateA = a.date_purchased ? new Date(a.date_purchased) : new Date(0);
        const dateB = b.date_purchased ? new Date(b.date_purchased) : new Date(0);

        if (sortOrder === "newest") {
            return dateB - dateA; // Descending (newest first)
        } else {
            return dateA - dateB; // Ascending (oldest first)
        }
    });

    // Pagination calculations
    const totalPages = Math.ceil(sortedPCs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedPCs.slice(startIndex, endIndex);

    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm, departmentFilter, sortOrder]);

    //Navigate to review
    const HandleView = (pc) => {
        const params = new URLSearchParams({ id: pc.pms_id })
        navigate(`/assets-computer?${params.toString()}`)
    }

    return (
        <Container
            style={{
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                padding: "20px",
                overflowX: "auto",
            }}
        >
            {/* Search and Filter Controls */}
            <Row className="align-items-center mb-3 g-2">
                <Col xs={12}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Form.Control
                            type="text"
                            placeholder="Search by Assigned To, Tag ID, Department, IP, or Created By"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ minWidth: "200px", flex: "2" }}
                        />

                        <Form.Select
                            style={{ width: "130px" }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="lmd & corp">LMD & Corp</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">Corp</option>
                        </Form.Select>

                        {/* Department Filter Dropdown */}
                        <Form.Select
                            style={{ width: "160px" }}
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {uniqueDepartments.map((dept, index) => (
                                <option key={index} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </Form.Select>

                        {/* Sort Order Dropdown */}
                        <Form.Select
                            style={{ width: "160px" }}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </Form.Select>

                        <Button onClick={() => navigate('/assets-add-computer')}>
                            + Add Desktop
                        </Button>
                    </div>
                </Col>
            </Row>


            {/* Table */}
            <div className="d-none d-md-block">
                <table className="table mb-0 table-hover align-middle">
                    <thead
                        style={{
                            fontSize: "14px",
                            textTransform: "uppercase",
                            color: "#555",
                            background: "#f8f9fa",
                        }}
                    >
                        <tr>
                            <th>Tag ID</th>
                            <th>Assigned To</th>
                            <th>Department</th>
                            <th>IP Address</th>
                            <th>PMS Date</th>
                            <th>Date Purchased</th>
                            <th>Created By</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: "15px", color: "#333" }}>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((pc, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid #f0f0f0" }} onClick={() => HandleView(pc)}>
                                    <td>{pc.tag_id}</td>
                                    <td>{pc.assign_to || "-"}</td>
                                    <td>{pc.department || "-"}</td>
                                    <td>{pc.ip_address || "-"}</td>
                                    <td>{pc.pms_date ? new Date(pc.pms_date).toLocaleDateString() : "-"}</td>
                                    <td>{pc.date_purchased ? new Date(pc.date_purchased).toLocaleDateString() : "-"}</td>
                                    <td>{pc.created_by || "-"}</td>
                                    <td style={{ cursor: 'pointer', color: '#003006ff' }}>view</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center text-muted py-3">No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                    <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                        {[...Array(totalPages)].map((_, idx) => (
                            <Pagination.Item
                                key={idx + 1}
                                active={idx + 1 === currentPage}
                                onClick={() => setCurrentPage(idx + 1)}
                            >{idx + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            )}
        </Container>
    );
}