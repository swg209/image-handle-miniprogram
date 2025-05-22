Page({
  data: {
    tempFilePath: '', // 选择的图片路径
    resultPath: '', // 处理后的图片路径
    isProcessing: false, // 是否处理中
    photoSpecs: [
      { id: '1inch', name: '1寸', width: 295, height: 413, selected: true },
      { id: '2inch', name: '2寸', width: 413, height: 579, selected: false },
      { id: 'passport', name: '护照', width: 390, height: 567, selected: false }
    ],
    bgColors: [
      { color: '#ffffff', name: '白色', selected: true },
      { color: '#2c6daf', name: '蓝色', selected: false },
      { color: '#d81e06', name: '红色', selected: false }
    ],
    // 当前选中的规格和颜色信息
    currentSpecName: '1寸',
    currentSpecWidth: 295,
    currentSpecHeight: 413,
    currentBgName: '白色'
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        this.setData({
          tempFilePath,
          resultPath: ''
        });
      }
    });
  },

  /**
   * 选择证件照规格
   */
  selectSpec(e) {
    const id = e.currentTarget.dataset.id;
    let currentSpecName = '';
    let currentSpecWidth = 0;
    let currentSpecHeight = 0;
    
    const specs = this.data.photoSpecs.map(spec => {
      const isSelected = spec.id === id;
      if (isSelected) {
        currentSpecName = spec.name;
        currentSpecWidth = spec.width;
        currentSpecHeight = spec.height;
      }
      return {
        ...spec,
        selected: isSelected
      };
    });
    
    this.setData({ 
      photoSpecs: specs,
      resultPath: '',
      currentSpecName,
      currentSpecWidth,
      currentSpecHeight
    });
  },

  /**
   * 选择背景颜色
   */
  selectBgColor(e) {
    const color = e.currentTarget.dataset.color;
    let currentBgName = '';
    
    const colors = this.data.bgColors.map(item => {
      const isSelected = item.color === color;
      if (isSelected) {
        currentBgName = item.name;
      }
      return {
        ...item,
        selected: isSelected
      };
    });
    
    this.setData({ 
      bgColors: colors,
      resultPath: '',
      currentBgName
    });
  },

  /**
   * 生成证件照
   */
  generatePhoto() {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    // 获取当前选择的规格和背景色
    const selectedSpec = this.data.photoSpecs.find(spec => spec.selected);
    const selectedColor = this.data.bgColors.find(color => color.selected);
    
    // 实际应用中，这里需要调用云函数或第三方API进行证件照制作
    // 这里我们模拟处理过程
    setTimeout(() => {
      // 模拟处理结果
      this.setData({
        resultPath: this.data.tempFilePath, // 实际应用中应替换为处理后的图片路径
        isProcessing: false
      });

      wx.showToast({
        title: '生成成功',
        icon: 'success'
      });
    }, 2000);
  },

  /**
   * 保存图片
   */
  saveImage() {
    if (!this.data.resultPath) {
      wx.showToast({
        title: '请先生成证件照',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.setNavigationBarTitle({
      title: '证件照制作'
    });
  }
}) 