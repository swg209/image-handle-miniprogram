// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true,
        env: 'cloud1-1ggo42b94a8c1efd' // 你的云环境ID
      })
      console.log('云开发初始化成功')
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
