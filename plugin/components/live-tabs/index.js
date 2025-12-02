import { getWindowInfo, rpxToPx } from '../../utils/common'

// plugin/components/live-tabs/index.js
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    // 接收外部传入的tabs配置数组
    tabs: {
      type: Array,
      value: [],
    },
    // 当前激活的索引
    activeIndex: {
      type: Number,
      value: 0,
    },
    // 可配置的指示条宽度
    sliderWidth: {
      type: Number,
      value: 80, // 默认80rpx
    },
  },

  data: {
    sliderOffset: 0, // 指示条偏移量
  },

  lifetimes: {
    attached() {
      this.updateSliderPosition(this.properties.activeIndex)
    },
  },

  methods: {
    // 更新指示条位置
    updateSliderPosition(activeIndex = this.properties.activeIndex) {
      const { windowWidth } = getWindowInfo()
      const { tabs, sliderWidth } = this.properties
      const itemWidth = windowWidth / tabs.length
      // 将 sliderWidth 从 rpx 转换为 px
      const sliderWidthPx = rpxToPx(sliderWidth)
      const newOffset = activeIndex * itemWidth + (itemWidth - sliderWidthPx) / 2
      this.setData({
        sliderOffset: newOffset,
      })
    },

    // 点击导航项
    onTabClick(e) {
      const index = e.currentTarget.dataset.index
      this.updateSliderPosition(index)
      // 触发外部自定义事件，通知页面切换
      this.triggerEvent('tabchange', { index })
    },

    // swiper滑动切换
    onSwiperChange(e) {
      const current = e.detail.current
      this.updateSliderPosition(current)
      // 触发外部自定义事件，通知页面切换
      this.triggerEvent('tabchange', { index: current })
    },
  },
})
