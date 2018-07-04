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
            <div class="button no-border button-4" @click="changeMode" v-show="functionVisible_4">
              <div v-show="playMode===0" class="mode-0"></div>
              <div v-show="playMode===1" class="mode-1">
                <div></div>
                <div></div>
              </div>
              <div v-show="playMode===2" class="mode-0">&nbsp;1</div>
            </div>
          </transition>

          <!--打开播放列表按钮-->
          <transition name="fade">
            <div class="button no-border button-5" @click="openList" v-show="functionVisible_5">
              <div></div>
            </div>
          </transition>
          <!--音量按钮/菜单-->
          <transition name="normalfade">
            <div class="volume"
                 v-show="menuVisible_0"
                 id="voice-menu"
                 @mouseover="entered"
                 @mouseout="leaved"
                 @mousedown="volumeDown"
                 @mousemove="volumeMove"
                 @mouseup="volumeUp"
            >
            <div class="voice-menu"


            >
              <div class="menu"></div>

                <div class="menu active"
                     :style="`transform:rotate(${(1-volume)*180}deg)`"
                ></div>
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
      <transition name="normalfade">
        <div v-if="menuVisible_2" class="menu-list">
          <transition name="normalfade">
            <div class="menu-list-pointer" v-show="menuVisible_1"></div>
          </transition>
          <div class="button-mini round mini-button-1" @click="selFile">
            <div></div>
          </div>
          <div class="play-list-cover">
            <div class="play-list">
              <div class="item" v-for="(item,index) of playList"
                   :key="item.urn"
                   :id="index"
                   @click="play(false,index)"
                   :style="isActive(index)+'top:'+item.y+'px;'+isDrag(index)"
                   @mousedown="listDragStart"
              >
                {{index+1}}&nbsp;&nbsp;{{item.title}}
                <div class="button-mini round mini-button-2"
                     @click.stop="removeList(index)"
                >
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script>
  import {searchMusic, getLRC} from '../api'
  import vue from 'vue'
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
        player:null,
        fileURI: '',
        lrc: [],
        playList: [
        //   {
        //   index:0,
        //   dis:true,
        //   title:'0001',
        //   y:5,
        // },{
        //   index:1,
        //   dis:true,
        //   title:'0002',
        //   y:40,
        // },{
        //   index:2,
        //   dis:true,
        //   title:'0003',
        //   y:80
        // }
        ],
        playIndex: 0,
        playing: false,
        loaded: false,
        muted: false,

        volume: 0.8,
        volumeTemp: 0.0,
        volumeRemember: 0.8,
        volumeChange: false,

        dragging: false,

        functionVisible_0: false,
        functionVisible_1: false,
        functionVisible_2: false,
        functionVisible_3: false,
        functionVisible_4: false,
        functionVisible_5: false,


        menuVisible_0: false,
        menuVisible_1: true,
        menuVisible_2: false,

        voiceMenu: null,
        mainMenu: null,

        currentPlay: {url: '', urn: ''},
        currentLrc: '',
        playTime: 0,
        totalTime: 0,
        playInfo: null,
        playMode: 0,

        pauseTimer: false,
        volumeTimer: false,
        menuTimer: false,
        menuTimer2: false,
        menuTimer3: false,
        breathTimer: false,
        // listDragTimer: false,

        listDragStartY:false,
        listDragTarget:false,
        listDragDeltaY:false,

        beforeDragUrn:'',
        hasDrag:false,
        dragFin:false,

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
        let failed = [];
        for (const item of file.files) {
          if (item.name.split('.').pop() !== 'mp3') {
            failed.push(
              item.name
            )
          } else {
            const urn = item.urn || item.name;
            this.playList.push({
              url: item,
              urn: urn,
              title: '',
              index:this.playList.length,
              dis:true,
              y:0
            });
            this.setListY();
            this.getTitle(item, urn, this.playList.length - 1);
          }
        }
        if (failed.length > 0) alert(`读取${failed.length}个文件失败：不是mp3格式`);
        if (!this.loaded&&failed.length!==file.files.length) {
          //如果是首次加载
          this.play(true);
        } else {
          //如果已在播放
          //貌似什么都不用管
        }
      },
      setListY(){
        for (const item of this.playList) {
          item.y=item.index*38+5;
        }
      },
      //判断列表是否被拖动
      isDrag(index){
        if(this.dragFin){
          return 'transition:none;';
        }
        if(index===parseInt(this.listDragTarget)){
          return `transition:none;z-index:200;`
        }
      },
      play(isFirst = false,index=null) {
        let flag=false,flag2=false;
        if(this.hasDrag){
          this.resetList();
          this.setListY();
          this.exchangeList();
          let i=0;
          for (const playListElement of this.playList) {
            if(playListElement.urn===this.beforeDragUrn){
              this.playIndex=i;
            }
            i++;
          }
          this.beforeDragUrn=false;
          this.hasDrag=false;
          this.dragFin=true;
          setTimeout(()=>{
            this.dragFin=false;
          },500);
        }else if(typeof index==="number"){
          this.playIndex=index;
          this.currentPlay=this.playList[index];
          flag=true;
        }else if (isFirst) {
          this.currentPlay = this.playList[0];
          flag=true;
        }else if (this.loaded) {
          if (this.playIndex < 0) {
            this.playIndex = this.playList.length + this.playIndex;
          }
          switch (this.playMode) {
            case 0: //顺序模式
              this.playIndex++;
              break;
            case 1: //随机模式
              let ram = this.playIndex;
              for (; ram === this.playIndex; ram = Math.floor(Math.random() * this.playList.length))
                ;
              this.playIndex = ram;
              break;
            case 2: //单曲循环
              break;
          }
          if (this.playIndex >= this.playList.length) {
            this.playIndex = this.playIndex - this.playList.length;
          }
          if(this.currentPlay===this.playList[this.playIndex]) flag2=true;
          this.currentPlay = this.playList[this.playIndex];
          flag=true;
        }
        if(flag2){

          this.player.currentTime = 0;

        }else if(flag){

          const OURL = URL.createObjectURL(this.currentPlay.url);
          this.getRemoteLRC(this.currentPlay.url, this.currentPlay.urn);
          this.readerLoaded(OURL);
          this.player.currentTime = 0;

        }

      },
      resetList(){
        let tempList=[],copyList=[...this.playList];
        let i=0;
        for (const copyListElement of copyList) {
          copyListElement.i=i++;
        }
        const length=this.playList.length;
        for (let i = 0; i < length; i++) {
          let min = 0, minItem = copyList[0].y;
          for (let j = 1; j < copyList.length; j++) {
            if (copyList[j].y < minItem) {
              min = j;
              minItem = copyList[j].y;
            }
          }
          tempList.push(copyList[min].i);
          copyList.splice(min,1);
        }
        i=0;
        for (const item of tempList) {
          this.playList[i++].index=item;
        }
      },
      exchangeList(){
        this.playList.sort((a,b)=>a.index-b.index);

      },
      goFront() {
        if(this.playMode===2) this.playIndex++;
        this.play();
      },
      goBack() {
        if(this.playMode===2) this.playIndex--;
        this.playIndex -= 2;
        this.play();
      },
      changeMode() {
        this.playMode++;
        if (this.playMode > 2)
          this.playMode = 0;
      },
      openList() {
        this.menuVisible_2 = !this.menuVisible_2;
      },
      removeList(index) {
        const beforeDragUrn=this.playList[this.playIndex].urn;
        if (index === this.playIndex) {
          if (this.playList.length === 1) {
            this.unloadFile();
          } else {
            this.playList.splice(index, 1);
            this.resetList();
            this.setListY();
            this.playIndex -= 2;
            this.play();
          }
        } else {
          this.playList.splice(index, 1);
          this.resetList();
          this.setListY();

        }
        let i=0;
        for (const playListElement of this.playList) {
          if(playListElement.urn===beforeDragUrn){
            this.playIndex=i;
          }
          i++;
        }
        this.beforeDragUrn=false;

      },
      listDragStart(e){
        this.listDragTarget=e.target.id;
        this.listDragDeltaY=e.target.offsetTop-e.y;
        this.listDragStartY=e.y;
        this.beforeDragUrn=this.playList[this.playIndex].urn;
        this.hasDrag=false;
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
            if (this.playTime === this.totalTime) {
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
            if(this.listDragTarget){
              this.playList[this.listDragTarget].index=false;
              this.resetList();
              this.setListY();
              this.playList[this.listDragTarget].y=e.y + this.listDragDeltaY;
              if(Math.abs(e.y-this.listDragStartY)>25){
                this.hasDrag=true;
              }
            }
          })
        }, 500);
        setTimeout(() => {
          this.functionVisible_2 = true;
        }, 700);
        setTimeout(() => {
          this.functionVisible_3 = true;
        }, 900);
        setTimeout(() => {
          this.functionVisible_5 = true;
        }, 1100);
        setTimeout(() => {
          this.functionVisible_4 = true;
        }, 1300);
        clearTimeout(this.menuTimer2);
        this.menuTimer2 = setTimeout(() => {
          this.menuVisible_1 = false;
          this.menuTimer2 = false;
        }, 3000)


      },
      //
      getRemoteLRC(url = this.currentPlay.url, urn = this.currentPlay.urn) {
        this.lrc = [];
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
      getTitle(url, urn, index) {
        ID3.loadTags(urn, () => {
          const playInfo = ID3.getAllTags(urn);
          this.playList[index].title = playInfo.title;
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
        clearTimeout(this.menuTimer3);
        this.loaded = false;

        this.fileURI = '';
        this.lrc = [];
        this.playList = [];
        this.playIndex = 0;
        this.playing = false;

        this.muted = false;
        this.player.muted = false;

        this.volume=0.8;
        this.volumeTemp = 0.0;
        this.volumeRemember=0.8;
        this.volumeChange = false;

        this.dragging = false;

        this.functionVisible_0 = false;
        this.functionVisible_1 = false;
        this.functionVisible_2 = false;
        this.functionVisible_3 = false;
        this.functionVisible_4 = false;
        this.functionVisible_5 = false;

        this.menuVisible_0 = false;
        this.menuVisible_1 = true;
        this.menuVisible_2 = false;

        // this.voiceMenu=null;
        // this.mainMenu=null;

        this.currentPlay = {url: '', urn: ''};
        this.currentLrc = '';
        // this.playTime = 0;
        // this.totalTime = 0;
        this.playInfo = null;
        // this.playMode=0;

        this.pauseTimer = false;
        this.volumeTimer = false;
        this.menuTimer = false;
        this.menuTimer2 = false;
        this.menuTimer3 = false;
        this.breathTimer = false;

        this.listDragStartY=false;
        this.listDragTarget=false;
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
        if(this.loaded){
          this.playTime = (x - this.mainMenu.left) / this.mainMenu.width * this.totalTime;
          this.player.currentTime = this.playTime;
        }

      },
      //设定开始按钮呼吸
      setBreath() {
        this.breathTimer = setInterval(() => {
          this.radio += 0.2;
          this.shadowOp = (Math.sin(this.radio) + 0.5) * 6;
        }, 100);
      },
      isActive(index){
        const temp=(index === this.playIndex ? 'border:1px solid #000;' : 'border:1px solid transparent;');
        return temp;
      },
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
        this.listDragTarget=false;
        this.listDragStartY=false;
      });
      window.onresize=()=>{
        const menuRect = document.getElementById('mini-cover').getBoundingClientRect();
        this.mainMenu = {
          left: menuRect.left,
          width: menuRect.width,
          right: menuRect.right,
          top: menuRect.top,
          height: menuRect.height,
          bottom: menuRect.bottom,
        };
      };
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

  .menu-list {
    width: 170px;
    height: 200px;
    border-radius: 10px;
    box-shadow: 0 0 8px #aaa;
    position: absolute;
    background: #fff;
    right: 0;
    bottom: 50px;
  }

  .menu-list-pointer {
    width: 20px;
    height: 20px;
    transform: rotate(45deg);
    background: #fff;
    content: '';
    display: block;
    box-shadow: 2px 2px 2px #ddd;
    position: relative;
    top: 190px;
    left: 92px;
  }

  .play-list-cover {
    width: 170px;
    height: 200px;
    border-radius: 10px;
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
  }

  .play-list {
    overflow-y: scroll;
    overflow-x: hidden;
    width: 190px;
    height: 195px;
    position: absolute;
    left: 0;
    top: 2px;
  }

  .play-list .item {
    color: #555;
    font-size: 12px;
    line-height: 30px;
    padding-left: 10px;
    width: 150px;
    height: 30px;
    border-radius: 5px;
    box-shadow: 0 0 6px #e7e7e7;
    transition: all 0.2s;
    cursor: pointer;
    position:absolute;
    left:4px;
    text-overflow:ellipsis;
    white-space:nowrap;
    overflow: hidden;
  }

  .play-list .item:hover {
    color: white;
    background: #64758e;
  }

  .mini-cover {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: #fcfcfc;
    box-shadow: 0 0 4px #bbb;
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

  .light {
    box-shadow: 0 0 4px #eee;
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

  .button-4 .mode-0 {
    margin-top: 11px;
    margin-left: 11px;
    height: 12px;
    width: 12px;
    border-radius: 50% 50% 50% 0;
    border: 2px solid #C8C8C8;
    color: #C8C8C8;
    font-weight: 800;
    font-size: 10px;
    line-height: 0px;
  }

  .button-4 .mode-0:before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    border: 5px solid transparent;
    border-right-color: #C8C8C8;
    position: relative;
    left: -6px;
    top: 8px;

  }

  .button-4 .mode-1 div {
    position: absolute;
    top: 9px;
    left: 10px;
    width: 12px;
    height: 8px;
    border: 2px solid #C8C8C8;
    border-radius: 0 0 0 100%;
    border-top: none;
    border-right: none;
    transform: rotate(-25deg);
  }

  .button-4 .mode-1 div:before {
    content: '';
    display: block;
    position: relative;
    width: 0;
    height: 0;
    border: 4px solid transparent;
    border-left-color: #C8C8C8;
    left: 12px;
    top: 5px;
  }

  .button-4 .mode-1 div:nth-child(1) {
    transform: scaleY(-1) translateY(-12px) rotate(-25deg);
  }

  .button-5 div {
    width: 15px;
    height: 2px;
    background: #C8C8C8;
    margin-top: 18px;
    margin-left: 12px;
  }

  .button-5 div:before {
    content: '';
    display: block;
    width: 15px;
    height: 2px;
    background: #C8C8C8;
    position: relative;
    top: -5px;
  }

  .button-5 div:after {
    content: '';
    display: block;
    width: 15px;
    height: 2px;
    background: #C8C8C8;
    position: relative;
    top: 3px;
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

  .button-4 {
    position: absolute;
    left: 50px;
    top: 1px;
  }

  .button-5 {
    position: absolute;
    right: 50px;
    top: 1px;
  }

  .mini-button-1 {
    z-index: 100;
    position: absolute;
    top: -10px;
    left: -12px;
    transition: all 0.5s ease;
    transform: rotate(0deg);
  }

  .mini-button-1 div {
    width: 12px;
    height: 4px;
    border-radius: 10px;
    margin-top: 12px;
    margin-left: 8px;
    background: #ddd;
  }

  .mini-button-1:hover {
    transform: rotate(360deg);
  }

  .mini-button-1 div:before {
    width: 4px;
    height: 12px;
    border-radius: 10px;
    content: '';
    display: block;
    background: #ddd;
    position: relative;
    top: -4px;
    left: 4px;
  }

  .mini-button-2 {
    position: relative;
    left: 120px;
    top: -29px;
  }

  .mini-button-2 div {
    width: 12px;
    height: 4px;
    border-radius: 10px;
    position: relative;
    top: 12px;
    left: 8px;
    background: #ddd;
  }

  .mini-button-2:hover {
    transform: rotate(360deg);
  }

  .volume {
    position: absolute;
    right: -30px;
    top: -50px;
    width: 50px;
    height:120px;
    /*background: #000;*/

    overflow: hidden;
  }

  .voice-menu {
    position: absolute;
    /*right: 0px;*/
    top: 0px;
    /*background: #000;*/
    /*overflow: hidden;*/
    width: 50px;
    height: 90px;
    transform:rotate(-45deg);
  }

  .voice-menu .menu {
    position: absolute;
    left: -56px;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    border: 20px solid #eee;
    border-left-color: transparent;
    border-top-color: transparent;
  }

  .voice-menu .active {
    bottom: 0;
    border-color: #a5cdff;
    border-left-color: transparent;
    border-top-color: transparent;
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
