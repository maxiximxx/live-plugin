module.exports = {
  setApiHost: (host) => {
    wx.setStorageSync('API_HOST', host)
  },
  setAccountToken: (token) => {
    wx.setStorageSync('ACCOUNT_TOKEN', token)
  },
}
