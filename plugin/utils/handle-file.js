import { hideLoading, showLoading } from './interactive'

/**
 * 下载文件
 * @param {string} url 下载地址
 * @param {object} options 其他配置
 * @returns {Promise<{tempFilePath,filePath}>} 文件的地址和临时地址
 */
export const downloadFile = (url, options = {}) => {
  if (!url) {
    console.error('下载地址必传')
    return
  }
  showLoading()
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      ...options,
      success: (res) => {
        const { statusCode, tempFilePath, filePath } = res
        if (statusCode === 200) {
          resolve({
            tempFilePath,
            filePath,
          })
        }
        reject()
      },
      fail: reject,
      complete: hideLoading,
    })
  })
}

/**
 * 打开文件
 * @param {string} filePath
 * @param {object} options
 */
export const openFile = (filePath, options = {}) => {
  if (!filePath) {
    console.error('文件地址必传')
    return
  }
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath,
      showMenu: true,
      ...options,
      success: resolve,
      fail: reject,
    })
  })
}
