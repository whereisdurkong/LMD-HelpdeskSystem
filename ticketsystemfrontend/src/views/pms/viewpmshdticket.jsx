import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt } from 'react-icons/fa';
import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Card, Button, Alert, FormSelect, Modal, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import Select from 'react-select';
import FeatherIcon from 'feather-icons-react';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from "react-router-dom";


import CreatableSelect from 'react-select/creatable';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

export default function ViewHDPmsTicket() {
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [ticketForData, setTicketForData] = useState({});
    const [hdUser, setHDUser] = useState({});
    const [allUser, setAllUser] = useState([]);
    const [allHDUser, setAllHDUser] = useState([]);

    const [tier, setTier] = useState('');
    const [location, setLocation] = useState('');

    const [isEditable, setIsEditable] = useState(false);
    const [showAcceptButton, setShowAcceptButton] = useState(false);

    const [hdnotesState, setHDNotesState] = useState(false)
    const [noteAlert, setNoteAlert] = useState(false)
    const template = 'Steps taken:\nResolution:'
    const [notes, setNotes] = useState(template)
    const [allnotes, setAllNotes] = useState([]);
    const [notesofhduser, setnoteofhduser] = useState('')
    const [originalNotes, setOriginalNotes] = useState("");

    const [error, setError] = useState('');
    const [successful, setSuccessful] = useState('');

    const [allfeedback, setAllFeedback] = useState([])
    const [feedbackuser, setFeedBackUser] = useState('')

    const [showCloseResolutionModal, setShowCloseResolutionModal] = useState(false);
    const [resolution, setResolution] = useState('');

    const [collaboratorState, setCollaboratorState] = useState(false);
    const pmsticket_id = new URLSearchParams(window.location.search).get('id');

    const [showUserCard, setShowUserCard] = useState(false);

    const [notifyReview, setNotifyReview] = useState(false);
    const [loading, setLoading] = useState(false);

    const [assignToState, setAssignedToState] = useState(false);
    const [archiveState, setArchiveState] = useState(false)
    const [unarchiveState, setUnArchiveState] = useState(false)
    const [archiveTextState, setArchiveTextState] = useState(false)

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [assets, setAssets] = useState([]);

    const navigate = useNavigate();

    const customSelectStyles = {
        container: (provided) => ({
            ...provided,
            width: '100%',
        }),
        control: (provided, state) => ({
            ...provided,
            minHeight: '43px',
            border: state.isFocused ? '2px solid #fdc10dff' : `2px solid ${provided.borderColor}`,
            boxShadow: state.isFocused ? '1px rgba(253, 169, 13, 1)' : provided.boxShadow,
            '&:hover': { borderColor: '#fdc10dff' },
        }),
        valueContainer: (provided) => ({
            ...provided,
            paddingTop: '0px',
            paddingBottom: '0px',
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
            padding: '1px 4px',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            fontSize: '0.85rem',
            color: '#333',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#999',
            ':hover': {
                backgroundColor: '#ffcccc',
                color: '#ff0000',
            },
        }),
    };

    useEffect(() => {
        if (formData.pms_status === 'open') {
            setAssignedToState(true)
        } else {
            setAssignedToState(false)
        }
    }, [formData.pms_status])

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer)
        }
    }, [loading])

    //Alerts timeout
    useEffect(() => {
        if (error || successful) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessful('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successful]);

    //buttons validation
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));

        if (empInfo.emp_tier === 'helpdesk') {
            //and ticket is open
            if (formData.pms_status === 'open') {
                if (isEditable === true) {
                    setShowAcceptButton(false)
                } else {
                    setShowAcceptButton(true)
                }
            }
            //and ticket is re-opend
            if (formData.pms_status === 're-opened') {
                setIsEditable(true);
            }
            if (formData.pms_status === 'in-progress' || formData.pms_status === 'assigned') {
                if (formData.assigned_to !== empInfo.user_name) {
                    setIsEditable(false)
                    setShowAcceptButton(true)
                } else {
                    setIsEditable(true)
                }
            }

            if (formData.pms_status === 'resolved' || formData.pms_status === 'closed') {
                setIsEditable(false);
                if (isEditable === true) {
                    setShowAcceptButton(false)
                } else {
                    setShowAcceptButton(true)
                }
            }
        }


    }, [formData.pms_status])

    // Note checker availability
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const fetchNotes = async () => {
            //Open HD Add Note Function
            if (formData.pms_status === 'in-progress' && formData.assigned_to === empInfo.user_name) {
                setHDNotesState(true)
            }

            try {
                //Get all notes
                const response = await axios.get(`${config.baseApi}/pmsticket/get-all-notes/${pmsticket_id}`);
                setAllNotes(response.data);

                //Get all notes by their username
                const usernames = response.data.map(note => note.created_by)

                const responses = await axios.get(`${config.baseApi}/authentication/get-all-notes-usernames`, {
                    params: { user_name: JSON.stringify(usernames) }
                });

                const userMap = {}
                responses.data.forEach(user => {
                    userMap[user.user_name] = `${user.emp_FirstName} ` + ' ' + `${user.emp_LastName}`;
                });
                setnoteofhduser(userMap)

                //------------------------------------------------------------------------------------------------------------------------------
                //get all feedback/review
                const allfeedback = await axios.get(`${config.baseApi}/pmsticket/get-all-feedback/${pmsticket_id}`);
                setAllFeedback(allfeedback.data);

                //User data base on their username
                const feedbackusername = allfeedback.data.map(user => user.created_by);

                const feedbackRes = await axios.get(`${config.baseApi}/authentication/get-all-review-usernames`, {
                    params: { user_name: JSON.stringify(feedbackusername) }
                });

                //settin up full nmae by their user_id
                const alluserMap = {}
                feedbackRes.data.forEach(user => {
                    alluserMap[user.user_name] = `${user.emp_FirstName}` + ' ' + `${user.emp_LastName}`;
                });

                setFeedBackUser(alluserMap)


            } catch (err) {
                console.log('UNABLE TO FETCH ALL NOTES: ', err)
            }
        }
        fetchNotes();
    }, [formData.pms_status, pmsticket_id, formData.is_reviewed])

    //Get user from ticket
    useEffect(() => {

        //For User
        if (formData.pmsticket_for) {
            const fetch = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.pmsticket_for }
                    });
                    setTicketForData(response.data);
                } catch (err) {
                    console.log(err);
                }
            };
            fetch();
        }
        //For HD
        if (formData.assigned_to) {
            const fetchHDUser = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.assigned_to }
                    });
                    setHDUser(response.data);
                } catch (err) {
                    console.log(err);
                }
            };
            fetchHDUser();
        }
        /////WILL BE REMOVED


        if (ticketForData.emp_location === 'corp') {
            setLocation('Corporate Markati');
        } else if (ticketForData.emp_location === 'lmd') {
            setLocation('Lepanto Mine Division');
        }




    }, [formData.pmsticket_for, formData.assigned_to, formData.pms_status, ticketForData.emp_location]);


    //Get the ticket 
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                    params: { id: pmsticket_id }
                });

                const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
                setFormData(ticket);
                setOriginalData(ticket);

                if ((ticket.pms_status === 'closed' && (ticket.is_reviewed === false || ticket.is_reviewed === null)) ||
                    (ticket.pms_status === 'resolved' && (ticket.is_reviewed === false || ticket.is_reviewed === null))) {
                    setNotifyReview(true)
                } else {
                    setNotifyReview(false)
                }


            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
    }, [pmsticket_id]);

    const [archBTN1, setArchBTN1] = useState(false);
    const [archBTN2, setArchBTN2] = useState(false);


    //Archive Checker
    useEffect(() => {
        if (formData.is_active === false || formData.is_active === '0') {
            setArchiveTextState(true);
            setIsEditable(false);
            setNotifyReview(false);
            setShowAcceptButton(false);
            setHasChanges(false);
            setArchBTN2(true)
            setArchBTN1(false)
        } else {
            setArchiveTextState(false);
            setArchBTN1(true)
            setArchBTN2(false)
        }

    }, [formData])

    //get all users hd/users
    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(user => user.emp_tier === 'user');
                setAllUser(justUsers);

                const allHD = res.data.filter(hd => hd.emp_tier === 'helpdesk');
                setAllHDUser(allHD);
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });
    }, [])

    //asset options
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const fname = empInfo.user_name;
        const lname = empInfo.user_name;

        const first = fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
        const last = lname.charAt(0).toUpperCase() + lname.slice(1).toLowerCase();

        const fetch = async () => {
            const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
            const data = res.data || [];
            const active = data.filter(a => a.is_active === "1");

            //all of the asset under assign_to 
            const own = active.filter(e => e.assign_to === formData.pmsticket_for);

            const allAssets = active.map(e => e.tag_id);

            setAssets(active)

        }
        fetch();
    }, [formData])
    // const options = assets.map(asset => ({ value: asset, label: asset }));
    const options = assets.map(asset => ({
        value: asset.tag_id,
        label: asset.tag_id,
        category: asset.pms_category
    }));




    // handle text area change
    const handleNoteChange = (e) => {
        const { value } = e.target;
        setNotes(value);

        // check if note is different from original
        const changed = value !== originalNotes;
        setHasChanges(changed);
    };

    // fix this shit 
    const handleNotifyReview = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        //tikcetfor
        try {
            setLoading(true);
            setSuccessful('Notified the user')
            axios.post(`${config.baseApi}/pmsticket/send-notification-review`, {
                ticket_for_id: ticketForData.user_id,
                pmsticket_id: pmsticket_id,
                hd_user_id: empInfo.user_id,
            });

            axios.post(`${config.baseApi}/pmsticket/note-post`, {
                notes: 'Notified the user for review',
                current_user: empInfo.user_name,
                pmsticket_id: pmsticket_id
            })


            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            console.error('Error notifying review:', err);
        }
    }


    //Accept ticket function
    const HandleAcceptButton = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));

        try {
            setLoading(true);

            const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                params: { id: pmsticket_id }
            });
            const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;


            if (ticket.is_locked === "0" || ticket.locked_by === empInfo.user_name || ticket.locked_by === null) {
                axios.post(`${config.baseApi}/pmsticket/update-accept-pmsticket`, {
                    user_id: empInfo.user_id,
                    pmsticket_id: pmsticket_id,
                    pms_status: formData.pms_status,
                    tag_id: formData.tag_id
                });
                //Notify User
                await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                    pmsticket_id: pmsticket_id,
                    user_id: empInfo.user_id
                })

                setIsEditable(true)
                setShowAcceptButton(false)
                window.location.reload();
            }
            else if (ticket.is_locked === "1" || ticket.locked_by !== empInfo.user_name) {
                setLoading(false)
                setError(`${ticket.locked_by} is currently working on this ticket`);
                return;
            }



        } catch (err) {
            console.log(err)
        }
    }

    // const handleSubmitNote = async (e) => {
    //     e.preventDefault();
    //     const empInfo = JSON.parse(localStorage.getItem('user'));
    //     try {
    //         if (notes === template) {
    //             setNoteAlert(true)
    //         } else {
    //             setLoading(true);
    //             await axios.post(`${config.baseApi}/ticket/note-post`, {
    //                 notes,
    //                 current_user: empInfo.user_name,
    //                 ticket_id: pmsticket_id
    //             });

    //             await axios.post(`${config.baseApi}/ticket/notified-true`, {
    //                 ticket_id: pmsticket_id,
    //                 user_id: empInfo.user_id
    //             })
    //             setNoteAlert(false);
    //             setNotes('');
    //             console.log('Submitted a note succesfully');
    //             window.location.reload();
    //         }
    //     } catch (err) {
    //         console.log('Unable to submit note: ', err)
    //     }

    // }



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updatedForm = { ...prev, [name]: value };
            const fieldsToCheck = ['tag_id', 'notes', 'assigned_to', 'pmsticket_for', 'pms_status'];
            const changed = fieldsToCheck.some(field => updatedForm[field] !== originalData[field]);

            setHasChanges(changed);

            return updatedForm;
        });
    };



    // // Lock/unlock function
    const empInfo = JSON.parse(localStorage.getItem('user'));
    const [lockModal, setLockModal] = useState(false)
    const [lockError, setLockError] = useState('')
    useEffect(() => {
        const { user_name } = empInfo || {};
        const currentUser = user_name;
        const currentTicketId = pmsticket_id;

        const lockTicket = async () => {
            try {
                await axios.post(`${config.baseApi}/pmsticket/lock`, {
                    pmsticket_id: currentTicketId,
                    locked_by: currentUser,
                });
            } catch (err) {
                setTimeout(() => {
                    setLockModal(true);
                }, 10000);

                setLockError(err.response?.data?.message || "Ticket locked by another user");
            }
        };

        lockTicket();

        const handleUnload = () => {
            if (!currentTicketId || !currentUser) return;

            const payload = JSON.stringify({
                pmsticket_id: currentTicketId,
                locked_by: currentUser,
            });

            const blob = new Blob([payload], { type: "application/json" });

            navigator.sendBeacon(`${config.baseApi}/pmsticket/unlock`, blob);
        };

        window.addEventListener("beforeunload", handleUnload);


        return () => {
            window.removeEventListener("beforeunload", handleUnload);
            // Normal React navigation unlock
            if (currentTicketId && currentUser) {
                axios.post(`${config.baseApi}/pmsticket/unlock`, {
                    pmsticket_id: currentTicketId,
                    locked_by: currentUser,
                }).catch(() => { });
            }
        };
    }, [pmsticket_id, empInfo]);



    // Refresh lock if form has changes
    useEffect(() => {

        const interval = setInterval(() => {
            if (hasChanges) {

                axios.post(`${config.baseApi}/pmsticket/lock`, {
                    pmsticket_id,
                    locked_by: empInfo.user_name,
                });
            }
        }, 10000); // refresh lock every 10s

        return () => clearInterval(interval);

    }, [hasChanges, pmsticket_id, empInfo.user_name]);


    useEffect(() => {
        const fetch = async () => {
            const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                params: { id: pmsticket_id }
            });
            const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
            console.log(ticket)
            if (ticket.is_locked === '0' || ticket.locked_by === empInfo.user_name || ticket.locked_by === null) {

                setLockModal(false)
            } else {
                setLockModal(true)
                setIsEditable(false)
            }

        }
        fetch();


    }, [isEditable])

    const handleChecker = async () => {
        if (formData.pms_status === 'resolved') {
            setShowCloseResolutionModal(true)
        } else (
            handleSave()
        )
    }

    const HandleResolution = async (e) => {
        e.preventDefault();

        const empInfo = JSON.parse(localStorage.getItem('user'));
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/pmsticket/note-post`, {
                notes: 'HelpDesk Resolution: ' + resolution,
                current_user: empInfo.user_name,
                pmsticket_id: pmsticket_id
            });

            await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                pmsticket_id: pmsticket_id,
                user_id: empInfo.user_id
            })

            setResolution('');
            console.log('Submitted a resolution succesfully');
            handleSave();
        } catch (err) {
            console.log('Unable to save resolution note: ', err)
        }

    }

    const [newLocation, setNewLocation] = useState('')

    const handleSave = async () => {
        try {
            const empInfo = JSON.parse(localStorage.getItem('user'));

            setLoading(true);
            const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                params: { id: pmsticket_id }
            });
            const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
            //Check if someone is working on this ticket
            if (ticket.is_locked === '0' || ticket.locked_by === empInfo.user_name || ticket.locked_by === null) {
                if (formData.pms_status === 'in-progress') {

                    if (!formData.pms_status) {
                        setLoading(false)
                        setError('Unable to save empty fields! Please try again!');
                        return;
                    }
                }

                //Check changes
                const changedFields = [];
                const fieldsToCheck = ['tag_id', 'notes', 'pmsticket_for', 'pms_status', 'Description'];
                fieldsToCheck.forEach(field => {
                    const original = originalData[field];
                    const current = formData[field];
                    if ((original ?? '') !== (current ?? '')) {
                        changedFields.push(` ${empInfo.user_name} Changed '${field}' from '${original}' to '${current}'`)
                    }
                });
                console.log('Changed Fields:', changedFields);
                const changesMade = changedFields.length > 0 ? changedFields.join('; ') : '';


                const changedTicketFor = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                    params: { user_name: formData.pmsticket_for }
                })
                const TicketforEmail = changedTicketFor.data


                if (formData.pmsticket_for) {
                    const changedTicketFor = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.pmsticket_for }
                    })
                    const newticketfor = changedTicketFor.data;

                    const newTF_location = newticketfor?.emp_location ?? '';

                    const assignedLocation = (!newTF_location || (typeof newTF_location === 'string' && newTF_location.trim() === ''))
                        ? ''
                        : newTF_location;

                    await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                        pmsticket_id: formData.pmsticket_id,
                        tag_id: formData.tag_id,
                        pms_status: formData.pms_status,
                        pmsticket_for: formData.pmsticket_for,
                        description: formData.description,
                        updated_by: empInfo.user_id,
                        changes_made: changesMade,
                        ticket_for_UserId: TicketforEmail.user_id,
                        assigned_to_UserId: hdUser.user_id,
                        assigned_to: formData.assigned_to,
                        assigned_location: newTF_location
                    });
                    console.log(newTF_location)

                }

                if (formData.pms_status === 'open') {
                    if (!formData.assigned_to || formData.assigned_to.trim() === '') {
                        // Case 1: Open and no assigned user
                        console.log('OPEN AND EMPTY');
                        await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                            assigned_to: '',
                            pms_status: 'open',
                            updated_by: empInfo.user_id,
                            pmsticket_id: formData.pmsticket_id,
                            tag_id: formData.tag_id
                        });

                        window.location.reload()
                    }

                    else if (originalData.assigned_to === formData.assigned_to) {
                        console.log('(originalData.assigned_to === formData.assigned_to)')
                        await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                            assigned_to: '',
                            pms_status: 'open',
                            updated_by: empInfo.user_id,
                            pmsticket_id: formData.pmsticket_id,
                            tag_id: formData.tag_id
                        });
                        window.location.reload()
                    }
                    else if (originalData.assigned_to !== formData.assigned_to) {
                        // Case 2: Open but has assigned user → treat as assigned
                        console.log('OPEN WITH ASSIGN (saving as assigned)', formData.assigned_to);
                        await axios.post(`${config.baseApi}/pmsticket/update-ticket-assigned`, {
                            assigned_to: hdUser.user_name,
                            pms_status: 'assigned',
                            updated_by: empInfo.user_id,
                            pmsticket_id: formData.pmsticket_id,
                            tag_id: formData.tag_id
                        })
                        window.location.reload()
                    }
                }

                // // Case 3: If status changed to open from another status → reset assigned_to
                // if (originalData.pms_status !== 'open' && formData.pms_status === 'open') {
                //     console.log('CHANGED TO OPEN → clearing assigned_to');
                //     await axios.post(`${config.baseApi}/pmsticket/update-ticket-assigned`, {
                //         assigned_to: '',
                //         pms_status: 'open',
                //         updated_by: empInfo.user_id,
                //         pmsticket_id: formData.pmsticket_id,
                //         tag_id: formData.tag_id
                //     });
                //     window.location.reload()
                // }

                setLoading(true);
                await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                    pmsticket_id: pmsticket_id,
                    user_id: empInfo.user_id
                })


                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: formData.pmsticket_id,
                    tag_id: formData.tag_id,
                    pms_status: formData.pms_status,
                    pmsticket_for: formData.pmsticket_for,
                    description: formData.description,
                    updated_by: empInfo.user_id,
                    changes_made: changesMade,
                    ticket_for_UserId: TicketforEmail.user_id,
                    assigned_to_UserId: hdUser.user_id,
                    assigned_to: formData.assigned_to,
                });




                setSuccessful('Ticket updated successfully.');
                setOriginalData(formData);
                setHasChanges(false);
                console.log('TOBE SAVVEEEDDD', formData)
                window.location.reload();

            } else if (ticket.is_locked === '1' || ticket.locked_by !== empInfo.user_name) {
                setLoading(false)
                setError(`${ticket.locked_by} is currently working on this ticket`);
                return;
            }


        } catch (err) {
            console.error("Error updating ticket:", err);
            setLoading(false)
            setError('Failed to update ticket. Please try again later.');
        }

        if (notes) {
            const empInfo = JSON.parse(localStorage.getItem('user'));
            try {
                if (notes === template) {
                    setNoteAlert(true)
                } else {
                    setLoading(true);

                    await axios.post(`${config.baseApi}/pmsticket/note-post`, {
                        notes,
                        current_user: empInfo.user_name,
                        pmsticket_id: pmsticket_id
                    });

                    await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                        pmsticket_id: pmsticket_id,
                        user_id: empInfo.user_id
                    })
                    setNoteAlert(false);
                    setNotes('');
                    console.log('Submitted a note succesfully');
                    window.location.reload();
                }
            } catch (err) {
                console.log('Unable to submit note: ', err)
            }

        }
    };




    const Archive = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
            params: { id: pmsticket_id }
        });
        const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
        if (ticket.is_locked === '0' || ticket.locked_by === empInfo.user_name || ticket.locked_by === null) {

            try {
                setLoading(true)
                await axios.post(`${config.baseApi}/pmsticket/archive-ticket`, {
                    pmsticket_id: pmsticket_id,
                    updated_by: empInfo.user_name
                })
                console.log('Ticket archived successfully');
                setSuccessful('Ticket archived successfully');
                window.location.reload();

            } catch (err) {
                console.log(err)
            }
        } else if (ticket.is_locked === '1' || ticket.locked_by !== empInfo.user_name) {
            setLoading(false)
            setError(`${ticket.locked_by} is currently working on this ticket`);
            return;
        }

    }
    const UnArchive = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        console.log('Working');
        try {
            setLoading(true)
            await axios.post(`${config.baseApi}/pmsticket/un-archive-ticket`, {
                pmsticket_id: pmsticket_id,
                updated_by: empInfo.user_name
            })
            console.log('Ticket un-archived successfully');
            setSuccessful('Ticket un-archived successfully');
            window.location.reload();

        } catch (err) {
            console.log(err)
        }
    }

    const HandleView = () => {
        setModalTitle("Ticket Logs");
        setModalContent(<ViewTicketLogs pmsticket_id={pmsticket_id} />);
        setShowModal(true);
    };



    return (
        <Container
            fluid
            className="pt-100 pb-4"
            style={{
                background: 'linear-gradient(to bottom, #ffe798, #b8860b)',
                minHeight: '100vh',
                paddingTop: '100px',
            }}
        >
            {successful && (
                <div
                    className="position-fixed start-50 l translate-middle-x"
                    style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                >
                    <Alert variant="success" onClose={() => setSuccessful('')} dismissible>
                        {successful}
                    </Alert>
                </div>
            )}
            {error && (
                <div
                    className="position-fixed start-50 l translate-middle-x"
                    style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                >
                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                    </Alert>
                </div>
            )}

            <AnimatedContent
                distance={100}
                direction="vertical"
                reverse={true}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1.0}
                threshold={0.1}
                delay={0}
            >

                <Container className="bg-white p-4 rounded-3 shadow-sm">
                    <Row>
                        <Col lg={8}>
                            <Row className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <Row className="align-items-center">
                                        <Col xs="auto">
                                            <h3 className="fw-bold text-dark mb-0">PMS Ticket Details</h3>
                                            <h7
                                                style={{
                                                    fontStyle: "italic",
                                                    color: "#2c7e36ff",
                                                    cursor: "pointer",
                                                    textDecoration: "none",
                                                }}
                                                onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                                                onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                                onClick={HandleView}
                                            >
                                                view ticket logs
                                            </h7>
                                        </Col>
                                        {archiveTextState && (
                                            <Col xs="auto">
                                                <h4 className="fw-bold text-secondary mb-0">(archived)</h4>
                                            </Col>
                                        )}
                                    </Row>

                                    <div className="d-flex gap-2">
                                        {archBTN1 && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '100px', minHeight: '40px' }}
                                                onClick={() => setArchiveState(true)}
                                                title="Archive Ticket"
                                            >
                                                <FeatherIcon icon="archive" />
                                            </Button>
                                        )}
                                        {archBTN2 && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '100px', minHeight: '40px' }}
                                                onClick={() => setUnArchiveState(true)}
                                                title="Unarchive Ticket"
                                            >
                                                <FeatherIcon icon="airplay" />
                                            </Button>
                                        )}
                                        {notifyReview && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '100px', minHeight: '40px' }}
                                                onClick={handleNotifyReview}
                                            >
                                                <FeatherIcon icon="bell" />
                                            </Button>
                                        )}
                                        {showAcceptButton && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '200px', minHeight: '40px' }}
                                                onClick={HandleAcceptButton}
                                            >
                                                Accept
                                            </Button>
                                        )}
                                        {hasChanges && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '200px', minHeight: '40px' }}
                                                onClick={handleChecker}
                                            >
                                                Save Changes
                                            </Button>
                                        )}

                                    </div>
                                </div>
                            </Row>

                            {/* DATES */}
                            <h6 className="text-muted fw-semibold mb-2">Dates</h6>
                            <Row>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Created at</Form.Label>
                                    <Form.Control
                                        value={
                                            formData.created_at
                                                ? new Date(formData.created_at).toLocaleString()
                                                : '-'
                                        }
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Updated at</Form.Label>
                                    <Form.Control
                                        name="updated_at"
                                        value={
                                            formData.updated_at
                                                ? new Date(formData.updated_at).toLocaleString()
                                                : '-'
                                        }
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Responded at</Form.Label>
                                    <Form.Control
                                        name="responded_at"
                                        value={
                                            formData.responded_at
                                                ? new Date(formData.responded_at).toLocaleString()
                                                : '-'
                                        }
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Resolved at</Form.Label>
                                    <Form.Control
                                        name="resolved_at"
                                        value={
                                            formData.resolved_at
                                                ? new Date(formData.resolved_at).toLocaleString()
                                                : '-'
                                        }
                                        disabled
                                    />
                                </Form.Group>
                            </Row>

                            {/* USER DETAILS */}
                            <h6 className="text-muted fw-semibold mt-4 mb-2">User Details</h6>
                            <Row>
                                <Col md={6} className="mb-2">
                                    <Form.Label>Created By</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="user" />
                                        </InputGroup.Text>
                                        <Form.Control name="created_by" value={formData.created_by ?? '-'} disabled />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="mb-2" style={{ position: 'relative' }}>
                                    <Form.Label>Employee</Form.Label>
                                    <InputGroup style={{ height: '43px' }}>
                                        {/* Icon trigger */}
                                        <div style={{ position: 'relative' }}>
                                            <InputGroup.Text
                                                style={{ cursor: 'pointer', height: '43px' }}
                                                onClick={() => setShowUserCard(prev => !prev)}
                                            >
                                                <FeatherIcon icon="user" />
                                            </InputGroup.Text>

                                            {/* Floating Card */}
                                            {showUserCard && formData.pmsticket_for && (() => {
                                                const selectedUser = allUser.find(u => u.user_name === formData.pmsticket_for);
                                                if (!selectedUser) return null;

                                                return (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50px',
                                                            left: 0,
                                                            zIndex: 1000,
                                                            minWidth: '220px',
                                                            padding: '12px',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '8px',
                                                            backgroundColor: '#fff',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', marginBottom: '6px' }}><strong style={{ minWidth: '70px' }}>Position:</strong> {selectedUser.emp_position}</div>
                                                        <div style={{ display: 'flex', marginBottom: '6px' }}><strong style={{ minWidth: '70px' }}>Email:</strong> {selectedUser.emp_email}</div>
                                                        <div style={{ display: 'flex', marginBottom: '6px' }}><strong style={{ minWidth: '70px' }}>Phone:</strong> {selectedUser.emp_phone}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Employee Select */}
                                        <div style={{ flex: 1 }}>
                                            <Select
                                                name="pmsticket_for"
                                                value={
                                                    allUser.find(u => u.user_name === formData.pmsticket_for)
                                                        ? {
                                                            value: formData.pmsticket_for,
                                                            label: `${allUser.find(u => u.user_name === formData.pmsticket_for).emp_FirstName} ${allUser.find(u => u.user_name === formData.pmsticket_for).emp_LastName}`
                                                        }
                                                        : formData.pmsticket_for
                                                            ? { value: formData.pmsticket_for, label: formData.pmsticket_for } // fallback if not in options
                                                            : null
                                                }
                                                onChange={option => {
                                                    handleChange({
                                                        target: {
                                                            name: 'pmsticket_for',
                                                            value: option ? option.value : ''
                                                        }
                                                    });
                                                    setShowUserCard(false);
                                                }}
                                                options={allUser.map(user => ({
                                                    value: user.user_name,
                                                    label: `${user.emp_FirstName} ${user.emp_LastName}`
                                                }))}
                                                isDisabled={!isEditable}
                                                isClearable
                                                placeholder="Select Employee"
                                                styles={customSelectStyles}
                                                classNamePrefix="react-select"
                                            />

                                        </div>
                                    </InputGroup>
                                </Col>


                                <Col md={6} className="mb-2">
                                    <Form.Label>Department</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="briefcase" />
                                        </InputGroup.Text>
                                        <Form.Control value={ticketForData.emp_department ?? '-'} disabled />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="mb-2">
                                    <Form.Label>Location</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="globe" />
                                        </InputGroup.Text>
                                        <Form.Control value={location ?? ''} disabled />
                                    </InputGroup>
                                </Col>
                                {/* XXX */}
                                <Col md={6} className="mb-2" style={{ position: 'relative' }}>
                                    <Form.Label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Assigned To</span>

                                    </Form.Label>

                                    <InputGroup style={{ height: '43px' }} >
                                        <div style={{ position: 'relative' }}>
                                            <InputGroup.Text>
                                                <FeatherIcon icon="user" />
                                            </InputGroup.Text>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Select

                                                name="assigned_to"
                                                placeholder="Select Employee"
                                                // value={`${hdUser.emp_FirstName} ${hdUser.emp_LastName}`}
                                                value={
                                                    allHDUser.find(u => u.user_name === formData.assigned_to)
                                                        ? {
                                                            value: formData.assigned_to,
                                                            label: `${allHDUser.find(u => u.user_name === formData.assigned_to).emp_FirstName} ${allHDUser.find(u => u.user_name === formData.assigned_to).emp_LastName}`
                                                        }
                                                        : null
                                                }

                                                onChange={option => {
                                                    handleChange({
                                                        target: {
                                                            name: 'assigned_to',
                                                            value: option ? option.value : ''
                                                        }
                                                    })
                                                }
                                                }
                                                options={allHDUser.map(u => ({
                                                    label: `${u.emp_FirstName} ${u.emp_LastName}`,
                                                    value: u.user_name,
                                                }))}
                                                isDisabled={!assignToState}
                                                isClearable
                                                styles={customSelectStyles}
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                    </InputGroup>
                                </Col>


                            </Row>

                            {/* TICKET INFO */}
                            <h6 className="text-muted fw-semibold mt-4 mb-2">Request Info</h6>
                            <Row>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>PMS Ticket ID</Form.Label>
                                    <Form.Control
                                        name="pmsticket_id"
                                        value={formData.pmsticket_id ?? ''}
                                        disabled
                                    />
                                </Form.Group>

                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="pms_status"
                                        value={formData.pms_status ?? ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!isEditable}
                                    >
                                        <option value="" hidden>-</option>
                                        <option value="open" >Open</option>
                                        <option value="assigned" hidden>Assigned</option>
                                        <option value="in-progress">In Progress</option>
                                        {/* <option value="escalate">Escalate</option> */}
                                        <option value="resolved">Resolve</option>
                                        <option value="closed" hidden>Close</option>
                                        <option value="re-opened" hidden>Re Open</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group as={Col} md={6} className="mb-3">
                                    <Form.Label>Tag ID</Form.Label>
                                    <CreatableSelect
                                        name="tag_id"
                                        options={options}
                                        styles={customSelectStyles}
                                        value={
                                            options.find(opt => opt.value === formData.tag_id) ||
                                            (formData.tag_id ? { value: formData.tag_id, label: formData.tag_id } : null)
                                        }
                                        onChange={(selectedOption) => {
                                            handleChange({
                                                target: {
                                                    name: 'tag_id',
                                                    value: selectedOption ? selectedOption.value : ''
                                                }
                                            });


                                        }}
                                        onCreateOption={(inputValue) => {
                                            setAssets(prev => [...prev, { tag_id: inputValue, pms_category: 'Custom', is_active: "1" }]);
                                            handleChange({
                                                target: {
                                                    name: 'tag_id',
                                                    value: inputValue
                                                }
                                            });
                                        }}
                                        isClearable
                                        isDisabled={!isEditable}
                                        placeholder="Type or select..."
                                        formatOptionLabel={(option, { context }) => (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
                                            >
                                                {/* Left: Tag ID */}
                                                <span>{option.label}</span>

                                                {/* Right: Category (only show for dropdown, not selected value) */}
                                                {context === 'menu' && (
                                                    <span
                                                        style={{
                                                            color: '#6c757d',
                                                            fontSize: '0.9em',
                                                            textAlign: 'right',
                                                            flexShrink: 0,
                                                            minWidth: '100px',
                                                        }}
                                                    >
                                                        {option.category}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                    />
                                </Form.Group>

                            </Row>

                            <h6 className="text-muted fw-semibold mt-4 mb-2">Description</h6>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    rows={7}
                                    name="Description"
                                    value={formData.description ?? ''}
                                    disabled
                                />
                            </Form.Group>
                        </Col>

                        {/* HELP DESK NOTES */}
                        <Col lg={4}>
                            <h6 className="text-muted fw-semibold mb-2">Helpdesk Notes</h6>
                            <Card className="shadow-sm border-0 h-900">
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <div
                                            style={{
                                                maxHeight: '600px',
                                                overflowY: 'auto',
                                                paddingRight: '5px',
                                            }}
                                        >
                                            {allnotes && allnotes.length > 0 ? (
                                                [...allnotes]
                                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                    .map((note, index) => (
                                                        <div
                                                            key={index}
                                                            className="mb-3 p-3 rounded-3 shadow-sm bg-body-tertiary border border-light-subtle"
                                                        >
                                                            <div
                                                                className="text-dark"
                                                                style={{
                                                                    fontSize: '0.95rem',
                                                                    whiteSpace: 'pre-wrap',
                                                                }}
                                                            >
                                                                {note.note}
                                                            </div>
                                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                                <small className="text-muted fst-italic">
                                                                    {notesofhduser[note.created_by] || note.created_by || 'Unknown'}
                                                                </small>
                                                                <small className="text-muted">
                                                                    {note.created_at
                                                                        ? new Date(
                                                                            note.created_at
                                                                        ).toLocaleString()
                                                                        : ''}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-muted fst-italic">
                                                    No notes available.
                                                </div>
                                            )}
                                        </div>
                                    </Form.Group>

                                    {hdnotesState && (
                                        <>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted">
                                                    Add a Note
                                                </Form.Label>
                                                {noteAlert && (
                                                    <Form.Label className="fw-semibold  ms-2 text-danger">
                                                        Unable to save empty note
                                                    </Form.Label>
                                                )}
                                                <Form.Control
                                                    as="textarea"
                                                    rows={5}
                                                    name="notes"
                                                    placeholder="Type your note here..."
                                                    value={notes || ''}
                                                    onChange={handleNoteChange}
                                                    disabled={!hdnotesState}
                                                    style={{ resize: 'none', fontSize: '0.95rem' }}
                                                />
                                            </Form.Group>


                                        </>
                                    )}

                                    {/* USER FEEDBACK */}
                                    <h6 className="text-muted fw-semibold mb-2 mt-2">User Feedback</h6>

                                    <Form.Group className="mb-2">
                                        <div
                                            style={{
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                                paddingRight: '5px',
                                            }}
                                        >
                                            {allfeedback && allfeedback.length > 0 ? (
                                                [...allfeedback]
                                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                    .map((feedback, index) => {
                                                        const scoreMap = {
                                                            1: { label: 'Very Dissatisfied', color: '#e74c3c' },
                                                            2: { label: 'Dissatisfied', color: '#e67e22' },
                                                            3: { label: 'Neutral', color: '#f1c40f' },
                                                            4: { label: 'Satisfied', color: '#2ecc71' },
                                                            5: { label: 'Very Satisfied', color: '#27ae60' },
                                                        };

                                                        const scoreInfo = scoreMap[feedback.score] || { label: 'No rating', color: '#7f8c8d' };

                                                        return (
                                                            <div
                                                                key={index}
                                                                className="mb-3 p-3 rounded-3 shadow-sm bg-body-tertiary border border-light-subtle"
                                                            >
                                                                <div
                                                                    className="text-dark"
                                                                    style={{
                                                                        fontSize: '0.95rem',
                                                                        whiteSpace: 'pre-wrap',
                                                                    }}
                                                                >
                                                                    {feedback.review}
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        fontSize: '0.70rem',
                                                                        color: scoreInfo.color,
                                                                        fontWeight: '600',
                                                                    }}
                                                                >
                                                                    {scoreInfo.label}
                                                                </div>

                                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                                    <small className="text-muted fst-italic">
                                                                        {feedbackuser[feedback.created_by] || feedback.created_by || 'Unknown'}
                                                                    </small>
                                                                    <small className="text-muted">
                                                                        {feedback.created_at
                                                                            ? new Date(feedback.created_at).toLocaleString()
                                                                            : ''}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-muted fst-italic">No notes available.</div>
                                            )}
                                        </div>
                                    </Form.Group>


                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/*HD Resolution Ticket */}
                    <Modal show={showCloseResolutionModal} onHide={() => setShowCloseResolutionModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Resolution: (Required)</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="userResolution">
                                <Form.Label>How were you able to resolve?</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Enter your troubleshooting steps here"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCloseResolutionModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={HandleResolution}
                                disabled={resolution.trim() === ''}
                            >
                                Confirm
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={lockModal} onHide={() => setLockModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Attention! </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="userResolution">
                                <Form.Label>{lockError}</Form.Label>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setLockModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setLockModal(false)}
                            >
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>


                    <Modal show={archiveState} onHide={() => setArchiveState(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Archive</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="userResolution">
                                <Form.Label>Are you sure you want to archive this ticket?</Form.Label>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setArchiveState(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => Archive()}
                            >
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={unarchiveState} onHide={() => setUnArchiveState(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Unarchive</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="userResolution">
                                <Form.Label>Are you sure you want to unarchive this ticket?</Form.Label>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setUnArchiveState(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => UnArchive()}
                            >
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal
                        show={showModal}
                        onHide={() => setShowModal(false)}
                        size="lg" // smaller than xl
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>{modalTitle}</Modal.Title>
                        </Modal.Header>

                        <Modal.Body
                            style={{
                                maxHeight: "50vh", // responsive height limit
                                overflowY: "auto", // scroll if content is long
                                padding: "20px",
                            }}
                        >
                            {modalContent}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Container >
            </AnimatedContent>
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)", // black transparent bg
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <Spinner animation="border" variant="light" />
                </div>
            )
            }

        </Container >
    );
}