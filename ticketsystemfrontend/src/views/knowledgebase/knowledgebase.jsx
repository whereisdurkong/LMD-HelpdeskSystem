import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from "axios";
import config from "config";

export default function Knowledgebase() {
    const [allData, setAllData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    const navigate = useNavigate();

    // Helper: convert HTML string to plain text
    const htmlToPlainText = (html) => {
        if (!html) return '';
        try {
            // Use DOMParser to parse HTML and extract textContent (handles entities too)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            // Replace consecutive whitespace & newlines with single space and trim
            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        } catch (err) {
            // fallback: simple tag strip
            return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
    };

    const items = [
        {
            title: 'Hardware',
            desc: 'Learn how to troubleshoot and maintain your computer’s physical components and devices.',
            src: 'src/assets/images/hardware.png',
            link: '/hardware',
        },
        {
            title: 'Network',
            desc: 'Find guides to fix connectivity issues and understand how your network keeps you online.',
            src: 'src/assets/images/network.png',
            link: '/network',
        },
        {
            title: 'Software',
            desc: 'Explore tips and solutions for common application errors and software usage.',
            src: 'src/assets/images/software.png',
            link: '/software',
        },
        {
            title: 'System',
            desc: 'Access guides and troubleshooting tips for our in-house applications and tools.',
            src: 'src/assets/images/system.png',
            link: '/system',
        },
    ];

    // Fetch API data and map kb_desc HTML -> plain text
    useEffect(() => {
        const fetchdata = async () => {
            try {
                const all = await axios.get(`${config.baseApi}/knowledgebase/all-knowledgebase`);
                if (all.data && Array.isArray(all.data)) {
                    const activeData = all.data
                        .filter(item => item.is_active === true)
                        .map(item => ({
                            kb_id: item.kb_id,
                            kb_title: item.kb_title,
                            // convert HTML to plain text here
                            kb_answer: htmlToPlainText(item.kb_desc || ''),
                            kb_category: item.kb_category
                        }));
                    console.log("Debug: All Items from API (titles):");
                    activeData.forEach(item => console.log(item.kb_title));
                    setAllData(activeData);
                }
            } catch (err) {
                console.log('Unable to retrieve all kb data: ', err);
            }
        };
        fetchdata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Search filter: title, description (plain text), and category
    useEffect(() => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") {
            setFilteredData([]); // keep dropdown hidden when empty (optional: set to allData to show all)
            return;
        }

        setFilteredData(
            allData.filter(item =>
                (item.kb_title && item.kb_title.toLowerCase().includes(term)) ||
                (item.kb_answer && item.kb_answer.toLowerCase().includes(term)) ||
                (item.kb_category && item.kb_category.toLowerCase().includes(term))
            )
        );
    }, [searchTerm, allData]);

    return (
        <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Top Section */}
            <div
                style={{
                    background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                    minHeight: '50vh',
                    paddingTop: '10vh',
                    paddingBottom: '5vh',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative'
                }}
            >
                <Container style={{ maxWidth: '1000px', paddingTop: '10vh' }}>
                    <h1 style={{ paddingBottom: '10px' }}><b>Hi. How can we help?</b></h1>

                    {/* Search Box + Dropdown */}
                    <div style={{ marginTop: '30px', width: '100%', maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                zIndex: 100
                            }}
                        >
                            <FaSearch style={{ color: '#999', marginRight: '10px' }} />
                            <Form.Control
                                type="text"
                                placeholder="Find anything (ex. slow internet, request new mouse or unable to access)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    fontSize: '1rem',
                                    flex: 1,
                                }}
                            />
                        </div>

                        {/* Search Dropdown */}
                        {filteredData.length > 0 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    width: '100%',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                    zIndex: 9999,
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    textAlign: 'left'
                                }}
                            >
                                {filteredData.map(item => (
                                    <div
                                        key={item.kb_id}
                                        style={{
                                            padding: '10px 15px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            color: '#000'
                                        }}
                                        onClick={() => navigate(`/${item.kb_category || ''}`)}
                                    >
                                        <div style={{ fontWeight: 700 }}>{item.kb_title}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '6px' }}>
                                            {item.kb_answer.length > 120 ? item.kb_answer.substring(0, 120) + "..." : item.kb_answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* {/* Troubleshooting Links */}
                    <div
                        style={{
                            marginTop: '20px',
                            fontSize: '0.95rem',
                            flexWrap: 'wrap',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                        }}
                    >
                        <span>Common troubleshooting topics:</span>
                        <a href="/ticketsystem/network" style={{ color: '#fff', textDecoration: 'underline' }}>Slow internet</a>
                        <a href="/ticketsystem/hardware" style={{ color: '#fff', textDecoration: 'underline' }}>Keyboard not working</a>
                        <a href="/ticketsystem/software" style={{ color: '#fff', textDecoration: 'underline' }}>Outlook Unable to log in</a>
                    </div>
                </Container>
            </div>

            {/* Bottom Section */}
            <div
                style={{
                    backgroundColor: '#003e03ff',
                    minHeight: '50vh',
                    paddingTop: '40px',
                    paddingBottom: '40px',
                    display: 'flex',               // enable flexbox
                    alignItems: 'center',          // vertically center content
                    justifyContent: 'center',      // horizontally center content
                }}
            >
                <Container fluid="lg">
                    <Row className="text-center justify-content-center">
                        {items.map((item, idx) => (
                            <Col
                                key={idx}
                                xs={12}
                                sm={6}
                                md={4}
                                lg={3}
                                className="mb-4 d-flex justify-content-center"
                            >
                                <Link
                                    to={item.link}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        width: '100%',
                                        maxWidth: '220px',
                                    }}
                                >
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        style={{
                                            width: 'clamp(100px, 10vw, 150px)',
                                            height: 'auto',
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <h4
                                        className="mt-3"
                                        style={{
                                            color: '#fff',
                                            fontSize: 'calc(1rem + 0.3vw)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <b>{item.title}</b>
                                    </h4>
                                    <p
                                        style={{
                                            color: '#fff',
                                            maxWidth: '90%',
                                            textAlign: 'center',
                                            margin: 0,
                                        }}
                                    >
                                        {item.desc}
                                    </p>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </Container>

            </div>
        </div>
    );
}
