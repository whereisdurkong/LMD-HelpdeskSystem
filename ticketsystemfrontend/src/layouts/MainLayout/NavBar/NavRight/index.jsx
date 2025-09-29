
import { Link } from 'react-router-dom';

// react-bootstrap
import { ListGroup, Dropdown, Form, Badge } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';

// assets
import avatar2 from 'assets/images/user/avatar-2.jpg';

import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

import axios from 'axios';
import config from 'config';
// -----------------------|| NAV RIGHT ||-----------------------//

export default function NavRight() {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [userData, setUserData] = useState([]);
  const [toFilter, setToFilter] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifContent, setNotifContent] = useState([]);
  const [ticketIDS, setTicketIDS] = useState([]);
  const navigate = useNavigate()

  // Load user data from localStorage
  useEffect(() => {
    const empInfo = JSON.parse(localStorage.getItem('user'));
    setUserData(empInfo)
    setPosition(empInfo.emp_position);
    if (empInfo?.emp_FirstName) {
      const FirstName =
        empInfo.emp_FirstName.charAt(0).toUpperCase() +
        empInfo.emp_FirstName.slice(1).toLowerCase();

      const LastName =
        empInfo.emp_LastName.charAt(0).toUpperCase() +
        empInfo.emp_LastName.slice(1).toLowerCase()
      setName(FirstName + ' ' + LastName)
    }
  }, []);

  // Set toFilter based on emp_tier
  useEffect(() => {
    if (!userData || !userData.emp_tier) return;

    if (userData.emp_tier === 'helpdesk') {
      setToFilter('assigned_to');
    } else if (userData.emp_tier === 'user') {
      setToFilter('ticket_for');
    }
  }, [userData]);

  // Fetch notifications once toFilter is set
  useEffect(() => {
    if (!toFilter || !userData.user_name) return;

    fetchNotifications(userData.user_name);
  }, [toFilter, userData]);




  const fetchNotifications = async (user_name) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const response = await fetch(`${config.baseApi}/ticket/get-all-ticket`);
      const data = await response.json(); // all tikcets result

      const assignedTickets = data.filter(
        (ticket) => ticket[toFilter] === user_name); //all tikcet assigned under username



      if (user.emp_tier === 'helpdesk') {
        const notifiedTickets = assignedTickets.filter(
          (ticket) => ticket.is_notifiedhd === true); //ticket that has is_notified === true

        setNotifContent(notifiedTickets.map(ticket => ticket.ticket_id)); // <-- set as array
        setNotificationCount(notifiedTickets.length);
      } else if (user.emp_tier === 'user') {
        const notifiedTickets = assignedTickets.filter(
          (ticket) => ticket.is_notified === true); //ticket that has is_notified === true

        setNotifContent(notifiedTickets.map(ticket => ticket.ticket_id)); // <-- set as array
        setNotificationCount(notifiedTickets.length);
      }




    } catch (err) {
      setNotificationCount(0);
      setNotifContent([]);
    }
  };

  useEffect(() => {
    if (!toFilter || !userData.user_name) return;

    const interval = setInterval(() => {
      fetchNotifications(userData.user_name);
    }, 5000); // every 10 seconds

    // Call it once immediately
    fetchNotifications(userData.user_name);

    return () => clearInterval(interval); // clear on unmount
  }, [toFilter, userData]);




  const HandleLogOut = () => {
    localStorage.removeItem('user');
    window.location.replace('/');
  }
  const HandleProfile = () => {
    navigate('/profile')
  }

  const HandleView = async (context) => {
    const params = new URLSearchParams({ id: context })
    const user = JSON.parse(localStorage.getItem('user'));

    if (userData.emp_tier === 'helpdesk') {

      await axios.post(`${config.baseApi}/ticket/update-notified-false`, {
        ticket_id: context,
        user_id: user.user_id
      }).then(window.location.replace(`/ticketsystem/view-hd-ticket?${params.toString()}`))

    } else if (userData.emp_tier === 'user') {
      await axios.post(`${config.baseApi}/ticket/update-notified-false`, {
        ticket_id: context,
        user_id: user.user_id
      }).then(window.location.replace(`/ticketsystem/view-ticket?${params.toString()}`))
    }
  }

  return (
    <ListGroup as="ul" bsPrefix=" " className="list-unstyled">
      <ListGroup.Item as="li" bsPrefix=" " className="pc-h-item">
        <Dropdown>
          <Dropdown.Toggle as="a" variant="link" className="pc-head-link arrow-none me-0">
            <FeatherIcon icon="bell" />
            {notificationCount > 0 && (
              <Badge bg="danger" pill style={{ position: 'absolute', top: 8, right: 8 }}>
                {notificationCount}
              </Badge>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown">
            <Dropdown.Item>
              {notifContent.length === 0 ? (
                'No new notifications'
              ) : (
                <div style={{ fontSize: '15px', color: '#333' }}>
                  {notifContent.map((content, index) => (
                    <div key={index}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 0',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <span className="text-muted" onClick={() => HandleView(content)}>
                        New Notification from Ticket ID: {content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </ListGroup.Item>
      <ListGroup.Item as="li" bsPrefix=" " className="pc-h-item">
        <Dropdown className="drp-user">
          <Dropdown.Toggle as="a" variant="link" className="pc-head-link arrow-none me-0 user-name">
            <img src={avatar2} alt="userimage" className="user-avatar" />
            <span>
              <span className="user-name">{name}</span>
              <span className="user-desc">{position}</span>
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown">

            <Link to='#' className="dropdown-item" onClick={HandleProfile}>
              <i className="feather icon-user" /> Profile
            </Link>

            <Link to="#" className="dropdown-item"
              onClick={HandleLogOut}>
              <i className="material-icons-two-tone">chrome_reader_mode</i> Logout
            </Link>
          </Dropdown.Menu>
        </Dropdown>
      </ListGroup.Item>
    </ListGroup>
  );
}