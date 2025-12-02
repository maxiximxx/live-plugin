// plugin/components/live-chat/index.js
import * as alivc from '../../lib/alivc-im'
import { getToken, sendMessage } from '../../service/index'
import { getUUID } from '../../utils/common'
import { showToast } from '../../utils/interactive'

const { ImEngine, ImLogLevel } = alivc

// IM SDK 初始化配置
const imConfig = {
  deviceId: getUUID(), // 选填
  appId: '', // 必须：从阿里云控制台获取
  appSign: '', // 必须：从阿里云控制台获取
  logLevel: ImLogLevel.ERROR, // 日志输出等级
  wasmPath: '/lib/alivc-im.wasm.br', // wasm文件路径
}

Component({
  /*  */
  properties: {
    // 必须配置项：群组ID
    groupId: {
      type: String,
      value: '',
    },
    // 必须配置项：教室ID
    classId: {
      type: String,
      value: '',
    },
    // 必须配置项：直播间ID
    liveRoomId: {
      type: String,
      value: '',
    },
    // 必须配置项：用户身份
    identity: {
      type: String,
      value: '',
    },
    // 必须配置项：用户信息
    userInfo: {
      type: Object,
      value: null,
    },
    // 可选：最大消息数量
    maxMessages: {
      type: Number,
      value: 200,
    },
  },

  data: {
    isInitialized: false, // im是否初始化
    isConnected: false, // im是否连接成功
    isLoggedIn: false, // im是否登录

    messageList: [], // 消息列表
    inputValue: '', // 输入框内容
    scrollTop: 0, // 消息容器纵向滚动
  },

  lifetimes: {
    created: function () {
      wx.onAppShow = () => {}
      wx.onAppHide = () => {}
    },
    attached: async function () {
      if (this.properties.groupId && this.properties.userInfo.user_id) {
        await this.getToken()
        this.initializeIM()
      }
    },
    detached: function () {
      this.cleanup()
    },
  },

  methods: {
    // 获取IMConfig
    getToken: async function () {
      const res = await getToken({
        user_id: this.properties.userInfo.user_id,
        device_type: 'web',
        device_id: getUUID(), // 这个是uuid
        im_server: ['aliyun_new'],
      })
      if (res && res.aliyun_new_im) {
        const { app_id, app_sign, app_token, auth } = res.aliyun_new_im || {}
        imConfig.appId = app_id
        imConfig.appSign = app_sign
        this.authInfo = {
          ...auth,
          token: app_token,
        }
      }
    },
    // 获取IM引擎实例
    getIMEngine: function () {
      try {
        if (ImEngine) {
          return ImEngine.createEngine()
        }
      } catch (error) {
        console.error('获取IM引擎时发生异常:', error)
      }
    },
    // 初始化IM系统
    initializeIM: async function () {
      if (!imConfig.appId || !imConfig.appSign) {
        console.error('IM配置不完整: 缺少appId或appSign')
        return
      }

      // 获取IM引擎实例
      const imEngine = this.getIMEngine()
      if (!imEngine) {
        console.error('创建IM引擎失败')
        return
      }

      try {
        // 调用SDK的init方法进行初始化
        const { deviceId, appId, appSign } = imConfig
        await imEngine.init({
          deviceId,
          appId,
          appSign,
          locateFile: (url) => {
            if (url.endsWith('.wasm')) {
              return imConfig.wasmPath
            }
            return url
          },
        })
        console.log('IM SDK初始化成功')
        this.setData({
          isInitialized: true,
        })
        // 获取IM实例
        this.imEngine = imEngine
        // 获取群组管理器
        this.groupManager = await imEngine.getGroupManager()
        // 获取消息管理器
        this.messageManager = await imEngine.getMessageManager()
        // 设置事件监听器
        this.setupImEngineListeners()
        // 登录
        this.login()
      } catch (error) {
        console.error('IM SDK初始化失败:', error)
      }
    },

    // 设置imEngine监听
    setupImEngineListeners: function () {

      // 连接成功事件
      this.imEngine.on('connectsuccess', () => {
        console.log('IM连接成功')
        this.setData({ isConnected: true })
        this.triggerEvent('connectsuccess')
      })

      // 连接错误事件
      this.imEngine.on('connectfailed', (error) => {
        console.error('IM连接错误:', error)
        this.setData({ isConnected: false })
        this.triggerEvent('connectfailed', { error })
      })

      // 连接断开事件
      this.imEngine.on('disconnect', () => {
        console.log('IM连接断开')
        this.setData({ isConnected: false })
        this.triggerEvent('disconnect')
      })

      // Token过期事件
      this.imEngine.on('tokenexpired', (callback) => {
        console.log('IM Token已过期')
        this.handleTokenExpired(callback)
      })
      console.log('imEngine监听设置完成')

      // 有人进入或离开群组
      this.groupManager.on('memberdatachange', (data) => {
        const { groupId, onlineCount, pv, isBigGroup, joinUsers, leaveUsers } = data
        console.log(
          `group ${groupId} member change, onlineCount: ${onlineCount}, pv: ${pv}, joinUsers: ${joinUsers
            .map((u) => u.userId)
            .join(',')}, leaveUsers: ${leaveUsers.map((u) => u.userId).join('')}`,
        )
      })
      console.log('groupManager监听设置完成')

      // 收到群聊消息
      this.messageManager.on('recvgroupmessage', (msg, groupId) => {
        console.log('收到群聊消息', msg, groupId)
        this.handleIncomingMessage(msg)
      })
      console.log('messageManager监听设置完成')
    },

    // Token过期处理
    handleTokenExpired: function (callback) {
      this.triggerEvent('tokenexpired', {
        reLogin: (newAuth) => {
          callback && callback(null, newAuth)
        },
      })
    },

    // 处理接收到的实时消息
    handleIncomingMessage: function (data) {
      // 过滤非当前群组的消息
      if (data.groupId !== this.properties.groupId) {
        return
      }
      const message = this.formatMessage(data)
      this.addMessageToList(message)
    },

    // 登录IM系统
    login: async function () {
      if (!this.data.isInitialized) {
        console.error('IM系统未初始化')
        return
      }
      try {
        const authInfo = this.authInfo
        if (!authInfo) {
          console.error('没有认证信息')
          return
        }

        const { userInfo } = this.properties
        if (!userInfo.user_id) {
          console.error('用户信息不完整，缺少userId')
          return
        }
        await this.imEngine.login({
          user: {
            userId: userInfo.user_id,
            userExtension: JSON.stringify({
              avatar: userInfo.avatar,
              nickName: userInfo.user_name,
            }),
          },
          userAuth: {
            timestamp: authInfo.timestamp,
            nonce: authInfo.nonce,
            token: authInfo.token,
            role: authInfo.role,
          },
        })

        console.log('IM登录成功')
        this.setData({ isLoggedIn: true })
        // 自动进入群组
        this.enterGroup()
      } catch (error) {
        console.error('IM登录失败:', error)
      }
    },

    // 进入群组
    enterGroup: async function () {
      const groupId = this.properties.groupId
      if (!groupId) {
        console.error('群组ID不能为空')
        return
      }
      try {
        await this.groupManager.joinGroup(groupId)
        console.log(`进入群组成功: ${groupId}`)
        this.triggerEvent('entergroupsuccess', { groupId })
      } catch (error) {
        console.error('进入群组失败:', error)
        this.triggerEvent('entergroupfailed', {
          groupId,
          error: error,
        })
      }
    },

    // 发送消息
    onSendMessage: async function () {
      const content = (this.data.inputValue || '').trim()
      if (!content) {
        showToast('输入内容为空，请重新输入')
        return
      }
      try {
        // 发送聊天消息（到IM）
        this.messageManager.sendGroupMessage({
          groupId: this.properties.groupId,
          data: JSON.stringify({ content }),
          type: 88888,
        })
        // 发送聊天消息（到后端）
        sendMessage({
          content,
          identity: this.properties.identity,
          liveRoomId: this.properties.liveRoomId,
          userId: this.properties.userInfo.user_id,
          name: this.properties.userInfo.user_name,
        })
      } catch (error) {
        console.error('发送消息失败:', error)
      }
      // 清空输入框
      this.setData({ inputValue: '' })
    },

    // 添加消息到列表
    addMessageToList: function (message) {
      const messageList = [...this.data.messageList, message]
      const { maxMessages } = this.properties
      this.setData(
        {
          // 判断当前消息列表是否超过最大限制  保留最新的消息
          messageList: messageList.slice(-maxMessages),
        },
        this.scrollToBottom,
      )
    },

    // 自动滚动到底部
    scrollToBottom: function () {
      this.setData({
        scrollTop: 999999, // 设置一个非常大的值
      })
    },

    // 格式化消息
    formatMessage: function (data) {
      let userExt = {}
      userExt = data.sender.userExtension ? JSON.parse(data.sender.userExtension) : {}

      const content = this.parseMessageContent(data)
      const isOwn = data.sender.userId === this.properties.userInfo.user_id

      return {
        messageId: data.messageId,
        messageType: data.type,
        content,
        nickName: userExt.nickName || '未知用户',
        avatar: userExt.avatar,
        isOwn,
        timestamp: data.timestamp || Date.now(),
      }
    },

    // 解析消息内容
    parseMessageContent: function (message) {
      if (message.data) {
        const data = JSON.parse(message.data)
        return data.content
      }
    },

    // 清理资源
    cleanup: async function () {
      const { isLoggedIn, isInitialized } = this.data

      if (this.groupManager && isInitialized) {
        try {
          // 离开群组
          if (isLoggedIn && this.properties.groupId) {
            await this.groupManager.leaveGroup(this.properties.groupId)
          }

          // 注销登录
          if (isLoggedIn) {
            await this.imEngine.logout()
          }

          // 登出后如无需再进行登录，可以进行反初始化操作，SDK会对底层操作实例进行释放。
          await this.ImEngine.unInit()

          console.log('IM资源清理完成')
        } catch (error) {
          console.error('清理IM资源时发生错误:', error)
        }
      }
      // 移除所有监听
      this.groupManager.removeAllListeners()
      this.messageManager.removeAllListeners()
    },
  },
})
