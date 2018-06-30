<!--作者：陈宗豪     -->
<!--日期：2018-6-29 -->
<!--任务：音乐播放器 -->
<template>
  <div>
    <!--用于选择文件-->
    <input type="file" id="fileSelector" style="display:none" @change="loadFile">
    <!--用于播放音频-->
    <audio :src="fileURI" id='player' loop></audio>
    <!--先制作小型播放器-->
    <div class="mini-container">
      <div class="mini-cover" :style="`height:${heightOp}px;width:${widthOp}px`">
        <div class="progress" :style="'width:'+progress*widthOp+'px;'"></div>
      </div>
      <div class="button round button-1" @click="selFile" v-if="!loaded">
        <div class="button-file"></div>
      </div>
      <transition name="fade">
        <div class="button-mini round disabled back" v-show="functionVisible_0">
          <div></div>
        </div>
      </transition>
      <transition name="fade">
        <div class="button-mini round disabled front" v-show="functionVisible_1">
          <div></div>
        </div>
      </transition>
      <div class="button round button-1" @click="switchPlay" v-if="loaded">
        <transition name="fade">
          <div class="button-play" v-show="!playing"></div>
        </transition>
        <transition name="fade">
          <div class="button-pause" v-show="playing"></div>
        </transition>
      </div>
      <transition name="fade">
        <div class="button no-border button-2" @click="unloadFile" v-show="functionVisible_2">
          <div class="button-unload"></div>
        </div>
      </transition>
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
  </div>
</template>

<script>
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
        fileURI:'',
        playing: false,
        loaded: false,
        muted: false,

        volume:0.8,
        volumeTemp:0.0,
        volumeRemember:0.8,
        volumeChange:false,

        functionVisible_0: false,
        functionVisible_1: false,
        functionVisible_2: false,
        functionVisible_3: false,
        menuVisible_0: false,

        voiceMenu:null,

        playTime:0,
        totalTime:0,

        pauseTimer:null,
        volumeTimer:null,
      }
    },
    methods: {
      selFile() {
        const item=document.getElementById('fileSelector');
        item.click();
      },
      loadFile(){
        const file=document.getElementById('fileSelector');
        const url=file.files[0];
        if(url.name.split('.').pop()!=='mp3'){
          alert('请选择正确MP3格式文件');
        }else{
          const reader=new FileReader();
          reader.onload=()=>{
            this.fileURI=reader.result;
            this.player.oncanplay=()=>{
              this.player.play();
              this.totalTime=this.player.duration;
              this.playing = true;
              this.player.ontimeupdate=()=>{
                this.playTime=this.player.currentTime;
                if(!this.muted) this.player.volume=this.volumeTemp;
                if(this.volumeTemp!==this.volume){
                  this.volumeTemp+=(this.volume-this.volumeTemp)/3;
                }
              }
            };
            this.loaded = true;
            setTimeout(() => {
              this.functionVisible_0 = true;
            }, 300);
            setTimeout(() => {
              this.functionVisible_1 = true;
            }, 500);
            setTimeout(() => {
              this.functionVisible_2 = true;
            }, 700);
            setTimeout(() => {
              this.functionVisible_3 = true;
            }, 900);
          };
          reader.readAsDataURL(url);
        }
      },
      unloadFile() {
        clearTimeout(this.pauseTimer);
        clearTimeout(this.volumeTimer);
        this.playing = false;
        this.fileURI = '';
        this.functionVisible_0 = false;
        this.functionVisible_1 = false;
        this.functionVisible_2 = false;
        this.functionVisible_3 = false;
        this.volume=0.8;
        this.volumeTemp=0.0;
        this.volumeRemember=0.8;
        this.loaded = false;
        document.getElementById('fileSelector').value='';
      },
      switchPlay() {
        if(this.playing) {
          this.volumeRemember=this.volume;
          this.volume=0;
          this.pauseTimer=setTimeout(()=>{
            this.player.pause();
          },1200)
        }else{
          clearTimeout(this.pauseTimer);
          this.volume=this.volumeRemember;
          this.player.play();
        }
        this.playing = !this.playing;
      },
      entered() {
        clearTimeout(this.volumeTimer);
        if (!this.menuVisible_0)
          this.menuVisible_0 = true;
      },
      leaved(e) {
        if(this.volumeChange){
          this.changeVolume(e.y);
        }
        if (this.menuVisible_0)
          this.volumeTimer=setTimeout(
            ()=>{
              this.menuVisible_0 = false;
              this.volumeChange=false;
            },1000
          );
      },
      mute() {
        this.muted = !this.muted;
        this.player.muted=this.muted;
      },
      volumeDown(e){
        this.volumeChange=true;
        const menuRect=document.getElementById('voice-menu').getBoundingClientRect();
        this.voiceMenu={
          top:menuRect.top,
          height:menuRect.height,
          bottom:menuRect.bottom
        };
        // console.log(this.voiceMenu);
        this.changeVolume(e.y);
      },
      volumeMove(e){
        if(this.volumeChange){
          this.changeVolume(e.y);
        }

      },
      volumeUp(e){
        this.volumeChange=false;
        if(this.volumeChange){
          this.changeVolume(e.y);
        }
      },
      changeVolume(y){
        if(y>=this.voiceMenu.top&&y<=this.voiceMenu.bottom){
          this.volume=(this.voiceMenu.bottom-y)/this.voiceMenu.height;
        }else if(y>this.voiceMenu.bottom){
          this.volume=0
        }else {
          this.volume=1
        }

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
      progress(){
        return this.playTime/(this.totalTime+0.001);
      }
    },
    mounted(){
      this.player=document.getElementById('player');
      this.player.volume=0.1;
      window.addEventListener('mouseup',(e)=>{
        if(this.volumeChange){
          this.volumeChange=false;
          this.changeVolume(e.y);
        }
      })
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

  .progress{
    position: absolute;
    left:0;
    height:40px;
    background: #85ea47;
    transition: all 0.5s;
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
  }

  .button-mini:hover {
    /*background: #263550;*/
    /*box-shadow: inset 0 0 0 #ddd, 0 0 3px #eee;*/
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
    border-right: 10px solid #eee;
    margin-top: 6px;
  }

  .front div {
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-left: 10px solid #eee;
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
  .volume{
    position: absolute;
    bottom:0;
    width:50px;
    overflow: hidden;
  }
  .voice-menu {
    position: absolute;
    right: -25px;
    top: -25px;
    /*background: #000;*/
    overflow: hidden;
    width: 50px;
    height:90px;
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

  .voice-menu .active{
    bottom:0;
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
