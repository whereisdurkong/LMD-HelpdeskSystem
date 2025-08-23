import { useEffect, useState } from 'react';
import { Form, Button, Card, Row, Col, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import { useNavigate } from 'react-router';

export default function CreateTicket() {
  const navigate = useNavigate();
  useEffect(() => {
    const empInfo = JSON.parse(localStorage.getItem('user'));

    if (['tier1', 'tier2', 'tier3'].includes(empInfo.emp_tier)) {
      navigate('/create-ticket-hd')
    } else {
      navigate('/create-ticket-user')
    }
  }, [])
}