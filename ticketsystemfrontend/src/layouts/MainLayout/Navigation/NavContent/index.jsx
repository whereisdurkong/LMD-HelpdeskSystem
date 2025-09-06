import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// react-bootstrap
import { Card, ListGroup } from 'react-bootstrap';

// project imports
import NavGroup from './NavGroup';
import { ConfigContext } from 'contexts/ConfigContext';

// third party
import SimpleBar from 'simplebar-react';

// assets
import logo from 'assets/images/logo.svg';
import newLogo from 'assets/images/new-logo.png';
import lmdblack from 'assets/images/lmdlogo/lmd-black.png';

// -----------------------|| NAV CONTENT ||-----------------------//

export default function NavContent({ navigation, activeNav }) {
  const configContext = useContext(ConfigContext);
  const { collapseLayout } = configContext.state;

  const navItems = navigation.map((item) => {
    if (item.type === 'group') {
      return <NavGroup group={item} key={`nav-group-${item.id}`} />;
    }
    return false;
  });

  const navContentNode = collapseLayout ? (
    <ListGroup variant="flush" as="ul" bsPrefix=" " className="pc-navbar">
      {navItems}
    </ListGroup>
  ) : (
    <SimpleBar style={{ height: 'calc(100vh - 70px)' }}>
      <ListGroup variant="flush" as="ul" bsPrefix=" " className="pc-navbar">
        {navItems}
      </ListGroup>
    </SimpleBar>
  );

  const mHeader = (
    <div className="m-header" style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', padding: '38px 0' }}>
      <Link to="/dashboard" className="b-brand">
        <img
          src={lmdblack}
          alt="logo"
          style={{ width: '200px', height: 'auto' }}
        />
      </Link>
    </div>
  );

  return (
    <>
      {mHeader}
      <div className="navbar-content next-scroll">{navContentNode}</div>
    </>
  );
}

NavContent.propTypes = {
  navigation: PropTypes.any,
  activeNav: PropTypes.any
};
