export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/calendar/index',
    'pages/family/index',
    'pages/memory/index',
    'pages/profile/index',
    'pages/event/create/index',
    'pages/event/detail/index',
    'pages/family/create/index',
    'pages/family/join/index',
    'pages/family/invite/index',
    'pages/notification/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '家庭日历',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    custom: true,
    color: '#868E96',
    selectedColor: '#339AF0',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/calendar/index',
        text: '日历',
      },
      {
        pagePath: 'pages/family/index',
        text: '家庭',
      },
      {
        pagePath: 'pages/memory/index',
        text: '回忆',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
});
