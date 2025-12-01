/**
 * TOAST
 * @param {string} title 文案
 * @param {object} options wx.showToast配置
 */
export const showToast = (title, options = {}) => {
  if (!title) {
    return
  }
  wx.showToast({
    title,
    icon: 'none',
    mask: true,
    ...options,
  })
}

/**
 * showLoading
 * @param {string} title 文案
 */
export const showLoading = (title = '') => {
  wx.showLoading({
    title,
    mask: true,
  })
}

/**
 * hideLoading
 */
export const hideLoading = () => {
  wx.hideLoading()
}
