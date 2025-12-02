const plugin = requirePlugin('live-plugin')
Page({
  data: {
    classId: '77f413bf52034b8d9dd7d924ca5cdac1', // 教室id
    liveRoomId: '1995453337989939201', // 直播间id
    identity: '1', // 用户身份 1(学生) 2(助教) 3(讲师)
    account: '', // 用户账号
    token: '', //用户token
    planId: '', // 计划ID 回放功能判断
  },

  onLoad() {
    plugin.setApiHost('https://testwaibao.cqjjb.cn')
    plugin.setAccountToken(
      'jjb-saas-auth:oauth:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJjbGllbnRJZFwiOlwiV0hBTUhcIixcImFjY291bnRJZFwiOjE5ODA1MjMxOTQ3NDg3MDY4MTYsXCJ1c2VyVHlwZUVudW1cIjpcIlBFUlNPTlwiLFwidXNlcklkXCI6MTk4MDUyMzE5MzcwNjk3MTEzNixcInRlbmFudElkXCI6MTk2NDYxMDk0NDY0NTE0NDU3NixcInRlbmFudFBhcmVudElkc1wiOlwiMCwxOTY0NjEwOTQ0NjQ1MTQ0NTc2XCIsXCJuYW1lXCI6XCLpmYjlvLpcIixcImFjY2Vzc1RpY2tldFwiOlwiWUFEekN5UDQ2VVljYVpBY0JEd2dUVWlySGVxOUpqbGFWRDVZS0Z4d3RqbUlhRng5Q1NjMUdKRFljdjBtXCIsXCJyZWZyZXNoVGlja2V0XCI6XCJMZHc0NHp6U25XbkNEYWxiS2hYUmVVekRENk5ZdjM0c2ZrNGlEd0U0N1FtVU5EUGFYNHNUaW9mVEFyc0FcIixcImV4cGlyZUluXCI6OTAwMDAwLFwicmVmcmVzaEV4cGlyZXNJblwiOjkwMDAwMCxcInNjb3Blc1wiOltdLFwicnBjVHlwZUVudW1cIjpcIkhUVFBcIixcImJpbmRNb2JpbGVTaWduXCI6XCJUUlVFXCJ9IiwiaXNzIjoicHJvLXNlcnZlciIsImV4cCI6MTc2NTQ4NjQ3Nn0.CDuldXXNKdhbdnNYRfZ5_ZKgAEpUbnK7jaqVYbBWP0Y',
    )
  },
})
