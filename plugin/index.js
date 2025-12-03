/**
 * 说明： 由于插件和主程序环境隔离 所以不能共享缓存 只有暴露方法给主程序调用
 *
 */
module.exports = {
  setApiHost: (host) => {
    wx.setStorageSync('API_HOST', host)
  },
  setAccountToken: (token) => {
    wx.setStorageSync('ACCOUNT_TOKEN', token)
  },
}
