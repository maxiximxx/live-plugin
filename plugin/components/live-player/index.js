// plugin/components/live-player/live-player.js
Component({
  properties: {
    // 阿里云直播流地址
    src: {
      type: String,
      value: '',
    },
    // 自动播放
    autoplay: {
      type: Boolean,
      value: true,
    },
    // 是否静音
    muted: {
      type: Boolean,
      value: false,
    },
    // 画面方向：vertical（竖直）, horizontal（水平）
    orientation: {
      type: String,
      value: 'vertical',
    },
    // 填充模式：contain, fillCrop
    objectFit: {
      type: String,
      value: 'contain',
    },
    // 播放模式：live（直播）, RTC（实时通话，时延更低）
    mode: {
      type: String,
      value: 'live',
    },
    // 是否显示默认控制条
    showControl: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    playing: true, // 播放状态
    errorMessage: '', // 错误信息
    minCache: 1, // 最小缓冲区，单位s
    maxCache: 3, // 最大缓冲区，单位s
  },

  lifetimes: {
    attached: function () {
      // 组件初始化播放器
      this._getPlayerContext()
    },
    detached: function () {
      // 组件销毁时停止播放
      this.stop()
    },
  },

  observers: {
    errorMessage: (errorMessage) => {
      console.log(errorMessage)
    },
  },

  methods: {
    // 初始化播放器上下文
    _getPlayerContext() {
      if (!this.player) {
        this.player = wx.createLivePlayerContext('livePlayer', this)
      }
    },

    // 播放状态变化事件
    onStateChange: function (e) {
      const code = e.detail.code
      console.log('播放状态变化:', code)

      // 根据状态码更新UI
      const stateMap = {
        2001: '已连接服务器',
        2002: '开始拉流',
        2004: '视频播放开始',
        2007: '视频播放Loading',
        '-2301': '网络断连，重连失败',
      }

      if (code === 2004) {
        this.setData({ playing: true, errorMessage: '' })
      } else if (code === -2301) {
        this.setData({ errorMessage: '网络连接失败，请检查网络' })
      }

      this.triggerEvent('statechange', e.detail)
    },

    // 错误处理
    onError: function (e) {
      console.error('播放器错误:', e.detail)
      const errorMsg = `播放错误: ${e.detail.errMsg}`
      this.setData({ errorMessage: errorMsg })
      this.triggerEvent('error', e.detail)
    },

    // 全屏变化事件
    onFullscreenChange: function (e) {
      this.triggerEvent('fullscreenchange', e.detail)
    },

    // 播放/暂停切换
    togglePlay: function () {
      if (this.data.playing) {
        this.pause()
      } else {
        this.play()
      }
    },

    // 开始播放
    play: function () {
      this.player.play({
        success: () => {
          this.setData({ playing: true, errorMessage: '' })
        },
        fail: (err) => {
          this.setData({ errorMessage: '播放失败' })
          console.error('播放失败:', err)
        },
      })
    },

    // 暂停播放
    pause: function () {
      this.player.pause({
        success: () => {
          this.setData({ playing: false })
        },
        fail: (err) => {
          console.error('暂停失败:', err)
          this.setData({
            errorMessage: err.errMsg,
          })
        },
      })
    },

    // 停止播放
    stop: function () {
      this.player.stop({
        success: () => {
          this.setData({ playing: false })
        },
        fail: (err) => {
          console.error('停止失败:', err)
        },
      })
    },

    // 静音/取消静音
    toggleMute: function () {
      this.setData({
        muted: !this.data.muted,
      })
    },

    // 全屏切换
    toggleFullScreen: function () {
      this.player.requestFullScreen({
        direction: this.data.orientation === 'vertical' ? 90 : 0,
      })
    },
  },
})
