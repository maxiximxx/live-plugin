import {
  getClass,
  getLiveRoomDetail,
  getRepayDetail,
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
      value: '',
    },
    // 直播间id 必传
    liveRoomId: {
      type: String,
      value: '',
    },
    // 用户身份 必传
    identity: {
      type: String,
      value: '',
    },
    // 用户账号 必传
    account: {
      type: String,
      value: '',
    },
    // 用户token 必传
    token: {
      type: String,
      value: '',
    },
    // 计划ID 回放功能判断
    planId: {
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
    groupId: '', // 群聊ID
    userInfo: {}, // 用户信息
    isReplay: false, // 是否回放
    tabs: [{ title: '直播介绍' }, { title: '文档' }, { title: '聊天' }],
    activeIndex: 0, // 当前激活的tab索引
    loadIndexes: [0], // 加载过的tab索引
  },

  lifetimes: {
    attached: function () {
      const token = wx.getStorageSync('ACCOUNT_TOKEN')
      const apiHost = wx.getStorageSync('API_HOST')
      // 检查Token是否存在
      if (!token) {
        throw new Error('插件API调用失败：未找到AccountToken。请确保在使用插件前调用setAccountToken方法。')
      }
      // 检查apiHost是否存在
      if (!apiHost) {
        throw new Error('插件API调用失败：未找到APIHOST。请确保在使用插件前调用setApiHost方法。')
      }
      this.init()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化  需要主程序先设置accounttoken才能调用后续接口
    init: async function () {
      await this.getUserInfo()
      await this.userLogin()
      this.getLiveRoomDetail()
      // this.getSdkParam()
    },

    // 获取用户信息
    getUserInfo: async function () {
      const res = await getUserInfoAndValid({
        classId: this.properties.classId,
        identity: this.properties.identity,
        token: this.properties.token,
        account: this.properties.account,
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
      await userLogin({
        username: this.userInfo.user_name,
        password: this.userInfo.user_name,
      })
    },

    // 获取直播间详情
    getLiveRoomDetail: async function () {
      const res = await getLiveRoomDetail(this.properties.liveRoomId)
      if (res) {
        const isReplay = res.status == 2 && !!this.properties.planId // 是否回放
        this.setData({
          liveDesc: res.liveIntroduce || '',
          isReplay,
        })
        if (isReplay) {
          // 如果是回放  则获取回放连接
          this.getRepayDetail()
        } else {
          // 否则获取直播链接
          this.joinClass()
          this.getClass()
        }
      }
    },

    // 加入直播间
    joinClass: async function () {
      if (this.userInfo) {
        await joinClass({
          ...this.userInfo,
          class_id: this.properties.classId,
          watch_source_enum: 'MINI',
          identity: this.properties.identity,
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
      const srcList = res?.link_info?.cdn_pull_info
      // 微信live-player仅支持rtmp、flv格式
      const liveSrc = srcList?.rtmp_url || srcList?.flv_url
      const groupId = res?.aliyun_id
      if (groupId && liveSrc) {
        this.setData({
          liveSrc,
          groupId,
        })
      }
      return res
    },

    // 获取回放连接
    getRepayDetail: async function () {
      const res = await getRepayDetail(this.properties.liveRoomId)
      if (Array.isArray(res)) {
        this.setData({
          liveSrc: res[0]?.videoUrl,
        })
      }
    },

    // 获取sdk接入参数
    getSdkParam: async function () {
      const res = await getSdkParam({
        liveRoomId: this.properties.liveRoomId,
      })
      if (res?.sdkUrl) {
        // 不知道干嘛
      }
    },

    // tab切换
    onTabChange(e) {
      const index = e.detail.index
      const loadIndexes = [...new Set([...this.data.loadIndexes, index])]
      this.setData({
        activeIndex: index,
        loadIndexes,
      })
    },

    // 播放器状态监听
    onStateChange(e) {
      console.log('播放状态:', e.detail)
    },

    // 播放器错误监听
    onPlayerError(e) {
      console.error('播放器错误:', e.detail)
    },
  },
})
