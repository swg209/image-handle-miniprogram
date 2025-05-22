// index.js
Page({
  data: {
    // 功能列表数据
  },

  /**
   * 页面导航
   */
  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    const routes = {
      compress: '../compress/compress',
      removebg: '../removebg/removebg',
      recognize: '../recognize/recognize',
      idphoto: '../idphoto/idphoto'
    };

    if (routes[page]) {
      wx.navigateTo({
        url: routes[page]
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片处理工具箱'
    });
  }
}) 