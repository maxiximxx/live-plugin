/**
 * 获取窗口信息
 */
export const getWindowInfo = () => {
  const windowInfo = wx.getWindowInfo()
  return windowInfo
}

/**
 * rpx 转 px 的通用方法
 * @param {number} rpxValue 需要转换的rpx
 * @param {number} baseWidth 设计稿的基准宽度
 * @returns {number} 转换后的px
 */
export const rpxToPx = (rpxValue, baseWidth = 750) => {
  const { windowWidth } = getWindowInfo()
  return (+rpxValue / baseWidth) * windowWidth
}
