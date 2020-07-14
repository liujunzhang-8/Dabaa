import he from "he";
var app = getApp();

// pages/test/test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bIsReady: false, // 页面是否准备就绪
    index: 0, // 题目序列
    chooseValue: [], // 选择的答案序列
    totalScore: 100, // 总分
    wrong: 0, // 错误的题目数量
    wrongListSort: [], // 错误的题目集合
  },
  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  },
  // 生成一个从 start 到 end 的连续数组 @param start @param end
  generateArray: function (start, end) {
    return Array.from(new Array(end + 1).keys()).slice(start)
  },
  // 主题列表数据模型
  parseQuestion(aList) {
    let aTopicList = [];
    if (!aList || (aList && !Array.isArray(aList))) {
      aList = [];
    }
    aTopicList = aList.map(oItem => {
      const answers = [oItem.correct_answer, oItem.incorrect_answers].flat()
      let optionArr = ['A', 'B', 'C', 'D']
      let options = {}
      let optionArrShuffle = this.shuffle(optionArr)
      for (let i = 0; i < answers.length; i++) {
        options[optionArr[i]] = he.decode(String(answers[i]));
      }
      const ordered_options = {};
      Object.keys(options).sort().forEach(function (key) {
        ordered_options[key] = options[key];
      });
      return {
        "question": he.decode(String(oItem.question)), // id
        "scores": 10,
        "checked": false,
        "option": ordered_options,
        "true": optionArr[0]
      };
    });
    return aTopicList;
  },
  getQuestions(testId) {
    // 显示标题栏加载效果
    wx.showNavigationBarLoading();
    wx.request({
      url: 'https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple&category=' + testId,
      method: 'GET',
      success: res => {
        if (res.data.response_code === 0) {
          this.setData({
            questionList: this.parseQuestion(res.data.results), // 拿到答题数据
            testId: testId // 课程ID
          })
          console.log(this.data.questionList);
          app.globalData.questionList[testId] = this.data.questionList
          // 生成题序
          let count = this.generateArray(0, this.data.questionList.length - 1);
          this.setData({
            bIsReady: true,
            // 生成随机题序[2, 0, 3] 并截取num道题
            shuffleIndex: this.shuffle(count).slice(0, 10)
          })
        } else {
          ;
        }
        // 停止加载效果
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
      },
      fail: err => {
        // 停止加载效果
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getQuestions(options.testId)
    console.log(options);
    wx.setNavigationBarTitle({
      // 动态设置导航标题
      title: app.globalData.quizCategory[options.testId],
    })
    // this.setData({
    //   // 拿到答题数据
    //   questionList: app.globalData.questionList[options.testId],
    //   // 课程ID
    //   testId: options.testId
    // })
    // 生成题序
    // let countArr = this.generateArray(0, this.data.questionList.length - 1);
    // this.setData({
    //   bIsReady: true,
    //   // 生成随机题序[2, 0, 3] 并截取num道题
    //   shuffleIndex: this.shuffle(countArr).slice(0, countArr.length)
    // })
  },

  /**
   * 单选事件
   */
  radioChange: function (e) {
    console.log('checkbox发生change事件, 携带value值为：', e.detail.value)
    this.data.chooseValue[this.data.index] = e.detail.value;
    console.log(this.data.chooseValue);
  },

  /**
   * 退出答题 按钮
   */
  outTest: function () {
    wx.showModal({
      title: '提示',
      content: '你真的要退出答题吗？',
      success(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          wx.switchTab({
            url: '../home/home',
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  /**
   * 下一题/提交 按钮
   * */
  nextSubmit: function () {
    // 如果没有选择
    if (this.data.chooseValue[this.data.index] == undefined) {
      wx.showToast({
        title: '请选择至少一个答案！',
        icon: 'none',
        duration: 2000,
        success: function () {
          return;
        }
      })
      return;
    }

    // 判断答案是否正确
    this.chooseError();

    // 判断是不是最后一题
    if (this.data.index < this.data.shuffleIndex.length - 1) {
      // 渲染下一题
      this.setData({
        index: this.data.index + 1
      })
    } else {
      let wrongListSort = JSON.stringify(this.data.wrongListSort);
      let chooseValue = JSON.stringify(this.data.chooseValue);
      let shuffleIndex = JSON.stringify(this.data.shuffleIndex);
      console.log('wrongListSort:' + wrongListSort)
      wx.navigateTo({
        url: '../results/results?totalScore=' + this.data.totalScore + '&shuffleIndex=' + shuffleIndex + '&chooseValue=' + chooseValue + '&wrongListSort=' + wrongListSort + '&testId=' + this.data.testId
      })

      // 设置缓存
      var logs = wx.getStorageSync('logs') || []
      let logsList = {
        "date": Date.now(),
        "testId": app.globalData.quizCategory[this.data.testId],
        "score": this.data.totalScore
      }
      logs.unshift(logsList);
      wx.setStorageSync('logs', logs)
    }
  },

  /* 
   * 错误处理
   */
  chooseError: function () {
    var trueValue = this.data.questionList[this.data.shuffleIndex[this.data.index]]['true'];
    var chooseVal = this.data.chooseValue[this.data.index];
    console.log('选择了' + chooseVal + '答案是' + trueValue);
    if (chooseVal.toString() != trueValue.toString()) {
      console.log('错了');
      this.data.wrong++;
      this.data.wrongListSort.push(this.data.index);
      this.setData({
        // 扣分操作
        totalScore: this.data.totalScore - this.data.questionList[this.data.shuffleIndex[this.data.index]]['scores']
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})