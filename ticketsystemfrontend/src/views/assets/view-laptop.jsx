import { useEffect, useState } from "react";
import { Button, Container, Form, Pagination, Row, Col } from "react-bootstrap";
import axios from "axios";
import config from "config";
import { useNavigate } from 'react-router';
export default function Viewlaptop() {
    const navigate = useNavigate()
    const [lmdpc, setLmdpc] = useState([]);
    const [corppc, setCorppc] = useState([]);
    const [allpc, setAllpc] = useState([]);
    const [filterStatus, setFilterStatus] = useState("lmd & corp");
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get(`${config.baseApi}/pms/get-laptop`);
            const data = res.data || [];


            const allactive = data.filter(e => Number(e.is_active) === 1);
            setAllpc(allactive);

            const lmd = data.filter((pc) => pc.assigned_location === "lmd" && pc.pms_category === "laptop" && pc.is_active === 1);
            setLmdpc(lmd);

            const corp = data.filter((pc) => pc.assigned_location === "corp" && pc.pms_category === "laptop" && pc.is_active === 1);
            setCorppc(corp);
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

    // 🔍 Filter data based on search input
    const filteredPCs = displayedPCs.filter((pc) => {
        const search = searchTerm.toLowerCase();
        return (
            pc.assign_to?.toLowerCase().includes(search) ||
            pc.tag_id?.toLowerCase().includes(search) ||
            pc.department?.toLowerCase().includes(search) ||
            pc.ip_address?.toLowerCase().includes(search) ||
            pc.created_by?.toLowerCase().includes(search)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredPCs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredPCs.slice(startIndex, endIndex);

    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);

    const HandleView = (pc) => {
        const params = new URLSearchParams({ id: pc.pms_id }).toString();
        window.location.replace(`/ticketsystem/assets-laptop?${params.toString()}`);
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
                            style={{ flex: "1" }}
                        />

                        <Form.Select
                            style={{ width: "180px" }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="lmd & corp">LMD & Corp</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">Corp</option>
                        </Form.Select>

                        <Button onClick={() => navigate('/assets-add-laptop')}>
                            + Add Laptop
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
                            <th>Created By</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: "15px", color: "#333" }}>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((pc, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid #f0f0f0" }} onClick={() => HandleView(pc)}>
                                    <td>{pc.tag_id}</td>
                                    <td>{pc.assign_to || "N/A"}</td>
                                    <td>{pc.department || "N/A"}</td>
                                    <td>{pc.ip_address || "N/A"}</td>
                                    <td>
                                        {pc.pms_date
                                            ? new Date(pc.pms_date).toLocaleDateString()
                                            : "N/A"}
                                    </td>
                                    <td>{pc.created_by || "N/A"}</td>
                                    <td>
                                        {pc.created_at
                                            ? new Date(pc.created_at).toLocaleString()
                                            : "N/A"}
                                    </td>
                                    <td style={{ cursor: 'pointer', color: '#003006ff' }}>view</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-muted py-3">
                                    No records found.
                                </td>
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
                            >
                                {idx + 1}
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
