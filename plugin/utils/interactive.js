/**
 * TOAST
 * @param {string} title
 * @param {object} options
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
 * @param {string} title
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
