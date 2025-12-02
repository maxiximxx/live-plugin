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

/**
 * 生成一个UUID
 */
export const getUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
