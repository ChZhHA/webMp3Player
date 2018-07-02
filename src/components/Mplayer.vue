<!--作者：陈宗豪     -->
<!--日期：2018-6-29 -->
<!--任务：音乐播放器 -->
<template>
  <div>
    <!--用于选择文件-->
    <input type="file" id="fileSelector" style="display:none" multiple @change="loadFile">
    <!--用于播放音频-->
    <audio :src="fileURI" id='player'></audio>
    <!--先制作小型播放器-->
    <div class="mini-container">
      <!--背景框-->
      <div class="mini-cover"
           :style="`box-shadow:0 0 ${shadowOp}px #bbb;height:${heightOp}px;width:${widthOp}px`"
           id="mini-cover"
           @mouseover="menuIn"
           @mousemove="doDrag"
           @mousedown="startDrag"
           @mouseup="endDrag"
      >
        <!--播放进度条-->
        <div class="progress" :style="'width:'+progress*widthOp+'px;'"></div>
        <!--歌词-->
        <transition name="fade">
          <div class="lrc" v-show="loaded&&!menuVisible_1">{{currentLrc}}</div>
        </transition>
      </div>

      <!--开始图标-->
      <div class="button round button-1" @click="selFile" v-if="!loaded">
        <div class="button-file"></div>
      </div>

      <!--播放菜单-->
      <transition name="normalfade">
        <div v-show="menuVisible_1">
          <!--可用的前后按钮-->
          <transition name="fade">
            <div class="button-mini round back" v-show="functionVisible_0" @click="goBack">
              <div></div>
            </div>
          </transition>
          <transition name="fade">
            <div class="button-mini round front" v-show="functionVisible_1" @click="goFront">
              <div></div>
            </div>
          </transition>
          <!--播放/暂停按钮-->
          <div class="button round button-1" @click="switchPlay" v-if="loaded">
            <transition name="fade">
              <div class="button-play" v-show="!playing"></div>
            </transition>
            <transition name="fade">
              <div class="button-pause" v-show="playing"></div>
            </transition>
          </div>

          <!--关闭文件按钮-->
          <transition name="fade">
            <div class="button no-border button-2" @click="unloadFile" v-show="functionVisible_2">
              <div class="button-unload"></div>
            </div>
          </transition>

          <!--切换播放模式按钮-->
          <transition name="fade">
            <div class="button round button-4" @click="changeMode" v-show="functionVisible_4">
              <div v-show="playMode===0" class="mode-0"></div>
              <div v-show="playMode===1" class="mode-1"></div>
              <div v-show="playMode===2" class="mode-2"></div>
            </div>
          </transition>

          <!--打开播放列表按钮-->
          <transition name="fade">
            <div class="button round button-5" @click="openList" v-show="functionVisible_5">
              <div></div>
            </div>
          </transition>
          <!--音量按钮/菜单-->
          <transition name="normalfade">
            <div class="voice-menu"
                 v-show="menuVisible_0"
                 id="voice-menu"
                 @mouseover="entered"
                 @mouseout="leaved"
                 @mousedown="volumeDown"
                 @mousemove="volumeMove"
                 @mouseup="volumeUp"
            >
              <div class="menu"></div>
              <div class="volume" :style="'height:'+volume*90+'px;'">
                <div class="menu active"></div>
              </div>
            </div>
          </transition>
          <transition name="fade">
            <div class="button no-border button-3"
                 @click="mute"
                 @mouseover="entered"
                 @mouseout="leaved"
                 v-show="functionVisible_3">
              <div :class="`button-voice ${mutedOp}`"></div>
            </div>
          </transition>
        </div>
      </transition>


    </div>
  </div>
</template>

<script>
  import {searchMusic, getLRC} from '../api'

  export default {
    name: "player",
    data() {
      return {
        boxStatus: {
          default: {
            height: 40,
            width: 40
          },
          loaded: {
            height: 40,
            width: 400
          }
        },
        fileURI: '',
        lrc: [],
        playList:[],
        playIndex:0,
        totalList:[],
        playing: false,
        loaded: !false,
        muted: false,

        volume: 0.8,
        volumeTemp: 0.0,
        volumeRemember: 0.8,
        volumeChange: false,

        dragging: false,

        functionVisible_0: !false,
        functionVisible_1: !false,
        functionVisible_2: !false,
        functionVisible_3: !false,
        functionVisible_4: !false,
        functionVisible_5: !false,


        menuVisible_0: !false,
        menuVisible_1: true,

        voiceMenu: null,
        mainMenu: null,

        currentPlay:{url:'',urn:''},
        currentLrc: '',
        playTime: 0,
        totalTime: 0,
        playInfo: null,
        playMode:0,

        pauseTimer: false,
        volumeTimer: false,
        menuTimer: false,
        menuTimer2: false,
        breathTimer: false,

        radio: 0,
        shadowOp: 5,
      }
    },
    methods: {
      //模拟点击文件选择按钮
      selFile() {
        const item = document.getElementById('fileSelector');
        item.click();
      },
      //读取本地文件
      loadFile() {
        const file = document.getElementById('fileSelector');
        let failed=[];
        for (const item of file.files) {
          if(item.name.split('.').pop()!=='mp3'){
            failed.push(
              item.name
            )
          }else{
            const urn=item.urn || item.name;
            this.playList.push({
              url:item,
              urn:urn,
            });
            this.totalList.push({
              url:item,
              urn:urn,
            })
          }
        }
        if(failed.length>0) alert(`读取${failed.length}个文件失败：不是mp3格式`);
        if(!this.loaded){
          //如果是首次加载
          this.play(true);
        }else{
          //如果已在播放
          //貌似什么都不用管
        }
      },
      play(isFirst=false){
        if(isFirst){
          this.currentPlay=this.totalList[0];
        }else{
          switch (this.playMode){
            case 0: //顺序模式
              // if(this.playList.length>0){
              // }else{
              //   this.playList=[...this.totalList];
              // }
              // this.currentPlay=this.playList.shift();
              if(this.playIndex<0) {
                this.playIndex=this.totalList.length+this.playIndex;
              }
              this.playIndex++;
              if(this.playIndex>=this.totalList.length){
                this.playIndex=this.playIndex-this.totalList.length;
              }
              this.currentPlay=this.totalList[this.playIndex];
              // console.log(this.currentPlay,this.playIndex);
              break;
            case 1: //随机模式
              const ram=Math.floor(Math.random()*this.totalList.length);
              this.currentPlay=this.totalList[ram];
              break;
            case 2: //单曲循环
              break;
          }
        }
        if(this.playMode!==2){
          const OURL = URL.createObjectURL(this.currentPlay.url);
          this.getRemoteLRC(this.currentPlay.url,this.currentPlay.urn);
          this.readerLoaded(OURL);
        }
        this.player.currentTime=0;
      },
      goFront(){
        this.play();
      },
      goBack(){
        this.playIndex-=2;
        this.play();
      },
      changeMode(){
        this.playMode++;
        if(this.playMode>2)
          this.playMode=0;
      },
      openList(){

      },
      readerLoaded(res) {
        // this.fileURI = url;
        this.fileURI = res;
        //播放文件加载完毕自动播放+注册侦听
        this.player.oncanplay = () => {
          this.player.play();
          this.totalTime = this.player.duration;
          this.playing = true;
          this.player.ontimeupdate = () => {
            this.playTime = this.player.currentTime; //获得当前播放时间
            if(this.playTime === this.totalTime){
              this.play();
            }
            //如果歌词存在，找到时间点对应歌词
            if (this.lrc.length > 0) {
              for (let i = 0; i < this.lrc.length; i++) {
                if (this.lrc[i][0] > this.playTime) {
                  this.currentLrc = this.lrc[i][1]; //更新数据
                  break;
                }
              }
            } else {
              this.currentLrc = '暂无歌词';
            }
            //设置渐进音量
            if (!this.muted) this.player.volume = this.volumeTemp;
            if (this.volumeTemp !== this.volume) {
              this.volumeTemp += (this.volume - this.volumeTemp) / 3;
            }
          }
        };
        clearInterval(this.breathTimer);
        this.shadowOp = 5;
        this.loaded = true;
        //菜单依次显示
        setTimeout(() => {
          this.functionVisible_0 = true;
        }, 300);
        setTimeout(() => {
          this.functionVisible_1 = true;
          //保存播放器属性
          const menuRect = document.getElementById('mini-cover').getBoundingClientRect();
          this.mainMenu = {
            left: menuRect.left,
            width: menuRect.width,
            right: menuRect.right,
            top: menuRect.top,
            height: menuRect.height,
            bottom: menuRect.bottom,
          };
          //侦听鼠标移出播放器，将菜单隐藏
          window.addEventListener('mousemove', e => {
            this.letMenuOut(e);
          })
        }, 500);
        setTimeout(() => {
          this.functionVisible_2 = true;
        }, 700);
        setTimeout(() => {
          this.functionVisible_3 = true;
        }, 900);
        setTimeout(()=>{
          this.functionVisible_5=true;
        }, 1100);
        setTimeout(()=>{
          this.functionVisible_4=true;
        },1300);
        clearTimeout(this.menuTimer2);
        this.menuTimer2 = setTimeout(() => {
          this.menuVisible_1 = false;
          this.menuTimer2 = false;
        }, 3000)


      },
      //
      getRemoteLRC(url=this.currentPlay.url,urn=this.currentPlay.urn){
        this.lrc=[];
        ID3.loadTags(urn, () => {
          this.playInfo = ID3.getAllTags(urn);
          //调用baidu音乐API得到音乐id，再查找对应lrc
          searchMusic(this.playInfo.title).then(res => {
            if (res.data) {
              if (res.data.song) {
                getLRC(res.data.song[0].songid).then(res => {
                  if (res.data.lrcContent) {
                    //过滤json中的lrc字符串
                    this.lrc = this.parseLyric(res.data.lrcContent);
                  }
                })
              }
            }
          })
        }, {
          tags: ["title", "artist", "album", "picture"],
          dataReader: ID3.FileAPIReader(url)
        });
      },
      //卸载音乐文件 还原临时数据
      unloadFile() {
        clearTimeout(this.pauseTimer);
        clearTimeout(this.volumeTimer);
        clearTimeout(this.menuTimer);
        clearTimeout(this.menuTimer2);
        this.playing = false;
        this.fileURI = '';
        this.functionVisible_0 = false;
        this.functionVisible_1 = false;
        this.functionVisible_2 = false;
        this.functionVisible_3 = false;
        this.volume = 0.8;
        this.volumeTemp = 0.0;
        this.volumeRemember = 0.8;
        this.volumeChange = false;
        this.dragging = false;
        this.muted = false;
        this.player.muted = false;
        this.playInfo = null;
        this.lrc = [];
        this.currentLrc = '';
        this.loaded = false;
        this.radio = 0;
        this.shadowOp = 5;
        this.setBreath();
        //重制输入框状态
        document.getElementById('fileSelector').value = '';
      },
      //播放/暂停切换
      switchPlay() {
        if (this.playing) {
          this.volumeRemember = this.volume;
          this.volume = 0;
          this.pauseTimer = setTimeout(() => {
            this.player.pause();
          }, 1200)
        } else {
          clearTimeout(this.pauseTimer);
          this.volume = this.volumeRemember;
          this.player.play();
        }
        this.playing = !this.playing;
      },
      parseLyric(text) {
        let lyric = text.split('\n'); //先按行分割
        let _l = lyric.length; //获取歌词行数
        let lrc = [];//新建一个数组存放最后结果
        for (let i = 0; i < _l; i++) {
          let d = lyric[i].match(/\[\d{2}:\d{2}((\.|\:)\d{2})\]/g);  //正则匹配播放时间
          let t = lyric[i].split(d); //以时间为分割点分割每行歌词，数组最后一个为歌词正文
          if (d != null) { //过滤掉空行等非歌词正文部分
            //换算时间，保留两位小数
            const dt = String(d).split(':');
            const _t = Math.round(parseInt(dt[0].split('[')[1]) * 6000 + parseFloat(dt[1].split(']')[0]) * 100) / 100;
            // console.log(dt,,_t);
            lrc.push([_t, t[1]]);
          }
        }
        return lrc;
      },
      //鼠标移入音量按钮
      entered() {
        clearTimeout(this.volumeTimer);
        if (!this.menuVisible_0)
          this.menuVisible_0 = true;
      },
      //鼠标离开音量按钮
      leaved(e) {
        if (this.volumeChange) {
          this.changeVolume(e.y);
        }
        //渐隐音量菜单
        if (this.menuVisible_0)
          this.volumeTimer = setTimeout(
            () => {
              this.menuVisible_0 = false;
              this.volumeChange = false;
            }, 1000
          );
      },
      //鼠标移进播放器，开始计时
      menuIn() {
        // console.log(this.menuTimer);
        if (!this.menuTimer) {
          if (this.menuTimer2) {
            this.menuTimer2 = clearTimeout(this.menuTimer2);
          }
          this.menuTimer = setTimeout(() => {
            this.menuVisible_1 = true;
          }, 800)

        }
        // console.log(this.menuTimer);
      },
      //判断菜单是否需要隐藏
      letMenuOut(e) {
        if (!this.menuTimer2 && !this.volumeChange) {
          if (e.x > this.mainMenu.right || e.x < this.mainMenu.left || e.y < this.mainMenu.top || e.y > this.mainMenu.bottom) {
            this.menuOut();
          }
        }
      },
      //鼠标移出播放器
      menuOut() {
        this.menuTimer = clearTimeout(this.menuTimer);
        this.menuTimer2 = setTimeout(() => {
          this.menuVisible_1 = false;
        }, 1000);
      },
      //切换静音
      mute() {
        this.muted = !this.muted;
        this.player.muted = this.muted;
      },
      //在音量菜单上按下鼠标
      volumeDown(e) {
        this.volumeChange = true;
        this.menuTimer2 = clearTimeout(this.menuTimer2);
        const menuRect = document.getElementById('voice-menu').getBoundingClientRect();
        this.voiceMenu = {
          top: menuRect.top,
          height: menuRect.height,
          bottom: menuRect.bottom
        };
        this.changeVolume(e.y);
      },
      //判断音量拖动
      volumeMove(e) {
        if (this.volumeChange) {
          this.changeVolume(e.y);
        }

      },
      //拖动弹起
      volumeUp(e) {
        if (this.volumeChange) {
          this.changeVolume(e.y);
        }
        this.volumeChange = false;
      },
      //改变音量大小
      changeVolume(y) {
        this.muted = false;
        this.player.muted = this.muted;
        if (y >= this.voiceMenu.top && y <= this.voiceMenu.bottom) {
          this.volume = (this.voiceMenu.bottom - y) / this.voiceMenu.height;
        } else if (y > this.voiceMenu.bottom) {
          this.volume = 0
        } else {
          this.volume = 1
        }

      },
      //拖动播放进度
      startDrag(e) {
        this.dragging = true;
        clearTimeout(this.menuTimer);
        clearTimeout(this.menuTimer2);
        this.menuVisible_1 = false;
        this.menuTimer = true;
        this.changeProgress(e.x);
      },
      doDrag(e) {
        if (this.dragging) {
          this.changeProgress(e.x);
        }
      },
      endDrag(e) {
        if (this.dragging) {
          this.changeProgress(e.x);
        }
        this.dragging = false;
        this.menuTimer = null;
        if (e.x <= this.mainMenu.right && e.x >= this.mainMenu.left && e.y >= this.mainMenu.top && e.y <= this.mainMenu.bottom) {
          this.menuIn();
        }
      },
      //改变当前播放时间
      changeProgress(x) {
        this.playTime = (x - this.mainMenu.left) / this.mainMenu.width * this.totalTime;
        this.player.currentTime = this.playTime;
      },
      //设定开始按钮呼吸
      setBreath() {
        this.breathTimer = setInterval(() => {
          this.radio += 0.2;
          this.shadowOp = (Math.sin(this.radio) + 0.5) * 6;
        }, 100);
      }
    },
    computed: {
      heightOp() {
        return this.loaded ? this.boxStatus.loaded.height : this.boxStatus.default.height;
      },
      widthOp() {
        return this.loaded ? this.boxStatus.loaded.width : this.boxStatus.default.width;
      },
      mutedOp() {
        return (this.muted ? 'muted' : '');
      },
      progress() {
        return this.playTime / (this.totalTime + 0.001);
      },
    },
    mounted() {
      this.player = document.getElementById('player');
      this.player.volume = 0.1;
      //判断鼠标在各拖动条外的鼠标释放
      window.addEventListener('mouseup', e => {
        if (this.volumeChange) {
          this.volumeChange = false;
          this.changeVolume(e.y);
          this.letMenuOut(e);
        }
        if (this.dragging) {
          this.dragging = false;
          this.changeProgress(e.y);
        }
      });

      //需要热更新时加注释
      // for (let i = 0; i < 40; i++) {
      //   clearInterval(i);
      // }

      this.setBreath();

    }
  }
</script>

<style scoped>
  .mini-container {
    width: 400px;
    height: 40px;
    border-radius: 20px;
    user-select: none;
  }

  .mini-cover {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: #fcfcfc;
    box-shadow: 0px 0px 4px #bbb;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .progress {
    position: absolute;
    left: 0;
    height: 40px;
    background: #85ea47;
    transition: all 0.5s;
  }

  .lrc {
    position: absolute;
    left: 50%;
    top: 50%;
    font-weight: 800;
    color: #666;
    transform: translate(-50%, -50%);
  }

  .button {
    width: 38px;
    height: 38px;
    box-shadow: 0 0 5px #bbb;
    background: rgba(255, 255, 255, 0.8);
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;
  }

  .button:hover {
    background: rgba(38, 53, 80, 0.85);
  }

  .button-mini {
    width: 28px;
    background: rgba(255, 255, 255, 0.8);
    height: 28px;
    box-shadow: inset 0 0 3px #ddd, 0 0 0 #eee;
    transition: all 0.3s;
    cursor: pointer;
  }

  .button-mini:hover {
    background: #2f4061;
    box-shadow: inset 0 0 0 #ddd, 0 0 3px #eee;
  }

  .round {
    border-radius: 50%;
  }

  .no-border {
    box-shadow: none;
    border-radius: 50%;
    background: transparent;
  }

  .back, .front {
    position: absolute;
    left: calc(50% - 14px);
    top: 6px;
  }

  .back {
    transform: translateX(-150%);
  }

  .front {
    transform: translateX(150%);
  }

  .back div {
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-right: 10px solid #bbb;
    margin-top: 6px;
  }

  .front div {
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-left: 10px solid #bbb;
    margin-top: 6px;
    margin-left: 10px;
  }

  .button-file {
    opacity: 0.8;
    width: 14px;
    height: 14px;
    margin-left: 8px;
    margin-top: 8px;
    border: 4px solid #999;
    border-radius: 50%;
  }

  .button-unload {
    width: 0;
    height: 0;
    margin-top: 7px;
    margin-left: 8px;
    border: 10px solid transparent;
    border-bottom-color: #999;
  }

  .button-unload:before {
    content: '';
    display: block;
    position: relative;
    background: #999;
    width: 18px;
    height: 3px;
    left: -9px;
    top: -5px;
  }

  .button-play {
    border: 12px solid transparent;
    border-left: 18px solid #999;
    position: absolute;
    left: 12px;
    opacity: 0.8;
    top: 7px;
  }

  .button-pause {
    width: 5px;
    height: 20px;
    background: #999;
    opacity: 0.8;
    margin-top: 9px;
    margin-left: 11px;
  }

  .button-pause:before {
    content: '';
    display: block;
    width: 5px;
    height: 20px;
    position: relative;
    background: #999;
    left: 11px;
  }

  .button-voice {
    margin-left: 8px;
    margin-top: 6px;
    width: 0;
    height: 10px;
    border: 8px solid transparent;
    border-right: 10px solid #999;
  }

  .button-voice:before {
    content: '';
    display: block;
    width: 6px;
    height: 10px;
    background: #999;
    position: relative;
    left: -8px;
  }

  .muted {
    opacity: 0.2;
  }

  .button-4 .mode-0{
    margin-top:10px;
    margin-left:11px;
    height:15px;
    width:15px;
    border-radius: 50% 50% 50% 0;
    border:1px solid #bbb;
  }
  .button-1 {
    position: absolute;
    left: 50%;
    top: 1px;
    transform: translateX(-50%);
  }

  .button-2 {
    position: absolute;
    left: 1px;
    top: 1px;
  }

  .button-3 {
    position: absolute;
    right: 1px;
    top: 1px;
  }
  .button-4{
    position: absolute;
    left:50px;
    top:1px;
  }
  .button-5{
    position:absolute;
    right:50px;
    top:1px;
  }
  .volume {
    position: absolute;
    bottom: 0;
    width: 50px;
    overflow: hidden;
  }

  .voice-menu {
    position: absolute;
    right: -25px;
    top: -25px;
    /*background: #000;*/
    overflow: hidden;
    width: 50px;
    height: 90px;
  }

  .voice-menu .menu {
    position: absolute;
    left: -40px;

    border-radius: 50%;
    width: 50px;
    height: 50px;
    border: 20px solid #eee;
    border-left-color: transparent;
  }

  .voice-menu .active {
    bottom: 0;
    border-color: #a5cdff;
    border-left-color: transparent;
  }

  .fade-leave-active {
    transition: none;
  }

  .fade-enter-active {
    transition: all .5s;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
  {
    opacity: 0;
    transform: scale(0.1);
  }

  .normalfade-enter-active, .normalfade-leave-active {
    transition: all .5s;
  }

  .normalfade-enter, .normalfade-leave-to {
    opacity: 0;
  }
</style>
