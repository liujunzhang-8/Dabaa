// pages/results/results.js
var app = getApp();
Page({
  data: {
    totalScore: null, // 分数
    shuffleIndex: [], // 错误的题数-乱序
    wrongListSort: [],  // 错误的题数-正序
    chooseValue: [], // 选择的答案
    remark: ["好极了！你很棒棒哦", "哎哟不错哦", "别灰心，继续努力哦！"], // 评语
    modalShow: false
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle( 'title: app.globalData.quizCategory[options.testId]' ) // 动态设置导航条标题
    let shuffleIndex = JSON.parse(options.shuffleIndex);
    let wrongListSort = JSON.parse(options.wrongListSort);
    let chooseValue = JSON.parse(options.chooseValue);
    console.log(options, 'NIHAO-----------------------');
    this.setData({
      totalScore: options.totalScore != "" ? options.totalScore : "无",
      shuffleIndex: JSON.parse(options.shuffleIndex),
      wrongListSort: JSON.parse(options.wrongListSort),
      chooseValue: JSON.parse(options.chooseValue),
      questionList: app.globalData.questionList[options.testId],  // 拿到答题数据
      testId: options.testId,  // 课程ID
    })
    
  },
  // 查看错题
  toView: function () {
    // 显示弹窗
    this.setData({
      modalShow: true
    })
  },
  // 返回首页
  toIndex: function () {
    wx.switchTab({
      url: '../home/home'
    })
  }
})