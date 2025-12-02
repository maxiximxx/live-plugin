import {
  getClass,
  getLiveRoomDetail,
  getSdkParam,
  getUserInfoAndValid,
  joinClass,
  userLogin,
} from '../../service/index'

// plugin/components/live-plugin/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 教室id 必传
    classId: {
      type: String,
      value: '77f413bf52034b8d9dd7d924ca5cdac1',
    },
    // 直播间id 必传
    liveRoomId: {
      type: String,
      value: '1995453337989939201',
    },
    // 用户身份 必传
    identity: {
      type: String,
      value: '1',
    },
    // 用户token
    token: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    liveSrc: '', // 直播流地址
    liveDesc: '', // 直播介绍
    fileList: [], // 直播文档
    groupId: '', // 群聊ID
    userInfo: {}, // 用户信息
    tabs: [{ title: '直播介绍' }, { title: '文档' }, { title: '聊天' }],
    activeIndex: 0, // 当前激活的tab索引
    loadIndexes: [0], // 加载过的tab索引
  },

  lifetimes: {
    async attached() {
      wx.setStorageSync('API_HOST', 'https://testwaibao.cqjjb.cn')
      wx.setStorageSync(
        'ACCOUNT_TOKEN',
        'jjb-saas-auth:oauth:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJjbGllbnRJZFwiOlwiV0hBTUhcIixcImFjY291bnRJZFwiOjE5ODA1MjMxOTQ3NDg3MDY4MTYsXCJ1c2VyVHlwZUVudW1cIjpcIlBFUlNPTlwiLFwidXNlcklkXCI6MTk4MDUyMzE5MzcwNjk3MTEzNixcInRlbmFudElkXCI6MTk2NDYxMDk0NDY0NTE0NDU3NixcInRlbmFudFBhcmVudElkc1wiOlwiMCwxOTY0NjEwOTQ0NjQ1MTQ0NTc2XCIsXCJuYW1lXCI6XCLpmYjlvLpcIixcImFjY2Vzc1RpY2tldFwiOlwiWUFEekN5UDQ2VVljYVpBY0JEd2dUVWlySGVxOUpqbGFWRDVZS0Z4d3RqbUlhRng5Q1NjMUdKRFljdjBtXCIsXCJyZWZyZXNoVGlja2V0XCI6XCJMZHc0NHp6U25XbkNEYWxiS2hYUmVVekRENk5ZdjM0c2ZrNGlEd0U0N1FtVU5EUGFYNHNUaW9mVEFyc0FcIixcImV4cGlyZUluXCI6OTAwMDAwLFwicmVmcmVzaEV4cGlyZXNJblwiOjkwMDAwMCxcInNjb3Blc1wiOltdLFwicnBjVHlwZUVudW1cIjpcIkhUVFBcIixcImJpbmRNb2JpbGVTaWduXCI6XCJUUlVFXCJ9IiwiaXNzIjoicHJvLXNlcnZlciIsImV4cCI6MTc2NTQ4NjQ3Nn0.CDuldXXNKdhbdnNYRfZ5_ZKgAEpUbnK7jaqVYbBWP0Y',
      )
      this.init()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化
    init: async function () {
      await this.getUserInfo()
      await this.userLogin()
      // this.joinClass()
      this.getClass()
      this.getLiveRoomDetail()
      // this.getSdkParam()
    },

    // 获取用户信息
    getUserInfo: async function () {
      const res = await getUserInfoAndValid({
        classId: this.properties.classId,
        identity: this.properties.identity,
        token: this.properties.token,
      })
      if (res) {
        // 设置用户信息
        this.userInfo = res
        this.setData({
          userInfo: res,
        })
      }
    },

    // 登录
    userLogin: async function () {
      const res = await userLogin({
        username: this.userInfo.user_name,
        password: this.userInfo.user_name,
      })
    },

    // 加入直播间
    joinClass: async function () {
      if (this.userInfo) {
        const res = await joinClass({
          ...this.userInfo,
          class_id: this.properties.classId,
          watch_source_enum: 'MINI',
          identity: 0,
          user_avatar: '',
        })
      }
    },

    // 获取直播连接
    getClass: async function () {
      const res = await getClass({
        id: this.properties.classId,
        user_id: this.userInfo.user_id,
      })
      const liveSrc = res?.link_info?.rtc_pull_url
      const groupId = res?.aliyun_id
      if (groupId && liveSrc) {
        this.setData({
          liveSrc,
          groupId,
        })
      }
      return res
    },

    // 获取直播间详情
    getLiveRoomDetail: async function () {
      const res = await getLiveRoomDetail(this.properties.liveRoomId)
      if (res) {
        this.setData({
          liveDesc: res.liveIntroduce,
        })
      }
    },

    // 获取sdk接入参数
    getSdkParam: async function () {
      const res = await getSdkParam({
        liveRoomId: this.properties.liveRoomId,
      })
      if (res?.sdkUrl) {
        this.setData({
          src: res.sdkUrl,
        })
      }
    },

    // tab切换
    onTabChange(e) {
      console.log('切换到Tab:', e.detail.index, this.data.loadIndexes)
      const index = e.detail.index
      const loadIndexes = [...new Set([...this.data.loadIndexes, index])]
      this.setData({
        activeIndex: index,
        loadIndexes
      })
    },

    onStateChange(e) {
      console.log('播放状态:', e.detail)
    },

    onPlayerError(e) {
      console.error('播放器错误:', e.detail)
      wx.showToast({
        title: '播放出错',
        icon: 'none',
      })
    },

    onTokenExpired: function (e) {
      console.log('SS', e.detail)
    },
  },
})
