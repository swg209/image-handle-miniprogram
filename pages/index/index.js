// index.js
Page({
  data: {
    isLoading: true,
    tools: [
      {
        id: 'compress',
        title: '图片压缩',
        description: '压缩图片大小，保持画质',
        icon: '/images/compress.png',
        class: 'compress'
      },
      {
        id: 'removebg',
        title: '抠图去背景',
        description: '智能分离前景与背景',
        icon: '/images/removebg.png',
        class: 'removebg'
      },
      {
        id: 'recognize',
        title: '图片识别',
        description: '识别图片中的文字和内容',
        icon: '/images/recognize.png',
        class: 'recognize'
      },
      {
        id: 'idphoto',
        title: '证件照制作',
        description: '快速生成标准证件照',
        icon: '/images/idphoto.png',
        class: 'idphoto'
      }
    ]
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
      // 添加触感反馈（如果设备支持）
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
      
      wx.navigateTo({
        url: routes[page]
      });
    }
  },

  /**
   * 分享应用
   */
  onShareAppMessage() {
    return {
      title: '图片处理工具箱 - 一站式图片处理解决方案',
      path: '/pages/index/index'
    };
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片处理工具箱'
    });
    
    // 模拟加载过程
    setTimeout(() => {
      this.setData({
        isLoading: false
      });
    }, 500);
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查是否有新功能更新
    const hasCheckedUpdate = wx.getStorageSync('hasCheckedUpdate');
    if (!hasCheckedUpdate) {
      wx.setStorageSync('hasCheckedUpdate', true);
    }
  }
}) 