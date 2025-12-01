// plugin/components/live-chat/index.js
import * as alivc from '../../lib/alivc-im'
import { showToast } from '../../utils/interactive'

const { ImEngine, ImLogLevel } = alivc

// IM SDK 初始化配置
const imConfig = {
  deviceId: '1', // 选填
  appId: '2', // 必须：从阿里云控制台获取
  appSign:'3', // 必须：从阿里云控制台获取
  logLevel: ImLogLevel.ERROR, // 日志输出等级
  wasmPath: '/lib/alivc-im.wasm.br', // wasm文件路径
}

Component({
  /*  */
  properties: {
    // 必须配置项：群组ID（直播间ID）
    groupId: {
      type: String,
      value: '',
    },
    // 必须配置项：用户信息
    userInfo: {
      type: Object,
      value: null,
      observer: function (newVal) {
        if (newVal && newVal.userId) {
          this.setData({ currentUser: newVal })
        }
      },
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

    // 当前用户
    currentUser: {
      userId: '',
      nickName: '用户',
      avatar: '',
    },
  },

  lifetimes: {
    created: function () {
      wx.onAppShow = () => {}
      wx.onAppHide = () => {}
    },
    attached: function () {
      this.initializeIM()
    },
    detached: function () {
      this.cleanup()
    },
  },

  methods: {
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
        await imEngine.init({
          deviceId: imConfig.deviceId,
          appId: imConfig.appId,
          appSign: imConfig.appSign,
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
        this.imEngine = imEngine
        // 获取群组管理器
        this.groupManager = await imEngine.getGroupManager()
        // 获取消息管理器
        this.messageManager = await imEngine.getMessageManager()
        // 设置事件监听器
        this.setupImEngineListeners()
      } catch (error) {
        console.error('IM SDK初始化失败:', error)
      }
    },

    // 设置imEngine监听
    setupImEngineListeners: function () {
			// 连接中
			this.imEngine.on("connecting", () => {
				console.log("connecting");
			});

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
        const {
          groupId,
          onlineCount,
          pv,
          isBigGroup,
          joinUsers,
          leaveUsers,
        } = data
        console.log(
          `group ${groupId} member change, onlineCount: ${onlineCount}, pv: ${pv}, joinUsers: ${joinUsers
            .map((u) => u.userId)
            .join(',')}, leaveUsers: ${leaveUsers
            .map((u) => u.userId)
            .join('')}`
        )
      })
      console.log('groupManager监听设置完成')

      // 收到群聊消息
      this.messageManager.on('recvgroupmessage', (msg, groupId) => {
        console.log('收到群聊消息', msg, groupId)
        this.handleIncomingMessage({ msg, groupId })
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
    login: async function (authInfo) {
      if (!this.data.isInitialized) {
        console.error('IM系统未初始化')
        return
      }

      try {
        if (!authInfo || !authInfo.token) {
          console.error('认证信息不完整，缺少token')
          return
        }

        const { currentUser } = this.data

        if (!currentUser.userId) {
          console.error('用户信息不完整，缺少userId')
          return
        }

        await this.imEngine.login({
          user: {
            userId: currentUser.userId,
            userExtension: JSON.stringify({
              avatar: currentUser.avatar || '',
              nickName: currentUser.nickName || '用户',
            }),
          },
          userAuth: {
            timestamp: authInfo.timestamp,
            nonce: authInfo.nonce,
            token: authInfo.token,
            role: authInfo.role || 'user',
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
      const targetGroupId = this.properties.groupId
      if (!targetGroupId) {
        console.error('群组ID不能为空')
        return
      }
      try {
        await this.groupManager.joinGroup(targetGroupId)
        console.log(`进入群组成功: ${targetGroupId}`)
        this.triggerEvent('entergroupsuccess', { groupId: targetGroupId })
      } catch (error) {
        console.error('进入群组失败:', error)
        this.triggerEvent('entergroupfailed', {
          groupId: targetGroupId,
          error: error,
        })
      }
    },

    // 发送消息
    onSendMessage: async function () {
      const content = (this.data.inputValue || '').trim()
      if (!content) {
        showToast('输入内容为空， 请重新输入')
        return
      }

      if (!this.properties.groupId) {
        console.error('未设置直播间ID')
        return
      }

      try {
        await this.essageManager.sendGroupMessage({
          groupId: this.properties.groupId,
          data: JSON.stringify({ content }),
          type: 88888,
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
        this.scrollToBottom
      )
    },

    // 自动滚动到底部
    scrollToBottom: function () {
      this.setData({
        scrollTop: 999999,
      })
    },

    // 格式化消息
    formatMessage: function (rawMessage) {
      let userExt = {}
      userExt = rawMessage.senderUserExtension
        ? JSON.parse(rawMessage.senderUserExtension)
        : {}

      const messageType = rawMessage.type || 'text'
      const content = this.parseMessageContent(rawMessage)
      const isOwn = rawMessage.senderId === this.data.currentUser.userId

      return {
        messageId:
          rawMessage.messageId ||
          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageType: messageType,
        content: content,
        nickName: userExt.nickName || rawMessage.senderId || '未知用户',
        avatar: userExt.avatar || '',
        isOwn: isOwn,
        rawData: rawMessage,
        timestamp: rawMessage.timestamp || Date.now(),
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
