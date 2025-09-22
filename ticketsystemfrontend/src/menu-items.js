const empInfo = JSON.parse(localStorage.getItem('user')) || {};
const empTier = empInfo.emp_tier;
const empRole = empInfo.emp_role;

const menuItems = {
  items: [
    {
      id: 'tools',
      title: 'Tools',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'register',
          title: 'Register',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'person_add_alt_1',
          url: '/register',
          target: true
        },
        {
          id: 'create-ticket',
          title: 'Create Ticket',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'add_box',
          url: '/create-ticket',
          target: true
        },
        {
          id: 'tickets',
          title: 'Tickets',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'all_inbox',
          url: '/tickets',
          target: true
        },
        {
          id: 'all-users',
          title: 'Users',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'groups',
          url: '/users',
          target: true
        },
        {
          id: 'assets',
          title: 'Assets',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'desktop_windows',
          url: '/assets',
          target: true
        },

      ]
    },
    {
      id: 'pages',
      title: 'Pages',
      type: 'group',
      icon: 'icon-pages',
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'home',
          url: '/dashboard'
        },
        {
          id: 'announcements',
          title: 'Announcements',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'announcements',
          url: '/announcements',
          target: true
        },
        {
          id: 'knowledgebase',
          title: 'Knowledge base',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'book',
          url: '/knowledgebase',
          target: true
        },
        {
          id: 'reports',
          title: 'Reports',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'bar_chart',
          url: '/reports',
          target: true
        },

      ]
    },
  ]
};

if (empTier === 'user' && empRole === 'user') {
  const tools = menuItems.items.find(item => item.id === 'tools');

  if (tools) {
    tools.children = tools.children.filter(
      child => child.id !== 'register' && child.id !== 'assets' && child.id !== 'all-users'
    );
  }

  const pages = menuItems.items.find(item => item.id === 'pages');
  if (pages) {
    pages.children = pages.children.filter(child => child.id !== 'reports');
  }
}

if (empTier === 'user' && empRole === 'admin') {
  const tools = menuItems.items.find(item => item.id === 'tools');
  if (tools) {
    tools.children = tools.children.filter(
      child => child.id !== 'register' &&
        child.id !== 'assets' && child.id !== 'all-users'
    );
  }


  const pages = menuItems.items.find(item => item.id === 'pages');
  if (pages) {
    pages.children = pages.children.filter(child => child.id !== 'reports');
  }
}


export default menuItems;
