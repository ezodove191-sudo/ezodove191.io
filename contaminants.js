// contaminants data
const contaminants = [
  {
    "id": "cont-0-01",
    "code": "0-01",
    "level": 0,
    "name": "镜像"
  },
  {
    "id": "cont-0-02",
    "code": "0-02",
    "level": 0,
    "name": "奥林匹斯之巅"
  },
  {
    "id": "cont-0-03",
    "code": "0-03",
    "level": 0,
    "name": "幻想中的泛古陆"
  },
  {
    "id": "cont-0-04",
    "code": "0-04",
    "level": 0,
    "name": "戏剧化的表演"
  },
  {
    "id": "cont-0-05",
    "code": "0-05",
    "level": 0,
    "name": "来自地狱的乐章"
  },
  {
    "id": "cont-0-06",
    "code": "0-06",
    "level": 0,
    "name": "第三只眼"
  },
  {
    "id": "cont-0-07",
    "code": "0-07",
    "level": 0,
    "name": "穆乌银之门"
  },
  {
    "id": "cont-0-08",
    "code": "0-08",
    "level": 0,
    "name": "后山"
  },
  {
    "id": "cont-1-01",
    "code": "1-01",
    "level": 1,
    "name": "阿努比斯之枪"
  },
  {
    "id": "cont-1-02",
    "code": "1-02",
    "level": 1,
    "name": "阿尔戈之船"
  },
  {
    "id": "cont-1-03",
    "code": "1-03",
    "level": 1,
    "name": "物理实验室"
  },
  {
    "id": "cont-1-04",
    "code": "1-04",
    "level": 1,
    "name": "平面几何"
  },
  {
    "id": "cont-1-05",
    "code": "1-05",
    "level": 1,
    "name": "八二怪像"
  },
  {
    "id": "cont-1-06",
    "code": "1-06",
    "level": 1,
    "name": "物质演算"
  },
  {
    "id": "cont-1-07",
    "code": "1-07",
    "level": 1,
    "name": "被抛出的硬币"
  },
  {
    "id": "cont-1-08",
    "code": "1-08",
    "level": 1,
    "name": "群蛇"
  },
  {
    "id": "cont-1-09",
    "code": "1-09",
    "level": 1,
    "name": "画个圈圈封印你"
  },
  {
    "id": "cont-1-10",
    "code": "1-10",
    "level": 1,
    "name": "仙人下棋"
  },
  {
    "id": "cont-1-11",
    "code": "1-11",
    "level": 1,
    "name": "守口如瓶"
  },
  {
    "id": "cont-1-12",
    "code": "1-12",
    "level": 1,
    "name": "杰出的科学家"
  },
  {
    "id": "cont-1-13",
    "code": "1-13",
    "level": 1,
    "name": "藏书阁"
  },
  {
    "id": "cont-1-14",
    "code": "1-14",
    "level": 1,
    "name": "放大键"
  },
  {
    "id": "cont-1-15",
    "code": "1-15",
    "level": 1,
    "name": "七宗罪"
  },
  {
    "id": "cont-1-16",
    "code": "1-16",
    "level": 1,
    "name": "七美德"
  },
  {
    "id": "cont-1-17",
    "code": "1-17",
    "level": 1,
    "name": "伊甸园"
  },
  {
    "id": "cont-1-18",
    "code": "1-18",
    "level": 1,
    "name": "神话"
  },
  {
    "id": "cont-1-19",
    "code": "1-19",
    "level": 1,
    "name": "青金石自由"
  },
  {
    "id": "cont-1-20",
    "code": "1-20",
    "level": 1,
    "name": "虚无"
  },
  {
    "id": "cont-1-21",
    "code": "1-21",
    "level": 1,
    "name": "传统"
  },
  {
    "id": "cont-2-01",
    "code": "2-01",
    "level": 2,
    "name": "梵音玉像"
  },
  {
    "id": "cont-2-02",
    "code": "2-02",
    "level": 2,
    "name": "基督教十字架"
  },
  {
    "id": "cont-2-05",
    "code": "2-05",
    "level": 2,
    "name": "50%梦想师"
  },
  {
    "id": "cont-2-06",
    "code": "2-06",
    "level": 2,
    "name": "墨菲定律之环"
  },
  {
    "id": "cont-2-07",
    "code": "2-07",
    "level": 2,
    "name": "海市蜃楼效应"
  },
  {
    "id": "cont-2-08",
    "code": "2-08",
    "level": 2,
    "name": "附属品傀儡"
  },
  {
    "id": "cont-2-09",
    "code": "2-09",
    "level": 2,
    "name": "礼耻之神"
  },
  {
    "id": "cont-2-10",
    "code": "2-10",
    "level": 2,
    "name": "莫比乌斯环带"
  },
  {
    "id": "cont-2-11",
    "code": "2-11",
    "level": 2,
    "name": "摩尔曼斯克"
  },
  {
    "id": "cont-2-12",
    "code": "2-12",
    "level": 2,
    "name": "群体心理学"
  },
  {
    "id": "cont-2-13",
    "code": "2-13",
    "level": 2,
    "name": "告白"
  },
  {
    "id": "cont-2-14",
    "code": "2-14",
    "level": 2,
    "name": "午夜诗人的诗集"
  },
  {
    "id": "cont-2-15",
    "code": "2-15",
    "level": 2,
    "name": "南十字星"
  },
  {
    "id": "cont-2-16",
    "code": "2-16",
    "level": 2,
    "name": "半自动采石机"
  },
  {
    "id": "cont-2-17",
    "code": "2-17",
    "level": 2,
    "name": "幸存者偏差"
  },
  {
    "id": "cont-2-18",
    "code": "2-18",
    "level": 2,
    "name": "庞加莱复现"
  },
  {
    "id": "cont-2-19",
    "code": "2-19",
    "level": 2,
    "name": "河神"
  },
  {
    "id": "cont-2-20",
    "code": "2-20",
    "level": 2,
    "name": "工业革命"
  },
  {
    "id": "cont-2-21",
    "code": "2-21",
    "level": 2,
    "name": "游乐园"
  },
  {
    "id": "cont-2-22",
    "code": "2-22",
    "level": 2,
    "name": "帕累托最优"
  },
  {
    "id": "cont-2-23",
    "code": "2-23",
    "level": 2,
    "name": "大同社会"
  },
  {
    "id": "cont-2-24",
    "code": "2-24",
    "level": 2,
    "name": "洛希极限"
  },
  {
    "id": "cont-2-25",
    "code": "2-25",
    "level": 2,
    "name": "附魔之书·水"
  },
  {
    "id": "cont-2-26",
    "code": "2-26",
    "level": 2,
    "name": "附魔之书·火"
  },
  {
    "id": "cont-2-27",
    "code": "2-27",
    "level": 2,
    "name": "附魔之书·土"
  },
  {
    "id": "cont-2-28",
    "code": "2-28",
    "level": 2,
    "name": "附魔之书·风"
  },
  {
    "id": "cont-2-29",
    "code": "2-29",
    "level": 2,
    "name": "附魔之书·金"
  },
  {
    "id": "cont-2-30",
    "code": "2-30",
    "level": 2,
    "name": "附魔之书·木"
  },
  {
    "id": "cont-2-31",
    "code": "2-31",
    "level": 2,
    "name": "附魔之书·雷"
  },
  {
    "id": "cont-2-32",
    "code": "2-32",
    "level": 2,
    "name": "附魔之书·冰"
  },
  {
    "id": "cont-2-33",
    "code": "2-33",
    "level": 2,
    "name": "附魔之书·光"
  },
  {
    "id": "cont-2-34",
    "code": "2-34",
    "level": 2,
    "name": "附魔之书·时间"
  },
  {
    "id": "cont-2-35",
    "code": "2-35",
    "level": 2,
    "name": "附魔之书·空间"
  },
  {
    "id": "cont-3-01",
    "code": "3-01",
    "level": 3,
    "name": "杰的化身"
  },
  {
    "id": "cont-3-02",
    "code": "3-02",
    "level": 3,
    "name": "巫师袍"
  },
  {
    "id": "cont-3-03",
    "code": "3-03",
    "level": 3,
    "name": "蟠桃核"
  },
  {
    "id": "cont-3-04",
    "code": "3-04",
    "level": 3,
    "name": "天使之拥"
  },
  {
    "id": "cont-3-05",
    "code": "3-05",
    "level": 3,
    "name": "迪尔柚木鼓"
  },
  {
    "id": "cont-3-06",
    "code": "3-06",
    "level": 3,
    "name": "重高线"
  },
  {
    "id": "cont-3-07",
    "code": "3-07",
    "level": 3,
    "name": "度量衡"
  },
  {
    "id": "cont-3-08",
    "code": "3-08",
    "level": 3,
    "name": "神谕"
  },
  {
    "id": "cont-3-09",
    "code": "3-09",
    "level": 3,
    "name": "神裁"
  },
  {
    "id": "cont-3-10",
    "code": "3-10",
    "level": 3,
    "name": "承重柱"
  },
  {
    "id": "cont-3-11",
    "code": "3-11",
    "level": 3,
    "name": "切尔诺贝利"
  },
  {
    "id": "cont-3-12",
    "code": "3-12",
    "level": 3,
    "name": "伦敦之雾"
  },
  {
    "id": "cont-3-13",
    "code": "3-13",
    "level": 3,
    "name": "DNA"
  },
  {
    "id": "cont-3-14",
    "code": "3-14",
    "level": 3,
    "name": "π"
  },
  {
    "id": "cont-3-15",
    "code": "3-15",
    "level": 3,
    "name": "维度意识"
  },
  {
    "id": "cont-3-16",
    "code": "3-16",
    "level": 3,
    "name": "大富翁"
  },
  {
    "id": "cont-3-17",
    "code": "3-17",
    "level": 3,
    "name": "时间之矢"
  },
  {
    "id": "cont-3-18",
    "code": "3-18",
    "level": 3,
    "name": "神笔马良"
  },
  {
    "id": "cont-3-19",
    "code": "3-19",
    "level": 3,
    "name": "科济列夫镜"
  },
  {
    "id": "cont-3-20",
    "code": "3-20",
    "level": 3,
    "name": "铁血演幕"
  },
  {
    "id": "cont-3-21",
    "code": "3-21",
    "level": 3,
    "name": "囍"
  },
  {
    "id": "cont-3-22",
    "code": "3-22",
    "level": 3,
    "name": "相机"
  },
  {
    "id": "cont-3-23",
    "code": "3-23",
    "level": 3,
    "name": "雨幕"
  },
  {
    "id": "cont-3-24",
    "code": "3-24",
    "level": 3,
    "name": "古乐十二律"
  },
  {
    "id": "cont-3-25",
    "code": "3-25",
    "level": 3,
    "name": "圣诞之夜"
  },
  {
    "id": "cont-3-26",
    "code": "3-26",
    "level": 3,
    "name": "野指针"
  },
  {
    "id": "cont-3-27",
    "code": "3-27",
    "level": 3,
    "name": "等价交换"
  },
  {
    "id": "cont-3-28",
    "code": "3-28",
    "level": 3,
    "name": "√2"
  },
  {
    "id": "cont-3-29",
    "code": "3-29",
    "level": 3,
    "name": "僧帽水母"
  },
  {
    "id": "cont-3-30",
    "code": "3-30",
    "level": 3,
    "name": "100%命中率"
  },
  {
    "id": "cont-3-31",
    "code": "3-31",
    "level": 3,
    "name": "无畏"
  },
  {
    "id": "cont-3-32",
    "code": "3-32",
    "level": 3,
    "name": "天狗食日"
  },
  {
    "id": "cont-3-33",
    "code": "3-33",
    "level": 3,
    "name": "刑戮"
  },
  {
    "id": "cont-3-34",
    "code": "3-34",
    "level": 3,
    "name": "克什歇"
  },
  {
    "id": "cont-3-35",
    "code": "3-35",
    "level": 3,
    "name": "帝国一心"
  },
  {
    "id": "cont-3-36",
    "code": "3-36",
    "level": 3,
    "name": "潮汐"
  },
  {
    "id": "cont-3-37",
    "code": "3-37",
    "level": 3,
    "name": "白玉莲"
  },
  {
    "id": "cont-3-38",
    "code": "3-38",
    "level": 3,
    "name": "吉里斯耶"
  },
  {
    "id": "cont-3-39",
    "code": "3-39",
    "level": 3,
    "name": "楔子"
  },
  {
    "id": "cont-4-01",
    "code": "4-01",
    "level": 4,
    "name": "反话"
  },
  {
    "id": "cont-4-02",
    "code": "4-02",
    "level": 4,
    "name": "转动的指针"
  },
  {
    "id": "cont-4-03",
    "code": "4-03",
    "level": 4,
    "name": "天气术士"
  },
  {
    "id": "cont-4-04",
    "code": "4-04",
    "level": 4,
    "name": "404 has found"
  },
  {
    "id": "cont-4-05",
    "code": "4-05",
    "level": 4,
    "name": "白毛绒"
  },
  {
    "id": "cont-4-06",
    "code": "4-06",
    "level": 4,
    "name": "黑名单"
  },
  {
    "id": "cont-4-07",
    "code": "4-07",
    "level": 4,
    "name": "涌泉相报"
  },
  {
    "id": "cont-4-08",
    "code": "4-08",
    "level": 4,
    "name": "斐波那契海螺"
  },
  {
    "id": "cont-4-09",
    "code": "4-09",
    "level": 4,
    "name": "噩梦制造机"
  },
  {
    "id": "cont-4-10",
    "code": "4-10",
    "level": 4,
    "name": "旁观者视角"
  },
  {
    "id": "cont-4-11",
    "code": "4-11",
    "level": 4,
    "name": "宇称不守恒"
  },
  {
    "id": "cont-4-12",
    "code": "4-12",
    "level": 4,
    "name": "波粒二象性"
  },
  {
    "id": "cont-4-13",
    "code": "4-13",
    "level": 4,
    "name": "笑面"
  },
  {
    "id": "cont-4-14",
    "code": "4-14",
    "level": 4,
    "name": "海啸"
  },
  {
    "id": "cont-4-15",
    "code": "4-15",
    "level": 4,
    "name": "强军战歌"
  },
  {
    "id": "cont-4-16",
    "code": "4-16",
    "level": 4,
    "name": "万能翻译"
  },
  {
    "id": "cont-4-17",
    "code": "4-17",
    "level": 4,
    "name": "万能通讯"
  },
  {
    "id": "cont-4-18",
    "code": "4-18",
    "level": 4,
    "name": "万能遥控"
  },
  {
    "id": "cont-4-19",
    "code": "4-19",
    "level": 4,
    "name": "万能钥匙"
  },
  {
    "id": "cont-4-68",
    "code": "4-68",
    "level": 4,
    "name": "臣子棋"
  },
  {
    "id": "cont-4-69",
    "code": "4-69",
    "level": 4,
    "name": "家庭烹饪小妙招"
  },
  {
    "id": "cont-4-70",
    "code": "4-70",
    "level": 4,
    "name": "性缘脑"
  },
  {
    "id": "cont-5-01",
    "code": "5-01",
    "level": 5,
    "name": "劳动最光荣"
  },
  {
    "id": "cont-5-02",
    "code": "5-02",
    "level": 5,
    "name": "评论式批注"
  },
  {
    "id": "cont-5-03",
    "code": "5-03",
    "level": 5,
    "name": "消除疲惫的眼药水"
  },
  {
    "id": "cont-5-04",
    "code": "5-04",
    "level": 5,
    "name": "吹弹可破的不锈钢"
  },
  {
    "id": "cont-5-05",
    "code": "5-05",
    "level": 5,
    "name": "人要学会分享"
  },
  {
    "id": "cont-5-06",
    "code": "5-06",
    "level": 5,
    "name": "点石成金"
  },
  {
    "id": "cont-5-07",
    "code": "5-07",
    "level": 5,
    "name": "手术刀"
  },
  {
    "id": "cont-5-08",
    "code": "5-08",
    "level": 5,
    "name": "乐得清闲"
  },
  {
    "id": "cont-5-09",
    "code": "5-09",
    "level": 5,
    "name": "被动尖叫制造机"
  },
  {
    "id": "cont-5-10",
    "code": "5-10",
    "level": 5,
    "name": "储物戒"
  },
  {
    "id": "cont-5-12",
    "code": "5-12",
    "level": 5,
    "name": "渔人的吟唱"
  },
  {
    "id": "cont-5-13",
    "code": "5-13",
    "level": 5,
    "name": "含笑九泉"
  },
  {
    "id": "cont-5-14",
    "code": "5-14",
    "level": 5,
    "name": "孟婆汤"
  },
  {
    "id": "cont-5-15",
    "code": "5-15",
    "level": 5,
    "name": "干了这碗汤"
  },
  {
    "id": "cont-5-16",
    "code": "5-16",
    "level": 5,
    "name": "封印画框"
  },
  {
    "id": "cont-5-17",
    "code": "5-17",
    "level": 5,
    "name": "潜能引发器"
  },
  {
    "id": "cont-5-18",
    "code": "5-18",
    "level": 5,
    "name": "阴魂不散"
  },
  {
    "id": "cont-5-19",
    "code": "5-19",
    "level": 5,
    "name": "八卦锁"
  },
  {
    "id": "cont-5-20",
    "code": "5-20",
    "level": 5,
    "name": "姻缘线"
  },
  {
    "id": "cont-5-21",
    "code": "5-21",
    "level": 5,
    "name": "爱的小报"
  },
  {
    "id": "cont-5-22",
    "code": "5-22",
    "level": 5,
    "name": "黄金八点档"
  },
  {
    "id": "cont-5-23",
    "code": "5-23",
    "level": 5,
    "name": "热爱狗血的播放器"
  },
  {
    "id": "cont-5-24",
    "code": "5-24",
    "level": 5,
    "name": "肖像画"
  },
  {
    "id": "cont-5-25",
    "code": "5-25",
    "level": 5,
    "name": "夸夸信箱"
  },
  {
    "id": "cont-5-26",
    "code": "5-26",
    "level": 5,
    "name": "断情绝爱"
  },
  {
    "id": "cont-5-27",
    "code": "5-27",
    "level": 5,
    "name": "六翼下的羽毛"
  },
  {
    "id": "cont-5-28",
    "code": "5-28",
    "level": 5,
    "name": "朽木生花"
  },
  {
    "id": "cont-5-29",
    "code": "5-29",
    "level": 5,
    "name": "休眠舱"
  },
  {
    "id": "cont-5-30",
    "code": "5-30",
    "level": 5,
    "name": "绝处逢生的花"
  },
  {
    "id": "cont-5-31",
    "code": "5-31",
    "level": 5,
    "name": "魔女与猎人的二象性"
  },
  {
    "id": "cont-5-36",
    "code": "5-36",
    "level": 5,
    "name": "哑药"
  },
  {
    "id": "cont-5-37",
    "code": "5-37",
    "level": 5,
    "name": "形影"
  },
  {
    "id": "cont-5-38",
    "code": "5-38",
    "level": 5,
    "name": "双叶树"
  },
  {
    "id": "cont-5-39",
    "code": "5-39",
    "level": 5,
    "name": "魔术帽"
  }
];
