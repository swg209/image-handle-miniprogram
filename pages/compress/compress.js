Page({
  data: {
    tempFilePath: '', // 选择的图片路径
    compressedPath: '', // 压缩后的图片路径
    originalSize: 0, // 原始大小
    compressedSize: 0, // 压缩后大小
    compressQuality: 80, // 默认压缩质量
    isProcessing: false, // 是否处理中
    maxImageSize: 1280 // 最大图片尺寸
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
        const originalSize = res.tempFiles[0].size;
        
        this.setData({
          tempFilePath,
          originalSize,
          compressedPath: '',
          compressedSize: 0
        });
      }
    });
  },

  /**
   * 调整压缩质量
   */
  sliderChange(e) {
    this.setData({
      compressQuality: e.detail.value
    });
  },

  /**
   * 压缩图片
   */
  compressImage() {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    // 使用canvas进行图片压缩
    const quality = this.data.compressQuality / 100;
    
    // 获取图片信息
    wx.getImageInfo({
      src: this.data.tempFilePath,
      success: (res) => {
        const imageWidth = res.width;
        const imageHeight = res.height;
        
        // 计算压缩后的尺寸（等比例缩小）
        let targetWidth = imageWidth;
        let targetHeight = imageHeight;
        
        // 如果图片尺寸超过最大值，按比例缩小
        const maxSize = this.data.maxImageSize;
        if (imageWidth > maxSize || imageHeight > maxSize) {
          if (imageWidth > imageHeight) {
            targetWidth = maxSize;
            targetHeight = Math.floor(imageHeight * (maxSize / imageWidth));
          } else {
            targetHeight = maxSize;
            targetWidth = Math.floor(imageWidth * (maxSize / imageHeight));
          }
        }
        
        // 创建Canvas上下文
        const query = wx.createSelectorQuery();
        query.select('#compressCanvas')
          .fields({ node: true, size: true })
          .exec((result) => {
            const canvas = result[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸为目标尺寸
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.onload = () => {
              // 清除画布并绘制图片（缩放到目标尺寸）
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              // 将canvas内容导出为图片
              wx.canvasToTempFilePath({
                canvas: canvas,
                quality: quality,
                fileType: 'jpg', // 指定为jpg格式，通常比png小
                success: (result) => {
                  // 获取压缩后文件大小
                  wx.getFileInfo({
                    filePath: result.tempFilePath,
                    success: (sizeRes) => {
                      // 检查压缩后的大小是否真的减小了
                      if (sizeRes.size >= this.data.originalSize) {
                        // 如果压缩后反而变大，尝试更低的质量
                        const lowerQuality = Math.max(quality * 0.7, 0.5);
                        wx.canvasToTempFilePath({
                          canvas: canvas,
                          quality: lowerQuality,
                          fileType: 'jpg',
                          success: (lowerResult) => {
                            wx.getFileInfo({
                              filePath: lowerResult.tempFilePath,
                              success: (lowerSizeRes) => {
                                this.setData({
                                  compressedPath: lowerResult.tempFilePath,
                                  compressedSize: lowerSizeRes.size,
                                  isProcessing: false
                                });
                              },
                              fail: (err) => {
                                this.handleCompressionError('获取文件信息失败');
                              }
                            });
                          },
                          fail: (err) => {
                            this.handleCompressionError('二次压缩失败');
                          }
                        });
                      } else {
                        // 正常情况：压缩成功且大小减小
                        this.setData({
                          compressedPath: result.tempFilePath,
                          compressedSize: sizeRes.size,
                          isProcessing: false
                        });
                      }
                    },
                    fail: (err) => {
                      this.handleCompressionError('获取文件信息失败');
                    }
                  });
                },
                fail: (err) => {
                  this.handleCompressionError('压缩失败');
                }
              });
            };
            
            img.onerror = (err) => {
              this.handleCompressionError('图片加载失败');
            };
            
            // 设置图片源
            img.src = this.data.tempFilePath;
          });
      },
      fail: (err) => {
        this.handleCompressionError('获取图片信息失败');
      }
    });
  },

  /**
   * 处理压缩错误
   */
  handleCompressionError(message) {
    console.error(message);
    this.setData({ isProcessing: false });
    
    wx.showToast({
      title: message,
      icon: 'none'
    });
  },

  /**
   * 保存图片
   */
  saveImage() {
    if (!this.data.compressedPath) {
      wx.showToast({
        title: '请先压缩图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedPath,
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
      title: '图片压缩'
    });
  }
}) 