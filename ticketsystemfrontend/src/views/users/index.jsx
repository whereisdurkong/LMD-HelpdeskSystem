import { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import axios from 'axios';
import config from 'config';

import UserLMD from './users-lmd'
import UserCORP from './users-corp'

export default function Users() {
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(user => user.emp_tier === 'user');
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



            <div
                style={{
                    maxWidth: "1500px", // match your table width
                    margin: "0 auto",
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                    <div><h3>Users</h3></div>
                    <Button onClick={HandleRegister}>+ Register</Button>
                </div>
                <Tabs
                    defaultActiveKey="lmd"
                    transition={false}
                    id="justify-tab-example"
                    justify
                    style={{
                        borderBottom: "2px solid #ddd",
                    }}
                >
                    {/* LMD */}
                    <Tab
                        eventKey="lmd"
                        title={
                            <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                LMD
                            </span>
                        }
                    >
                        <UserLMD />
                    </Tab>
                    {/* LMD */}
                    <Tab
                        eventKey="corp"
                        title={
                            <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                CORP
                            </span>
                        }
                    >
                        <UserCORP />
                    </Tab>
                </Tabs>
            </div>
        </Container>
    );
}
