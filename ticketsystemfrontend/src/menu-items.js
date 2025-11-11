const empInfo = JSON.parse(localStorage.getItem('user')) || {};
const empTier = empInfo.emp_tier;
const empRole = empInfo.emp_role;

const menuItems = {
  items: [

    //tickets
    {
      id: 'tickets',
      title: 'Tickets',
      type: 'group',
      icon: 'icon-pages',
      children: [
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
      ]
    },
    {
      id: 'PMS',
      title: 'PMS',
      type: 'group',
      icon: 'icon-pages',
      children: [
        {
          id: 'create-pms-ticket',
          title: 'Create PMS Ticket',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'construction',
          url: '/create-pms-user',
          target: true
        },
        {
          id: 'pms',
          title: 'PMS',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'settings_applications',
          url: '/pms',
          target: true
        },
      ]
    },
    //Tools
    {
      id: 'tools',
      title: 'Tools',
      type: 'group',
      icon: 'icon-ui',
      children: [
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

    //Pages
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
          title: 'Support Reports',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'bar_chart',
          url: '/reports',
          target: true
        },
        {
          id: 'pmsreports',
          title: 'PMS Reports',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'analytics',
          url: '/pmsreport',
          target: true
        },
      ]
    },
  ]
};

if (empTier === 'user' && (empRole === 'user' || empRole === 'admin')) {
  // Remove the Tools group entirely
  menuItems.items = menuItems.items.filter(item => item.id !== 'tools');

  // Optionally, also hide Reports for these users
  const pages = menuItems.items.find(item => item.id === 'pages');
  if (pages) {
    pages.children = pages.children.filter(child => child.id !== 'reports');
    pages.children = pages.children.filter(child => child.id !== 'pmsreports');
  }
}

export default menuItems;

