import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', '98b'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '53a'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'ed2'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '90d'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '749'),
            routes: [
              {
                path: '/docs/category/frontend-itt',
                component: ComponentCreator('/docs/category/frontend-itt', 'b05'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/การเข้าสู่ระบบ-authentication',
                component: ComponentCreator('/docs/category/การเข้าสู่ระบบ-authentication', '2ce'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/นักศึกษา-student',
                component: ComponentCreator('/docs/category/นักศึกษา-student', 'ca8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/ผู้ดูแลระบบ-admin',
                component: ComponentCreator('/docs/category/ผู้ดูแลระบบ-admin', 'c2e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/พี่เลี้ยง-mentor',
                component: ComponentCreator('/docs/category/พี่เลี้ยง-mentor', 'c9c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/admin/',
                component: ComponentCreator('/docs/frontend-itt/admin/', 'e93'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/auth/login',
                component: ComponentCreator('/docs/frontend-itt/auth/login', 'b0a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/mentor/approval-history',
                component: ComponentCreator('/docs/frontend-itt/mentor/approval-history', '427'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/mentor/approvals',
                component: ComponentCreator('/docs/frontend-itt/mentor/approvals', '5f2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/mentor/remote-work',
                component: ComponentCreator('/docs/frontend-itt/mentor/remote-work', 'a52'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/mentor/students',
                component: ComponentCreator('/docs/frontend-itt/mentor/students', 'f8d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend-itt/student/',
                component: ComponentCreator('/docs/frontend-itt/student/', 'a02'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '89a'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
